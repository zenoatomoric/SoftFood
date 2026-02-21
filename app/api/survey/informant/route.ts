import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    try {
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

        const informantData = {
            canal_zone,
            full_name,
            gender: gender || null,
            age: age ? parseInt(age) : null,
            occupation,
            income: income ? parseFloat(income) : null,
            address_full,
            residency_years: residency_years ? parseInt(residency_years) : 0,
            residency_months: residency_months ? parseInt(residency_months) : 0,
            residency_days: residency_days ? parseInt(residency_days) : 0,
            phone,
            social_media,
            gps_lat: gps_lat ? parseFloat(gps_lat) : null,
            gps_long: gps_long ? parseFloat(gps_long) : null,
            gps_alt: gps_alt ? parseFloat(gps_alt) : 0.0,
            consent_document_url: consent_document_url || null,
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
        const limitStr = searchParams.get('limit')
        const limit = limitStr ? parseInt(limitStr) : 20
        const start = (page - 1) * limit
        const end = start + limit - 1

        const supabase = await createClient()

        if (id) {
            const { data, error } = await supabase
                .from('informants')
                .select('*')
                .eq('info_id', id)
                .single()

            if (error) return NextResponse.json({ error: error.message }, { status: 500 })
            return NextResponse.json({ data }, { status: 200 })
        }

        let query = supabase.from('informants').select('*', { count: 'exact' })

        if (search) {
            // Search by friendly_id or full_name
            query = query.or(`friendly_id.ilike.%${search}%,full_name.ilike.%${search}%`)
        }

        query = query.order('created_at', { ascending: false }).range(start, end)

        const { data, error, count } = await query

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({
            data,
            total: count || 0,
            page,
            totalPages: Math.ceil((count || 0) / limit)
        }, { status: 200 })

    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

// PATCH: Update Informant Details
export async function PATCH(request: Request) {
    try {
        const supabase = await createClient()
        const body = await request.json()
        const { info_id, ...updates } = body

        if (!info_id) {
            return NextResponse.json({ error: 'Missing info_id' }, { status: 400 })
        }

        // Filter out undefined/nulls if necessary, but usually we want to explicit updates
        // We'll trust the client to send correct fields matching the schema

        const { data, error } = await supabase
            .from('informants')
            .update(updates)
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

        const supabase = await createClient()

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
