'use client'

import { useState, useEffect, useCallback } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Icon } from '@iconify/react'

// Fix Leaflet marker icon issue in Next.js
const defaultIcon = L.icon({
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
})

interface MapPickerProps {
    initialLat?: number
    initialLong?: number
    onSelectAction: (lat: number, lng: number) => void
    onCloseAction: () => void
}

// Map Controller to handle centering and zoom
function MapController({ center, zoom }: { center: L.LatLng, zoom: number }) {
    const map = useMap()
    useEffect(() => {
        map.setView(center, zoom, { animate: true })
    }, [center, zoom, map])
    return null
}

function LocationMarker({ position, setPosition }: { position: L.LatLng | null, setPosition: (pos: L.LatLng) => void }) {
    useMapEvents({
        click(e: L.LeafletMouseEvent) {
            setPosition(e.latlng)
        },
    })

    return position === null ? null : (
        <Marker position={position} icon={defaultIcon} />
    )
}

export default function MapPicker({ initialLat, initialLong, onSelectAction, onCloseAction }: MapPickerProps) {
    const [position, setPosition] = useState<L.LatLng>(
        initialLat && initialLong ? L.latLng(initialLat, initialLong) : L.latLng(13.7563, 100.5018) // Default to Bangkok
    )
    const [zoom, setZoom] = useState(17)

    const handleLocateMe = useCallback(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const newPos = L.latLng(pos.coords.latitude, pos.coords.longitude)
                    setPosition(newPos)
                    setZoom(17)
                },
                (err) => {
                    console.error('Geolocation error:', err)
                }
            )
        }
    }, [])

    // ป้องกันการ Scroll หน้าจอด้านหลังและตรวจหาตำแหน่งปัจจุบันเมื่อเปิดครั้งแรก
    useEffect(() => {
        document.body.style.overflow = 'hidden'

        // ถ้าไม่มีพิกัดตั้งต้น ให้พยายามหาตำแหน่งปัจจุบัน
        if (!initialLat || !initialLong) {
            handleLocateMe()
        }

        return () => {
            document.body.style.overflow = 'auto'
        }
    }, [handleLocateMe, initialLat, initialLong])

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[80vh] sm:h-[85vh]">

                {/* Header */}
                <div className="p-4 sm:p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                    <div>
                        <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                            <Icon icon="solar:map-point-bold-duotone" className="text-indigo-600 text-3xl" />
                            ปักหมุดตำแหน่ง
                        </h3>
                        <p className="text-sm font-medium text-slate-500 mt-1">คลิกบนแผนที่เพื่อเลือกตำแหน่งที่ต้องการ</p>
                    </div>
                    <button onClick={onCloseAction} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                        <Icon icon="solar:close-circle-bold" className="text-3xl text-slate-400 hover:text-slate-600" />
                    </button>
                </div>

                {/* Map Area */}
                <div className="flex-1 relative z-0">
                    <MapContainer
                        center={position}
                        zoom={zoom}
                        style={{ height: '100%', width: '100%' }}
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                        />
                        <LocationMarker position={position} setPosition={setPosition} />
                        <MapController center={position} zoom={zoom} />
                    </MapContainer>

                    {/* Locate Me Button Overlay */}
                    <button
                        onClick={handleLocateMe}
                        className="absolute bottom-6 right-6 z-[400] p-4 bg-white hover:bg-slate-50 text-indigo-600 rounded-2xl shadow-xl transition-all border border-slate-200 group active:scale-95"
                        title="ตำแหน่งปัจจุบัน"
                    >
                        <Icon icon="solar:gps-bold-duotone" className="text-3xl group-hover:scale-110 transition-transform" />
                    </button>
                </div>

                {/* Footer Controls */}
                <div className="p-4 sm:p-8 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-sm sm:text-base font-bold text-slate-700 bg-white px-8 py-4 rounded-2xl border border-slate-200 shadow-sm w-full sm:w-auto text-center">
                        {position ? `${position.lat.toFixed(6)}, ${position.lng.toFixed(6)}` : 'ยังไม่ได้เลือกตำแหน่ง'}
                    </div>

                    <div className="flex gap-3 w-full sm:w-auto">
                        <button
                            onClick={onCloseAction}
                            className="flex-1 sm:flex-none px-6 py-3.5 bg-white border border-slate-200 text-slate-700 rounded-2xl font-bold hover:bg-slate-100 transition-all shadow-sm flex items-center justify-center gap-2"
                        >
                            ยกเลิก
                        </button>
                        <button
                            onClick={() => position && onSelectAction(position.lat, position.lng)}
                            disabled={!position}
                            className="flex-1 sm:flex-none px-8 py-3.5 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            <Icon icon="solar:check-circle-bold" className="text-2xl" />
                            ยืนยันตำแหน่ง
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}