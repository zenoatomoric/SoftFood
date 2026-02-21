
import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
    try {
        const supabase = await createClient()

        console.log('🔍 Checking users via API...')

        const { data: users, error } = await supabase
            .from('users')
            .select('*')

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        const report = users.map(user => {
            const isHashed = user.password_hash?.startsWith('$2a$') || user.password_hash?.startsWith('$2b$')
            return {
                sv_code: user.sv_code,
                role: user.role,
                password_status: isHashed ? '🔑 Hashed' : (user.password_hash ? '📝 Plain' : '❌ Missing'),
                password_preview: user.password_hash ? (isHashed ? user.password_hash.substring(0, 10) + '...' : user.password_hash) : null
            }
        })

        // Check for duplicate sv_code
        const svCodes = users.map(u => u.sv_code)
        const duplicates = svCodes.filter((item, index) => svCodes.indexOf(item) !== index)

        return NextResponse.json({
            count: users.length,
            duplicates: duplicates.length > 0 ? duplicates : 'None',
            users: report
        })
    } catch (err) {
        return NextResponse.json({ error: String(err) }, { status: 500 })
    }
}
