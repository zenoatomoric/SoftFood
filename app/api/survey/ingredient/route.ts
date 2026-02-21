import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    try {
        const supabase = await createClient()
        const body = await request.json()
        const { ref_menu_id, ingredients } = body

        if (!ref_menu_id || !ingredients || !Array.isArray(ingredients)) {
            return NextResponse.json({ error: 'Missing ref_menu_id or ingredients array' }, { status: 400 })
        }

        // Delete existing ingredients for this menu first (replace strategy)
        await supabase.from('menu_ingredients').delete().eq('ref_menu_id', ref_menu_id)

        // Insert all ingredients
        // Prepare ingredients (Upsert master if needed)
        const processedIngredients = []
        for (const ing of ingredients) {
            let ingId = ing.ref_ing_id

            // If no ID but has Name, try to find or create in master_ingredients
            if (!ingId && ing.name && typeof ing.name === 'string' && ing.name.trim()) {
                const normalizedName = ing.name.trim()

                // 1. Try to find existing
                const { data: existing } = await supabase
                    .from('master_ingredients')
                    .select('ing_id')
                    .eq('ing_name', normalizedName)
                    .single()

                if (existing) {
                    ingId = existing.ing_id
                } else {
                    // 2. Create new
                    const { data: newIng, error: createError } = await supabase
                        .from('master_ingredients')
                        .insert({ ing_name: normalizedName, is_verified: false })
                        .select('ing_id')
                        .single()

                    if (newIng && !createError) {
                        ingId = newIng.ing_id
                    }
                }
            }

            processedIngredients.push({
                ref_menu_id,
                ref_ing_id: ingId || null,
                ingredient_type: ing.ingredient_type,
                is_main_ingredient: ing.is_main_ingredient || false,
                quantity: ing.quantity,
                unit: ing.unit,
                note: ing.note,
            })
        }

        const { data, error } = await supabase
            .from('menu_ingredients')
            .insert(processedIngredients)
            .select()

        if (error) {
            console.error('Error saving ingredients:', error)
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
            .from('menu_ingredients')
            .select('*')
            .eq('ref_menu_id', menuId)

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json({ data }, { status: 200 })
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
