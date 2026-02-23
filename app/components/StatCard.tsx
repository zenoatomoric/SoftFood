'use client'
import { Icon } from '@iconify/react'

interface StatCardProps {
  title: string
  value: number | string
  unit?: string
  icon: string
  color: string // Tailwind text color class (e.g., 'text-blue-600')
  bg: string    // Tailwind bg color class (e.g., 'bg-blue-50')
}

export default function StatCard({ title, value, unit, icon, color, bg }: StatCardProps) {
  return (
    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex items-center gap-4 transition-transform hover:-translate-y-1">
      <div className={`${bg} ${color} p-4 rounded-2xl flex items-center justify-center`}>
        <Icon icon={icon} width="32" height="32"></Icon>
      </div>
      <div>
        <p className="text-sm text-slate-500 font-bold mb-1">{title}</p>
        <div className="flex items-baseline gap-1">
          <p className="text-3xl font-black text-slate-900">{value}</p>
          {unit && <span className="text-sm font-bold text-slate-400">{unit}</span>}
        </div>
      </div>
    </div>
  )
}