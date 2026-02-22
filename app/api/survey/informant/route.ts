import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { auth } from '@/auth'

export async function POST(request: Request) {
    try {
        const session = await auth()
        const supabase = await createClient()
        const body = await request.json()

        // Extract fields matching the 'informants' table schema
        // Schema: info_id, canal_zone, full_name, age, occupation, income, address_full, 
        // residency_years, residency_months, residency_days, phone, social_media, gps_lat, gps_long, gps_alt, consent_status, consent_document_url

        const {
            canal_zone,
            full_name,
            gender,
            age,
            occupation,
            income,
            address_full,
            residency_years,
            residency_months,
            residency_days,
            phone,
            social_media,
            gps_lat,
            gps_long,
            gps_alt,
            consent_document_url
        } = body

        // Sanitize numeric fields (handle empty strings)
        const sanitizeNumber = (val: any, type: 'int' | 'float' = 'int', fallback: any = null) => {
            if (val === undefined || val === null || val === '') return fallback
            return type === 'int' ? parseInt(val) : parseFloat(val)
        }

        const informantData = {
            canal_zone: canal_zone || null,
            full_name,
            gender: gender || null,
            age: sanitizeNumber(age),
            occupation: occupation || null,
            income: sanitizeNumber(income, 'float'),
            address_full: address_full || null,
            residency_years: sanitizeNumber(residency_years, 'int', 0),
            residency_months: sanitizeNumber(residency_months, 'int', 0),
            residency_days: sanitizeNumber(residency_days, 'int', 0),
            phone: phone || null,
            social_media: social_media || null,
            gps_lat: sanitizeNumber(gps_lat, 'float'),
            gps_long: sanitizeNumber(gps_long, 'float'),
            gps_alt: sanitizeNumber(gps_alt, 'float', 0.0),
            consent_document_url: consent_document_url || null,
            ref_sv_code: session?.user?.email || null,
        }

        const { data, error } = await supabase
            .from('informants')
            .insert(informantData)
            .select()
            .single()

        if (error) {
            console.error('Error creating informant:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true, data }, { status: 201 })

    } catch (error) {
        console.error('Server error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

// GET: Fetch Informants with Pagination & Search
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')
        const search = searchParams.get('search')
        const page = parseInt(searchParams.get('page') || '1')
        const mine = searchParams.get('mine') === 'true'
        const limitStr = searchParams.get('limit')
        const limit = limitStr ? parseInt(limitStr) : 20
        const start = (page - 1) * limit
        const end = start + limit - 1

        const session = await auth()
        const supabase = await createClient()

        // 1. Get user profile/role
        const svCode = session?.user?.email
        const { data: userData } = await supabase.from('users').select('role').eq('sv_code', svCode || '').single()
        const role = (userData?.role || 'user').toLowerCase().trim()

        if (id) {
            // Try with both joins (creator and editor)
            const { data, error } = await supabase
                .from('informants')
                .select(`
                    *,
                    creator:users!ref_sv_code(collector_name),
                    editor:users!last_edited_by(collector_name)
                `)
                .eq('info_id', id)
                .single()

            if (error) {
                console.error('Error fetching informant with complex join:', error.message)

                // Try with just creator join (should work if original FK exists)
                const { data: midData, error: midError } = await supabase
                    .from('informants')
                    .select(`
                        *,
                        creator:users!ref_sv_code(collector_name)
                    `)
                    .eq('info_id', id)
                    .single()

                if (midError) {
                    console.error('Error fetching informant with simple join:', midError.message)
                    const { data: fbData, error: fbError } = await supabase
                        .from('informants')
                        .select('*')
                        .eq('info_id', id)
                        .single()

                    if (fbError) return NextResponse.json({ error: fbError.message }, { status: 500 })
                    return NextResponse.json({ data: fbData }, { status: 200 })
                }

                return NextResponse.json({
                    data: {
                        ...midData,
                        creator_name: midData.creator?.collector_name,
                        editor_name: null // Fallback if last_edited_by join fails
                    }
                }, { status: 200 })
            }

            // Flatten the joined data
            const flattenedData = {
                ...data,
                creator_name: data.creator?.collector_name,
                editor_name: data.editor?.collector_name
            }
            delete flattenedData.creator
            delete flattenedData.editor

            return NextResponse.json({ data: flattenedData }, { status: 200 })
        }

        // List query with multiple fallback levels
        let joinData: any[] = []
        let joinCount: number = 0

        try {
            // Level 1: Full join (creator + editor)
            const { data, error, count } = await supabase.from('informants').select(`
                *,
                creator:users!ref_sv_code(collector_name),
                editor:users!last_edited_by(collector_name)
            `, { count: 'exact' })
                .order('created_at', { ascending: false })
                .range(start, end)
                .filter('ref_sv_code', role === 'user' || mine ? 'eq' : 'neq', role === 'user' || mine ? (svCode || 'NONE') : 'UNDEFINED_PLACEHOLDER')
            // Note: complex filtering is better done via the query object, but for the join fallback logic:

            if (error) throw error
            joinData = data
            joinCount = count || 0
        } catch (err) {
            console.warn('Level 1 Join failed, trying Level 2 (Creator only):', (err as any).message)
            try {
                // Level 2: Creator join only
                const { data, error, count } = await supabase.from('informants').select(`
                    *,
                    creator:users!ref_sv_code(collector_name)
                `, { count: 'exact' })
                    .order('created_at', { ascending: false })
                    .range(start, end)

                if (error) throw error
                joinData = data
                joinCount = count || 0
            } catch (err2) {
                console.error('Level 2 Join failed, falling back to basic select:', (err2 as any).message)
                // Level 3: Basic select
                const { data, error, count } = await supabase.from('informants').select('*', { count: 'exact' })
                    .order('created_at', { ascending: false })
                    .range(start, end)

                if (error) return NextResponse.json({ error: error.message }, { status: 500 })
                joinData = data
                joinCount = count || 0
            }
        }

        // Re-apply RBAC/Search filtering if needed on the final data (or ideally in the query)
        // Since we are using PostgREST, it's better to build the query object. 
        // Let's refactor to keep it clean.

        // Actually, the current approach is a bit messy. Let's stick to the query builder pattern.

        // RE-REFACTORING to be clean AND resilient:
        const buildQuery = (selectStr: string) => {
            let q = supabase.from('informants').select(selectStr, { count: 'exact' })
            if (role === 'user' || mine) q = q.eq('ref_sv_code', svCode || 'NONE')
            if (search) q = q.or(`friendly_id.ilike.%${search}%,full_name.ilike.%${search}%`)
            return q.order('created_at', { ascending: false }).range(start, end)
        }

        let finalData: any[] = []
        let finalCount: number = 0

        // Attempt 1: Full Join
        const q1 = await buildQuery(`
            *,
            creator:users!ref_sv_code(collector_name),
            editor:users!last_edited_by(collector_name)
        `)

        if (!q1.error) {
            finalData = q1.data
            finalCount = q1.count || 0
        } else {
            console.warn('Full join failed:', q1.error.message)
            // Attempt 2: Creator Join
            const q2 = await buildQuery(`
                *,
                creator:users!ref_sv_code(collector_name)
            `)
            if (!q2.error) {
                finalData = q2.data
                finalCount = q2.count || 0
            } else {
                console.error('Creator join failed:', q2.error.message)
                // Attempt 3: Basic Select
                const q3 = await buildQuery('*')
                if (q3.error) return NextResponse.json({ error: q3.error.message }, { status: 500 })
                finalData = q3.data
                finalCount = q3.count || 0
            }
        }

        // Flatten joined data for the list
        const flattenedList = finalData.map((item: any) => ({
            ...item,
            creator_name: item.creator?.collector_name,
            editor_name: item.editor?.collector_name
        }))

        return NextResponse.json({
            data: flattenedList,
            total: finalCount,
            page,
            totalPages: Math.ceil(finalCount / limit)
        }, { status: 200 })

    } catch (error) {
        console.error('API GET Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

// PATCH: Update Informant Details
export async function PATCH(request: Request) {
    try {
        const session = await auth()
        const supabase = await createClient()

        // RBAC check: only admin/director can edit
        const svCode = session?.user?.email
        const { data: userData } = await supabase.from('users').select('role').eq('sv_code', svCode || '').single()
        const userRole = (userData?.role || '').toLowerCase().trim()
        const isAdmin = userRole === 'admin' || userRole === 'director'

        if (!isAdmin) {
            return NextResponse.json({ error: 'คุณไม่มีสิทธิ์ในการแก้ไขข้อมูล (เฉพาะผู้ดูแลระบบเท่านั้น)' }, { status: 403 })
        }

        const body = await request.json()
        const { info_id, ...updates } = body

        if (!info_id) {
            return NextResponse.json({ error: 'Missing info_id' }, { status: 400 })
        }

        // Add editor tracking info
        const sanitizedUpdates: any = {
            ...updates,
            last_edited_by: svCode || null,
            last_edited_at: new Date().toISOString()
        }

        // Sanitize numeric fields in updates
        const sanitizeNumber = (val: any, type: 'int' | 'float' = 'int', fallback: any = null) => {
            if (val === undefined || val === null || val === '') return fallback
            return type === 'int' ? parseInt(val) : parseFloat(val)
        }

        const numericFields = ['age', 'income', 'residency_years', 'residency_months', 'residency_days', 'gps_lat', 'gps_long', 'gps_alt']

        numericFields.forEach(field => {
            if (field in sanitizedUpdates) {
                const type = (field === 'income' || field.startsWith('gps_')) ? 'float' : 'int'
                const fallback = (field.startsWith('residency_')) ? 0 : (field === 'gps_alt' ? 0.0 : null)
                sanitizedUpdates[field] = sanitizeNumber(sanitizedUpdates[field], type, fallback)
            }
        })

        // Also sanitize constrained text fields to null instead of empty string
        const constrainedTextFields = ['gender', 'canal_zone']
        constrainedTextFields.forEach(field => {
            if (field in sanitizedUpdates && sanitizedUpdates[field] === '') {
                sanitizedUpdates[field] = null
            }
        })

        const { data, error } = await supabase
            .from('informants')
            .update(sanitizedUpdates)
            .eq('info_id', info_id)
            .select()
            .single()

        if (error) {
            console.error('Error updating informant:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true, data }, { status: 200 })
    } catch (error) {
        console.error('Server error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

// DELETE: Remove Informant
export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 })

        const session = await auth()
        const supabase = await createClient()

        // RBAC check: only admin/director can delete
        const svCode = session?.user?.email
        const { data: userData } = await supabase.from('users').select('role').eq('sv_code', svCode || '').single()
        const userRole = (userData?.role || '').toLowerCase().trim()
        const isAdmin = userRole === 'admin' || userRole === 'director'

        if (!isAdmin) {
            return NextResponse.json({ error: 'คุณไม่มีสิทธิ์ในการลบข้อมูล (เฉพาะผู้ดูแลระบบเท่านั้น)' }, { status: 403 })
        }

        // Check if used in Menus? 
        // Schema likely creates foreign key constraints. 
        // If ON DELETE RESTRICT (default), this will fail if menus exist.
        // We might want to warn user or check first. For now, let's try delete and return error if text.

        const { error } = await supabase
            .from('informants')
            .delete()
            .eq('info_id', id)

        if (error) {
            // specific postgres foreign key violation code is 23503
            if (error.code === '23503') {
                return NextResponse.json({ error: 'ไม่สามารถลบได้เนื่องจากมีเมนูอ้างอิงถึงผู้ให้ข้อมูลนี้' }, { status: 400 })
            }
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true }, { status: 200 })

    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
