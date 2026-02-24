
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import FoodListClient from './FoodListClient'

export default async function FoodPage() {
    const session = await auth()

    // No redirect to allow public access to food selection list

    return (
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-8">
            <FoodListClient
                userRole={(session?.user as any)?.role || 'user'}
                userId={(session?.user as any)?.sv_code || ''}
            />
        </div>
    )
}
