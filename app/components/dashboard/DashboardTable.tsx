'use client'
import { useState, useEffect, useMemo } from 'react'
import { Icon } from '@iconify/react'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'

interface FoodItem {
    menu_id: string
    menu_name: string
    category: string
    selection_status: string[]
    created_at: string
    informant_name: string
    canal_zone: string
    surveyor_name: string
    thumbnail: string | null
    ref_sv_code: string
}

const CANALS = ['บางเขน', 'เปรมประชากร', 'ลาดพร้าว']
const CATEGORIES = ['อาหารคาว', 'อาหารหวาน', 'เครื่องดื่ม', 'อื่นๆ']
const STATUS_OPTIONS = [
    { label: 'มรดกภูมิปัญญาฯ (108)', value: '108' },
    { label: 'คัดเลือกเบื้องต้น (93)', value: '93' },
    { label: 'คัดเลือกแล้ว (36)', value: '36' }
]

export default function DashboardTable() {
    const router = useRouter()
    const [page, setPage] = useState(1)
    const [search, setSearch] = useState('')
    const [debouncedSearch, setDebouncedSearch] = useState('')
    const [canalFilter, setCanalFilter] = useState('')
    const [categoryFilter, setCategoryFilter] = useState('')
    const [statusFilter, setStatusFilter] = useState('')

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 500)
        return () => clearTimeout(timer)
    }, [search])

    useEffect(() => {
        setPage(1)
    }, [debouncedSearch, canalFilter, categoryFilter, statusFilter])

    const fetchUrl = useMemo(() => {
        const params = new URLSearchParams()
        if (debouncedSearch) params.set('q', debouncedSearch)
        if (canalFilter) params.set('canal', canalFilter)
        if (categoryFilter) params.set('category', categoryFilter)
        if (statusFilter) params.set('status', statusFilter)
        params.set('page', page.toString())
        params.set('limit', '10')
        return `/api/food?${params.toString()}`
    }, [debouncedSearch, canalFilter, categoryFilter, statusFilter, page])

    const { data: swrData, error: swrError, isLoading } = useSWR(fetchUrl)
    const menus = swrData?.data || []
    const totalPages = swrData?.totalPages || 1

    // useEffect(() => {
    //     if (swrError) console.error('[DashboardTable] SWR Error:', swrError)
    //     if (swrData) {
    //         console.log('[DashboardTable] SWR Success:', {
    //             items: swrData.data?.length,
    //             total: swrData.total,
    //             debug: swrData.debug_info
    //         })
    //     }
    // }, [swrError, swrData])

    // console.log('[DashboardTable] Current State:', {
    //     debouncedSearch, canalFilter, categoryFilter, statusFilter, page,
    //     isLoading, hasError: !!swrError
    // })

    return (
        <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
            {/* Header & Filters */}
            <div className="p-5 md:p-8 border-b border-slate-100 space-y-5 md:space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h2 className="text-xl md:text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="bg-indigo-100 p-2.5 rounded-xl text-indigo-600">
                            <Icon icon="solar:list-bold-duotone" />
                        </div>
                        รายการข้อมูลทั้งหมด
                    </h2>
                    <div className="relative w-full md:w-80">
                        <Icon icon="solar:magnifer-linear" className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg" />
                        <input
                            type="text"
                            placeholder="ค้นหาชื่อเมนู / ผู้เก็บข้อมูล..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 md:py-3.5 bg-slate-50 border-2 border-transparent hover:border-slate-200 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-50 rounded-2xl outline-none text-sm font-semibold transition-all"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                    <FilterDropdown label="คลอง / พื้นที่" value={canalFilter} onChange={setCanalFilter} options={CANALS} icon="solar:map-point-linear" />
                    <FilterDropdown label="ประเภทอาหาร" value={categoryFilter} onChange={setCategoryFilter} options={CATEGORIES} icon="solar:chef-hat-linear" />
                    <FilterDropdown label="สถานะการคัดเลือก" value={statusFilter} onChange={setStatusFilter} options={STATUS_OPTIONS.map(o => o.value)} optionLabels={STATUS_OPTIONS} icon="solar:verified-check-linear" />
                </div>
            </div>

            {/* Content Area */}
            <div className="min-h-[400px] bg-slate-50/30">
                {isLoading ? (
                    <div className="py-24 flex flex-col items-center gap-3">
                        <Icon icon="solar:refresh-linear" className="text-4xl text-indigo-500 animate-spin" />
                        <span className="text-sm font-bold text-slate-500">กำลังโหลดข้อมูล...</span>
                    </div>
                ) : menus.length === 0 ? (
                    <div className="py-24 flex flex-col items-center gap-3">
                        <Icon icon="solar:ghost-linear" className="text-5xl text-slate-200" />
                        <span className="text-sm font-bold text-slate-400">ไม่พบข้อมูลที่ค้นหา</span>
                    </div>
                ) : (
                    <>
                        {/* 📱 1. โหมดมือถือ: แสดงผลเป็น Card (ซ่อนในจอใหญ่) */}
                        <div className="grid grid-cols-1 gap-3 p-4 md:hidden">
                            {menus.map((item: FoodItem) => (
                                <div
                                    key={item.menu_id}
                                    onClick={() => router.push(`/menus/${item.menu_id}`)}
                                    className="bg-white border border-slate-200/80 p-4 rounded-[1.5rem] flex gap-4 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all active:scale-[0.98]"
                                >
                                    {/* Thumbnail */}
                                    <div className="w-20 h-20 rounded-2xl bg-slate-100 shrink-0 overflow-hidden border border-slate-100">
                                        {item.thumbnail ? (
                                            <img src={item.thumbnail} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                <Icon icon="solar:gallery-wide-linear" className="text-2xl" />
                                            </div>
                                        )}
                                    </div>

                                    {/* รายละเอียด */}
                                    <div className="flex flex-col justify-between flex-1 min-w-0 py-0.5">
                                        <div>
                                            <h3 className="text-base font-bold text-slate-900 truncate">{item.menu_name}</h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">{item.category}</span>
                                                <span className="flex items-center gap-1 text-[11px] font-bold text-slate-700 truncate">
                                                    <Icon icon="solar:map-point-bold-duotone" className="text-indigo-500 text-sm" />
                                                    คลอง{item.canal_zone}
                                                </span>
                                            </div>
                                            <div className="text-[11px] text-slate-500 font-medium mt-1 truncate">
                                                ผู้ให้ข้อมูล: {item.informant_name}
                                            </div>
                                        </div>

                                        {/* Status Tags */}
                                        <div className="mt-2 flex flex-wrap gap-1.5">
                                            {item.selection_status?.length > 0 ? (
                                                item.selection_status.map(s => (
                                                    <span key={s} className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-tight ${s === '36' ? 'bg-emerald-100 text-emerald-700' :
                                                        s === '93' ? 'bg-indigo-100 text-indigo-700' :
                                                            'bg-amber-100 text-amber-700'
                                                        }`}>
                                                        {s}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-[10px] text-slate-400 font-semibold bg-slate-100 px-2 py-0.5 rounded-md">ยังไม่ได้เลือก</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* 💻 2. โหมด Desktop: แสดงผลเป็น Table (ซ่อนในมือถือ) */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-left border-collapse bg-white">
                                <thead>
                                    <tr className="bg-slate-50/80 text-[11px] lg:text-xs font-bold text-slate-500 uppercase tracking-widest border-y border-slate-100">
                                        <th className="px-6 py-4 w-20">รูป</th>
                                        <th className="px-6 py-4">ชื่อเมนูอาหาร</th>
                                        <th className="px-6 py-4">พื้นที่ / ผู้ให้ข้อมูล</th>
                                        <th className="px-6 py-4">ผู้เก็บข้อมูล</th>
                                        <th className="px-6 py-4">สถานะ</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {menus.map((item: FoodItem) => (
                                        <tr
                                            key={item.menu_id}
                                            onClick={() => router.push(`/menus/${item.menu_id}`)}
                                            className="hover:bg-indigo-50/40 cursor-pointer transition-colors group"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="w-14 h-14 rounded-2xl bg-slate-100 overflow-hidden border border-slate-200 group-hover:shadow-md transition-shadow shrink-0">
                                                    {item.thumbnail ? (
                                                        <img src={item.thumbnail} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                            <Icon icon="solar:gallery-wide-linear" className="text-2xl" />
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm lg:text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors leading-tight mb-1">{item.menu_name}</div>
                                                <div className="inline-block px-2.5 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-md">{item.category}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-1.5 text-sm font-bold text-slate-800 mb-1">
                                                    <Icon icon="solar:map-point-bold-duotone" className="text-indigo-500 text-base" />
                                                    คลอง{item.canal_zone}
                                                </div>
                                                <div className="text-xs text-slate-500 font-medium truncate max-w-[200px]">{item.informant_name}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-xs font-semibold text-slate-600">
                                                {item.surveyor_name}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-wrap gap-1.5">
                                                    {item.selection_status?.length > 0 ? (
                                                        item.selection_status.map(s => (
                                                            <span key={s} className={`text-[10px] lg:text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-tight ${s === '36' ? 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200' :
                                                                s === '93' ? 'bg-indigo-100 text-indigo-700 ring-1 ring-indigo-200' :
                                                                    'bg-amber-100 text-amber-700 ring-1 ring-amber-200'
                                                                }`}>
                                                                {s}
                                                            </span>
                                                        ))
                                                    ) : (
                                                        <span className="text-[10px] text-slate-400 font-semibold bg-slate-100 px-2.5 py-1 rounded-full">ยังไม่ได้เลือก</span>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>

            {/* Pagination */}
            <div className="p-4 md:p-6 border-t border-slate-100 bg-white flex flex-col md:flex-row items-center justify-between gap-4">
                <p className="text-xs md:text-sm font-bold text-slate-500">หน้า {page} จาก {totalPages}</p>
                <div className="flex gap-2 w-full md:w-auto justify-center">
                    <button
                        disabled={page === 1 || isLoading}
                        onClick={() => setPage(p => p - 1)}
                        className="flex-1 md:flex-none w-auto md:w-11 h-10 md:h-11 px-4 md:px-0 rounded-xl border-2 border-slate-200 flex items-center justify-center bg-white text-slate-600 hover:border-indigo-500 hover:text-indigo-600 hover:shadow-md transition-all disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:shadow-none"
                    >
                        <Icon icon="solar:alt-arrow-left-linear" className="text-xl" />
                    </button>
                    <button
                        disabled={page === totalPages || isLoading}
                        onClick={() => setPage(p => p + 1)}
                        className="flex-1 md:flex-none w-auto md:w-11 h-10 md:h-11 px-4 md:px-0 rounded-xl border-2 border-slate-200 flex items-center justify-center bg-white text-slate-600 hover:border-indigo-500 hover:text-indigo-600 hover:shadow-md transition-all disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:shadow-none"
                    >
                        <Icon icon="solar:alt-arrow-right-linear" className="text-xl" />
                    </button>
                </div>
            </div>
        </div>
    )
}

function FilterDropdown({ label, value, onChange, options, optionLabels, icon }: any) {
    const [isOpen, setIsOpen] = useState(false)
    const selectedLabel = optionLabels ? optionLabels.find((o: any) => o.value === value)?.label : value

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full flex items-center justify-between px-4 py-3 bg-white border-2 rounded-2xl text-sm font-bold transition-all shadow-sm ${isOpen ? 'border-indigo-500 ring-4 ring-indigo-50' : 'border-slate-100 hover:border-slate-200'}`}
            >
                <div className="flex items-center gap-2">
                    <Icon icon={icon} className={`text-lg ${value ? 'text-indigo-600' : 'text-slate-400'}`} />
                    <span className={value ? 'text-slate-800' : 'text-slate-500'}>{selectedLabel || label}</span>
                </div>
                <Icon icon="solar:alt-arrow-down-linear" className={`text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180 text-indigo-500' : ''}`} />
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-xl shadow-slate-200/50 z-20 overflow-hidden max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
                        <div className="py-2">
                            <button
                                onClick={() => { onChange(''); setIsOpen(false) }}
                                className={`w-full px-5 py-3 text-left text-xs md:text-sm font-bold hover:bg-slate-50 transition-colors ${!value ? 'text-indigo-600 bg-indigo-50/50' : 'text-slate-500'}`}
                            >
                                ทั้งหมด
                            </button>
                            {options.map((opt: any) => {
                                const optLabel = optionLabels ? optionLabels.find((o: any) => o.value === opt)?.label : opt
                                return (
                                    <button
                                        key={opt}
                                        onClick={() => { onChange(opt); setIsOpen(false) }}
                                        className={`w-full px-5 py-3 text-left text-xs md:text-sm font-bold hover:bg-slate-50 transition-colors ${value === opt ? 'text-indigo-600 bg-indigo-50/50' : 'text-slate-700'}`}
                                    >
                                        {optLabel}
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}