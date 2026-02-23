
import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Icon } from '@iconify/react'
import MenuDetailClient from './MenuDetailClient'
import { auth } from '@/auth'

export default async function MenuPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const session = await auth()
    const supabase = await createClient()

    const { data: menu, error } = await supabase
        .from('menus')
        .select(`
            *,
            informants (*),
            users (
                collector_name
            ),
            menu_ingredients (
                *,
                master_ingredients ( ing_name )
            ),
            menu_steps (*),
            menu_photos:menu_photos (*)
        `)
        .eq('menu_id', id)
        .single()

    if (error || !menu) {
        console.error('Error fetching menu:', error)
        notFound()
    }

    const role = (session?.user as any)?.role || 'user'
    const svCode = (session?.user as any)?.sv_code || ''

    // Standardize photo URLs to absolute links if needed
    if (menu.menu_photos) {
        menu.menu_photos = menu.menu_photos.map((p: any) => ({
            ...p,
            photo_url: p.photo_url?.startsWith('http')
                ? p.photo_url
                : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/images/${p.photo_url}`
        }))
    }

    return (
        <MenuDetailClient
            menu={menu}
            userRole={role}
            userId={svCode}
        />
    )
}
