import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { getUsers } from './actions'
import UserManagementClient from './UserManagementClient'

export default async function UsersPage() {
  const session = await auth()

  // ตรวจสอบว่าเป็น admin หรือไม่ (รองรับภาษาไทย)
  if (!session?.user) {
    redirect('/login')
  }

  const role = session.user.role?.toLowerCase()?.trim();
  const isAdmin = ['admin', 'ผู้ดูแลระบบ'].includes(role || '');

  if (!isAdmin) {
    redirect('/home')
  }

  // ดึงข้อมูล users
  const result = await getUsers()
  const users = result.users || []
  const currentUserSvCode = session.user.sv_code

  return <UserManagementClient users={users} currentUserSvCode={currentUserSvCode} />
}