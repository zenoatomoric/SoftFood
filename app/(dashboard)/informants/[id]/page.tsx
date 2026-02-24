

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
        // resilient join logic mirroring the API
        const { data, error } = await supabase
            .from('informants')
            .select(`
                *,
                creator:users!ref_sv_code(collector_name),
                editor:users!last_edited_by(collector_name)
            `)
            .eq('info_id', id)
            .single()

        if (error) {
            console.warn('Complex join failed, trying simple select:', error.message)
            const { data: simpleData, error: simpleError } = await supabase
                .from('informants')
                .select('*')
                .eq('info_id', id)
                .single()
            if (simpleError) return null
            return simpleData
        }

        // Flatten joined data
        return {
            ...data,
            creator_name: data.creator?.collector_name,
            editor_name: data.editor?.collector_name
        }
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
    const role = (session?.user?.role || 'user').toLowerCase().trim()
    const userId = session?.user?.sv_code || ''

    const userName = (session?.user as any)?.collector_name || session?.user?.name || 'Guest'
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
                        userRole={role}
                        userName={userName}
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
