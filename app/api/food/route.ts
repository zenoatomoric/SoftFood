import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { NextResponse } from 'next/server'
import { auth } from '@/auth'

// GET: Fetch Menus with Filters & Search
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)

        const session = await auth()
        // Allow public read access to food data

        // Use Admin Client to bypass RLS and show all data to all roles
        // Hardened with try-catch to prevent 500 when keys are missing
        let supabase;
        try {
            supabase = createAdminClient()
        } catch (adminErr) {
            console.warn('[API Food] Admin client failed, falling back to server client:', adminErr)
            supabase = await createClient()
        }


        const svCode = session?.user?.sv_code || ''
        const role = (session?.user?.role || 'user').toLowerCase().trim()
        const isAdmin = role === 'admin' || role === 'director'

        const q = searchParams.get('q') || ''
        const canal = searchParams.get('canal')
        const category = searchParams.get('category')
        const status = searchParams.get('status')
        const page = parseInt(searchParams.get('page') || '1')
        const limitStr = searchParams.get('limit')
        const limit = limitStr ? parseInt(limitStr) : 20
        const full = searchParams.get('full') === 'true'
        const mine = searchParams.get('mine') === 'true'
        const start = (page - 1) * limit
        const end = start + limit - 1

        // Base Query
        let query = supabase.from('menus').select(full ? `
            *,
            informants (*),
            users (*),
            menu_ingredients (
                *,
                master_ingredients ( ing_name )
            ),
            menu_steps (*),
            menu_photos:menu_photos (*)
        ` : `
            menu_id, 
            menu_name, 
            category, 
            selection_status, 
            created_at, 
            ref_sv_code,
            ref_info_id,
            informants (full_name, canal_zone),
            users (collector_name),
            menu_photos:menu_photos (photo_url)
        `, { count: 'exact' })

        // RBAC Filtering:
        // - By default, all roles see all records to track project progress
        // - Filter by 'mine' only if explicitly requested
        if (mine) {
            query = query.eq('ref_sv_code', svCode || 'NONE')
        }
        if (q) {
            // Simple search on Menu Name and SV Code
            // Note: OR logic across joined tables is complex in Supabase JS SDK. 
            // For MVP, we search menu_name and ref_sv_code.
            query = query.or(`menu_name.ilike.%${q}%,ref_sv_code.ilike.%${q}%`)
        }

        if (canal) {
            // Filter by Canal Zone (via inner joined informants)
            query = query.eq('informants.canal_zone', canal)
        }

        if (category) {
            query = query.eq('category', category)
        }

        if (status) {
            // Filter by Selection Status (Array containment)
            // status might be '108', '93', '36'
            query = query.contains('selection_status', [status])
        }

        const id = searchParams.get('id')
        if (id) {
            query = query.eq('menu_id', id)
        }

        const infoId = searchParams.get('info_id')
        if (infoId) {
            query = query.eq('ref_info_id', infoId)
        }

        // Pagination & Sorting
        query = query.order('created_at', { ascending: false })

        if (!full) {
            query = query.range(start, end)
        }

        // Execute
        const { data, error, count } = await query

        if (error) {
            console.error('Fetch error:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        // Transform Data for Frontend
        const formatted = (data || []).map((item: any) => {
            // Handle cases where join might return data in different formats
            const inf = item.informants
            const usr = item.users

            return {
                ...item,
                menu_id: item.menu_id,
                menu_name: item.menu_name,
                category: item.category,
                selection_status: item.selection_status || [],
                created_at: item.created_at,
                informant_name: inf?.full_name || 'ไม่ระบุ',
                canal_zone: inf?.canal_zone || 'ไม่ระบุ',
                surveyor_name: usr?.collector_name || item.ref_sv_code,
                thumbnail: (item.menu_photos?.[0]?.photo_url) ? (
                    item.menu_photos[0].photo_url.startsWith('http')
                        ? item.menu_photos[0].photo_url
                        : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/images/${item.menu_photos[0].photo_url}`
                ) : null,
                ref_sv_code: item.ref_sv_code,
                ref_info_id: item.ref_info_id
            }
        })

        return NextResponse.json({
            data: formatted,
            total: count || 0,
            page,
            totalPages: Math.ceil((count || 0) / limit)
        })

    } catch (err) {
        return NextResponse.json({ error: String(err) }, { status: 500 })
    }
}

// PATCH: Update Selection Status (Director/Admin Only)
export async function PATCH(request: Request) {
    try {
        const session = await auth()
        const userRole = (session?.user?.role || '').toLowerCase().trim()

        if (userRole !== 'director' && userRole !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { menu_id, selection_status } = await request.json()

        if (!menu_id || !Array.isArray(selection_status)) {
            return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
        }

        const supabase = await createClient()
        const { error } = await supabase
            .from('menus')
            .update({ selection_status })
            .eq('menu_id', menu_id)

        if (error) throw error

        return NextResponse.json({ success: true })

    } catch (err) {
        return NextResponse.json({ error: String(err) }, { status: 500 })
    }
}

// DELETE: Delete Menu (Admin & Owner)
export async function DELETE(request: Request) {
    try {
        const session = await auth()
        const userRole = (session?.user?.role || '').toLowerCase().trim()
        const svCode = session?.user?.sv_code

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 })

        const supabase = await createClient()

        // Check ownership if not admin
        if (userRole !== 'admin') {
            const { data: menu } = await supabase.from('menus').select('ref_sv_code').eq('menu_id', id).single()
            if (!menu || menu.ref_sv_code !== svCode) {
                return NextResponse.json({ error: 'Unauthorized. You can only delete your own menus.' }, { status: 403 })
            }
        }

        // Delete menu

        // Delete menu (cascade should handle related data if set up, otherwise we might need to delete relations manually)
        // Schema says ON DELETE CASCADE for most relations, so deleting menu is enough.
        const { error } = await supabase
            .from('menus')
            .delete()
            .eq('menu_id', id)

        if (error) throw error

        return NextResponse.json({ success: true })

    } catch (err) {
        return NextResponse.json({ error: String(err) }, { status: 500 })
    }
}
