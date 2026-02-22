'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Icon } from '@iconify/react'

interface IngredientOption {
    ing_id: string
    ing_name: string
}

interface IngredientComboboxProps {
    value: string
    ingId: string
    onChange: (ingId: string, ingName: string) => void
    placeholder?: string
    accentColor?: 'indigo' | 'amber'
    defaultCategory?: 'วัตถุดิบ' | 'เครื่องปรุง/สมุนไพร'
}

export default function IngredientCombobox({
    value, ingId, onChange, placeholder = 'พิมพ์ค้นหา...', accentColor = 'indigo', defaultCategory = 'วัตถุดิบ'
}: IngredientComboboxProps) {
    const [query, setQuery] = useState(value || '')
    const [options, setOptions] = useState<IngredientOption[]>([])
    const [isOpen, setIsOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [creating, setCreating] = useState(false)
    const wrapperRef = useRef<HTMLDivElement>(null)
    const debounceRef = useRef<NodeJS.Timeout | null>(null)

    useEffect(() => { setQuery(value || '') }, [value])

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setIsOpen(false)
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    const searchIngredients = useCallback((q: string) => {
        if (debounceRef.current) clearTimeout(debounceRef.current)
        if (q.length < 1) { setOptions([]); setIsOpen(false); return }

        debounceRef.current = setTimeout(async () => {
            setLoading(true)
            try {
                // ค้นหาตาม category ที่กำหนดไว้ประจำช่องนี้
                const res = await fetch(`/api/master-ingredient?q=${encodeURIComponent(q)}&category=${encodeURIComponent(defaultCategory)}`)
                const json = await res.json()
                setOptions(json.data || [])
                setIsOpen(true)
            } catch { setOptions([]) }
            setLoading(false)
        }, 300)
    }, [defaultCategory])

    const handleInputChange = (val: string) => {
        setQuery(val)
        if (ingId && val !== value) onChange('', val)
        searchIngredients(val)
    }

    const handleSelect = (opt: IngredientOption) => {
        setQuery(opt.ing_name)
        onChange(opt.ing_id, opt.ing_name)
        setIsOpen(false)
    }

    const handleCreateNew = async () => {
        const trimmed = query.trim()
        if (!trimmed) return
        setCreating(true)
        try {
            const res = await fetch('/api/master-ingredient', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ing_name: trimmed,
                    ingredient_category: defaultCategory // ใช้หมวดหมู่ตามช่องนี้อัตโนมัติ ไม่ต้องให้ผู้ใช้เลือก
                })
            })
            const json = await res.json()
            if (json.data) {
                setQuery(json.data.ing_name)
                onChange(json.data.ing_id, json.data.ing_name)
                setIsOpen(false)
            }
        } catch (err) { console.error('Create ingredient error:', err) }
        setCreating(false)
    }

    const hasExactMatch = options.some(o => o.ing_name.toLowerCase() === query.trim().toLowerCase())
    const accent = accentColor === 'amber'
        ? { ring: 'focus:ring-amber-400', badge: 'bg-amber-100 text-amber-700', hover: 'hover:bg-amber-50', selected: 'text-amber-600', btn: 'bg-amber-500 hover:bg-amber-600' }
        : { ring: 'focus:ring-indigo-400', badge: 'bg-indigo-100 text-indigo-700', hover: 'hover:bg-indigo-50', selected: 'text-indigo-600', btn: 'bg-indigo-600 hover:bg-indigo-700' }

    return (
        <div ref={wrapperRef} className="relative w-full">
            <div className="relative w-full">
                <input
                    type="text" value={query}
                    onChange={e => handleInputChange(e.target.value)}
                    onFocus={() => { if (query?.length >= 1) searchIngredients(query) }}
                    placeholder={placeholder}
                    className={`w-full bg-transparent outline-none text-base font-medium pr-10 border-2 border-slate-100 focus:border-transparent ${accent.ring} focus:ring-2 rounded-xl px-4 py-3 transition-all`}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
                    {loading ? <Icon icon="solar:refresh-bold" className="text-slate-400 animate-spin text-lg" />
                        : ingId ? <Icon icon="solar:check-circle-bold" className={`text-lg ${accent.selected}`} />
                            : <Icon icon="solar:magnifer-linear" className="text-slate-300 text-lg" />}
                </div>
            </div>

            {isOpen && (query?.length >= 1) && (
                <div className="absolute z-50 top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 max-h-60 overflow-y-auto w-[calc(100vw-2rem)] sm:w-full">
                    {options.length > 0 ? (
                        <>
                            {options.map(opt => (
                                <button key={opt.ing_id} type="button" onClick={() => handleSelect(opt)}
                                    className={`w-full text-left px-6 py-3 text-base flex items-center gap-3 ${accent.hover} transition-colors border-b border-slate-50 last:border-0`}>
                                    <Icon icon={defaultCategory === 'วัตถุดิบ' ? "solar:box-minimalistic-bold-duotone" : "solar:bottle-bold-duotone"} className={`text-xl ${accent.selected} flex-shrink-0 opacity-50`} />
                                    <span className="font-medium text-slate-900 truncate">{opt.ing_name}</span>
                                </button>
                            ))}
                        </>
                    ) : !loading && (
                        <div className="px-6 py-4 text-sm text-slate-400 text-center">ไม่พบข้อมูลในระบบ</div>
                    )}

                    {!hasExactMatch && query.trim().length > 0 && !loading && (
                        <div className="border-t border-slate-100 p-4 sm:p-5 bg-slate-50/50">
                            <div className="flex items-center justify-between mb-3 px-1">
                                <div className="flex items-center gap-2">
                                    <Icon icon="solar:question-circle-bold" className={`text-lg ${accent.selected}`} />
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">ต้องการเพิ่มของใหม่?</span>
                                </div>
                            </div>

                            <button type="button" onClick={handleCreateNew} disabled={creating}
                                className={`w-full py-3.5 rounded-xl text-center text-white font-bold text-sm transition-all shadow-md flex items-center justify-center gap-2
                                ${creating ? 'bg-slate-300 pointer-events-none' : accent.btn}`}>
                                <Icon icon={creating ? 'solar:refresh-bold' : 'solar:add-circle-bold'} className={`text-lg ${creating ? 'animate-spin' : ''}`} />
                                {creating ? 'กำลังบันทึก...' : `เพิ่ม "${query.trim()}" (หมวด${defaultCategory})`}
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}