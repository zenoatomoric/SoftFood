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
    userName: string
    isSelectionMode?: boolean
}

export default function MenuDetailClient({ menu, userRole, userId, userName, isSelectionMode: propIsSelectionMode }: Props) {
    const router = useRouter()
    const isSelectionMode = !!propIsSelectionMode

    // UI Feedback
    const [isMounted, setIsMounted] = useState(false)
    const [videoPreview, setVideoPreview] = useState<string | null>(null)
    const [promoVideoPreview, setPromoVideoPreview] = useState<string | null>(null)
    const [toast, setToast] = useState<{ show: boolean, msg: string, type: 'success' | 'error' | 'info' }>({ show: false, msg: '', type: 'success' })
    const [confirmConfig, setConfirmConfig] = useState<{
        isOpen: boolean; title: string; message: string; type: 'info' | 'danger' | 'success' | 'warning';
        onConfirm: () => void
    }>({ isOpen: false, title: '', message: '', type: 'info', onConfirm: () => { } })

    // Local state for ingredients to allow editing notes
    const [localIngredients, setLocalIngredients] = useState<any[]>(menu?.menu_ingredients || [])
    const [isSavingNotes, setIsSavingNotes] = useState(false)
    const [isUploadingVideo, setIsUploadingVideo] = useState(false)
    const [isUploadingPromoVideo, setIsUploadingPromoVideo] = useState(false)
    const [isUploadingSelectionImage, setIsUploadingSelectionImage] = useState(false)
    const [isUploadingAdditionalPhoto, setIsUploadingAdditionalPhoto] = useState(false)

    useEffect(() => {
        setIsMounted(true)
    }, [])

    useEffect(() => {
        setLocalIngredients(menu?.menu_ingredients || [])
    }, [menu?.menu_ingredients])

    if (!isMounted) {
        return (
            <div className="max-w-5xl mx-auto pb-20 px-8 py-24 text-center">
                <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-600 animate-pulse">
                    <Icon icon="solar:refresh-bold" className="text-3xl animate-spin" />
                </div>
                <p className="text-slate-400 font-bold animate-pulse">กำลังเตรียมข้อมูล...</p>
            </div>
        )
    }

    if (!menu) return <div className="p-8 text-center text-slate-500">ไม่พบข้อมูลเมนู</div>

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

    const validateVideo = (file: File): Promise<{ valid: boolean, error?: string }> => {
        return new Promise((resolve) => {
            // 1. Check file size (600MB limit)
            const MAX_SIZE = 600 * 1024 * 1024; 
            if (file.size > MAX_SIZE) {
                resolve({ valid: false, error: 'ไฟล์วิดีโอใหญ่เกินไป (จำกัด 600MB) กรุณาบีบอัดไฟล์ก่อนอัปโหลด' });
                return;
            }

            // 2. Check duration (5 minutes limit)
            const video = document.createElement('video');
            video.preload = 'metadata';
            video.onloadedmetadata = () => {
                window.URL.revokeObjectURL(video.src);
                if (video.duration > 300) { // 300 seconds = 5 minutes
                    resolve({ valid: false, error: 'ความยาววิดีโอต้องไม่เกิน 5 นาที' });
                } else {
                    resolve({ valid: true });
                }
            };
            video.onerror = () => {
                window.URL.revokeObjectURL(video.src);
                resolve({ valid: false, error: 'ไม่สามารถตรวจสอบรูปแบบไฟล์วิดีโอได้' });
            };
            video.src = URL.createObjectURL(file);
        });
    };

    const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (!file.type.startsWith('video/')) {
            setToast({ show: true, msg: 'กรุณาอัปโหลดไฟล์วิดีโอเท่านั้น', type: 'error' })
            return
        }

        setIsUploadingVideo(true)
        setToast({ show: true, msg: 'กำลังตรวจสอบวิดีโอ...', type: 'info' })
        
        try {
            const validation = await validateVideo(file);
            if (!validation.valid) {
                setToast({ show: true, msg: validation.error || 'วิดีโอไม่ผ่านการตรวจสอบ', type: 'error' });
                setIsUploadingVideo(false);
                return;
            }

            // Set local preview
            const objectUrl = URL.createObjectURL(file)
            setVideoPreview(objectUrl)

            const formData = new FormData()
            formData.append('file', file)
            formData.append('folder', 'menu_videos')

            const uploadRes = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            })

            const uploadJson = await uploadRes.json()
            if (!uploadJson.success) throw new Error(uploadJson.error || 'Upload failed')

            const videoUrl = uploadJson.url

            // Update menu with new video_url
            const updateRes = await fetch(`/api/food`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ menu_id: menu.menu_id, video_url: videoUrl })
            })

            if (updateRes.ok) {
                setToast({ show: true, msg: 'อัปโหลดวิดีโอสำเร็จ', type: 'success' })
                router.refresh()
            } else {
                setToast({ show: true, msg: 'บันทึก URL วิดีโอไม่สำเร็จ', type: 'error' })
            }
        } catch (err) {
            setToast({ show: true, msg: 'เกิดข้อผิดพลาดในการอัปโหลด', type: 'error' })
            setVideoPreview(null)
        } finally {
            setIsUploadingVideo(false)
        }
    }

    const handlePromoVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (!file.type.startsWith('video/')) {
            setToast({ show: true, msg: 'กรุณาอัปโหลดไฟล์วิดีโอเท่านั้น', type: 'error' })
            return
        }

        setIsUploadingPromoVideo(true)
        setToast({ show: true, msg: 'กำลังตรวจสอบคลิปโปรโมท...', type: 'info' })

        try {
            const validation = await validateVideo(file);
            if (!validation.valid) {
                setToast({ show: true, msg: validation.error || 'คลิปโปรโมทไม่ผ่านการตรวจสอบ', type: 'error' });
                setIsUploadingPromoVideo(false);
                return;
            }

            // Set local preview
            const objectUrl = URL.createObjectURL(file)
            setPromoVideoPreview(objectUrl)

            const formData = new FormData()
            formData.append('file', file)
            formData.append('folder', 'menu_videos')

            const uploadRes = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            })

            const uploadJson = await uploadRes.json()
            if (!uploadJson.success) throw new Error(uploadJson.error || 'Upload failed')

            const videoUrl = uploadJson.url

            // Update menu with new promo_video_url
            const updateRes = await fetch(`/api/food`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ menu_id: menu.menu_id, promo_video_url: videoUrl })
            })

            if (updateRes.ok) {
                setToast({ show: true, msg: 'อัปโหลดคลิปโปรโมทสำเร็จ', type: 'success' })
                router.refresh()
            } else {
                setToast({ show: true, msg: 'บันทึก URL คลิปโปรโมทไม่สำเร็จ', type: 'error' })
            }
        } catch (err) {
            setToast({ show: true, msg: 'เกิดข้อผิดพลาดในการอัปโหลด', type: 'error' })
            setPromoVideoPreview(null)
        } finally {
            setIsUploadingPromoVideo(false)
        }
    }

    const handleDeleteVideo = async (type: 'main' | 'promo') => {
        setConfirmConfig({
            isOpen: true,
            title: 'ยืนยันการลบวิดีโอ',
            message: `คุณแน่ใจหรือไม่ว่าต้องการลบ${type === 'main' ? 'วิดีโอวิธีการทำ' : 'คลิปโปรโมท'}นี้?`,
            type: 'danger',
            onConfirm: async () => {
                setConfirmConfig(prev => ({ ...prev, isOpen: false }))
                try {
                    const updateRes = await fetch(`/api/food`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            menu_id: menu.menu_id,
                            [type === 'main' ? 'video_url' : 'promo_video_url']: null
                        })
                    })

                    if (updateRes.ok) {
                        setToast({ show: true, msg: 'ลบวิดีโอสำเร็จ', type: 'success' })
                        if (type === 'main') setVideoPreview(null)
                        else setPromoVideoPreview(null)
                        router.refresh()
                    } else {
                        setToast({ show: true, msg: 'ไม่สามารถลบวิดีโอได้', type: 'error' })
                    }
                } catch (err) {
                    setToast({ show: true, msg: 'เกิดข้อผิดพลาดในการลบ', type: 'error' })
                }
            }
        })
    }

    const handleSelectionImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (!file.type.startsWith('image/')) {
            setToast({ show: true, msg: 'กรุณาอัปโหลดไฟล์รูปภาพเท่านั้น', type: 'error' })
            return
        }

        setIsUploadingSelectionImage(true)
        setToast({ show: true, msg: 'กำลังอัปโหลดรูปภาพคัดเลือก...', type: 'info' })
        try {
            const formData = new FormData()
            formData.append('file', file)
            formData.append('folder', 'images')

            const uploadRes = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            })

            const uploadJson = await uploadRes.json()
            if (!uploadJson.success) throw new Error(uploadJson.error || 'Upload failed')

            const imgUrl = uploadJson.url

            // Update menu with new selection_image_url
            const updateRes = await fetch(`/api/food`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ menu_id: menu.menu_id, selection_image_url: imgUrl })
            })

            if (updateRes.ok) {
                setToast({ show: true, msg: 'อัปโหลดรูปภาพสำหรับการคัดเลือกสำเร็จ', type: 'success' })
                router.refresh()
            } else {
                setToast({ show: true, msg: 'บันทึก URL รูปภาพไม่สำเร็จ', type: 'error' })
            }
        } catch (err) {
            setToast({ show: true, msg: 'เกิดข้อผิดพลาดในการอัปโหลด', type: 'error' })
        } finally {
            setIsUploadingSelectionImage(false)
        }
    }

    const handleAdditionalPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (!file.type.startsWith('image/')) {
            setToast({ show: true, msg: 'กรุณาอัปโหลดไฟล์รูปภาพเท่านั้น', type: 'error' })
            return
        }

        setIsUploadingAdditionalPhoto(true)
        setToast({ show: true, msg: 'กำลังอัปโหลดรูปภาพเพิ่มเติม...', type: 'info' })
        try {
            const formData = new FormData()
            formData.append('file', file)
            formData.append('folder', 'images')

            const uploadRes = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            })

            const uploadJson = await uploadRes.json()
            if (!uploadJson.success) throw new Error(uploadJson.error || 'Upload failed')

            const imgUrl = uploadJson.url

            // Save to menu_photos table with is_selection = true
            const saveRes = await fetch(`/api/food/photos`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ref_menu_id: menu.menu_id, photo_url: imgUrl, is_selection: true })
            })

            if (saveRes.ok) {
                setToast({ show: true, msg: 'เพิ่มรูปภาพเพิ่มเติมสำหรับการคัดเลือกสำเร็จ', type: 'success' })
                router.refresh()
            } else {
                setToast({ show: true, msg: 'บันทึกข้อมูลรูปภาพไม่สำเร็จ', type: 'error' })
            }
        } catch (err) {
            setToast({ show: true, msg: 'เกิดข้อผิดพลาดในการอัปโหลด', type: 'error' })
        } finally {
            setIsUploadingAdditionalPhoto(false)
        }
    }

    const handleDeletePhoto = async (photoId: string) => {
        setConfirmConfig({
            isOpen: true,
            title: 'ยืนยันการลบรูปภาพ',
            message: 'คุณแน่ใจหรือไม่ว่าต้องการลบรูปภาพนี้? การกระทำนี้ไม่สามารถย้อนกลับได้',
            type: 'danger',
            onConfirm: async () => {
                setConfirmConfig(prev => ({ ...prev, isOpen: false }))
                try {
                    const res = await fetch(`/api/food/photos?photo_id=${photoId}`, { method: 'DELETE' })
                    if (res.ok) {
                        setToast({ show: true, msg: 'ลบรูปภาพสำเร็จ', type: 'success' })
                        router.refresh()
                    } else {
                        setToast({ show: true, msg: 'ไม่สามารถลบรูปภาพได้', type: 'error' })
                    }
                } catch (err) {
                    setToast({ show: true, msg: 'เกิดข้อผิดพลาดในการลบ', type: 'error' })
                }
            }
        })
    }

    const handleDownloadImage = async (url: string, filename: string) => {
        try {
            setToast({ show: true, msg: 'กำลังพยายามดาวน์โหลดรูปภาพ...', type: 'info' })
            const response = await fetch(url)
            const blob = await response.blob()
            const objectUrl = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = objectUrl
            a.download = filename
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(objectUrl)
            document.body.removeChild(a)
            setToast({ show: true, msg: 'ดาวน์โหลดรูปสำเร็จแล้ว', type: 'success' })
        } catch (error) {
            console.error('Download error:', error)
            // Backup fallback to just open in new tab
            window.open(url, '_blank')
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
        const currentMetadata = menu.selection_metadata || {}
        const isRemoving = currentStatus.includes(targetStatus)

        setConfirmConfig({
            isOpen: true,
            title: isRemoving ? 'ยืนยันการยกเลิก' : 'ยืนยันการคัดเลือก',
            message: isRemoving 
                ? `คุณต้องการยกเลิกการคัดเลือก "${targetStatus}" ใช่หรือไม่?`
                : `คุณต้องการคัดเลือกเป็น "${targetStatus}" ใช่หรือไม่?`,
            type: isRemoving ? 'warning' : 'success',
            onConfirm: async () => {
                setConfirmConfig(prev => ({ ...prev, isOpen: false }))
                
                let newStatus = [...currentStatus]
                let newMetadata = { ...currentMetadata }

                if (isRemoving) {
                    newStatus = newStatus.filter((s: string) => s !== targetStatus)
                    delete newMetadata[targetStatus]
                } else {
                    newStatus.push(targetStatus)
                    newMetadata[targetStatus] = {
                        approved_by: userName,
                        approved_at: new Date().toISOString()
                    }
                }

                try {
                    const res = await fetch(`/api/food`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                            menu_id: menu.menu_id, 
                            selection_status: newStatus,
                            selection_metadata: newMetadata
                        })
                    })
                    if (res.ok) {
                        setToast({ show: true, msg: 'อัปเดตสถานะสำเร็จ', type: 'success' })
                        router.refresh()
                    } else {
                        const json = await res.json()
                        setToast({ show: true, msg: json.error || 'อัปเดตสถานะไม่สำเร็จ', type: 'error' })
                    }
                } catch (err) {
                    setToast({ show: true, msg: 'เกิดข้อผิดพลาด', type: 'error' })
                }
            }
        })
    }


    const Section = ({ title, icon, children, rightElement }: { title: string, icon: string, children: React.ReactNode, rightElement?: React.ReactNode }) => (
        <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-slate-100 mb-6">
            <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-50">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                        <Icon icon={icon} className="text-xl" />
                    </div>
                    <h2 className="text-lg font-bold text-slate-800">{title}</h2>
                </div>
                {rightElement}
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
                    {canEdit && !isSelectionMode && (
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
                    {(() => {
                        const hasVoted = menu.selection_status?.length > 0;
                        const useSelectionImg = hasVoted && menu.selection_image_url;
                        const displayUrl = useSelectionImg 
                            ? (menu.selection_image_url!.startsWith('http') ? menu.selection_image_url! : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/images/${menu.selection_image_url}`)
                            : (menu.menu_photos?.[0]?.photo_url ? (menu.menu_photos[0].photo_url.startsWith('http') ? menu.menu_photos[0].photo_url : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/images/${menu.menu_photos[0].photo_url}`) : null);

                        if (!displayUrl) {
                            return (
                                <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 gap-2">
                                    <Icon icon="solar:gallery-wide-linear" className="text-5xl" />
                                    <span className="text-xs font-bold uppercase tracking-widest opacity-50">No Image</span>
                                </div>
                            );
                        }

                        return (
                            <>
                                <img
                                    src={displayUrl}
                                    alt={menu.menu_name}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                />
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleDownloadImage(displayUrl, `${useSelectionImg ? 'รูปประกวด' : 'รูปเมนู'}_${menu.menu_name}.jpg`) }}
                                    className="absolute top-3 right-3 bg-black/40 hover:bg-black/70 backdrop-blur-md text-white p-2.5 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 z-10 shadow-lg hover:scale-105"
                                    title="ดาวน์โหลดรูประดับ HD"
                                >
                                    <Icon icon="solar:download-square-bold" className="text-xl" />
                                </button>
                                {useSelectionImg && (
                                    <div className="absolute top-3 left-3 bg-yellow-400 text-yellow-900 px-3 py-1 text-xs font-bold rounded-lg shadow-sm flex items-center gap-1 z-10">
                                        <Icon icon="solar:star-bold" /> รูปสำหรับคัดเลือก
                                    </div>
                                )}
                            </>
                        );
                    })()}
                    
                    {isSelectionMode && (userRole === 'admin' || userRole === 'director') && menu.selection_status?.length > 0 && ( /* Only allow uploading selection image in selection mode and if voted */
                        <div className="absolute bottom-3 inset-x-0 flex justify-center z-10 transition-all">
                            <label className={`backdrop-blur shadow-lg px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition flex items-center gap-1.5 ${menu.selection_image_url ? 'bg-black/50 text-white hover:bg-black/70' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>
                                {isUploadingSelectionImage ? <Icon icon="solar:refresh-bold" className="animate-spin" /> : <Icon icon="solar:camera-add-bold" />}
                                {menu.selection_image_url ? 'เปลี่ยนรูปคัดเลือก' : 'เพิ่มรูปสำหรับคัดเลือก'}
                                <input type="file" accept="image/*" className="hidden" onChange={handleSelectionImageUpload} disabled={isUploadingSelectionImage} />
                            </label>
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
                        <Field label="สถานะคัดเลือก" value={menu.selection_status?.length ? menu.selection_status.join(', ') : 'รอการคัดเลือก'} />

                        {isSelectionMode && (userRole === 'admin' || userRole === 'director') && (
                            <div className="col-span-full pt-4 mt-2 border-t border-slate-50">
                                <label className="text-xs font-bold text-slate-400 uppercase block mb-2">การคัดเลือก (สำหรับกรรมการ)</label>
                                <div className="flex flex-wrap gap-2">
                                    {['108', '93', '36', 'ซิกเนเจอร์'].map(tag => (
                                        <button
                                            key={tag}
                                            onClick={() => handleStatusToggle(tag)}
                                            className={`px-3 py-2 rounded-lg text-sm font-bold border transition-all flex items-center gap-2
                                            ${menu.selection_status?.includes(tag)
                                                    ? (tag === '108' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                                                        tag === '93' ? 'bg-indigo-100 text-indigo-700 border-indigo-200' :
                                                            tag === 'ซิกเนเจอร์' ? 'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200' : 'bg-rose-100 text-rose-700 border-rose-200')
                                                    : 'bg-slate-50 text-slate-400 border-slate-100 hover:border-slate-300 hover:bg-white'}`}
                                        >
                                            <div className="flex flex-col items-start">
                                                <div className="flex items-center gap-2">
                                                    <Icon icon={menu.selection_status?.includes(tag) ? 'solar:check-circle-bold' : 'solar:add-circle-linear'} className="text-lg" />
                                                    <span>{tag} {tag === 'ซิกเนเจอร์' ? '' : 'เมนู'}</span>
                                                </div>
                                                {menu.selection_status?.includes(tag) && menu.selection_metadata?.[tag]?.approved_by && (
                                                    <span className="text-[10px] opacity-60 font-normal mt-0.5 ml-6">
                                                        (ยืนยันโดย: {menu.selection_metadata[tag].approved_by})
                                                    </span>
                                                )}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Video Upload Section for Signature Menus */}
            {menu.selection_status?.includes('ซิกเนเจอร์') && (
                <Section title="วิดีโอซิกเนเจอร์" icon="solar:video-frame-bold-duotone">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                        {/* Box 1: How-to */}
                        <div className="flex flex-col items-start gap-4 w-full">
                            <h3 className="font-bold text-slate-700 text-sm bg-slate-100 px-3 py-1 rounded-lg">1. วิดีโอวิธีการทำ</h3>
                            {(menu.video_url || videoPreview) ? (
                                <div className="w-full rounded-2xl overflow-hidden bg-slate-900 aspect-video relative flex-shrink-0">
                                    <video key={videoPreview || menu.video_url} src={videoPreview || menu.video_url} controls className="w-full h-full object-contain" />
                                    {canEdit && (
                                        <div className="absolute top-2 right-2 flex gap-2">
                                            <label className="bg-white/90 backdrop-blur text-indigo-600 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer shadow-sm hover:bg-white transition flex items-center gap-1">
                                                <Icon icon="solar:upload-minimalistic-bold" /> เปลี่ยนวิดีโอ
                                                <input type="file" accept="video/*" className="hidden" onChange={handleVideoUpload} disabled={isUploadingVideo} />
                                            </label>
                                            <button
                                                onClick={() => handleDeleteVideo('main')}
                                                className="bg-rose-500/80 backdrop-blur text-white p-1.5 rounded-lg text-lg hover:bg-rose-600 transition shadow-sm"
                                                title="ลบวิดีโอ"
                                            >
                                                <Icon icon="solar:trash-bin-trash-bold" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="w-full aspect-video rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 bg-slate-50 relative">
                                    <Icon icon="solar:video-frame-linear" className="text-4xl mb-2" />
                                    <p className="text-sm font-medium mb-1 text-center">ยังไม่มีวิดีโอ<br/>วิธีการทำ</p>
                                    <p className="text-[10px] text-slate-400 mb-4">(ไม่เกิน 5 นาที / 600MB)</p>
                                    {canEdit && (
                                        <label className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl text-sm font-bold cursor-pointer hover:bg-indigo-100 transition flex items-center gap-2">
                                            {isUploadingVideo ? <Icon icon="solar:refresh-bold" className="animate-spin" /> : <Icon icon="solar:upload-minimalistic-bold" />}
                                            อัปโหลด
                                            <input type="file" accept="video/*" className="hidden" onChange={handleVideoUpload} disabled={isUploadingVideo} />
                                        </label>
                                    )}
                                </div>
                            )}
                            {isUploadingVideo && <p className="text-xs text-indigo-600 animate-pulse font-medium">กำลังอัปโหลดวิดีโอวิธีการทำ...</p>}
                        </div>

                        {/* Box 2: Promo */}
                        <div className="flex flex-col items-start gap-4 w-full">
                            <h3 className="font-bold text-slate-700 text-sm bg-slate-100 px-3 py-1 rounded-lg">2. คลิปโปรโมท</h3>
                            {(menu.promo_video_url || promoVideoPreview) ? (
                                <div className="w-full rounded-2xl overflow-hidden bg-slate-900 aspect-video relative flex-shrink-0">
                                    <video key={promoVideoPreview || menu.promo_video_url} src={promoVideoPreview || menu.promo_video_url} controls className="w-full h-full object-contain" />
                                    {canEdit && (
                                        <div className="absolute top-2 right-2 flex gap-2">
                                            <label className="bg-white/90 backdrop-blur text-indigo-600 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer shadow-sm hover:bg-white transition flex items-center gap-1">
                                                <Icon icon="solar:upload-minimalistic-bold" /> เปลี่ยนวิดีโอ
                                                <input type="file" accept="video/*" className="hidden" onChange={handlePromoVideoUpload} disabled={isUploadingPromoVideo} />
                                            </label>
                                            <button
                                                onClick={() => handleDeleteVideo('promo')}
                                                className="bg-rose-500/80 backdrop-blur text-white p-1.5 rounded-lg text-lg hover:bg-rose-600 transition shadow-sm"
                                                title="ลบวิดีโอ"
                                            >
                                                <Icon icon="solar:trash-bin-trash-bold" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="w-full aspect-video rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 bg-slate-50 relative">
                                    <Icon icon="solar:video-frame-linear" className="text-4xl mb-2 text-fuchsia-300" />
                                    <p className="text-sm font-medium mb-1 text-center">ยังไม่มีคลิปโปรโมท</p>
                                    <p className="text-[10px] text-slate-400 mb-4">(ไม่เกิน 5 นาที / 600MB)</p>
                                    {canEdit && (
                                        <label className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl text-sm font-bold cursor-pointer hover:bg-indigo-100 transition flex items-center gap-2">
                                            {isUploadingPromoVideo ? <Icon icon="solar:refresh-bold" className="animate-spin" /> : <Icon icon="solar:upload-minimalistic-bold" />}
                                            อัปโหลด
                                            <input type="file" accept="video/*" className="hidden" onChange={handlePromoVideoUpload} disabled={isUploadingPromoVideo} />
                                        </label>
                                    )}
                                </div>
                            )}
                            {isUploadingPromoVideo && <p className="text-xs text-indigo-600 animate-pulse font-medium">กำลังอัปโหลดคลิปโปรโมท...</p>}
                        </div>
                    </div>
                </Section>
            )}

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

            {/* Photos Sections */}
            <div className="space-y-8">
                {/* 1. Selection Photos (Only in Selection Mode and if voted) */}
                {isSelectionMode && menu.selection_status?.length > 0 && (
                    <Section 
                        title="รูปภาพเพิ่มเติมสำหรับการคัดเลือก" 
                        icon="solar:camera-bold-duotone"
                        rightElement={
                            (userRole === 'admin' || userRole === 'director') && (
                                <label className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold cursor-pointer hover:bg-indigo-700 transition flex items-center gap-2 shadow-md shadow-indigo-200 active:scale-95">
                                    {isUploadingAdditionalPhoto ? <Icon icon="solar:refresh-bold" className="animate-spin" /> : <Icon icon="solar:add-circle-bold" />}
                                    เพิ่มรูปภาพคัดเลือก
                                    <input type="file" accept="image/*" className="hidden" onChange={handleAdditionalPhotoUpload} disabled={isUploadingAdditionalPhoto} />
                                </label>
                            )
                        }
                    >
                        {(() => {
                            const selectionPhotos = (menu.menu_photos || []).filter((p: any) => p.is_selection);
                            if (selectionPhotos.length === 0) {
                                return (
                                    <div className="py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400">
                                        <Icon icon="solar:gallery-wide-linear" className="text-4xl mb-2 opacity-50" />
                                        <p className="text-sm font-bold">ยังไม่มีรูปภาพเพิ่มเติมสำหรับการคัดเลือก</p>
                                    </div>
                                );
                            }
                            return (
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {selectionPhotos.map((photo: any, i: number) => (
                                        <PhotoCard 
                                            key={photo.photo_id} 
                                            photo={photo} 
                                            index={i} 
                                            allowDelete={(userRole === 'admin' || userRole === 'director')} 
                                        />
                                    ))}
                                </div>
                            );
                        })()}
                    </Section>
                )}

                {/* 2. Survey Photos */}
                <Section title="รูปภาพประกอบจากการสำรวจ" icon="solar:gallery-bold-duotone">
                    {(() => {
                        const surveyPhotos = (menu.menu_photos || []).filter((p: any) => !p.is_selection);
                        if (surveyPhotos.length === 0) {
                            return (
                                <div className="py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400">
                                    <Icon icon="solar:gallery-wide-linear" className="text-4xl mb-2 opacity-50" />
                                    <p className="text-sm font-bold">ไม่มีรูปภาพประกอบจากการสำรวจ</p>
                                </div>
                            );
                        }
                        return (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {surveyPhotos.map((photo: any, i: number) => (
                                    <ViewOnlyPhotoCard key={photo.photo_id} photo={photo} index={i} />
                                ))}
                            </div>
                        );
                    })()}
                </Section>
            </div>
        </div>
    )

    // Helper Components for Photos
    function PhotoCard({ photo, index, allowDelete }: { photo: any, index: number, allowDelete: boolean }) {
        return (
            <div className="aspect-square rounded-2xl overflow-hidden bg-slate-100 relative group border border-slate-100 shadow-sm transition-all hover:shadow-md">
                <img
                    src={photo.photo_url.startsWith('http') ? photo.photo_url : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/images/${photo.photo_url}`}
                    alt={photo.caption || `รูปคัดเลือกที่ ${index + 1}`}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute top-2 right-2 flex gap-2 opacity-0 md:group-hover:opacity-100 transition-all duration-300 z-10">
                    <button
                        onClick={(e) => { e.stopPropagation(); handleDownloadImage(photo.photo_url.startsWith('http') ? photo.photo_url : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/images/${photo.photo_url}`, `รูปคัดเลือก_${menu.menu_name}_${index + 1}.jpg`) }}
                        className="bg-black/40 hover:bg-black/70 backdrop-blur-md text-white p-2 rounded-xl shadow-lg hover:scale-105"
                        title="ดาวน์โหลดรูป"
                    >
                        <Icon icon="solar:download-square-bold" className="text-lg" />
                    </button>
                    {allowDelete && (
                        <button
                            onClick={(e) => { e.stopPropagation(); handleDeletePhoto(photo.photo_id) }}
                            className="bg-rose-500/80 hover:bg-rose-600 backdrop-blur-md text-white p-2 rounded-xl shadow-lg hover:scale-105"
                            title="ลบรูปภาพ"
                        >
                            <Icon icon="solar:trash-bin-trash-bold" className="text-lg" />
                        </button>
                    )}
                </div>
                {photo.caption && (
                    <div className="absolute inset-x-0 bottom-0 bg-black/60 backdrop-blur-sm p-3 text-white text-[10px] md:text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-300">
                        {photo.caption}
                    </div>
                )}
            </div>
        )
    }

    function ViewOnlyPhotoCard({ photo, index }: { photo: any, index: number }) {
        const url = photo.photo_url.startsWith('http') ? photo.photo_url : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/images/${photo.photo_url}`
        return (
            <div className="aspect-square rounded-2xl overflow-hidden bg-slate-100 relative group border border-slate-100 shadow-sm transition-all hover:shadow-md">
                <img
                    src={url}
                    alt={photo.caption || `รูปที่ ${index + 1}`}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <button
                    onClick={(e) => { e.stopPropagation(); handleDownloadImage(url, `รูปสำรวจ_${menu.menu_name}_${index + 1}.jpg`) }}
                    className="absolute top-2 right-2 bg-black/40 hover:bg-black/70 backdrop-blur-md text-white p-2 md:p-2.5 rounded-xl opacity-0 md:group-hover:opacity-100 transition-all duration-300 z-10 shadow-lg hover:scale-105"
                    title="ดาวน์โหลดรูปภาพ"
                >
                    <Icon icon="solar:download-square-bold" className="text-lg md:text-xl" />
                </button>
                {photo.caption && (
                    <div className="absolute inset-x-0 bottom-0 bg-black/60 backdrop-blur-sm p-3 text-white text-[10px] md:text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-300">
                        {photo.caption}
                    </div>
                )}
            </div>
        )
    }
}
