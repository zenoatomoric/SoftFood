
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import MenusClient from './MenusClient'

export default async function MenusPage() {
  const session = await auth()

  // No redirect to allow public access to menus list

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-8">
      <MenusClient
        userRole={(session?.user as any)?.role || 'user'}
        userId={(session?.user as any)?.sv_code || ''}
      />
    </div>
  )
}
