import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { getUsers } from './actions'
import UserManagementClient from './UserManagementClient'

export default async function UsersPage() {
  const session = await auth()

  // ตรวจสอบว่าเป็น admin หรือไม่
  if (!session?.user) {
    redirect('/login')
  }

  if (session.user.role !== 'admin') {
    redirect('/')
  }

  // ดึงข้อมูล users
  const result = await getUsers()
  const users = result.users || []

  return <UserManagementClient users={users} />
}