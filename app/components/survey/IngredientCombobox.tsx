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
}

export default function IngredientCombobox({
    value, ingId, onChange, placeholder = 'พิมพ์ค้นหา...', accentColor = 'indigo'
}: IngredientComboboxProps) {
    const [query, setQuery] = useState(value)
    const [options, setOptions] = useState<IngredientOption[]>([])
    const [isOpen, setIsOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [creating, setCreating] = useState(false)
    const wrapperRef = useRef<HTMLDivElement>(null)
    const debounceRef = useRef<NodeJS.Timeout | null>(null)

    useEffect(() => { setQuery(value) }, [value])

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
                const res = await fetch(`/api/master-ingredient?q=${encodeURIComponent(q)}`)
                const json = await res.json()
                setOptions(json.data || [])
                setIsOpen(true)
            } catch { setOptions([]) }
            setLoading(false)
        }, 300)
    }, [])

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
                body: JSON.stringify({ ing_name: trimmed })
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
        ? { ring: 'focus:ring-amber-400', badge: 'bg-amber-100 text-amber-700', hover: 'hover:bg-amber-50', selected: 'text-amber-600' }
        : { ring: 'focus:ring-indigo-400', badge: 'bg-indigo-100 text-indigo-700', hover: 'hover:bg-indigo-50', selected: 'text-indigo-600' }

    return (
        <div ref={wrapperRef} className="relative w-full">
            <div className="relative w-full">
                <input
                    type="text" value={query}
                    onChange={e => handleInputChange(e.target.value)}
                    onFocus={() => { if (query.length >= 1) searchIngredients(query) }}
                    placeholder={placeholder}
                    className={`w-full bg-transparent outline-none text-base font-medium pr-10 ${accent.ring} focus:ring-2 rounded-xl px-4 py-2 transition-all`}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
                    {loading ? <Icon icon="solar:refresh-bold" className="text-slate-400 animate-spin text-lg" />
                        : ingId ? <Icon icon="solar:check-circle-bold" className={`text-lg ${accent.selected}`} />
                            : <Icon icon="solar:magnifer-linear" className="text-slate-300 text-lg" />}
                </div>
            </div>

            {isOpen && (query.length >= 1) && (
                <div className="absolute z-50 top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 max-h-60 overflow-y-auto w-[calc(100vw-2rem)] sm:w-full">
                    {options.length > 0 ? (
                        <>
                            {options.map(opt => (
                                <button key={opt.ing_id} type="button" onClick={() => handleSelect(opt)}
                                    className={`w-full text-left px-8 py-4 text-base flex items-center gap-4 ${accent.hover} transition-colors border-b border-slate-50 last:border-0`}>
                                    <Icon icon="solar:dish-bold-duotone" className="text-xl text-slate-400 flex-shrink-0" />
                                    <span className="font-semibold text-slate-700 truncate">{opt.ing_name}</span>
                                </button>
                            ))}
                        </>
                    ) : !loading && (
                        <div className="px-8 py-4 text-base text-slate-400 text-center">ไม่พบ "{query}" ในระบบ</div>
                    )}

                    {!hasExactMatch && query.trim().length > 0 && !loading && (
                        <button type="button" onClick={handleCreateNew} disabled={creating}
                            className={`w-full text-left px-8 py-4 text-base font-bold flex items-center gap-4 border-t border-slate-100 transition-colors ${creating ? 'opacity-50 pointer-events-none' : accent.hover}`}>
                            <Icon icon={creating ? 'solar:refresh-bold' : 'solar:add-circle-bold'} className={`text-xl flex-shrink-0 ${creating ? 'animate-spin text-slate-400' : accent.selected}`} />
                            <span className={`${accent.selected} truncate`}>{creating ? 'กำลังเพิ่ม...' : `เพิ่ม "${query.trim()}"`}</span>
                        </button>
                    )}
                </div>
            )}
        </div>
    )
}