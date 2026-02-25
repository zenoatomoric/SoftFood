'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Icon } from '@iconify/react'
import ConfirmModal from '../ConfirmModal'
import IngredientCombobox from './IngredientCombobox'
import { compressImage } from '@/utils/image-compression'
import Toast from '../Toast'

// ─── Types & Options ───────────────
interface IngredientRow { ingredient_type: 'วัตถุดิบ' | 'เครื่องปรุง/สมุนไพร'; ref_ing_id: string; name: string; quantity: string; unit: string; note: string; is_main_ingredient: boolean }
interface StepRow { step_type: 'เตรียม' | 'ปรุง'; step_order: number; instruction: string }
interface Photo { url: string; caption: string; isUploading?: boolean; blobUrl?: string; id?: string; file?: File }
const CATEGORIES = ['อาหารคาว', 'อาหารหวาน', 'อาหารว่าง/เครื่องดื่ม']
const POPULARITY_OPTIONS = ['เป็นที่รู้จักทั่วไป', 'รู้จักในชุมชน', 'รู้จักเฉพาะกลุ่ม', 'แทบไม่มีใครรู้จัก', 'อื่นๆ']
const RITUAL_OPTIONS = ['งานบุญ/งานศพ', 'เทศกาลประจำปี', 'วันพิเศษ/วันหยุด', 'กินประจำวัน', 'งานเลี้ยง/สังสรรค์', 'ไม่เกี่ยวกับโอกาสใด', 'อื่นๆ']
const SEASON_OPTIONS = ['ตลอดทั้งปี', 'ฤดูร้อน', 'ฤดูฝน', 'ฤดูหนาว', 'ช่วงเทศกาล', 'อื่นๆ']
const SOURCE_OPTIONS = ['ปลูก/เลี้ยงเอง', 'ตลาดในชุมชน', 'ตลาดนอกชุมชน', 'ห้างสรรพสินค้า/ซุปเปอร์มาร์เก็ต', 'สั่งออนไลน์', 'หาจากธรรมชาติ', 'อื่นๆ']
const HEALTH_OPTIONS = ['บำรุงร่างกาย', 'ช่วยย่อยอาหาร', 'แก้ร้อนใน', 'บำรุงผิวพรรณ', 'ลดความดัน', 'บำรุงกระดูก', 'แก้หวัด/ไอ', 'ให้พลังงาน', 'อื่นๆ']
const FREQ_OPTIONS = ['ทุกวัน', 'สัปดาห์ละ 2-3 ครั้ง', 'สัปดาห์ละครั้ง', 'เดือนละ 1-2 ครั้ง', 'นานๆ ครั้ง', 'อื่นๆ']
const COMPLEXITY_OPTIONS = ['ง่ายมาก', 'ค่อนข้างง่าย', 'ปานกลาง', 'ค่อนข้างยาก', 'ยากมาก', 'อื่นๆ']
const TASTE_OPTIONS = ['จืด', 'หวาน', 'เค็ม', 'เปรี้ยว', 'เผ็ด', 'มัน', 'ขม', 'กลมกล่อม', 'จัดจ้าน', 'อื่นๆ']
const HERITAGE_OPTIONS = ['ยังมีการสืบทอดทั่วไป', 'สืบทอดเฉพาะในครอบครัว', 'เสี่ยงสูญหาย', 'แทบสูญหายแล้ว', 'อื่นๆ']
const SERVING_SIZE_OPTIONS = ['1 คน', '2-3 คน', '4-5 คน', '6 คนขึ้นไป', 'อื่นๆ']
const SECTION_TITLES = [
    { num: '๒', title: 'ข้อมูลอัตลักษณ์เมนู', icon: 'solar:chef-hat-heart-bold-duotone' },
    { num: '๓', title: 'แบบสำรวจเจาะลึก', icon: 'solar:clipboard-check-bold-duotone' },
    { num: '๔', title: 'เรื่องราวและสถานะ', icon: 'solar:book-2-bold-duotone' },
    { num: '๕', title: 'ข้อมูลสูตรอาหาร', icon: 'solar:document-text-bold-duotone' },
    { num: '๖', title: 'หลักฐานภาพถ่าย', icon: 'solar:camera-bold-duotone' },
    { num: '๗', title: 'ข้อมูลผู้จัดเก็บ', icon: 'solar:user-check-bold-duotone' },
]

// ═══ Stable helper components ═══
const RadioSet = ({ idPrefix, options, value, onChange }: { idPrefix: string; options: string[]; value: string; onChange: (v: string) => void }) => (
    <div className="flex flex-wrap gap-4 sm:gap-4">
        {options.map(opt => {
            const id = `${idPrefix}-${opt}`
            return (
                <label
                    key={opt}
                    htmlFor={id}
                    className={`px-4 sm:px-4 py-4 rounded-xl text-sm sm:text-base font-medium cursor-pointer transition-all border flex-1 sm:flex-none text-center
                    ${value === opt ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20' : 'bg-slate-50 text-slate-900 border-slate-200 hover:border-indigo-300'}`}
                >
                    <input
                        id={id}
                        type="radio"
                        name={idPrefix}
                        value={opt}
                        checked={value === opt}
                        onChange={() => onChange(opt)}
                        className="sr-only"
                    />
                    {opt}
                </label>
            )
        })}
    </div>
)

