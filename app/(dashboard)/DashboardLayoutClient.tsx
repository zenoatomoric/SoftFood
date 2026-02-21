'use client'

import { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import { SWRConfig, preload } from 'swr'
import { fetcher } from '@/utils/fetcher'

interface DashboardLayoutClientProps {
    children: React.ReactNode
    userRole: string
    userName: string
}

export default function DashboardLayoutClient({
    children,
    userRole,
    userName
}: DashboardLayoutClientProps) {
    // Mobile: Sidebar is hidden by default
    const [isMobileOpen, setIsMobileOpen] = useState(false)
    // Desktop: Sidebar is expanded by default (false = expanded)
    const [isCollapsed, setIsCollapsed] = useState(false)

    // Pre-fetch data for different tabs to make switching instant
    useEffect(() => {
        // Preload stats for home
        preload('/api/food', fetcher)
        // Preload informants (first page)
        preload('/api/survey/informant?page=1&limit=20', fetcher)
        // Preload menus (first page)
        preload('/api/food?page=1', fetcher)
    }, [])

    return (
        <SWRConfig value={{ fetcher, revalidateOnFocus: false, dedupingInterval: 60000 }}>
            <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
                {/* Sidebar - Control via props */}
                <Sidebar
                    role={userRole}
                    isCollapsed={isCollapsed}
                    isOpen={isMobileOpen}
                    onCloseAction={() => setIsMobileOpen(false)}
                />

                {/* Content Area */}
                <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'lg:pl-20' : 'lg:pl-72'}`}>
                    {/* Header - Pass toggle functions */}
                    <Header
                        userName={userName}
                        userRole={userRole}
                        onMenuClick={() => {
                            // Check if mobile or desktop based on window width
                            if (window.innerWidth >= 1024) {
                                setIsCollapsed(!isCollapsed)
                            } else {
                                setIsMobileOpen(!isMobileOpen)
                            }
                        }}
                        isCollapsed={isCollapsed} // Optional: to change icon if needed
                    />

                    {/* Main Content */}
                    <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
                        <div className="max-w-7xl mx-auto">
                            {children}
                        </div>
                    </main>
                </div>

                {/* Mobile Overlay */}
                {isMobileOpen && (
                    <div
                        className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm animate-in fade-in duration-200"
                        onClick={() => setIsMobileOpen(false)}
                    />
                )}
            </div>
        </SWRConfig>
    )
}
