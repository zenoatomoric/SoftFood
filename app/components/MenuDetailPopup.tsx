'use client'

/**
 * MenuDetailPopup — Canal-themed, compact, z-index above everything
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

/* ── Colors ── */
const C = {
    cd: '#0d3348', cm: '#1a6b8a', cl: '#5db8d8',
    go: '#c8963c', gl: '#e8b84b', gp: '#fdf5e6', gd: '#9a6f22',
    cr: '#f9f3e8', ow: '#fefcf7', tx: '#1a1a2e', tm: '#3d3d3d', tl: '#6b6b6b',
}

export function MenuDetailPopup({ menu, visible, onCloseAction }: Props) {
    const [activePhoto, setActivePhoto] = useState(0)

    if (!menu) return null

    const isSignature = menu.selection_status.includes('ซิกเนเจอร์')
    const mainIngredients = menu.ingredients.filter(i => i.is_main)
    const otherIngredients = menu.ingredients.filter(i => !i.is_main)

    const allPhotos = (() => {
        const seen = new Set<string>()
        const list: string[] = []
        if (menu.thumbnail) { seen.add(menu.thumbnail); list.push(menu.thumbnail) }
        for (const p of menu.photos) { if (p && !seen.has(p)) { seen.add(p); list.push(p) } }
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
        <div
            className={`fixed inset-0 flex items-start justify-center overflow-y-auto p-3 sm:p-5 ${visible ? 'pointer-events-auto' : 'pointer-events-none'}`}
            style={{ zIndex: 9999, fontFamily: "'Sarabun', sans-serif" }}
        >
            {/* Backdrop — dark canal themed */}
            <div
                className={`fixed inset-0 transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}
                style={{ background: 'rgba(7,33,47,.65)', backdropFilter: 'blur(6px)' }}
                onClick={onCloseAction}
            />

            {/* Modal — max-w-2xl for compact size */}
            <div
                className={`relative w-full overflow-hidden my-4 sm:my-6 transition-all duration-300 ${visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-3 scale-[0.97]'}`}
                style={{
                    maxWidth: '680px',
                    borderRadius: '18px',
                    background: C.ow,
                    border: `1px solid rgba(200,150,60,.18)`,
                    boxShadow: '0 12px 48px rgba(13,51,72,.35), 0 0 0 1px rgba(200,150,60,.08)',
                }}
            >
                {/* ── Hero Gallery ── */}
                <div style={{ background: C.cd }}>
                    <div className="relative overflow-hidden" style={{ height: 'clamp(200px, 35vw, 280px)' }}>
                        {allPhotos.length > 0 ? (
                            <img
                                key={allPhotos[activePhoto]}
                                src={allPhotos[activePhoto]}
                                alt={menu.menu_name}
                                className="w-full h-full object-cover transition-opacity duration-300"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1a4a6a, #0d3348)' }}>
                                <Icon icon="solar:gallery-wide-bold-duotone" style={{ fontSize: 48, color: 'rgba(200,150,60,.15)' }} />
                            </div>
                        )}

                        {/* Gradient overlay */}
                        <div className="absolute inset-x-0 bottom-0 h-24 pointer-events-none" style={{ background: 'linear-gradient(to top, rgba(13,51,72,.6), transparent)' }} />

                        {/* Close button */}
                        <button
                            onClick={onCloseAction}
                            className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-95"
                            style={{ background: 'rgba(255,255,255,.12)', border: '1px solid rgba(255,255,255,.2)', backdropFilter: 'blur(8px)' }}
                            aria-label="ปิด"
                        >
                            <Icon icon="solar:close-circle-bold" style={{ color: '#fff', fontSize: 18 }} />
                        </button>

                        {/* Photo counter */}
                        {hasMultiplePhotos && (
                            <div className="absolute top-3 left-3 text-xs font-semibold px-2.5 py-1 rounded-full tabular-nums" style={{ background: 'rgba(0,0,0,.45)', color: '#fff', backdropFilter: 'blur(4px)', fontSize: 10.5 }}>
                                {activePhoto + 1} / {allPhotos.length}
                            </div>
                        )}

                        {/* Navigation arrows */}
                        {hasMultiplePhotos && (
                            <>
                                <button onClick={prevPhoto} className="absolute left-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center transition-all" style={{ background: 'rgba(0,0,0,.3)', backdropFilter: 'blur(4px)' }} aria-label="ก่อนหน้า">
                                    <Icon icon="solar:alt-arrow-left-linear" style={{ color: '#fff', fontSize: 14 }} />
                                </button>
                                <button onClick={nextPhoto} className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center transition-all" style={{ background: 'rgba(0,0,0,.3)', backdropFilter: 'blur(4px)' }} aria-label="ถัดไป">
                                    <Icon icon="solar:alt-arrow-right-linear" style={{ color: '#fff', fontSize: 14 }} />
                                </button>
                            </>
                        )}

                        {/* Badges */}
                        <div className="absolute bottom-3 left-4 flex gap-1.5 flex-wrap">
                            <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{
                                background: isSignature ? 'linear-gradient(135deg, #c8963c, #e8b84b)' : 'rgba(255,255,255,.85)',
                                color: isSignature ? C.cd : C.tm,
                                fontSize: 10.5, letterSpacing: '.3px',
                            }}>
                                {isSignature && <Icon icon="solar:star-bold" width={10} style={{ marginRight: 3 }} />}{badgeLabel}
                            </span>
                            {hasVideo && (
                                <span className="text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1" style={{ background: 'rgba(0,0,0,.5)', color: '#fff', fontSize: 10, backdropFilter: 'blur(4px)' }}>
                                    <Icon icon="solar:play-circle-linear" width={12} />วิดีโอ
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Thumbnail strip */}
                    {hasMultiplePhotos && (
                        <div className="flex gap-1.5 px-4 py-2 overflow-x-auto" style={{ background: 'rgba(13,51,72,.95)', borderTop: '1px solid rgba(200,150,60,.1)' }}>
                            {allPhotos.map((src, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setActivePhoto(idx)}
                                    className="shrink-0 w-11 h-11 rounded-lg overflow-hidden transition-all"
                                    style={{
                                        border: idx === activePhoto ? '2px solid #e8b84b' : '2px solid transparent',
                                        opacity: idx === activePhoto ? 1 : .4,
                                    }}
                                    aria-label={`รูปที่ ${idx + 1}`}
                                >
                                    <img src={src} alt="" className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* ── Body ── */}
                <div className="px-6 sm:px-8 py-7" style={{ color: C.tx }}>
                    {/* Meta row */}
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest mb-3 flex-wrap" style={{ color: C.go, fontSize: 10 }}>
                        <span className="flex items-center gap-1">
                            <Icon icon="solar:map-point-wave-bold" width={12} style={{ color: C.cm }} />
                            คลอง{menu.canal_zone}
                        </span>
                        {menu.category && (<><span style={{ width: 3, height: 3, borderRadius: '50%', background: C.go, display: 'inline-block' }} /><span>{menu.category}</span></>)}
                        {menu.cooking_method && (<><span style={{ width: 3, height: 3, borderRadius: '50%', background: C.go, display: 'inline-block' }} /><span>{menu.cooking_method}</span></>)}
                    </div>

                    {/* Title */}
                    <h2 className="tracking-tight leading-tight mb-1.5" style={{ fontSize: 'clamp(20px, 4vw, 26px)', fontWeight: 700, color: C.cd }}>
                        {menu.menu_name}
                    </h2>
                    {menu.local_name && (
                        <p className="italic mb-5" style={{ fontSize: 13, color: C.tl }}>&quot;{menu.local_name}&quot;</p>
                    )}
                    {!menu.local_name && <div className="mb-5" />}

                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-4 mb-6" style={{ borderTop: `1px solid rgba(200,150,60,.12)`, borderBottom: `1px solid rgba(200,150,60,.12)` }}>
                        {menu.informant_name && menu.informant_name !== 'ไม่ระบุ' && (
                            <div><p style={{ fontSize: 9, color: C.go, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 3 }}>ผู้ให้ข้อมูล</p><p style={{ fontSize: 13.5, fontWeight: 600, color: C.cd }}>{menu.informant_name}</p></div>
                        )}
                        {menu.serving_size && (
                            <div><p style={{ fontSize: 9, color: C.go, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 3 }}>ปริมาณ</p><p style={{ fontSize: 13.5, fontWeight: 600, color: C.cd }}>{menu.serving_size}</p></div>
                        )}
                        {menu.taste_profile && (
                            <div><p style={{ fontSize: 9, color: C.go, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 3 }}>รสชาติ</p><p style={{ fontSize: 13.5, fontWeight: 600, color: C.cd }}>{menu.taste_profile}</p></div>
                        )}
                        {menu.heritage_status && (
                            <div><p style={{ fontSize: 9, color: C.go, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 3 }}>การสืบทอด</p><p style={{ fontSize: 13.5, fontWeight: 600, color: C.cd }}>{menu.heritage_status}</p></div>
                        )}
                    </div>

                    {/* Story */}
                    {menu.story && (
                        <section className="mb-7">
                            <SectionLabel icon="solar:document-text-bold-duotone">ประวัติและที่มา</SectionLabel>
                            <p style={{ fontSize: 13.5, color: C.tm, lineHeight: 1.85, fontWeight: 300 }}>{menu.story}</p>
                        </section>
                    )}

                    {/* Secret Tip */}
                    {menu.secret_tips && (
                        <div className="rounded-xl p-4 mb-7 flex gap-3 items-start" style={{ background: C.gp, border: `1px solid rgba(200,150,60,.2)` }}>
                            <Icon icon="solar:lightbulb-minimalistic-bold-duotone" style={{ color: C.go, fontSize: 20, flexShrink: 0, marginTop: 2 }} />
                            <div>
                                <p style={{ fontSize: 9, fontWeight: 700, color: C.gd, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 4 }}>เคล็ดลับความอร่อย</p>
                                <p className="italic" style={{ fontSize: 13, color: C.cd, lineHeight: 1.7 }}>&quot;{menu.secret_tips}&quot;</p>
                            </div>
                        </div>
                    )}

                    {/* Ingredients + Steps */}
                    {(menu.ingredients.length > 0 || menu.steps.length > 0) && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-7 mb-7">
                            {menu.ingredients.length > 0 && (
                                <section>
                                    <SectionLabel icon="solar:leaf-bold-duotone">
                                        วัตถุดิบ
                                        <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 500, background: 'rgba(26,107,138,.08)', color: C.cm, padding: '1px 7px', borderRadius: 6 }}>
                                            {menu.ingredients.length} รายการ
                                        </span>
                                    </SectionLabel>
                                    <div>
                                        {mainIngredients.map((ing, idx) => <IngredientRow key={`m-${idx}`} ing={ing} isMain />)}
                                        {otherIngredients.map((ing, idx) => <IngredientRow key={`o-${idx}`} ing={ing} />)}
                                    </div>
                                </section>
                            )}

                            {menu.steps.length > 0 && (
                                <section>
                                    <SectionLabel icon="solar:list-check-minimalistic-bold-duotone">วิธีทำ</SectionLabel>
                                    <div className="space-y-3">
                                        {menu.steps.map((step, idx) => (
                                            <div key={idx} className="flex gap-3">
                                                <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(26,107,138,.3)', minWidth: 20, paddingTop: 1 }}>
                                                    {String(idx + 1).padStart(2, '0')}
                                                </span>
                                                <p style={{ fontSize: 13, color: C.tm, lineHeight: 1.8, margin: 0 }}>{step}</p>
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
                            <div style={{ height: 1, background: 'rgba(200,150,60,.1)', marginBottom: 20 }} />
                            <section className="mb-7">
                                <SectionLabel icon="solar:heart-pulse-bold-duotone">คุณค่าทางโภชนาการ</SectionLabel>
                                <p style={{ fontSize: 13, color: C.tm, lineHeight: 1.8 }}>{menu.nutrition}</p>
                            </section>
                        </>
                    )}

                    {/* Videos */}
                    {hasVideo && (
                        <>
                            <div style={{ height: 1, background: 'rgba(200,150,60,.1)', marginBottom: 20 }} />
                            <section className="mb-7 space-y-5">
                                <SectionLabel icon="solar:videocamera-record-bold-duotone">วิดีโอ</SectionLabel>
                                {menu.video_url && (
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: C.cd }}>
                                                <Icon icon="solar:chef-hat-linear" style={{ color: '#fff', fontSize: 12 }} />
                                            </div>
                                            <p style={{ fontSize: 12, fontWeight: 600, color: C.cd }}>วิธีการปรุงอาหาร</p>
                                        </div>
                                        <div className="rounded-xl overflow-hidden" style={{ background: C.cd }}>
                                            <video src={menu.video_url} controls preload="metadata" className="w-full" style={{ aspectRatio: '16/9', objectFit: 'contain' }} />
                                        </div>
                                    </div>
                                )}
                                {menu.promo_video_url && (
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: C.cd }}>
                                                <Icon icon="solar:play-stream-linear" style={{ color: '#fff', fontSize: 12 }} />
                                            </div>
                                            <p style={{ fontSize: 12, fontWeight: 600, color: C.cd }}>วิดีโอแนะนำ</p>
                                        </div>
                                        <div className="rounded-xl overflow-hidden" style={{ background: C.cd }}>
                                            <video src={menu.promo_video_url} controls preload="metadata" className="w-full" style={{ aspectRatio: '16/9', objectFit: 'contain' }} />
                                        </div>
                                    </div>
                                )}
                            </section>
                        </>
                    )}

                    {/* Tags */}
                    {(
                        menu.health_benefits.filter(t => t && t !== 'อื่นๆ').length > 0 ||
                        menu.popularity.length > 0 ||
                        menu.seasonality.length > 0 ||
                        menu.rituals.filter(t => t && t !== 'อื่นๆ').length > 0 ||
                        menu.ingredient_sources.length > 0
                    ) && (
                        <div className="space-y-2.5" style={{ paddingTop: 16, borderTop: '1px solid rgba(200,150,60,.1)' }}>
                            {menu.health_benefits.filter(t => t && t !== 'อื่นๆ').length > 0 && <TagRow label="สรรพคุณ" tags={menu.health_benefits} />}
                            {menu.popularity.length > 0 && <TagRow label="ความนิยม" tags={menu.popularity} />}
                            {menu.seasonality.length > 0 && <TagRow label="ฤดูกาล" tags={menu.seasonality} />}
                            {menu.rituals.filter(t => t && t !== 'อื่นๆ').length > 0 && <TagRow label="ประเพณี" tags={menu.rituals} />}
                            {menu.ingredient_sources.length > 0 && <TagRow label="แหล่งวัตถุดิบ" tags={menu.ingredient_sources} />}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

/* ── Sub-components ── */

function SectionLabel({ children, icon }: { children: React.ReactNode; icon?: string }) {
    return (
        <p className="flex items-center gap-1.5 mb-3" style={{ fontSize: 10, color: '#c8963c', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px' }}>
            {icon && <Icon icon={icon} width={14} style={{ color: '#1a6b8a' }} />}
            {children}
        </p>
    )
}

function IngredientRow({ ing, isMain }: { ing: Ingredient; isMain?: boolean }) {
    return (
        <div className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid rgba(200,150,60,.08)' }}>
            <span style={{ fontSize: 13, fontWeight: isMain ? 600 : 400, color: isMain ? '#0d3348' : '#3d3d3d' }}>
                {ing.name}
                {isMain && <Icon icon="solar:star-bold" width={10} style={{ marginLeft: 4, color: '#e8b84b' }} />}
            </span>
            {(ing.quantity || ing.unit) && (
                <span style={{ fontSize: 12, color: '#6b6b6b', marginLeft: 8, flexShrink: 0 }}>
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
        <div className="flex items-center gap-1.5 flex-wrap">
            <span style={{ fontSize: 9, color: '#c8963c', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', width: 64, flexShrink: 0 }}>{label}</span>
            {filtered.map(t => (
                <span key={t} className="rounded-full" style={{ fontSize: 10.5, padding: '2px 9px', background: 'rgba(26,107,138,.06)', border: '1px solid rgba(26,107,138,.12)', color: '#1a6b8a', fontWeight: 500 }}>
                    {t}
                </span>
            ))}
        </div>
    )
}
