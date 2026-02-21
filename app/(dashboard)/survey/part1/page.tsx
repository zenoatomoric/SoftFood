import { Suspense } from 'react'
import SurveyPart1Client from '@/app/components/survey/SurveyPart1Client'

export default function SurveyPart1Page() {
    return (
        <div className="max-w-4xl mx-auto py-8">
            <header className="mb-8">
                <h1 className="text-3xl font-black text-slate-900 mb-2">แบบสำรวจส่วนที่ ๑</h1>
                <p className="text-slate-500">ข้อมูลผู้ให้ข้อมูล (Informant Info)</p>
            </header>

            <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
                <SurveyPart1Client />
            </Suspense>
        </div>
    )
}
