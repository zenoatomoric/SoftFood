'use client'

import { useEffect, useRef, useMemo } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

interface MapMenuItem {
    menu_id: string
    menu_name: string
    category: string
    canal_zone: string
    selection_status: string[]
    thumbnail: string | null
    gps_lat: number | null
    gps_long: number | null
}

interface Props {
    menus: MapMenuItem[]
    activeCanal?: string
    onMenuClick?: (menuId: string) => void
}

// All 3 canal colors
export const CANAL_COLORS: Record<string, string> = {
    'บางเขน':       '#3b82f6',   // blue
    'เปรมประชากร': '#f59e0b',   // amber
    'ลาดพร้าว':    '#10b981',   // green
}
const DEFAULT_COLOR = '#64748b'



/** Build a GeoJSON FeatureCollection from menus, with canal-zone color pre-baked in. */
function buildGeoJSON(
    menus: MapMenuItem[],
    canal: string,
): GeoJSON.FeatureCollection {
    const filtered = canal === 'all'
        ? menus
        : menus.filter(m => m.canal_zone === canal)

    return {
        type: 'FeatureCollection',
        features: filtered
            .filter(m => m.gps_lat != null && m.gps_long != null)
            .map(m => ({
                type: 'Feature',
                geometry: { type: 'Point', coordinates: [m.gps_long!, m.gps_lat!] },
                properties: {
                    menu_id:    m.menu_id,
                    menu_name:  m.menu_name,
                    category:   m.category,
                    canal_zone: m.canal_zone,
                    is_sig:     m.selection_status.includes('ซิกเนเจอร์') ? 1 : 0,
                    thumbnail:  m.thumbnail ?? '',
                    color:      CANAL_COLORS[m.canal_zone] ?? DEFAULT_COLOR,
                },
            })),
    }
}

