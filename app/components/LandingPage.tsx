'use client'
import { useState, useEffect, useMemo } from 'react'
import { Icon } from '@iconify/react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { MenuDetailPopup } from './MenuDetailPopup'

const MapView = dynamic(() => import('./MapView'), {
    ssr: false,
    loading: () => (
        <div className="w-full rounded-2xl bg-slate-100 animate-pulse border border-slate-200" style={{ height: '480px' }} />
    ),
})

interface Ingredient {
    name: string
    is_main: boolean
    type: string
    quantity: string
    unit: string
    note: string
}

interface MenuItem {
    menu_id: string
    menu_name: string
    local_name: string
    other_name: string
    category: string
    selection_status: string[]
    canal_zone: string
    informant_name: string
    address: string
    gps_lat: number | null
    gps_long: number | null
    thumbnail: string | null
    photos: string[]
    story: string
    secret_tips: string
    nutrition: string
    health_benefits: string[]
    heritage_status: string
    serving_size: string
    popularity: string[]
    seasonality: string[]
    rituals: string[]
    ingredient_sources: string[]
    cooking_method: string
    taste_profile: string
    eating_occasion: string[]
    ingredients: Ingredient[]
    steps: string[]
    video_url: string | null
    promo_video_url: string | null
}

// Canal filter config
const CANAL_FILTERS = [
    { id: 'all', label: 'ทุกพื้นที่', icon: 'solar:layers-linear' },
    { id: 'บางเขน', label: 'คลองบางเขน', icon: 'solar:water-linear' },
    { id: 'เปรมประชากร', label: 'คลองเปรมประชากร', icon: 'solar:leaf-linear' },
    { id: 'ลาดพร้าว', label: 'คลองลาดพร้าว', icon: 'solar:city-linear' },
]

// Featured filters (Top row buttons)
const FEATURED_FILTERS = [
    { id: 'all', label: 'ทั้งหมด', icon: 'solar:layers-linear' },
    { id: '36', label: 'เมนูแนะนำ', icon: 'solar:star-bold' },
    { id: 'ซิกเนเจอร์', label: 'เมนู Signature', icon: 'solar:medal-star-bold' },
]

// Category options (Dropdown)
const CATEGORY_OPTIONS = [
    { id: 'all', label: 'ทุกประเภทอาหาร' },
    { id: 'อาหารคาว', label: 'อาหารคาว' },
    { id: 'อาหารหวาน', label: 'อาหารหวาน' },
    { id: 'อาหารว่าง/เครื่องดื่ม', label: 'อาหารว่าง/เครื่องดื่ม' },
]

const ITEMS_PER_PAGE = 12

