'use client'

/**
 * MenuDetailPopup — wider layout, multi-image gallery, video sections
 */

import { Icon } from '@iconify/react'
import { useState } from 'react'

interface Ingredient {
    name: string
    is_main: boolean
    type: string
    quantity: string
    unit: string
    note: string
}

interface MenuItem {
    menu_id: string
    menu_name: string
    local_name: string
    other_name: string
    category: string
    selection_status: string[]
    canal_zone: string
    informant_name: string
    address: string
    thumbnail: string | null
    photos: string[]
    story: string
    secret_tips: string
    nutrition: string
    health_benefits: string[]
    heritage_status: string
    serving_size: string
    popularity: string[]
    seasonality: string[]
    rituals: string[]
    ingredient_sources: string[]
    cooking_method: string
    taste_profile: string
    eating_occasion: string[]
    ingredients: Ingredient[]
    steps: string[]
    video_url: string | null
    promo_video_url: string | null
}

interface Props {
    menu: MenuItem | null
    visible: boolean
    onCloseAction: () => void
}

export function MenuDetailPopup({ menu, visible, onCloseAction }: Props) {
    const [activePhoto, setActivePhoto] = useState(0)

    if (!menu) return null

    const isSignature = menu.selection_status.includes('ซิกเนเจอร์')
    const mainIngredients = menu.ingredients.filter(i => i.is_main)
    const otherIngredients = menu.ingredients.filter(i => !i.is_main)

    // Deduplicated photo list: thumbnail first, then photos array
    const allPhotos = (() => {
        const seen = new Set<string>()
        const list: string[] = []
        if (menu.thumbnail) { seen.add(menu.thumbnail); list.push(menu.thumbnail) }
        for (const p of menu.photos) {
            if (p && !seen.has(p)) { seen.add(p); list.push(p) }
        }
        return list
    })()

    const hasMultiplePhotos = allPhotos.length > 1
    const hasVideo = !!(menu.video_url || menu.promo_video_url)

    const badgeLabel = isSignature ? 'Signature' :
        menu.selection_status.includes('36') ? '36 เมนู' :
        menu.selection_status.includes('93') ? '93 เมนู' :
        menu.selection_status.includes('108') ? '108 เมนู' :
        menu.category

    const prevPhoto = () => setActivePhoto(p => (p - 1 + allPhotos.length) % allPhotos.length)
    const nextPhoto = () => setActivePhoto(p => (p + 1) % allPhotos.length)

    return (
        <div className={`fixed inset-0 z-[100] flex items-start justify-center p-3 sm:p-6 overflow-y-auto ${visible ? 'pointer-events-auto' : 'pointer-events-none'}`}>
            {/* Backdrop */}
            <div
                className={`fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}
                onClick={onCloseAction}
            />

            {/* Modal */}
            <div
                className={`relative bg-white w-full max-w-4xl rounded-[2rem] overflow-hidden shadow-2xl shadow-slate-300/30 my-4 sm:my-8 transition-all duration-300 ${visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-3 scale-[0.98]'}`}
            >
                {/* ── Hero Gallery ── */}
                <div className="bg-slate-100">
                    {/* Main image */}
                    <div className="relative h-72 sm:h-[22rem] overflow-hidden">
                        {allPhotos.length > 0 ? (
                            <img
                                key={allPhotos[activePhoto]}
                                src={allPhotos[activePhoto]}
                                alt={menu.menu_name}
                                className="w-full h-full object-cover transition-opacity duration-300"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                                <Icon icon="solar:gallery-wide-linear" className="text-6xl" />
                            </div>
                        )}

                        {/* Bottom gradient */}
                        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />

                        {/* Close */}
                        <button
                            onClick={onCloseAction}
                            className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-900 hover:bg-slate-50 transition-all shadow-xl z-20 active:scale-95 group/close"
                            aria-label="ปิด"
                        >
                            <svg 
                                xmlns="http://www.w3.org/2000/svg" 
                                width="24" 
                                height="24" 
                                viewBox="0 0 24 24" 
                                fill="none" 
                                stroke="currentColor" 
                                strokeWidth="2.5" 
                                strokeLinecap="round" 
                                strokeLinejoin="round" 
                                className="transition-transform group-hover/close:rotate-90"
                            >
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>

                        {/* Photo counter */}
                        {hasMultiplePhotos && (
                            <div className="absolute top-5 left-5 text-xs font-semibold px-3 py-1 rounded-full bg-black/50 text-white backdrop-blur-sm tabular-nums">
                                {activePhoto + 1} / {allPhotos.length}
                            </div>
                        )}

                        {/* Prev / Next */}
                        {hasMultiplePhotos && (
                            <>
                                <button
                                    onClick={prevPhoto}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/30 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/50 transition-all"
                                    aria-label="รูปก่อนหน้า"
                                >
                                    <Icon icon="solar:alt-arrow-left-linear" />
                                </button>
                                <button
                                    onClick={nextPhoto}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/30 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/50 transition-all"
                                    aria-label="รูปถัดไป"
                                >
                                    <Icon icon="solar:alt-arrow-right-linear" />
                                </button>
                            </>
                        )}

                        {/* Badges bottom-left */}
                        <div className="absolute bottom-5 left-6 flex gap-2 flex-wrap">
                            <span className={`text-xs font-semibold px-3 py-1.5 rounded-full border backdrop-blur-sm ${
                                isSignature
                                    ? 'bg-amber-50/90 text-amber-700 border-amber-200/70'
                                    : 'bg-white/90 text-slate-700 border-white/60'
                            }`}>
                                {isSignature && '⭐ '}{badgeLabel}
                            </span>
                            {hasVideo && (
                                <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-black/55 text-white border border-white/20 backdrop-blur-sm flex items-center gap-1.5">
                                    <Icon icon="solar:play-circle-linear" width={14} />
                                    มีวิดีโอ
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Thumbnail strip */}
                    {hasMultiplePhotos && (
                        <div className="flex gap-2 px-5 py-3 overflow-x-auto bg-white border-t border-slate-100">
                            {allPhotos.map((src, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setActivePhoto(idx)}
                                    className={`shrink-0 w-14 h-14 rounded-xl overflow-hidden border-2 transition-all ${
                                        idx === activePhoto
                                            ? 'border-slate-900 opacity-100'
                                            : 'border-transparent opacity-45 hover:opacity-75'
                                    }`}
                                    aria-label={`รูปที่ ${idx + 1}`}
                                >
                                    <img src={src} alt="" className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* ── Body ── */}
                <div className="px-8 sm:px-14 py-10">

                    {/* Meta row */}
                    <div className="flex items-center gap-2.5 text-xs text-slate-500 font-semibold uppercase tracking-widest mb-5 flex-wrap">
                        <span className="flex items-center gap-1.5">
                            <Icon icon="solar:map-point-linear" width={13} />
                            คลอง{menu.canal_zone}
                        </span>
                        {menu.category && (
                            <><span className="w-1 h-1 rounded-full bg-slate-300" /><span>{menu.category}</span></>
                        )}
                        {menu.cooking_method && (
                            <><span className="w-1 h-1 rounded-full bg-slate-300" /><span>{menu.cooking_method}</span></>
                        )}
                    </div>

                    {/* Title */}
                    <div className="mb-8">
                        <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight leading-tight mb-2">
                            {menu.menu_name}
                        </h2>
                        {menu.local_name && (
                            <p className="text-base text-slate-500 font-normal italic mt-1">"{menu.local_name}"</p>
                        )}
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 py-6 border-y border-slate-100 mb-10">
                        {menu.informant_name && menu.informant_name !== 'ไม่ระบุ' && (
                            <div>
                                <p className="text-xs text-slate-400 uppercase tracking-wider mb-1.5 font-bold">ผู้ให้ข้อมูล</p>
                                <p className="text-base font-semibold text-slate-800">{menu.informant_name}</p>
                            </div>
                        )}
                        {menu.serving_size && (
                            <div>
                                <p className="text-xs text-slate-400 uppercase tracking-wider mb-1.5 font-bold">ปริมาณ</p>
                                <p className="text-base font-semibold text-slate-800">{menu.serving_size}</p>
                            </div>
                        )}
                        {menu.taste_profile && (
                            <div>
                                <p className="text-xs text-slate-400 uppercase tracking-wider mb-1.5 font-bold">รสชาติ</p>
                                <p className="text-base font-semibold text-slate-800">{menu.taste_profile}</p>
                            </div>
                        )}
                        {menu.heritage_status && (
                            <div>
                                <p className="text-xs text-slate-400 uppercase tracking-wider mb-1.5 font-bold">การสืบทอด</p>
                                <p className="text-base font-semibold text-slate-800">{menu.heritage_status}</p>
                            </div>
                        )}
                    </div>

                    {/* Story */}
                    {menu.story && (
                        <section className="mb-10">
                            <SectionLabel>ประวัติและที่มา</SectionLabel>
                            <p className="text-base text-slate-700 leading-relaxed">{menu.story}</p>
                        </section>
                    )}

                    {/* Secret Tip */}
                    {menu.secret_tips && (
                        <div className="bg-amber-50 rounded-2xl p-6 border border-amber-100 mb-10 flex gap-4 items-start">
                            <Icon icon="solar:lightbulb-minimalistic-linear" className="text-amber-500 text-2xl shrink-0 mt-0.5" />
                            <div>
                                <p className="text-xs font-bold text-amber-700 uppercase tracking-widest mb-2">เคล็ดลับความอร่อย</p>
                                <p className="text-base text-amber-900 leading-relaxed italic">"{menu.secret_tips}"</p>
                            </div>
                        </div>
                    )}

                    {/* Ingredients + Steps */}
                    {(menu.ingredients.length > 0 || menu.steps.length > 0) && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-10">
                            {menu.ingredients.length > 0 && (
                                <section>
                                    <SectionLabel>
                                        วัตถุดิบ
                                        <span className="ml-2 normal-case font-normal bg-slate-100 text-slate-500 px-2 py-0.5 rounded text-xs">
                                            {menu.ingredients.length} รายการ
                                        </span>
                                    </SectionLabel>
                                    <div>
                                        {mainIngredients.map((ing, idx) => (
                                            <IngredientRow key={`m-${idx}`} ing={ing} isMain />
                                        ))}
                                        {otherIngredients.map((ing, idx) => (
                                            <IngredientRow key={`o-${idx}`} ing={ing} />
                                        ))}
                                    </div>
                                </section>
                            )}

                            {menu.steps.length > 0 && (
                                <section>
                                    <SectionLabel>วิธีทำ</SectionLabel>
                                    <div className="space-y-5">
                                        {menu.steps.map((step, idx) => (
                                            <div key={idx} className="flex gap-4">
                                                <span className="text-sm font-bold text-slate-300 tabular-nums pt-0.5 min-w-[24px]">
                                                    {String(idx + 1).padStart(2, '0')}
                                                </span>
                                                <p className="text-base text-slate-700 leading-relaxed m-0">{step}</p>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}
                        </div>
                    )}

                    {/* Nutrition */}
                    {menu.nutrition && (
                        <>
                            <div className="h-px bg-slate-100 mb-8" />
                            <section className="mb-10">
                                <SectionLabel>คุณค่าทางโภชนาการ</SectionLabel>
                                <p className="text-base text-slate-700 leading-relaxed">{menu.nutrition}</p>
                            </section>
                        </>
                    )}

                    {/* ── Videos ── */}
                    {hasVideo && (
                        <>
                            <div className="h-px bg-slate-100 mb-8" />
                            <section className="mb-10 space-y-7">
                                <SectionLabel>วิดีโอ</SectionLabel>

                                {/* วิดีโอวิธีทำ */}
                                {menu.video_url && (
                                    <div>
                                        <div className="flex items-center gap-2.5 mb-3">
                                            <div className="w-7 h-7 rounded-full bg-slate-900 flex items-center justify-center shrink-0">
                                                <Icon icon="solar:chef-hat-linear" className="text-white text-sm" />
                                            </div>
                                            <p className="text-sm font-semibold text-slate-700">วิธีการปรุงอาหาร</p>
                                        </div>
                                        <div className="rounded-2xl overflow-hidden bg-slate-900 aspect-video">
                                            <video
                                                src={menu.video_url}
                                                controls
                                                preload="metadata"
                                                className="w-full h-full object-contain"
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* วิดีโอแนะนำ */}
                                {menu.promo_video_url && (
                                    <div>
                                        <div className="flex items-center gap-2.5 mb-3">
                                            <div className="w-7 h-7 rounded-full bg-slate-900 flex items-center justify-center shrink-0">
                                                <Icon icon="solar:play-stream-linear" className="text-white text-sm" />
                                            </div>
                                            <p className="text-sm font-semibold text-slate-700">วิดีโอแนะนำ</p>
                                        </div>
                                        <div className="rounded-2xl overflow-hidden bg-slate-900 aspect-video">
                                            <video
                                                src={menu.promo_video_url}
                                                controls
                                                preload="metadata"
                                                className="w-full h-full object-contain"
                                            />
                                        </div>
                                    </div>
                                )}
                            </section>
                        </>
                    )}

                    {/* Tags footer */}
                    {(
                        menu.health_benefits.filter(t => t && t !== 'อื่นๆ').length > 0 ||
                        menu.popularity.length > 0 ||
                        menu.seasonality.length > 0 ||
                        menu.rituals.filter(t => t && t !== 'อื่นๆ').length > 0 ||
                        menu.ingredient_sources.length > 0
                    ) && (
                        <div className="pt-8 border-t border-slate-100 space-y-3">
                            {menu.health_benefits.filter(t => t && t !== 'อื่นๆ').length > 0 && (
                                <TagRow label="สรรพคุณ" tags={menu.health_benefits} />
                            )}
                            {menu.popularity.length > 0 && (
                                <TagRow label="ความนิยม" tags={menu.popularity} />
                            )}
                            {menu.seasonality.length > 0 && (
                                <TagRow label="ฤดูกาล" tags={menu.seasonality} />
                            )}
                            {menu.rituals.filter(t => t && t !== 'อื่นๆ').length > 0 && (
                                <TagRow label="ประเพณี" tags={menu.rituals} />
                            )}
                            {menu.ingredient_sources.length > 0 && (
                                <TagRow label="แหล่งวัตถุดิบ" tags={menu.ingredient_sources} />
                            )}
                        </div>
                    )}

                </div>
            </div>
        </div>
    )
}

/* ── Sub-components ── */

function SectionLabel({ children }: { children: React.ReactNode }) {
    return (
        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
            {children}
        </p>
    )
}

function IngredientRow({ ing, isMain }: { ing: Ingredient; isMain?: boolean }) {
    return (
        <div className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
            <span className={`text-base ${isMain ? 'font-semibold text-slate-800' : 'font-normal text-slate-600'}`}>
                {ing.name}
                {isMain && <span className="text-amber-400 text-sm ml-1.5">★</span>}
            </span>
            {(ing.quantity || ing.unit) && (
                <span className="text-sm text-slate-500 ml-4 shrink-0 tabular-nums">
                    {[ing.quantity, ing.unit].filter(Boolean).join(' ')}
                </span>
            )}
        </div>
    )
}

function TagRow({ label, tags }: { label: string; tags: string[] }) {
    const filtered = tags.filter(t => t && t !== 'อื่นๆ')
    if (!filtered.length) return null
    return (
        <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider w-20 shrink-0">{label}</span>
            {filtered.map(t => (
                <span key={t} className="text-xs px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-slate-700 font-medium">
                    {t}
                </span>
            ))}
        </div>
    )
}
