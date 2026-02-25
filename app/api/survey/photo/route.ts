import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    try {
        const supabase = await createClient()
        const body = await request.json()
        const { ref_menu_id, photos } = body

        if (!ref_menu_id || !photos || !Array.isArray(photos)) {
            return NextResponse.json({ error: 'Missing ref_menu_id or photos array' }, { status: 400 })
        }

        // Delete existing photos for this menu first (replace strategy)
        await supabase.from('menu_photos').delete().eq('ref_menu_id', ref_menu_id)

        const rows = photos.map((p: any) => ({
            ref_menu_id,
            photo_url: p.photo_url,
            caption: p.caption || null,
        }))

        const { data, error } = await supabase
            .from('menu_photos')
            .insert(rows)
            .select()

        if (error) {
            console.error('Error saving photos:', error)
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
            .from('menu_photos')
            .select('*')
            .eq('ref_menu_id', menuId)

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json({ data }, { status: 200 })
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