export default function LandingPage({ isLoggedIn }: { isLoggedIn: boolean }) {
    const [menus, setMenus] = useState<MenuItem[]>([])
    const [loading, setLoading] = useState(true)
    const [activeCanal, setActiveCanal] = useState('all')
    const [activeFeatured, setActiveFeatured] = useState('all')
    const [activeCategory, setActiveCategory] = useState('all')
    const [isCatOpen, setIsCatOpen] = useState(false)
    const [currentPage, setCurrentPage] = useState(1)
    const [search, setSearch] = useState('')
    const [debouncedSearch, setDebouncedSearch] = useState('')
    const [popupMenu, setPopupMenu] = useState<MenuItem | null>(null)
    const [popupVisible, setPopupVisible] = useState(false)
    const [showMap, setShowMap] = useState(true)

    // Fetch data
    useEffect(() => {
        const fetchMenus = async () => {
            try {
                const res = await fetch('/api/public/menus')
                const json = await res.json()
                if (res.ok) {
                    setMenus(json.data || [])
                }
            } catch (err) {
                console.error('Failed to fetch menus:', err)
            } finally {
                setLoading(false)
            }
        }
        fetchMenus()
    }, [])

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 500)
        return () => clearTimeout(timer)
    }, [search])

    // Reset page on filter change
    useEffect(() => { setCurrentPage(1) }, [activeCanal, activeFeatured, activeCategory, debouncedSearch])

    // Filtered menus
    const filtered = useMemo(() => {
        return menus.filter(m => {
            const matchCanal = activeCanal === 'all' || m.canal_zone === activeCanal
            
            // Match Featured (Top Row)
            const matchFeatured = activeFeatured === 'all' || m.selection_status.includes(activeFeatured)
            
            // Match Category (Dropdown)
            const matchCategory = activeCategory === 'all' || m.category === activeCategory

            // Match Search
            const matchSearch = !debouncedSearch || 
                m.menu_name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
                m.category.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
                m.canal_zone.toLowerCase().includes(debouncedSearch.toLowerCase())

            return matchCanal && matchFeatured && matchCategory && matchSearch
        })
    }, [menus, activeCanal, activeFeatured, activeCategory, debouncedSearch])

    // Pagination
    const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
    const paginatedMenus = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE
        return filtered.slice(start, start + ITEMS_PER_PAGE)
    }, [filtered, currentPage])

    // Stats
    const stats = useMemo(() => {
        const totalMenus = menus.length
        const totalCanals = new Set(menus.map(m => m.canal_zone).filter(c => c !== 'ไม่ระบุ')).size
        const totalSignature = menus.filter(m => m.selection_status.includes('ซิกเนเจอร์')).length
        const totalInformants = new Set(menus.map(m => m.informant_name).filter(n => n !== 'ไม่ระบุ')).size
        return { totalMenus, totalCanals, totalSignature, totalInformants }
    }, [menus])

    // Popup
    const openPopup = (menu: MenuItem) => {
        setPopupMenu(menu)
        setTimeout(() => setPopupVisible(true), 10)
        document.body.style.overflow = 'hidden'
    }

    const closePopup = () => {
        setPopupVisible(false)
        setTimeout(() => {
            setPopupMenu(null)
            document.body.style.overflow = ''
        }, 300)
    }

    const handlePageChange = (page: number) => {
        if (page < 1 || page > totalPages) return
        setCurrentPage(page)
        document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }

    const canalLabel = activeCanal === 'all' ? 'ทั้งหมด' : CANAL_FILTERS.find(c => c.id === activeCanal)?.label || activeCanal

    // Pagination page numbers with ellipsis
    const getPageNumbers = (): (number | string)[] => {
        const pages: (number | string)[] = []
        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) pages.push(i)
        } else {
            pages.push(1)
            if (currentPage > 4) pages.push('...')
            const start = Math.max(2, currentPage - 1)
            const end = Math.min(totalPages - 1, currentPage + 1)
            if (currentPage <= 4) {
                for (let i = 2; i <= 5; i++) pages.push(i)
            } else if (currentPage >= totalPages - 3) {
                for (let i = totalPages - 4; i <= totalPages - 1; i++) {
                    if (!pages.includes(i)) pages.push(i)
                }
            } else {
                for (let i = start; i <= end; i++) {
                    if (!pages.includes(i)) pages.push(i)
                }
            }
            if (currentPage < totalPages - 3) pages.push('...')
            if (!pages.includes(totalPages)) pages.push(totalPages)
        }
        return pages
    }

    return (
        <div className="bg-white text-slate-900 antialiased overflow-x-hidden min-h-screen font-sans">
            {/* ─── Navbar ─── */}
            <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4 sm:gap-8">
                        <Link href="/" className="flex items-center gap-3 group">
                            <div className="bg-slate-900 text-white p-1.5 rounded-lg transition-transform group-hover:scale-105">
                                <Icon icon="solar:command-bold" width="20" />
                            </div>
                            <div className="leading-tight">
                                <h1 className="font-black text-lg tracking-tight text-slate-900 leading-none">SOFT POWER</h1>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-0.5">Food Data System</p>
                            </div>
                        </Link>
                        <div className="hidden md:flex items-center gap-6">
                            {/* Navigation removed as requested */}
                        </div>
                    </div>
                    <Link
                        href={isLoggedIn ? '/home' : '/login'}
                        className="bg-slate-900 text-white text-xs font-medium px-4 py-2 rounded-full hover:bg-slate-800 transition-all flex items-center gap-2"
                    >
                        <Icon icon={isLoggedIn ? 'solar:widget-bold' : 'solar:lock-keyhole-linear'} />
                        {isLoggedIn ? 'แดชบอร์ด' : 'สำหรับเจ้าหน้าที่'}
                    </Link>
                </div>
            </nav>

            {/* ─── Hero Section ─── */}
            <section className="pt-16 sm:pt-20 pb-12 sm:pb-16 px-4 sm:px-6">
                <div className="max-w-7xl mx-auto text-center">
                    <span className="inline-block py-1.5 px-4 rounded-full bg-slate-50 text-slate-500 text-sm font-medium mb-6 border border-slate-100">
                        วิจัยและสืบสานวัฒนธรรมท้องถิ่น
                    </span>
                    <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-slate-900 mb-6 max-w-4xl mx-auto leading-tight">
                        สืบสานตำรับอาหารจากวิถีสายน้ำ <br className="hidden sm:block" />
                        มรดกภูมิปัญญา
                    </h1>
                    <p className="text-base sm:text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed mb-10">
                        สำรวจระบบสารสนเทศ (GIS) แหล่งข้อมูลอาหารดั้งเดิม พร้อมจุดพิกัดชุมชนริมคลอง
                    </p>

                    {/* Stats Row */}
                    <div id="stats" className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
                        {[
                            { label: 'เมนูอาหาร', value: stats.totalMenus, icon: 'solar:chef-hat-bold-duotone', color: 'text-orange-500' },
                            { label: 'พื้นที่คลอง', value: stats.totalCanals, icon: 'solar:map-point-wave-bold-duotone', color: 'text-blue-500' },
                            { label: 'เมนู Signature', value: stats.totalSignature, icon: 'solar:star-bold-duotone', color: 'text-amber-500' },
                            { label: 'ผู้ให้ข้อมูล', value: stats.totalInformants, icon: 'solar:users-group-rounded-bold-duotone', color: 'text-emerald-500' },
                        ].map((stat) => (
                            <div key={stat.label} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                                <Icon icon={stat.icon} className={`text-3xl sm:text-4xl ${stat.color} mb-2`} />
                                <div className="text-3xl sm:text-4xl font-bold text-slate-900">
                                    {loading ? <span className="inline-block w-10 h-8 bg-slate-100 rounded animate-pulse" /> : stat.value}
                                </div>
                                <div className="text-xs sm:text-sm text-slate-400 font-medium mt-1">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── Map Section ─── */}
            <section className="px-4 sm:px-6 py-6 bg-white border-b border-slate-100">
                <div className="max-w-7xl mx-auto">
                    {/* Header + toggle */}
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                <Icon icon="solar:map-point-wave-bold-duotone" className="text-blue-500 text-2xl" />
                                แผนที่ริมคลอง
                            </h2>
                            <p className="text-sm text-slate-500 mt-0.5">ดูตำแหน่งเมนูอาหารบนแผนที่พื้นที่คลองบางเขน-ลาดพร้าว-คลองเปรมประชากร</p>
                        </div>
                        <button
                            onClick={() => setShowMap(v => !v)}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm ${showMap
                                ? 'bg-slate-900 text-white'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                        >
                            <Icon icon={showMap ? 'solar:map-arrow-up-bold' : 'solar:map-bold'} width={18} />
                            {showMap ? 'ซ่อนแผนที่' : 'แสดงแผนที่'}
                        </button>
                    </div>

                    {/* Map */}
                    {showMap && (
                        <MapView
                            menus={menus}
                            activeCanal={activeCanal}
                            onMenuClick={(menuId) => {
                                const m = menus.find(x => x.menu_id === menuId)
                                if (m) {
                                    setPopupMenu(m)
                                    setPopupVisible(true)
                                }
                            }}
                        />
                    )}
                </div>
            </section>

            {/* ─── Canal Filters ─── */}
            <section className="py-4 px-4 sm:px-6 bg-slate-50 border-y border-slate-100">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest whitespace-nowrap mr-2">
                            ตัวกรองคลอง
                        </span>
                        {CANAL_FILTERS.map(canal => (
                            <button
                                key={canal.id}
                                onClick={() => setActiveCanal(canal.id)}
                                className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${activeCanal === canal.id
                                    ? 'bg-slate-900 text-white shadow-md'
                                    : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                    }`}
                            >
                                <Icon icon={canal.icon} width={16} />
                                {canal.label}
                                {activeCanal === canal.id && <Icon icon="solar:check-read-linear" width={14} />}
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── Menu Section ─── */}
            <section id="menu" className="py-12 sm:py-20 px-4 sm:px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 sm:gap-8 mb-8 sm:mb-12">
                        <div className="max-w-xl">
                            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3 sm:mb-4 text-slate-900">
                                รายการอาหาร ({canalLabel})
                            </h2>
                            <p className="text-base text-slate-500 leading-relaxed">
                                สำรวจเมนูอาหารหลากหลายที่ถูกจัดเก็บ เลือกฟิลเตอร์ย่อยเพื่อเข้าถึงตำรับเฉพาะ
                                {!loading && <span className="ml-2 text-slate-400">({filtered.length} รายการ)</span>}
                            </p>
                        </div>

                        <div className="flex flex-col gap-4 w-full lg:w-auto md:items-end">
                            {/* Row 1: Featured Buttons */}
                            <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar md:justify-end w-full">
                                {FEATURED_FILTERS.map(f => (
                                    <button
                                        key={f.id}
                                        onClick={() => setActiveFeatured(f.id)}
                                        className={`whitespace-nowrap px-5 py-2.5 rounded-full text-sm font-bold shadow-sm transition-all flex items-center gap-2 ${activeFeatured === f.id
                                            ? (f.id === 'ซิกเนเจอร์'
                                                ? 'bg-orange-500 text-white shadow-orange-100'
                                                : 'bg-slate-900 text-white')
                                            : (f.id === 'ซิกเนเจอร์'
                                                ? 'bg-orange-50 border border-orange-200 text-orange-600 hover:bg-orange-100'
                                                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50')
                                            }`}
                                    >
                                        <Icon icon={f.icon} width={16} />
                                        {f.label}
                                    </button>
                                ))}
                            </div>

                            {/* Row 2: Dropdown + Search */}
                            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:justify-end">
                                {/* Category Dropdown */}
                                <div className="relative w-full sm:w-64">
                                    <button
                                        onClick={() => setIsCatOpen(!isCatOpen)}
                                        className="w-full flex items-center justify-between px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 hover:border-slate-300 transition-all shadow-sm group"
                                    >
                                        <div className="flex items-center gap-2">
                                            <Icon icon="solar:menu-dots-square-bold-duotone" className="text-blue-500" />
                                            <span>{CATEGORY_OPTIONS.find(c => c.id === activeCategory)?.label}</span>
                                        </div>
                                        <Icon icon="solar:alt-arrow-down-linear" className={`transition-transform duration-300 ${isCatOpen ? 'rotate-180' : ''}`} />
                                    </button>
                                    
                                    {isCatOpen && (
                                        <>
                                            <div className="fixed inset-0 z-10" onClick={() => setIsCatOpen(false)} />
                                            <div className="absolute top-full mt-2 w-full bg-white border border-slate-100 rounded-2xl shadow-2xl py-2 z-20 animate-in fade-in slide-in-from-top-2 duration-200">
                                                {CATEGORY_OPTIONS.map(opt => (
                                                    <button
                                                        key={opt.id}
                                                        onClick={() => {
                                                            setActiveCategory(opt.id)
                                                            setIsCatOpen(false)
                                                        }}
                                                        className={`w-full text-left px-4 py-2.5 text-sm font-bold transition-colors hover:bg-blue-50 ${activeCategory === opt.id ? 'text-blue-600 bg-blue-50/50' : 'text-slate-600'}`}
                                                    >
                                                        {opt.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* Search Bar */}
                                <div className="relative flex-1 w-full group">
                                    <Icon 
                                        icon="solar:magnifer-linear" 
                                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg group-focus-within:text-blue-500 transition-colors" 
                                    />
                                    <input
                                        type="text"
                                        placeholder="ค้นหาชื่อเมนู, หมวดหมู่..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="w-full pl-11 pr-11 py-3 bg-white border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 rounded-2xl outline-none text-sm font-bold transition-all text-slate-700 placeholder-slate-400 shadow-sm"
                                    />
                                    {search && (
                                        <button 
                                            onClick={() => setSearch('')}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors"
                                        >
                                            <Icon icon="solar:close-circle-bold" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Menu Grid */}
                    {loading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                            {[...Array(8)].map((_, i) => (
                                <div key={i} className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                                    <div className="h-48 bg-slate-100 animate-pulse" />
                                    <div className="p-5 space-y-3">
                                        <div className="h-4 bg-slate-100 rounded w-3/4 animate-pulse" />
                                        <div className="h-3 bg-slate-100 rounded w-1/2 animate-pulse" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="text-center py-16">
                            <Icon icon="solar:ghost-smile-linear" className="text-6xl text-slate-200 mb-4 mx-auto" />
                            <p className="text-slate-500">ไม่พบเมนูในหมวดหมู่และคลองที่เลือก</p>
                            <button
                                onClick={() => { setActiveCanal('all'); setActiveCategory('all') }}
                                className="mt-4 text-blue-500 text-sm font-medium hover:underline"
                            >
                                คลิกที่นี่เพื่อล้างตัวกรอง
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                                {paginatedMenus.map(menu => {
                                    const isSignature = menu.selection_status.includes('ซิกเนเจอร์')
                                    const badgeText = isSignature ? 'Signature' : (
                                        menu.selection_status.includes('36') ? '36 เมนู' :
                                            menu.selection_status.includes('93') ? '93 เมนู' :
                                                menu.selection_status.includes('108') ? '108 เมนู' : menu.category
                                    )
                                    const badgeClass = isSignature
                                        ? 'bg-orange-500/90 text-white'
                                        : 'bg-white/90 text-slate-800'

                                    return (
                                        <div
                                            key={menu.menu_id}
                                            onClick={() => openPopup(menu)}
                                            className="group bg-white rounded-2xl border border-slate-100 flex flex-col overflow-hidden hover:border-slate-300 transition-all cursor-pointer shadow-sm hover:shadow-xl hover:-translate-y-1"
                                        >
                                            <div className="h-48 bg-slate-100 relative overflow-hidden">
                                                {menu.thumbnail ? (
                                                    <img
                                                        src={menu.thumbnail}
                                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                                        alt={menu.menu_name}
                                                        loading="lazy"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-slate-300 bg-slate-50">
                                                        <Icon icon="solar:gallery-wide-linear" className="text-4xl" />
                                                    </div>
                                                )}
                                                <div className="absolute top-3 left-3 flex gap-2">
                                                    <span className={`px-2.5 py-1 ${badgeClass} backdrop-blur text-[10px] font-bold uppercase tracking-wider rounded-md shadow-sm`}>
                                                        {badgeText}
                                                    </span>
                                                </div>
                                                {isSignature && (menu.video_url || menu.promo_video_url) && (
                                                    <div className="absolute top-3 right-3">
                                                        <span className="px-2 py-1 bg-black/60 backdrop-blur text-white text-[10px] font-bold rounded-md flex items-center gap-1">
                                                            <Icon icon="solar:play-bold" width={12} /> วิดีโอ
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="p-5 flex-1 flex flex-col">
                                                <div className="flex items-start justify-between mb-2 gap-2">
                                                    <h4 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
                                                        {menu.menu_name}
                                                    </h4>
                                                    <span className="text-xs bg-slate-100 font-semibold px-2 py-0.5 rounded text-slate-500 shrink-0">
                                                        {menu.category}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed mb-4 flex-1">
                                                    {menu.story || menu.ingredients.filter(i => i.is_main).map(i => i.name).join(', ') || 'ตำรับอาหารดั้งเดิมจากชุมชนริมคลอง'}
                                                </p>
                                                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                                                    <div className="flex items-center gap-1.5 text-slate-400">
                                                        <Icon icon="solar:map-point-wave-bold" className="text-blue-400" />
                                                        <span className="text-xs font-semibold">คลอง{menu.canal_zone}</span>
                                                    </div>
                                                    <span className="text-sm font-semibold text-blue-500 group-hover:translate-x-1 transition-transform flex items-center">
                                                        ดูรายละเอียด <Icon icon="solar:alt-arrow-right-linear" className="ml-1" />
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>

                            {/* ─── Pagination ─── */}
                            {totalPages > 1 && (
                                <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4">
                                    <p className="text-sm font-semibold text-slate-400">
                                        แสดงผล หน้า {currentPage} จาก {totalPages} ({filtered.length} รายการ)
                                    </p>
                                    <div className="flex items-center gap-1.5">
                                        <button
                                            disabled={currentPage === 1}
                                            onClick={() => handlePageChange(currentPage - 1)}
                                            className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-all disabled:opacity-40"
                                            aria-label="หน้าก่อนหน้า"
                                        >
                                            <Icon icon="solar:alt-arrow-left-linear" />
                                        </button>
                                        {getPageNumbers().map((page, index) => {
                                            if (page === '...') {
                                                return (
                                                    <span key={`ellipsis-${index}`} className="w-9 h-9 flex items-center justify-center text-slate-400 font-bold">
                                                        ...
                                                    </span>
                                                )
                                            }
                                            const pageNum = page as number
                                            const isActive = currentPage === pageNum
                                            return (
                                                <button
                                                    key={pageNum}
                                                    onClick={() => handlePageChange(pageNum)}
                                                    className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-bold transition-all ${isActive
                                                        ? 'bg-slate-900 text-white shadow-md'
                                                        : 'border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-blue-600'
                                                        }`}
                                                >
                                                    {pageNum}
                                                </button>
                                            )
                                        })}
                                        <button
                                            disabled={currentPage === totalPages}
                                            onClick={() => handlePageChange(currentPage + 1)}
                                            className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-all disabled:opacity-40"
                                            aria-label="หน้าถัดไป"
                                        >
                                            <Icon icon="solar:alt-arrow-right-linear" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </section>

            {/* ─── Footer ─── */}
            <footer className="bg-slate-50 border-t border-slate-100 py-8 px-4 sm:px-6">
                <div className="max-w-7xl mx-auto text-center">
                    <p className="text-base text-slate-400">© 2026 Canal Cuisine — โครงการวิจัยวัฒนธรรมอาหารริมคลองบางเขน-ลาดพร้าว-คลองเปรมประชากร</p>
                </div>
            </footer>

            <MenuDetailPopup 
                menu={popupMenu} 
                visible={popupVisible} 
                onCloseAction={closePopup} 
            />
        </div>
    )
}
