'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Icon } from '@iconify/react'

const CANALS = [
  {
    id: 'บางเขน',
    label: 'คลองบางเขน',
    icon: 'solar:map-point-bold-duotone',
    color: 'text-red-500',
    bg: 'bg-red-50',
    border: 'border-red-200',
    ring: 'ring-red-500'
  },
  {
    id: 'เปรมประชากร',
    label: 'คลองเปรมประชากร',
    icon: 'solar:map-point-bold-duotone',
    color: 'text-emerald-500',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    ring: 'ring-emerald-500'
  },
  {
    id: 'ลาดพร้าว',
    label: 'คลองลาดพร้าว',
    icon: 'solar:map-point-bold-duotone',
    color: 'text-sky-500',
    bg: 'bg-sky-50',
    border: 'border-sky-200',
    ring: 'ring-sky-500'
  },
]

export default function SurveyLandingPage() {
  const [selectedCanal, setSelectedCanal] = useState<string | null>(null)

  return (
    <div className="h-full flex flex-col items-center justify-center text-center space-y-8 animate-in zoom-in-95 duration-500 max-w-4xl mx-auto px-4">
      <div className="space-y-4">
        <div className="bg-blue-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
          <Icon icon="solar:clipboard-list-bold-duotone" width="40" className="text-blue-600" />
        </div>

        <div>
          <h1 className="text-3xl font-black text-slate-900 mb-2">เลือกพื้นที่เก็บข้อมูล</h1>
          <p className="text-slate-500 text-lg">
            โปรดระบุคลองที่คุณกำลังจะลงพื้นที่เก็บข้อมูล
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
        {CANALS.map((canal) => (
          <button
            key={canal.id}
            onClick={() => setSelectedCanal(canal.id)}
            className={`
              relative p-6 rounded-3xl border-2 transition-all duration-200 hover:-translate-y-1 group
              ${selectedCanal === canal.id
                ? `bg-white ${canal.border} ${canal.ring} ring-2 shadow-xl scale-105`
                : 'bg-white border-slate-100 hover:border-slate-200 hover:shadow-lg shadow-sm'
              }
            `}
          >
            <div className={`w-14 h-14 rounded-2xl ${canal.bg} ${canal.color} flex items-center justify-center mx-auto mb-4 transition-transform group-hover:scale-110`}>
              <Icon icon={canal.icon} width="28" />
            </div>
            <h3 className={`font-bold text-lg ${selectedCanal === canal.id ? 'text-slate-900' : 'text-slate-600'}`}>
              {canal.label}
            </h3>

            {selectedCanal === canal.id && (
              <div className={`absolute top-4 right-4 ${canal.color}`}>
                <Icon icon="solar:check-circle-bold" width="24" />
              </div>
            )}
          </button>
        ))}
      </div>

      <div className="pt-8 w-full max-w-md">
        <Link
          href={selectedCanal ? `/survey/part1?canal=${encodeURIComponent(selectedCanal)}` : '#'}
          className={`
            w-full flex items-center justify-center gap-3 px-8 py-4 rounded-xl font-bold text-xl transition-all
            ${selectedCanal
              ? 'bg-gray-900 text-white shadow-xl shadow-gray-900/20 hover:bg-black hover:scale-105'
              : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }
          `}
          aria-disabled={!selectedCanal}
          onClick={(e) => !selectedCanal && e.preventDefault()}
        >
          {selectedCanal ? (
            <>
              <Icon icon="solar:play-circle-bold" width="24" />
              เริ่มเก็บข้อมูล
            </>
          ) : (
            <>
              <Icon icon="solar:lock-keyhole-bold-duotone" width="24" />
              กรุณาเลือกพื้นที่
            </>
          )}
        </Link>
      </div>
    </div>
  )
}