export default function MapView({ menus, activeCanal = 'all', onMenuClick }: Props) {
    const containerRef = useRef<HTMLDivElement>(null)
    const mapRef       = useRef<maplibregl.Map | null>(null)
    const popupRef     = useRef<maplibregl.Popup | null>(null)
    // Keep a stable ref to the latest data so the one-time map init can access it
    const latestDataRef = useRef<{ menus: MapMenuItem[]; canal: string }>({ menus, canal: activeCanal })

    const geoMenus = useMemo(
        () => menus.filter(m => m.gps_lat != null && m.gps_long != null),
        [menus]
    )

    // Sync latest data ref whenever props change
    useEffect(() => {
        latestDataRef.current = { menus: geoMenus, canal: activeCanal }
    })

    /* ── One-time map initialization ── */
    useEffect(() => {
        if (!containerRef.current || mapRef.current) return

        const map = new maplibregl.Map({
            container: containerRef.current,
            style: 'https://tiles.openfreemap.org/styles/bright',
            center: [100.595, 13.862],
            zoom: 11.5,
            attributionControl: false,
            scrollZoom: false,
            fadeDuration: 300,
        })

        map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right')
        map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right')

        // Ctrl+scroll-to-zoom
        map.getCanvas().addEventListener('wheel', (e) => {
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault()
                map.zoomTo(map.getZoom() + (e.deltaY > 0 ? -0.5 : 0.5), { duration: 300 })
            }
        }, { passive: false })

        map.on('load', () => {
            const { menus: initMenus, canal: initCanal } = latestDataRef.current

            /* ── GeoJSON source (no clustering) ── */
            map.addSource('menus', {
                type: 'geojson',
                data: buildGeoJSON(initMenus, initCanal),
            })

            /* ── Layer 1: Glow ring (outer soft circle) ── */
            map.addLayer({
                id: 'point-glow',
                type: 'circle',
                source: 'menus',
                paint: {
                    'circle-color': ['get', 'color'],
                    'circle-radius': ['case', ['==', ['get', 'is_sig'], 1], 18, 13],
                    'circle-opacity': 0.18,
                    'circle-stroke-width': 0,
                },
            })

            /* ── Layer 2: Solid point ── */
            map.addLayer({
                id: 'point',
                type: 'circle',
                source: 'menus',
                paint: {
                    'circle-color': ['get', 'color'],
                    'circle-radius': ['case', ['==', ['get', 'is_sig'], 1], 12, 8],
                    'circle-stroke-width': 2.5,
                    'circle-stroke-color': '#ffffff',
                    'circle-opacity': 0.95,
                },
            })

            /* ── Click: point → popup ── */
            map.on('click', 'point', (e) => {
                const feat = e.features?.[0]
                if (!feat) return
                const p = feat.properties as Record<string, string>
                const coords = (feat.geometry as GeoJSON.Point).coordinates as [number, number]

                // Smooth zoom into the clicked marker
                map.easeTo({ center: coords, zoom: Math.max(map.getZoom(), 15), duration: 500 })

                popupRef.current?.remove()
                popupRef.current = new maplibregl.Popup({
                    offset: 16,
                    closeButton: false,
                    maxWidth: '280px',
                    className: 'canal-popup',
                })
                    .setLngLat(coords)
                    .setHTML(`
                        <div style="font-family:'Outfit','Prompt',sans-serif;min-width:200px;max-width:260px;">
                            ${p.thumbnail ? `
                                <div style="margin:-16px -16px 12px;border-radius:8px 8px 0 0;overflow:hidden;height:130px;">
                                    <img src="${p.thumbnail}" alt="${p.menu_name}" style="width:100%;height:100%;object-fit:cover;" />
                                </div>
                            ` : ''}
                            <div style="padding:${p.thumbnail ? '0 2px' : '0'}">
                                <p style="font-size:10px;font-weight:700;color:${p.color};text-transform:uppercase;letter-spacing:.08em;margin:0 0 4px;">
                                    คลอง${p.canal_zone} · ${p.category}
                                </p>
                                <p style="font-size:15px;font-weight:700;color:#0f172a;margin:0 0 10px;line-height:1.3;">
                                    ${p.menu_name}
                                </p>
                                <button onclick="window.__mapMenuClick&&window.__mapMenuClick('${p.menu_id}')"
                                    style="width:100%;padding:9px;border-radius:8px;border:none;background:#0f172a;color:white;font-size:13px;font-weight:600;cursor:pointer;">
                                    ดูรายละเอียด →
                                </button>
                            </div>
                        </div>
                    `)
                    .addTo(map)
            })

            /* ── Cursor feedback ── */
            const setCursor = (cursor: string) => () => { map.getCanvas().style.cursor = cursor }
            map.on('mouseenter', 'point', setCursor('pointer'))
            map.on('mouseleave', 'point', setCursor(''))
        })

        mapRef.current = map
        return () => {
            popupRef.current?.remove()
            map.remove()
            mapRef.current = null
        }
    }, []) // run once

    /* ── Update data when canal filter or menus change (no map move) ── */
    useEffect(() => {
        const map = mapRef.current
        if (!map) return

        const applyUpdate = () => {
            const src = map.getSource('menus') as maplibregl.GeoJSONSource | undefined
            if (!src) return
            src.setData(buildGeoJSON(geoMenus, activeCanal))
        }

        if (map.isStyleLoaded()) {
            applyUpdate()
        } else {
            map.once('load', applyUpdate)
        }
    }, [activeCanal, geoMenus])

    /* ── Global click bridge for popup buttons ── */
    useEffect(() => {
        if (onMenuClick) (window as any).__mapMenuClick = onMenuClick
        return () => { delete (window as any).__mapMenuClick }
    }, [onMenuClick])

    return (
        <div
            className="relative w-full rounded-2xl overflow-hidden border border-slate-200 shadow-lg"
            style={{ height: '500px' }}
        >
            <div ref={containerRef} className="w-full h-full" />

            {/* Legend */}
            <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-xl px-4 py-3 shadow-md border border-slate-100 space-y-1.5">
                {Object.entries(CANAL_COLORS).map(([zone, color]) => (
                    <div key={zone} className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: color }} />
                        <span className="text-sm text-slate-700 font-medium">คลอง{zone}</span>
                    </div>
                ))}
                {geoMenus.length < menus.length && (
                    <p className="text-xs text-slate-400 pt-1 border-t border-slate-100">แสดง {geoMenus.length}/{menus.length} รายการ</p>
                )}
            </div>
        </div>
    )
}