const CheckboxSet = ({ idPrefix, options, values, onToggle }: { idPrefix: string; options: string[]; values: string[]; onToggle: (v: string) => void }) => (
    <div className="flex flex-wrap gap-4 sm:gap-4">
        {options.map(opt => {
            const id = `${idPrefix}-${opt}`
            return (
                <label
                    key={opt}
                    htmlFor={id}
                    className={`px-4 sm:px-4 py-4 rounded-xl text-sm sm:text-base font-medium cursor-pointer transition-all border items-center justify-center sm:justify-start gap-4 flex-1 sm:flex-none flex
                    ${values.includes(opt) ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20' : 'bg-slate-50 text-slate-900 border-slate-200 hover:border-indigo-300'}`}
                >
                    <input
                        id={id}
                        type="checkbox"
                        checked={values.includes(opt)}
                        onChange={() => onToggle(opt)}
                        className="sr-only"
                    />
                    <Icon icon={values.includes(opt) ? 'solar:check-circle-bold' : 'solar:add-circle-linear'} className="text-xl flex-shrink-0" />
                    <span className="truncate">{opt}</span>
                </label>
            )
        })}
    </div>
)

const Label = ({ text, required, htmlFor }: { text: string; required?: boolean; htmlFor?: string }) => (
    <label htmlFor={htmlFor} className="text-base font-medium text-slate-900 uppercase flex items-center gap-2 mb-2">
        {text} {required && <span className="text-red-500">*</span>}
    </label>
)

