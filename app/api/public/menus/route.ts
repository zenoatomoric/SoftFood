import { createAdminClient } from '@/utils/supabase/admin'
import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

// Public GET: Fetch menus for the landing page (no auth required)
export async function GET() {
    try {
        let supabase;
        try {
            supabase = createAdminClient()
        } catch {
            supabase = await createClient()
        }

        const { data, error } = await supabase
            .from('menus')
            .select(`
                *,
                informants (full_name, canal_zone, address_full, gps_lat, gps_long),
                menu_photos (photo_url),
                menu_ingredients (
                    ingredient_type,
                    is_main_ingredient,
                    quantity,
                    unit,
                    note,
                    master_ingredients ( ing_name )
                ),
                menu_steps (step_order, instruction)
            `)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('[Public API] Fetch error:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        const formatted = (data || []).map((item: any) => {
            // Handle cases where join might return data in different formats (object or array)
            const rawInf = item.informants || item.informant
            const inf = Array.isArray(rawInf) ? rawInf[0] : rawInf

            // Extract ingredient names from joined master_ingredients
            const ingredients = (item.menu_ingredients || []).map((i: any) => {
                const masterIng = Array.isArray(i.master_ingredients) ? i.master_ingredients[0] : i.master_ingredients
                return {
                    name: masterIng?.ing_name || 'ไม่ระบุ',
                    is_main: i.is_main_ingredient,
                    type: i.ingredient_type,
                    quantity: i.quantity,
                    unit: i.unit,
                    note: i.note,
                }
            })

            // Sort steps
            const steps = (item.menu_steps || [])
                .sort((a: any, b: any) => (a.step_order || 0) - (b.step_order || 0))
                .map((s: any) => s.instruction)
                .filter(Boolean)

            // Build thumbnail URL
            const getImageUrl = (url: string | null) => {
                if (!url) return null
                if (url.startsWith('http')) return url
                return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/images/${url}`
            }

            // Collect all photo URLs
            const photos = (item.menu_photos || [])
                .map((p: any) => getImageUrl(p.photo_url))
                .filter(Boolean)

            const thumbnail = getImageUrl(item.selection_image_url)
                || photos[0]
                || null

            return {
                menu_id: item.menu_id,
                menu_name: item.menu_name,
                local_name: item.local_name || '',
                other_name: item.other_name || '',
                category: item.category || 'อาหารคาว',
                selection_status: item.selection_status || [],
                canal_zone: inf?.canal_zone || 'ไม่ระบุ',
                informant_name: inf?.full_name || 'ไม่ระบุ',
                address: inf?.address_full || '',
                gps_lat: inf?.gps_lat ?? null,
                gps_long: inf?.gps_long ?? null,
                thumbnail,
                photos,
                story: item.story || '',
                secret_tips: item.secret_tips || '',
                nutrition: item.nutrition || '',
                health_benefits: item.health_benefits || [],
                heritage_status: item.heritage_status || '',
                serving_size: item.serving_size === 'อื่นๆ' ? (item.other_serving_size || '') : (item.serving_size || ''),
                popularity: item.popularity || [],
                seasonality: item.seasonality || [],
                rituals: item.rituals || [],
                ingredient_sources: item.ingredient_sources || [],
                cooking_method: item.cooking_method || '',
                taste_profile: item.taste_profile || '',
                ingredients,
                steps,
                video_url: item.video_url || null,
                promo_video_url: item.promo_video_url || null,
            }
        })

        return NextResponse.json({ data: formatted, total: formatted.length })

    } catch (err) {
        console.error('[Public API] Error:', err)
        return NextResponse.json({ error: String(err) }, { status: 500 })
    }
}
