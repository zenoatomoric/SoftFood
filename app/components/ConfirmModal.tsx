'use client'

import { Icon } from '@iconify/react'

interface ConfirmModalProps {
    isOpen: boolean
    title: string
    message: string
    confirmText?: string
    cancelText?: string
    type?: 'info' | 'danger' | 'success' | 'warning'
    onConfirm: () => void
    onCancel: () => void
    icon?: string
}

export default function ConfirmModal({
    isOpen,
    title,
    message,
    confirmText = 'ยืนยัน',
    cancelText = 'ยกเลิก',
    type = 'info',
    onConfirm,
    onCancel,
    icon
}: ConfirmModalProps) {
    if (!isOpen) return null

    const colors = {
        info: {
            bg: 'bg-blue-50',
            text: 'text-blue-600',
            btn: 'bg-blue-600',
            hover: 'hover:bg-blue-700',
            shadow: 'shadow-blue-600/20',
            defaultIcon: 'solar:check-circle-bold-duotone'
        },
        danger: {
            bg: 'bg-red-50',
            text: 'text-red-500',
            btn: 'bg-red-500',
            hover: 'hover:bg-red-600',
            shadow: 'shadow-red-500/20',
            defaultIcon: 'solar:trash-bin-trash-bold-duotone'
        },
        success: {
            bg: 'bg-green-50',
            text: 'text-green-600',
            btn: 'bg-green-600',
            hover: 'hover:bg-green-700',
            shadow: 'shadow-green-600/20',
            defaultIcon: 'solar:check-circle-bold-duotone'
        },
        warning: {
            bg: 'bg-orange-50',
            text: 'text-orange-600',
            btn: 'bg-orange-600',
            hover: 'hover:bg-orange-700',
            shadow: 'shadow-orange-600/20',
            defaultIcon: 'solar:danger-circle-bold-duotone'
        }
    }

    const style = colors[type]
    const displayIcon = icon || style.defaultIcon

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white p-6 rounded-3xl shadow-2xl w-full max-w-sm animate-in zoom-in-95 duration-200 text-center">
                <div className={`w-16 h-16 ${style.bg} ${style.text} rounded-full flex items-center justify-center mx-auto mb-4`}>
                    <Icon icon={displayIcon} width="32" />
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-2">
                    {title}
                </h3>
                <p className="text-slate-500 mb-6 font-medium whitespace-pre-line">
                    {message}
                </p>

                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 bg-slate-100 text-slate-600 py-3 rounded-xl font-bold hover:bg-slate-200 transition-all"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`flex-1 ${style.btn} text-white py-3 rounded-xl font-bold shadow-lg ${style.shadow} ${style.hover} transition-all flex justify-center items-center gap-2`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    )
}
