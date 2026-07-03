import { createClient } from '@supabase/supabase-js';

// This client uses the SERVICE ROLE key and must NEVER be imported
// into client-side ("use client") components — server-side API routes only.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
