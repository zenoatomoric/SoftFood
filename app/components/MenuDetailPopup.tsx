'use client'

/**
 * MenuDetailPopup — Canal-themed, compact, z-index above everything
 */

import { Icon } from '@iconify/react'
import { useEffect, useState } from 'react'

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
    social_value?: string
    awards_references?: string
    consumption_freq?: string[] | string
    complexity?: string[] | string
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
    cr: '#fbf9f4', cd2: '#efe9dd', ow: '#ffffff', tx: '#1a1a2e', tm: '#3d3d3d', tl: '#6b6b6b',
}

export function MenuDetailPopup({ menu, visible, onCloseAction }: Props) {
    const [activePhoto, setActivePhoto] = useState(0)

    // Reset carousel when switching to a different menu — this popup is a single
    // reused instance (it doesn't unmount on close), so without this the stale
    // index can point past a shorter photo list and break the image.
    useEffect(() => { setActivePhoto(0) }, [menu?.menu_id])

    if (!menu) return null

    const isSignature = menu.selection_status.includes('ซิกเนเจอร์')
    const mainIngredients = menu.ingredients.filter(i => i.is_main)
    const otherIngredients = menu.ingredients.filter(i => !i.is_main)

    const allPhotos = (() => {
        const isSigOrRec = menu.selection_status.includes('ซิกเนเจอร์') || menu.selection_status.includes('36')
        const photos = [menu.thumbnail, ...(menu.photos || [])].filter(Boolean) as string[]
        const uniquePhotos = Array.from(new Set(photos))
        if (isSigOrRec && uniquePhotos.length > 0) return uniquePhotos
        if (menu.category?.includes('คาว')) return ['/menu2.png']
        if (menu.category?.includes('หวาน')) return ['/menu3.png']
        return ['/menu1.png']
    })()

    const hasMultiplePhotos = allPhotos.filter(Boolean).length > 1
    const hasVideo = isSignature && !!(menu.video_url || menu.promo_video_url)
    const hasMediaPair = hasVideo && allPhotos.length > 0
    const consumptionFreq = toTags(menu.consumption_freq)
    const complexity = toTags(menu.complexity)

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
            style={{ zIndex: 9999, fontFamily: "'Kanit', sans-serif" }}
        >
            {/* Backdrop */}
            <div
                className={`fixed inset-0 transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}
                style={{ background: 'rgba(7,33,47,.65)', backdropFilter: 'blur(6px)' }}
                onClick={onCloseAction}
            />

            <div
                className={`relative w-full overflow-hidden my-4 sm:my-6 transition-all duration-300 ${visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-3 scale-[0.97]'}`}
                style={{
                    maxWidth: '900px',
                    borderRadius: '24px',
                    background: C.ow,
                    boxShadow: '0 30px 90px rgba(0,0,0,.45), 0 0 0 1px rgba(200,150,60,.08)',
                }}
            >
                <button
                    onClick={onCloseAction}
                    className="absolute top-4 right-4 z-10 w-[42px] h-[42px] rounded-full grid place-items-center transition-all active:scale-95"
                    style={{ background: 'rgba(13,51,72,.9)', color: '#fff', boxShadow: '0 4px 14px rgba(0,0,0,.25)' }}
                    aria-label="ปิด"
                >
                    <Icon icon="solar:close-circle-bold" style={{ color: '#fff', fontSize: 22 }} />
                </button>

                <div className="px-6 sm:px-9 pt-8" style={{ color: C.tx }}>
                    <span className="inline-flex items-center gap-1.5 mb-3 rounded-full" style={{
                        background: isSignature ? 'linear-gradient(135deg, #c8963c, #e8b84b)' : C.gp,
                        color: C.cd,
                        fontSize: 12.5,
                        fontWeight: 700,
                        padding: '6px 14px',
                    }}>
                        {isSignature && <Icon icon="solar:star-bold" width={13} />}
                        {badgeLabel}
                    </span>
                    {/* Title */}
                    <h2 className="tracking-tight leading-tight" style={{ fontSize: 'clamp(27px, 3.4vw, 34px)', fontWeight: 700, color: C.cd }}>
                        {menu.menu_name}
                    </h2>
                    {(menu.local_name || menu.other_name) && (
                        <p className="italic mt-1.5" style={{ fontSize: 15.5, color: C.tl }}>
                            &quot;{[menu.local_name, menu.other_name].filter(Boolean).join(' / ')}&quot;
                        </p>
                    )}
                </div>

                {/* Media pair */}
                <div className={`grid grid-cols-1 ${hasMediaPair ? 'md:grid-cols-2' : ''} gap-[18px] px-6 sm:px-9 pt-6 pb-2 items-start`}>
                    <div>
                        <MediaLabel icon="solar:gallery-bold-duotone">ภาพเมนู</MediaLabel>
                        <div className="relative overflow-hidden" style={{ aspectRatio: '16/10', borderRadius: 16, background: 'linear-gradient(135deg,#1a6b8a,#0d3348)', boxShadow: '0 3px 16px rgba(13,51,72,.07)' }}>
                            <img
                                key={allPhotos[activePhoto]}
                                src={allPhotos[activePhoto]}
                                alt={menu.menu_name}
                                className="w-full h-full object-cover transition-opacity duration-300"
                            />
                            {hasMultiplePhotos && (
                                <div className="absolute top-3 left-3 text-xs font-semibold px-2.5 py-1 rounded-full tabular-nums" style={{ background: 'rgba(0,0,0,.45)', color: '#fff', backdropFilter: 'blur(4px)', fontSize: 11 }}>
                                    {activePhoto + 1} / {allPhotos.length}
                                </div>
                            )}
                            {hasMultiplePhotos && (
                                <>
                                    <button onClick={prevPhoto} className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center transition-all" style={{ background: 'rgba(0,0,0,.38)', backdropFilter: 'blur(4px)' }} aria-label="ก่อนหน้า">
                                        <Icon icon="solar:alt-arrow-left-linear" style={{ color: '#fff', fontSize: 18 }} />
                                    </button>
                                    <button onClick={nextPhoto} className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center transition-all" style={{ background: 'rgba(0,0,0,.38)', backdropFilter: 'blur(4px)' }} aria-label="ถัดไป">
                                        <Icon icon="solar:alt-arrow-right-linear" style={{ color: '#fff', fontSize: 18 }} />
                                    </button>
                                </>
                            )}
                        </div>
                        {hasMultiplePhotos && (
                            <div className="flex gap-2 mt-2 overflow-x-auto">
                                {allPhotos.map((src, idx) => (
                                    <button
                                        key={src}
                                        onClick={() => setActivePhoto(idx)}
                                        className="shrink-0 rounded-lg overflow-hidden transition-all"
                                        style={{
                                            width: 72,
                                            aspectRatio: '16/10',
                                            border: idx === activePhoto ? '2px solid #c8963c' : '2px solid transparent',
                                            opacity: idx === activePhoto ? 1 : .62,
                                        }}
                                        aria-label={`รูปที่ ${idx + 1}`}
                                    >
                                        <img src={src} alt="" className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {hasVideo && (
                        <div>
                            <MediaLabel icon="solar:videocamera-record-bold-duotone">
                                วิดีโอแนะนำ <span style={{ color: C.tl, fontWeight: 400, letterSpacing: 0, textTransform: 'none' }}>(เฉพาะ Signature)</span>
                            </MediaLabel>
                            <div className="space-y-3">
                                {menu.video_url && (
                                    <VideoBox src={menu.video_url} label="วิธีการปรุงอาหาร" icon="solar:chef-hat-linear" />
                                )}
                                {menu.promo_video_url && (
                                    <VideoBox src={menu.promo_video_url} label="วิดีโอแนะนำ" icon="solar:play-stream-linear" />
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Body */}
                <div className="px-6 sm:px-9 pt-4 pb-10" style={{ color: C.tx }}>
                    {/* Meta grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 my-1 p-[18px]" style={{ background: C.cr, border: `1px solid ${C.cd2}`, borderRadius: 14 }}>
                        <MetaItem label="ผู้ให้ข้อมูล" value={menu.informant_name !== 'ไม่ระบุ' ? menu.informant_name : ''} />
                        <MetaItem label="ที่อยู่ / ชุมชน" value={menu.address || `คลอง${menu.canal_zone}`} />
                        <MetaItem label="ปริมาณ" value={menu.serving_size} />
                        <MetaItem label="รสชาติ" value={menu.taste_profile} />
                        <MetaItem label="วิธีปรุง" value={menu.cooking_method} />
                        <MetaItem label="การสืบทอด" value={menu.heritage_status} />
                    </div>

                    {menu.story && (
                        <section>
                            <SectionLabel icon="solar:document-text-bold-duotone">ประวัติและที่มา</SectionLabel>
                            <p style={{ fontSize: 16.5, color: C.tm, lineHeight: 2, fontWeight: 300 }}>{menu.story}</p>
                        </section>
                    )}

                    {menu.secret_tips && (
                        <section>
                            <SectionLabel icon="solar:lightbulb-bold-duotone">เคล็ดลับ</SectionLabel>
                            <InfoBlock>{menu.secret_tips}</InfoBlock>
                        </section>
                    )}

                    {menu.ingredients.length > 0 && (
                        <section>
                            <SectionLabel icon="solar:leaf-bold-duotone">วัตถุดิบ</SectionLabel>
                            <IngredientTable ingredients={[...mainIngredients, ...otherIngredients]} />
                        </section>
                    )}

                    {menu.steps.length > 0 && (
                        <section>
                            <SectionLabel icon="solar:list-check-minimalistic-bold-duotone">วิธีทำ</SectionLabel>
                            <ol className="flex flex-col gap-3 list-none p-0 m-0" style={{ counterReset: 'step' }}>
                                {menu.steps.map((step, idx) => (
                                    <li key={idx} className="relative pl-11" style={{ fontSize: 16, lineHeight: 1.75, color: C.tm, fontWeight: 300, minHeight: 32 }}>
                                        <span className="absolute left-0 top-0 grid place-items-center rounded-full" style={{ width: 30, height: 30, background: 'linear-gradient(135deg,#c8963c,#e8b84b)', color: C.cd, fontSize: 13, fontWeight: 700 }}>
                                            {idx + 1}
                                        </span>
                                        {step}
                                    </li>
                                ))}
                            </ol>
                        </section>
                    )}

                    {menu.nutrition && (
                        <section>
                            <SectionLabel icon="solar:heart-pulse-bold-duotone">คุณค่าทางโภชนาการ</SectionLabel>
                            <InfoBlock>{menu.nutrition}</InfoBlock>
                        </section>
                    )}

                    {menu.social_value && (
                        <section>
                            <SectionLabel icon="solar:users-group-rounded-bold-duotone">คุณค่าทางสังคมและวัฒนธรรม</SectionLabel>
                            <InfoBlock>{menu.social_value}</InfoBlock>
                        </section>
                    )}

                    {menu.awards_references && (
                        <section>
                            <SectionLabel icon="solar:cup-star-bold-duotone">รางวัล / อ้างอิง</SectionLabel>
                            <InfoBlock>{menu.awards_references}</InfoBlock>
                        </section>
                    )}

                    {(
                        menu.health_benefits.filter(t => t && t !== 'อื่นๆ').length > 0 ||
                        menu.popularity.length > 0 ||
                        menu.seasonality.length > 0 ||
                        menu.rituals.filter(t => t && t !== 'อื่นๆ').length > 0 ||
                        menu.ingredient_sources.length > 0 ||
                        consumptionFreq.length > 0 ||
                        complexity.length > 0
                    ) && (
                        <section>
                            <SectionLabel icon="solar:tag-horizontal-bold-duotone">ข้อมูลเพิ่มเติม</SectionLabel>
                            {menu.health_benefits.filter(t => t && t !== 'อื่นๆ').length > 0 && <TagRow label="สรรพคุณ" tags={menu.health_benefits} />}
                            {menu.popularity.length > 0 && <TagRow label="ความนิยม" tags={menu.popularity} />}
                            {menu.seasonality.length > 0 && <TagRow label="ฤดูกาล" tags={menu.seasonality} />}
                            {menu.rituals.filter(t => t && t !== 'อื่นๆ').length > 0 && <TagRow label="ประเพณี" tags={menu.rituals} />}
                            {menu.ingredient_sources.length > 0 && <TagRow label="แหล่งวัตถุดิบ" tags={menu.ingredient_sources} />}
                            {consumptionFreq.length > 0 && <TagRow label="ความถี่" tags={consumptionFreq} />}
                            {complexity.length > 0 && <TagRow label="ความยากง่าย" tags={complexity} />}
                        </section>
                    )}
                </div>
            </div>
        </div>
    )
}

/* ── Sub-components ── */

function SectionLabel({ children, icon }: { children: React.ReactNode; icon?: string }) {
    return (
        <p className="inline-flex items-center gap-2" style={{ fontSize: 12.5, color: '#c8963c', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', margin: '28px 0 13px' }}>
            {icon && <Icon icon={icon} width={16} style={{ color: '#1a6b8a' }} />}
            {children}
        </p>
    )
}

function MediaLabel({ children, icon }: { children: React.ReactNode; icon: string }) {
    return (
        <div className="inline-flex items-center gap-2 mb-2.5" style={{ fontSize: 11.5, color: '#c8963c', fontWeight: 700, letterSpacing: '1.2px', textTransform: 'uppercase' }}>
            <Icon icon={icon} width={15} style={{ color: '#1a6b8a' }} />
            {children}
        </div>
    )
}

function MetaItem({ label, value }: { label: string; value?: string }) {
    if (!value) return null
    return (
        <div>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '1.2px', textTransform: 'uppercase', color: '#c8963c', marginBottom: 3 }}>{label}</div>
            <div style={{ fontSize: 15.5, fontWeight: 600, color: '#0d3348', lineHeight: 1.4 }}>{value}</div>
        </div>
    )
}

function VideoBox({ src, label, icon }: { src: string; label: string; icon: string }) {
    return (
        <div>
            <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: '#0d3348' }}>
                    <Icon icon={icon} style={{ color: '#fff', fontSize: 14 }} />
                </div>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#0d3348' }}>{label}</p>
            </div>
            <div className="overflow-hidden" style={{ aspectRatio: '16/10', borderRadius: 16, border: '1px solid #efe9dd', background: '#0b2330', boxShadow: '0 3px 16px rgba(13,51,72,.07)' }}>
                <video src={src} controls preload="metadata" className="w-full h-full" style={{ objectFit: 'contain' }} />
            </div>
        </div>
    )
}

function InfoBlock({ children }: { children: React.ReactNode }) {
    return (
        <div style={{ background: '#fbf9f4', border: '1px solid #efe9dd', borderRadius: 12, padding: '16px 18px', fontSize: 16, lineHeight: 1.95, color: '#3d3d3d', fontWeight: 300 }}>
            {children}
        </div>
    )
}

function IngredientTable({ ingredients }: { ingredients: Ingredient[] }) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full border-collapse" style={{ fontSize: 14.5 }}>
                <thead>
                    <tr>
                        <IngredientHeader>ชื่อ</IngredientHeader>
                        <IngredientHeader center>ปริมาณ</IngredientHeader>
                        <IngredientHeader center>หน่วย</IngredientHeader>
                        <IngredientHeader>หมายเหตุ</IngredientHeader>
                    </tr>
                </thead>
                <tbody>
                    {ingredients.map((ing, idx) => (
                        <tr key={`${ing.name}-${idx}`}>
                            <IngredientCell main={ing.is_main}>
                                {ing.name}
                                {ing.is_main && <span style={{ fontSize: 9, background: '#fdecec', color: '#c0392b', padding: '1px 7px', borderRadius: 10, fontWeight: 700, marginLeft: 6 }}>หลัก</span>}
                            </IngredientCell>
                            <IngredientCell center>{ing.quantity}</IngredientCell>
                            <IngredientCell center>{ing.unit}</IngredientCell>
                            <IngredientCell>{ing.note}</IngredientCell>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

function IngredientHeader({ children, center }: { children: React.ReactNode; center?: boolean }) {
    return (
        <th style={{ textAlign: center ? 'center' : 'left', fontSize: 10, textTransform: 'uppercase', letterSpacing: '1px', color: '#6b6b6b', borderBottom: '1.5px solid #efe9dd', padding: '8px 6px', fontWeight: 700 }}>
            {children}
        </th>
    )
}

function IngredientCell({ children, center, main }: { children: React.ReactNode; center?: boolean; main?: boolean }) {
    return (
        <td style={{ textAlign: center ? 'center' : 'left', padding: '9px 6px', borderBottom: '1px solid #f1ede5', color: main ? '#0d3348' : '#3d3d3d', fontWeight: main ? 500 : 300 }}>
            {children}
        </td>
    )
}

function TagRow({ label, tags }: { label: string; tags: string[] }) {
    const filtered = tags.filter(t => t && t !== 'อื่นๆ')
    if (!filtered.length) return null
    return (
        <div className="flex gap-3 items-start mb-3">
            <span style={{ fontSize: 10, color: '#c8963c', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.8px', width: 96, flexShrink: 0, paddingTop: 6 }}>{label}</span>
            <div className="flex flex-wrap gap-1.5">
                {filtered.map(t => (
                    <span key={t} className="rounded-full" style={{ fontSize: 12.5, padding: '5px 12px', background: '#fff', border: '1px solid #efe9dd', color: '#3d3d3d' }}>
                        {t}
                    </span>
                ))}
            </div>
        </div>
    )
}

function toTags(value: string[] | string | null | undefined) {
    if (Array.isArray(value)) return value
    if (typeof value === 'string' && value.trim()) return [value]
    return []
}
