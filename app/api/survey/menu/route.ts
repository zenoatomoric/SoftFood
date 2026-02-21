import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { auth } from '@/auth'

export async function POST(request: Request) {
    try {
        const session = await auth()
        const supabase = await createClient()
        const body = await request.json()

        const {
            ref_info_id,
            menu_name,
            local_name,
            other_name,
            category,
        } = body

        if (!ref_info_id || !menu_name) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        const menuData: Record<string, any> = {
            ref_info_id,
            ref_sv_code: session?.user?.email || null,
            menu_name,
            local_name,
            other_name,
            category,
        }

        const { data, error } = await supabase
            .from('menus')
            .insert(menuData)
            .select()
            .single()

        if (error) {
            console.error('Error creating menu:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true, data }, { status: 201 })
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

export async function PATCH(request: Request) {
    try {
        const supabase = await createClient()
        const body = await request.json()
        const { menu_id, ...updateFields } = body

        if (!menu_id) {
            return NextResponse.json({ error: 'Missing menu_id' }, { status: 400 })
        }

        const { data, error } = await supabase
            .from('menus')
            .update(updateFields)
            .eq('menu_id', menu_id)
            .select()
            .single()

        if (error) {
            console.error('Error updating menu:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true, data }, { status: 200 })
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const menuId = searchParams.get('menu_id')
        const infoId = searchParams.get('info_id')

        const supabase = await createClient()

        if (menuId) {
            const { data, error } = await supabase
                .from('menus')
                .select('*')
                .eq('menu_id', menuId)
                .single()

            if (error) return NextResponse.json({ error: error.message }, { status: 500 })
            return NextResponse.json({ data }, { status: 200 })
        }

        if (infoId) {
            const { data, error } = await supabase
                .from('menus')
                .select('*')
                .eq('ref_info_id', infoId)
                .order('created_at', { ascending: false })

            if (error) return NextResponse.json({ error: error.message }, { status: 500 })
            return NextResponse.json({ data }, { status: 200 })
        }

        return NextResponse.json({ error: 'Provide menu_id or info_id' }, { status: 400 })
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
