'use client'
import { useState, useEffect, useMemo } from 'react'
import { Icon } from '@iconify/react'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import Pagination from '@/app/components/Pagination'

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
const CATEGORIES = ['อาหารคาว', 'อาหารหวาน', 'อาหารว่าง/เครื่องดื่ม']
const STATUS_OPTIONS = [
    { label: '108 รายการ', value: '108' },
    { label: '93 รายการ', value: '93' },
    { label: '36 รายการ', value: '36' },
    { label: 'ซิกเนเจอร์', value: 'ซิกเนเจอร์' }
]

export default function DashboardTable({ svCode }: { svCode?: string }) {
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
    }, [debouncedSearch, canalFilter, categoryFilter, statusFilter, svCode])

    const fetchUrl = useMemo(() => {
        const params = new URLSearchParams()
        if (debouncedSearch) params.set('q', debouncedSearch)
        if (canalFilter) params.set('canal', canalFilter)
        if (categoryFilter) params.set('category', categoryFilter)
        if (statusFilter) params.set('status', statusFilter)
        if (svCode) params.set('sv_code', svCode)
        params.set('page', page.toString())
        params.set('limit', '10')
        return `/api/food?${params.toString()}`
    }, [debouncedSearch, canalFilter, categoryFilter, statusFilter, page, svCode])

    const { data: swrData, error: swrError, isLoading } = useSWR(fetchUrl)
    const menus = swrData?.data || []
    const totalPages = swrData?.totalPages || 1

    return (
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
            {/* Header & Filters */}
            <div className="p-5 md:p-8 border-b border-slate-100 space-y-5 md:space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h2 className="text-xl md:text-2xl font-bold text-slate-800 flex items-center gap-3">
                        <div className="bg-indigo-50 p-2.5 rounded-xl text-indigo-600 border border-indigo-100">
                            <Icon icon="solar:list-bold-duotone" />
                        </div>
                        รายการข้อมูลทั้งหมด
                    </h2>
                    <div className="relative w-full md:w-80 group">
                        <Icon icon="solar:magnifer-linear" className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg group-focus-within:text-indigo-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="ค้นหาชื่อเมนู..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 rounded-xl outline-none text-sm font-medium transition-all text-slate-700 placeholder-slate-400"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                    <FilterDropdown 
                        id="canal"
                        label="คลอง / พื้นที่" 
                        value={canalFilter} 
                        onChange={setCanalFilter} 
                        options={CANALS.map(c => ({ label: `คลอง${c}`, value: c }))} 
                        icon="solar:map-point-linear" 
                    />
                    <FilterDropdown 
                        id="category"
                        label="ประเภทอาหาร" 
                        value={categoryFilter} 
                        onChange={setCategoryFilter} 
                        options={CATEGORIES.map(c => ({ label: c, value: c }))} 
                        icon="solar:chef-hat-linear" 
                    />
                    <FilterDropdown 
                        id="status"
                        label="สถานะการคัดเลือก" 
                        value={statusFilter} 
                        onChange={setStatusFilter} 
                        options={STATUS_OPTIONS} 
                        icon="solar:verified-check-linear" 
                    />
                </div>
            </div>

            {/* Content Area */}
            <div className="min-h-[400px] bg-slate-50/10">
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
                                    className="bg-white border border-slate-100 p-4 rounded-2xl flex gap-4 shadow-sm active:scale-[0.98] transition-all"
                                >
                                    {/* Thumbnail */}
                                    <div className="w-20 h-20 rounded-xl bg-slate-50 shrink-0 overflow-hidden border border-slate-100">
                                        {item.thumbnail ? (
                                            <img src={item.thumbnail} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-200">
                                                <Icon icon="solar:gallery-wide-linear" className="text-2xl" />
                                            </div>
                                        )}
                                    </div>

                                    {/* รายละเอียด */}
                                    <div className="flex flex-col justify-between flex-1 min-w-0 py-0.5">
                                        <div>
                                            <h3 className="text-base font-bold text-slate-800 truncate">{item.menu_name}</h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">{item.category}</span>
                                                <span className="flex items-center gap-1 text-[11px] font-bold text-slate-600 truncate">
                                                    <Icon icon="solar:map-point-bold-duotone" className="text-indigo-500 text-sm" />
                                                    คลอง{item.canal_zone}
                                                </span>
                                            </div>
                                            <div className="text-[11px] text-slate-500 font-medium mt-1 truncate">
                                                ปราชญ์: {item.informant_name}
                                            </div>
                                        </div>

                                        <div className="mt-2 flex flex-wrap gap-1">
                                            {item.selection_status?.length > 0 ? (
                                                item.selection_status.map(s => (
                                                    <span key={s} className={`text-[9px] px-2 py-0.5 rounded-full font-bold border ${
                                                        s === '36' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                        s === '93' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                                                        'bg-amber-50 text-amber-600 border-amber-100'
                                                    }`}>
                                                        {s}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-[9px] text-slate-400 font-bold bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">รอดำเนินการ</span>
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
                                    <tr className="bg-slate-50/50 text-[11px] font-bold text-slate-400 uppercase tracking-widest border-y border-slate-100">
                                        <th className="px-6 py-4 w-20">รูป</th>
                                        <th className="px-6 py-4">ชื่อเมนูอาหาร</th>
                                        <th className="px-6 py-4">พื้นที่ / ผู้ให้ข้อมูล</th>
                                        <th className="px-6 py-4">ผู้เก็บข้อมูล</th>
                                        <th className="px-6 py-4">สถานะ</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {menus.map((item: FoodItem) => (
                                        <tr
                                            key={item.menu_id}
                                            onClick={() => router.push(`/menus/${item.menu_id}`)}
                                            className="hover:bg-slate-50/50 cursor-pointer transition-all group"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="w-12 h-12 rounded-xl bg-slate-50 overflow-hidden border border-slate-100 group-hover:scale-105 transition-transform">
                                                    {item.thumbnail ? (
                                                        <img src={item.thumbnail} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-slate-200">
                                                            <Icon icon="solar:gallery-wide-linear" className="text-xl" />
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-bold text-slate-800 group-hover:text-indigo-600 transition-colors mb-0.5">{item.menu_name}</div>
                                                <div className="inline-block px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-bold rounded-md">{item.category}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-1.5 text-sm font-bold text-slate-700 mb-0.5">
                                                    <Icon icon="solar:map-point-bold-duotone" className="text-indigo-500 text-base" />
                                                    คลอง{item.canal_zone}
                                                </div>
                                                <div className="text-xs text-slate-400 truncate max-w-[150px] font-medium">{item.informant_name}</div>
                                            </td>
                                            <td className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-tighter">
                                                {item.surveyor_name}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-wrap gap-1.5">
                                                    {item.selection_status?.length > 0 ? (
                                                        item.selection_status.map(s => (
                                                            <span key={s} className={`text-[10px] px-2.5 py-1 rounded-full font-bold border ${
                                                                s === '36' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                                s === '93' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                                                                'bg-amber-50 text-amber-600 border-amber-100'
                                                            }`}>
                                                                {s}
                                                            </span>
                                                        ))
                                                    ) : (
                                                        <span className="text-[10px] text-slate-400 font-bold bg-slate-50 px-2.5 py-1 rounded-full border border-slate-100">รอดำเนินการ</span>
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

            <div className="p-4 bg-white border-t border-slate-100">
                <Pagination 
                    currentPage={page} 
                    totalPages={totalPages} 
                    onPageChangeAction={setPage} 
                    isLoading={isLoading} 
                />
            </div>
        </div>
    )
}

function FilterDropdown({ id, label, value, onChange, options, icon }: any) {
    const [isOpen, setIsOpen] = useState(false)
    const selectedOption = options.find((o: any) => o.value === value)

    return (
        <div className="relative">
            <div
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full pl-10 pr-10 py-2.5 text-sm md:text-base rounded-xl border outline-none text-slate-600 bg-white cursor-pointer hover:bg-slate-50 transition-all flex items-center justify-between
                ${isOpen ? 'border-indigo-500 ring-4 ring-indigo-50' : 'border-slate-200'}`}
            >
                <Icon icon={icon} className={`absolute left-3 text-lg ${isOpen ? 'text-indigo-500' : 'text-slate-400'}`} />
                <span className={value ? 'text-slate-800 font-bold' : 'text-slate-400'}>
                    {value ? selectedOption?.label : label}
                </span>
                <Icon icon="solar:alt-arrow-down-linear" className={`absolute right-3 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180 text-indigo-500' : ''}`} />
            </div>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)}></div>
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-20 animate-in fade-in zoom-in-95 duration-200">
                        <div className="max-h-60 overflow-y-auto py-1">
                            <div
                                onClick={() => { onChange(''); setIsOpen(false) }}
                                className={`px-4 py-2.5 text-sm cursor-pointer hover:bg-indigo-50 transition-colors flex items-center justify-between
                                ${value === '' ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-slate-600'}`}
                            >
                                <span>ทั้งหมด</span>
                                {value === '' && <Icon icon="solar:check-circle-bold" />}
                            </div>
                            {options.map((opt: any) => (
                                <div
                                    key={opt.value}
                                    onClick={() => { onChange(opt.value); setIsOpen(false) }}
                                    className={`px-4 py-2.5 text-sm cursor-pointer hover:bg-indigo-50 transition-colors flex items-center justify-between
                                    ${value === opt.value ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-slate-600'}`}
                                >
                                    <span>{opt.label}</span>
                                    {value === opt.value && <Icon icon="solar:check-circle-bold" />}
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}