'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Icon } from '@iconify/react'

export default function DashboardGlobalSearch({ initialValue = '' }: { initialValue?: string }) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const [svCode, setSvCode] = useState(initialValue)

    // Sync input with external URL changes if any
    useEffect(() => {
        setSvCode(initialValue)
    }, [initialValue])

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        const params = new URLSearchParams(searchParams.toString())
        if (svCode.trim()) {
            params.set('sv_code', svCode.trim())
        } else {
            params.delete('sv_code')
        }
        router.push(`${pathname}?${params.toString()}`, { scroll: false })
    }

    return (
        <form onSubmit={handleSearch} className="flex relative w-full md:w-96 group mt-4 md:mt-0">
            <Icon icon="solar:user-id-linear" className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg group-focus-within:text-indigo-500 transition-colors" />
            <input
                type="text"
                placeholder="ค้นหาด้วยรหัสผู้เก็บข้อมูล (เช่น SV001)..."
                value={svCode}
                onChange={(e) => setSvCode(e.target.value)}
                className="w-full pl-11 pr-24 py-3 md:py-3.5 bg-white/80 backdrop-blur-md border border-slate-200/80 hover:border-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 rounded-[1.5rem] outline-none text-sm font-bold transition-all shadow-[0_4px_20px_rgb(0,0,0,0.03)] focus:shadow-[0_4px_25px_rgb(79,70,229,0.15)] focus:bg-white text-slate-800 placeholder-slate-400"
            />
            <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-4 py-1.5 md:py-2 rounded-xl text-xs md:text-sm font-bold transition-colors"
            >
                ค้นหา
            </button>
        </form>
    )
}
