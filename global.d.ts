import { MongoClient } from 'mongodb';
import type { SupabaseClient } from '@supabase/supabase-js';

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
  var _supabaseAdminClient: SupabaseClient | undefined;
}

export {};

declare module '*.gif' {
  const src: string;
  export default src;
}
