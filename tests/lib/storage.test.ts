/**
 * @jest-environment node
 */
import nock from 'nock';
import { uploadImagesToStorage, uploadAudioToStorage, uploadImageBufferToStorage, getImagePublicUrl } from '../../src/lib/storage';

const uploadMock = jest.fn();
jest.mock('@supabase/supabase-js', () => ({
    createClient: () => ({
        storage: {
            from: () => ({
                upload: uploadMock,
            }),
        },
    }),
}));

describe('Supabase Storage uploads', () => {
    beforeEach(() => {
        uploadMock.mockReset();
        uploadMock.mockResolvedValue({ data: {}, error: null });
        process.env = {
            ...process.env,
            SUPABASE_URL: 'https://example.supabase.co',
            SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
            SUPABASE_STORAGE_BUCKET: 'public-bucket',
        };
    });

    afterEach(() => {
        nock.cleanAll();
    });

    it('builds a public image URL', () => {
        expect(getImagePublicUrl('location-1')).toBe(
            'https://example.supabase.co/storage/v1/object/public/public-bucket/images/location-1.png',
        );
    });

    it('uploads images from URLs', async () => {
        nock('https://openai-img-link-1').get('/').reply(200, 'Processed Image data 1');
        nock('https://openai-img-link-2').get('/').reply(200, 'Processed Image data 2');

        const ans = await uploadImagesToStorage([
            { originalImgLink: 'https://openai-img-link-1/', userId: 'mockUserId', location: 'location-1' },
            { originalImgLink: 'https://openai-img-link-2/', userId: 'mockUserId', location: 'location-2' },
        ]);

        expect(uploadMock).toHaveBeenCalledTimes(2);
        expect(uploadMock).toHaveBeenNthCalledWith(
            1,
            'images/location-1.png',
            Buffer.from('Processed Image data 1'),
            expect.objectContaining({ contentType: 'image/png', upsert: true, cacheControl: '2592000' }),
        );
        expect(uploadMock).toHaveBeenNthCalledWith(
            2,
            'images/location-2.png',
            Buffer.from('Processed Image data 2'),
            expect.objectContaining({ contentType: 'image/png', upsert: true, cacheControl: '2592000' }),
        );

        expect(ans).toEqual([
            { location: 'location-1', uploaded: true },
            { location: 'location-2', uploaded: true },
        ]);
    });

    it('uploads an image buffer', async () => {
        const result = await uploadImageBufferToStorage({
            imageBuffer: Buffer.from('buffer-image-data'),
            userId: 'mockUserId',
            location: 'buffer-location-1',
        });

        expect(uploadMock).toHaveBeenCalledWith(
            'images/buffer-location-1.png',
            Buffer.from('buffer-image-data'),
            expect.objectContaining({ contentType: 'image/png', upsert: true, cacheControl: '2592000' }),
        );
        expect(result).toEqual({ location: 'buffer-location-1', uploaded: true });
    });

    it('returns uploaded:false when image link missing', async () => {
        const result = await uploadImagesToStorage([
            { originalImgLink: '', userId: 'mockUserId', location: 'location-1' },
        ]);

        expect(result).toEqual([{ location: 'location-1', uploaded: false }]);
    });

    it('uploads audio and returns a public URL', async () => {
        const url = await uploadAudioToStorage({
            audioBuffer: Buffer.from('mock buffer'),
            fileName: 'audio-key.mp3',
        });

        expect(uploadMock).toHaveBeenCalledWith(
            'audio/audio-key.mp3',
            Buffer.from('mock buffer'),
            expect.objectContaining({ contentType: 'audio/mpeg', upsert: true, cacheControl: '2592000' }),
        );
        expect(url).toBe(
            'https://example.supabase.co/storage/v1/object/public/public-bucket/audio/audio-key.mp3',
        );
    });
});

