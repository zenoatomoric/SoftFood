import { Suspense } from 'react'
import SurveyPart1Client from '@/app/components/survey/SurveyPart1Client'
import { auth } from '@/auth'

export default async function SurveyPart1Page() {
    const session = await auth()
    const userRole = session?.user?.role || 'user'
    const userName = session?.user?.name || ''

    return (
        <div className="max-w-4xl mx-auto py-8">
            <header className="mb-8">
                <h1 className="text-3xl font-black text-slate-900 mb-2">แบบสำรวจส่วนที่ ๑</h1>
                <p className="text-slate-500">ข้อมูลผู้ให้ข้อมูล (Informant Info)</p>
            </header>

            <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
                <SurveyPart1Client userRole={userRole} userName={userName} />
            </Suspense>
        </div>
    )
}
