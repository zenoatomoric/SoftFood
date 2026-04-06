'use client'
import { Icon } from '@iconify/react'

interface CanalSummaryCardProps {
    canalName: string
    infoCount: number
    menuCount: number
    theme: {
        color: string
        bg: string
        iconBg: string
    }
}

export default function CanalSummaryCard({ canalName, infoCount, menuCount, theme }: CanalSummaryCardProps) {
    return (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col transition-all duration-200 hover:shadow-md hover:border-slate-300 group">
            <div className="flex items-center gap-4 mb-6">
                <div className={`${theme.iconBg} ${theme.color} w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shadow-inner transition-transform duration-200 group-hover:scale-105`}>
                    <Icon icon="solar:map-point-bold-duotone" className="text-2xl sm:text-3xl" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900">คลอง{canalName}</h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col justify-center">
                    <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">ผู้ให้ข้อมูล</p>
                    <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">{infoCount}</span>
                        <span className="text-[10px] font-bold text-slate-400">คน</span>
                    </div>
                </div>
                <div className={`${theme.bg} p-4 rounded-xl border border-blue-50/50 flex flex-col justify-center`}>
                    <p className={`text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-1 ${theme.color}`}>เมนูอาหาร</p>
                    <div className="flex items-baseline gap-1.5">
                        <span className={`text-2xl sm:text-3xl font-extrabold text-slate-900`}>{menuCount}</span>
                        <span className={`text-[10px] font-bold ${theme.color}`}>รายการ</span>
                    </div>
                </div>
            </div>
        </div>
    )
}