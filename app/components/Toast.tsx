'use client'
import { Icon } from '@iconify/react'
import { useEffect } from 'react'

interface ToastProps {
    isVisible: boolean
    message: string
    type: 'success' | 'error' | 'info' | 'warning'
    onCloseAction: () => void
}

export default function Toast({ isVisible, message, type, onCloseAction }: ToastProps) {
    useEffect(() => {
        if (isVisible) {
            const timer = setTimeout(() => {
                onCloseAction()
            }, 3000)
            return () => clearTimeout(timer)
        }
    }, [isVisible, onCloseAction])

    if (!isVisible) return null

    const config = {
        success: { bg: 'bg-green-500', icon: 'solar:check-circle-bold' },
        error: { bg: 'bg-red-500', icon: 'solar:danger-circle-bold' },
        info: { bg: 'bg-blue-500', icon: 'solar:info-circle-bold' },
        warning: { bg: 'bg-orange-500', icon: 'solar:danger-circle-bold' }
    }

    const { bg, icon } = config[type]

    return (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-6 py-3.5 rounded-full shadow-2xl text-white ${bg} animate-in slide-in-from-top-4 fade-in duration-300 min-w-[320px] max-w-[90vw]`}>
            <div className="bg-white/20 p-1.5 rounded-full">
                <Icon icon={icon} className="text-xl" />
            </div>
            <span className="font-bold text-sm sm:text-base flex-1">{message}</span>
            <button onClick={onCloseAction} className="opacity-70 hover:opacity-100 transition-opacity p-1">
                <Icon icon="solar:close-circle-bold" className="text-lg" />
            </button>
        </div>
    )
}
