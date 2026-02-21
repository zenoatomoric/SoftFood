'use client'
import { Icon } from '@iconify/react'

export default function Loading() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-400">
            <div className="relative mb-6">
                <div className="w-16 h-16 border-4 border-slate-100 border-t-indigo-500 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <Icon icon="solar:command-bold" className="text-xl text-slate-300" />
                </div>
            </div>
            <h3 className="text-lg font-bold text-slate-600 animate-pulse">กำลังโหลดข้อมูล...</h3>
            <p className="text-sm font-medium opacity-70">เตรียมความพร้อมระบบเพื่อคุณ</p>
        </div>
    )
}
