import React from 'react'
import Image from "next/image"
import { Button } from '@headlessui/react'
import { HandThumbUpIcon } from '@heroicons/react/24/outline'
import { HandThumbUpIcon as HandThumbUpSolid, ArrowRightCircleIcon, SparklesIcon } from '@heroicons/react/24/solid'
import { call_api } from "../../utils/utils";
import { ExtendedRecipe } from '../../types';


interface FrontDisplayProps {
    recipe: ExtendedRecipe
    showRecipe: (recipe: ExtendedRecipe) => void
    updateRecipeList: (recipe: ExtendedRecipe) => void
}

const getThumbsup = ({ liked, owns }: { liked: boolean, owns: boolean }) => {
    if (owns) {
        return <HandThumbUpSolid className="block h-6 w-6 text-gray-500" />
    }
    if (liked) {
        return <HandThumbUpSolid className="block h-6 w-6 text-brand-500" />
    }
    return <HandThumbUpIcon className="block h-6 w-6 text-brand-500" />
}


const FrontDisplay = React.forwardRef<HTMLDivElement, FrontDisplayProps>(
    ({ recipe, showRecipe, updateRecipeList }, ref) => {

    const handleRecipeLike = async (recipeId: string) => {
        try {
            const result = await call_api({ address: '/api/like-recipe', method: 'put', payload: { recipeId } })
            updateRecipeList(result);
        } catch (error) {
            console.log(error)
        }
    }

    return (
        <div
            ref={ref}
            className={[
                'group relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm',
                'transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-emerald-100/40',
                'focus-within:ring-2 focus-within:ring-emerald-400 focus-within:ring-offset-2',
                'flex flex-col h-full animate-fadeInUp',
            ].join(' ')}
        >
            <div className="relative h-44 w-full bg-gradient-to-br from-brand-100 to-orange-50">
                {recipe.imgLink ? (
                    <Image
                        src={recipe.imgLink}
                        fill
                        alt={recipe.name}
                        style={{ objectFit: 'cover' }}
                        className="transition duration-300 group-hover:scale-[1.03]"
                        priority
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-brand-800">
                        <SparklesIcon className="h-8 w-8 opacity-80" />
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-black/0 to-black/0" />
                <div className="absolute left-3 top-3 flex flex-wrap gap-2">
                    {recipe.dietaryPreference.slice(0, 2).map((preference) => (
                        <span
                            key={preference}
                            className="rounded-full bg-white/80 px-2.5 py-1 text-[11px] font-bold text-slate-800 shadow-sm backdrop-blur"
                        >
                            {preference}
                        </span>
                    ))}
                </div>
            </div>

            <div className="flex flex-1 flex-col p-4">
                <h3 className="text-base font-extrabold tracking-tight text-slate-900">
                    {recipe.name}
                </h3>
                <p className="mt-1 text-xs leading-5 text-slate-600">
                    {recipe.additionalInformation?.nutritionalInformation || 'A delicious recipe worth craving.'}
                </p>

                <div className="mt-4 flex items-center justify-between gap-3">
                    <Button
                        className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2"
                        onClick={() => showRecipe(recipe)}
                    >
                        See Recipe
                        <ArrowRightCircleIcon className="ml-2 h-5 w-5" />
                    </Button>

                    <Button
                        className={[
                            'inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800',
                            'hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2',
                            'disabled:cursor-not-allowed disabled:opacity-60',
                        ].join(' ')}
                        onClick={() => handleRecipeLike(recipe._id)}
                        disabled={recipe.owns}
                        data-testid="like_button"
                        aria-label="Like recipe"
                    >
                        {getThumbsup(recipe)}
                        <span className="tabular-nums">{recipe.likedBy.length}</span>
                    </Button>
                </div>
            </div>
        </div>

    )
    }
)
FrontDisplay.displayName = 'FrontDisplay'

export default FrontDisplay
