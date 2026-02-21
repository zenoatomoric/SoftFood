

import { Suspense } from 'react'
import { notFound, redirect } from 'next/navigation'
import { auth } from '@/auth'
import { createClient } from '@/utils/supabase/server'
import SurveyPart1Client from '@/app/components/survey/SurveyPart1Client'
import InformantMenus from '@/app/components/InformantMenus'

interface PageProps {
    params: {
        id: string
    }
}

async function getInformant(id: string) {
    try {
        const supabase = await createClient()
        const { data, error } = await supabase
            .from('informants')
            .select('*')
            .eq('info_id', id)
            .single()

        if (error) {
            console.error('Error fetching informant:', error)
            return null
        }
        return data
    } catch (err) {
        console.error('Error fetching informant:', err)
        return null
    }
}


export default async function InformantDetailPage({ params }: PageProps) {
    const session = await auth()
    if (!session?.user) {
        redirect('/')
    }

    const { id } = await params
    const informant = await getInformant(id)

    if (!informant) {
        notFound()
    }

    // Determine read-only status based on role
    const role = session.user.role || 'user'
    const canEdit = role === 'admin' || role === 'director'
    const isReadOnly = !canEdit

    return (
        <div className="max-w-4xl mx-auto pb-24">
            {/* Header with Back Button logic could be here or inside Client, 
                 but SurveyPart1Client has its own header. 
                 We might want a "Back" button above it? 
                 SurveyPart1Client uses router.push for navigation on success. 
             */}

            <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
                <div className="space-y-8">
                    <SurveyPart1Client
                        initialData={informant}
                        isEditMode={true}
                        readOnly={isReadOnly}
                    />

                    <InformantMenus
                        infoId={id}
                        canEdit={canEdit}
                    />
                </div>
            </Suspense>
        </div>
    )
}
