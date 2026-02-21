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

    const Badge = ({ text }: { text: string }) => (
        <span className="inline-block px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-sm font-medium mr-2 mb-2">{text}</span>
    )

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
                <div className="w-full md:w-1/3 aspect-square rounded-2xl bg-slate-100 overflow-hidden shadow-inner flex-shrink-0">
                    {menu.menu_photos?.[0]?.photo_url ? (
                        <img src={menu.menu_photos[0].photo_url} alt={menu.menu_name} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                            <Icon icon="solar:gallery-wide-linear" className="text-5xl" />
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
                        <p className="text-slate-500 text-lg">{menu.local_name || '-'}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 py-4 border-t border-slate-50">
                        <Field label="ผู้ให้ข้อมูล" value={menu.informants?.full_name} />
                        <Field label="ชุมชน" value={menu.informants?.address_full} />
                        <Field label="ผู้เก็บข้อมูล" value={menu.users?.collector_name || '-'} /> {/* Hiding Code if just sv_code? User said 'hide Code'. I'll show name or - */}
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Field label="ความนิยม" value={menu.popularity} />
                    <Field label="ฤดูกาล" value={menu.seasonality} />
                    <Field label="โอกาส/ประเพณี" value={menu.rituals?.map((r: string) => <Badge key={r} text={r} />)} />
                    <Field label="รสชาติโดดเด่น" value={menu.taste_appeal} />
                    <Field label="ความยากในการทำ" value={menu.complexity} />
                    <Field label="ความถี่ในการบริโภค" value={menu.consumption_freq} />
                    <Field label="แหล่งวัตถุดิบ" value={menu.ingredient_sources?.map((s: string) => <Badge key={s} text={s} />)} />
                    <Field label="ประโยชน์ต่อสุขภาพ" value={menu.health_benefits?.map((h: string) => <Badge key={h} text={h} />)} />
                </div>
            </Section>

            {/* Part 4: Story */}
            <Section title="เรื่องราวและตำนาน" icon="solar:book-2-bold-duotone">
                <Field label="ความเป็นมา/เรื่องเล่า" value={menu.story} full />
                <div className="mt-4"><Field label="สถานะการสืบทอด" value={menu.heritage_status} /></div>
            </Section>

            {/* Part 5: Recipe */}
            <Section title="สูตรอาหาร" icon="solar:chef-hat-minimalistic-bold-duotone">
                <div className="mb-6">
                    <h3 className="font-bold text-slate-700 mb-3 flex items-center gap-2"><Icon icon="solar:leaf-bold" className="text-green-500" /> วัตถุดิบ</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-400 uppercase bg-slate-50">
                                <tr>
                                    {/* HIDDEN CODE: <th className="px-4 py-2 rounded-l-lg">รหัส</th> */}
                                    <th className="px-4 py-2 rounded-l-lg">ชื่อ</th>
                                    <th className="px-4 py-2">ปริมาณ</th>
                                    <th className="px-4 py-2">หน่วย</th>
                                    <th className="px-4 py-2 rounded-r-lg">หมายเหตุ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {menu.menu_ingredients?.map((ing: any, i: number) => (
                                    <tr key={i} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                                        {/* HIDDEN CODE: <td className="px-4 py-2 font-mono text-slate-400">{ing.ref_ing_id || '-'}</td> */}
                                        <td className="px-4 py-2 font-medium text-slate-700">{ing.master_ingredients?.ing_name || ing.name || '-'} {ing.is_main_ingredient && <span className="text-[10px] bg-red-100 text-red-600 px-1 rounded ml-1">หลัก</span>}</td>
                                        <td className="px-4 py-2">{ing.quantity}</td>
                                        <td className="px-4 py-2">{ing.unit}</td>
                                        <td className="px-4 py-2 text-slate-500">{ing.note}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div>
                    <h3 className="font-bold text-slate-700 mb-3 flex items-center gap-2"><Icon icon="solar:list-check-bold" className="text-orange-500" /> วิธีทำ</h3>
                    <div className="space-y-3">
                        {menu.menu_steps?.sort((a: any, b: any) => a.step_order - b.step_order).map((step: any) => (
                            <div key={step.step_id} className="flex gap-4 p-3 rounded-xl bg-slate-50 border border-slate-100">
                                <div className="flex-none w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center font-bold text-slate-500 text-sm">
                                    {step.step_order}
                                </div>
                                <div>
                                    <span className="text-xs font-bold text-indigo-500 mb-1 block">{step.step_type}</span>
                                    <p className="text-slate-700">{step.instruction}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {menu.secret_tips && (
                    <div className="mt-6 p-4 bg-yellow-50 rounded-xl border border-yellow-100">
                        <h4 className="font-bold text-yellow-800 mb-1 flex items-center gap-2"><Icon icon="solar:star-bold" /> เคล็ดลับ</h4>
                        <p className="text-yellow-700 text-sm">{menu.secret_tips}</p>
                    </div>
                )}
            </Section>

            {/* Photos */}
            {menu.menu_photos?.length > 0 && (
                <Section title="รูปภาพประกอบ" icon="solar:camera-bold-duotone">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {menu.menu_photos.map((photo: any, i: number) => (
                            <div key={i} className="aspect-square rounded-xl overflow-hidden bg-slate-100 relative group">
                                <img src={photo.photo_url} alt={photo.caption || `รูปที่ ${i + 1}`} className="w-full h-full object-cover" />
                                <div className="absolute inset-x-0 bottom-0 bg-black/60 p-2 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                                    {photo.caption || '-'}
                                </div>
                            </div>
                        ))}
                    </div>
                </Section>
            )}
        </div>
    )
}
