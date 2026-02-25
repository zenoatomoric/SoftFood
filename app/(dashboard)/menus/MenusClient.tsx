'use client'
import { useState, useEffect, useMemo } from 'react'
import { Icon } from '@iconify/react'
import { useRouter } from 'next/navigation'
import ConfirmModal from '@/app/components/ConfirmModal'
import Toast from '@/app/components/Toast'
import useSWR from 'swr'
import * as XLSX from 'xlsx'

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
    // Full data fields (optional)
    informants?: any
    users?: any
    menu_ingredients?: any[]
    menu_steps?: any[]
    menu_photos?: any[]
    story?: string
    heritage_status?: string
    popularity?: string
    seasonality?: string
    rituals?: string[]
    taste_appeal?: string
    complexity?: string
    consumption_freq?: string
    ingredient_sources?: string[]
    health_benefits?: string[]
    secret_tips?: string
    serving_size?: string
    other_serving_size?: string
    other_popularity?: string
    other_rituals?: string
    other_seasonality?: string
    other_ingredient_sources?: string
    other_health_benefits?: string
    other_consumption_freq?: string
    other_complexity?: string
    other_taste_appeal?: string
    nutrition?: string
    social_value?: string
    awards_references?: string
}

interface Props {
    userRole: string
    userId: string
}

