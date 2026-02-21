import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
    try {
        const supabase = await createClient()

        // Try to select from 'informants'
        const { data, error } = await supabase
            .from('informants')
            .select('*')
            .limit(1)

        if (error) {
            return NextResponse.json({ exists: false, error: error.message }, { status: 200 })
        }

        return NextResponse.json({ exists: true, count: data.length }, { status: 200 })
    } catch (err) {
        return NextResponse.json({ error: String(err) }, { status: 500 })
    }
}
