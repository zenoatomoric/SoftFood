'use client'
import { useState, useEffect } from 'react'
import { Icon } from '@iconify/react'
import { useRouter } from 'next/navigation'
import ConfirmModal from '@/app/components/ConfirmModal'
import Toast from '@/app/components/Toast'

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

interface Props {
    userRole: string
    userId: string // sv_code
}

export default function FoodListClient({ userRole, userId }: Props) {
    const router = useRouter()
    const [menus, setMenus] = useState<FoodItem[]>([])
    const [loading, setLoading] = useState(true)
    const [total, setTotal] = useState(0)
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)

    // Filters
    const [search, setSearch] = useState('')
    const [debouncedSearch, setDebouncedSearch] = useState('')
    const [canalFilter, setCanalFilter] = useState('')
    const [categoryFilter, setCategoryFilter] = useState('')
    const [statusFilter, setStatusFilter] = useState('')

    // Dropdown States
    const [openDropdown, setOpenDropdown] = useState<string | null>(null)

    // UI Feedback
    const [confirmConfig, setConfirmConfig] = useState<{
        isOpen: boolean; title: string; message: string; type: 'info' | 'danger' | 'success' | 'warning';
        onConfirm: () => void
    }>({ isOpen: false, title: '', message: '', type: 'info', onConfirm: () => { } })

    const [toast, setToast] = useState<{ show: boolean, msg: string, type: 'success' | 'error' | 'info' }>({ show: false, msg: '', type: 'success' })

    // Debounce Search
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 500)
        return () => clearTimeout(timer)
    }, [search])

    // Fetch Data
    const fetchData = async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams()
            if (debouncedSearch) params.set('q', debouncedSearch)
            if (canalFilter) params.set('canal', canalFilter)
            if (categoryFilter) params.set('category', categoryFilter)
            if (statusFilter) params.set('status', statusFilter)
            params.set('page', page.toString())

            const res = await fetch(`/api/food?${params.toString()}`)
            const json = await res.json()
            if (res.ok) {
                setMenus(json.data)
                setTotal(json.total)
                setTotalPages(json.totalPages)
            } else {
                console.error(json.error)
            }
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [debouncedSearch, canalFilter, categoryFilter, statusFilter, page])

    // Handlers
    const handleDelete = (menuId: string, menuName: string) => {
        setConfirmConfig({
            isOpen: true,
            title: 'ยืนยันการลบ',
            message: `คุณต้องการลบเมนู "${menuName}" ใช่หรือไม่?\nการกระทำนี้ไม่สามารถย้อนกลับได้`,
            type: 'danger',
            onConfirm: async () => {
                setConfirmConfig(prev => ({ ...prev, isOpen: false }))
                try {
                    const res = await fetch(`/api/food?id=${menuId}`, { method: 'DELETE' })
                    if (res.ok) {
                        setToast({ show: true, msg: 'ลบข้อมูลสำเร็จ', type: 'success' })
                        fetchData()
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

    const handleStatusToggle = async (menuId: string, currentStatus: string[], targetStatus: string) => {
        let newStatus = [...currentStatus]
        if (newStatus.includes(targetStatus)) {
            newStatus = newStatus.filter(s => s !== targetStatus)
        } else {
            newStatus.push(targetStatus)
        }

        // Optimistic update
        setMenus(prev => prev.map(m => m.menu_id === menuId ? { ...m, selection_status: newStatus } : m))

        try {
            const res = await fetch(`/api/food`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ menu_id: menuId, selection_status: newStatus })
            })
            if (!res.ok) {
                // Revert
                setMenus(prev => prev.map(m => m.menu_id === menuId ? { ...m, selection_status: currentStatus } : m))
                setToast({ show: true, msg: 'อัปเดตสถานะไม่สำเร็จ', type: 'error' })
            }
        } catch (err) {
            setMenus(prev => prev.map(m => m.menu_id === menuId ? { ...m, selection_status: currentStatus } : m))
            setToast({ show: true, msg: 'เกิดข้อผิดพลาดในการเชื่อมต่อ', type: 'error' })
        }
    }

    const CustomDropdown = ({
        label,
        value,
        onChange,
        options,
        icon,
        id
    }: {
        label: string,
        value: string,
        onChange: (val: string) => void,
        options: { label: string, value: string }[],
        icon: string,
        id: string
    }) => {
        const isOpen = openDropdown === id

        return (
            <div className="relative">
                <div
                    onClick={() => setOpenDropdown(isOpen ? null : id)}
                    className={`w-full pl-10 pr-10 py-2 md:py-2.5 text-sm md:text-base rounded-xl border outline-none text-slate-600 bg-white cursor-pointer hover:bg-slate-50 transition-all flex items-center justify-between
                    ${isOpen ? 'border-indigo-500 ring-2 ring-indigo-100' : 'border-slate-200'}`}
                >
                    <Icon icon={icon} className={`absolute left-3 text-lg ${isOpen ? 'text-indigo-500' : 'text-slate-400'}`} />
                    <span className={value ? 'text-slate-700 font-medium' : 'text-slate-400'}>
                        {value ? options.find(o => o.value === value)?.label : label}
                    </span>
                    <Icon icon="solar:alt-arrow-down-linear" className={`absolute right-3 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180 text-indigo-500' : ''}`} />
                </div>

                {isOpen && (
                    <>
                        <div className="fixed inset-0 z-10" onClick={() => setOpenDropdown(null)}></div>
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden z-20 animate-in fade-in zoom-in-95 duration-200">
                            <div className="max-h-60 overflow-y-auto py-1">
                                <div
                                    onClick={() => { onChange(''); setOpenDropdown(null) }}
                                    className={`px-4 py-2.5 text-sm cursor-pointer hover:bg-indigo-50 transition-colors flex items-center justify-between
                                    ${value === '' ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-slate-600'}`}
                                >
                                    <span>ทั้งหมด</span>
                                    {value === '' && <Icon icon="solar:check-circle-bold" />}
                                </div>
                                {options.map(opt => (
                                    <div
                                        key={opt.value}
                                        onClick={() => { onChange(opt.value); setOpenDropdown(null) }}
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

    return (
        <div className="space-y-6 pb-20">
            <ConfirmModal {...confirmConfig} onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))} />
            <Toast isVisible={toast.show} message={toast.msg} type={toast.type} onCloseAction={() => setToast(prev => ({ ...prev, show: false }))} />

            {/* Header & Filters */}
            <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-slate-100 sticky top-0 z-30">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 md:mb-6">
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold text-slate-800 flex items-center gap-2">
                            <Icon icon="solar:chef-hat-heart-bold-duotone" className="text-indigo-600" />
                            รายการอาหาร
                            <span className="text-xs md:text-sm font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{total} รายการ</span>
                        </h1>
                        <p className="text-xs md:text-sm text-slate-500 mt-1">จัดการข้อมูลเมนูอาหารและการคัดเลือก</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-4">
                    {/* Search */}
                    <div className="relative col-span-1 md:col-span-2">
                        <Icon icon="solar:magnifer-linear" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="ค้นหาชื่อเมนู, ปราชญ์, หรือรหัสผู้เก็บ..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 md:py-2.5 text-sm md:text-base rounded-xl border border-slate-200 focus:border-indigo-500 outline-none text-slate-700 bg-slate-50 focus:bg-white transition-all"
                        />
                    </div>

                    {/* Filters */}
                    {/* Filters */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 md:col-start-3 md:col-span-2">
                        <CustomDropdown
                            id="canal"
                            label="เลือกพื้นที่คลอง"
                            value={canalFilter}
                            onChange={setCanalFilter}
                            icon="solar:map-point-wave-linear"
                            options={[
                                { label: 'บางเขน', value: 'บางเขน' },
                                { label: 'เปรมประชากร', value: 'เปรมประชากร' },
                                { label: 'ลาดพร้าว', value: 'ลาดพร้าว' }
                            ]}
                        />
                        <CustomDropdown
                            id="category"
                            label="เลือกประเภทอาหาร"
                            value={categoryFilter}
                            onChange={setCategoryFilter}
                            icon="solar:chef-hat-minimalistic-linear"
                            options={[
                                { label: 'อาหารคาว', value: 'อาหารคาว' },
                                { label: 'อาหารหวาน', value: 'อาหารหวาน' },
                                { label: 'อาหารว่าง', value: 'อาหารว่าง' },
                                { label: 'อาหารว่าง/เครื่องดื่ม', value: 'อาหารว่าง/เครื่องดื่ม' }
                            ]}
                        />
                    </div>
                </div>

                {/* Director Filters */}
                {(userRole === 'director' || userRole === 'admin') && (
                    <div className="mt-4 pt-4 border-t border-slate-100 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        <button
                            onClick={() => setStatusFilter(statusFilter === '108' ? '' : '108')}
                            className={`px-3 md:px-4 py-1 md:py-1.5 rounded-full text-xs md:text-sm font-bold border transition-all flex items-center gap-1 whitespace-nowrap
                            ${statusFilter === '108' ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-white text-slate-500 border-slate-200 hover:border-amber-200'}`}
                        >
                            <Icon icon="solar:star-bold" /> 108 เมนู
                        </button>
                        <button
                            onClick={() => setStatusFilter(statusFilter === '93' ? '' : '93')}
                            className={`px-3 md:px-4 py-1 md:py-1.5 rounded-full text-xs md:text-sm font-bold border transition-all flex items-center gap-1 whitespace-nowrap
                            ${statusFilter === '93' ? 'bg-indigo-100 text-indigo-700 border-indigo-200' : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-200'}`}
                        >
                            <Icon icon="solar:medal-star-bold" /> 93 เมนู
                        </button>
                        <button
                            onClick={() => setStatusFilter(statusFilter === '36' ? '' : '36')}
                            className={`px-3 md:px-4 py-1 md:py-1.5 rounded-full text-xs md:text-sm font-bold border transition-all flex items-center gap-1 whitespace-nowrap
                            ${statusFilter === '36' ? 'bg-rose-100 text-rose-700 border-rose-200' : 'bg-white text-slate-500 border-slate-200 hover:border-rose-200'}`}
                        >
                            <Icon icon="solar:crown-bold" /> 36 เมนู
                        </button>
                    </div>
                )}
            </div>

            {/* Content List/Grid */}
            {loading ? (
                // Skeleton Loading Responsive
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="bg-white rounded-2xl shadow-sm flex flex-row md:flex-col overflow-hidden h-32 md:h-80 border border-slate-100">
                            <div className="w-32 md:w-full md:h-48 bg-slate-100 animate-pulse shrink-0"></div>
                            <div className="p-4 flex-1 space-y-3 flex flex-col justify-center md:justify-start">
                                <div className="h-4 bg-slate-100 rounded w-3/4 animate-pulse"></div>
                                <div className="h-3 bg-slate-100 rounded w-1/2 animate-pulse"></div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : menus.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                        <Icon icon="solar:magnifer-linear" className="text-3xl" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-600">ไม่พบรายการอาหาร</h3>
                    <p className="text-slate-400 text-sm">ลองปรับเปลี่ยนคำค้นหาหรือตัวกรอง</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                    {menus.map(menu => (
                        <div
                            key={menu.menu_id}
                            className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all border border-slate-100 group cursor-pointer flex flex-row md:flex-col"
                            onClick={(e) => {
                                if ((e.target as HTMLElement).closest('button')) return;
                                router.push(`/menus/${menu.menu_id}`)
                            }}
                        >
                            {/* Card Image: Left on Mobile, Top on Desktop */}
                            <div
                                className="relative w-32 sm:w-40 md:w-full min-h-[140px] md:h-48 bg-slate-100 overflow-hidden shrink-0 group-hover:opacity-95 transition-opacity"
                            >
                                {menu.thumbnail ? (
                                    <img src={menu.thumbnail} alt={menu.menu_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-300 bg-slate-50">
                                        <Icon icon="solar:gallery-wide-linear" className="text-4xl" />
                                    </div>
                                )}

                                {/* Desktop Badges (Hidden on Mobile, overlay on image) */}
                                <div className="hidden md:flex absolute top-3 left-3 flex-col gap-2">
                                    <span className={`px-2 py-1 rounded-lg text-xs font-bold shadow-sm backdrop-blur-md bg-white/90
                                        ${menu.category === 'อาหารคาว' ? 'text-orange-600' :
                                            menu.category === 'อาหารหวาน' ? 'text-pink-600' : 'text-teal-600'}`}>
                                        {menu.category}
                                    </span>
                                </div>
                                <div className="hidden md:block absolute top-3 right-3">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm text-white backdrop-blur-md
                                        ${menu.canal_zone === 'บางเขน' ? 'bg-blue-500/80' :
                                            menu.canal_zone === 'ลาดพร้าว' ? 'bg-amber-500/80' : 'bg-green-500/80'}`}>
                                        {menu.canal_zone}
                                    </span>
                                </div>
                            </div>

                            {/* Card Content: Right on Mobile, Bottom on Desktop */}
                            <div className="p-3 md:p-4 flex-1 flex flex-col justify-between min-w-0">
                                <div>
                                    {/* Mobile Badges (Visible on Mobile, inline with text) */}
                                    <div className="flex md:hidden flex-wrap gap-1.5 mb-2">
                                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100
                                            ${menu.category === 'อาหารคาว' ? 'text-orange-600' : menu.category === 'อาหารหวาน' ? 'text-pink-600' : 'text-teal-600'}`}>
                                            {menu.category}
                                        </span>
                                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold text-white
                                            ${menu.canal_zone === 'บางเขน' ? 'bg-blue-500' : menu.canal_zone === 'ลาดพร้าว' ? 'bg-amber-500' : 'bg-green-500'}`}>
                                            {menu.canal_zone}
                                        </span>
                                    </div>

                                    <h3 className="font-bold text-slate-800 truncate text-base md:text-lg mb-1" title={menu.menu_name}>{menu.menu_name}</h3>

                                    <div className="space-y-0.5">
                                        <p className="text-[11px] md:text-xs text-slate-500 flex items-center gap-1 truncate">
                                            <span title="ผู้ให้ข้อมูล"><Icon icon="solar:user-circle-linear" className="inline text-slate-400" /> {menu.informant_name}</span>
                                        </p>
                                        <p className="text-[11px] md:text-xs text-slate-400 md:ml-5 truncate">
                                            ผู้เก็บ: {menu.surveyor_name}
                                        </p>
                                    </div>
                                </div>

                                {/* Status Tags & Action Buttons */}
                                <div className="mt-2 md:mt-3 pt-2 md:pt-3 border-t border-slate-50">
                                    {(userRole === 'director' || userRole === 'admin') && (
                                        <div className="flex flex-wrap gap-1.5 mb-2">
                                            {['108', '93', '36'].map(tag => (
                                                <button
                                                    key={tag}
                                                    onClick={() => handleStatusToggle(menu.menu_id, menu.selection_status, tag)}
                                                    className={`px-1.5 py-0.5 md:px-2 md:py-1 rounded-lg text-[10px] md:text-xs font-bold border transition-all flex items-center gap-1
                                                        ${menu.selection_status.includes(tag)
                                                            ? (tag === '108' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                                                                tag === '93' ? 'bg-indigo-100 text-indigo-700 border-indigo-200' : 'bg-rose-100 text-rose-700 border-rose-200')
                                                            : 'bg-slate-50 text-slate-400 border-slate-100 hover:border-slate-300'}`}
                                                >
                                                    <Icon icon={menu.selection_status.includes(tag) ? 'solar:check-circle-bold' : 'solar:add-circle-linear'} />
                                                    {tag}
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {/* Edit / Delete Buttons */}
                                    <div className="flex justify-end gap-1 md:gap-2">
                                        {(userRole === 'admin' || (userRole === 'user' && menu.ref_sv_code === userId)) && (
                                            <button
                                                onClick={() => router.push(`/survey/part2?menu_id=${menu.menu_id}`)}
                                                className="text-slate-400 hover:text-indigo-600 p-1.5 md:p-2 rounded-full hover:bg-indigo-50 transition-colors"
                                                title="แก้ไขเมนู"
                                            >
                                                <Icon icon="solar:pen-new-square-bold" className="text-sm md:text-base" />
                                            </button>
                                        )}
                                        {userRole === 'admin' && (
                                            <button
                                                onClick={() => handleDelete(menu.menu_id, menu.menu_name)}
                                                className="text-slate-400 hover:text-red-500 p-1.5 md:p-2 rounded-full hover:bg-red-50 transition-colors"
                                                title="ลบเมนู"
                                            >
                                                <Icon icon="solar:trash-bin-trash-bold" className="text-sm md:text-base" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-8">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="px-3 md:px-4 py-1.5 md:py-2 rounded-xl bg-white border border-slate-200 text-slate-600 disabled:opacity-50 hover:bg-slate-50 font-bold text-sm md:text-base"
                    >
                        ก่อนหน้า
                    </button>
                    <span className="px-2 md:px-4 py-2 text-slate-600 font-bold text-sm md:text-base">
                        หน้า {page} / {totalPages}
                    </span>
                    <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="px-3 md:px-4 py-1.5 md:py-2 rounded-xl bg-white border border-slate-200 text-slate-600 disabled:opacity-50 hover:bg-slate-50 font-bold text-sm md:text-base"
                    >
                        ถัดไป
                    </button>
                </div>
            )}
        </div>
    )
}