'use client'
import { useState, useEffect, useMemo } from 'react'
import { Icon } from '@iconify/react'
import { useRouter } from 'next/navigation'
import ConfirmModal from '@/app/components/ConfirmModal'
import Toast from '@/app/components/Toast'
import useSWR from 'swr'

interface Informant {
    info_id: string
    full_name: string
    friendly_id: string
    canal_zone: string
    phone: string
    age: number
    address_full: string
    created_at: string
    last_edited_at?: string
    creator_name?: string
    editor_name?: string
}

interface Props {
    userRole: string
    userId: string
}

export default function InformantsClient({ userRole, userId }: Props) {
    const router = useRouter()
    const [page, setPage] = useState(1)
    const limit = 20

    // Filters
    const [search, setSearch] = useState('')
    const [debouncedSearch, setDebouncedSearch] = useState('')
    const [mineFilter, setMineFilter] = useState(false)

    // SWR Data Fetching
    const fetchUrl = useMemo(() => {
        const params = new URLSearchParams()
        if (debouncedSearch) params.set('search', debouncedSearch)
        if (mineFilter) params.set('mine', 'true')
        params.set('page', page.toString())
        params.set('limit', limit.toString())
        return `/api/survey/informant?${params.toString()}`
    }, [debouncedSearch, page, limit])

    const { data: swrData, error, isLoading, mutate } = useSWR(fetchUrl)

    const informants = swrData?.data || []
    const total = swrData?.total || 0
    const totalPages = swrData?.totalPages || 1

    // UI Feedback
    const [confirmConfig, setConfirmConfig] = useState<{
        isOpen: boolean; title: string; message: string; type: 'info' | 'danger' | 'success' | 'warning';
        onConfirm: () => void
    }>({ isOpen: false, title: '', message: '', type: 'info', onConfirm: () => { } })

    const [toast, setToast] = useState<{ show: boolean, msg: string, type: 'success' | 'error' | 'info' }>({ show: false, msg: '', type: 'success' })

    // Edit Modal
    const [editModal, setEditModal] = useState<{ isOpen: boolean, data: Informant | null }>({ isOpen: false, data: null })
    const [formLoading, setFormLoading] = useState(false)

    // Debounce Search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search)
            setPage(1)
        }, 500)
        return () => clearTimeout(timer)
    }, [search])

    // Handlers
    const handleDelete = (id: string, name: string) => {
        setConfirmConfig({
            isOpen: true,
            title: 'ยืนยันการลบ',
            message: `คุณต้องการลบข้อมูลของ "${name}" ใช่หรือไม่?\nการกระทำนี้ไม่สามารถย้อนกลับได้`,
            type: 'danger',
            onConfirm: async () => {
                setConfirmConfig(prev => ({ ...prev, isOpen: false }))
                try {
                    const res = await fetch(`/api/survey/informant?id=${id}`, { method: 'DELETE' })
                    if (res.ok) {
                        setToast({ show: true, msg: 'ลบข้อมูลสำเร็จ', type: 'success' })
                        mutate() // Refresh SWR data
                    } else {
                        const json = await res.json()
                        setToast({ show: true, msg: json.error || 'ลบข้อมูลไม่สำเร็จ', type: 'error' })
                    }
                } catch (err) {
                    setToast({ show: true, msg: 'เกิดข้อผิดพลาด', type: 'error' })
                }
            }
        })
    }

    // Navigation to Detail Page
    const handleEdit = (info: Informant) => {
        if (userRole !== 'admin' && userRole !== 'director') return
        router.push(`/informants/${info.info_id}`)
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <ConfirmModal {...confirmConfig} onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))} />
            <Toast isVisible={toast.show} message={toast.msg} type={toast.type} onCloseAction={() => setToast(prev => ({ ...prev, show: false }))} />

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Icon icon="solar:users-group-two-rounded-bold-duotone" className="text-indigo-600" />
                        ข้อมูลผู้ให้ข้อมูล
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">จัดการข้อมูลผู้ให้ข้อมูลและปราชญ์ชาวบ้าน</p>
                </div>

                {(userRole === 'admin' || userRole === 'director') && (
                    <div className="flex bg-slate-100 p-1 rounded-xl">
                        <button
                            onClick={() => setMineFilter(false)}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${!mineFilter ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <Icon icon="solar:globus-bold" /> ทั้งหมด
                        </button>
                        <button
                            onClick={() => setMineFilter(true)}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${mineFilter ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <Icon icon="solar:user-circle-bold" /> ของฉัน
                        </button>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                {/* Search & Filter */}
                <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-50/50">
                    <div className="relative w-full sm:w-96">
                        <Icon icon="solar:magnifer-linear" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg" />
                        <input
                            type="text"
                            placeholder="ค้นหาชื่อ, รหัส, เบอร์โทร..."
                            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all text-sm"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 text-slate-600 text-[10px] md:text-xs uppercase font-black tracking-widest border-b border-slate-100">
                                <th className="p-4 whitespace-nowrap">ID / รหัส</th>
                                <th className="p-4">ชื่อ-นามสกุล</th>
                                <th className="p-4 hidden lg:table-cell">พื้นที่ / เขต</th>
                                <th className="p-4 hidden md:table-cell">เบอร์โทรศัพท์</th>
                                <th className="p-4 hidden md:table-cell">ผู้เก็บข้อมูล</th>
                                <th className="p-4 hidden xl:table-cell">ผู้แก้ไขล่าสุด</th>
                                <th className="p-4 hidden sm:table-cell">วันที่บันทึก</th>
                                <th className="p-4 text-right">จัดการ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 text-sm text-slate-700">
                            {isLoading ? (
                                Array.from({ length: 8 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="p-4"><div className="h-4 bg-slate-100 rounded w-16"></div></td>
                                        <td className="p-4"><div className="h-4 bg-slate-100 rounded w-32"></div></td>
                                        <td className="p-4 hidden lg:table-cell"><div className="h-4 bg-slate-100 rounded w-24"></div></td>
                                        <td className="p-4 hidden md:table-cell"><div className="h-4 bg-slate-100 rounded w-28"></div></td>
                                        <td className="p-4 hidden md:table-cell"><div className="h-4 bg-slate-100 rounded w-24"></div></td>
                                        <td className="p-4 hidden xl:table-cell"><div className="h-4 bg-slate-100 rounded w-24"></div></td>
                                        <td className="p-4 hidden sm:table-cell"><div className="h-4 bg-slate-100 rounded w-20"></div></td>
                                        <td className="p-4 text-right"><div className="h-8 w-16 bg-slate-100 rounded ml-auto"></div></td>
                                    </tr>
                                ))
                            ) : informants.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="p-12 text-center text-slate-400">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center">
                                                <Icon icon="solar:database-off-bold-duotone" className="text-4xl opacity-20" />
                                            </div>
                                            <span className="font-bold">ไม่พบข้อมูลผู้ให้ข้อมูล</span>
                                            <p className="text-xs max-w-xs">ลองเปลี่ยนคำค้นหา หรือกรองข้อมูลใหม่ดูอีกครั้งครับ</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                informants.map((item: Informant) => (
                                    <tr
                                        key={item.info_id}
                                        onClick={() => handleEdit(item)}
                                        className={`hover:bg-indigo-50/30 transition-all duration-200 group border-l-4 border-l-transparent ${userRole === 'admin' || userRole === 'director' ? 'cursor-pointer hover:border-l-indigo-500' : 'cursor-default'}`}
                                    >
                                        {/* ID Column */}
                                        <td className="p-4">
                                            <div className="text-[11px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md border border-indigo-100 w-fit tabular-nums">
                                                {item.friendly_id || 'NO-ID'}
                                            </div>
                                        </td>

                                        {/* Name Column */}
                                        <td className="p-4">
                                            <div className="font-bold text-slate-800 group-hover:text-indigo-900 transition-colors truncate max-w-[150px] md:max-w-[200px]">
                                                {item.full_name}
                                            </div>
                                            {/* Mobile-only info summary */}
                                            <div className="flex flex-col gap-0.5 mt-1 md:hidden">
                                                <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                                                    <Icon icon="solar:phone-bold" className="text-slate-300" />
                                                    {item.phone || '-'}
                                                </div>
                                                <div className="flex items-center gap-1.5 text-[10px] text-indigo-500 font-bold">
                                                    <Icon icon="solar:user-bold" className="text-indigo-300" />
                                                    {item.creator_name || 'ไม่ระบุ'}
                                                </div>
                                            </div>
                                        </td>

                                        {/* Area Column */}
                                        <td className="p-4 hidden lg:table-cell">
                                            <div className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                                                <span className="font-medium text-slate-600">คลอง{item.canal_zone || '-'}</span>
                                            </div>
                                        </td>

                                        {/* Phone Column */}
                                        <td className="p-4 hidden md:table-cell">
                                            <div className="flex items-center gap-1.5 text-slate-600 font-medium whitespace-nowrap">
                                                <Icon icon="solar:phone-linear" className="text-slate-400" />
                                                {item.phone || '-'}
                                            </div>
                                        </td>

                                        {/* Creator Column */}
                                        <td className="p-4 hidden md:table-cell">
                                            <div className="flex items-center gap-2 group/creator relative">
                                                <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100 shrink-0">
                                                    <Icon icon="solar:user-bold" />
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="text-xs font-bold text-slate-800 truncate" title={item.creator_name}>
                                                        {item.creator_name || 'ไม่ระบุ'}
                                                    </div>
                                                    <div className="text-[9px] font-black text-indigo-400 uppercase tracking-tighter">Collector</div>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Editor Column */}
                                        <td className="p-4 hidden xl:table-cell">
                                            {item.editor_name ? (
                                                <div className="flex items-center gap-2 group/editor relative">
                                                    <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-100 shrink-0">
                                                        <Icon icon="solar:pen-bold" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="text-xs font-bold text-slate-800 truncate" title={item.editor_name}>
                                                            {item.editor_name}
                                                        </div>
                                                        <div className="text-[9px] font-black text-amber-500 uppercase tracking-tighter">Editor</div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-slate-300 italic">ไม่มีข้อมูลการแก้ไข</span>
                                            )}
                                        </td>

                                        {/* Creation Date Column */}
                                        <td className="p-4 hidden sm:table-cell">
                                            <div className="flex flex-col leading-tight">
                                                <div className="text-xs font-bold text-slate-600 whitespace-nowrap">
                                                    {new Date(item.created_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })}
                                                </div>
                                                <div className="text-[10px] text-slate-400 font-medium">เมื่อวันที่บันทึก</div>
                                            </div>
                                        </td>

                                        {/* Actions Column */}
                                        <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex justify-end gap-1">
                                                {(userRole === 'admin' || userRole === 'director') && (
                                                    <>
                                                        <button
                                                            onClick={() => handleEdit(item)}
                                                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-lg transition-all shadow-none hover:shadow-sm border border-transparent hover:border-indigo-100"
                                                            title="แก้ไขข้อมูล"
                                                        >
                                                            <Icon icon="solar:pen-new-square-bold" className="text-xl" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(item.info_id, item.full_name)}
                                                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-white rounded-lg transition-all shadow-none hover:shadow-sm border border-transparent hover:border-red-100"
                                                            title="ลบข้อมูล"
                                                        >
                                                            <Icon icon="solar:trash-bin-trash-bold" className="text-xl" />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
                    <button
                        disabled={page === 1 || isLoading}
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        className="p-2 hover:bg-white rounded-lg disabled:opacity-30 transition-all border border-transparent hover:border-slate-200 hover:shadow-sm"
                    >
                        <Icon icon="solar:alt-arrow-left-linear" className="text-xl" />
                    </button>
                    <span className="text-sm font-medium text-slate-600">หน้า {page} จาก {totalPages}</span>
                    <button
                        disabled={page === totalPages || isLoading}
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        className="p-2 hover:bg-white rounded-lg disabled:opacity-30 transition-all border border-transparent hover:border-slate-200 hover:shadow-sm"
                    >
                        <Icon icon="solar:alt-arrow-right-linear" className="text-xl" />
                    </button>
                </div>
            </div>
        </div>
    )
}
