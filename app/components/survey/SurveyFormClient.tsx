'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Icon } from '@iconify/react'
import ConfirmModal from '../ConfirmModal'
import IngredientCombobox from './IngredientCombobox'
import { compressImage } from '@/utils/image-compression'

// ─── Types & Options ───────────────
interface IngredientRow { ingredient_type: 'วัตถุดิบ' | 'เครื่องปรุง/สมุนไพร'; ref_ing_id: string; name: string; quantity: string; unit: string; note: string; is_main_ingredient: boolean }
interface StepRow { step_type: 'เตรียม' | 'ปรุง'; step_order: number; instruction: string }
interface Photo { url: string; caption: string }
const CATEGORIES = ['อาหารคาว', 'อาหารหวาน', 'อาหารว่าง/เครื่องดื่ม']
const POPULARITY_OPTIONS = ['เป็นที่รู้จักทั่วไป', 'รู้จักในชุมชน', 'รู้จักเฉพาะกลุ่ม', 'แทบไม่มีใครรู้จัก']
const RITUAL_OPTIONS = ['งานบุญ/งานศพ', 'เทศกาลประจำปี', 'วันพิเศษ/วันหยุด', 'กินประจำวัน', 'งานเลี้ยง/สังสรรค์', 'ไม่เกี่ยวกับโอกาสใด', 'อื่นๆ']
const SEASON_OPTIONS = ['ตลอดทั้งปี', 'ฤดูร้อน', 'ฤดูฝน', 'ฤดูหนาว', 'ช่วงเทศกาล']
const SOURCE_OPTIONS = ['ปลูก/เลี้ยงเอง', 'ตลาดในชุมชน', 'ตลาดนอกชุมชน', 'ห้างสรรพสินค้า/ซุปเปอร์มาร์เก็ต', 'สั่งออนไลน์', 'หาจากธรรมชาติ']
const HEALTH_OPTIONS = ['บำรุงร่างกาย', 'ช่วยย่อยอาหาร', 'แก้ร้อนใน', 'บำรุงผิวพรรณ', 'ลดความดัน', 'บำรุงกระดูก', 'แก้หวัด/ไอ', 'ให้พลังงาน', 'อื่นๆ']
const FREQ_OPTIONS = ['ทุกวัน', 'สัปดาห์ละ 2-3 ครั้ง', 'สัปดาห์ละครั้ง', 'เดือนละ 1-2 ครั้ง', 'นานๆ ครั้ง']
const COMPLEXITY_OPTIONS = ['ง่ายมาก', 'ค่อนข้างง่าย', 'ปานกลาง', 'ค่อนข้างยาก', 'ยากมาก']
const TASTE_OPTIONS = ['จืด', 'หวาน', 'เค็ม', 'เปรี้ยว', 'เผ็ด', 'มัน', 'ขม', 'กลมกล่อม', 'จัดจ้าน']
const HERITAGE_OPTIONS = ['ยังมีการสืบทอดทั่วไป', 'สืบทอดเฉพาะในครอบครัว', 'เสี่ยงสูญหาย', 'แทบสูญหายแล้ว']
const SECTION_TITLES = [
    { num: '๒', title: 'ข้อมูลอัตลักษณ์เมนู', icon: 'solar:chef-hat-heart-bold-duotone' },
    { num: '๓', title: 'แบบสำรวจเจาะลึก', icon: 'solar:clipboard-check-bold-duotone' },
    { num: '๔', title: 'เรื่องราวและสถานะ', icon: 'solar:book-2-bold-duotone' },
    { num: '๕', title: 'ข้อมูลสูตรอาหาร', icon: 'solar:document-text-bold-duotone' },
    { num: '๖', title: 'หลักฐานภาพถ่าย', icon: 'solar:camera-bold-duotone' },
    { num: '๗', title: 'ข้อมูลผู้จัดเก็บ', icon: 'solar:user-check-bold-duotone' },
]

