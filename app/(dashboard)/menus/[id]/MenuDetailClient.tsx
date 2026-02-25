'use client'
import { useState, useEffect } from 'react'
import { Icon } from '@iconify/react'
import { useRouter } from 'next/navigation'
import ConfirmModal from '@/app/components/ConfirmModal'
import Toast from '@/app/components/Toast'

interface Props {
    menu: any // Using any for speed
    userRole: string
    userId: string
}

export default function MenuDetailClient({ menu, userRole, userId }: Props) {
    const router = useRouter()

    // UI Feedback
    const [toast, setToast] = useState<{ show: boolean, msg: string, type: 'success' | 'error' | 'info' }>({ show: false, msg: '', type: 'success' })
    const [confirmConfig, setConfirmConfig] = useState<{
        isOpen: boolean; title: string; message: string; type: 'info' | 'danger' | 'success' | 'warning';
        onConfirm: () => void
    }>({ isOpen: false, title: '', message: '', type: 'info', onConfirm: () => { } })

    if (!menu) return <div className="p-8 text-center">ไม่พบข้อมูลเมนู</div>

    // Local state for ingredients to allow editing notes
    const [localIngredients, setLocalIngredients] = useState<any[]>(menu.menu_ingredients || [])
    const [isSavingNotes, setIsSavingNotes] = useState(false)

    useEffect(() => {
        setLocalIngredients(menu.menu_ingredients || [])
    }, [menu.menu_ingredients])

    const updateIngredientNote = (index: number, newNote: string) => {
        const next = [...localIngredients]
        next[index] = { ...next[index], note: newNote }
        setLocalIngredients(next)
    }

    const handleSaveNotes = async () => {
        setIsSavingNotes(true)
        try {
            // Prepare ingredients the same way the survey form does
            const ingredientsToSave = localIngredients.map(ing => ({
                ref_ing_id: ing.ref_ing_id,
                name: ing.master_ingredients?.ing_name || ing.name,
                ingredient_type: ing.ingredient_type,
                is_main_ingredient: ing.is_main_ingredient,
                quantity: ing.quantity,
                unit: ing.unit,
                note: ing.note
            }))

            const res = await fetch(`/api/survey/ingredient`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ref_menu_id: menu.menu_id, ingredients: ingredientsToSave })
            })

            if (res.ok) {
                setToast({ show: true, msg: 'อัปเดตหมายเหตุสำเร็จ', type: 'success' })
                router.refresh()
            } else {
                setToast({ show: true, msg: 'ไม่สามารถบันทึกหมายเหตุได้', type: 'error' })
            }
        } catch (err) {
            setToast({ show: true, msg: 'เกิดข้อผิดพลาดในการบันทึก', type: 'error' })
        } finally {
            setIsSavingNotes(false)
        }
    }

    const canEdit = userRole === 'admin' || (userRole === 'user' && menu.ref_sv_code === userId)

    const handleDelete = () => {
        setConfirmConfig({
            isOpen: true,
            title: 'ยืนยันการลบ',
            message: `คุณต้องการลบเมนู "${menu.menu_name}" ใช่หรือไม่?\nการกระทำนี้ไม่สามารถย้อนกลับได้`,
            type: 'danger',
            onConfirm: async () => {
                setConfirmConfig(prev => ({ ...prev, isOpen: false }))
                try {
                    const res = await fetch(`/api/food?id=${menu.menu_id}`, { method: 'DELETE' })
                    if (res.ok) {
                        setToast({ show: true, msg: 'ลบข้อมูลสำเร็จ กำลังกลับสู่หน้ารายการ...', type: 'success' })
                        setTimeout(() => router.push('/menus'), 1500)
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

    const handleStatusToggle = async (targetStatus: string) => {
        const currentStatus = menu.selection_status || []
        let newStatus = [...currentStatus]
        if (newStatus.includes(targetStatus)) {
            newStatus = newStatus.filter((s: string) => s !== targetStatus)
        } else {
            newStatus.push(targetStatus)
        }

        // Optimistic update (requires a way to update parent state or refresh, but for now we just toggle local visual or reload)
        // Since 'menu' is a prop, we can't easily validly mutate it. 
        // Better to use state for selection_status.

        try {
            const res = await fetch(`/api/food`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ menu_id: menu.menu_id, selection_status: newStatus })
            })
            if (res.ok) {
                setToast({ show: true, msg: 'อัปเดตสถานะสำเร็จ', type: 'success' })
                router.refresh() // Refresh to update server-side data
            } else {
                setToast({ show: true, msg: 'อัปเดตสถานะไม่สำเร็จ', type: 'error' })
            }
        } catch (err) {
            setToast({ show: true, msg: 'เกิดข้อผิดพลาด', type: 'error' })
        }
    }


    const Section = ({ title, icon, children }: { title: string, icon: string, children: React.ReactNode }) => (
        <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-slate-100 mb-6">
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-50">
                <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                    <Icon icon={icon} className="text-xl" />
                </div>
                <h2 className="text-lg font-bold text-slate-800">{title}</h2>
            </div>
            <div className="space-y-4">
                {children}
            </div>
        </div>
    )

    const Field = ({ label, value, full = false }: { label: string, value: any, full?: boolean }) => (
        <div className={`${full ? 'col-span-full' : ''}`}>
            <label className="text-xs font-bold text-slate-400 uppercase block mb-1">{label}</label>
            <div className="text-slate-700 font-medium">{value || '-'}</div>
        </div>
    )

    const Badge = ({ text, variant = 'slate' }: { text: string, variant?: 'slate' | 'indigo' | 'amber' | 'rose' }) => {
        const colors = {
            slate: 'bg-slate-50 text-slate-500 border-slate-100',
            indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
            amber: 'bg-amber-50 text-amber-600 border-amber-100',
            rose: 'bg-rose-50 text-rose-600 border-rose-100'
        }
        return (
            <span className={`inline-block px-2.5 py-1 ${colors[variant]} border rounded-lg text-sm font-bold mr-1.5 mb-1.5`}>
                {text}
            </span>
        )
    }

    return (
        <div className="max-w-5xl mx-auto pb-20">
            <ConfirmModal {...confirmConfig} onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))} />
            <Toast isVisible={toast.show} message={toast.msg} type={toast.type} onCloseAction={() => setToast(prev => ({ ...prev, show: false }))} />

            {/* Header & Actions */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6 px-2 md:px-0">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold transition-colors"
                >
                    <Icon icon="solar:arrow-left-linear" /> กลับหน้ารายการ
                </button>

                <div className="flex items-center gap-2">
                    {/* User Actions */}
                    {canEdit && (
                        <>
                            <button
                                onClick={() => router.push(`/survey/part2?menu_id=${menu.menu_id}`)} // Assuming this link works for editing
                                className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl font-bold hover:bg-indigo-100 transition-colors flex items-center gap-2"
                            >
                                <Icon icon="solar:pen-new-square-bold" /> แก้ไขเมนู
                            </button>
                            <button
                                onClick={handleDelete}
                                className="px-4 py-2 bg-rose-50 text-rose-600 rounded-xl font-bold hover:bg-rose-100 transition-colors flex items-center gap-2"
                            >
                                <Icon icon="solar:trash-bin-trash-bold" /> ลบเมนู
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Title Card */}
            <div className="bg-white rounded-2xl p-4 md:p-8 shadow-sm border border-slate-100 mb-8 flex flex-col md:flex-row gap-6 md:gap-8 items-start">
                <div className="w-full md:w-1/3 aspect-square rounded-2xl bg-slate-100 overflow-hidden shadow-inner flex-shrink-0 relative group">
                    {/* Main Image Thumbnail */}
                    {menu.menu_photos && menu.menu_photos.length > 0 && menu.menu_photos[0].photo_url ? (
                        <img
                            src={menu.menu_photos[0].photo_url}
                            alt={menu.menu_name}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 gap-2">
                            <Icon icon="solar:gallery-wide-linear" className="text-5xl" />
                            <span className="text-xs font-bold uppercase tracking-widest opacity-50">No Image</span>
                        </div>
                    )}
                </div>
                <div className="flex-1 space-y-4 w-full">
                    <div>
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className={`px-2 py-1 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-600`}>{menu.category}</span>
                            <span className={`px-2 py-1 rounded-lg text-xs font-bold bg-teal-50 text-teal-600`}>{menu.informants?.canal_zone}</span>
                        </div>
                        <h1 className="text-2xl md:text-3xl font-bold text-slate-800 break-words">{menu.menu_name}</h1>
                        <div className="flex flex-col gap-1 mt-1">
                            {menu.local_name && <p className="text-slate-500 text-lg font-medium flex items-center gap-2"><Icon icon="solar:map-point-wave-bold" className="text-slate-400" /> {menu.local_name}</p>}
                            {menu.other_name && <p className="text-slate-400 text-base italic flex items-center gap-2"><Icon icon="solar:global-bold" className="text-slate-300" /> {menu.other_name}</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 py-4 border-t border-slate-50">
                        <Field label="ผู้ให้ข้อมูล" value={menu.informants?.full_name} />
                        <Field label="ชุมชน" value={menu.informants?.address_full} />
                        <Field label="ผู้เก็บข้อมูล" value={menu.users?.collector_name || '-'} />
                        <Field label="ปริมาณที่เสิร์ฟ" value={menu.serving_size === 'อื่นๆ' ? menu.other_serving_size : menu.serving_size} />
                        <Field label="สถานะคัดเลือก" value={menu.selection_status?.length ? menu.selection_status.join(', ') + ' เมนู' : 'รอการคัดเลือก'} />

                        {(userRole === 'admin' || userRole === 'director') && (
                            <div className="col-span-full pt-4 mt-2 border-t border-slate-50">
                                <label className="text-xs font-bold text-slate-400 uppercase block mb-2">การคัดเลือก (สำหรับกรรมการ)</label>
                                <div className="flex flex-wrap gap-2">
                                    {['108', '93', '36'].map(tag => (
                                        <button
                                            key={tag}
                                            onClick={() => handleStatusToggle(tag)}
                                            className={`px-3 py-2 rounded-lg text-sm font-bold border transition-all flex items-center gap-2
                                            ${menu.selection_status?.includes(tag)
                                                    ? (tag === '108' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                                                        tag === '93' ? 'bg-indigo-100 text-indigo-700 border-indigo-200' : 'bg-rose-100 text-rose-700 border-rose-200')
                                                    : 'bg-slate-50 text-slate-400 border-slate-100 hover:border-slate-300 hover:bg-white'}`}
                                        >
                                            <Icon icon={menu.selection_status?.includes(tag) ? 'solar:check-circle-bold' : 'solar:add-circle-linear'} className="text-lg" />
                                            {tag} เมนู
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Part 3: Survey Depth */}
            <Section title="ข้อมูลเชิงลึก (อัตลักษณ์)" icon="solar:clipboard-check-bold-duotone">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                    <Field
                        label="ความนิยม / การเป็นที่รู้จัก"
                        value={
                            <div className="flex flex-wrap gap-1">
                                {(Array.isArray(menu.popularity) ? menu.popularity : [menu.popularity])
                                    .filter((t: string) => t && t !== 'อื่นๆ')
                                    .map((t: string) => <Badge key={t} text={t} />)}
                                {menu.other_popularity && <Badge text={menu.other_popularity} variant="indigo" />}
                            </div>
                        }
                    />
                    <Field
                        label="ความเชื่อและประเพณี / โอกาสในการกิน"
                        value={
                            <div className="flex flex-wrap gap-1">
                                {(menu.rituals || [])
                                    .filter((t: string) => t && t !== 'อื่นๆ')
                                    .map((t: string) => <Badge key={t} text={t} />)}
                                {menu.other_rituals && <Badge text={menu.other_rituals} variant="indigo" />}
                            </div>
                        }
                    />
                    <Field
                        label="ฤดูกาล / ช่วงเวลาที่หารับประทานได้"
                        value={
                            <div className="flex flex-wrap gap-1">
                                {(Array.isArray(menu.seasonality) ? menu.seasonality : [menu.seasonality])
                                    .filter((t: string) => t && t !== 'อื่นๆ')
                                    .map((t: string) => <Badge key={t} text={t} />)}
                                {menu.other_seasonality && <Badge text={menu.other_seasonality} variant="indigo" />}
                            </div>
                        }
                    />
                    <Field
                        label="แหล่งที่มาของวัตถุดิบ"
                        value={
                            <div className="flex flex-wrap gap-1">
                                {(menu.ingredient_sources || [])
                                    .filter((t: string) => t && t !== 'อื่นๆ')
                                    .map((t: string) => <Badge key={t} text={t} />)}
                                {menu.other_ingredient_sources && <Badge text={menu.other_ingredient_sources} variant="indigo" />}
                            </div>
                        }
                    />
                    <Field
                        label="สุขภาพและสรรพคุณ"
                        value={
                            <div className="flex flex-wrap gap-1">
                                {(menu.health_benefits || [])
                                    .filter((t: string) => t && t !== 'อื่นๆ')
                                    .map((t: string) => <Badge key={t} text={t} />)}
                                {menu.other_health_benefits && <Badge text={menu.other_health_benefits} variant="indigo" />}
                            </div>
                        }
                    />
                    <Field
                        label="ความถี่ในการรับประทาน"
                        value={
                            <div className="flex flex-wrap gap-1">
                                {(Array.isArray(menu.consumption_freq) ? menu.consumption_freq : [menu.consumption_freq])
                                    .filter((t: string) => t && t !== 'อื่นๆ')
                                    .map((t: string) => <Badge key={t} text={t} />)}
                                {menu.other_consumption_freq && <Badge text={menu.other_consumption_freq} variant="indigo" />}
                            </div>
                        }
                    />
                    <Field
                        label="ความยากง่ายในการทำ"
                        value={
                            <div className="flex flex-wrap gap-1">
                                {(Array.isArray(menu.complexity) ? menu.complexity : [menu.complexity])
                                    .filter((t: string) => t && t !== 'อื่นๆ')
                                    .map((t: string) => <Badge key={t} text={t} />)}
                                {menu.other_complexity && <Badge text={menu.other_complexity} variant="indigo" />}
                            </div>
                        }
                    />
                    <Field
                        label="รสชาติ / ความเหมาะสม"
                        value={
                            <div className="flex flex-wrap gap-1">
                                {(Array.isArray(menu.taste_appeal) ? menu.taste_appeal : [menu.taste_appeal])
                                    .filter((t: string) => t && t !== 'อื่นๆ')
                                    .map((t: string) => <Badge key={t} text={t} />)}
                                {menu.other_taste_appeal && <Badge text={menu.other_taste_appeal} variant="indigo" />}
                            </div>
                        }
                    />
                    <Field label="คุณค่าทางโภชนาการ" value={menu.nutrition} full />
                    <Field label="คุณค่าทางสังคมและวัฒนธรรม" value={menu.social_value} full />
                </div>
            </Section>

            {/* Part 4: Story */}
            <Section title="เรื่องราวและตำนาน" icon="solar:book-2-bold-duotone">
                <Field label="ความเป็นมา/เรื่องเล่า/ตำนาน" value={menu.story} full />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                    <Field label="สถานะการสืบทอด" value={menu.heritage_status} />
                    <Field label="รางวัล / อ้างอิง" value={menu.awards_references} />
                </div>
            </Section>

            {/* Part 5: Recipe */}
            <Section title="สูตรอาหาร" icon="solar:chef-hat-minimalistic-bold-duotone">
                <div className="mb-8">
                    <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2 text-lg">
                        <Icon icon="solar:leaf-bold" className="text-green-500" /> วัตถุดิบ
                    </h3>

                    {/* Main Ingredients Group */}
                    <div className="space-y-6">
                        {['วัตถุดิบ', 'เครื่องปรุง/สมุนไพร'].map(type => {
                            const filtered = localIngredients.filter(ing => ing.ingredient_type === type)
                            if (filtered.length === 0) return null

                            return (
                                <div key={type} className="bg-slate-50/50 rounded-2xl p-4 border border-slate-100">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-2">
                                        <Icon icon={type === 'วัตถุดิบ' ? 'solar:meat-bold' : 'solar:bottle-bold'} />
                                        {type}
                                    </h4>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm text-left table-fixed">
                                            <thead className="text-[10px] text-slate-400 uppercase border-b border-slate-100">
                                                <tr>
                                                    <th className="px-2 py-2 w-[35%]">ชื่อ</th>
                                                    <th className="px-2 py-2 w-[15%] text-center">ปริมาณ</th>
                                                    <th className="px-2 py-2 w-[15%] text-center">หน่วย</th>
                                                    <th className="px-2 py-2 w-[35%]">หมายเหตุ</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filtered.map((ing: any, i: number) => {
                                                    const originalIndex = localIngredients.findIndex(li => li === ing)
                                                    return (
                                                        <tr key={i} className="border-b border-slate-50 last:border-0 hover:bg-white/50 transition-colors">
                                                            <td className="px-2 py-2.5 font-medium text-slate-700 truncate">
                                                                {ing.master_ingredients?.ing_name || ing.name || '-'}
                                                                {ing.is_main_ingredient && <span className="text-[9px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full ml-1.5 font-black shrink-0">หลัก</span>}
                                                            </td>
                                                            <td className="px-2 py-2.5 text-slate-600 text-center">{ing.quantity}</td>
                                                            <td className="px-2 py-2.5 text-slate-600 text-center">{ing.unit}</td>
                                                            <td className="px-2 py-2.5">
                                                                <input
                                                                    type="text"
                                                                    value={ing.note || ''}
                                                                    onChange={(e) => updateIngredientNote(originalIndex, e.target.value)}
                                                                    placeholder="ระบุหมายเหตุ..."
                                                                    className="w-full bg-transparent border border-transparent rounded-lg px-2 py-1 text-xs focus:border-indigo-200 focus:bg-white transition-all outline-none"
                                                                />
                                                            </td>
                                                        </tr>
                                                    )
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    {canEdit && (
                        <div className="mt-4 flex justify-end">
                            <button
                                onClick={handleSaveNotes}
                                disabled={isSavingNotes}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-sm hover:bg-indigo-700 transition-colors flex items-center gap-2"
                            >
                                {isSavingNotes ? <Icon icon="solar:refresh-bold" className="animate-spin" /> : <Icon icon="solar:diskette-bold" />}
                                บันทึกหมายเหตุส่วนผสม
                            </button>
                        </div>
                    )}
                </div>

                <div className="space-y-8">
                    {['เตรียม', 'ปรุง'].map(type => {
                        const steps = (menu.menu_steps || [])
                            .filter((s: any) => s.step_type === type)
                            .sort((a: any, b: any) => a.step_order - b.step_order)

                        if (steps.length === 0) return null

                        return (
                            <div key={type}>
                                <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2 text-lg">
                                    <Icon icon={type === 'เตรียม' ? 'solar:box-minimalistic-bold' : 'solar:fire-bold'} className={type === 'เตรียม' ? 'text-blue-500' : 'text-orange-500'} />
                                    ขั้นตอนการ{type}
                                </h3>
                                <div className="space-y-3">
                                    {steps.map((step: any) => (
                                        <div key={step.step_id} className="flex gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-colors">
                                            <div className="flex-none w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center font-bold text-slate-800 text-sm shadow-sm">
                                                {step.step_order}
                                            </div>
                                            <div className="pt-1">
                                                <p className="text-slate-700 leading-relaxed font-medium">{step.instruction}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )
                    })}
                </div>

                {menu.secret_tips && (
                    <div className="mt-6 p-4 bg-yellow-50 rounded-xl border border-yellow-100">
                        <h4 className="font-bold text-yellow-800 mb-1 flex items-center gap-2"><Icon icon="solar:star-bold" /> เคล็ดลับ</h4>
                        <p className="text-yellow-700 text-sm">{menu.secret_tips}</p>
                    </div>
                )}
            </Section>

            {/* Photos Section */}
            {menu.menu_photos && menu.menu_photos.length > 0 && (
                <Section title="รูปภาพประกอบ" icon="solar:camera-bold-duotone">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {menu.menu_photos.map((photo: any, i: number) => (
                            <div key={i} className="aspect-square rounded-2xl overflow-hidden bg-slate-100 relative group border border-slate-100 shadow-sm transition-all hover:shadow-md">
                                {photo.photo_url ? (
                                    <img
                                        src={photo.photo_url}
                                        alt={photo.caption || `รูปที่ ${i + 1}`}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                                        <Icon icon="solar:gallery-wide-linear" className="text-3xl" />
                                    </div>
                                )}
                                {photo.caption && (
                                    <div className="absolute inset-x-0 bottom-0 bg-black/60 backdrop-blur-sm p-3 text-white text-[10px] md:text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-300">
                                        {photo.caption}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </Section>
            )}
        </div>
    )
}
