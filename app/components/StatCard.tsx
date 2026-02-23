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
    <div className="bg-white p-5 sm:p-6 md:p-8 rounded-[2rem] shadow-sm border border-slate-100 flex items-center gap-4 sm:gap-5 transition-all duration-300 hover:shadow-md hover:border-slate-200 hover:-translate-y-1 group">
      <div className={`${bg} ${color} p-4 sm:p-5 rounded-2xl sm:rounded-3xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
        <Icon icon={icon} className="text-3xl sm:text-4xl" />
      </div>
      <div>
        <p className="text-sm sm:text-base text-slate-500 font-semibold mb-1">{title}</p>
        <div className="flex items-baseline gap-1.5 sm:gap-2">
          <p className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 tracking-tight">{value}</p>
          {unit && <span className="text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-widest">{unit}</span>}
        </div>
      </div>
    </div>
  )
}