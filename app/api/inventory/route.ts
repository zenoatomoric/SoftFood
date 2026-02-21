import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { auth } from '@/auth'

// GET: List Master Ingredients
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const q = searchParams.get('q') || ''
        const page = parseInt(searchParams.get('page') || '1')
        const limit = 20
        const start = (page - 1) * limit
        const end = start + limit - 1

        const supabase = await createClient()

        let query = supabase.from('master_ingredients')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false })

        if (q) {
            query = query.ilike('ing_name', `%${q}%`)
        }

        query = query.range(start, end)

        const { data, count, error } = await query

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({
            data,
            total: count || 0,
            page,
            totalPages: Math.ceil((count || 0) / limit)
        })

    } catch (err) {
        return NextResponse.json({ error: String(err) }, { status: 500 })
    }
}

// DELETE: Delete Master Ingredient (Admin/Director only)
export async function DELETE(request: Request) {
    try {
        const session = await auth()
        const role = session?.user?.role

        if (role !== 'admin' && role !== 'director') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 })

        const supabase = await createClient()

        const { error } = await supabase
            .from('master_ingredients')
            .delete()
            .eq('ing_id', id)

        if (error) throw error

        return NextResponse.json({ success: true })

    } catch (err) {
        return NextResponse.json({ error: String(err) }, { status: 500 })
    }
}
