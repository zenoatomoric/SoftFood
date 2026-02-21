
import { Suspense } from 'react'
import InformantsClient from './InformantsClient'
import { auth } from '@/auth'

export default async function InformantsPage() {
    const session = await auth()
    const userRole = session?.user?.role || 'user'
    const userId = session?.user?.sv_code || ''

    return (
        <div className="max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold text-slate-800 mb-6">จัดการผู้ให้ข้อมูล</h1>
            <Suspense fallback={<div>Loading...</div>}>
                <InformantsClient userRole={userRole} userId={userId} />
            </Suspense>
        </div>
    )
}
