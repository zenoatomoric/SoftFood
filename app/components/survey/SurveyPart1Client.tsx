'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import { Icon } from '@iconify/react'
import ConfirmModal from '../ConfirmModal'
import Toast from '../Toast'
import { compressImage } from '@/utils/image-compression'

const MapPicker = dynamic(() => import('./MapPicker'), {
    ssr: false,
    loading: () => <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/20 backdrop-blur-sm"><div className="bg-white p-6 rounded-2xl shadow-xl flex items-center gap-3 font-bold"><Icon icon="solar:refresh-bold" className="animate-spin text-2xl text-indigo-600" /> กำลังโหลดแผนที่...</div></div>
})

interface Props {
    initialData?: any
    isEditMode?: boolean
    readOnly?: boolean
    userRole?: string
    userName?: string
}

export default function SurveyPart1Client({ initialData, isEditMode = false, readOnly = false, userRole = 'user', userName = '' }: Props) {
    const router = useRouter()
    const searchParams = useSearchParams()

    const [loading, setLoading] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState<any[]>([])
    const [isGettingLocation, setIsGettingLocation] = useState(false)
    const [showMapPicker, setShowMapPicker] = useState(false)
    const [uploadingConsent, setUploadingConsent] = useState(false)
    const [pendingConsentFile, setPendingConsentFile] = useState<File | null>(null)
    const [consentDocUrl, setConsentDocUrl] = useState(initialData?.consent_document_url || '')

    const [formData, setFormData] = useState({
        full_name: initialData?.full_name || '',
        gender: initialData?.gender || '',
        age: initialData?.age || '',
        occupation: initialData?.occupation || '',
        income: initialData?.income || '',
        address_full: initialData?.address_full || '',
        canal_zone: initialData?.canal_zone || '',
        residency_years: initialData?.residency_years || '',
        residency_months: initialData?.residency_months || '',
        residency_days: initialData?.residency_days || '',
        phone: initialData?.phone || '',
        social_media: initialData?.social_media || '',
        gps_lat: initialData?.gps_lat || '',
        gps_long: initialData?.gps_long || '',
        gps_alt: initialData?.gps_alt || '',
        friendly_id: initialData?.friendly_id || ''
    })

    const [addressData, setAddressData] = useState<any[]>([])
    const [districts, setDistricts] = useState<any[]>([])
    const [subDistricts, setSubDistricts] = useState<any[]>([])

    // Address sub-fields
    const [addressFields, setAddressFields] = useState({
        province: 'กรุงเทพมหานคร',
        district: '',
        subDistrict: '',
        zipcode: '',
        detail: ''
    })

    const [confirmConfig, setConfirmConfig] = useState<{
        isOpen: boolean
        title: string
        message: string
        type: 'info' | 'danger' | 'success' | 'warning'
        onConfirm: () => void
    }>({ isOpen: false, title: '', message: '', type: 'info', onConfirm: () => { } })

    const [toastConfig, setToastConfig] = useState({
        isVisible: false,
        message: '',
        type: 'success' as 'success' | 'error' | 'info' | 'warning'
    })

    const [openDropdown, setOpenDropdown] = useState<string | null>(null)
    const [showMyInformants, setShowMyInformants] = useState(false)
    const [myInformants, setMyInformants] = useState<any[]>([])
    const [loadingMyInformants, setLoadingMyInformants] = useState(false)
    const [myInformantsSearch, setMyInformantsSearch] = useState('')
    const [showVerifyEdit, setShowVerifyEdit] = useState(false)
    const [isDraftLoaded, setIsDraftLoaded] = useState(false)

    const CustomSelect = ({
        label,
        value,
        onChange,
        options,
        disabled,
        placeholder,
        id,
        required,
        accentColor = "indigo"
    }: {
        label: string,
        value: string,
        onChange: (val: string) => void,
        options: { label: string, value: string }[],
        disabled?: boolean,
        placeholder?: string,
        id: string,
        required?: boolean,
        accentColor?: "indigo" | "amber" | "slate"
    }) => {
        const isOpen = openDropdown === id
        const selectedOption = options.find(o => o.value === value)

        const colors = {
            indigo: {
                bg: "bg-indigo-50/50",
                border: "border-indigo-100",
                focusBorder: "focus:border-indigo-500",
                ring: "focus:ring-indigo-50/50",
                text: "text-indigo-700",
                hoverBorder: "hover:border-indigo-200",
                activeBg: "bg-indigo-50",
                activeText: "text-indigo-600"
            },
            amber: {
                bg: "bg-amber-50/50",
                border: "border-amber-100",
                focusBorder: "focus:border-amber-500",
                ring: "focus:ring-amber-50/50",
                text: "text-amber-700",
                hoverBorder: "hover:border-amber-200",
                activeBg: "bg-amber-50",
                activeText: "text-amber-600"
            },
            slate: {
                bg: "bg-slate-50",
                border: "border-slate-100",
                focusBorder: "focus:border-indigo-500",
                ring: "focus:ring-indigo-50/50",
                text: "text-slate-900",
                hoverBorder: "hover:border-indigo-200",
                activeBg: "bg-indigo-50",
                activeText: "text-indigo-600"
            }
        }[accentColor]

        return (
            <div className="relative">
                {/* Visually hidden but focusable input to link with the label's htmlFor */}
                <input
                    id={id}
                    type="text"
                    value={value}
                    readOnly
                    required={required}
                    className="sr-only"
                    onFocus={() => !disabled && setOpenDropdown(id)}
                    aria-hidden="true"
                />
                <div
                    onClick={() => !disabled && setOpenDropdown(isOpen ? null : id)}
                    role="combobox"
                    aria-expanded={isOpen}
                    aria-haspopup="listbox"
                    aria-label={label}
                    aria-controls={`${id}-listbox`}
                    className={`group w-full ${colors.bg} border-2 ${isOpen ? colors.focusBorder + ' ring-4 ' + colors.ring : colors.border} rounded-xl md:rounded-2xl px-4 py-3.5 md:px-5 md:py-4 ${colors.text} font-medium outline-none transition-all duration-300 flex items-center justify-between cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-100 text-slate-400' : colors.hoverBorder + ' hover:bg-white hover:shadow-sm'}`}
                >
                    <span className={`text-sm md:text-base ${value ? colors.text : 'text-slate-400 font-medium'}`}>
                        {selectedOption ? selectedOption.label : placeholder}
                    </span>
                    <Icon
                        icon="solar:alt-arrow-down-linear"
                        className={`text-xl md:text-2xl transition-all duration-300 ${isOpen ? '-rotate-180 ' + colors.activeText : 'text-slate-400'}`}
                    />
                </div>

                {isOpen && (
                    <>
                        <div className="fixed inset-0 z-[60]" onClick={() => setOpenDropdown(null)}></div>
                        <div id={`${id}-listbox`} role="listbox" className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl md:rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-[70] animate-in fade-in zoom-in-95 duration-200">
                            <div className="max-h-60 overflow-y-auto py-2 px-2 space-y-1">
                                {options.map(opt => (
                                    <div
                                        key={opt.value}
                                        role="option"
                                        aria-selected={value === opt.value}
                                        onClick={() => { onChange(opt.value); setOpenDropdown(null) }}
                                        className={`px-4 py-3 rounded-lg md:rounded-xl text-xs md:text-sm font-medium cursor-pointer transition-all flex items-center justify-between
                                        ${value === opt.value ? colors.activeBg + ' ' + colors.activeText : 'text-slate-900 hover:bg-slate-50'}`}
                                    >
                                        <span>{opt.label}</span>
                                        {value === opt.value && <Icon icon="solar:check-circle-bold" className="text-lg" />}
                                    </div>
                                ))}
                                {options.length === 0 && (
                                    <div className="px-4 py-8 text-center text-slate-400 text-sm font-medium italic">
                                        ไม่มีตัวเลือก...
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>
        )
    }

    // Capture canal_zone from URL if it's a new survey
    useEffect(() => {
        const canalParam = searchParams.get('canal')
        if (canalParam && !formData.canal_zone) {
            setFormData(prev => ({ ...prev, canal_zone: canalParam }))
        }
    }, [searchParams, formData.canal_zone])

    // Fetch Bangkok Address Data
    useEffect(() => {
        const fetchAddressData = async () => {
            try {
                const res = await fetch('https://raw.githubusercontent.com/thailand-geography-data/thailand-geography-json/main/src/geography.json')
                const allData = await res.json()

                // Filter only Bangkok (provinceCode 10)
                const bangkokData = allData.filter((item: any) => item.provinceCode === 10 || item.provinceNameTh === 'กรุงเทพมหานคร')

                // Group by district
                const districtMap = new Map()
                bangkokData.forEach((item: any) => {
                    if (!districtMap.has(item.districtNameTh)) {
                        districtMap.set(item.districtNameTh, {
                            name: item.districtNameTh,
                            subdistricts: []
                        })
                    }
                    districtMap.get(item.districtNameTh).subdistricts.push({
                        name: item.subdistrictNameTh,
                        zip: item.postalCode.toString()
                    })
                })

                const sortedDistricts = Array.from(districtMap.values()).sort((a, b) => a.name.localeCompare(b.name, 'th'))
                setAddressData(sortedDistricts)
                setDistricts(sortedDistricts)

                // If in edit mode, try to parse address_full
                if (isEditMode && initialData?.address_full) {
                    const full = initialData.address_full
                    const regex = /^(.*)\s+แขวง(\S+)\s+เขต(\S+)\s+กรุงเทพมหานคร\s+(\d{5})$/
                    const match = full.match(regex)

                    if (match) {
                        const [_, detail, sub, dist, zip] = match
                        const foundDistrict = sortedDistricts.find(d => d.name === dist)

                        setAddressFields({
                            province: 'กรุงเทพมหานคร',
                            district: dist,
                            subDistrict: sub,
                            zipcode: zip,
                            detail: detail.trim()
                        })

                        if (foundDistrict) {
                            setSubDistricts(foundDistrict.subdistricts)
                        }
                    } else {
                        setAddressFields(prev => ({ ...prev, detail: full }))
                    }
                }
            } catch (err) {
                console.error('Failed to fetch address data:', err)
            }
        }
        fetchAddressData()
    }, [isEditMode, initialData])

    const handleAddressChange = (name: string, value: string) => {
        setAddressFields(prev => {
            const updated = { ...prev, [name]: value }

            if (name === 'district') {
                const foundDistrict = districts.find(d => d.name === value)
                setSubDistricts(foundDistrict ? foundDistrict.subdistricts : [])
                updated.subDistrict = ''
                updated.zipcode = ''
            } else if (name === 'subDistrict') {
                const foundSub = subDistricts.find(s => s.name === value)
                updated.zipcode = foundSub ? foundSub.zip : ''
            }

            return updated
        })
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target

        // Restrict phone number to 10 digits and numbers only
        if (name === 'phone') {
            const numericValue = value.replace(/[^0-9]/g, '').slice(0, 10)
            setFormData(prev => ({ ...prev, [name]: numericValue }))
            return
        }

        setFormData(prev => ({ ...prev, [name]: value }))
    }

    // --- Auto-save Logic ---
    const STORAGE_KEY = 'survey_part1_draft'

    // Load draft on mount
    useEffect(() => {
        if (!isEditMode) {
            const saved = localStorage.getItem(STORAGE_KEY)
            if (saved) {
                try {
                    const draft = JSON.parse(saved)
                    if (draft.formData) setFormData(prev => ({ ...prev, ...draft.formData, friendly_id: prev.friendly_id })) // Keep friendly_id from URL/initial if any
                    if (draft.addressFields) setAddressFields(draft.addressFields)
                    if (draft.consentDocUrl) setConsentDocUrl(draft.consentDocUrl)
                } catch (e) {
                    console.error('Error loading part 1 draft:', e)
                }
            }
            setIsDraftLoaded(true)
        } else {
            setIsDraftLoaded(true)
        }
    }, [isEditMode])

    // Save draft on changes
    useEffect(() => {
        if (!isEditMode && isDraftLoaded && !loading) {
            const draft = { formData, addressFields, consentDocUrl }
            localStorage.setItem(STORAGE_KEY, JSON.stringify(draft))
        }
    }, [formData, addressFields, consentDocUrl, isEditMode, isDraftLoaded, loading])

    const clearDraft = () => {
        localStorage.removeItem(STORAGE_KEY)
    }

    // Debounce search query
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearchQuery(searchQuery)
        }, 500)
        return () => clearTimeout(handler)
    }, [searchQuery])

    // Trigger search on debounced query change
    useEffect(() => {
        const performSearch = async () => {
            if (!debouncedSearchQuery.trim()) {
                setSearchResults([])
                return
            }

            setLoading(true)
            try {
                const res = await fetch(`/api/survey/informant?search=${encodeURIComponent(debouncedSearchQuery)}${userRole !== 'admin' ? '&mine=true' : ''}`)
                const json = await res.json()
                setSearchResults(json.data || [])
            } catch (err) {
                console.error(err)
            } finally {
                setLoading(false)
            }
        }
        performSearch()
    }, [debouncedSearchQuery])

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!searchQuery.trim()) return

        setLoading(true)
        try {
            const res = await fetch(`/api/survey/informant?search=${encodeURIComponent(searchQuery)}${userRole !== 'admin' ? '&mine=true' : ''}`)
            const json = await res.json()
            setSearchResults(json.data || [])
        } catch (err) {
            console.error(err)
            setToastConfig({ isVisible: true, message: 'ค้นหาข้อมูลล้มเหลว', type: 'error' })
        } finally {
            setLoading(false)
        }
    }

    const handleSelectExisting = (item: any) => {
        setConfirmConfig({
            isOpen: true,
            title: 'ใช้ข้อมูลเดิม?',
            message: `ต้องการใช้ข้อมูลของ ${item.full_name} และเริ่มทำแบบสอบถามส่วนถัดไปใขหรือไม่?`,
            type: 'info',
            onConfirm: () => {
                router.push(`/survey/part2?info_id=${item.info_id}`)
            }
        })
    }

    const getLocation = () => {
        if (!navigator.geolocation) {
            setToastConfig({ isVisible: true, message: 'เบราว์เซอร์ไม่รองรับการระบุตำแหน่ง', type: 'error' })
            return
        }

        setIsGettingLocation(true)
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setFormData(prev => ({
                    ...prev,
                    gps_lat: pos.coords.latitude.toString(),
                    gps_long: pos.coords.longitude.toString(),
                    gps_alt: pos.coords.altitude?.toString() || ''
                }))
                setIsGettingLocation(false)
                setToastConfig({ isVisible: true, message: 'ดึงพิกัดสำเร็จ', type: 'success' })
            },
            (err) => {
                console.error(err)
                setIsGettingLocation(false)
                setToastConfig({ isVisible: true, message: 'ไม่สามารถระบุตำแหน่งได้', type: 'error' })
            },
            { enableHighAccuracy: true }
        )
    }

    const handleMapSelect = (lat: number, lng: number) => {
        setFormData(prev => ({
            ...prev,
            gps_lat: lat.toString(),
            gps_long: lng.toString()
        }))
        setShowMapPicker(false)
        setToastConfig({ isVisible: true, message: 'บันทึกพิกัดจากแผนที่สำเร็จ', type: 'success' })
    }

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setUploadingConsent(true)
        try {
            let fileToUpload = file
            // Compress if image
            if (file.type.startsWith('image/')) {
                fileToUpload = await compressImage(file)
            }

            // Revoke old blob URL if exists
            if (consentDocUrl.startsWith('blob:')) {
                URL.revokeObjectURL(consentDocUrl)
            }

            // Store file in state for later upload
            setPendingConsentFile(fileToUpload)

            // Create local preview
            const previewUrl = URL.createObjectURL(fileToUpload)
            setConsentDocUrl(previewUrl)

            setToastConfig({ isVisible: true, message: 'เลือกไฟล์สำเร็จ (จะอัปโหลดเมื่อกดบันทึก)', type: 'info' })
        } catch (err) {
            console.error(err)
            setToastConfig({ isVisible: true, message: 'เตรียมไฟล์ล้มเหลว: ' + String(err), type: 'error' })
        } finally {
            setUploadingConsent(false)
        }
    }

    const handleDownload = async (url: string) => {
        try {
            const res = await fetch(url)
            const blob = await res.blob()
            const blobUrl = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = blobUrl
            a.download = url.split('/').pop() || 'document'
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(blobUrl)
            document.body.removeChild(a)
        } catch (err) {
            console.error(err)
            window.open(url, '_blank')
        }
    }

    const fetchMyInformants = async () => {
        setLoadingMyInformants(true)
        try {
            const res = await fetch(`/api/survey/informant?limit=100${userRole !== 'admin' ? '&mine=true' : ''}`)
            const json = await res.json()
            setMyInformants(json.data || [])
        } catch (err) {
            console.error(err)
        } finally {
            setLoadingMyInformants(false)
        }
    }

    const selectInformant = (inf: any) => {
        setConfirmConfig({
            isOpen: true,
            title: 'ยืนยันการเลือกผู้ให้ข้อมูล',
            message: `คุณต้องการเพิ่มเมนูอาหารใหม่ให้ "${inf.full_name}" (รหัส ${inf.friendly_id}) ใช่หรือไม่?`,
            type: 'info',
            onConfirm: () => {
                router.push(`/survey/part2?info_id=${inf.info_id}`)
            }
        })
    }

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault()

        // If edit mode and not yet verified, show verify popup
        if (isEditMode && !showVerifyEdit) {
            setShowVerifyEdit(true)
            return
        }

        setLoading(true)
        setShowVerifyEdit(false)

        try {
            let finalConsentUrl = consentDocUrl

            // 1. Upload file if pending
            if (pendingConsentFile) {
                setUploadingConsent(true)
                try {
                    const formDataUpload = new FormData()
                    formDataUpload.append('file', pendingConsentFile)
                    formDataUpload.append('folder', 'pdpa')

                    const uploadRes = await fetch('/api/upload', {
                        method: 'POST',
                        body: formDataUpload
                    })
                    const uploadJson = await uploadRes.json()
                    if (!uploadRes.ok) throw new Error(uploadJson.error || 'Failed to upload document')
                    finalConsentUrl = uploadJson.url
                } finally {
                    setUploadingConsent(false)
                }
            }

            // 2. Merge address fields
            const { detail, subDistrict, district, province, zipcode } = addressFields
            const addressFull = `${detail}${detail ? ' ' : ''}แขวง${subDistrict} เขต${district} ${province} ${zipcode}`.trim()

            const payload = {
                ...formData,
                address_full: addressFull,
                consent_document_url: finalConsentUrl
            }

            const method = isEditMode ? 'PATCH' : 'POST'
            const res = await fetch('/api/survey/informant', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(isEditMode ? { info_id: initialData.info_id, ...payload } : payload)
            })

            const json = await res.json()
            if (!res.ok) throw new Error(json.error)

            setToastConfig({ isVisible: true, message: 'บันทึกข้อมูลสำเร็จ', type: 'success' })

            if (!isEditMode) {
                clearDraft()
                router.push(`/survey/part2?info_id=${json.data.info_id}`)
            }
        } catch (err) {
            console.error(err)
            setConfirmConfig({
                isOpen: true,
                title: 'เกิดข้อผิดพลาด',
                message: String(err),
                type: 'danger',
                onConfirm: () => setConfirmConfig(prev => ({ ...prev, isOpen: false }))
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-4xl mx-auto w-full px-4 md:px-8 space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-28 md:pb-32 mt-4 md:mt-0">
            <ConfirmModal isOpen={confirmConfig.isOpen} title={confirmConfig.title} message={confirmConfig.message} type={confirmConfig.type} onConfirm={confirmConfig.onConfirm} onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))} />
            <Toast isVisible={toastConfig.isVisible} message={toastConfig.message} type={toastConfig.type} onCloseAction={() => setToastConfig(prev => ({ ...prev, isVisible: false }))} />

            {/* Edit Verification Popup */}
            {showVerifyEdit && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setShowVerifyEdit(false)} />
                    <div className="relative w-full max-w-lg bg-white rounded-3xl md:rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-8 duration-500 ease-out border border-white/20">
                        {/* Decorative Header */}
                        <div className="h-28 md:h-32 bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-700 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full -mr-20 -mt-20 blur-3xl animate-pulse" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl md:rounded-3xl bg-white/20 backdrop-blur-xl flex items-center justify-center shadow-inner border border-white/30">
                                    <Icon icon="solar:shield-check-bold-duotone" className="text-3xl md:text-4xl text-white" />
                                </div>
                            </div>
                        </div>

                        <div className="p-6 md:p-10 pt-6 text-center">
                            <div className="space-y-2 md:space-y-4 mb-8 md:mb-10">
                                <h3 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">ยืนยันการตรวจสอบการแก้ไข</h3>
                                <p className="text-sm text-slate-500 font-medium px-4">กรุณาตรวจสอบข้อมูลส่วนตัวของผู้ที่จะทำการบันทึกการแก้ไข</p>
                            </div>

                            {/* User Info Card */}
                            <div className="bg-slate-50 rounded-2xl md:rounded-3xl p-5 md:p-6 border border-slate-100 flex flex-col items-center gap-3 md:gap-4 mb-8 md:mb-10 shadow-inner group transition-all">
                                <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center border border-slate-100 group-hover:scale-110 transition-transform duration-300">
                                    <Icon icon="solar:user-circle-bold-duotone" className="text-3xl md:text-4xl text-indigo-500" />
                                </div>
                                <div className="space-y-1">
                                    <div className="text-[10px] md:text-xs font-black text-indigo-400 uppercase tracking-[0.2em]">Current Editor</div>
                                    <div className="text-lg md:text-xl font-bold text-slate-800">{userName || 'ไม่ระบุชื่อ'}</div>
                                    <div className="flex items-center justify-center gap-2 mt-2">
                                        <div className="px-3 py-1 bg-indigo-100 text-indigo-600 rounded-full text-[10px] md:text-xs font-bold ring-1 ring-indigo-200">
                                            {userRole === 'admin' ? 'ผู้ดูแลระบบ (Admin)' : userRole === 'director' ? 'กรรมการ (Director)' : 'ผู้เก็บข้อมูล (User)'}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 md:gap-4">
                                <button
                                    type="button"
                                    onClick={() => setShowVerifyEdit(false)}
                                    className="py-3.5 md:py-4 bg-slate-100 text-slate-500 rounded-xl md:rounded-2xl text-sm md:text-base font-bold hover:bg-slate-200 transition-all active:scale-95"
                                >
                                    ยกเลิก
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleSubmit()}
                                    className="py-3.5 md:py-4 bg-slate-900 text-white rounded-xl md:rounded-2xl text-sm md:text-base font-bold hover:bg-slate-800 shadow-xl shadow-slate-200 transition-all flex items-center justify-center gap-2 active:scale-95"
                                >
                                    <Icon icon="solar:check-read-bold" className="text-lg md:text-xl" />
                                    ยืนยันตัวตน
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showMapPicker && (
                <MapPicker
                    initialLat={formData.gps_lat ? parseFloat(formData.gps_lat) : undefined}
                    initialLong={formData.gps_long ? parseFloat(formData.gps_long) : undefined}
                    onSelectAction={handleMapSelect}
                    onCloseAction={() => setShowMapPicker(false)}
                />
            )}

            {/* ปุ่มดูรายชื่อผู้ให้ข้อมูลของฉัน */}
            {!isEditMode && !readOnly && (
                <div className="w-full">
                    <button
                        type="button"
                        onClick={() => {
                            setShowMyInformants(true)
                            fetchMyInformants()
                        }}
                        className="w-full py-4 md:py-5 bg-indigo-600 text-white rounded-2xl md:rounded-[2rem] hover:bg-indigo-700 hover:shadow-xl hover:shadow-indigo-200 transition-all flex items-center justify-center gap-2 md:gap-3 font-bold md:font-black text-base md:text-lg shadow-lg shadow-indigo-100 group"
                    >
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Icon icon="solar:clipboard-list-bold-duotone" className="text-xl md:text-2xl" />
                        </div>
                        ดูรายชื่อผู้ให้ข้อมูลของฉัน
                    </button>
                </div>
            )}

            {/* Record History Section */}
            {isEditMode && (
                <div className="mt-8 md:mt-12 pt-6 md:pt-8 border-t border-slate-100 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
                    <div className="bg-white/50 backdrop-blur-sm rounded-2xl md:rounded-[2rem] p-5 md:p-8 border border-slate-200/60 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-indigo-500/10 transition-colors" />

                        <div className="flex items-center gap-3 mb-6 md:mb-8">
                            <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-indigo-50 flex items-center justify-center border border-indigo-100">
                                <Icon icon="solar:history-bold-duotone" className="text-lg md:text-xl text-indigo-600" />
                            </div>
                            <h3 className="text-base md:text-lg font-black text-slate-800 tracking-tight">ประวัติการบันทึกข้อมูล</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12 relative">
                            {/* Vertical line for tablet/desktop */}
                            <div className="hidden md:block absolute left-1/2 top-4 bottom-4 w-px bg-slate-100 -translate-x-1/2" />

                            {/* Creator - The person who did the fieldwork */}
                            <div className="flex gap-3 md:gap-4 items-start relative">
                                <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-indigo-600 flex items-center justify-center flex-shrink-0 border-4 border-indigo-50 shadow-md md:shadow-lg shadow-indigo-100">
                                    <Icon icon="solar:user-bold" className="text-xl md:text-2xl text-white" />
                                </div>
                                <div className="space-y-1 md:space-y-1.5 pt-0.5 md:pt-1">
                                    <div className="flex items-center gap-2">
                                        <div className="text-[9px] md:text-[10px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">Collector</div>
                                    </div>
                                    <div className="text-[11px] md:text-xs font-black text-slate-400 uppercase tracking-widest">ลงพื้นที่เก็บข้อมูลโดย</div>
                                    <div className="text-base md:text-lg font-bold text-slate-800 leading-tight">{initialData?.creator_name || 'ไม่ระบุชื่อ'}</div>
                                    <div className="text-[11px] md:text-xs text-slate-500 flex items-center gap-1 md:gap-1.5 font-medium">
                                        <Icon icon="solar:calendar-date-linear" className="text-indigo-400" />
                                        {initialData?.created_at ? new Date(initialData.created_at).toLocaleDateString('th-TH', {
                                            year: 'numeric', month: 'long', day: 'numeric'
                                        }) : '-'}
                                    </div>
                                </div>
                            </div>

                            {/* Divider for mobile */}
                            <div className="md:hidden h-px bg-slate-100 w-full" />

                            {/* Last Editor */}
                            <div className="flex gap-3 md:gap-4 items-start relative">
                                <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-amber-500 flex items-center justify-center flex-shrink-0 border-4 border-amber-50 shadow-md md:shadow-lg shadow-amber-100">
                                    <Icon icon="solar:pen-2-bold" className="text-xl md:text-2xl text-white" />
                                </div>
                                <div className="space-y-1 md:space-y-1.5 pt-0.5 md:pt-1">
                                    <div className="flex items-center gap-2">
                                        <div className="text-[9px] md:text-[10px] font-black text-amber-500 uppercase tracking-widest bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">Last Editor</div>
                                    </div>
                                    <div className="text-[11px] md:text-xs font-black text-amber-500/70 uppercase tracking-widest">แก้ไขข้อมูลล่าสุดโดย</div>
                                    <div className="text-base md:text-lg font-bold text-slate-800 leading-tight">{initialData?.editor_name || '-'}</div>
                                    {initialData?.last_edited_at && (
                                        <div className="text-[11px] md:text-xs text-slate-500 flex items-center gap-1 md:gap-1.5 font-medium">
                                            <Icon icon="solar:clock-circle-linear" className="text-amber-400" />
                                            {new Date(initialData.last_edited_at).toLocaleDateString('th-TH', {
                                                year: 'numeric', month: 'long', day: 'numeric',
                                                hour: '2-digit', minute: '2-digit'
                                            })} น.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {!isEditMode && (
                <>
                    <section className="bg-white rounded-2xl md:rounded-3xl p-5 md:p-8 shadow-sm border border-slate-100">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 md:gap-4 mb-6 md:mb-8">
                            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 flex-shrink-0">
                                <Icon icon="solar:magnifer-bold" className="text-xl md:text-2xl" />
                            </div>
                            <div>
                                <h3 className="font-bold text-base md:text-xl text-slate-800">ค้นหาข้อมูลบุคคลเดิม</h3>
                                <p className="text-[11px] md:text-sm font-medium text-slate-500">ระบุรหัสเพื่อข้ามไปเพิ่มเมนูอาหารได้เลย</p>
                            </div>
                        </div>

                        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 md:gap-4">
                            <div className="flex-1 relative">
                                <label htmlFor="informant_search" className="sr-only">ค้นหาด้วยรหัส (เช่น INFO-001)</label>
                                <input id="informant_search" type="text" placeholder="ระบุรหัส (เช่น INFO-001)..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl md:rounded-2xl px-4 py-3.5 md:py-4 text-sm md:text-base font-medium focus:ring-2 focus:ring-amber-200 focus:border-amber-400 outline-none transition-all" />
                            </div>
                            <div className="flex gap-2 w-full sm:w-auto">
                                <button type="submit" disabled={loading} className="flex-1 sm:flex-none bg-slate-900 text-white px-6 md:px-8 py-3.5 md:py-4 rounded-xl md:rounded-2xl font-bold text-sm md:text-base hover:bg-slate-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                                    {loading ? <Icon icon="solar:refresh-bold" className="animate-spin text-lg md:text-xl" /> : 'ค้นหา'}
                                </button>
                            </div>
                        </form>

                        {/* Quick View: My Informants (Under Search) */}
                        {!isEditMode && !readOnly && myInformants.length > 0 && !searchQuery && (
                            <div className="mt-6 md:mt-8 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 md:gap-2">
                                        <Icon icon="solar:history-bold" className="text-indigo-400 text-sm md:text-base" />
                                        {userRole === 'admin' ? 'รายการล่าสุดทั้งหมด' : 'รายการล่าสุดของคุณ'}
                                    </div>
                                    <button type="button" onClick={() => { setShowMyInformants(true); fetchMyInformants(); }} className="text-[11px] md:text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-2 py-1 rounded-md">ดูทั้งหมด</button>
                                </div>
                                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
                                    {myInformants.slice(0, 5).map((inf) => (
                                        <button
                                            key={inf.info_id}
                                            type="button"
                                            onClick={() => selectInformant(inf)}
                                            className="shrink-0 w-36 md:w-44 text-left p-3 md:p-4 rounded-xl md:rounded-2xl border border-slate-100 bg-slate-50 hover:bg-white hover:border-indigo-200 hover:shadow-sm transition-all group"
                                        >
                                            <div className="font-bold text-slate-800 text-xs md:text-sm truncate w-full">{inf.full_name}</div>
                                            <div className="text-[10px] md:text-xs text-indigo-500 font-bold mt-1 bg-indigo-50 w-max px-1.5 py-0.5 rounded">{inf.friendly_id}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {(searchResults.length > 0 || (searchQuery && !loading)) && (
                            <div className="space-y-3 md:space-y-4 mt-6 md:mt-8">
                                {searchResults.length > 0 && <div className="text-[11px] md:text-sm font-bold text-slate-400 uppercase tracking-wide border-b border-slate-100 pb-2">ผลการค้นหา ({searchResults.length})</div>}
                                {searchResults.map((item: any) => (
                                    <div key={item.info_id} className="p-3 md:p-4 border border-slate-200 rounded-xl md:rounded-2xl hover:bg-amber-50 hover:border-amber-200 cursor-pointer flex justify-between items-center transition-all group" onClick={() => handleSelectExisting(item)}>
                                        <div className="min-w-0 pr-3 md:pr-4">
                                            <div className="font-bold text-sm md:text-lg text-slate-900 truncate">{item.full_name}</div>
                                            <div className="text-[11px] md:text-sm text-slate-500 flex flex-wrap items-center gap-1.5 md:gap-2 mt-1 md:mt-2">
                                                <span>{item.phone || '-'}</span>
                                                {item.friendly_id && (
                                                    <>
                                                        <span className="text-slate-300 hidden xs:inline">|</span>
                                                        <span className="text-indigo-600 font-bold bg-indigo-50 px-1.5 py-0.5 md:px-2 md:py-1 rounded-md text-[10px] md:text-xs">{item.friendly_id}</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-full bg-slate-50 md:bg-white border border-slate-100 flex items-center justify-center group-hover:bg-amber-100 group-hover:text-amber-600 transition-colors flex-shrink-0">
                                            <Icon icon="solar:arrow-right-linear" className="text-lg md:text-xl" />
                                        </div>
                                    </div>
                                ))}
                                {searchResults.length === 0 && searchQuery && !loading && (
                                    <div className="text-center py-6 md:py-8 text-sm md:text-base text-slate-500 font-medium bg-slate-50 rounded-xl md:rounded-2xl border border-dashed border-slate-200">
                                        ไม่พบข้อมูลที่ตรงกัน
                                    </div>
                                )}
                            </div>
                        )}
                    </section>
                    <div className="flex items-center gap-4 py-2">
                        <div className="flex-1 h-px bg-slate-200" />
                        <span className="text-[11px] md:text-sm font-bold text-slate-400 uppercase tracking-widest text-center bg-white px-2">หรือ กรอกข้อมูลใหม่</span>
                        <div className="flex-1 h-px bg-slate-200" />
                    </div>
                </>
            )}

            <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">
                <section className="bg-white rounded-2xl md:rounded-3xl p-5 md:p-8 shadow-sm border border-slate-100">
                    <div className="flex items-center gap-3 md:gap-4 mb-6 md:mb-8 border-b border-slate-50 pb-4">
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 flex-shrink-0">
                            <Icon icon="solar:user-id-bold-duotone" className="text-xl md:text-3xl" />
                        </div>
                        <h2 className="text-lg md:text-2xl font-black text-slate-800 leading-tight">{isEditMode ? 'แก้ไขข้อมูลผู้ให้ข้อมูล' : 'ส่วนที่ ๑ ข้อมูลผู้ให้ข้อมูล'}</h2>
                    </div>

                    <div className="space-y-6 md:space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                            <div className="space-y-1.5 md:space-y-2">
                                <label htmlFor="full_name" className="text-sm md:text-base font-medium text-slate-900 uppercase flex items-center gap-1.5 md:gap-2">ชื่อ-นามสกุล <span className="text-red-500">*</span></label>
                                <input id="full_name" name="full_name" value={formData.full_name} onChange={handleInputChange} type="text" required disabled={readOnly} autoComplete="name"
                                    className="w-full text-base md:text-lg font-medium text-slate-900 border-b-2 border-slate-100 focus:border-indigo-500 py-2 outline-none bg-transparent placeholder:text-slate-300 transition-colors disabled:text-slate-500" placeholder="ระบุชื่อ-นามสกุล" />
                            </div>
                            <div className="space-y-1.5 md:space-y-2" role="radiogroup" aria-labelledby="gender-label">
                                <label id="gender-label" className="text-sm md:text-base font-medium text-slate-900 uppercase">เพศ</label>
                                <div className="flex flex-wrap gap-3 md:gap-4 mt-1 md:mt-2">
                                    {['ชาย', 'หญิง', 'อื่นๆ'].map((g) => {
                                        const id = `gender-${g}`
                                        return (
                                            <label
                                                key={g}
                                                htmlFor={id}
                                                className={`flex items-center gap-2 cursor-pointer transition-all ${formData.gender === g ? 'text-indigo-600 font-bold' : 'text-slate-900 font-medium'} ${readOnly ? 'pointer-events-none opacity-80' : ''}`}
                                            >
                                                <input
                                                    id={id}
                                                    type="radio"
                                                    name="gender"
                                                    value={g}
                                                    checked={formData.gender === g}
                                                    onChange={() => !readOnly && setFormData(prev => ({ ...prev, gender: g }))}
                                                    className="sr-only"
                                                />
                                                <div className={`w-5 h-5 md:w-6 md:h-6 rounded-full flex items-center justify-center border-2 flex-shrink-0 ${formData.gender === g ? 'border-indigo-600 bg-indigo-50' : 'border-slate-300 bg-slate-50'}`}>
                                                    {formData.gender === g && <div className="w-2.5 h-2.5 md:w-3 md:h-3 bg-indigo-600 rounded-full shadow-sm" />}
                                                </div>
                                                <span className="text-sm md:text-base">{g}</span>
                                            </label>
                                        )
                                    })}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 md:gap-6">
                                <div className="space-y-1.5 md:space-y-2">
                                    <label htmlFor="age" className="text-sm md:text-base font-medium text-slate-900 uppercase">อายุ (ปี)</label>
                                    <input id="age" name="age" value={formData.age} onChange={handleInputChange} type="number" disabled={readOnly} placeholder="ระบุอายุ"
                                        className="w-full text-base md:text-lg font-medium text-slate-900 border-b-2 border-slate-100 focus:border-indigo-500 py-2 outline-none bg-transparent placeholder:text-slate-300 transition-colors disabled:text-slate-500" />
                                </div>
                                <div className="space-y-1.5 md:space-y-2">
                                    <label htmlFor="occupation" className="text-sm md:text-base font-medium text-slate-900 uppercase">อาชีพ</label>
                                    <input id="occupation" name="occupation" value={formData.occupation} onChange={handleInputChange} type="text" disabled={readOnly} placeholder="ระบุอาชีพ"
                                        className="w-full text-base md:text-lg font-medium text-slate-900 border-b-2 border-slate-100 focus:border-indigo-500 py-2 outline-none bg-transparent placeholder:text-slate-300 transition-colors disabled:text-slate-500" />
                                </div>
                            </div>
                            <div className="space-y-1.5 md:space-y-2">
                                <label htmlFor="income" className="text-sm md:text-base font-medium text-slate-900 uppercase">รายได้เฉลี่ย (บาท/เดือน)</label>
                                <input id="income" name="income" value={formData.income} onChange={handleInputChange} type="number" disabled={readOnly} placeholder="ระบุรายได้"
                                    className="w-full text-base md:text-lg font-medium text-slate-900 border-b-2 border-slate-100 focus:border-indigo-500 py-2 outline-none bg-transparent placeholder:text-slate-300 transition-colors disabled:text-slate-500" />
                            </div>
                        </div>

                        <div className="space-y-5 md:space-y-8 bg-slate-50/50 p-4 md:p-6 rounded-2xl border border-slate-100">
                            <label className="text-sm md:text-base font-bold text-slate-700 uppercase flex items-center gap-2">
                                <Icon icon="solar:map-point-wave-bold" className="text-indigo-500" /> ที่อยู่ปัจจุบัน
                            </label>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                                {/* จังหวัด */}
                                <div className="space-y-1.5 md:space-y-2">
                                    <label htmlFor="province" className="text-[11px] md:text-sm font-black text-slate-400 uppercase tracking-widest ml-1">จังหวัด</label>
                                    <input id="province" value={addressFields.province} readOnly
                                        className="w-full bg-slate-100/80 border-2 border-slate-100 rounded-xl md:rounded-2xl px-4 py-3.5 md:px-5 md:py-4 text-sm md:text-base text-slate-500 font-bold focus:outline-none cursor-not-allowed" />
                                </div>

                                {/* เขต */}
                                <div className="space-y-1.5 md:space-y-2">
                                    <label htmlFor="district" className="text-[11px] md:text-sm font-black text-slate-400 uppercase tracking-widest ml-1">เขต <span className="text-red-500">*</span></label>
                                    <CustomSelect
                                        id="district"
                                        label="เขต"
                                        placeholder="-- เลือกเขต --"
                                        value={addressFields.district}
                                        options={districts.map(d => ({ label: d.name, value: d.name }))}
                                        onChange={(val) => handleAddressChange('district', val)}
                                        disabled={readOnly || districts.length === 0}
                                        required
                                        accentColor="slate"
                                    />
                                </div>

                                {/* แขวง */}
                                <div className="space-y-1.5 md:space-y-2">
                                    <label htmlFor="subDistrict" className="text-[11px] md:text-sm font-black text-slate-400 uppercase tracking-widest ml-1">แขวง <span className="text-red-500">*</span></label>
                                    <CustomSelect
                                        id="subDistrict"
                                        label="แขวง"
                                        placeholder="-- เลือกแขวง --"
                                        value={addressFields.subDistrict}
                                        options={subDistricts.map(s => ({ label: s.name, value: s.name }))}
                                        onChange={(val) => handleAddressChange('subDistrict', val)}
                                        disabled={readOnly || !addressFields.district}
                                        required
                                        accentColor="slate"
                                    />
                                </div>

                                {/* รหัสไปรษณีย์ */}
                                <div className="space-y-1.5 md:space-y-2">
                                    <label htmlFor="zipcode" className="text-[11px] md:text-sm font-black text-slate-400 uppercase tracking-widest ml-1">รหัสไปรษณีย์</label>
                                    <input id="zipcode" value={addressFields.zipcode} readOnly placeholder="อัตโนมัติ..."
                                        className="w-full bg-indigo-50/50 border-2 border-indigo-50 rounded-xl md:rounded-2xl px-4 py-3.5 md:px-5 md:py-4 text-sm md:text-base text-indigo-600 font-black tracking-widest focus:outline-none cursor-not-allowed placeholder:text-indigo-300" />
                                </div>
                            </div>

                            {/* รายละเอียดเพิ่มเติม */}
                            <div className="space-y-1.5 md:space-y-2">
                                <label htmlFor="address_detail" className="text-[11px] md:text-sm font-black text-slate-400 uppercase tracking-widest ml-1">รายละเอียด (บ้านเลขที่, ซอย, ถนน) <span className="text-red-500">*</span></label>
                                <textarea
                                    id="address_detail"
                                    value={addressFields.detail}
                                    onChange={(e) => handleAddressChange('detail', e.target.value)}
                                    rows={2}
                                    disabled={readOnly}
                                    required
                                    placeholder="เช่น 123/4 หมู่ 5 ซอยสุขุมวิท 1..."
                                    className="w-full text-sm md:text-lg font-medium text-slate-900 border-2 border-slate-100 focus:border-indigo-500 rounded-xl md:rounded-2xl p-3.5 md:p-4 outline-none bg-white resize-y placeholder:text-slate-300 transition-colors disabled:text-slate-500 disabled:bg-slate-50"
                                ></textarea>
                            </div>
                        </div>

                        <div className="space-y-3 md:space-y-4 border-t border-slate-100 pt-6">
                            <label htmlFor="canal_zone" className="text-sm md:text-base font-bold text-slate-500 uppercase flex items-center gap-2">พื้นที่คลองที่อาศัย <span className="text-red-500">*</span></label>
                            <div className="max-w-md">
                                <CustomSelect
                                    id="canal_zone"
                                    label="พื้นที่คลอง"
                                    placeholder="-- เลือกพื้นที่คลองเป้าหมาย --"
                                    value={formData.canal_zone}
                                    options={[
                                        { label: 'คลองบางเขน', value: 'บางเขน' },
                                        { label: 'คลองเปรมประชากร', value: 'เปรมประชากร' },
                                        { label: 'คลองลาดพร้าว', value: 'ลาดพร้าว' }
                                    ]}
                                    onChange={(val) => setFormData(prev => ({ ...prev, canal_zone: val }))}
                                    disabled={readOnly || !!searchParams.get('canal') || (isEditMode && !!initialData?.canal_zone)}
                                    required
                                    accentColor="indigo"
                                />
                            </div>
                        </div>

                        <div className="space-y-3 md:space-y-4">
                            <label className="text-sm md:text-base font-bold text-slate-500 uppercase">ระยะเวลาที่อาศัยอยู่ในชุมชน</label>
                            <div className="grid grid-cols-3 gap-2 sm:gap-4 lg:max-w-xl">
                                <div className="space-y-1 md:space-y-2">
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                                        <label htmlFor="residency_years" className="sr-only">ปีที่อาศัย</label>
                                        <input id="residency_years" name="residency_years" value={formData.residency_years} onChange={handleInputChange} type="number" disabled={readOnly} placeholder="0" min="0"
                                            className="w-full text-base md:text-xl font-medium text-slate-900 border-b-2 border-slate-200 focus:border-indigo-500 py-1.5 md:py-2 outline-none bg-transparent text-center transition-colors disabled:text-slate-500" />
                                        <span className="text-xs md:text-base font-bold text-slate-400 text-center">ปี</span>
                                    </div>
                                </div>
                                <div className="space-y-1 md:space-y-2">
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                                        <label htmlFor="residency_months" className="sr-only">เดือนที่อาศัย</label>
                                        <input id="residency_months" name="residency_months" value={formData.residency_months} onChange={handleInputChange} type="number" disabled={readOnly} placeholder="0" min="0" max="11"
                                            className="w-full text-base md:text-xl font-medium text-slate-900 border-b-2 border-slate-200 focus:border-indigo-500 py-1.5 md:py-2 outline-none bg-transparent text-center transition-colors disabled:text-slate-500" />
                                        <span className="text-xs md:text-base font-bold text-slate-400 text-center">เดือน</span>
                                    </div>
                                </div>
                                <div className="space-y-1 md:space-y-2">
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                                        <label htmlFor="residency_days" className="sr-only">วันที่อาศัย</label>
                                        <input id="residency_days" name="residency_days" value={formData.residency_days} onChange={handleInputChange} type="number" disabled={readOnly} placeholder="0" min="0" max="31"
                                            className="w-full text-base md:text-xl font-medium text-slate-900 border-b-2 border-slate-200 focus:border-indigo-500 py-1.5 md:py-2 outline-none bg-transparent text-center transition-colors disabled:text-slate-500" />
                                        <span className="text-xs md:text-base font-bold text-slate-400 text-center">วัน</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 pt-6 border-t border-slate-100">
                            <div className="space-y-1.5 md:space-y-2">
                                <label htmlFor="phone" className="text-sm md:text-base font-medium text-slate-900 uppercase flex items-center gap-2">เบอร์โทรศัพท์ <span className="text-red-500">*</span></label>
                                <input id="phone" name="phone" value={formData.phone} onChange={handleInputChange} type="tel" disabled={readOnly} required placeholder="เช่น 08x-xxx-xxxx" autoComplete="tel"
                                    className="w-full text-base md:text-lg font-medium text-slate-900 border-b-2 border-slate-100 focus:border-indigo-500 py-2 outline-none bg-transparent placeholder:text-slate-300 transition-colors disabled:text-slate-500" />
                            </div>
                            <div className="space-y-1.5 md:space-y-2">
                                <label htmlFor="social_media" className="text-sm md:text-base font-medium text-slate-900 uppercase flex items-center gap-2">ช่องทางติดต่ออื่นๆ (โซเชียล)</label>
                                <input id="social_media" name="social_media" value={formData.social_media} onChange={handleInputChange} type="text" disabled={readOnly} placeholder="เช่น Facebook, Line ID..."
                                    className="w-full text-base md:text-lg font-medium text-slate-900 border-b-2 border-slate-100 focus:border-indigo-500 py-2 outline-none bg-transparent placeholder:text-slate-300 transition-colors disabled:text-slate-500" />
                            </div>
                        </div>
                    </div>
                </section>

                {/* ส่วนของพิกัดแผนที่ */}
                <section className="bg-white rounded-2xl md:rounded-3xl p-5 md:p-8 shadow-sm border border-slate-100">
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 md:mb-8 border-b border-slate-50 pb-6 md:pb-8 gap-5 md:gap-8">
                        <div className="flex items-center gap-3 md:gap-4">
                            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 flex-shrink-0 shadow-sm shadow-emerald-100">
                                <Icon icon="solar:map-point-hospital-bold-duotone" className="text-xl md:text-3xl" />
                            </div>
                            <div>
                                <h2 className="text-lg md:text-2xl font-black text-slate-800 leading-tight">พิกัดสถานที่</h2>
                                <p className="text-[11px] md:text-sm font-medium text-slate-400 mt-0.5">ระบุตำแหน่งที่ตั้งเพื่อความแม่นยำ</p>
                            </div>
                        </div>
                        <div className="flex flex-row gap-2 md:gap-4 w-full md:w-auto">
                            {!readOnly && (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => setShowMapPicker(true)}
                                        className="flex-1 md:flex-none flex items-center justify-center gap-1.5 md:gap-2 px-3 py-3 md:px-4 md:py-4 bg-amber-50 text-amber-700 rounded-xl md:rounded-2xl font-bold text-xs md:text-sm hover:bg-amber-100 transition-all active:scale-95 border border-amber-100/50 shadow-sm"
                                    >
                                        <Icon icon="solar:map-bold" className="text-lg md:text-xl" />
                                        <span className="hidden xs:inline">จากแผนที่</span>
                                        <span className="xs:hidden">แผนที่</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={getLocation}
                                        disabled={isGettingLocation}
                                        className="flex-[2] md:flex-none flex items-center justify-center gap-1.5 md:gap-2 px-3 py-3 md:px-4 md:py-4 bg-indigo-50 text-indigo-700 rounded-xl md:rounded-2xl font-bold text-xs md:text-sm hover:bg-indigo-100 transition-all disabled:opacity-50 active:scale-95 border border-indigo-100/50 shadow-sm"
                                    >
                                        <Icon icon={isGettingLocation ? 'solar:refresh-bold' : 'solar:gps-bold'} className={`text-lg md:text-xl ${isGettingLocation ? 'animate-spin' : ''}`} />
                                        {isGettingLocation ? 'กำลังดึง...' : 'ดึง GPS ปัจจุบัน'}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="w-full">
                        {formData.gps_lat ? (
                            <div className="bg-slate-50 rounded-2xl md:rounded-3xl p-5 md:p-8 border border-slate-200/60 shadow-inner relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-3 md:p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <Icon icon="solar:map-point-wave-bold-duotone" className="text-6xl md:text-8xl text-indigo-900" />
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-8 relative z-10">
                                    <div className="bg-white p-3 md:p-4 rounded-xl md:rounded-2xl border border-slate-100 shadow-sm">
                                        <div className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5 md:mb-1">LATITUDE</div>
                                        <div className="text-sm md:text-xl font-black text-indigo-600 font-mono tracking-tight truncate">{Number(formData.gps_lat).toFixed(6)}</div>
                                    </div>
                                    <div className="bg-white p-3 md:p-4 rounded-xl md:rounded-2xl border border-slate-100 shadow-sm">
                                        <div className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5 md:mb-1">LONGITUDE</div>
                                        <div className="text-sm md:text-xl font-black text-indigo-600 font-mono tracking-tight truncate">{Number(formData.gps_long).toFixed(6)}</div>
                                    </div>
                                    <div className="col-span-2 md:col-span-1 bg-white p-3 md:p-4 rounded-xl md:rounded-2xl border border-slate-100 shadow-sm flex flex-row md:flex-col justify-between md:justify-start items-center md:items-start">
                                        <div className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest md:mb-1">ALTITUDE</div>
                                        <div className="text-sm md:text-xl font-black text-slate-500 font-mono tracking-tight">{formData.gps_alt ? Number(formData.gps_alt).toFixed(2) : '0.00'} m</div>
                                    </div>
                                </div>

                                <div className="mt-5 md:mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10 border-t border-slate-200/50 pt-5 md:pt-8">
                                    <div className="flex items-center gap-1.5 md:gap-2 text-[10px] md:text-xs font-bold text-slate-400 italic">
                                        <Icon icon="solar:info-circle-bold" className="text-base md:text-lg text-amber-500" />
                                        ตำแหน่งที่บันทึกไว้
                                    </div>
                                    <a
                                        href={`https://www.google.com/maps?q=$${formData.gps_lat},${formData.gps_long}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 md:px-8 md:py-4 bg-white border border-slate-200 text-slate-700 rounded-xl font-black text-xs md:text-sm hover:border-indigo-200 hover:text-indigo-600 transition-all shadow-sm hover:shadow-md active:scale-95 group"
                                    >
                                        <Icon icon="logos:google-maps" className="text-lg md:text-xl" />
                                        เปิดดูบน Google Maps
                                        <Icon icon="solar:arrow-right-up-linear" className="text-base md:text-lg group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                    </a>
                                </div>
                            </div>
                        ) : (
                            <div className="py-12 md:py-20 flex flex-col items-center justify-center bg-slate-50 rounded-2xl md:rounded-3xl border-2 border-dashed border-slate-200">
                                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-slate-100 flex items-center justify-center mb-4 md:mb-6 animate-pulse">
                                    <Icon icon="solar:map-point-wave-bold-duotone" className="text-4xl md:text-5xl text-slate-300" />
                                </div>
                                <h4 className="text-base md:text-lg font-bold text-slate-700 mb-1.5 md:mb-2">ยังไม่มีข้อมูลพิกัด</h4>
                                <p className="text-slate-400 font-medium text-center px-4 md:px-8 max-w-sm text-xs md:text-base leading-relaxed">
                                    กรุณากดปุ่ม <span className="text-indigo-600 font-bold">"ดึง GPS ปัจจุบัน"</span><br className="hidden xs:block" /> หรือเลือกจากแผนที่ด้านบน
                                </p>
                            </div>
                        )}
                    </div>
                </section>

                <section className="bg-white rounded-2xl md:rounded-3xl p-5 md:p-8 shadow-sm border border-slate-100">
                    <div className="flex items-center gap-3 md:gap-4 mb-6 md:mb-8 border-b border-slate-50 pb-6 md:pb-8">
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 flex-shrink-0">
                            <Icon icon="solar:shield-check-bold" className="text-xl md:text-3xl" />
                        </div>
                        <div>
                            <h2 className="text-lg md:text-xl font-black text-slate-800">เอกสารยินยอม PDPA</h2>
                            <p className="text-[10px] md:text-sm text-slate-500 font-medium mt-0.5 md:mt-1">ภาพถ่ายแบบฟอร์มยินยอมให้เก็บข้อมูล (พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล)</p>
                        </div>
                    </div>

                    {consentDocUrl ? (
                        <div className="flex flex-col gap-6 md:gap-8">
                            <div className="bg-slate-50 border border-slate-200 rounded-xl md:rounded-2xl p-3 md:p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                <div className="flex items-center gap-3 md:gap-4 w-full sm:w-auto flex-1">
                                    <div className="w-12 h-12 md:w-16 md:h-16 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 shrink-0">
                                        <Icon icon="solar:file-check-bold" className="text-2xl md:text-3xl" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-slate-800 text-sm md:text-base">เอกสารที่แนบไว้</h4>
                                        <p className="text-[10px] md:text-xs text-slate-500 truncate mt-1">
                                            {pendingConsentFile ? pendingConsentFile.name : consentDocUrl.split('/').pop()}
                                        </p>
                                        {pendingConsentFile && (
                                            <span className="inline-block mt-1 px-2 py-0.5 bg-amber-100 text-amber-700 text-[9px] md:text-[10px] font-bold rounded-full">ยังไม่ได้บันทึกขึ้นระบบ</span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex gap-2 w-full sm:w-auto">
                                    {!pendingConsentFile && (
                                        <button type="button" onClick={() => handleDownload(consentDocUrl)} className="flex-1 sm:flex-none py-3 md:py-4 px-4 md:px-8 bg-white border border-slate-200 rounded-xl text-slate-700 hover:text-indigo-600 hover:border-indigo-300 transition-all shadow-sm font-bold text-xs md:text-sm flex items-center justify-center gap-2">
                                            <Icon icon="solar:download-bold" className="text-lg md:text-xl" /> ดาวน์โหลด
                                        </button>
                                    )}
                                    {!readOnly && (
                                        <button type="button" onClick={() => { setConsentDocUrl(''); setPendingConsentFile(null); }} className="py-3 md:py-4 px-4 text-red-500 bg-white border border-red-100 rounded-xl hover:bg-red-50 transition-all shadow-sm flex items-center justify-center flex-1 sm:flex-none">
                                            <Icon icon="solar:trash-bin-minimalistic-bold" className="text-lg md:text-xl" />
                                            <span className="sm:hidden text-xs font-bold ml-1">ลบไฟล์</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        !readOnly ? (
                            <label htmlFor="consent_upload" className={`flex flex-col items-center justify-center gap-3 md:gap-4 py-12 md:py-24 border-2 border-dashed rounded-2xl md:rounded-3xl cursor-pointer transition-all
                                    ${uploadingConsent ? 'border-slate-200 bg-slate-50 opacity-50 pointer-events-none' : 'border-amber-300 bg-amber-50/50 hover:bg-amber-100/50 hover:border-amber-400'}`}
                            >
                                <div className="w-14 h-14 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-white shadow-sm flex items-center justify-center">
                                    <Icon icon={uploadingConsent ? 'solar:refresh-bold' : 'solar:camera-add-bold-duotone'} className={`text-2xl md:text-3xl text-amber-500 ${uploadingConsent ? 'animate-spin' : ''}`} />
                                </div>
                                <div className="text-center px-4">
                                    <p className="text-base md:text-lg font-bold text-slate-700">{uploadingConsent ? 'กำลังเตรียมไฟล์...' : 'แตะเพื่อถ่ายรูป / แนบไฟล์ใบยินยอม'}</p>
                                    <p className="text-[11px] md:text-sm font-medium text-slate-400 mt-2 md:mt-3">รองรับไฟล์รูปภาพ (JPG, PNG) หรือ PDF</p>
                                </div>
                                <input id="consent_upload" type="file" className="hidden" accept="image/*,.pdf" onChange={handleFileChange} disabled={uploadingConsent} />
                            </label>
                        ) : (
                            <div className="py-12 md:py-16 bg-slate-50 border border-dashed border-slate-200 rounded-2xl md:rounded-3xl flex flex-col items-center justify-center text-slate-400">
                                <Icon icon="solar:file-not-found-bold-duotone" className="text-3xl md:text-4xl mb-3 md:mb-4" />
                                <p className="font-medium text-xs md:text-sm">ไม่มีไฟล์เอกสารแนบ</p>
                            </div>
                        )
                    )}
                </section>

                {!readOnly && (
                    <div className="fixed sm:static bottom-0 left-0 right-0 p-4 sm:p-0 bg-white/95 sm:bg-transparent backdrop-blur-md sm:backdrop-blur-none border-t sm:border-0 border-slate-200 z-40 pb-[max(1rem,env(safe-area-inset-bottom))] sm:pb-0 flex justify-end mt-8 shadow-[0_-10px_40px_rgba(0,0,0,0.08)] sm:shadow-none">
                        <button type="submit" disabled={loading}
                            className="bg-gradient-to-r from-slate-800 to-slate-900 text-white px-6 md:px-8 py-4 md:py-4 rounded-xl md:rounded-2xl text-base md:text-lg font-bold hover:from-black hover:to-black md:hover:scale-[1.02] transition-all shadow-xl shadow-slate-900/20 flex items-center justify-center gap-2 md:gap-3 disabled:opacity-50 w-full sm:w-auto active:scale-[0.98]">
                            {loading ? (
                                <>
                                    <Icon icon="solar:refresh-bold" className="animate-spin text-xl md:text-2xl" />
                                    <span className="tracking-wide">กำลังบันทึกข้อมูล...</span>
                                </>
                            ) : (
                                <>
                                    {isEditMode ? 'บันทึกการแก้ไข' : 'บันทึกข้อมูล (Save & Next)'}
                                    <Icon icon="solar:arrow-right-linear" className="text-xl md:text-2xl" />
                                </>
                            )}
                        </button>
                    </div>
                )}
            </form>

            {/* My Informants Side Drawer */}
            {
                showMyInformants && (
                    <div className="fixed inset-0 z-50 flex justify-end">
                        {/* Backdrop */}
                        <div
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300"
                            onClick={() => setShowMyInformants(false)}
                        />

                        {/* Drawer Content */}
                        <div className="relative w-full sm:w-[400px] md:max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-500 ease-out">
                            {/* Header */}
                            <div className="p-5 md:p-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                                        <Icon icon="solar:clipboard-list-bold-duotone" className="text-xl" />
                                    </div>
                                    <div className="min-w-0">
                                        <h2 className="text-base md:text-lg font-bold text-slate-800 leading-tight truncate">
                                            {userRole === 'admin' ? 'รายชื่อทั้งหมด' : 'รายชื่อผู้ให้ข้อมูลของฉัน'}
                                        </h2>
                                        <p className="text-[10px] md:text-xs text-slate-500 font-medium mt-0.5 truncate">
                                            {userRole === 'admin' ? 'ข้อมูลทั้งหมดในระบบ' : 'แตะเพื่อเลือกรายชื่อเดิมและเพิ่มเมนู'}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowMyInformants(false)}
                                    className="w-10 h-10 flex items-center justify-center hover:bg-slate-100 rounded-xl transition-colors text-slate-400 active:scale-95"
                                >
                                    <Icon icon="solar:close-square-bold" className="text-2xl" />
                                </button>
                            </div>

                            {/* Search Bar in Drawer */}
                            <div className="p-4 bg-slate-50/50 border-b border-slate-100">
                                <div className="relative">
                                    <Icon icon="solar:magnifer-linear" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg" />
                                    <label htmlFor="drawer_search" className="sr-only">ค้นหาชื่อ หรือ รหัส</label>
                                    <input
                                        id="drawer_search"
                                        type="text"
                                        placeholder="ค้นหาชื่อ หรือ รหัส (INFO-XXX)..."
                                        value={myInformantsSearch}
                                        onChange={(e) => setMyInformantsSearch(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all outline-none font-medium"
                                    />
                                    {myInformantsSearch && (
                                        <button onClick={() => setMyInformantsSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1">
                                            <Icon icon="solar:close-circle-bold" className="text-base" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* List Content */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-safe">
                                {loadingMyInformants ? (
                                    [...Array(6)].map((_, i) => (
                                        <div key={i} className="h-[90px] bg-slate-50 rounded-xl animate-pulse border border-slate-100" />
                                    ))
                                ) : myInformants.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-20 text-slate-400 h-full">
                                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                            <Icon icon="solar:clipboard-remove-linear" className="text-4xl text-slate-300" />
                                        </div>
                                        <p className="font-bold text-slate-600">ไม่พบข้อมูล</p>
                                        <p className="text-xs mt-1">
                                            {userRole === 'admin' ? 'ยังไม่มีข้อมูลในระบบ' : 'คุณยังไม่ได้เพิ่มรายชื่อผู้ให้ข้อมูล'}
                                        </p>
                                    </div>
                                ) : (
                                    myInformants
                                        .filter(inf =>
                                            inf.full_name?.toLowerCase().includes(myInformantsSearch.toLowerCase()) ||
                                            inf.friendly_id?.toLowerCase().includes(myInformantsSearch.toLowerCase())
                                        )
                                        .map((inf) => (
                                            <div
                                                key={inf.info_id}
                                                className="bg-white border border-slate-200 rounded-xl p-3 md:p-4 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all group"
                                            >
                                                <div className="flex justify-between items-start mb-3">
                                                    <div className="min-w-0 pr-2">
                                                        <div className="font-bold text-slate-800 text-sm md:text-base group-hover:text-indigo-600 transition-colors truncate">{inf.full_name}</div>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <div className="text-[10px] md:text-xs text-indigo-600 font-bold bg-indigo-50 px-1.5 py-0.5 rounded flex items-center gap-1">
                                                                <Icon icon="solar:user-id-bold" /> {inf.friendly_id}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="text-[10px] text-slate-400 font-medium whitespace-nowrap bg-slate-50 px-1.5 py-0.5 rounded">
                                                        {new Date(inf.created_at).toLocaleDateString('th-TH', { month: 'short', day: 'numeric' })}
                                                    </div>
                                                </div>

                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => selectInformant(inf)}
                                                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold hover:bg-indigo-600 hover:text-white transition-all shadow-sm active:scale-95"
                                                    >
                                                        <Icon icon="solar:add-circle-bold" className="text-sm" />
                                                        เลือก & เพิ่มเมนู
                                                    </button>
                                                    <button
                                                        onClick={() => window.location.href = `/informants/${inf.info_id}`}
                                                        className="w-[42px] flex items-center justify-center bg-white text-slate-400 rounded-lg hover:bg-slate-100 transition-all border border-slate-200 active:scale-95 shadow-sm"
                                                        title="ดูรายละเอียด"
                                                    >
                                                        <Icon icon="solar:eye-bold" className="text-lg" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                )}
                                {/* Spacer for bottom safe area on mobile */}
                                <div className="h-4"></div>
                            </div>

                            {/* Footer Hint */}
                            <div className="p-3 border-t border-slate-100 bg-slate-50/80 backdrop-blur-sm pb-safe">
                                <p className="text-[10px] text-slate-400 text-center font-medium flex items-center justify-center gap-1">
                                    <Icon icon="solar:info-circle-linear" />
                                    แสดงข้อมูลที่คุณเป็นผู้บันทึกลงระบบเท่านั้น
                                </p>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    )
}