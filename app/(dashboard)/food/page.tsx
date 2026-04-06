import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import FoodListClient from './FoodListClient'

export default async function FoodPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
    const session = await auth()
    const resolvedParams = await searchParams
    const mode = typeof resolvedParams?.mode === 'string' ? resolvedParams.mode : ''

    // No redirect to allow public access to food selection list

    return (
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-8">
            <FoodListClient
                userRole={(session?.user as any)?.role || 'user'}
                userId={(session?.user as any)?.sv_code || ''}
                userName={session?.user?.name || 'Guest'}
                mode={mode}
            />
        </div>
    )
}
