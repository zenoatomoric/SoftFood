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

    // SWR Data Fetching
    const fetchUrl = useMemo(() => {
        const params = new URLSearchParams()
        if (debouncedSearch) params.set('search', debouncedSearch)
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
                            <tr className="bg-slate-50 text-slate-600 text-xs uppercase font-bold tracking-wider">
                                <th className="p-4 border-b border-slate-100">รหัส / ชื่อ-นามสกุล</th>
                                <th className="p-4 border-b border-slate-100 hidden md:table-cell">ข้อมูลติดต่อ</th>
                                <th className="p-4 border-b border-slate-100 hidden lg:table-cell">ที่อยู่</th>
                                <th className="p-4 border-b border-slate-100 text-right">จัดการ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 text-sm text-slate-700">
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="p-4"><div className="h-4 bg-slate-100 rounded w-3/4"></div></td>
                                        <td className="p-4 hidden md:table-cell"><div className="h-4 bg-slate-100 rounded w-1/2"></div></td>
                                        <td className="p-4 hidden lg:table-cell"><div className="h-4 bg-slate-100 rounded w-2/3"></div></td>
                                        <td className="p-4 text-right"><div className="h-8 w-20 bg-slate-100 rounded ml-auto"></div></td>
                                    </tr>
                                ))
                            ) : informants.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-slate-400">
                                        <div className="flex flex-col items-center gap-2">
                                            <Icon icon="solar:database-off-linear" className="text-4xl opacity-50" />
                                            <span>ไม่พบข้อมูล</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                informants.map((item: Informant) => (
                                    <tr
                                        key={item.info_id}
                                        onClick={() => handleEdit(item)}
                                        className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                                    >
                                        {/* Name & ID */}
                                        <td className="p-4 align-top">
                                            <div className="font-bold text-slate-800 group-hover:text-indigo-700 transition-colors">{item.full_name}</div>
                                            <div className="text-xs text-slate-400 font-mono mt-0.5 bg-slate-100 px-1.5 py-0.5 rounded w-fit">
                                                {item.friendly_id || 'NO-ID'}
                                            </div>
                                            <div className="md:hidden text-xs text-slate-500 mt-1 flex flex-col gap-0.5">
                                                <span>{item.phone || '-'}</span>
                                                <span className="truncate max-w-[150px]">{item.canal_zone}</span>
                                            </div>
                                        </td>

                                        {/* Contact */}
                                        <td className="p-4 align-top hidden md:table-cell">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-1.5 text-slate-600">
                                                    <Icon icon="solar:phone-linear" />
                                                    <span>{item.phone || '-'}</span>
                                                </div>
                                                <div className="text-xs text-slate-400">อายุ: {item.age || '-'} ปี</div>
                                            </div>
                                        </td>

                                        {/* Address */}
                                        <td className="p-4 align-top hidden lg:table-cell max-w-xs">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-1.5 font-bold text-indigo-600">
                                                    <Icon icon="solar:map-point-bold" />
                                                    <span>{item.canal_zone || '-'}</span>
                                                </div>
                                                <div className="text-xs text-slate-500 line-clamp-2" title={item.address_full}>
                                                    {item.address_full || '-'}
                                                </div>
                                            </div>
                                        </td>

                                        {/* Actions */}
                                        <td className="p-4 align-top text-right" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleEdit(item)}
                                                    className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                    title="ดูรายละเอียด / แก้ไข"
                                                >
                                                    <Icon icon="solar:pen-new-square-bold" className="text-xl" />
                                                </button>

                                                {(userRole === 'admin' || userRole === 'director') && (
                                                    <button
                                                        onClick={() => handleDelete(item.info_id, item.full_name)}
                                                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="ลบข้อมูล"
                                                    >
                                                        <Icon icon="solar:trash-bin-trash-bold" className="text-xl" />
                                                    </button>
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
