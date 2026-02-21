
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js'

async function checkUsers() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
        console.error('❌ Missing environment variables')
        console.error('Check .env.local for NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
        return
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    console.log('🔍 Checking users table...')

    const { data: users, error } = await supabase
        .from('users')
        .select('*')

    if (error) {
        console.error('❌ Error fetching users:', error.message)
        return
    }

    console.log(`📊 Found ${users.length} users`)

    const svCodes = new Set()
    const duplicates = []

    for (const user of users) {
        // Check duplicates
        if (svCodes.has(user.sv_code)) {
            duplicates.push(user.sv_code)
        }
        svCodes.add(user.sv_code)

        // Check password
        const isHashed = user.password_hash?.startsWith('$2a$') || user.password_hash?.startsWith('$2b$')
        const status = isHashed ? '🔑 Hashed' : (user.password_hash ? '📝 Plain' : '❌ Missing')

        console.log(`User: ${user.sv_code} (${user.role || 'no-role'}) - ${status}`)
    }

    if (duplicates.length > 0) {
        console.error('\n❌ Found DUPLICATE sv_code:', duplicates)
        console.error('   This will cause login to fail because .single() expects one row!')
    } else {
        console.log('\n✅ No duplicate sv_code found')
    }
}

checkUsers()
