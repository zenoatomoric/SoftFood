'use client'
import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { Icon } from '@iconify/react'
import { MenuDetailPopup } from './MenuDetailPopup'
import '../landing.css'

const MapView = dynamic(() => import('./MapView'), {
    ssr: false,
    loading: () => (
        <div className="w-full rounded-2xl animate-pulse" style={{ height: '480px', background: 'rgba(93,184,216,.1)', border: '1.5px solid rgba(26,107,138,.18)', borderRadius: '16px' }} />
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

// Canal zones config
const CANALS = [
    { id: 'บางเขน', name: 'คลองบางเขน', theme: 'dk' as const, num: '01', subtitle: 'คลองสายแรก', color: '#5db8d8', icon: 'solar:rowing-bold-duotone', bgClass: 'bg-gradient-to-br from-[#1a5a7a] via-[#0d3a5a] to-[#2d7a5e]' },
    { id: 'เปรมประชากร', name: 'คลองเปรมประชากร', theme: 'lt' as const, num: '02', subtitle: 'คลองสายที่สอง', color: '#c8963c', icon: 'solar:compass-big-bold-duotone', bgClass: 'bg-gradient-to-br from-[#1a3a5a] via-[#2d6a4a] to-[#4a8a5a]', reversed: true },
    { id: 'ลาดพร้าว', name: 'คลองลาดพร้าว', theme: 'wm' as const, num: '03', subtitle: 'คลองสายที่สาม', color: '#c87a3c', icon: 'solar:leaf-bold-duotone', bgClass: 'bg-gradient-to-br from-[#3a5a1a] via-[#1a4a5a] to-[#0d3a4a]' },
]

const CANAL_DESCRIPTIONS: Record<string, { desc: string; chips: { icon: string; text: string }[]; identity: { icon: string; title: string; detail: string }[]; flavors: { icon: string; text: string }[] }> = {
    'บางเขน': {
        desc: 'ในอดีตพื้นที่บริเวณนี้เป็นที่รู้จักในนาม "ทุ่งบางเขน" อู่ข้าวอู่น้ำที่อุดมสมบูรณ์ด้วยท้องนาและหนองน้ำ เสน่ห์ของคลองบางเขนคือการผสมผสานวิถีชีวิตชาวบ้านที่เรียบง่ายเข้ากับความประณีตบรรจงของ "อาหารชาววัง"',
        chips: [
            { icon: 'solar:wheat-bold-duotone', text: 'วิถีชาวนา' },
            { icon: 'solar:tree-bold-duotone', text: 'สวนผลไม้ริมรั้ว' },
            { icon: 'solar:rowing-bold-duotone', text: 'จุดค้าขายทางน้ำ' },
            { icon: 'solar:crown-minimalistic-bold-duotone', text: 'อาหารชาววัง' },
        ],
        identity: [
            { icon: 'solar:wheat-bold-duotone', title: 'วิถีชาวนาและหนองน้ำ', detail: 'แหล่งปลาช่อนนา ปลาสลิด และพรรณไม้น้ำอย่างดอกโสนและบัวหลวง' },
            { icon: 'solar:tree-bold-duotone', title: 'เสน่ห์สวนผลไม้ริมรั้ว', detail: 'การหยิบจับวัตถุดิบใกล้ตัว เช่น มะเฟืองเปรี้ยว หรือกล้วยน้ำว้าท้ายสวน' },
            { icon: 'solar:rowing-bold-duotone', title: 'จุดเชื่อมต่อการค้าทางน้ำ', detail: 'นำสินค้าต่างถิ่น เช่น ปลาทูจากแม่น้ำเจ้าพระยา ผสมผสานกับผักพื้นบ้าน' },
        ],
        flavors: [
            { icon: 'solar:fish-bold-duotone', text: 'โดดเด่นด้าน "ภูมิปัญญาการถนอมอาหาร" เช่น ปลาสลิดย่างเตาถ่าน' },
            { icon: 'solar:leaf-bold-duotone', text: 'รสชาติกลมกล่อม ละเมียดละไม สะท้อนความอุดมสมบูรณ์ของระบบนิเวศริมคลอง' },
        ],
    },
    'เปรมประชากร': {
        desc: 'คลองเปรมประชากรเป็นคลองขุดสายสำคัญในสมัยรัชกาลที่ ๕ ที่ขุดเชื่อมแม่น้ำเจ้าพระยาไปจนถึงอยุธยา พื้นที่นี้มีชีวิตชีวาและเป็นจุดนัดพบของชุมชนหลากหลายชาติพันธุ์ ทั้งไทย ลาว มอญ และจีน',
        chips: [
            { icon: 'solar:rowing-bold-duotone', text: 'จุดตัดพหุวัฒนธรรม' },
            { icon: 'solar:home-angle-bold-duotone', text: 'วิถีชาวแพและป่ากก' },
            { icon: 'solar:buildings-bold-duotone', text: 'วัดเก่าแก่ศูนย์รวมใจ' },
        ],
        identity: [
            { icon: 'solar:rowing-bold-duotone', title: 'จุดตัดพหุวัฒนธรรม', detail: 'ได้รับอิทธิพลอาหารจากชุมชนมอญ (ข้าวแช่) และชาวจีน (พะโล้ต้มเค็มเตาฟืน)' },
            { icon: 'solar:home-angle-bold-duotone', title: 'วิถีชาวแพและป่ากก', detail: 'ภูมิปัญญาการนำพืชริมตลิ่งอย่าง "บอน" และ "ผักกูด" มาดัดแปลงเป็นอาหาร' },
            { icon: 'solar:buildings-bold-duotone', title: 'วัดเก่าแก่ศูนย์รวมใจ', detail: 'วัดวาอารามช่วยรักษาธรรมเนียมและอาหารพื้นถิ่นของแต่ละกลุ่มชาติพันธุ์' },
        ],
        flavors: [
            { icon: 'solar:donut-bold-duotone', text: 'ขนมโบราณ — ขนมหวานและของว่างตามเทศกาลสืบทอดผ่านชุมชนใกล้วัด' },
            { icon: 'solar:chef-hat-minimalistic-bold-duotone', text: 'แกงพื้นถิ่น — แกงบอนสุพรรณิการ์ แกงเขียวหวานหน่อไม้ไผ่ตง ใช้วัตถุดิบจากริมน้ำ' },
        ],
    },
    'ลาดพร้าว': {
        desc: 'คลองลาดพร้าวพาดผ่านย่านชุมชนที่เป็นเสมือนพื้นที่รอยต่อระหว่างความเป็นเมืองใหม่กับวิถีชีวิตเก่าริมน้ำ ในอดีตพื้นที่แถบนี้คือ "ทุ่งบางกะปิ" อันกว้างใหญ่ที่อุดมสมบูรณ์ด้วยท้องนาและสวนมะพร้าว',
        chips: [
            { icon: 'solar:wheat-bold-duotone', text: 'ตู้กับข้าวริมรั้ว' },
            { icon: 'solar:rowing-bold-duotone', text: 'เสบียงชาวเรือ' },
            { icon: 'solar:buildings-bold-duotone', text: 'มรดกความหวาน' },
        ],
        identity: [
            { icon: 'solar:wheat-bold-duotone', title: 'ตู้กับข้าวริมรั้วและท้องทุ่ง', detail: 'วิถีการใช้วัตถุดิบหาง่ายรอบตัว เช่น หอยขมนา ปลากด และพืชผักริมตลิ่ง' },
            { icon: 'solar:rowing-bold-duotone', title: 'เสบียงชาวเรือ', detail: 'ภูมิปัญญาอย่าง "น้ำพริกลงเรือ" เพื่อเป็นเสบียงเดินทาง' },
            { icon: 'solar:buildings-bold-duotone', title: 'มรดกความหวาน', detail: 'ชุมชนริมคลองยังคงรักษาธรรมเนียมทำขนมหวานโบราณแบบดั้งเดิม' },
        ],
        flavors: [
            { icon: 'solar:chef-hat-bold-duotone', text: 'ข้าวแกงและแกงพื้นถิ่น — รสชาติจัดจ้าน เข้มข้นถึงเครื่องเทศ' },
            { icon: 'solar:pallete-2-bold-duotone', text: 'ของหวานโบราณ — ความหอมหวานจากน้ำตาลมะพร้าวและกะทิสด' },
        ],
    },
}

const ITEMS_PER_CANAL = 6

export default function LandingPage({ isLoggedIn }: { isLoggedIn: boolean }) {
    const [menus, setMenus] = useState<MenuItem[]>([])
    const [loading, setLoading] = useState(true)
    const [popupMenu, setPopupMenu] = useState<MenuItem | null>(null)
    const [popupVisible, setPopupVisible] = useState(false)
    const [heroSlide, setHeroSlide] = useState(0)
    const [canalFilters, setCanalFilters] = useState<Record<string, string>>({
        'บางเขน': 'sig', 'เปรมประชากร': 'sig', 'ลาดพร้าว': 'sig'
    })
    const [canalShowAll, setCanalShowAll] = useState<Record<string, boolean>>({})
    const heroRef = useRef<ReturnType<typeof setInterval> | null>(null)

    useEffect(() => {
        const fetchMenus = async () => {
            try {
                const res = await fetch('/api/public/menus')
                const json = await res.json()
                if (res.ok) setMenus(json.data || [])
            } catch (err) { console.error('Failed to fetch menus:', err) }
            finally { setLoading(false) }
        }
        fetchMenus()
    }, [])

    useEffect(() => {
        heroRef.current = setInterval(() => setHeroSlide(s => (s + 1) % 3), 6000)
        return () => { if (heroRef.current) clearInterval(heroRef.current) }
    }, [])

    const goSlide = (i: number) => {
        setHeroSlide(i)
        if (heroRef.current) clearInterval(heroRef.current)
        heroRef.current = setInterval(() => setHeroSlide(s => (s + 1) % 3), 6000)
    }

    useEffect(() => {
        const els = document.querySelectorAll('.reveal')
        const obs = new IntersectionObserver(entries => {
            entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('vis'); obs.unobserve(e.target) } })
        }, { threshold: 0.15 })
        els.forEach(el => obs.observe(el))
        return () => obs.disconnect()
    }, [loading])

    const stats = useMemo(() => {
        const totalMenus = menus.length
        const totalCanals = new Set(menus.map(m => m.canal_zone).filter(c => c !== 'ไม่ระบุ')).size
        const totalSignature = menus.filter(m => m.selection_status.includes('ซิกเนเจอร์')).length
        const totalInformants = new Set(menus.map(m => m.informant_name).filter(n => n !== 'ไม่ระบุ')).size
        return { totalMenus, totalCanals, totalSignature, totalInformants }
    }, [menus])

    const menusByCanal = useMemo(() => {
        const grouped: Record<string, MenuItem[]> = {}
        CANALS.forEach(c => { grouped[c.id] = [] })
        menus.forEach(m => { if (grouped[m.canal_zone]) grouped[m.canal_zone].push(m) })
        Object.keys(grouped).forEach(key => {
            grouped[key].sort((a, b) => {
                const aSig = a.selection_status.includes('ซิกเนเจอร์') ? 2 : a.selection_status.includes('36') ? 1 : 0
                const bSig = b.selection_status.includes('ซิกเนเจอร์') ? 2 : b.selection_status.includes('36') ? 1 : 0
                return bSig - aSig
            })
        })
        return grouped
    }, [menus])

    const getFilteredMenus = useCallback((canalId: string) => {
        const items = menusByCanal[canalId] || []
        const filter = canalFilters[canalId] || 'sig'
        if (filter === 'sig') return items.filter(m => m.selection_status.includes('ซิกเนเจอร์'))
        if (filter === 'rec') return items.filter(m => m.selection_status.includes('36'))
        return items
    }, [menusByCanal, canalFilters])

    const openPopup = (menu: MenuItem) => {
        setPopupMenu(menu)
        setTimeout(() => setPopupVisible(true), 10)
        document.body.style.overflow = 'hidden'
    }
    const closePopup = () => {
        setPopupVisible(false)
        setTimeout(() => { setPopupMenu(null); document.body.style.overflow = '' }, 300)
    }

    const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    const setFilter = (canal: string, f: string) => setCanalFilters(prev => ({ ...prev, [canal]: f }))

    return (
        <div className="landing-root">
            {/* ─── NAVBAR ─── */}
            <nav className="lp-navbar" id="navbar">
                {/* <div className="pstrip">
                    <span>โครงการวิจัยและพัฒนา · มหาวิทยาลัยราชภัฏจันทรเกษม</span>
                    <div className="plogos">
                        <span className="ppill"><Icon icon="solar:square-academic-cap-bold" width={11} style={{ marginRight: 3 }} />CRU</span>
                        <span className="ppill"><Icon icon="solar:city-bold" width={11} style={{ marginRight: 3 }} />เขตจตุจักร</span>
                        <span className="ppill"><Icon icon="solar:city-bold" width={11} style={{ marginRight: 3 }} />เขตหลักสี่</span>
                        <span className="ppill"><Icon icon="solar:mask-happly-bold" width={11} style={{ marginRight: 3 }} />กรมส่งเสริมวัฒนธรรม</span>
                        <span className="ppill"><Icon icon="solar:buildings-bold" width={11} style={{ marginRight: 3 }} />วัดทางหลวง</span>
                    </div>
                </div> */}
                <div className="nav-main">
                    <Link href="/" className="nav-logo">
                        <div className="nav-logo-icon"><Icon icon="solar:water-sun-bold" width={18} /></div>
                        <div><div className="nl-th">อาหารไทยริมคลอง</div><div className="nl-en">Thai Canal Heritage</div></div>
                    </Link>
                    <ul className="nav-links">
                        <li><a href="#story" onClick={e => { e.preventDefault(); scrollTo('story') }}>หน้าหลัก</a></li>
                        <li><a href="#mapSec" onClick={e => { e.preventDefault(); scrollTo('mapSec') }}>แผนที่</a></li>
                        <li><a href="#canalSec" onClick={e => { e.preventDefault(); scrollTo('canalSec') }}>สามคลอง</a></li>
                        <li><a href="#partners" onClick={e => { e.preventDefault(); scrollTo('partners') }}>พันธมิตร</a></li>
                        <li>
                            <Link href={isLoggedIn ? '/home' : '/login'} className="nav-cta">
                                <Icon icon={isLoggedIn ? 'solar:chart-square-bold' : 'solar:chef-hat-minimalistic-bold'} width={14} style={{ marginRight: 4 }} />
                                {isLoggedIn ? 'แดชบอร์ด' : 'สำหรับเจ้าหน้าที่'}
                            </Link>
                        </li>
                    </ul>
                </div>
            </nav>

            {/* ─── HERO ─── */}
            <section className="lp-hero">
                <div className={`csl cs1 ${heroSlide === 0 ? 'act' : ''}`} />
                <div className={`csl cs2 ${heroSlide === 1 ? 'act' : ''}`} />
                <div className={`csl cs3 ${heroSlide === 2 ? 'act' : ''}`} />
                <div className="hdeco" />
                {/* SVG wave animations */}
                <div className="hero-waves">
                    <svg className="hw hw1" viewBox="0 0 2880 120" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
                        <path d="M0,60 C240,120 480,0 720,60 C960,120 1200,0 1440,60 C1680,120 1920,0 2160,60 C2400,120 2640,0 2880,60 L2880,120 L0,120 Z" fill="rgba(93,184,216,.06)" />
                    </svg>
                    <svg className="hw hw2" viewBox="0 0 2880 120" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
                        <path d="M0,80 C360,20 720,100 1080,40 C1440,100 1800,20 2160,80 C2520,20 2700,100 2880,60 L2880,120 L0,120 Z" fill="rgba(200,150,60,.04)" />
                    </svg>
                    <svg className="hw hw3" viewBox="0 0 2880 120" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
                        <path d="M0,40 C180,100 540,10 720,70 C900,10 1260,100 1440,40 C1620,100 1980,10 2160,70 C2340,10 2700,100 2880,40 L2880,120 L0,120 Z" fill="rgba(93,184,216,.045)" />
                    </svg>
                </div>
                <div className="hero-cnt">
                    <div className="heb"><Icon icon="solar:star-shine-bold" width={12} style={{ marginRight: 6 }} />Soft Power · มรดกอาหารแห่งสายน้ำ<Icon icon="solar:star-shine-bold" width={12} style={{ marginLeft: 6 }} /></div>
                    <h1 className="ht">อาหารไทยริมคลอง<span className="gline">รสชาติที่หยั่งรากในสายน้ำ</span></h1>
                    <p className="hs">
                        บันทึก อนุรักษ์ และยกระดับอาหารพื้นถิ่นริมคลองสามสายในกรุงเทพฯ<br />
                        {/* รวม <strong style={{ color: 'var(--gl)' }}>{loading ? '...' : `${stats.totalMenus} รายการ`}</strong> จาก {loading ? '...' : stats.totalInformants} ครัวเรือน */}
                    </p>
                    <div className="hero-ctags">
                        {CANALS.map(c => {
                            return (
                                <div key={c.id} className="cpill" onClick={() => scrollTo(`canal-${c.id}`)}>
                                    <div className="dot" />{c.name}
                                </div>
                            )
                        })}
                    </div>
                    <div className="hbtns">
                        <button className="btn-hp" onClick={() => scrollTo('mapSec')}><Icon icon="solar:map-bold" width={16} style={{ marginRight: 6 }} />ดูแผนที่จริง</button>
                        <button className="btn-ho" onClick={() => scrollTo('canalSec')}><Icon icon="solar:chef-hat-bold" width={16} style={{ marginRight: 6 }} />สำรวจรายคลอง</button>
                    </div>
                </div>
                <div className="c-dots">
                    {[0, 1, 2].map(i => <button key={i} className={`dot-i ${heroSlide === i ? 'act' : ''}`} onClick={() => goSlide(i)} />)}
                </div>
                <div className="hero-wave">
                    <svg viewBox="0 0 1440 60" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
                        <path d="M0,30 C240,60 480,0 720,30 C960,60 1200,0 1440,30 L1440,60 L0,60 Z" fill="#f9f3e8" />
                    </svg>
                </div>
            </section>

            {/* ─── STORY ─── */}
            <section className="story-sec" id="story">
                <div className="ctr">
                    <div className="story-grid">
                        <div className="reveal">
                            <div className="sec-label">เรื่องราวของพื้นที่</div>
                            <div className="bquote">เสน่ห์แห่งสายน้ำ<br /><em>รสชาติที่ยังมีลมหายใจ</em></div>
                            <p className="sbody">วิถีชีวิตริมคลองไม่ได้มีเพียงเรื่องราวของสายน้ำ แต่ยังซ่อน &quot;รสชาติ&quot; และตำรับอาหารพื้นถิ่นที่สืบทอดและหล่อเลี้ยงผู้คนในชุมชนมาอย่างยาวนาน</p>
                            <p className="sbody">ในพื้นที่เขตจตุจักร ไม่ว่าจะเป็น <strong>ชุมชนเคหะสถานเจริญชัย</strong> <strong>ชุมชนวัดบางบัว</strong> <strong>ชุมชนประชาร่วมใจ 2</strong> และ <strong>ชุมชนหลัง วค.จันทรเกษม</strong> ล้วนมีเสน่ห์ของอาหารพื้นถิ่นที่ซ่อนตัวอยู่</p>
                            <p className="sbody">เพื่อไม่ให้ร่องรอยความอร่อยเหล่านี้เลือนหายไป โครงการนี้จึงอาศัยความร่วมมือของคณาจารย์ เจ้าหน้าที่ และนักศึกษา ในการลงพื้นที่สืบค้นข้อมูลอย่างใกล้ชิด เพื่อบันทึกและยกระดับรสชาติอาหารพื้นถิ่นเป็น <strong>Soft Power</strong> ที่พร้อมส่งต่อเรื่องราวและเสน่ห์ของวิถีริมคลองต่อไป</p>
                            <div className="s-stats reveal">
                                <div><div className="ss-num">{loading ? '…' : stats.totalMenus}</div><div className="ss-unit">รายการ</div><div className="ss-lbl">อาหารที่บันทึก</div></div>
                                <div><div className="ss-num">{loading ? '…' : stats.totalInformants}</div><div className="ss-unit">ครัวเรือน</div><div className="ss-lbl">ผู้ให้ข้อมูล</div></div>
                                <div><div className="ss-num">{loading ? '…' : stats.totalSignature}</div><div className="ss-unit">รายการ</div><div className="ss-lbl">เมนู Signature</div></div>
                            </div>
                        </div>
                        <div className="reveal">
                            <div className="cdiag">
                                <div className="cdiag-title"><Icon icon="solar:compass-big-bold" width={14} style={{ marginRight: 5 }} />ผังสายน้ำ  กรุงเทพฯ ฝั่งเหนือ</div>
                                <div className="cdiag-river">
                                    <Icon icon="solar:waterdrops-bold-duotone" width={22} style={{ color: 'var(--cl)' }} />
                                    <div><div className="rn">แม่น้ำเจ้าพระยา</div><div className="rd">สายน้ำหลัก · เชื่อม 3 คลองสาขา</div></div>
                                </div>
                                <div className="cdiag-arr"><Icon icon="solar:alt-arrow-down-bold" width={16} /></div>
                                {CANALS.map(c => {
                                    const items = menusByCanal[c.id] || []
                                    const sigCount = items.filter(m => m.selection_status.includes('ซิกเนเจอร์')).length
                                    const recCount = items.filter(m => m.selection_status.includes('36')).length
                                    return (
                                        <div key={c.id} className="cdi" onClick={() => scrollTo(`canal-${c.id}`)}>
                                            <div className="cdi-bar" style={{ background: c.color }} />
                                            <div>
                                                <div className="cdi-cn">{c.name}</div>
                                            </div>
                                            <div className="cdi-arr"><Icon icon="solar:alt-arrow-right-linear" width={13} /></div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── MAP ─── */}
            <section className="map-sec" id="mapSec">
                <div className="ctr">
                    <div className="map-hdr reveal">
                        <div className="sec-label">พิกัดจริงจากการสำรวจ</div>
                        <h2 className="sh">แผนที่จุดอาหารริมคลอง</h2>
                        <p className="sub">แผนที่แสดงตำแหน่งอาหารริมคลอง จากการลงสำรวจพื้นที่จริงทั้ง 3 คลอง</p>
                    </div>
                    <div className="reveal">
                        <MapView
                            menus={menus}
                            activeCanal="all"
                            onMenuClick={(menuId) => {
                                const m = menus.find(x => x.menu_id === menuId)
                                if (m) openPopup(m)
                            }}
                        />
                    </div>
                </div>
            </section>

            {/* ─── CANAL SECTIONS ─── */}
            <div id="canalSec">
                {CANALS.map((canal, idx) => {
                    const canalData = CANAL_DESCRIPTIONS[canal.id]
                    const filteredItems = getFilteredMenus(canal.id)
                    const currentFilter = canalFilters[canal.id] || 'sig'
                    const showAll = canalShowAll[canal.id] || false
                    const displayItems = showAll ? filteredItems : filteredItems.slice(0, ITEMS_PER_CANAL)
                    const allItems = menusByCanal[canal.id] || []

                    return (
                        <div key={canal.id}>
                            {idx > 0 && (
                                <div className="svg-divider" style={{ background: idx === 1 ? 'var(--cd)' : 'var(--ow)' }}>
                                    <svg viewBox="0 0 1440 50" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
                                        <path d="M0,25 C360,50 720,0 1080,25 C1260,37 1380,12 1440,25 L1440,50 L0,50 Z"
                                            fill={idx === 1 ? 'var(--ow)' : '#f4ece0'} />
                                    </svg>
                                </div>
                            )}

                            <div className={`cblock ${canal.theme}`} id={`canal-${canal.id}`}>
                                <div className="ctr">
                                    <div className={`canal-top reveal ${canal.reversed ? 'rev' : ''}`}>
                                        <div>
                                            <span className="cnum">{canal.num}</span>
                                            <div className="ctag">{canal.subtitle}</div>
                                            <h3>{canal.name}</h3>
                                            <div className="gold-div"><div className="d" /></div>
                                            <p className="cdesc">{canalData?.desc}</p>
                                            <div className="fchips">
                                                {canalData?.chips.map((ch, i) => (
                                                    <div key={i} className="fchip">
                                                        <Icon icon={ch.icon} width={13} style={{ marginRight: 4, opacity: .7 }} />{ch.text}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="cphoto">
                                            <div className={canal.bgClass} style={{ height: '100%' }}>
                                                <div className="cp-inner">
                                                    <Icon icon={canal.icon} width={60} style={{ opacity: .12, animation: `fl ${4 + idx * 0.5}s ease-in-out infinite ${idx * 0.5}s` }} />
                                                </div>
                                            </div>
                                            <div className="cplabel">
                                                <div className="cptag" style={{ marginBottom: 0 }}>{canal.name}</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Food list */}
                                    <div className="food-section reveal">
                                        <div className="filter-row">
                                            <span className="filter-label">เรียงลำดับ:</span>
                                            <button className={`ff-btn ff-btn-sig ${currentFilter === 'sig' ? 'on' : ''}`} onClick={() => { setFilter(canal.id, 'sig'); setCanalShowAll(p => ({ ...p, [canal.id]: false })) }}>
                                                <Icon icon="solar:star-bold" width={12} style={{ marginRight: 4 }} />Signature
                                            </button>
                                            <button className={`ff-btn ff-btn-rec ${currentFilter === 'rec' ? 'on' : ''}`} onClick={() => { setFilter(canal.id, 'rec'); setCanalShowAll(p => ({ ...p, [canal.id]: false })) }}>
                                                <Icon icon="solar:star-shine-bold" width={12} style={{ marginRight: 4 }} />แนะนำ
                                            </button>
                                            <button className={`ff-btn ff-btn-all ${currentFilter === 'all' ? 'on' : ''}`} onClick={() => { setFilter(canal.id, 'all'); setCanalShowAll(p => ({ ...p, [canal.id]: false })) }}>ทั้งหมด</button>
                                            <span className="filter-count">{filteredItems.length} รายการ</span>
                                        </div>

                                        {loading ? (
                                            <div className="food-grid">
                                                {[...Array(3)].map((_, i) => (
                                                    <div key={i} className="fcard-reg" style={{ height: 120, opacity: .3 }}>
                                                        <div style={{ height: '100%', background: 'rgba(255,255,255,.05)', borderRadius: 8 }} />
                                                    </div>
                                                ))}
                                            </div>
                                        ) : filteredItems.length === 0 ? (
                                            <div style={{ textAlign: 'center', padding: '48px 20px', borderRadius: 14, border: '1.5px dashed rgba(200,150,60,.25)', background: 'rgba(200,150,60,.04)' }}>
                                                <Icon icon="solar:magnifer-zoom-in-bold-duotone" style={{ fontSize: 36, color: 'var(--go)', marginBottom: 10, display: 'block', margin: '0 auto 10px' }} />
                                                <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--go)' }}>ไม่พบรายการอาหารในหมวดหมู่นี้</p>
                                                <p style={{ fontSize: 12, color: canal.theme === 'dk' ? 'rgba(255,255,255,.45)' : 'var(--tl)', marginTop: 4 }}>ลองเลือกหมวดหมู่อื่น หรือดูทั้งหมด</p>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="food-grid">
                                                    {displayItems.map(menu => {
                                                        const isSig = menu.selection_status.includes('ซิกเนเจอร์')
                                                        const isRec = menu.selection_status.includes('36')

                                                        if (isSig) {
                                                            return (
                                                                <div key={menu.menu_id} className="fcard-sig" onClick={() => openPopup(menu)}>
                                                                    <div className="sig-img">
                                                                        {menu.thumbnail ? (
                                                                            <img src={menu.thumbnail} alt={menu.menu_name} loading="lazy" />
                                                                        ) : (
                                                                            <img src={menu.category?.includes('คาว') ? '/menu2.png' : menu.category?.includes('หวาน') ? '/menu3.png' : '/menu1.png'} alt={menu.menu_name} loading="lazy" />
                                                                        )}
                                                                        <div className="sig-star-badge"><Icon icon="solar:star-bold" width={10} style={{ marginRight: 3 }} />Signature</div>
                                                                    </div>
                                                                    <div className="sig-body">
                                                                        <div className="sig-name">{menu.menu_name}</div>
                                                                        <div className="sig-com">{menu.address || menu.canal_zone}</div>
                                                                        <div className="sig-story">{menu.story || 'ตำรับอาหารดั้งเดิมจากชุมชนริมคลอง'}</div>
                                                                        <div className="sig-meta">
                                                                            <span className="sig-badge">Signature</span>
                                                                            <span style={{ fontSize: 9, opacity: .5 }}>{menu.category}</span>
                                                                        </div>
                                                                    </div>
                                                                </div> 
                                                            )
                                                        }

                                                        return (
                                                            <div key={menu.menu_id} className="fcard-reg" onClick={() => openPopup(menu)}>
                                                                {isRec && <div className="rec-badge"><Icon icon="solar:star-shine-bold" width={10} style={{ marginRight: 3 }} />แนะนำ</div>}
                                                                <div className="fc-type">{menu.category}</div>
                                                                <div className="fc-name">{menu.menu_name}</div>
                                                                <div className="fc-com">{menu.address || menu.canal_zone}</div>
                                                            </div>
                                                        )
                                                    })}
                                                </div>

                                                {!showAll && filteredItems.length > ITEMS_PER_CANAL && (
                                                    <button className="show-more" onClick={() => setCanalShowAll(p => ({ ...p, [canal.id]: true }))}>
                                                        แสดงเพิ่มเติม ({filteredItems.length - ITEMS_PER_CANAL} รายการ) <Icon icon="solar:alt-arrow-right-linear" width={13} style={{ marginLeft: 4 }} />
                                                    </button>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* ─── IMPACT ─── */}
            <section className="impact-sec">
                <div className="ctr">
                    <div className="impact-grid reveal">
                        <div className="imp"><Icon icon="solar:chef-hat-bold-duotone" className="imp-icon" style={{ color: 'var(--gl)' }} /><div className="imp-num">{loading ? '…' : stats.totalMenus}</div><div className="imp-lbl">รายการอาหารที่บันทึก</div></div>
                        <div className="imp"><Icon icon="solar:waterdrops-bold-duotone" className="imp-icon" style={{ color: 'var(--cl)' }} /><div className="imp-num">{loading ? '…' : stats.totalCanals}</div><div className="imp-lbl">คลองสายน้ำ</div></div>
                        <div className="imp"><Icon icon="solar:star-bold-duotone" className="imp-icon" style={{ color: 'var(--gl)' }} /><div className="imp-num">{loading ? '…' : stats.totalSignature}</div><div className="imp-lbl">เมนู Signature</div></div>
                        <div className="imp"><Icon icon="solar:users-group-rounded-bold-duotone" className="imp-icon" style={{ color: 'var(--cl)' }} /><div className="imp-num">{loading ? '…' : stats.totalInformants}</div><div className="imp-lbl">ครัวเรือนผู้ให้ข้อมูล</div></div>
                    </div>
                </div>
            </section>

            {/* ─── PARTNERS ─── */}
            <section className="partners-sec" id="partners">
                <div className="ctr">
                    <div className="partners-hdr reveal"><div className="sec-label">พันธมิตรโครงการ</div><h2 className="sh" style={{ color: 'var(--cd)' }}>หน่วยงานที่ร่วมสนับสนุน</h2></div>
                    <div className="marquee-container reveal">
                        <div className="marquee-track">
                            {/* Set 1 */}
                            <div className="pcard"><img src="/มจษ..png" alt="CRU" className="w-14 h-14 md:w-16 md:h-16 object-contain mb-4 mx-auto" /><div className="pn">มหาวิทยาลัยราชภัฏจันทรเกษม</div><div className="pt">สถาบันการศึกษา</div></div>
                            <div className="pcard"><img src="/มส..png" alt="Humanities" className="w-14 h-14 md:w-16 md:h-16 object-contain mb-4 mx-auto" /><div className="pn">คณะมนุษยศาสตร์และสังคมศาสตร์</div><div className="pt">คณะวิชา</div></div>
                            <div className="pcard"><img src="/วจก.png" alt="Management Science" className="w-14 h-14 md:w-16 md:h-16 object-contain mb-4 mx-auto" /><div className="pn">คณะวิทยาการจัดการ</div><div className="pt">คณะวิชา</div></div>
                            <div className="pcard"><img src="/วท..png" alt="Science" className="w-14 h-14 md:w-16 md:h-16 object-contain mb-4 mx-auto" /><div className="pn">คณะวิทยาศาสตร์</div><div className="pt">คณะวิชา</div></div>
                            <div className="pcard"><img src="/กทม..jpg" alt="BMA" className="w-14 h-14 md:w-16 md:h-16 object-contain mb-4 mx-auto mix-blend-multiply" /><div className="pn">สำนักงานเขตจตุจักร</div><div className="pt">หน่วยงานท้องถิ่น</div></div>
                            <div className="pcard"><img src="/กทม..jpg" alt="BMA" className="w-14 h-14 md:w-16 md:h-16 object-contain mb-4 mx-auto mix-blend-multiply" /><div className="pn">สำนักงานเขตหลักสี่</div><div className="pt">หน่วยงานท้องถิ่น</div></div>
                            <div className="pcard"><img src="/สำนักงานวัฒนธรรม จังหวัดนนทบุรี.jpg" alt="Nonthaburi Culture" className="w-14 h-14 md:w-16 md:h-16 object-contain mb-4 mx-auto mix-blend-multiply" /><div className="pn">สำนักงานวัฒนธรรม จังหวัดนนทบุรี</div><div className="pt">หน่วยงานรัฐ</div></div>
                            <div className="pcard"><img src="/อบจ.นนทบุรี.jpg" alt="Nonthaburi PAO" className="w-14 h-14 md:w-16 md:h-16 object-contain mb-4 mx-auto mix-blend-multiply" /><div className="pn">อบจ. นนทบุรี</div><div className="pt">องค์กรปกครองส่วนท้องถิ่น</div></div>
                            <div className="pcard"><img src="/กรมส่งเสริมวัฒนธรรม.png" alt="Department of Cultural Promotion" className="w-14 h-14 md:w-16 md:h-16 object-contain mb-4 mx-auto" /><div className="pn">กรมส่งเสริมวัฒนธรรม</div><div className="pt">หน่วยงานรัฐ</div></div>
                            <div className="pcard"><img src="/ศูนย์ศึกษาพระพุทธศาสนาวันอาทิตย์วัดทางหลวง.jpg" alt="Wat Thang Luang" className="w-14 h-14 md:w-16 md:h-16 object-cover rounded-full mb-4 mx-auto" /><div className="pn mt-2">วัดทางหลวง</div><div className="pt">วัดและชุมชน</div></div>
                            {/* Set 2 (Duplicate for loop) */}
                            <div className="pcard"><img src="/มจษ..png" alt="CRU" className="w-14 h-14 md:w-16 md:h-16 object-contain mb-4 mx-auto" /><div className="pn">มหาวิทยาลัยราชภัฏจันทรเกษม</div><div className="pt">สถาบันการศึกษา</div></div>
                            <div className="pcard"><img src="/มส..png" alt="Humanities" className="w-14 h-14 md:w-16 md:h-16 object-contain mb-4 mx-auto" /><div className="pn">คณะมนุษยศาสตร์และสังคมศาสตร์</div><div className="pt">คณะวิชา</div></div>
                            <div className="pcard"><img src="/วจก.png" alt="Management Science" className="w-14 h-14 md:w-16 md:h-16 object-contain mb-4 mx-auto" /><div className="pn">คณะวิทยาการจัดการ</div><div className="pt">คณะวิชา</div></div>
                            <div className="pcard"><img src="/วท..png" alt="Science" className="w-14 h-14 md:w-16 md:h-16 object-contain mb-4 mx-auto" /><div className="pn">คณะวิทยาศาสตร์</div><div className="pt">คณะวิชา</div></div>
                            <div className="pcard"><img src="/กทม..jpg" alt="BMA" className="w-14 h-14 md:w-16 md:h-16 object-contain mb-4 mx-auto mix-blend-multiply" /><div className="pn">สำนักงานเขตจตุจักร</div><div className="pt">หน่วยงานท้องถิ่น</div></div>
                            <div className="pcard"><img src="/กทม..jpg" alt="BMA" className="w-14 h-14 md:w-16 md:h-16 object-contain mb-4 mx-auto mix-blend-multiply" /><div className="pn">สำนักงานเขตหลักสี่</div><div className="pt">หน่วยงานท้องถิ่น</div></div>
                            <div className="pcard"><img src="/สำนักงานวัฒนธรรม จังหวัดนนทบุรี.jpg" alt="Nonthaburi Culture" className="w-14 h-14 md:w-16 md:h-16 object-contain mb-4 mx-auto mix-blend-multiply" /><div className="pn">สำนักงานวัฒนธรรม จังหวัดนนทบุรี</div><div className="pt">หน่วยงานรัฐ</div></div>
                            <div className="pcard"><img src="/อบจ.นนทบุรี.jpg" alt="Nonthaburi PAO" className="w-14 h-14 md:w-16 md:h-16 object-contain mb-4 mx-auto mix-blend-multiply" /><div className="pn">อบจ. นนทบุรี</div><div className="pt">องค์กรปกครองส่วนท้องถิ่น</div></div>
                            <div className="pcard"><img src="/กรมส่งเสริมวัฒนธรรม.png" alt="Department of Cultural Promotion" className="w-14 h-14 md:w-16 md:h-16 object-contain mb-4 mx-auto" /><div className="pn">กรมส่งเสริมวัฒนธรรม</div><div className="pt">หน่วยงานรัฐ</div></div>
                            <div className="pcard"><img src="/ศูนย์ศึกษาพระพุทธศาสนาวันอาทิตย์วัดทางหลวง.jpg" alt="Wat Thang Luang" className="w-14 h-14 md:w-16 md:h-16 object-cover rounded-full mb-4 mx-auto" /><div className="pn mt-2">วัดทางหลวง</div><div className="pt">วัดและชุมชน</div></div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── FOOTER ─── */}
            <footer className="lp-footer">
                <div className="ctr">
                    <div className="footer-grid">
                        <div>
                            <div className="fb-name"><Icon icon="solar:water-sun-bold" width={16} style={{ marginRight: 6, color: 'var(--gl)' }} />Soft Power อาหารไทยริมคลอง</div>
                            <div className="fb-sub">Thai Canal Food Heritage</div>
                            <p className="fb-desc">ภายใต้โครงการ Soft Power ยกระดับอาหารพื้นถิ่น (อาหารริมคลอง) คลองบางเขน คลองเปรมประชากร และคลองลาดพร้าว</p>
                        </div>
                        <div className="fc-col">
                            <h4>สำรวจ</h4>
                            <ul>
                                <li><a href="#story" onClick={e => { e.preventDefault(); scrollTo('story') }}>หน้าหลักโครงการ</a></li>
                                <li><a href="#mapSec" onClick={e => { e.preventDefault(); scrollTo('mapSec') }}>แผนที่พิกัด 372 จุด</a></li>
                                <li><a href="#canal-บางเขน" onClick={e => { e.preventDefault(); scrollTo('canal-บางเขน') }}>สำรวจคลองบางเขน</a></li>
                                <li><a href="#canal-เปรมประชากร" onClick={e => { e.preventDefault(); scrollTo('canal-เปรมประชากร') }}>สำรวจคลองเปรมประชากร</a></li>
                                <li><a href="#canal-ลาดพร้าว" onClick={e => { e.preventDefault(); scrollTo('canal-ลาดพร้าว') }}>สำรวจคลองลาดพร้าว</a></li>
                            </ul>
                        </div>
                        <div className="fc-col">
                            <h4>ฐานข้อมูล</h4>
                            <ul>
                                <li><span className="flink" onClick={() => scrollTo('canalSec')}>เมนูอาหารทั้งหมด</span></li>
                                <li><span className="flink" onClick={() => { CANALS.forEach(c => setFilter(c.id, 'sig')); scrollTo('canalSec') }}>รายการอาหาร Signature</span></li>
                                <li><span className="flink" onClick={() => { CANALS.forEach(c => setFilter(c.id, 'rec')); scrollTo('canalSec') }}>รายการอาหารที่แนะนำ</span></li>
                            </ul>
                        </div>
                        <div className="fc-col">
                            <h4>ติดต่อโครงการ</h4>
                            <ul>
                                <li><span style={{ fontSize: 12, color: 'rgba(255,255,255,.5)' }}><Icon icon="solar:square-academic-cap-bold" width={13} style={{ marginRight: 4 }} />คณะมนุษยศาสตร์และสังคมศาสตร์ มหาวิทยาลัยราชภัฏจันทรเกษม (CRU)</span></li>
                                <li><span style={{ fontSize: 12, color: 'rgba(255,255,255,.4)' }}><Icon icon="solar:map-point-bold" width={13} style={{ marginRight: 4 }} />39/1 ถ.รัชดาภิเษก แขวงจันทรเกษม เขตจตุจักร กรุงเทพฯ 10900</span></li>
                                <li><span style={{ fontSize: 12, color: 'rgba(255,255,255,.4)' }}><Icon icon="solar:letter-bold" width={13} style={{ marginRight: 4 }} />research.cru@chandra.ac.th</span></li>
                            </ul>
                        </div>
                    </div>
                    <div className="footer-bot">
                        <div className="cp">© 2569 โครงการ Soft Power อาหารไทยริมคลอง · มหาวิทยาลัยราชภัฏจันทรเกษม สงวนลิขสิทธิ์</div>
                    </div>
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
