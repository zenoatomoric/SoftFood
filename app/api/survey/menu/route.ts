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
            story,
            nutrition,
            social_value,
            popularity,
            rituals,
            seasonality,
            ingredient_sources,
            health_benefits,
            consumption_freq,
            complexity,
            taste_appeal,
            secret_tips,
            heritage_status,
            awards_references,
            selection_status,
            other_popularity,
            other_rituals,
            other_seasonality,
            other_ingredient_sources,
            other_health_benefits,
            other_consumption_freq,
            other_complexity,
            other_taste_appeal,
            serving_size,
            other_serving_size
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
            story,
            nutrition,
            social_value,
            popularity,
            rituals,
            seasonality,
            ingredient_sources,
            health_benefits,
            consumption_freq,
            complexity,
            taste_appeal,
            secret_tips,
            heritage_status,
            awards_references,
            selection_status: selection_status || [],
            other_popularity,
            other_rituals,
            other_seasonality,
            other_ingredient_sources,
            other_health_benefits,
            other_consumption_freq,
            other_complexity,
            other_taste_appeal,
            serving_size,
            other_serving_size
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
        const { menu_id } = body

        if (!menu_id) {
            return NextResponse.json({ error: 'Missing menu_id' }, { status: 400 })
        }

        // List all allowed fields to update
        const allowedFields = [
            'menu_name', 'local_name', 'other_name', 'category', 'story',
            'nutrition', 'social_value', 'popularity', 'rituals', 'seasonality',
            'ingredient_sources', 'health_benefits', 'consumption_freq',
            'complexity', 'taste_appeal', 'secret_tips', 'heritage_status',
            'awards_references', 'selection_status',
            'other_popularity', 'other_rituals', 'other_seasonality',
            'other_ingredient_sources', 'other_health_benefits',
            'other_consumption_freq', 'other_complexity', 'other_taste_appeal',
            'serving_size', 'other_serving_size'
        ]

        const updateData: Record<string, any> = {}
        allowedFields.forEach(field => {
            if (field in body) {
                updateData[field] = body[field]
            }
        })

        const { data, error } = await supabase
            .from('menus')
            .update(updateData)
            .eq('menu_id', menu_id)
            .select()
            .single()

        if (error) {
            console.error('Error updating menu:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true, data }, { status: 200 })
    } catch (error) {
        console.error('Server error:', error)
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
