import * as https from 'https';
import { getSupabaseAdminClient } from './supabase';
import type { UploadReturnType } from '../types';

type UploadImageInput = {
    originalImgLink?: string;
    imageBuffer?: Buffer;
    userId: string | undefined;
    location: string;
};

let storageUploadsDisabled = false;
let loggedStorageDisabled = false;

const isLikelyNetworkStorageError = (error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    return (
        message.includes('fetch failed') ||
        message.includes('ENOTFOUND') ||
        message.includes('ECONNREFUSED') ||
        message.includes('ETIMEDOUT') ||
        message.includes('EAI_AGAIN')
    );
};

const getStorageBucket = () => {
    const bucket = process.env.SUPABASE_STORAGE_BUCKET;
    if (!bucket) throw new Error('Missing SUPABASE_STORAGE_BUCKET');
    return bucket;
};

const getPublicObjectUrl = (path: string) => {
    const base = process.env.SUPABASE_URL;
    if (!base) throw new Error('Missing SUPABASE_URL');
    const bucket = getStorageBucket();
    return `${base.replace(/\/$/, '')}/storage/v1/object/public/${bucket}/${path}`;
};

const downloadToBuffer = (url: string): Promise<Buffer> =>
    new Promise((resolve, reject) => {
        const request = https.request(url, (response) => {
            const chunks: Buffer[] = [];
            response.on('data', (chunk: Buffer) => {
                chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
            });
            response.on('end', () => resolve(Buffer.concat(chunks)));
        });
        request.on('error', (err: unknown) => reject(err));
        request.end();
    });

const uploadBytes = async (path: string, bytes: Buffer, contentType: string) => {
    const supabase = getSupabaseAdminClient();
    const bucket = getStorageBucket();
    const { error } = await supabase.storage.from(bucket).upload(path, bytes, {
        contentType,
        cacheControl: '2592000',
        upsert: true,
    });
    if (error) throw error;
    return getPublicObjectUrl(path);
};

const uploadImageToStorage = async (input: UploadImageInput): Promise<UploadReturnType> => {
    try {
        if (storageUploadsDisabled) return { location: input.location, uploaded: false };
        if (!input.originalImgLink) throw new Error('Image link is undefined');
        const bytes = await downloadToBuffer(input.originalImgLink);
        await uploadBytes(`images/${input.location}.png`, bytes, 'image/png');
        return { location: input.location, uploaded: true };
    } catch (error) {
        if (isLikelyNetworkStorageError(error)) {
            storageUploadsDisabled = true;
            if (!loggedStorageDisabled) {
                loggedStorageDisabled = true;
                console.warn('Supabase Storage upload unavailable (network). Skipping further uploads.');
            }
            return { location: input.location, uploaded: false };
        }
        console.error(`Error uploading image. ${input.originalImgLink?.slice(0, 50)}... - ${error}`);
        return { location: input.location, uploaded: false };
    }
};

export const uploadImageBufferToStorage = async ({
    imageBuffer,
    location,
}: {
    imageBuffer: Buffer;
    userId: string | undefined;
    location: string;
}): Promise<UploadReturnType> => {
    try {
        if (storageUploadsDisabled) return { location, uploaded: false };
        await uploadBytes(`images/${location}.png`, imageBuffer, 'image/png');
        return { location, uploaded: true };
    } catch (error) {
        if (isLikelyNetworkStorageError(error)) {
            storageUploadsDisabled = true;
            if (!loggedStorageDisabled) {
                loggedStorageDisabled = true;
                console.warn('Supabase Storage upload unavailable (network). Skipping further uploads.');
            }
            return { location, uploaded: false };
        }
        console.error(`Error uploading image buffer. ${location} - ${error}`);
        return { location, uploaded: false };
    }
};

export const uploadImagesToStorage = async (
    openaiImagesArray: UploadImageInput[],
): Promise<UploadReturnType[] | null> => {
    try {
        const imagePromises: Promise<UploadReturnType>[] = openaiImagesArray.map((img) => {
            if (img.imageBuffer) {
                return uploadImageBufferToStorage({
                    imageBuffer: img.imageBuffer,
                    userId: img.userId,
                    location: img.location,
                });
            }
            return uploadImageToStorage(img);
        });
        return await Promise.all(imagePromises);
    } catch (error) {
        console.error(error);
        return null;
    }
};

export const getImagePublicUrl = (location: string) =>
    getPublicObjectUrl(`images/${location}.png`);

export const uploadAudioToStorage = async ({
    audioBuffer,
    fileName,
}: {
    audioBuffer: Buffer;
    fileName: string;
}): Promise<string> => {
    try {
        return await uploadBytes(`audio/${fileName}`, audioBuffer, 'audio/mpeg');
    } catch (error) {
        console.error(`Error uploading audio to Supabase Storage. File: ${fileName} - ${error}`);
        throw new Error(`Failed to upload audio to Storage: ${error}`);
    }
};
