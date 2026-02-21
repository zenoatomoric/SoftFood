import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

// GET /api/master-ingredient?q=กะทิ  → ค้นหาวัตถุดิบจากคลังกลาง
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const q = searchParams.get('q')?.trim()

        if (!q || q.length < 1) {
            return NextResponse.json({ data: [] })
        }

        const supabase = await createClient()
        const { data, error } = await supabase
            .from('master_ingredients')
            .select('ing_id, ing_name')
            .ilike('ing_name', `%${q}%`)
            .order('ing_name')
            .limit(15)

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json({ data: data || [] })
    } catch {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

// POST /api/master-ingredient  → เพิ่มวัตถุดิบใหม่ (is_verified = false)
export async function POST(request: Request) {
    try {
        const supabase = await createClient()
        const body = await request.json()
        const { ing_name } = body

        if (!ing_name?.trim()) {
            return NextResponse.json({ error: 'Missing ing_name' }, { status: 400 })
        }

        const trimmed = ing_name.trim()

        // Check if already exists (case-insensitive)
        const { data: existing } = await supabase
            .from('master_ingredients')
            .select('ing_id, ing_name')
            .ilike('ing_name', trimmed)
            .limit(1)

        if (existing && existing.length > 0) {
            return NextResponse.json({ data: existing[0] })
        }

        // Insert new
        const { data, error } = await supabase
            .from('master_ingredients')
            .insert({ ing_name: trimmed, is_verified: false })
            .select('ing_id, ing_name')
            .single()

        if (error) {
            console.error('Error creating master ingredient:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ data }, { status: 201 })
    } catch {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
