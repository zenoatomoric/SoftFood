import { createClient } from '@supabase/supabase-js'

export function createAdminClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
        console.error('❌ Missing Supabase Admin Environment Variables', { url: !!supabaseUrl, key: !!supabaseKey })
        throw new Error('Missing Supabase Admin Environment Variables')
    }

    console.log(`[Supabase Admin] Initializing with URL: ${supabaseUrl}`)

    return createClient(supabaseUrl, supabaseKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    })
}