const TextInput = ({ id, name, value, onChange, placeholder, autoComplete }: { id?: string; name?: string; value: string; onChange: (v: string) => void; placeholder?: string; autoComplete?: string }) => (
    <input
        id={id}
        name={name}
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="w-full text-base sm:text-lg font-medium text-slate-900 border-b-2 border-slate-100 focus:border-indigo-500 py-2 outline-none bg-transparent placeholder:text-slate-300 transition-colors"
    />
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
        popularity: [] as string[],
        rituals: [] as string[],
        seasonality: [] as string[],
        ingredient_sources: [] as string[],
        health_benefits: [] as string[],
        consumption_freq: [] as string[],
        complexity: [] as string[],
        taste_appeal: [] as string[],
        nutrition: '',
        social_value: '',
        other_popularity: '',
        other_rituals: '',
        other_seasonality: '',
        other_ingredient_sources: '',
        other_health_benefits: '',
        other_consumption_freq: '',
        other_complexity: '',
        other_taste_appeal: '',
        serving_size: '',
        other_serving_size: ''
    })
    const [storyData, setStoryData] = useState({ story: '', heritage_status: '' })
    const [ingredients, setIngredients] = useState<IngredientRow[]>([])
    const [prepSteps, setPrepSteps] = useState<StepRow[]>([])
    const [cookSteps, setCookSteps] = useState<StepRow[]>([])

    // Initialize with one empty row if no data
    useEffect(() => {
        if (!loading && !editMode) {
            setIngredients(prev => {
                const hasRaw = prev.some(ing => ing.ingredient_type === 'วัตถุดิบ')
                const hasSeasoning = prev.some(ing => ing.ingredient_type === 'เครื่องปรุง/สมุนไพร')
                if (hasRaw && hasSeasoning) return prev
                const next = [...prev]
                if (!hasRaw) next.push({ ingredient_type: 'วัตถุดิบ', ref_ing_id: '', name: '', quantity: '', unit: '', note: '', is_main_ingredient: false })
                if (!hasSeasoning) next.push({ ingredient_type: 'เครื่องปรุง/สมุนไพร', ref_ing_id: '', name: '', quantity: '', unit: '', note: '', is_main_ingredient: false })
                return next
            })
            if (prepSteps.length === 0) setPrepSteps([{ step_type: 'เตรียม', step_order: 1, instruction: '' }])
            if (cookSteps.length === 0) setCookSteps([{ step_type: 'ปรุง', step_order: 1, instruction: '' }])
        }
    }, [loading, editMode, prepSteps.length, cookSteps.length])

    const [secretTips, setSecretTips] = useState('')
    const [photoUrls, setPhotoUrls] = useState<Photo[]>([])
    const initialPhotosRef = useRef<any[]>([])
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
                            popularity: Array.isArray(m.popularity) ? m.popularity : m.popularity ? [m.popularity] : [],
                            rituals: m.rituals || [],
                            seasonality: Array.isArray(m.seasonality) ? m.seasonality : m.seasonality ? [m.seasonality] : [],
                            ingredient_sources: m.ingredient_sources || [],
                            health_benefits: m.health_benefits || [],
                            consumption_freq: Array.isArray(m.consumption_freq) ? m.consumption_freq : m.consumption_freq ? [m.consumption_freq] : [],
                            complexity: Array.isArray(m.complexity) ? m.complexity : m.complexity ? [m.complexity] : [],
                            taste_appeal: Array.isArray(m.taste_appeal) ? m.taste_appeal : m.taste_appeal ? [m.taste_appeal] : [],
                            nutrition: m.nutrition || '',
                            social_value: m.social_value || '',
                            other_popularity: m.other_popularity || '',
                            other_rituals: m.other_rituals || '',
                            other_seasonality: m.other_seasonality || '',
                            other_ingredient_sources: m.ingredient_sources || '',
                            other_health_benefits: m.other_health_benefits || '',
                            other_consumption_freq: m.other_consumption_freq || '',
                            other_complexity: m.other_complexity || '',
                            other_taste_appeal: m.other_taste_appeal || '',
                            serving_size: m.serving_size || '',
                            other_serving_size: m.other_serving_size || ''
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
            fetch(`/api/survey/photo?menu_id=${menuIdParam}`)
                .then(r => r.json())
                .then(j => {
                    const photos = (j.data || []).map((p: any) => ({ url: p.photo_url, caption: p.caption || '' }))
                    setPhotoUrls(photos)
                    initialPhotosRef.current = photos
                })
        }
    }, [menuIdParam])

    const updateIngredient = (idx: number, field: keyof IngredientRow, value: any) => setIngredients(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item))
    const removeIngredient = (idx: number) => setIngredients(prev => {
        const itemToRemove = prev[idx];
        const filtered = prev.filter((_, i) => i !== idx);
        // If last row of type removed, add a fresh one
        const remainingOfType = filtered.filter(ing => ing.ingredient_type === itemToRemove.ingredient_type);
        if (remainingOfType.length === 0) {
            return [...filtered, { ingredient_type: itemToRemove.ingredient_type, ref_ing_id: '', name: '', quantity: '', unit: '', note: '', is_main_ingredient: false }];
        }
        return filtered;
    })
    const addIngredient = (type: 'วัตถุดิบ' | 'เครื่องปรุง/สมุนไพร') => setIngredients(prev => [...prev, { ingredient_type: type, ref_ing_id: '', name: '', quantity: '', unit: '', note: '', is_main_ingredient: false }])
    const updateStep = (type: 'เตรียม' | 'ปรุง', idx: number, value: string) => (type === 'เตรียม' ? setPrepSteps : setCookSteps)(prev => prev.map((item, i) => i === idx ? { ...item, instruction: value } : item))
    const removeStep = (type: 'เตรียม' | 'ปรุง', idx: number) => {
        const setter = type === 'เตรียม' ? setPrepSteps : setCookSteps;
        setter(prev => {
            const filtered = prev.filter((_, i) => i !== idx);
            // If it was the last row, add a fresh empty one
            if (filtered.length === 0) return [{ step_type: type, step_order: 1, instruction: '' }];
            return filtered.map((s, i) => ({ ...s, step_order: i + 1 }));
        });
    }
    const addStep = (type: 'เตรียม' | 'ปรุง') => (type === 'เตรียม' ? setPrepSteps : setCookSteps)(prev => [...prev, { step_type: type, step_order: prev.length + 1, instruction: '' }])
    const toggleCheckbox = (arr: string[], setter: any, field: string, value: string) => setter((prev: any) => ({ ...prev, [field]: arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value] }))

    const handleResetForm = () => {
        setMenuData({ menu_name: '', local_name: '', other_name: '', category: '' })
        setSurveyData({
            popularity: [], rituals: [], seasonality: [], ingredient_sources: [], health_benefits: [], consumption_freq: [], complexity: [], taste_appeal: [], nutrition: '', social_value: '',
            other_popularity: '', other_rituals: '', other_seasonality: '', other_ingredient_sources: '', other_health_benefits: '', other_consumption_freq: '', other_complexity: '', other_taste_appeal: '',
            serving_size: '', other_serving_size: ''
        })
        setStoryData({ story: '', heritage_status: '' })
        setIngredients([
            { ingredient_type: 'วัตถุดิบ', ref_ing_id: '', name: '', quantity: '', unit: '', note: '', is_main_ingredient: false },
            { ingredient_type: 'เครื่องปรุง/สมุนไพร', ref_ing_id: '', name: '', quantity: '', unit: '', note: '', is_main_ingredient: false }
        ])
        setPrepSteps([{ step_type: 'เตรียม', step_order: 1, instruction: '' }])
        setCookSteps([{ step_type: 'ปรุง', step_order: 1, instruction: '' }])
        setSecretTips('')
        setPhotoUrls([])
        setAwardsRef('')
        setEditMode(false)
        setShowSuccess(false)
        router.push(`/survey/part2?info_id=${infoId}`)
    }

    const handlePhotoUpload = async (files: FileList) => {
        setUploadingPhotos(true)
        try {
            const newPhotos: Photo[] = []
            for (let i = 0; i < files.length; i++) {
                const file = files[i]

                // 🛑 เพิ่มการตรวจสอบว่าเป็นไฟล์รูปภาพเท่านั้น
                if (!file.type.startsWith('image/')) {
                    setToastConfig({ isVisible: true, message: `ไฟล์ "${file.name}" ไม่ใช่รูปภาพ (งดอัปโหลดวิดีโอ)`, type: 'error' })
                    continue // ข้ามไฟล์ที่ไม่ใช่รูปภาพไปเลย
                }

                const compressed = await compressImage(file)
                const blobUrl = URL.createObjectURL(compressed)
                const tempId = Math.random().toString(36).substring(7)

                newPhotos.push({
                    url: '',
                    blobUrl: blobUrl,
                    file: compressed,
                    caption: '',
                    isUploading: false,
                    id: tempId
                })
            }

            if (newPhotos.length > 0) {
                setPhotoUrls(prev => [...prev, ...newPhotos])
                setToastConfig({ isVisible: true, message: `เตรียม ${newPhotos.length} รูปเรียบร้อย (จะอัปโหลดเมื่อกดบันทึก)`, type: 'info' })
            }
        } catch (err) {
            console.error('Photo selection error:', err)
            setToastConfig({ isVisible: true, message: 'เกิดข้อผิดพลาดในการเตรียมรูปภาพ', type: 'error' })
        } finally {
            setUploadingPhotos(false)
        }
    }

    const [toastConfig, setToastConfig] = useState({ isVisible: false, message: '', type: 'success' as 'success' | 'error' | 'info' | 'warning' })

    const handleSubmitAll = async () => {
        setLoading(true)
        try {
            // 1. Upload pending photos first
            const updatedPhotoUrls = [...photoUrls]
            const pendingUploads = updatedPhotoUrls.filter(p => p.file && !p.url)

            if (pendingUploads.length > 0) {
                setUploadingPhotos(true)
                try {
                    const uploadResults = await Promise.all(pendingUploads.map(async (p) => {
                        const formData = new FormData()
                        formData.append('file', p.file!)
                        formData.append('folder', 'menus')
                        const res = await fetch('/api/upload', { method: 'POST', body: formData })
                        const json = await res.json()
                        if (!res.ok) throw new Error(json.error || 'Upload failed')
                        return { id: p.id, url: json.url }
                    }))

                    // Update URLs in our local list
                    uploadResults.forEach(res => {
                        const idx = updatedPhotoUrls.findIndex(p => p.id === res.id)
                        if (idx !== -1) {
                            updatedPhotoUrls[idx] = { ...updatedPhotoUrls[idx], url: res.url, file: undefined }
                        }
                    })
                } finally {
                    setUploadingPhotos(false)
                }
            }

            // 2. Save menu data
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
                })
            ])

            // 4. Photos (Only if changed)
            const currentPhotos = updatedPhotoUrls.map(p => ({ url: p.url, caption: p.caption }))
            const hasPhotoChanges = pendingUploads.length > 0 || JSON.stringify(currentPhotos) !== JSON.stringify(initialPhotosRef.current)

            if (hasPhotoChanges) {
                await fetch('/api/survey/photo', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ref_menu_id: mId, photos: updatedPhotoUrls.map(p => ({ photo_url: p.url, caption: p.caption })) })
                })
                // Update ref for subsequent saves without reload
                initialPhotosRef.current = currentPhotos
            }

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
                    <button onClick={handleResetForm} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2">
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
            <Toast isVisible={toastConfig.isVisible} message={toastConfig.message} type={toastConfig.type} onCloseAction={() => setToastConfig(p => ({ ...p, isVisible: false }))} />

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
                        <div className="space-y-1">
                            <Label text="ชื่อเมนูอาหาร (ชื่อทางการ)" required htmlFor="menu_name" />
                            <TextInput id="menu_name" name="menu_name" value={menuData.menu_name} onChange={v => setMenuData(p => ({ ...p, menu_name: v }))} placeholder="เช่น แกงเขียวหวาน" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                            <div className="space-y-1">
                                <Label text="ชื่อเรียกในท้องถิ่น" htmlFor="local_name" />
                                <TextInput id="local_name" name="local_name" value={menuData.local_name} onChange={v => setMenuData(p => ({ ...p, local_name: v }))} placeholder="ชื่อที่ชาวบ้านเรียก" />
                            </div>
                            <div className="space-y-1">
                                <Label text="ชื่อภาษาอื่น" htmlFor="other_name" />
                                <TextInput id="other_name" name="other_name" value={menuData.other_name} onChange={v => setMenuData(p => ({ ...p, other_name: v }))} placeholder="ชื่อภาษาอังกฤษ/อื่นๆ" />
                            </div>
                        </div>
                        <div className="space-y-3">
                            <Label text="ประเภทอาหาร" required />
                            <RadioSet idPrefix="category" options={CATEGORIES} value={menuData.category} onChange={v => setMenuData(p => ({ ...p, category: v }))} />
                        </div>
                    </div>
                </SectionCard>

                <SectionCard idx={1} sectionRefs={sectionRefs}>
                    <div className="space-y-8 sm:space-y-10">
                        <div className="space-y-10">
                            <div className="space-y-3">
                                <Label text="ระดับความนิยม / การเป็นที่รู้จัก (เลือกได้หลายข้อ)" />
                                <CheckboxSet idPrefix="popularity" options={POPULARITY_OPTIONS} values={surveyData.popularity} onToggle={v => toggleCheckbox(surveyData.popularity, setSurveyData, 'popularity', v)} />
                                {surveyData.popularity.includes('อื่นๆ') && (
                                    <div className="mt-3">
                                        <TextInput id="other_popularity" name="other_popularity" value={surveyData.other_popularity} onChange={v => setSurveyData(p => ({ ...p, other_popularity: v }))} placeholder="ระบุระดับความนิยมอื่นๆ..." />
                                    </div>
                                )}
                            </div>
                            <div className="space-y-3">
                                <Label text="ความเชื่อและประเพณี / โอกาสในการกิน (เลือกได้หลายข้อ)" />
                                <CheckboxSet idPrefix="rituals" options={RITUAL_OPTIONS} values={surveyData.rituals} onToggle={v => toggleCheckbox(surveyData.rituals, setSurveyData, 'rituals', v)} />
                                {surveyData.rituals.includes('อื่นๆ') && (
                                    <div className="mt-3">
                                        <TextInput id="other_rituals" name="other_rituals" value={surveyData.other_rituals} onChange={v => setSurveyData(p => ({ ...p, other_rituals: v }))} placeholder="ระบุโอกาสอื่นๆ..." />
                                    </div>
                                )}
                            </div>
                            <div className="space-y-3">
                                <Label text="ฤดูกาล / ช่วงเวลาที่หารับประทานได้ (เลือกได้หลายข้อ)" />
                                <CheckboxSet idPrefix="seasonality" options={SEASON_OPTIONS} values={surveyData.seasonality} onToggle={v => toggleCheckbox(surveyData.seasonality, setSurveyData, 'seasonality', v)} />
                                {surveyData.seasonality.includes('อื่นๆ') && (
                                    <div className="mt-3">
                                        <TextInput id="other_seasonality" name="other_seasonality" value={surveyData.other_seasonality} onChange={v => setSurveyData(p => ({ ...p, other_seasonality: v }))} placeholder="ระบุฤดูกาลอื่นๆ..." />
                                    </div>
                                )}
                            </div>
                            <div className="space-y-3">
                                <Label text="แหล่งที่มาของวัตถุดิบ (เลือกได้หลายข้อ)" />
                                <CheckboxSet idPrefix="ingredient_sources" options={SOURCE_OPTIONS} values={surveyData.ingredient_sources} onToggle={v => toggleCheckbox(surveyData.ingredient_sources, setSurveyData, 'ingredient_sources', v)} />
                                {surveyData.ingredient_sources.includes('อื่นๆ') && (
                                    <div className="mt-3">
                                        <TextInput id="other_ingredient_sources" name="other_ingredient_sources" value={surveyData.other_ingredient_sources} onChange={v => setSurveyData(p => ({ ...p, other_ingredient_sources: v }))} placeholder="ระบุแหล่งที่มาอื่นๆ..." />
                                    </div>
                                )}
                            </div>
                            <div className="space-y-3">
                                <Label text="สุขภาพและสรรพคุณ (เลือกได้หลายข้อ)" />
                                <CheckboxSet idPrefix="health_benefits" options={HEALTH_OPTIONS} values={surveyData.health_benefits} onToggle={v => toggleCheckbox(surveyData.health_benefits, setSurveyData, 'health_benefits', v)} />
                                {surveyData.health_benefits.includes('อื่นๆ') && (
                                    <div className="mt-3">
                                        <TextInput id="other_health_benefits" name="other_health_benefits" value={surveyData.other_health_benefits} onChange={v => setSurveyData(p => ({ ...p, other_health_benefits: v }))} placeholder="ระบุสรรพคุณอื่นๆ..." />
                                    </div>
                                )}
                            </div>
                            <div className="space-y-3">
                                <Label text="ความถี่ในการรับประทาน (เลือกได้หลายข้อ)" />
                                <CheckboxSet idPrefix="consumption_freq" options={FREQ_OPTIONS} values={surveyData.consumption_freq} onToggle={v => toggleCheckbox(surveyData.consumption_freq, setSurveyData, 'consumption_freq', v)} />
                                {surveyData.consumption_freq.includes('อื่นๆ') && (
                                    <div className="mt-3">
                                        <TextInput id="other_consumption_freq" name="other_consumption_freq" value={surveyData.other_consumption_freq} onChange={v => setSurveyData(p => ({ ...p, other_consumption_freq: v }))} placeholder="ระบุความถี่อื่นๆ..." />
                                    </div>
                                )}
                            </div>
                            <div className="space-y-3">
                                <Label text="ความยากง่ายในการทำ (เลือกได้หลายข้อ)" />
                                <CheckboxSet idPrefix="complexity" options={COMPLEXITY_OPTIONS} values={surveyData.complexity} onToggle={v => toggleCheckbox(surveyData.complexity, setSurveyData, 'complexity', v)} />
                                {surveyData.complexity.includes('อื่นๆ') && (
                                    <div className="mt-3">
                                        <TextInput id="other_complexity" name="other_complexity" value={surveyData.other_complexity} onChange={v => setSurveyData(p => ({ ...p, other_complexity: v }))} placeholder="ระบุความยากง่ายอื่นๆ..." />
                                    </div>
                                )}
                            </div>
                            <div className="space-y-3">
                                <Label text="รสชาติ / ความเหมาะสม (เลือกได้หลายข้อ)" />
                                <CheckboxSet idPrefix="taste_appeal" options={TASTE_OPTIONS} values={surveyData.taste_appeal} onToggle={v => toggleCheckbox(surveyData.taste_appeal, setSurveyData, 'taste_appeal', v)} />
                                {surveyData.taste_appeal.includes('อื่นๆ') && (
                                    <div className="mt-3">
                                        <TextInput id="other_taste_appeal" name="other_taste_appeal" value={surveyData.other_taste_appeal} onChange={v => setSurveyData(p => ({ ...p, other_taste_appeal: v }))} placeholder="ระบุรสชาติอื่นๆ..." />
                                    </div>
                                )}
                            </div>


                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-slate-50">
                                <div className="space-y-2">
                                    <Label text="คุณค่าทางโภชนาการ" htmlFor="nutrition" />
                                    <textarea id="nutrition" name="nutrition" value={surveyData.nutrition} onChange={e => setSurveyData(p => ({ ...p, nutrition: e.target.value }))} rows={3} placeholder="ระบุคุณค่าทางโภชนาการ..." className="w-full text-base font-medium text-slate-800 border-2 border-slate-100 focus:border-indigo-500 rounded-2xl p-4 outline-none bg-slate-50 resize-y" />
                                </div>
                                <div className="space-y-2">
                                    <Label text="คุณค่าทางสังคมและวัฒนธรรม" htmlFor="social_value" />
                                    <textarea id="social_value" name="social_value" value={surveyData.social_value} onChange={e => setSurveyData(p => ({ ...p, social_value: e.target.value }))} rows={3} placeholder="ระบุคุณค่าทางสังคมและวัฒนธรรม..." className="w-full text-base font-medium text-slate-800 border-2 border-slate-100 focus:border-indigo-500 rounded-2xl p-4 outline-none bg-slate-50 resize-y" />
                                </div>
                            </div>
                        </div>
                    </div>
                </SectionCard>

                <SectionCard idx={2} sectionRefs={sectionRefs}>
                    <div className="space-y-8">
                        <div className="space-y-2">
                            <Label text="เรื่องเล่า / ตำนาน / ประวัติความเป็นมา" htmlFor="story" />
                            <textarea id="story" name="story" value={storyData.story} onChange={e => setStoryData(p => ({ ...p, story: e.target.value }))} rows={5} placeholder="บันทึกเรื่องราว..." className="w-full text-base sm:text-lg font-medium text-slate-800 border-2 border-slate-100 focus:border-indigo-500 rounded-2xl p-4 sm:p-4 outline-none bg-slate-50 resize-y" />
                        </div>
                        <div className="space-y-3">
                            <Label text="สถานะการสืบทอด" />
                            <RadioSet idPrefix="heritage_status" options={HERITAGE_OPTIONS} value={storyData.heritage_status} onChange={v => setStoryData(p => ({ ...p, heritage_status: v }))} />
                        </div>
                    </div>
                </SectionCard>

                <SectionCard idx={3} sectionRefs={sectionRefs}>
                    <div className="space-y-10">
                        {/* Zone 1: Main Ingredients */}
                        <div className="space-y-4">
                            <Label text="วัตถุดิบหลัก (เนื้อสัตว์ / ผัก / เส้น)" />
                            <div className="space-y-4">
                                {ingredients.filter(ing => ing.ingredient_type === 'วัตถุดิบ').map((ing, idx) => {
                                    const actualIdx = ingredients.indexOf(ing)
                                    return (
                                        <div key={actualIdx} className="flex flex-col md:flex-row gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 md:items-center">
                                            <div className="flex-1 min-w-0">
                                                <IngredientCombobox
                                                    value={ing.name}
                                                    ingId={ing.ref_ing_id}
                                                    defaultCategory="วัตถุดิบ"
                                                    onChange={(id, name) => { updateIngredient(actualIdx, 'ref_ing_id', id); updateIngredient(actualIdx, 'name', name) }}
                                                    placeholder="พิมพ์เพื่อค้นหาวัตถุดิบ..."
                                                    accentColor="indigo"
                                                />
                                            </div>
                                            <div className="flex flex-wrap sm:flex-nowrap gap-3 items-center w-full md:w-auto">
                                                <div className="space-y-1">
                                                    <label htmlFor={`ing-qty-${actualIdx}`} className="sr-only">ปริมาณ</label>
                                                    <input id={`ing-qty-${actualIdx}`} type="text" placeholder="ปริมาณ" value={ing.quantity} onChange={e => updateIngredient(actualIdx, 'quantity', e.target.value)} className="w-20 sm:w-24 bg-white border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:border-indigo-500 font-medium text-slate-700" />
                                                </div>
                                                <div className="space-y-1">
                                                    <label htmlFor={`ing-unit-${actualIdx}`} className="sr-only">หน่วย</label>
                                                    <input id={`ing-unit-${actualIdx}`} type="text" placeholder="หน่วย" value={ing.unit} onChange={e => updateIngredient(actualIdx, 'unit', e.target.value)} className="w-20 sm:w-24 bg-white border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:border-indigo-500 font-medium text-slate-700" />
                                                </div>
                                                <div className="space-y-1">
                                                    <label htmlFor={`ing-note-${actualIdx}`} className="sr-only">หมายเหตุ</label>
                                                    <input id={`ing-note-${actualIdx}`} type="text" placeholder="หมายเหตุ" value={ing.note} onChange={e => updateIngredient(actualIdx, 'note', e.target.value)} className="w-full md:w-40 bg-white border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:border-indigo-500 font-medium text-slate-700 font-sans" />
                                                </div>

                                                <label className="flex items-center gap-2 cursor-pointer ml-2">
                                                    <input type="checkbox" checked={ing.is_main_ingredient} onChange={e => updateIngredient(actualIdx, 'is_main_ingredient', e.target.checked)} className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer" />
                                                    <span className="text-sm font-bold text-slate-600 cursor-pointer select-none">วัตถุดิบหลัก</span>
                                                </label>

                                                {ingredients.filter(i => i.ingredient_type === 'วัตถุดิบ').length > 1 && (
                                                    <button type="button" onClick={() => removeIngredient(actualIdx)} className="text-red-400 p-2 hover:bg-red-50 rounded-lg transition-colors ml-auto sm:ml-2">
                                                        <Icon icon="solar:trash-bin-minimalistic-bold" className="text-xl" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                            <button type="button" onClick={() => addIngredient('วัตถุดิบ')} className="text-indigo-600 font-bold flex items-center gap-2 text-sm">
                                <Icon icon="solar:add-circle-bold" className="text-lg" /> เพิ่มวัตถุดิบ
                            </button>
                        </div>

                        {/* Zone 2: Seasonings & Herbs */}
                        <div className="space-y-4">
                            <Label text="เครื่องปรุงรส และ สมุนไพร" />
                            <div className="space-y-4">
                                {ingredients.filter(ing => ing.ingredient_type === 'เครื่องปรุง/สมุนไพร').map((ing, idx) => {
                                    const actualIdx = ingredients.indexOf(ing)
                                    return (
                                        <div key={actualIdx} className="flex flex-col md:flex-row gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 md:items-center">
                                            <div className="flex-1 min-w-0">
                                                <IngredientCombobox
                                                    value={ing.name}
                                                    ingId={ing.ref_ing_id}
                                                    defaultCategory="เครื่องปรุง/สมุนไพร"
                                                    onChange={(id, name) => { updateIngredient(actualIdx, 'ref_ing_id', id); updateIngredient(actualIdx, 'name', name) }}
                                                    placeholder="พิมพ์เพื่อค้นหาเครื่องปรุง..."
                                                    accentColor="amber"
                                                />
                                            </div>
                                            <div className="flex flex-wrap sm:flex-nowrap gap-3 items-center w-full md:w-auto">
                                                <div className="space-y-1">
                                                    <label htmlFor={`seasoning-qty-${actualIdx}`} className="sr-only">ปริมาณ</label>
                                                    <input id={`seasoning-qty-${actualIdx}`} type="text" placeholder="ปริมาณ" value={ing.quantity} onChange={e => updateIngredient(actualIdx, 'quantity', e.target.value)} className="w-20 sm:w-24 bg-white border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:border-amber-500 font-medium text-slate-700" />
                                                </div>
                                                <div className="space-y-1">
                                                    <label htmlFor={`seasoning-unit-${actualIdx}`} className="sr-only">หน่วย</label>
                                                    <input id={`seasoning-unit-${actualIdx}`} type="text" placeholder="หน่วย" value={ing.unit} onChange={e => updateIngredient(actualIdx, 'unit', e.target.value)} className="w-20 sm:w-24 bg-white border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:border-amber-500 font-medium text-slate-700" />
                                                </div>
                                                <div className="space-y-1">
                                                    <label htmlFor={`seasoning-note-${actualIdx}`} className="sr-only">หมายเหตุ</label>
                                                    <input id={`seasoning-note-${actualIdx}`} type="text" placeholder="หมายเหตุ" value={ing.note} onChange={e => updateIngredient(actualIdx, 'note', e.target.value)} className="w-full md:w-40 bg-white border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:border-amber-500 font-medium text-slate-700 font-sans" />
                                                </div>

                                                {ingredients.filter(i => i.ingredient_type === 'เครื่องปรุง/สมุนไพร').length > 1 && (
                                                    <button type="button" onClick={() => removeIngredient(actualIdx)} className="text-red-400 p-2 hover:bg-red-50 rounded-lg transition-colors ml-auto sm:ml-2">
                                                        <Icon icon="solar:trash-bin-minimalistic-bold" className="text-xl" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                            <button type="button" onClick={() => addIngredient('เครื่องปรุง/สมุนไพร')} className="text-amber-600 font-bold flex items-center gap-2 text-sm">
                                <Icon icon="solar:add-circle-bold" className="text-lg" /> เพิ่มเครื่องปรุง/สมุนไพร
                            </button>
                        </div>


                        <div className="space-y-8">
                            <div className="space-y-4">
                                <Label text="ขั้นตอนการเตรียม" />
                                <div className="space-y-4">
                                    {prepSteps.map((s, idx) => (
                                        <div key={`prep-${idx}`} className="flex gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 items-start">
                                            <label htmlFor={`prep-step-${idx}`} className="w-8 h-8 bg-slate-800 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">{s.step_order}</label>
                                            <textarea id={`prep-step-${idx}`} value={s.instruction} onChange={e => updateStep('เตรียม', idx, e.target.value)} className="flex-1 bg-transparent outline-none py-1" rows={2} />
                                            {prepSteps.length > 1 && (
                                                <button type="button" onClick={() => removeStep('เตรียม', idx)} className="text-red-400 p-1 hover:bg-red-50 rounded-lg transition-colors"><Icon icon="solar:trash-bin-minimalistic-bold" /></button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <button type="button" onClick={() => addStep('เตรียม')} className="text-indigo-600 font-bold flex items-center gap-2 text-sm"><Icon icon="solar:add-circle-bold" /> เพิ่มขั้นตอนการเตรียม</button>
                            </div>

                            <div className="space-y-4">
                                <Label text="ขั้นตอนการปรุง" />
                                <div className="space-y-4">
                                    {cookSteps.map((s, idx) => (
                                        <div key={`cook-${idx}`} className="flex gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 items-start">
                                            <label htmlFor={`cook-step-${idx}`} className="w-8 h-8 bg-slate-800 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">{s.step_order}</label>
                                            <textarea id={`cook-step-${idx}`} value={s.instruction} onChange={e => updateStep('ปรุง', idx, e.target.value)} className="flex-1 bg-transparent outline-none py-1" rows={2} />
                                            {cookSteps.length > 1 && (
                                                <button type="button" onClick={() => removeStep('ปรุง', idx)} className="text-red-400 p-1 hover:bg-red-50 rounded-lg transition-colors"><Icon icon="solar:trash-bin-minimalistic-bold" /></button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <button type="button" onClick={() => addStep('ปรุง')} className="text-indigo-600 font-bold flex items-center gap-2 text-sm"><Icon icon="solar:add-circle-bold" /> เพิ่มขั้นตอนการปรุง</button>
                            </div>
                        </div>
                        <textarea value={secretTips} onChange={e => setSecretTips(e.target.value)} placeholder="เคล็ดลับ/เทคนิคพิเศษ..." className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none" rows={3} />

                        <div className="space-y-3 pt-6 border-t border-slate-50">
                            <Label text="ทำหนึ่งครั้ง (1 เมนู) ทานได้กี่คน?" required />
                            <RadioSet idPrefix="serving_size" options={SERVING_SIZE_OPTIONS} value={surveyData.serving_size} onChange={v => setSurveyData(p => ({ ...p, serving_size: v }))} />
                            {surveyData.serving_size === 'อื่นๆ' && (
                                <div className="mt-3">
                                    <TextInput id="other_serving_size" name="other_serving_size" value={surveyData.other_serving_size} onChange={v => setSurveyData(p => ({ ...p, other_serving_size: v }))} placeholder="ระบุจำนวนคนอื่นๆ เช่น 10 คนขึ้นไป หรืออื่นๆ..." />
                                </div>
                            )}
                        </div>
                    </div>
                </SectionCard>

                <SectionCard idx={4} sectionRefs={sectionRefs}>
                    <div className="space-y-5">
                        <label className={`flex flex-col items-center justify-center gap-3 w-full py-10 rounded-3xl border-2 border-dashed cursor-pointer transition-all ${uploadingPhotos ? 'opacity-50 pointer-events-none' : 'hover:bg-indigo-50'}`}>
                            <Icon icon={uploadingPhotos ? 'solar:refresh-bold' : 'solar:camera-add-bold-duotone'} className={`text-5xl ${uploadingPhotos ? 'animate-spin' : 'text-indigo-500'}`} />
                            <p className="font-bold">{uploadingPhotos ? 'กำลังอัปโหลด...' : 'แตะเพื่อเลือกรูปภาพ'}</p>
                            {/* เพิ่ม accept="image/*" เข้าไป ระบบจะเทาไฟล์วิดีโอทิ้ง กดเลือกไม่ได้ */}
                            <input type="file" accept="image/*" multiple className="hidden" onChange={e => e.target.files && handlePhotoUpload(e.target.files)} />
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
                            {photoUrls.map((p, idx) => (
                                <div key={p.id || idx} className="relative rounded-xl overflow-hidden border border-slate-200 aspect-square group">
                                    <img src={p.url || p.blobUrl} className={`w-full h-full object-cover transition-all duration-500 ${p.isUploading ? 'blur-sm scale-110 grayscale' : 'blur-0 scale-100 grayscale-0'}`} alt="" />

                                    {p.isUploading && (
                                        <div className="absolute inset-0 bg-black/20 flex flex-col items-center justify-center gap-2">
                                            <Icon icon="solar:refresh-bold" className="text-white text-3xl animate-spin" />
                                            <span className="text-[10px] text-white font-black uppercase tracking-widest drop-shadow-md">Uploading</span>
                                        </div>
                                    )}

                                    <button
                                        type="button"
                                        onClick={() => setPhotoUrls(prev => {
                                            const target = prev[idx]
                                            if (target.blobUrl) URL.revokeObjectURL(target.blobUrl)
                                            return prev.filter((_, i) => i !== idx)
                                        })}
                                        className="absolute top-2 right-2 w-8 h-8 bg-black/40 hover:bg-red-500 text-white rounded-full flex items-center justify-center backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100"
                                    >
                                        <Icon icon="solar:trash-bin-trash-bold" className="text-lg" />
                                    </button>

                                    {!p.isUploading && (
                                        <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent">
                                            <div className="flex items-center gap-1.5 text-white">
                                                <Icon icon={p.file ? "solar:tag-bold" : "solar:check-circle-bold"} className={p.file ? "text-amber-400 text-xs" : "text-green-400 text-xs"} />
                                                <span className="text-[9px] font-bold uppercase tracking-tighter">{p.file ? 'Ready to Save' : 'Ready'}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </SectionCard>

                <SectionCard idx={5} sectionRefs={sectionRefs}>
                    <Label text="รางวัล / การรับรอง / เอกสารอ้างอิง" htmlFor="awards_references" />
                    <textarea id="awards_references" name="awards_references" value={awardsRef} onChange={e => setAwardsRef(e.target.value)} placeholder="รางวัล/อ้างอิง..." className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none" rows={3} />
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