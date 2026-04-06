'use client'
import { Icon } from '@iconify/react'

interface StatCardProps {
  title: string
  value: number | string
  unit?: string
  icon: string
  color: string
  bg: string
}

export default function StatCard({ title, value, unit, icon, color, bg }: StatCardProps) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-5 transition-all duration-200 hover:shadow-md hover:border-slate-300 group">
      <div className={`${bg} ${color} w-14 h-14 sm:w-16 sm:h-16 shrink-0 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-105`}>
        <Icon icon={icon} className="text-3xl sm:text-4xl" />
      </div>
      <div>
        <p className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">{title}</p>
        <div className="flex items-baseline gap-2">
          <p className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">{value}</p>
          {unit && <span className="text-xs sm:text-sm font-bold text-slate-400">{unit}</span>}
        </div>
      </div>
    </div>
  )
}