import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { getUsers } from '../actions'
import MyTeamClient from '@/app/(dashboard)/users/my-team/MyTeamClient';
// import MyTeamClient from './MyTeamClient'

export const dynamic = 'force-dynamic';

export default async function MyTeamPage() {
    const session = await auth()

    if (!session?.user) {
        redirect('/login')
    }

    // Admin และ Director สามารถดูเมนูนี้ได้ (Director ดูเพื่อความเหมาะสมในการจัดการ)
    const role = session.user.role?.toLowerCase()?.trim();
    const isAuthorized = ['admin', 'director', 'กรรมการ', 'ผู้ดูแลระบบ'].includes(role || '');

    if (!isAuthorized) {
        redirect('/home')
    }

    const result = await getUsers()
    const users = result.users || []
    const currentUserSvCode = session.user.sv_code

    return <MyTeamClient users={users} currentUserSvCode={currentUserSvCode} />
}
