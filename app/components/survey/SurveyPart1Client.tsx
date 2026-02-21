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
}

export default function SurveyPart1Client({ initialData, isEditMode = false, readOnly = false }: Props) {
    const router = useRouter()
    const searchParams = useSearchParams()

    const [loading, setLoading] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState<any[]>([])
    const [isGettingLocation, setIsGettingLocation] = useState(false)
    const [showMapPicker, setShowMapPicker] = useState(false)
    const [uploadingConsent, setUploadingConsent] = useState(false)
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
        phone: initialData?.phone || '',
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
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!searchQuery.trim()) return

        setLoading(true)
        try {
            const res = await fetch(`/api/survey/informant?search=${encodeURIComponent(searchQuery)}`)
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

            const formDataUpload = new FormData()
            formDataUpload.append('file', fileToUpload)
            formDataUpload.append('folder', 'pdpa')

            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formDataUpload
            })

            const json = await res.json()
            if (!res.ok) throw new Error(json.error)

            setConsentDocUrl(json.url)
            setToastConfig({ isVisible: true, message: 'อัปโหลดเอกสารสำเร็จ', type: 'success' })
        } catch (err) {
            console.error(err)
            setToastConfig({ isVisible: true, message: 'อัปโหลดล้มเหลว: ' + String(err), type: 'error' })
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            // Merge address fields
            const { detail, subDistrict, district, province, zipcode } = addressFields
            const addressFull = `${detail}${detail ? ' ' : ''}แขวง${subDistrict} เขต${district} ${province} ${zipcode}`.trim()

            const payload = {
                ...formData,
                address_full: addressFull,
                consent_document_url: consentDocUrl
            }

            const method = isEditMode ? 'PATCH' : 'POST'
            const res = await fetch('/api/survey/informant', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(isEditMode ? { id: initialData.info_id, ...payload } : payload)
            })

            const json = await res.json()
            if (!res.ok) throw new Error(json.error)

            setToastConfig({ isVisible: true, message: 'บันทึกข้อมูลสำเร็จ', type: 'success' })

            if (!isEditMode) {
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
        <div className="max-w-4xl mx-auto w-full px-4 sm:px-8 lg:px-8 space-y-8 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-32">
            <ConfirmModal isOpen={confirmConfig.isOpen} title={confirmConfig.title} message={confirmConfig.message} type={confirmConfig.type} onConfirm={confirmConfig.onConfirm} onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))} />
            <Toast isVisible={toastConfig.isVisible} message={toastConfig.message} type={toastConfig.type} onCloseAction={() => setToastConfig(prev => ({ ...prev, isVisible: false }))} />
            {showMapPicker && (
                <MapPicker
                    initialLat={formData.gps_lat ? parseFloat(formData.gps_lat) : undefined}
                    initialLong={formData.gps_long ? parseFloat(formData.gps_long) : undefined}
                    onSelectAction={handleMapSelect}
                    onCloseAction={() => setShowMapPicker(false)}
                />
            )}

            {!isEditMode && (
                <>
                    <section className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 lg:p-8 shadow-sm border border-slate-100">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-8">
                            <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 flex-shrink-0">
                                <Icon icon="solar:magnifer-bold" className="text-2xl" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg sm:text-xl text-slate-800">มีข้อมูลบุคคลแล้ว?</h3>
                                <p className="text-sm font-medium text-slate-500">ค้นหารหัสเพื่อไปเพิ่มเมนูอาหารได้เลย</p>
                            </div>
                        </div>
                        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
                            <input type="text" placeholder="ระบุรหัส (เช่น INFO-001)..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                                className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 text-base font-medium focus:ring-2 focus:ring-amber-200 focus:border-amber-400 outline-none transition-all w-full" />
                            <button type="submit" disabled={loading} className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold text-base hover:bg-slate-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 w-full sm:w-auto">
                                {loading ? <Icon icon="solar:refresh-bold" className="animate-spin text-xl" /> : 'ค้นหา'}
                            </button>
                        </form>

                        {(searchResults.length > 0 || (searchQuery && !loading)) && (
                            <div className="space-y-4 mt-8">
                                {searchResults.length > 0 && <div className="text-sm font-bold text-slate-400 uppercase tracking-wide">ผลการค้นหา ({searchResults.length})</div>}
                                {searchResults.map((item: any) => (
                                    <div key={item.info_id} className="p-4 sm:p-4 border border-slate-200 rounded-2xl hover:bg-amber-50 hover:border-amber-200 cursor-pointer flex justify-between items-center transition-all group" onClick={() => handleSelectExisting(item)}>
                                        <div className="min-w-0 pr-4">
                                            <div className="font-bold text-lg text-slate-900 truncate">{item.full_name}</div>
                                            <div className="text-sm text-slate-500 flex flex-wrap items-center gap-2 mt-2">
                                                <span>{item.phone || '-'}</span>
                                                {item.friendly_id && (
                                                    <>
                                                        <span className="text-slate-300 hidden sm:inline">|</span>
                                                        <span className="text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-md text-xs sm:text-sm">{item.friendly_id}</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        <div className="w-10 h-10 rounded-full bg-white border border-slate-100 flex items-center justify-center group-hover:bg-amber-100 group-hover:text-amber-600 transition-colors flex-shrink-0">
                                            <Icon icon="solar:arrow-right-linear" className="text-xl" />
                                        </div>
                                    </div>
                                ))}
                                {searchResults.length === 0 && searchQuery && !loading && (
                                    <div className="text-center py-6 text-base text-slate-500 font-medium bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                        ไม่พบข้อมูลที่ตรงกัน
                                    </div>
                                )}
                            </div>
                        )}
                    </section>
                    <div className="flex items-center gap-4">
                        <div className="flex-1 h-px bg-slate-200" />
                        <span className="text-sm font-bold text-slate-400 uppercase tracking-widest text-center">หรือ กรอกข้อมูลใหม่</span>
                        <div className="flex-1 h-px bg-slate-200" />
                    </div>
                </>
            )}

            <form onSubmit={handleSubmit} className="space-y-8 sm:space-y-8">
                <section className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 lg:p-8 shadow-sm border border-slate-100">
                    <div className="flex items-center gap-4 sm:gap-4 mb-8 border-b border-slate-50 pb-4">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 flex-shrink-0">
                            <Icon icon="solar:user-id-bold-duotone" className="text-2xl sm:text-3xl" />
                        </div>
                        <h2 className="text-xl sm:text-2xl font-black text-slate-800 leading-tight">{isEditMode ? 'แก้ไขข้อมูลผู้ให้ข้อมูล' : 'ส่วนที่ ๑ ข้อมูลผู้ให้ข้อมูล'}</h2>
                    </div>

                    <div className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-8">
                            <div className="space-y-2">
                                <label className="text-base font-bold text-slate-500 uppercase flex items-center gap-2">ชื่อ-นามสกุล <span className="text-red-500">*</span></label>
                                <input name="full_name" value={formData.full_name} onChange={handleInputChange} type="text" required disabled={readOnly}
                                    className="w-full text-lg font-medium text-slate-800 border-b-2 border-slate-100 focus:border-indigo-500 py-2 outline-none bg-transparent placeholder:text-slate-300 transition-colors disabled:text-slate-500" placeholder="ระบุชื่อ-นามสกุล" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-base font-bold text-slate-500 uppercase">เพศ</label>
                                <div className="flex flex-wrap gap-4 sm:gap-4 mt-2">
                                    {['ชาย', 'หญิง', 'อื่นๆ'].map((g) => (
                                        <label key={g} className={`flex items-center gap-2 cursor-pointer transition-all ${formData.gender === g ? 'text-indigo-600 font-bold' : 'text-slate-600 font-medium'} ${readOnly ? 'pointer-events-none opacity-80' : ''}`}>
                                            <input type="radio" name="gender" value={g} checked={formData.gender === g} onChange={handleInputChange} disabled={readOnly} className="hidden" />
                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 flex-shrink-0 ${formData.gender === g ? 'border-indigo-600 bg-indigo-50' : 'border-slate-300 bg-slate-50'}`}>
                                                {formData.gender === g && <div className="w-3 h-3 bg-indigo-600 rounded-full shadow-sm" />}
                                            </div>
                                            <span className="text-base">{g}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 sm:gap-4">
                                <div className="space-y-2">
                                    <label className="text-base font-bold text-slate-500 uppercase">อายุ (ปี)</label>
                                    <input name="age" value={formData.age} onChange={handleInputChange} type="number" disabled={readOnly}
                                        className="w-full text-lg font-medium text-slate-800 border-b-2 border-slate-100 focus:border-indigo-500 py-2 outline-none bg-transparent placeholder:text-slate-300 transition-colors disabled:text-slate-500" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-base font-bold text-slate-500 uppercase">อาชีพ</label>
                                    <input name="occupation" value={formData.occupation} onChange={handleInputChange} type="text" disabled={readOnly}
                                        className="w-full text-lg font-medium text-slate-800 border-b-2 border-slate-100 focus:border-indigo-500 py-2 outline-none bg-transparent placeholder:text-slate-300 transition-colors disabled:text-slate-500" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-base font-bold text-slate-500 uppercase">รายได้เฉลี่ย (บาท/เดือน)</label>
                                <input name="income" value={formData.income} onChange={handleInputChange} type="number" disabled={readOnly}
                                    className="w-full text-lg font-medium text-slate-800 border-b-2 border-slate-100 focus:border-indigo-500 py-2 outline-none bg-transparent placeholder:text-slate-300 transition-colors disabled:text-slate-500" />
                            </div>
                        </div>

                        <div className="space-y-8">
                            <label className="text-base font-bold text-slate-500 uppercase">ที่อยู่/ชุมชน</label>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-4">
                                {/* จังหวัด */}
                                <div className="space-y-2">
                                    <label className="text-sm font-black text-slate-400 uppercase tracking-widest ml-1">จังหวัด</label>
                                    <input value={addressFields.province} readOnly
                                        className="w-full bg-slate-100 border-2 border-slate-100 rounded-2xl px-5 py-4 text-slate-500 font-bold focus:outline-none cursor-not-allowed" />
                                </div>

                                {/* เขต */}
                                <div className="space-y-2">
                                    <label className="text-sm font-black text-slate-400 uppercase tracking-widest ml-1">เขต <span className="text-red-500">*</span></label>
                                    <div className="relative group">
                                        <select
                                            value={addressFields.district}
                                            onChange={(e) => handleAddressChange('district', e.target.value)}
                                            disabled={readOnly || districts.length === 0}
                                            required
                                            className="w-full bg-slate-50 border-2 border-slate-100 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50/50 rounded-2xl px-5 py-4 text-slate-800 font-bold outline-none transition-all duration-300 appearance-none cursor-pointer hover:bg-white hover:border-indigo-200 hover:shadow-sm disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed peer"
                                        >
                                            <option value="" disabled className="text-slate-400">-- เลือกเขต --</option>
                                            {districts.map((d, idx) => (
                                                <option key={idx} value={d.name} className="text-slate-800 font-medium">{d.name}</option>
                                            ))}
                                        </select>
                                        {/* ไอคอนลูกศร ที่จะตอบสนองต่อ Select (peer) */}
                                        <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 peer-focus:text-indigo-600 peer-hover:text-indigo-500 transition-all duration-300 peer-focus:-rotate-180 peer-disabled:text-slate-300">
                                            <Icon icon="solar:alt-arrow-down-bold-duotone" className="text-2xl" />
                                        </div>
                                    </div>
                                </div>

                                {/* แขวง */}
                                <div className="space-y-2">
                                    <label className="text-sm font-black text-slate-400 uppercase tracking-widest ml-1">แขวง <span className="text-red-500">*</span></label>
                                    <div className="relative group">
                                        <select
                                            value={addressFields.subDistrict}
                                            onChange={(e) => handleAddressChange('subDistrict', e.target.value)}
                                            disabled={readOnly || !addressFields.district}
                                            required
                                            className="w-full bg-slate-50 border-2 border-slate-100 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50/50 rounded-2xl px-5 py-4 text-slate-800 font-bold outline-none transition-all duration-300 appearance-none cursor-pointer hover:bg-white hover:border-indigo-200 hover:shadow-sm disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed peer"
                                        >
                                            <option value="" disabled className="text-slate-400">-- เลือกแขวง --</option>
                                            {subDistricts.map((s, idx) => (
                                                <option key={idx} value={s.name} className="text-slate-800 font-medium">{s.name}</option>
                                            ))}
                                        </select>
                                        {/* ไอคอนลูกศร ที่จะตอบสนองต่อ Select (peer) */}
                                        <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 peer-focus:text-indigo-600 peer-hover:text-indigo-500 transition-all duration-300 peer-focus:-rotate-180 peer-disabled:text-slate-300">
                                            <Icon icon="solar:alt-arrow-down-bold-duotone" className="text-2xl" />
                                        </div>
                                    </div>
                                </div>

                                {/* รหัสไปรษณีย์ */}
                                <div className="space-y-2">
                                    <label className="text-sm font-black text-slate-400 uppercase tracking-widest ml-1">รหัสไปรษณีย์</label>
                                    <input value={addressFields.zipcode} readOnly placeholder="อัตโนมัติ..."
                                        className="w-full bg-indigo-50/50 border-2 border-indigo-50 rounded-2xl px-5 py-4 text-indigo-600 font-black tracking-widest focus:outline-none cursor-not-allowed placeholder:text-indigo-300" />
                                </div>
                            </div>

                            {/* รายละเอียดเพิ่มเติม */}
                            <div className="space-y-2">
                                <label className="text-sm font-black text-slate-400 uppercase tracking-widest ml-1">รายละเอียด (บ้านเลขที่, ซอย, ถนน) <span className="text-red-500">*</span></label>
                                <textarea
                                    value={addressFields.detail}
                                    onChange={(e) => handleAddressChange('detail', e.target.value)}
                                    rows={2}
                                    disabled={readOnly}
                                    required
                                    placeholder="เช่น 123/4 หมู่ 5 ซอยสุขุมวิท 1..."
                                    className="w-full text-lg font-medium text-slate-800 border-2 border-slate-100 focus:border-indigo-500 rounded-2xl p-4 outline-none bg-slate-50 resize-y placeholder:text-slate-300 transition-colors disabled:text-slate-500 disabled:bg-slate-100"
                                ></textarea>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-base font-bold text-slate-500 uppercase">พื้นที่คลอง</label>
                            <div className="text-lg font-bold text-indigo-700 bg-indigo-50 px-4 py-4 rounded-2xl border border-indigo-100 w-full sm:w-fit flex items-center justify-center sm:justify-start gap-2">
                                <Icon icon="solar:map-point-bold-duotone" className="text-2xl text-indigo-500" />
                                {formData.canal_zone || 'ไม่ระบุ'}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="text-base font-bold text-slate-500 uppercase">ระยะเวลาอาศัยอยู่ในชุมชน</label>
                            <div className="grid grid-cols-2 gap-4 sm:gap-4 lg:max-w-md">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <input name="residency_years" value={formData.residency_years} onChange={handleInputChange} type="number" disabled={readOnly} placeholder="0"
                                            className="w-full text-xl font-bold text-slate-800 border-b-2 border-slate-200 focus:border-indigo-500 py-2 outline-none bg-transparent text-center transition-colors disabled:text-slate-500" />
                                        <span className="text-base font-bold text-slate-400">ปี</span>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <input name="residency_months" value={formData.residency_months} onChange={handleInputChange} type="number" disabled={readOnly} placeholder="0"
                                            className="w-full text-xl font-bold text-slate-800 border-b-2 border-slate-200 focus:border-indigo-500 py-2 outline-none bg-transparent text-center transition-colors disabled:text-slate-500" />
                                        <span className="text-base font-bold text-slate-400">เดือน</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-8">
                            <div className="space-y-2">
                                <label className="text-base font-bold text-slate-500 uppercase">เบอร์โทรศัพท์</label>
                                <input name="phone" value={formData.phone} onChange={handleInputChange} type="tel" disabled={readOnly}
                                    className="w-full text-lg font-medium text-slate-800 border-b-2 border-slate-100 focus:border-indigo-500 py-2 outline-none bg-transparent placeholder:text-slate-300 transition-colors disabled:text-slate-500" placeholder="08x-xxx-xxxx" />
                            </div>
                        </div>
                    </div>
                </section>

                <section className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 lg:p-8 shadow-sm border border-slate-100">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 border-b border-slate-50 pb-8 gap-8">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 flex-shrink-0 shadow-sm shadow-emerald-100">
                                <Icon icon="solar:map-point-hospital-bold-duotone" className="text-2xl sm:text-3xl" />
                            </div>
                            <div>
                                <h2 className="text-xl sm:text-2xl font-black text-slate-800 leading-tight">พิกัดสถานที่</h2>
                                <p className="text-xs sm:text-sm font-medium text-slate-400">ระบุตำแหน่งที่ตั้งเพื่อความแม่นยำ</p>
                            </div>
                        </div>
                        <div className="flex flex-col xs:flex-row gap-4">
                            {!readOnly && (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => setShowMapPicker(true)}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-4 bg-amber-50 text-amber-700 rounded-2xl font-bold text-sm hover:bg-amber-100 transition-all active:scale-95 border border-amber-100/50 shadow-sm"
                                    >
                                        <Icon icon="solar:map-bold" className="text-xl" />
                                        จากแผนที่
                                    </button>
                                    <button
                                        type="button"
                                        onClick={getLocation}
                                        disabled={isGettingLocation}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-4 bg-indigo-50 text-indigo-700 rounded-2xl font-bold text-sm hover:bg-indigo-100 transition-all disabled:opacity-50 active:scale-95 border border-indigo-100/50 shadow-sm"
                                    >
                                        <Icon icon={isGettingLocation ? 'solar:refresh-bold' : 'solar:gps-bold'} className={`text-xl ${isGettingLocation ? 'animate-spin' : ''}`} />
                                        {isGettingLocation ? 'กำลังดึง...' : 'GPS ปัจจุบัน'}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="w-full">
                        {formData.gps_lat ? (
                            <div className="bg-slate-50 rounded-3xl p-8 sm:p-8 border border-slate-200/60 shadow-inner relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <Icon icon="solar:map-point-wave-bold-duotone" className="text-7xl sm:text-8xl text-indigo-900" />
                                </div>

                                <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-8 relative z-10">
                                    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">LATITUDE</div>
                                        <div className="text-lg sm:text-xl font-black text-indigo-600 font-mono tracking-tight">{formData.gps_lat}</div>
                                    </div>
                                    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">LONGITUDE</div>
                                        <div className="text-lg sm:text-xl font-black text-indigo-600 font-mono tracking-tight">{formData.gps_long}</div>
                                    </div>
                                    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm xs:col-span-2 md:col-span-1">
                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">ALTITUDE</div>
                                        <div className="text-lg sm:text-xl font-black text-slate-500 font-mono tracking-tight">{formData.gps_alt || '0.00'}</div>
                                    </div>
                                </div>

                                <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10 border-t border-slate-200/50 pt-8">
                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400 italic">
                                        <Icon icon="solar:info-circle-bold" className="text-lg text-amber-500" />
                                        ตำแหน่งที่บันทึกไว้ ณ ขณะนี้
                                    </div>
                                    <a
                                        href={`https://www.google.com/maps?q=${formData.gps_lat},${formData.gps_long}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-white border border-slate-200 text-slate-700 rounded-xl font-black text-sm hover:border-indigo-200 hover:text-indigo-600 transition-all shadow-sm hover:shadow-md active:scale-95 group"
                                    >
                                        <Icon icon="logos:google-maps" className="text-xl" />
                                        ดูบน Google Maps
                                        <Icon icon="solar:arrow-right-up-linear" className="text-lg group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                    </a>
                                </div>
                            </div>
                        ) : (
                            <div className="py-16 sm:py-20 flex flex-col items-center justify-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                                <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-6 animate-pulse">
                                    <Icon icon="solar:map-point-wave-bold-duotone" className="text-5xl text-slate-300" />
                                </div>
                                <h4 className="text-lg font-bold text-slate-700 mb-2">ยังไม่มีข้อมูลพิกัด</h4>
                                <p className="text-slate-400 font-medium text-center px-8 max-w-sm text-sm sm:text-base leading-relaxed">
                                    กรุณาเลือก <span className="text-amber-600 font-bold">"จากแผนที่"</span> หรือ
                                    <br className="hidden sm:block" />
                                    กดปุ่ม <span className="text-indigo-600 font-bold">"GPS ปัจจุบัน"</span> เพื่อดึงพิกัด
                                </p>
                            </div>
                        )}
                    </div>
                </section>

                <section className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 lg:p-8 shadow-sm border border-slate-100">
                    <div className="flex items-center gap-4 mb-8 border-b border-slate-50 pb-8">
                        <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 flex-shrink-0">
                            <Icon icon="solar:shield-check-bold" className="text-2xl sm:text-3xl" />
                        </div>
                        <div>
                            <h2 className="text-lg sm:text-xl font-black text-slate-800">เอกสารยินยอม PDPA</h2>
                            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-2">แบบยินยอมตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562</p>
                        </div>
                    </div>

                    {consentDocUrl ? (
                        <div className="flex flex-col gap-8">
                            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-4">
                                <div className="flex items-center gap-4 w-full sm:w-auto flex-1">
                                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 shrink-0">
                                        <Icon icon="solar:file-check-bold" className="text-2xl sm:text-3xl" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-slate-800 text-sm sm:text-base">เอกสารยินยอมที่บันทึกไว้</h4>
                                        <p className="text-xs sm:text-sm text-slate-500 truncate mt-2">{consentDocUrl.split('/').pop()}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2 w-full sm:w-auto">
                                    <button type="button" onClick={() => handleDownload(consentDocUrl)} className="flex-1 sm:flex-none py-4 px-8 bg-white border border-slate-200 rounded-xl text-slate-700 hover:text-indigo-600 hover:border-indigo-300 transition-all shadow-sm font-bold text-sm flex items-center justify-center gap-2">
                                        <Icon icon="solar:download-bold" className="text-xl" /> ดาวน์โหลด
                                    </button>
                                    {!readOnly && (
                                        <button type="button" onClick={() => setConsentDocUrl('')} className="py-4 px-4 text-red-500 bg-white border border-red-100 rounded-xl hover:bg-red-50 transition-all shadow-sm">
                                            <Icon icon="solar:trash-bin-minimalistic-bold" className="text-xl" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        !readOnly ? (
                            <label className={`flex flex-col items-center justify-center gap-4 py-16 sm:py-32 border-2 border-dashed rounded-3xl cursor-pointer transition-all
                                    ${uploadingConsent ? 'border-slate-200 bg-slate-50 opacity-50 pointer-events-none' : 'border-amber-300 bg-amber-50/50 hover:bg-amber-100/50 hover:border-amber-400'}`}>
                                <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center">
                                    <Icon icon={uploadingConsent ? 'solar:refresh-bold' : 'solar:cloud-upload-bold-duotone'} className={`text-3xl text-amber-500 ${uploadingConsent ? 'animate-spin' : ''}`} />
                                </div>
                                <div className="text-center px-4">
                                    <p className="text-lg font-bold text-slate-700">{uploadingConsent ? 'กำลังอัปโหลด...' : 'แตะเพื่ออัปโหลดเอกสาร'}</p>
                                    <p className="text-sm font-medium text-slate-400 mt-4">รองรับ PDF, JPG, PNG หรือ WebP</p>
                                </div>
                                <input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" className="hidden" onChange={handleFileChange} />
                            </label>
                        ) : (
                            <div className="py-16 bg-slate-50 border border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center text-slate-400">
                                <Icon icon="solar:file-not-found-bold-duotone" className="text-4xl mb-4" />
                                <p className="font-medium text-sm">ไม่มีไฟล์เอกสาร</p>
                            </div>
                        )
                    )}
                </section>

                {!readOnly && (
                    <div className="fixed sm:static bottom-0 left-0 right-0 p-4 sm:p-0 bg-white/95 sm:bg-transparent border-t sm:border-0 border-slate-200 z-40 pb-[max(1rem,env(safe-area-inset-bottom))] sm:pb-0 flex justify-end mt-8 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] sm:shadow-none">
                        <button type="submit" disabled={loading}
                            className="bg-gradient-to-r from-slate-800 to-slate-900 text-white px-8 sm:px-8 py-4 rounded-2xl text-lg font-bold hover:from-black hover:to-black hover:scale-[1.02] transition-all shadow-xl shadow-slate-900/20 flex items-center justify-center gap-3 disabled:opacity-50 w-full sm:w-auto">
                            {loading ? <><Icon icon="solar:refresh-bold" className="animate-spin text-2xl" /> กำลังบันทึก...</> : <>{isEditMode ? 'บันทึกการแก้ไข' : 'บันทึกข้อมูล (Save & Next)'} <Icon icon="solar:arrow-right-linear" className="text-2xl" /></>}
                        </button>
                    </div>
                )}
            </form>
        </div>
    )
}