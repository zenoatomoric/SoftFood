'use client'
import { useState, useEffect } from 'react'
import { Icon } from '@iconify/react'
import { useRouter } from 'next/navigation'
import ConfirmModal from '@/app/components/ConfirmModal'
import Toast from '@/app/components/Toast'

interface FoodItem {
    menu_id: string
    menu_name: string
    category: string
    selection_status: string[]
    created_at: string
    informant_name: string
    canal_zone: string
    surveyor_name: string
    thumbnail: string | null
    ref_sv_code: string
    ref_info_id: string
}

interface Props {
    infoId: string
    canEdit: boolean
}

export default function InformantMenus({ infoId, canEdit }: Props) {
    const router = useRouter()
    const [menus, setMenus] = useState<FoodItem[]>([])
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)

    // UI Feedback
    const [toast, setToast] = useState<{ show: boolean, msg: string, type: 'success' | 'error' | 'info' }>({ show: false, msg: '', type: 'success' })
    const [confirmConfig, setConfirmConfig] = useState<{
        isOpen: boolean; title: string; message: string; type: 'info' | 'danger' | 'success' | 'warning';
        onConfirm: () => void
    }>({ isOpen: false, title: '', message: '', type: 'info', onConfirm: () => { } })

    const fetchData = async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams()
            params.set('info_id', infoId)
            params.set('page', page.toString())
            params.set('limit', '10')

            const res = await fetch(`/api/food?${params.toString()}`)
            const json = await res.json()
            if (res.ok) {
                setMenus(json.data)
                setTotalPages(json.totalPages)
            }
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [infoId, page])

    const handleDelete = (menuId: string, menuName: string) => {
        setConfirmConfig({
            isOpen: true,
            title: 'ยืนยันการลบ',
            message: `คุณต้องการลบเมนู "${menuName}" ใช่หรือไม่?`,
            type: 'danger',
            onConfirm: async () => {
                setConfirmConfig(prev => ({ ...prev, isOpen: false }))
                try {
                    const res = await fetch(`/api/food?id=${menuId}`, { method: 'DELETE' })
                    if (res.ok) {
                        setToast({ show: true, msg: 'ลบข้อมูลสำเร็จ', type: 'success' })
                        fetchData()
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

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mt-8 animate-in slide-in-from-bottom-4 duration-500">
            <ConfirmModal {...confirmConfig} onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))} />
            <Toast isVisible={toast.show} message={toast.msg} type={toast.type} onCloseAction={() => setToast(prev => ({ ...prev, show: false }))} />

            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <Icon icon="solar:chef-hat-heart-bold-duotone" className="text-indigo-600" />
                    รายการเมนูอาหาร ({menus.length})
                </h2>
                {canEdit && (
                    <button
                        onClick={() => window.location.href = `/survey/part2?info_id=${infoId}`}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200 text-sm flex items-center gap-2"
                    >
                        <Icon icon="solar:add-circle-bold" />
                        เพิ่มเมนู
                    </button>
                )}
            </div>

            {loading ? (
                <div className="p-6 space-y-4">
                    {[...Array(3)].map((_, i) => <div key={i} className="bg-slate-50 rounded-xl h-16 animate-pulse"></div>)}
                </div>
            ) : menus.length === 0 ? (
                <div className="p-12 text-center text-slate-400">
                    <Icon icon="solar:dish-linear" className="text-5xl mx-auto mb-2 opacity-30" />
                    <p>ยังไม่มีข้อมูลเมนูอาหาร</p>
                </div>
            ) : (
                <div className="divide-y divide-slate-50">
                    {menus.map(menu => (
                        <div key={menu.menu_id} className="p-4 hover:bg-slate-50 transition-colors flex items-center gap-4 group">
                            {/* Thumbnail */}
                            <div className="w-16 h-16 rounded-lg bg-slate-100 overflow-hidden shrink-0 border border-slate-100">
                                {menu.thumbnail ? (
                                    <img src={menu.thumbnail} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                                        <Icon icon="solar:gallery-wide-linear" />
                                    </div>
                                )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <h3
                                    onClick={() => router.push(`/menus/${menu.menu_id}`)}
                                    className="font-bold text-slate-800 text-base truncate cursor-pointer hover:text-indigo-600 transition-colors"
                                >
                                    {menu.menu_name}
                                </h3>
                                <div className="flex flex-wrap gap-2 mt-1">
                                    <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">{menu.category}</span>
                                    {menu.selection_status.length > 0 && (
                                        <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md font-bold border border-indigo-100">
                                            {menu.selection_status.join(', ')}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => router.push(`/menus/${menu.menu_id}`)}
                                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                    title="ดูรายละเอียด"
                                >
                                    <Icon icon="solar:eye-bold" className="text-xl" />
                                </button>
                                {canEdit && (
                                    <>
                                        <button
                                            onClick={() => router.push(`/survey/part2?menu_id=${menu.menu_id}`)}
                                            className="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-colors"
                                            title="แก้ไข"
                                        >
                                            <Icon icon="solar:pen-new-square-bold" className="text-xl" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(menu.menu_id, menu.menu_name)}
                                            className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                                            title="ลบ"
                                        >
                                            <Icon icon="solar:trash-bin-trash-bold" className="text-xl" />
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Simple Pagination */}
            {totalPages > 1 && (
                <div className="p-4 border-t border-slate-100 flex justify-center gap-2">
                    <button
                        disabled={page === 1}
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-30"
                    >
                        <Icon icon="solar:alt-arrow-left-linear" />
                    </button>
                    <span className="text-sm font-medium self-center">หน้า {page} / {totalPages}</span>
                    <button
                        disabled={page === totalPages}
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-30"
                    >
                        <Icon icon="solar:alt-arrow-right-linear" />
                    </button>
                </div>
            )}
        </div>
    )
}
