import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import DashboardLayoutClient from './DashboardLayoutClient'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  // ถ้าไม่มี session ให้ redirect ไปหน้า login
  if (!session?.user) {
    redirect('/login')
  }

  const userRole = session.user.role || 'user'
  const userName = session.user.name || 'User'

  return (
    <DashboardLayoutClient userRole={userRole} userName={userName}>
      {children}
    </DashboardLayoutClient>
  )
}