// ═══ Stable helper components ═══
const RadioSet = ({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) => (
    <div className="flex flex-wrap gap-4 sm:gap-4">
        {options.map(opt => (
            <label key={opt} onClick={() => onChange(opt)}
                className={`px-4 sm:px-4 py-4 rounded-xl text-sm sm:text-base font-bold cursor-pointer transition-all border flex-1 sm:flex-none text-center
                ${value === opt ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20' : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-indigo-300'}`}>
                {opt}
            </label>
        ))}
    </div>
)

const CheckboxSet = ({ options, values, onToggle }: { options: string[]; values: string[]; onToggle: (v: string) => void }) => (
    <div className="flex flex-wrap gap-4 sm:gap-4">
        {options.map(opt => (
            <label key={opt} onClick={() => onToggle(opt)}
                className={`px-4 sm:px-4 py-4 rounded-xl text-sm sm:text-base font-bold cursor-pointer transition-all border items-center justify-center sm:justify-start gap-4 flex-1 sm:flex-none flex
                ${values.includes(opt) ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20' : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-indigo-300'}`}>
                <Icon icon={values.includes(opt) ? 'solar:check-circle-bold' : 'solar:add-circle-linear'} className="text-xl flex-shrink-0" />
                <span className="truncate">{opt}</span>
            </label>
        ))}
    </div>
)

const Label = ({ text, required }: { text: string; required?: boolean }) => (
    <label className="text-base font-bold text-slate-500 uppercase flex items-center gap-2 mb-2">
        {text} {required && <span className="text-red-500">*</span>}
    </label>
)

const TextInput = ({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) => (
    <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full text-base sm:text-lg font-medium text-slate-800 border-b-2 border-slate-100 focus:border-indigo-500 py-2 outline-none bg-transparent placeholder:text-slate-300 transition-colors" />
)

const SectionCard = ({ idx, sectionRefs, children }: { idx: number, sectionRefs: React.MutableRefObject<(HTMLElement | null)[]>, children: React.ReactNode }) => (
    <section ref={el => { sectionRefs.current[idx] = el }} className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 lg:p-8 shadow-sm border border-slate-100">
        <div className="flex items-center gap-4 sm:gap-4 mb-8 border-b border-slate-50 pb-4 sm:pb-4">
            <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 flex-shrink-0">
                <Icon icon={SECTION_TITLES[idx].icon} className="text-2xl sm:text-3xl" />
            </div>
            <h2 className="text-lg sm:text-2xl font-black text-slate-800 leading-tight">
                <span className="hidden sm:inline">ส่วนที่ {SECTION_TITLES[idx].num} </span>{SECTION_TITLES[idx].title}
            </h2>
        </div>
        {children}
    </section>
)

export default function SurveyFormClient() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const infoIdParam = searchParams.get('info_id')
    const menuIdParam = searchParams.get('menu_id')

    const [infoId, setInfoId] = useState(infoIdParam || '')
    const [editMode, setEditMode] = useState(!!menuIdParam)
    const [loading, setLoading] = useState(false)
    const [informantName, setInformantName] = useState('')
    const [friendlyId, setFriendlyId] = useState('')
    const [showSuccess, setShowSuccess] = useState(false)
    const sectionRefs = useRef<(HTMLElement | null)[]>([])

    const [confirmConfig, setConfirmConfig] = useState<{ isOpen: boolean; title: string; message: string; type: 'info' | 'danger' | 'success' | 'warning'; onConfirm: () => void }>({ isOpen: false, title: '', message: '', type: 'info', onConfirm: () => { } })

    // Form States
    const [menuData, setMenuData] = useState({ menu_name: '', local_name: '', other_name: '', category: '' })
    const [surveyData, setSurveyData] = useState({
        popularity: '',
        rituals: [] as string[],
        seasonality: '',
        main_ingredients_text: '',
        ingredient_sources: [] as string[],
        health_benefits: [] as string[],
        consumption_freq: '',
        complexity: '',
        taste_appeal: '',
        other_rituals: ''
    })
    const [storyData, setStoryData] = useState({ story: '', heritage_status: '' })
    const [ingredients, setIngredients] = useState<IngredientRow[]>([])
    const [prepSteps, setPrepSteps] = useState<StepRow[]>([])
    const [cookSteps, setCookSteps] = useState<StepRow[]>([])
    const [secretTips, setSecretTips] = useState('')
    const [photoUrls, setPhotoUrls] = useState<Photo[]>([])
    const [awardsRef, setAwardsRef] = useState('')
    const [uploadingPhotos, setUploadingPhotos] = useState(false)

    useEffect(() => {
        if (infoId) {
            fetch(`/api/survey/informant?id=${infoId}`)
                .then(res => res.json())
                .then(json => {
                    if (json.data) {
                        setInformantName(json.data.full_name)
                        setFriendlyId(json.data.friendly_id)
                    }
                })
        }
    }, [infoId])

    useEffect(() => {
        if (menuIdParam) {
            setLoading(true)
            fetch(`/api/survey/menu?menu_id=${menuIdParam}`)
                .then(res => res.json())
                .then(json => {
                    if (json.data) {
                        const m = json.data
                        setMenuData({
                            menu_name: m.menu_name || '',
                            local_name: m.local_name || '',
                            other_name: m.other_name || '',
                            category: m.category || ''
                        })
                        setSurveyData({
                            popularity: m.popularity || '',
                            rituals: m.rituals || [],
                            seasonality: m.seasonality || '',
                            main_ingredients_text: m.main_ingredients_text || '',
                            ingredient_sources: m.ingredient_sources || [],
                            health_benefits: m.health_benefits || [],
                            consumption_freq: m.consumption_freq || '',
                            complexity: m.complexity || '',
                            taste_appeal: m.taste_appeal || '',
                            other_rituals: m.other_rituals || ''
                        })
                        setStoryData({
                            story: m.story || '',
                            heritage_status: m.heritage_status || ''
                        })
                        setSecretTips(m.secret_tips || '')
                        setAwardsRef(m.awards_references || '')
                        setInfoId(m.ref_info_id)
                    }
                })
                .finally(() => setLoading(false))

            // Fetch relations
            fetch(`/api/survey/ingredient?menu_id=${menuIdParam}`).then(r => r.json()).then(j => setIngredients(j.data || []))
            fetch(`/api/survey/step?menu_id=${menuIdParam}`).then(r => r.json()).then(j => {
                const steps: StepRow[] = j.data || []
                setPrepSteps(steps.filter(s => s.step_type === 'เตรียม'))
                setCookSteps(steps.filter(s => s.step_type === 'ปรุง'))
            })
            fetch(`/api/survey/photo?menu_id=${menuIdParam}`).then(r => r.json()).then(j => setPhotoUrls((j.data || []).map((p: { photo_url: string; caption: string }) => ({ url: p.photo_url, caption: p.caption }))))
        }
    }, [menuIdParam])

    const updateIngredient = (idx: number, field: keyof IngredientRow, value: any) => setIngredients(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item))
    const removeIngredient = (idx: number) => setIngredients(prev => prev.filter((_, i) => i !== idx))
    const addIngredient = (type: 'วัตถุดิบ' | 'เครื่องปรุง/สมุนไพร') => setIngredients(prev => [...prev, { ingredient_type: type, ref_ing_id: '', name: '', quantity: '', unit: '', note: '', is_main_ingredient: false }])
    const updateStep = (type: 'เตรียม' | 'ปรุง', idx: number, value: string) => (type === 'เตรียม' ? setPrepSteps : setCookSteps)(prev => prev.map((item, i) => i === idx ? { ...item, instruction: value } : item))
    const removeStep = (type: 'เตรียม' | 'ปรุง', idx: number) => (type === 'เตรียม' ? setPrepSteps : setCookSteps)(prev => prev.filter((_, i) => i !== idx).map((s, i) => ({ ...s, step_order: i + 1 })))
    const addStep = (type: 'เตรียม' | 'ปรุง') => (type === 'เตรียม' ? setPrepSteps : setCookSteps)(prev => [...prev, { step_type: type, step_order: prev.length + 1, instruction: '' }])
    const toggleCheckbox = (arr: string[], setter: any, field: string, value: string) => setter((prev: any) => ({ ...prev, [field]: arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value] }))

    const handlePhotoUpload = async (files: FileList) => {
        setUploadingPhotos(true)
        try {
            const newPhotos: Photo[] = []
            for (let i = 0; i < files.length; i++) {
                const compressed = await compressImage(files[i])
                const formData = new FormData()
                formData.append('file', compressed)
                formData.append('folder', 'menus')

                const res = await fetch('/api/upload', { method: 'POST', body: formData })
                const json = await res.json()
                if (json.url) newPhotos.push({ url: json.url, caption: '' })
            }
            setPhotoUrls(prev => [...prev, ...newPhotos])
        } catch (err) {
            console.error('Upload Error:', err)
        } finally {
            setUploadingPhotos(false)
        }
    }

    const handleSubmitAll = async () => {
        setLoading(true)
        try {
            const mainPayload = {
                ...menuData,
                ...surveyData,
                ...storyData,
                secret_tips: secretTips,
                awards_references: awardsRef,
                ref_info_id: infoId
            }

            const res = await fetch('/api/survey/menu', {
                method: editMode ? 'PATCH' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editMode ? { menu_id: menuIdParam, ...mainPayload } : mainPayload)
            })

            const json = await res.json()
            if (!res.ok) throw new Error(json.error)

            const mId = editMode ? menuIdParam : json.data.menu_id

            // Batch save relations
            await Promise.all([
                fetch('/api/survey/ingredient', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ref_menu_id: mId, ingredients })
                }),
                fetch('/api/survey/step', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ref_menu_id: mId, steps: [...prepSteps, ...cookSteps] })
                }),
                fetch('/api/survey/photo', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ref_menu_id: mId, photos: photoUrls.map(p => ({ photo_url: p.url, caption: p.caption })) })
                })
            ])

            setShowSuccess(true)
        } catch (err) {
            console.error('Submit Error:', err)
            setConfirmConfig({ isOpen: true, title: 'เกิดข้อผิดพลาด', message: String(err), type: 'danger', onConfirm: () => setConfirmConfig(p => ({ ...p, isOpen: false })) })
        } finally {
            setLoading(false)
        }
    }

    if (showSuccess) {
        return (
            <div className="max-w-xl mx-auto mt-10 sm:mt-20 p-6 sm:p-8 bg-white rounded-3xl shadow-2xl text-center border border-slate-100 mx-4 sm:mx-auto animate-in zoom-in-95 duration-300">
                <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                    <Icon icon="solar:check-circle-bold" className="text-6xl" />
                </div>
                <h2 className="text-3xl font-black text-slate-800 mb-3">บันทึกสำเร็จ!</h2>
                <p className="text-lg text-slate-500 mb-8">ข้อมูลเมนูอาหารได้รับการจัดเก็บเรียบร้อยแล้ว</p>
                <div className="flex flex-col gap-3">
                    <button onClick={() => router.push(`/survey/part2?info_id=${infoId}`)} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2">
                        <Icon icon="solar:add-circle-bold" className="text-2xl" /> เพิ่มเมนูวัตถุดิบอื่น (ผู้ให้ข้อมูลคนเดิม)
                    </button>
                    <button onClick={() => router.push('/survey')} className="w-full py-4 bg-slate-100 text-slate-700 rounded-2xl font-bold hover:bg-slate-200 transition-all flex items-center justify-center gap-2">
                        <Icon icon="solar:home-2-bold" className="text-2xl" /> กลับหน้าหลัก
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-8 lg:px-8 pb-40 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <ConfirmModal isOpen={confirmConfig.isOpen} title={confirmConfig.title} message={confirmConfig.message} type={confirmConfig.type} onConfirm={confirmConfig.onConfirm} onCancel={() => setConfirmConfig(p => ({ ...p, isOpen: false }))} />

            <div className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 lg:p-8 mb-8 sm:mb-8 shadow-xl shadow-indigo-600/10">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center flex-shrink-0">
                        <Icon icon="solar:chef-hat-heart-bold" className="text-4xl sm:text-5xl" />
                    </div>
                    <div>
                        <h1 className="text-xl sm:text-3xl font-black mb-1 sm:mb-2">{editMode ? 'แก้ไขเมนูอาหาร' : 'บันทึกข้อมูลเมนูอาหาร'}</h1>
                        <p className="text-indigo-100 text-sm sm:text-base font-medium flex flex-wrap items-center gap-2">
                            ผู้ให้ข้อมูล: <span className="text-white font-bold">{informantName || '...'}</span>
                            {friendlyId && <span className="bg-white/20 px-2 py-1 rounded-md text-xs font-mono">{friendlyId}</span>}
                        </p>
                    </div>
                </div>
            </div>

            <div className="space-y-8 sm:space-y-8 lg:space-y-8">
                <SectionCard idx={0} sectionRefs={sectionRefs}>
                    <div className="space-y-6 sm:space-y-8">
                        <div className="space-y-1"><Label text="ชื่อเมนูอาหาร (ชื่อทางการ)" required /><TextInput value={menuData.menu_name} onChange={v => setMenuData(p => ({ ...p, menu_name: v }))} placeholder="เช่น แกงเขียวหวาน" /></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                            <div className="space-y-1"><Label text="ชื่อเรียกในท้องถิ่น" /><TextInput value={menuData.local_name} onChange={v => setMenuData(p => ({ ...p, local_name: v }))} placeholder="ชื่อที่ชาวบ้านเรียก" /></div>
                            <div className="space-y-1"><Label text="ชื่อภาษาอื่น" /><TextInput value={menuData.other_name} onChange={v => setMenuData(p => ({ ...p, other_name: v }))} placeholder="ชื่อภาษาอังกฤษ/อื่นๆ" /></div>
                        </div>
                        <div className="space-y-3"><Label text="ประเภทอาหาร" required /><RadioSet options={CATEGORIES} value={menuData.category} onChange={v => setMenuData(p => ({ ...p, category: v }))} /></div>
                    </div>
                </SectionCard>

                <SectionCard idx={1} sectionRefs={sectionRefs}>
                    <div className="space-y-8 sm:space-y-10">
                        <div className="space-y-3"><Label text="ระดับความนิยม / การเป็นที่รู้จัก" /><RadioSet options={POPULARITY_OPTIONS} value={surveyData.popularity} onChange={v => setSurveyData(p => ({ ...p, popularity: v }))} /></div>
                        <div className="space-y-3">
                            <Label text="ความเชื่อและประเพณี / โอกาสในการกิน (เลือกได้หลายข้อ)" />
                            <CheckboxSet options={RITUAL_OPTIONS} values={surveyData.rituals} onToggle={v => toggleCheckbox(surveyData.rituals, setSurveyData, 'rituals', v)} />
                            {surveyData.rituals.includes('อื่นๆ') && <div className="mt-3"><TextInput value={surveyData.other_rituals} onChange={v => setSurveyData(p => ({ ...p, other_rituals: v }))} placeholder="ระบุโอกาสอื่นๆ..." /></div>}
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10">
                            <div className="space-y-3"><Label text="ฤดูกาล / ช่วงเวลาที่หารับประทานได้" /><RadioSet options={SEASON_OPTIONS} value={surveyData.seasonality} onChange={v => setSurveyData(p => ({ ...p, seasonality: v }))} /></div>
                            <div className="space-y-3"><Label text="แหล่งที่มาของวัตถุดิบ" /><CheckboxSet options={SOURCE_OPTIONS} values={surveyData.ingredient_sources} onToggle={v => toggleCheckbox(surveyData.ingredient_sources, setSurveyData, 'ingredient_sources', v)} /></div>
                            <div className="space-y-3"><Label text="สุขภาพและสรรพคุณ" /><CheckboxSet options={HEALTH_OPTIONS} values={surveyData.health_benefits} onToggle={v => toggleCheckbox(surveyData.health_benefits, setSurveyData, 'health_benefits', v)} /></div>
                            <div className="space-y-3"><Label text="ความถี่ในการรับประทาน" /><RadioSet options={FREQ_OPTIONS} value={surveyData.consumption_freq} onChange={v => setSurveyData(p => ({ ...p, consumption_freq: v }))} /></div>
                            <div className="space-y-3"><Label text="ความยากง่ายในการทำ" /><RadioSet options={COMPLEXITY_OPTIONS} value={surveyData.complexity} onChange={v => setSurveyData(p => ({ ...p, complexity: v }))} /></div>
                            <div className="space-y-3"><Label text="รสชาติ / ความเหมาะสม" /><CheckboxSet options={TASTE_OPTIONS} values={surveyData.taste_appeal ? [surveyData.taste_appeal] : []} onToggle={v => setSurveyData(p => ({ ...p, taste_appeal: v }))} /></div>
                        </div>
                    </div>
                </SectionCard>

                <SectionCard idx={2} sectionRefs={sectionRefs}>
                    <div className="space-y-8">
                        <div className="space-y-2"><Label text="เรื่องเล่า / ตำนาน / ประวัติความเป็นมา" /><textarea value={storyData.story} onChange={e => setStoryData(p => ({ ...p, story: e.target.value }))} rows={5} placeholder="บันทึกเรื่องราว..." className="w-full text-base sm:text-lg font-medium text-slate-800 border-2 border-slate-100 focus:border-indigo-500 rounded-2xl p-4 sm:p-4 outline-none bg-slate-50 resize-y" /></div>
                        <div className="space-y-3"><Label text="สถานะการสืบทอด" /><RadioSet options={HERITAGE_OPTIONS} value={storyData.heritage_status} onChange={v => setStoryData(p => ({ ...p, heritage_status: v }))} /></div>
                    </div>
                </SectionCard>

                <SectionCard idx={3} sectionRefs={sectionRefs}>
                    <div className="space-y-10">
                        <div className="space-y-4">
                            <Label text="รายการวัตถุดิบ" />
                            <div className="space-y-3">
                                {ingredients.map((ing, idx) => ing.ingredient_type === 'วัตถุดิบ' && (
                                    <div key={idx} className="flex flex-col sm:flex-row gap-4 sm:gap-4 sm:items-center bg-slate-50 p-4 sm:p-4 rounded-2xl border border-slate-100">
                                        <div className="w-full sm:flex-1"><IngredientCombobox value={ing.name} ingId={ing.ref_ing_id} onChange={(id, name) => { updateIngredient(idx, 'ref_ing_id', id); updateIngredient(idx, 'name', name) }} placeholder="ค้นหาวัตถุดิบ..." accentColor="indigo" /></div>
                                        <div className="flex gap-3 items-center w-full sm:w-auto">
                                            <input type="text" placeholder="ปริมาณ" value={ing.quantity} onChange={e => updateIngredient(idx, 'quantity', e.target.value)} className="w-20 bg-transparent outline-none border-b border-slate-300 py-1" />
                                            <input type="text" placeholder="หน่วย" value={ing.unit} onChange={e => updateIngredient(idx, 'unit', e.target.value)} className="w-20 bg-transparent outline-none border-b border-slate-300 py-1" />
                                            <button onClick={() => removeIngredient(idx)} className="text-red-400 p-2"><Icon icon="solar:trash-bin-minimalistic-bold" className="text-xl" /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <button onClick={() => addIngredient('วัตถุดิบ')} className="text-indigo-600 font-bold flex items-center gap-2"><Icon icon="solar:add-circle-bold" /> เพิ่มวัตถุดิบ</button>
                        </div>
                        <div className="space-y-4">
                            <Label text="เครื่องปรุงรส / สมุนไพร" />
                            <div className="space-y-3">
                                {ingredients.map((ing, idx) => ing.ingredient_type === 'เครื่องปรุง/สมุนไพร' && (
                                    <div key={idx} className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-center bg-amber-50 p-4 rounded-2xl border border-amber-100">
                                        <div className="w-full sm:flex-1"><IngredientCombobox value={ing.name} ingId={ing.ref_ing_id} onChange={(id, name) => { updateIngredient(idx, 'ref_ing_id', id); updateIngredient(idx, 'name', name) }} placeholder="ค้นหาเครื่องปรุง..." accentColor="amber" /></div>
                                        <div className="flex gap-3 items-center">
                                            <input type="text" placeholder="ปริมาณ" value={ing.quantity} onChange={e => updateIngredient(idx, 'quantity', e.target.value)} className="w-20 bg-transparent outline-none border-b border-amber-300 py-1" />
                                            <input type="text" placeholder="หน่วย" value={ing.unit} onChange={e => updateIngredient(idx, 'unit', e.target.value)} className="w-20 bg-transparent outline-none border-b border-amber-300 py-1" />
                                            <button onClick={() => removeIngredient(idx)} className="text-red-400 p-2"><Icon icon="solar:trash-bin-minimalistic-bold" className="text-xl" /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <button onClick={() => addIngredient('เครื่องปรุง/สมุนไพร')} className="text-amber-600 font-bold flex items-center gap-2"><Icon icon="solar:add-circle-bold" /> เพิ่มเครื่องปรุง</button>
                        </div>
                        <div className="space-y-4">
                            <Label text="ขั้นตอนการทำ" />
                            {[...prepSteps, ...cookSteps].map((s, idx) => (
                                <div key={idx} className="flex gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 items-start">
                                    <span className="w-8 h-8 bg-slate-800 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">{s.step_order}</span>
                                    <textarea value={s.instruction} onChange={e => updateStep(s.step_type, idx >= prepSteps.length ? idx - prepSteps.length : idx, e.target.value)} className="flex-1 bg-transparent outline-none py-1" rows={2} />
                                    <button onClick={() => removeStep(s.step_type, idx >= prepSteps.length ? idx - prepSteps.length : idx)} className="text-red-400 p-1"><Icon icon="solar:trash-bin-minimalistic-bold" /></button>
                                </div>
                            ))}
                            <div className="flex gap-4">
                                <button onClick={() => addStep('เตรียม')} className="text-emerald-600 font-bold flex items-center gap-2 text-sm"><Icon icon="solar:add-circle-bold" /> เพิ่มเตรียม</button>
                                <button onClick={() => addStep('ปรุง')} className="text-orange-600 font-bold flex items-center gap-2 text-sm"><Icon icon="solar:add-circle-bold" /> เพิ่มปรุง</button>
                            </div>
                        </div>
                        <textarea value={secretTips} onChange={e => setSecretTips(e.target.value)} placeholder="เคล็ดลับ..." className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none" rows={3} />
                    </div>
                </SectionCard>

                <SectionCard idx={4} sectionRefs={sectionRefs}>
                    <div className="space-y-5">
                        <label className={`flex flex-col items-center justify-center gap-3 w-full py-10 rounded-3xl border-2 border-dashed cursor-pointer transition-all ${uploadingPhotos ? 'opacity-50 pointer-events-none' : 'hover:bg-indigo-50'}`}>
                            <Icon icon={uploadingPhotos ? 'solar:refresh-bold' : 'solar:camera-add-bold-duotone'} className={`text-5xl ${uploadingPhotos ? 'animate-spin' : 'text-indigo-500'}`} />
                            <p className="font-bold">{uploadingPhotos ? 'กำลังอัปโหลด...' : 'แตะเพื่อเลือกรูปภาพ'}</p>
                            <input type="file" multiple className="hidden" onChange={e => e.target.files && handlePhotoUpload(e.target.files)} />
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
                            {photoUrls.map((p, idx) => (
                                <div key={idx} className="relative rounded-xl overflow-hidden border border-slate-200">
                                    <img src={p.url} className="w-full h-32 object-cover" alt="" />
                                    <button onClick={() => setPhotoUrls(prev => prev.filter((_, i) => i !== idx))} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full"><Icon icon="solar:close-circle-bold" /></button>
                                </div>
                            ))}
                        </div>
                    </div>
                </SectionCard>

                <SectionCard idx={5} sectionRefs={sectionRefs}>
                    <textarea value={awardsRef} onChange={e => setAwardsRef(e.target.value)} placeholder="รางวัล/อ้างอิง..." className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none" rows={3} />
                </SectionCard>
            </div>

            <div className="fixed bottom-0 left-0 right-0 bg-white/95 border-t border-slate-200 p-4 z-40 shadow-xl pb-[max(1rem,env(safe-area-inset-bottom))]">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-500">บันทึกอัตโนมัติ SV Code</p>
                    <button onClick={handleSubmitAll} disabled={loading} className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-bold shadow-xl flex items-center gap-2">
                        {loading ? <Icon icon="solar:refresh-bold" className="animate-spin" /> : <><Icon icon="solar:diskette-bold" /> {editMode ? 'บันทึกแก้ไข' : 'บันทึกทั้งหมด'}</>}
                    </button>
                </div>
            </div>
        </div>
    )
}