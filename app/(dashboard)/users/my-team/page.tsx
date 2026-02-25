import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { getUsers } from '../actions'
import MyTeamClient from './MyTeamClient'

export default async function MyTeamPage() {
    const session = await auth()

    if (!session?.user) {
        redirect('/login')
    }

    // Admin และ Director สามารถดูเมนูนี้ได้ (Director ดูเพื่อความเหมาะสมในการจัดการ)
    if (session.user.role !== 'admin' && session.user.role !== 'director') {
        redirect('/')
    }

    const result = await getUsers()
    const users = result.users || []
    const currentUserSvCode = session.user.sv_code

    return <MyTeamClient users={users} currentUserSvCode={currentUserSvCode} />
}
