'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Icon } from '@iconify/react'
import ConfirmModal from '../ConfirmModal'

export default function SurveyPart2Client() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const infoId = searchParams.get('info_id')

    const [loading, setLoading] = useState(false)
    const [informantName, setInformantName] = useState('')
    const [showSuccess, setShowSuccess] = useState(false)

    // Confirm Modal State
    const [confirmConfig, setConfirmConfig] = useState<{
        isOpen: boolean
        title: string
        message: string
        type: 'info' | 'danger' | 'success' | 'warning'
        onConfirm: () => void
    }>({ isOpen: false, title: '', message: '', type: 'info', onConfirm: () => { } })

    const [formData, setFormData] = useState({
        menu_name: '',
        local_name: '',
        category: '', // 'อาหารคาว', 'อาหารหวาน', 'อาหารว่าง'
        story: '',
        nutrition: [] as string[],
        social_value: [] as string[],
        heritage_status: '',
        friendly_id: '' // For display only
    })

    // Fetch Informant Info to display name
    useEffect(() => {
        if (infoId) {
            fetch(`/api/survey/informant?id=${infoId}`)
                .then(res => res.json())
                .then(json => {
                    if (json.data) {
                        setInformantName(json.data.full_name)
                        // set friendly_id for display
                        setFormData(prev => ({ ...prev, friendly_id: json.data.friendly_id }))
                    }
                })
                .catch(err => console.error(err))
        }
    }, [infoId])

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleCheckboxChange = (field: 'nutrition' | 'social_value', value: string) => {
        setFormData(prev => {
            const current = prev[field]
            if (current.includes(value)) {
                return { ...prev, [field]: current.filter(item => item !== value) }
            } else {
                return { ...prev, [field]: [...current, value] }
            }
        })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!infoId) {
            setConfirmConfig({
                isOpen: true,
                title: 'ไม่พบข้อมูล',
                message: 'ไม่พบข้อมูลผู้ให้ข้อมูล (Info ID Missing)',
                type: 'danger',
                onConfirm: () => setConfirmConfig(prev => ({ ...prev, isOpen: false }))
            })
            return
        }

        // Validate Category
        if (!formData.category) {
            setConfirmConfig({
                isOpen: true,
                title: 'ข้อมูลไม่ครบถ้วน',
                message: 'กรุณาระบุ "ประเภทอาหาร"',
                type: 'warning',
                onConfirm: () => setConfirmConfig(prev => ({ ...prev, isOpen: false }))
            })
            return
        }

        setConfirmConfig({
            isOpen: true,
            title: 'ยืนยันการบันทึก',
            message: 'คุณต้องการบันทึกข้อมูลเมนูอาหาร\nใช่หรือไม่?',
            type: 'success',
            onConfirm: () => submitForm()
        })
    }

    const submitForm = async () => {
        setConfirmConfig(prev => ({ ...prev, isOpen: false }))
        setLoading(true)

        try {
            const payload = {
                ref_info_id: infoId,
                ...formData
            }

            const res = await fetch('/api/survey/menu', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            const json = await res.json()
            if (!res.ok) throw new Error(json.error || 'Failed to save')

            // Show Success Screen instead of Alert
            setShowSuccess(true)

        } catch (err) {
            console.error(err)
            setConfirmConfig({
                isOpen: true,
                title: 'เกิดข้อผิดพลาด',
                message: 'ไม่สามารถบันทึกข้อมูลได้\n' + String(err),
                type: 'danger',
                onConfirm: () => setConfirmConfig(prev => ({ ...prev, isOpen: false }))
            })
        } finally {
            setLoading(false)
        }
    }

    if (showSuccess) {
        return (
            <div className="max-w-xl mx-auto mt-20 p-8 sm:p-8 bg-white rounded-3xl shadow-2xl text-center border border-slate-100 mx-4 sm:mx-auto animate-in zoom-in-50 duration-300">
                <div className="w-28 h-28 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                    <Icon icon="solar:check-circle-bold" className="text-7xl" />
                </div>
                <h2 className="text-3xl font-black text-slate-800 mb-3">บันทึกข้อมูลสำเร็จ!</h2>
                <p className="text-lg text-slate-500 mb-10">ข้อมูลเมนูอาหารได้รับการบันทึกเรียบร้อยแล้ว</p>

                <div className="flex flex-col gap-4">
                    <button
                        onClick={() => router.push('/survey/part1')}
                        className="w-full py-4 bg-indigo-600 text-white rounded-2xl text-lg font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-3"
                    >
                        <Icon icon="solar:add-circle-bold" className="text-2xl" />
                        ตอบคำถามเพิ่มเติม (เพิ่มเมนู / คนอื่น)
                    </button>
                    <button
                        onClick={() => router.push('/survey')}
                        className="w-full py-4 bg-slate-100 text-slate-700 rounded-2xl text-lg font-bold hover:bg-slate-200 transition-all flex items-center justify-center gap-3"
                    >
                        <Icon icon="solar:home-2-bold" className="text-2xl" />
                        เสร็จสิ้น (กลับหน้าหลัก)
                    </button>
                </div>
            </div>
        )
    }

    // Options
    const CATEGORIES = ['อาหารคาว', 'อาหารหวาน', 'อาหารว่าง']
    const NUTRITION_OPTS = ['โปรตีน', 'คาร์โบไฮเดรต', 'ไขมัน', 'วิตามิน', 'เกลือแร่', 'ใยอาหาร']
    const SOCIAL_VAL_OPTS = ['งานบุญ/ศาสนา', 'งานมงคล', 'รับแขก', 'ของฝาก', 'บริโภคในครัวเรือน']

    if (!infoId) {
        return (
            <div className="text-center p-16">
                <Icon icon="solar:danger-circle-bold" className="mx-auto text-red-500 text-6xl mb-6 shadow-xl rounded-full" />
                <h2 className="text-2xl font-black text-slate-800 mb-2">ไม่พบ ID ผู้ให้ข้อมูล</h2>
                <p className="text-lg font-medium text-slate-500 mb-8">กรุณาเริ่มทำแบบสำรวจจากส่วนที่ ๑ ใหม่</p>
                <button
                    onClick={() => router.push('/survey/part1')}
                    className="bg-slate-900 text-white px-10 py-4 rounded-2xl text-lg font-bold shadow-xl hover:scale-105 transition-transform"
                >
                    กลับไปส่วนที่ ๑
                </button>
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-32">
            {/* Informant Header */}
            <div className="bg-indigo-50 border border-indigo-100 p-4 sm:p-8 rounded-2xl sm:rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between shadow-sm gap-4">
                <div>
                    <span className="text-xs sm:text-sm font-bold text-indigo-500 uppercase tracking-wide">ผู้ให้ข้อมูล (Informant)</span>
                    <div className="font-black text-indigo-900 text-xl sm:text-2xl mt-1">{informantName || 'Loading...'}</div>
                </div>
                <div className="bg-white px-4 py-2.5 rounded-xl text-sm font-bold font-mono text-slate-600 border border-indigo-100 shadow-sm text-center">
                    ID: {formData.friendly_id || infoId.substring(0, 8) + '...'}
                </div>
            </div>

            <ConfirmModal
                isOpen={confirmConfig.isOpen}
                title={confirmConfig.title}
                message={confirmConfig.message}
                type={confirmConfig.type}
                onConfirm={confirmConfig.onConfirm}
                onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
            />

            <form onSubmit={handleSubmit} className="space-y-8">
                <section className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 lg:p-8 shadow-sm border border-slate-100 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-orange-500 hidden sm:block"></div>
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-orange-500 sm:hidden"></div>

                    <div className="flex items-center gap-4 mb-8 border-b border-slate-50 pb-4">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-600 flex-shrink-0">
                            <Icon icon="solar:chef-hat-bold-duotone" className="text-3xl" />
                        </div>
                        <h2 className="text-xl sm:text-2xl font-black text-slate-800 leading-tight">ส่วนที่ ๒ ข้อมูลอัตลักษณ์เมนูอาหาร</h2>
                    </div>

                    <div className="space-y-8 sm:space-y-10">
                        {/* Menu Name */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-8">
                            <div className="space-y-2">
                                <label className="text-base font-bold text-slate-500 uppercase">ชื่อเมนูอาหาร (ทางการ)</label>
                                <input
                                    name="menu_name"
                                    value={formData.menu_name}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full text-lg font-medium text-slate-800 border-b-2 border-slate-100 focus:border-orange-500 py-2 outline-none bg-transparent placeholder:text-slate-300 transition-colors"
                                    placeholder="เช่น แกงเขียวหวาน"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-base font-bold text-slate-500 uppercase">ชื่อเรียกในท้องถิ่น</label>
                                <input
                                    name="local_name"
                                    value={formData.local_name}
                                    onChange={handleInputChange}
                                    className="w-full text-lg font-medium text-slate-800 border-b-2 border-slate-100 focus:border-orange-500 py-2 outline-none bg-transparent placeholder:text-slate-300 transition-colors"
                                    placeholder="ระบุชื่อท้องถิ่น (ถ้ามี)"
                                />
                            </div>
                        </div>

                        {/* Category */}
                        <div className="space-y-4">
                            <label className="text-base font-bold text-slate-500 uppercase">ประเภทอาหาร <span className="text-red-500">*</span></label>
                            <div className="flex flex-wrap gap-4 sm:gap-4 mt-2">
                                {CATEGORIES.map(cat => (
                                    <label key={cat} className={`flex items-center gap-2 px-4 py-4 sm:p-0 rounded-xl sm:rounded-none border-2 sm:border-0 cursor-pointer transition-all flex-1 sm:flex-none justify-center sm:justify-start ${formData.category === cat ? 'border-orange-500 bg-orange-50 sm:bg-transparent text-orange-600 font-bold' : 'border-slate-100 text-slate-600 font-medium'}`}>
                                        <input
                                            type="radio" name="category" value={cat}
                                            checked={formData.category === cat} onChange={handleInputChange}
                                            className="hidden"
                                        />
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 hidden sm:flex ${formData.category === cat ? 'border-orange-600 bg-orange-50' : 'border-slate-300 bg-slate-50'}`}>
                                            {formData.category === cat && <div className="w-3 h-3 bg-orange-600 rounded-full shadow-sm" />}
                                        </div>
                                        <span className="text-base text-center w-full sm:w-auto">{cat}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Story */}
                        <div className="space-y-2">
                            <label className="text-base font-bold text-slate-500 uppercase flex flex-col sm:flex-row sm:items-end justify-between gap-2">
                                เรื่องราวความเป็นมา (Story)
                                <span className="text-xs font-medium text-slate-400 normal-case bg-slate-50 px-2 py-1 rounded-md w-fit">Voice-to-Text เร็วๆ นี้</span>
                            </label>
                            <textarea
                                name="story"
                                value={formData.story}
                                onChange={handleInputChange}
                                rows={4}
                                className="w-full text-lg font-medium text-slate-800 border-2 border-slate-100 focus:border-orange-500 rounded-2xl p-4 sm:p-4 outline-none bg-slate-50 resize-y placeholder:text-slate-300 transition-colors"
                                placeholder="เล่าประวัติความเป็นมา..."
                            ></textarea>
                        </div>

                        {/* Nutrition & Social Value */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-8">
                            <div className="space-y-4">
                                <label className="text-base font-bold text-slate-500 uppercase">คุณค่าทางโภชนาการ</label>
                                <div className="space-y-4 bg-slate-50 p-4 rounded-2xl sm:bg-transparent sm:p-0">
                                    {NUTRITION_OPTS.map(opt => (
                                        <label key={opt} className="flex items-center gap-4 cursor-pointer group w-full py-1 sm:py-0">
                                            <div className={`w-6 h-6 rounded flex items-center justify-center border-2 transition-colors flex-shrink-0 ${formData.nutrition.includes(opt) ? 'bg-orange-500 border-orange-500 shadow-sm' : 'border-slate-300 bg-white group-hover:border-orange-300'}`}>
                                                {formData.nutrition.includes(opt) && <Icon icon="solar:check-bold" className="text-white text-sm" />}
                                            </div>
                                            <input type="checkbox" className="hidden" onChange={() => handleCheckboxChange('nutrition', opt)} checked={formData.nutrition.includes(opt)} />
                                            <span className={`text-base font-medium transition-colors ${formData.nutrition.includes(opt) ? 'text-slate-800' : 'text-slate-600'}`}>{opt}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-4">
                                <label className="text-base font-bold text-slate-500 uppercase">คุณค่าทางสังคม/ความเชื่อ</label>
                                <div className="space-y-4 bg-slate-50 p-4 rounded-2xl sm:bg-transparent sm:p-0">
                                    {SOCIAL_VAL_OPTS.map(opt => (
                                        <label key={opt} className="flex items-center gap-4 cursor-pointer group w-full py-1 sm:py-0">
                                            <div className={`w-6 h-6 rounded flex items-center justify-center border-2 transition-colors flex-shrink-0 ${formData.social_value.includes(opt) ? 'bg-orange-500 border-orange-500 shadow-sm' : 'border-slate-300 bg-white group-hover:border-orange-300'}`}>
                                                {formData.social_value.includes(opt) && <Icon icon="solar:check-bold" className="text-white text-sm" />}
                                            </div>
                                            <input type="checkbox" className="hidden" onChange={() => handleCheckboxChange('social_value', opt)} checked={formData.social_value.includes(opt)} />
                                            <span className={`text-base font-medium transition-colors ${formData.social_value.includes(opt) ? 'text-slate-800' : 'text-slate-600'}`}>{opt}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Heritage Status */}
                        <div className="space-y-2">
                            <label className="text-base font-bold text-slate-500 uppercase">สถานะการขึ้นทะเบียนมรดกภูมิปัญญา</label>
                            <input
                                name="heritage_status"
                                value={formData.heritage_status}
                                onChange={handleInputChange}
                                className="w-full text-lg font-medium text-slate-800 border-b-2 border-slate-100 focus:border-orange-500 py-2 outline-none bg-transparent placeholder:text-slate-300 transition-colors"
                                placeholder="ระบุสถานะ (ถ้ามี)"
                            />
                        </div>
                    </div>

                    {/* Fixed Bottom for Mobile, Normal layout for Desktop */}
                    <div className="fixed sm:static bottom-0 left-0 right-0 p-4 sm:p-0 bg-white/95 sm:bg-transparent border-t sm:border-0 border-slate-200 z-40 pb-[max(1rem,env(safe-area-inset-bottom))] sm:pb-0 flex justify-end mt-12 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] sm:shadow-none">
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-gradient-to-r from-slate-800 to-slate-900 text-white px-8 sm:px-10 py-4 rounded-2xl text-lg font-bold hover:from-black hover:to-black hover:scale-[1.02] transition-all shadow-xl shadow-slate-900/20 flex items-center justify-center gap-3 disabled:opacity-50 w-full sm:w-auto"
                        >
                            {loading ? (
                                <>
                                    <Icon icon="solar:refresh-bold" className="animate-spin text-2xl" />
                                    กำลังบันทึก...
                                </>
                            ) : (
                                <>
                                    บันทึกข้อมูล (Save & Next)
                                    <Icon icon="solar:arrow-right-linear" className="text-2xl" />
                                </>
                            )}
                        </button>
                    </div>
                </section>
            </form>
        </div>
    )
}