export default function MenusClient({ userRole, userId }: Props) {
    const router = useRouter()
    const [page, setPage] = useState(1)

    // Filters
    const [search, setSearch] = useState('')
    const [debouncedSearch, setDebouncedSearch] = useState('')
    const [canalFilter, setCanalFilter] = useState('')
    const [categoryFilter, setCategoryFilter] = useState('')
    const [statusFilter, setStatusFilter] = useState('')

    // SWR Data Fetching
    const fetchUrl = useMemo(() => {
        const params = new URLSearchParams()
        if (debouncedSearch) params.set('q', debouncedSearch)
        if (canalFilter) params.set('canal', canalFilter)
        if (categoryFilter) params.set('category', categoryFilter)
        if (statusFilter) params.set('status', statusFilter)
        params.set('page', page.toString())
        return `/api/food?${params.toString()}`
    }, [debouncedSearch, canalFilter, categoryFilter, statusFilter, page])

    const { data: swrData, error, isLoading, mutate } = useSWR(fetchUrl)

    const menus = swrData?.data || []
    const total = swrData?.total || 0
    const totalPages = swrData?.totalPages || 1

    // Dropdown States
    const [openDropdown, setOpenDropdown] = useState<string | null>(null)

    // UI Feedback
    const [toast, setToast] = useState<{ show: boolean, msg: string, type: 'success' | 'error' | 'info' }>({ show: false, msg: '', type: 'success' })
    const [confirmConfig, setConfirmConfig] = useState<{
        isOpen: boolean; title: string; message: string; type: 'info' | 'danger' | 'success' | 'warning';
        onConfirm: () => void
    }>({ isOpen: false, title: '', message: '', type: 'info', onConfirm: () => { } })

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search)
            setPage(1) // Reset to page 1 on search
        }, 500)
        return () => clearTimeout(timer)
    }, [search])

    // Handle filter changes
    useEffect(() => {
        setPage(1)
    }, [canalFilter, categoryFilter, statusFilter])

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
                    id={id}
                    onClick={() => setOpenDropdown(isOpen ? null : id)}
                    role="combobox"
                    aria-expanded={isOpen}
                    aria-haspopup="listbox"
                    aria-controls={`${id}-listbox`}
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
                        <div id={`${id}-listbox`} role="listbox" className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden z-20 animate-in fade-in zoom-in-95 duration-200">
                            <div className="max-h-60 overflow-y-auto py-1">
                                <div
                                    role="option"
                                    aria-selected={value === ''}
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
                                        role="option"
                                        aria-selected={value === opt.value}
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

    const handleExport = async () => {
        if (userRole !== 'admin') {
            setToast({ show: true, msg: 'คุณไม่มีสิทธิ์ในการ Export ข้อมูล', type: 'error' })
            return
        }

        try {
            setToast({ show: true, msg: 'กำลังเตรียมไฟล์ Export...', type: 'info' })

            // Fetch ALL matching data with FULL details
            const params = new URLSearchParams()
            if (debouncedSearch) params.set('q', debouncedSearch)
            if (canalFilter) params.set('canal', canalFilter)
            if (categoryFilter) params.set('category', categoryFilter)
            if (statusFilter) params.set('status', statusFilter)
            params.set('limit', '9999')
            params.set('full', 'true')

            const res = await fetch(`/api/food?${params.toString()}`)
            const json = await res.json()

            if (!res.ok || !json.data) throw new Error('Failed to fetch data')

            // Prepare Data for XLSX
            const exportData = json.data.map((item: FoodItem) => {
                // Formatting Helpers
                const combineOption = (main: string | string[] | undefined, other: string | undefined) => {
                    const mainStr = Array.isArray(main) ? main.join(', ') : (main || '')
                    if (other) return `${mainStr}${mainStr ? ', ' : ''}${other}`
                    return mainStr
                }

                const rawIngredients = item.menu_ingredients?.filter((i: any) => i.ingredient_type === 'วัตถุดิบ') || []
                const seasoningIngredients = item.menu_ingredients?.filter((i: any) => i.ingredient_type === 'เครื่องปรุง/สมุนไพร') || []

                const formatIngs = (list: any[]) => list.map((i, idx) =>
                    `${idx + 1}. ${i.name} (${i.quantity} ${i.unit})${i.is_main_ingredient ? ' [วัตถุดิบหลัก]' : ''}${i.note ? ` - ${i.note}` : ''}`
                ).join('\n')

                const prepSteps = item.menu_steps?.filter((s: any) => s.step_type === 'เตรียม').sort((a: any, b: any) => a.step_order - b.step_order) || []
                const cookSteps = item.menu_steps?.filter((s: any) => s.step_type === 'ปรุง').sort((a: any, b: any) => a.step_order - b.step_order) || []

                const formatSteps = (list: any[]) => list.map((s, idx) => `${idx + 1}. ${s.instruction}`).join('\n')

                return {
                    // 🔵 ส่วนที่ 3: ข้อมูลอัตลักษณ์เมนู
                    'ชื่อเมนูอาหาร (ชื่อทางการ)': item.menu_name,
                    'ชื่อเรียกในท้องถิ่น': (item as any).local_name || '',
                    'ชื่อภาษาอื่น': (item as any).other_name || '',
                    'ประเภทอาหาร': item.category,
                    'ปริมาณการทานต่อ 1 เมนู': item.serving_size === 'อื่นๆ' ? (item.other_serving_size || 'อื่นๆ') : (item.serving_size || ''),

                    // 🟠 ส่วนที่ 4: แบบสำรวจเจาะลึก
                    'ระดับความนิยม / การเป็นที่รู้จัก': combineOption(item.popularity, item.other_popularity),
                    'ความเชื่อและประเพณี / โอกาสในการกิน': combineOption(item.rituals, item.other_rituals),
                    'ฤดูกาล / ช่วงเวลาที่หารับประทานได้': combineOption(item.seasonality, item.other_seasonality),
                    'แหล่งที่มาของวัตถุดิบ': combineOption(item.ingredient_sources, item.other_ingredient_sources),
                    'สุขภาพและสรรพคุณ': combineOption(item.health_benefits, item.other_health_benefits),
                    'ความถี่ในการรับประทาน': combineOption(item.consumption_freq, item.other_consumption_freq),
                    'ความยากง่ายในการทำ': combineOption(item.complexity, item.other_complexity),
                    'รสชาติ / ความเหมาะสม': combineOption(item.taste_appeal, item.other_taste_appeal),
                    'คุณค่าทางโภชนาการ': item.nutrition || '',
                    'คุณค่าทางสังคมและวัฒนธรรม': item.social_value || '',

                    // 🟣 ส่วนที่ 5: เรื่องราวและสถานะ
                    'เรื่องเล่า / ตำนาน / ประวัติความเป็นมา': item.story || '',
                    'สถานะการสืบทอด': item.heritage_status || '',
                    'เคล็ดลับ / เทคนิคพิเศษ': item.secret_tips || '',
                    'รางวัล / อ้างอิง': item.awards_references || '',

                    // 🟡 ส่วนที่ 6: ข้อมูลสูตรอาหาร
                    'วัตถุดิบหลัก (เนื้อสัตว์/ผัก/เส้น)': formatIngs(rawIngredients),
                    'เครื่องปรุงรสและสมุนไพร': formatIngs(seasoningIngredients),
                    'ขั้นตอนการเตรียม': formatSteps(prepSteps),
                    'ขั้นตอนการปรุง': formatSteps(cookSteps),
                }
            })

            // Create Workbook and Worksheet
            const worksheet = XLSX.utils.json_to_sheet(exportData)
            const workbook = XLSX.utils.book_new()
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Menus')

            // Download
            XLSX.writeFile(workbook, `menus_export_${new Date().toISOString().slice(0, 10)}.xlsx`)

            setToast({ show: true, msg: 'Export ไฟล์สำเร็จ', type: 'success' })
        } catch (err) {
            console.error(err)
            setToast({ show: true, msg: 'Export ล้มเหลว', type: 'error' })
        }
    }

    const handleDelete = (menuId: string, menuName: string) => {
        setConfirmConfig({
            isOpen: true,
            title: 'ยืนยันการลบ',
            message: `คุณต้องการลบเมนู "${menuName}" ใช่หรือไม่?`,
            type: 'danger',
            onConfirm: async () => {
                setConfirmConfig(prev => ({ ...prev, isOpen: false }))
                try {
                    const res = await fetch(`/api/food?id=${menuId}`, { method: 'DELETE' })
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

    // Checking permission to delete/edit (Admin or Owner)
    // Note: userId is sv_code for users
    const canEdit = (menu: FoodItem) => {
        if (userRole === 'admin') return true
        if (userRole === 'user' && menu.ref_sv_code === userId) return true
        return false
    }

    return (
        <div className="pb-20">
            <ConfirmModal {...confirmConfig} onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))} />
            <Toast isVisible={toast.show} message={toast.msg} type={toast.type} onCloseAction={() => setToast(prev => ({ ...prev, show: false }))} />

            {/* Unified Card Container */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">

                {/* Header Section (Title + Filters) */}
                <div className="p-4 md:p-6 border-b border-slate-100">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                        <div>
                            <h1 className="text-xl md:text-2xl font-bold text-slate-800 flex items-center gap-2">
                                <Icon icon="solar:menu-dots-bold-duotone" className="text-indigo-600" />
                                รายการเมนูอาหาร
                                <span className="text-xs md:text-sm font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{total} รายการ</span>
                            </h1>
                            <p className="text-xs md:text-sm text-slate-500 mt-1">จัดการข้อมูลเมนูอาหารและการคัดเลือก</p>
                        </div>

                        <div className="flex flex-col md:flex-row gap-2">

                            {userRole === 'admin' && (
                                <button
                                    onClick={handleExport}
                                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-colors shadow-sm shadow-green-200 w-full md:w-auto justify-center text-sm md:text-base"
                                >
                                    <Icon icon="solar:file-download-bold" />
                                    Export Excel
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-4">
                        <div className="relative col-span-1 md:col-span-2">
                            <Icon icon="solar:magnifer-linear" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <label htmlFor="menu_search" className="sr-only">ค้นหาชื่อเมนู</label>
                            <input
                                id="menu_search"
                                type="text"
                                placeholder="ค้นหาชื่อเมนู..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 md:py-2.5 text-sm md:text-base rounded-xl border border-slate-200 focus:border-indigo-500 outline-none bg-slate-50 focus:bg-white transition-all"
                            />
                        </div>
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

                {/* Content List */}
                {isLoading ? (
                    <div className="p-4 md:p-6 space-y-4">
                        {[...Array(5)].map((_, i) => <div key={i} className="bg-slate-50 rounded-xl h-20 animate-pulse"></div>)}
                    </div>
                ) : menus.length === 0 ? (
                    <div className="text-center py-20 bg-slate-50/50">
                        <Icon icon="solar:magnifer-linear" className="text-3xl text-slate-300 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-slate-600">ไม่พบข้อมูล</h3>
                        <p className="text-slate-400 text-sm mt-1">ลองปรับเปลี่ยนตัวกรองหรือคำค้นหา</p>
                    </div>
                ) : (
                    <div>
                        {/* Desktop Table Header */}
                        <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-slate-50 text-xs font-bold text-slate-500 uppercase border-b border-slate-100">
                            <div className="col-span-1">รูป</div>
                            <div className="col-span-3">ชื่อเมนู</div>
                            <div className="col-span-2">ประเภท/โซน</div>
                            <div className="col-span-2">ผู้เก็บ</div>
                            <div className="col-span-2">สถานะ</div>
                            <div className="col-span-2 text-right">จัดการ</div>
                        </div>

                        {/* Items */}
                        {menus.map((menu: FoodItem) => (
                            <div
                                key={menu.menu_id}
                                className="group relative flex items-center gap-3 md:grid md:grid-cols-12 md:gap-4 p-3 md:px-6 md:py-4 border-b border-slate-50 last:border-0 hover:bg-indigo-50/30 transition-colors"
                            >
                                {/* 1. Thumbnail */}
                                <div className="shrink-0 md:col-span-1 text-center md:text-left">
                                    <div className="w-14 h-14 md:w-12 md:h-12 rounded-lg bg-slate-100 overflow-hidden inline-block shadow-sm relative group-hover:shadow-md transition-shadow">
                                        {menu.thumbnail ? (
                                            <img
                                                src={menu.thumbnail}
                                                alt={menu.menu_name}
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                loading="lazy"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                <Icon icon="solar:gallery-wide-linear" className="text-xl opacity-50" />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* 2. Menu Name & Info */}
                                <div className="flex-1 min-w-0 md:col-span-3 cursor-pointer" onClick={() => router.push(`/menus/${menu.menu_id}`)}>
                                    <h3 className="font-bold text-slate-800 text-sm md:text-sm truncate group-hover:text-indigo-600 transition-colors leading-tight">{menu.menu_name}</h3>
                                    <p className="text-xs text-slate-500 mt-1 truncate">{menu.category} • {menu.informant_name}</p>
                                </div>

                                {/* 3. Category/Zone (Desktop) */}
                                <div className="hidden md:block md:col-span-2 text-sm text-slate-600">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-xs">{menu.category}</span>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full w-fit ${menu.canal_zone === 'บางเขน' ? 'bg-blue-50 text-blue-600' : menu.canal_zone === 'ลาดพร้าว' ? 'bg-amber-50 text-amber-600' : 'bg-green-50 text-green-600'}`}>
                                            {menu.canal_zone}
                                        </span>
                                    </div>
                                </div>

                                {/* 4. Users (Desktop) */}
                                <div className="hidden md:block md:col-span-2 text-xs text-slate-500">
                                    <p title="ผู้ให้ข้อมูล"><Icon icon="solar:user-circle-linear" className="inline text-slate-400" /> {menu.informant_name}</p>
                                    <p title="ผู้เก็บ" className="mt-1"><Icon icon="solar:pen-new-square-linear" className="inline text-slate-400" /> {menu.surveyor_name}</p>
                                </div>

                                {/* 5. Status (Desktop) */}
                                <div className="hidden md:flex md:col-span-2 flex-wrap gap-1 content-start">
                                    {menu.selection_status.length > 0 ? menu.selection_status.map((s: string) => (
                                        <span key={s} className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded-md border border-indigo-100">{s}</span>
                                    )) : <span className="text-xs text-slate-400 italic">รอคัดเลือก</span>}
                                </div>

                                {/* 6. Actions */}
                                <div className="flex shrink-0 items-center gap-1 md:gap-2 md:col-span-2 md:justify-end">
                                    <button
                                        onClick={() => router.push(`/menus/${menu.menu_id}`)}
                                        className="p-1.5 md:px-3 md:py-1.5 rounded-lg bg-indigo-50 text-indigo-600 text-xs font-bold hover:bg-indigo-100 transition-colors"
                                    >
                                        <span className="hidden md:inline">ดูข้อมูล</span>
                                        <Icon icon="solar:eye-bold" className="md:hidden text-lg" />
                                    </button>
                                    {canEdit(menu) && (
                                        <>
                                            <button
                                                onClick={() => router.push(`/survey/part2?menu_id=${menu.menu_id}`)}
                                                className="p-1.5 md:p-1.5 rounded-lg text-amber-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                                                title="แก้ไข"
                                            >
                                                <Icon icon="solar:pen-new-square-bold" className="text-lg" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(menu.menu_id, menu.menu_name)}
                                                className="p-1.5 md:p-1.5 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                                title="ลบ"
                                            >
                                                <Icon icon="solar:trash-bin-trash-bold" className="text-lg" />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex justify-center gap-2 p-6 border-t border-slate-100 bg-slate-50/50">
                        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2.5 rounded-xl bg-white border border-slate-200 disabled:opacity-50 hover:bg-slate-50 flex items-center justify-center" aria-label="หน้าก่อนหน้า">
                            <Icon icon="solar:alt-arrow-left-linear" className="text-xl" />
                        </button>
                        <span className="px-4 py-2 font-bold text-slate-600 text-sm">หน้า {page} / {totalPages}</span>
                        <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2.5 rounded-xl bg-white border border-slate-200 disabled:opacity-50 hover:bg-slate-50 flex items-center justify-center" aria-label="หน้าถัดไป">
                            <Icon icon="solar:alt-arrow-right-linear" className="text-xl" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
