import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const getSupabaseUrl = () => {
    const url = process.env.SUPABASE_URL;
    if (!url) throw new Error('Missing SUPABASE_URL');
    return url;
};

const getSupabaseServiceRoleKey = () => {
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!key) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');
    return key;
};

export const getSupabaseAdminClient = (): SupabaseClient => {
    const url = getSupabaseUrl();
    const key = getSupabaseServiceRoleKey();

    if (process.env.NODE_ENV === 'development') {
        if (!global._supabaseAdminClient) {
            global._supabaseAdminClient = createClient(url, key, {
                auth: { persistSession: false, autoRefreshToken: false },
            });
        }
        return global._supabaseAdminClient;
    }

    return createClient(url, key, {
        auth: { persistSession: false, autoRefreshToken: false },
    });
};

