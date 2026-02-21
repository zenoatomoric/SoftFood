import { auth } from '@/auth'
import { redirect } from 'next/navigation'

export default async function RootPage() {
  const session = await auth()

  // ถ้า login แล้ว ให้ไปหน้า home
  if (session?.user) {
    redirect('/home')
  }

  // ถ้ายังไม่ login ให้ไปหน้า login
  redirect('/login')
}
