'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateMenuStatus(menuId: string, statusTags: string[]) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('menus')
    .update({ selection_status: statusTags })
    .eq('menu_id', menuId)

  if (error) {
    console.error('Error updating status:', error)
    return { error: error.message }
  }

  revalidatePath('/menus')
  return { success: true }
}