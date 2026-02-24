import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import DashboardLayoutClient from './DashboardLayoutClient'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  // No redirect here to allow public access to dashboard stats
  const userRole = session?.user?.role || 'user'
  const userName = session?.user?.name || 'Guest'

  return (
    <DashboardLayoutClient userRole={userRole} userName={userName}>
      {children}
    </DashboardLayoutClient>
  )
}