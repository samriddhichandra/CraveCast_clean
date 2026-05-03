import type { NextApiRequest, NextApiResponse } from 'next';
import mongoose from 'mongoose';
import { generateImages, generateRecipeTags } from '../../lib/openai';
import { getImagePublicUrl, uploadImagesToStorage } from '../../lib/storage';
import { apiMiddleware } from '../../lib/apiMiddleware';
import { connectDB } from '../../lib/mongodb';
import recipe from '../../models/recipe';
import { Recipe, UploadReturnType, ExtendedRecipe } from '../../types';

const getFallbackFoodImage = (recipeName: string) => {
    const query = encodeURIComponent(recipeName || 'food recipe');

    // Stable Unsplash image endpoint. Looks much better than /logo.svg.
    return `https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=900&h=650&fit=crop&auto=format&q=80&fm=jpg&recipe=${query}`;
};

const getImageLink = (
    uploadResults: UploadReturnType[] | null,
    location: string,
    recipeName: string,
    directImgLink?: string
) => {
    if (directImgLink) return directImgLink;

    if (!uploadResults || !location) {
        return getFallbackFoodImage(recipeName);
    }

    const filteredResult = uploadResults.filter((result) => result.location === location);

    if (filteredResult[0]?.uploaded) {
        return getImagePublicUrl(location);
    }

    return getFallbackFoodImage(recipeName);
};
const getSafeQuantity = (quantity: unknown) => {
    if (quantity === null || quantity === undefined) {
        return 'as needed';
    }

    if (typeof quantity === 'string' && quantity.trim() === '') {
        return 'as needed';
    }

    return String(quantity);
};

const normalizeIngredients = (ingredients: any[]) => {
    if (!Array.isArray(ingredients)) return [];

    return ingredients.map((ingredient) => {
        const ingredientObj =
            ingredient && typeof ingredient === 'object'
                ? ingredient
                : {
                      name: String(ingredient || 'Ingredient'),
                      quantity: 'as needed',
                  };

        return {
            ...ingredientObj,
            name: ingredientObj?.name || 'Ingredient',
            quantity: getSafeQuantity(ingredientObj?.quantity),
        };
    });
};

const handler = async (req: NextApiRequest, res: NextApiResponse, session: any) => {
    try {
        const { recipes } = req.body;

        if (!Array.isArray(recipes) || recipes.length === 0) {
            return res.status(400).json({
                error: 'No recipes provided',
            });
        }

        const normalizedRecipes = recipes.map((r: Recipe) => ({
            ...r,
            ingredients: normalizeIngredients((r as any).ingredients),
        }));

        let uploadResults: UploadReturnType[] | null = null;
        const promptIdToDirectImgLink = new Map<string, string>();

        try {
            console.info('Getting images from OpenAI...');

            const imageResults = await generateImages(normalizedRecipes, session.user.id);

            imageResults.forEach((result, idx) => {
                const promptId = normalizedRecipes[idx]?.openaiPromptId;
                const imgLink = typeof result.imgLink === 'string' ? result.imgLink : '';
                const isBase64DataUri = imgLink.startsWith('data:image/png;base64,');
                if (promptId && imgLink.trim() && !isBase64DataUri) {
                    // If OpenAI image generation falls back to a public URL (e.g. Unsplash),
                    // save that URL directly instead of re-downloading/re-uploading to Storage.
                    promptIdToDirectImgLink.set(promptId, imgLink);
                }
            });

            const openaiImagesArray = imageResults.map((result, idx) => {
                const dataUriPrefix = 'data:image/png;base64,';
                const isBase64DataUri = result.imgLink?.startsWith(dataUriPrefix);
                const b64Data = isBase64DataUri ? result.imgLink.slice(dataUriPrefix.length) : '';

                return {
                    originalImgLink: isBase64DataUri ? undefined : result.imgLink,
                    imageBuffer: isBase64DataUri ? Buffer.from(b64Data, 'base64') : undefined,
                    userId: session.user.id,
                    location: normalizedRecipes[idx].openaiPromptId,
                };
            });

            const imagesToUpload = openaiImagesArray.filter((img) => Boolean(img.imageBuffer));
            const needsUpload = imagesToUpload.length > 0;
            if (needsUpload) {
                console.info('Uploading recipe images to Storage...');
                uploadResults = await uploadImagesToStorage(imagesToUpload);
            } else {
                uploadResults = null;
            }
        } catch (imageError) {
            console.warn('Image generation/upload failed. Saving recipes with fallback food images.');
            console.warn(imageError);

            uploadResults = null;
        }

        const updatedRecipes = normalizedRecipes.map((r: Recipe) => {
            const openaiPromptId = (r as any).openaiPromptId || 'fallback-prompt-id';

            return {
                ...r,
                ingredients: normalizeIngredients((r as any).ingredients),
                owner: new mongoose.Types.ObjectId(session.user.id),
                imgLink: getImageLink(
                    uploadResults,
                    openaiPromptId,
                    (r as any).name,
                    promptIdToDirectImgLink.get(openaiPromptId),
                ),
                openaiPromptId: openaiPromptId.split('-')[0],
            };
        });

        console.log(
            'RECIPES BEFORE SAVE:',
            JSON.stringify(
                updatedRecipes.map((r: any) => ({
                    name: r.name,
                    imgLink: r.imgLink,
                    ingredients: r.ingredients,
                })),
                null,
                2
            )
        );

        await connectDB();

        const savedRecipes = await recipe.insertMany(updatedRecipes);

        console.info(`Successfully saved ${savedRecipes.length} recipes to MongoDB`);

        savedRecipes.forEach((r) => {
            generateRecipeTags(r as unknown as ExtendedRecipe, session.user.id).catch((error) =>
                console.warn(`Skipping tags for recipe ${r.name}:`, error?.message || error)
            );
        });

        return res.status(200).json({
            status: 'Saved recipes successfully',
            count: savedRecipes.length,
        });
    } catch (error) {
        console.error('Failed to save recipes:', error);

        return res.status(500).json({
            error: 'Failed to save recipes',
        });
    }
};

export default apiMiddleware(['POST'], handler);
