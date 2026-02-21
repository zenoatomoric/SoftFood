
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
            menu_photos (*)
        `)
        .eq('menu_id', id)
        .single()

    if (error || !menu) {
        console.error('Error fetching menu:', error)
        notFound()
    }

    return (
        <MenuDetailClient
            menu={menu}
            userRole={(session?.user as any)?.role || 'user'}
            userId={(session?.user as any)?.sv_code || ''}
        />
    )
}
