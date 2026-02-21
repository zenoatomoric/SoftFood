'use client'
import { useState, useEffect } from 'react'
import { Icon } from '@iconify/react'
import ConfirmModal from '@/app/components/ConfirmModal'
import Toast from '@/app/components/Toast'

interface Ingredient {
    ing_id: string
    ing_name: string
    is_verified: boolean
    created_at: string
}

export default function FoodInventoryPage() {
    const [ingredients, setIngredients] = useState<Ingredient[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [debouncedSearch, setDebouncedSearch] = useState('')
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [total, setTotal] = useState(0)

    const [toast, setToast] = useState<{ show: boolean, msg: string, type: 'success' | 'error' | 'info' }>({ show: false, msg: '', type: 'success' })
    const [confirmConfig, setConfirmConfig] = useState<{
        isOpen: boolean; title: string; message: string; type: 'info' | 'danger' | 'success' | 'warning';
        onConfirm: () => void
    }>({ isOpen: false, title: '', message: '', type: 'info', onConfirm: () => { } })

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 500)
        return () => clearTimeout(timer)
    }, [search])

    const fetchData = async () => {
        setLoading(true)
        try {
            const res = await fetch(`/api/inventory?q=${debouncedSearch}&page=${page}`)
            const json = await res.json()
            if (res.ok) {
                setIngredients(json.data)
                setTotal(json.total)
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
    }, [debouncedSearch, page])

    const handleDelete = (id: string, name: string) => {
        setConfirmConfig({
            isOpen: true,
            title: 'ยืนยันการลบ',
            message: `คุณต้องการลบวัตถุดิบ "${name}" ใช่หรือไม่? หากลบแล้ว เมนูที่ใช้วัตถุดิบนี้อาจได้รับผลกระทบ`,
            type: 'danger',
            onConfirm: async () => {
                setConfirmConfig(prev => ({ ...prev, isOpen: false }))
                try {
                    const res = await fetch(`/api/inventory?id=${id}`, { method: 'DELETE' })
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
        <div className="space-y-6 pb-20">
            <ConfirmModal {...confirmConfig} onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))} />
            <Toast isVisible={toast.show} message={toast.msg} type={toast.type} onCloseAction={() => setToast(prev => ({ ...prev, show: false }))} />

            {/* Header Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-4 md:p-6 border-b border-slate-100">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                                <Icon icon="solar:box-minimalistic-bold-duotone" className="text-amber-500" />
                                คลังวัตถุดิบ (Food Inventory)
                                <span className="text-sm font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{total} รายการ</span>
                            </h1>
                            <p className="text-sm text-slate-500 mt-1">จัดการข้อมูลวัตถุดิบกลาง (Master Ingredients) สำหรับ Admin และ Director</p>
                        </div>
                        {/* Add Button can go here later */}
                    </div>

                    {/* Search */}
                    <div className="relative max-w-md">
                        <Icon icon="solar:magnifer-linear" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="ค้นหาชื่อวัตถุดิบ..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-amber-500 outline-none bg-slate-50 focus:bg-white transition-all"
                        />
                    </div>
                </div>

                {/* List */}
                {loading ? (
                    <div className="p-4 space-y-4">
                        {[...Array(5)].map((_, i) => <div key={i} className="bg-slate-50 rounded-xl h-12 animate-pulse"></div>)}
                    </div>
                ) : ingredients.length === 0 ? (
                    <div className="text-center py-20 bg-slate-50/50">
                        <Icon icon="solar:box-minimalistic-linear" className="text-3xl text-slate-300 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-slate-600">ไม่พบข้อมูลวัตถุดิบ</h3>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {ingredients.map(ing => (
                            <div key={ing.ing_id} className="p-4 md:px-6 flex items-center justify-between hover:bg-amber-50/30 transition-colors group">
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${ing.is_verified ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
                                        <Icon icon={ing.is_verified ? "solar:verified-check-bold" : "solar:box-minimalistic-linear"} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800">{ing.ing_name}</h3>
                                        <p className="text-xs text-slate-400">ID: {ing.ing_id.substring(0, 8)}...</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDelete(ing.ing_id, ing.ing_name)}
                                    className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                    title="ลบ"
                                >
                                    <Icon icon="solar:trash-bin-trash-bold" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex justify-center gap-2 p-6 border-t border-slate-100 bg-slate-50/50">
                        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-2 rounded-xl bg-white border border-slate-200 disabled:opacity-50 hover:bg-slate-50 font-bold text-sm">ก่อนหน้า</button>
                        <span className="px-4 py-2 font-bold text-slate-600 text-sm">หน้า {page} / {totalPages}</span>
                        <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-4 py-2 rounded-xl bg-white border border-slate-200 disabled:opacity-50 hover:bg-slate-50 font-bold text-sm">ถัดไป</button>
                    </div>
                )}
            </div>
        </div>
    )
}
