import { Suspense } from 'react'
import SurveyFormClient from '@/app/components/survey/SurveyFormClient'

export default function SurveyPart2Page() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-slate-400">กำลังโหลด...</div>}>
            <SurveyFormClient />
        </Suspense>
    )
}
