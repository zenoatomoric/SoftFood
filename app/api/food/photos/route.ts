import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { auth } from '@/auth'

export async function POST(request: Request) {
    try {
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const supabase = await createClient()
        const body = await request.json()
        const { ref_menu_id, photo_url, caption, is_selection } = body

        if (!ref_menu_id || !photo_url) {
            return NextResponse.json({ error: 'Missing ref_menu_id or photo_url' }, { status: 400 })
        }

        const { data, error } = await supabase
            .from('menu_photos')
            .insert({
                ref_menu_id,
                photo_url,
                caption: caption || null,
                is_selection: !!is_selection
            })
            .select()
            .single()

        if (error) throw error

        return NextResponse.json({ success: true, data }, { status: 201 })
    } catch (error) {
        console.error('Error saving photo:', error)
        return NextResponse.json({ error: String(error) }, { status: 500 })
    }
}

export async function DELETE(request: Request) {
    try {
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const photoId = searchParams.get('photo_id')

        if (!photoId) {
            return NextResponse.json({ error: 'Missing photo_id' }, { status: 400 })
        }

        const supabase = await createClient()
        const { error } = await supabase
            .from('menu_photos')
            .delete()
            .eq('photo_id', photoId)

        if (error) throw error

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting photo:', error)
        return NextResponse.json({ error: String(error) }, { status: 500 })
    }
}
