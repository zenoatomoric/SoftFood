import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    try {
        const supabase = await createClient()
        const body = await request.json()
        const { ref_menu_id, steps } = body

        if (!ref_menu_id || !steps || !Array.isArray(steps)) {
            return NextResponse.json({ error: 'Missing ref_menu_id or steps array' }, { status: 400 })
        }

        // Delete existing steps for this menu first (replace strategy)
        await supabase.from('menu_steps').delete().eq('ref_menu_id', ref_menu_id)

        // Insert all steps
        const rows = steps.map((s: any) => ({
            ref_menu_id,
            step_type: s.step_type,
            step_order: s.step_order,
            instruction: s.instruction,
        }))

        const { data, error } = await supabase
            .from('menu_steps')
            .insert(rows)
            .select()

        if (error) {
            console.error('Error saving steps:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true, data }, { status: 201 })
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const menuId = searchParams.get('menu_id')

        if (!menuId) {
            return NextResponse.json({ error: 'Missing menu_id' }, { status: 400 })
        }

        const supabase = await createClient()
        const { data, error } = await supabase
            .from('menu_steps')
            .select('*')
            .eq('ref_menu_id', menuId)
            .order('step_order', { ascending: true })

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json({ data }, { status: 200 })
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
