'use client'

import { useState } from 'react'
import { changePassword } from './actions'
import { Icon } from '@iconify/react'

export default function ChangePasswordPage() {
    const [status, setStatus] = useState<{ error?: string; success?: string } | null>(null)
    const [loading, setLoading] = useState(false)
    const [showCurrentPassword, setShowCurrentPassword] = useState(false)
    const [showNewPassword, setShowNewPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [newPassword, setNewPassword] = useState('')

    // Password validation checks
    const hasMinLength = newPassword.length >= 8
    const hasUppercase = /[A-Z]/.test(newPassword)
    const hasLowercase = /[a-z]/.test(newPassword)
    const hasNumber = /[0-9]/.test(newPassword)
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(newPassword)
    const isPasswordValid = hasMinLength && hasUppercase && hasLowercase && hasNumber && hasSpecialChar

    async function handleSubmit(formData: FormData) {
        setLoading(true)
        setStatus(null)
        const result = await changePassword(formData)
        setStatus(result)
        setLoading(false)

        // Clear password fields on success
        if (result.success) {
            setNewPassword('')
            // Redirect to login page immediately as requested
            window.location.href = '/login'
        }
    }

    return (
        <div className="min-h-[100dvh] w-full flex flex-col items-center justify-center p-4 sm:p-6 bg-white font-sans overflow-hidden relative">

            {/* ประดับตกแต่งพื้นหลัง (ให้เข้ากับหน้า Login) */}
            <div className="absolute top-[-10%] right-[-10%] w-[200px] md:w-[300px] h-[200px] md:h-[300px] bg-gray-50 rounded-full blur-2xl md:blur-3xl opacity-50"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-[200px] md:w-[300px] h-[200px] md:h-[300px] bg-gray-50 rounded-full blur-2xl md:blur-3xl opacity-50"></div>

            {/* Top Left Brand Logo */}
            <div className="absolute top-4 left-4 md:top-6 md:left-6 z-10 flex items-center gap-2">
                <div className="bg-gray-900 text-white p-1.5 rounded-md flex items-center justify-center">
                    <Icon icon="solar:command-linear" className="w-4 h-4 md:w-5 md:h-5" />
                </div>
                <span className="text-sm md:text-base font-semibold tracking-tight text-gray-900">SOFT POWER</span>
            </div>

            {/* Main Card */}
            <div className="relative z-10 bg-white p-6 sm:p-10 md:p-16 rounded-[2rem] md:rounded-[3rem] shadow-[0_15px_40px_-15px_rgba(0,0,0,0.1)] md:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] w-full max-w-[600px] flex flex-col items-center border border-gray-100 animate-in fade-in slide-in-from-bottom-4 duration-700 mt-10 md:mt-0">

                {/* Header Icon */}
                <div className="w-14 h-14 md:w-16 md:h-16 bg-gray-50 rounded-xl md:rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center mb-6 md:mb-8">
                    <Icon icon="solar:lock-password-bold-duotone" className="w-7 h-7 md:w-8 md:h-8 text-gray-900" />
                </div>

                {/* Title & Subtitle */}
                <div className="text-center mb-8 md:mb-10">
                    <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight mb-2 md:mb-3">เปลี่ยนรหัสผ่าน</h1>
                    <p className="text-sm md:text-base text-gray-500 leading-relaxed max-w-[280px] sm:max-w-sm mx-auto font-medium">
                        จัดการความปลอดภัยของบัญชีผู้เก็บข้อมูลเพื่อความปลอดภัยสูงสุด
                    </p>
                </div>

                {/* Form */}
                <form action={handleSubmit} className="w-full space-y-4 md:space-y-5">

                    {/* SV Code Input */}
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3.5 md:pl-4 flex items-center pointer-events-none">
                            <Icon icon="solar:user-id-linear" className="w-5 h-5 text-gray-400 group-focus-within:text-gray-600 transition-colors" />
                        </div>
                        <input
                            name="sv_code"
                            type="text"
                            required
                            placeholder="รหัสประจำตัว (Account ID)"
                            className="block w-full rounded-xl md:rounded-2xl border-none bg-gray-50 py-3.5 md:py-4 pl-11 md:pl-12 pr-4 text-sm md:text-base text-gray-900 placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-gray-900/10 focus:outline-none transition-all duration-200 font-medium"
                        />
                    </div>

                    {/* Current Password Input */}
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3.5 md:pl-4 flex items-center pointer-events-none">
                            <Icon icon="solar:key-linear" className="w-5 h-5 text-gray-400 group-focus-within:text-gray-600 transition-colors" />
                        </div>
                        <input
                            name="currentPassword"
                            type={showCurrentPassword ? "text" : "password"}
                            required
                            placeholder="รหัสผ่านเดิม"
                            className="block w-full rounded-xl md:rounded-2xl border-none bg-gray-50 py-3.5 md:py-4 pl-11 md:pl-12 pr-11 md:pr-12 text-sm md:text-base text-gray-900 placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-gray-900/10 focus:outline-none transition-all duration-200 font-medium"
                        />
                        <button
                            type="button"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            className="absolute inset-y-0 right-0 pr-3 md:pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors p-2"
                        >
                            <Icon icon={showCurrentPassword ? "solar:eye-closed-linear" : "solar:eye-linear"} className="w-5 h-5" />
                        </button>
                    </div>

                    {/* New Password Input */}
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3.5 md:pl-4 flex items-center pointer-events-none">
                            <Icon icon="solar:lock-password-linear" className="w-5 h-5 text-gray-400 group-focus-within:text-gray-600 transition-colors" />
                        </div>
                        <input
                            name="newPassword"
                            type={showNewPassword ? "text" : "password"}
                            required
                            placeholder="รหัสผ่านใหม่"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="block w-full rounded-xl md:rounded-2xl border-none bg-gray-50 py-3.5 md:py-4 pl-11 md:pl-12 pr-11 md:pr-12 text-sm md:text-base text-gray-900 placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-gray-900/10 focus:outline-none transition-all duration-200 font-medium"
                        />
                        <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute inset-y-0 right-0 pr-3 md:pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors p-2"
                        >
                            <Icon icon={showNewPassword ? "solar:eye-closed-linear" : "solar:eye-linear"} className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Password Requirements */}
                    {newPassword && (
                        <div className="bg-gray-50 rounded-xl p-3 md:p-4 space-y-1.5 md:space-y-2">
                            <p className="text-[10px] md:text-xs font-bold text-gray-600 mb-1 md:mb-2 uppercase tracking-wide">ข้อกำหนดรหัสผ่าน:</p>
                            <div className="space-y-1.5 md:space-y-2 grid grid-cols-1 sm:grid-cols-2 gap-x-2">
                                <div className={`flex items-center gap-1.5 text-[11px] md:text-xs font-medium ${hasMinLength ? 'text-green-600' : 'text-gray-400'}`}>
                                    <Icon icon={hasMinLength ? "solar:check-circle-bold" : "solar:close-circle-linear"} className="w-3.5 h-3.5 md:w-4 md:h-4 shrink-0" />
                                    <span>อย่างน้อย 8 ตัวอักษร</span>
                                </div>
                                <div className={`flex items-center gap-1.5 text-[11px] md:text-xs font-medium ${hasUppercase ? 'text-green-600' : 'text-gray-400'}`}>
                                    <Icon icon={hasUppercase ? "solar:check-circle-bold" : "solar:close-circle-linear"} className="w-3.5 h-3.5 md:w-4 md:h-4 shrink-0" />
                                    <span>มีตัวพิมพ์ใหญ่ (A-Z)</span>
                                </div>
                                <div className={`flex items-center gap-1.5 text-[11px] md:text-xs font-medium ${hasLowercase ? 'text-green-600' : 'text-gray-400'}`}>
                                    <Icon icon={hasLowercase ? "solar:check-circle-bold" : "solar:close-circle-linear"} className="w-3.5 h-3.5 md:w-4 md:h-4 shrink-0" />
                                    <span>มีตัวพิมพ์เล็ก (a-z)</span>
                                </div>
                                <div className={`flex items-center gap-1.5 text-[11px] md:text-xs font-medium ${hasNumber ? 'text-green-600' : 'text-gray-400'}`}>
                                    <Icon icon={hasNumber ? "solar:check-circle-bold" : "solar:close-circle-linear"} className="w-3.5 h-3.5 md:w-4 md:h-4 shrink-0" />
                                    <span>มีตัวเลข (0-9)</span>
                                </div>
                                <div className={`flex items-center gap-1.5 text-[11px] md:text-xs font-medium ${hasSpecialChar ? 'text-green-600' : 'text-gray-400'} sm:col-span-2`}>
                                    <Icon icon={hasSpecialChar ? "solar:check-circle-bold" : "solar:close-circle-linear"} className="w-3.5 h-3.5 md:w-4 md:h-4 shrink-0" />
                                    <span>มีอักษรพิเศษ (!@#$%^&*)</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Confirm Password Input */}
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3.5 md:pl-4 flex items-center pointer-events-none">
                            <Icon icon="solar:shield-check-linear" className="w-5 h-5 text-gray-400 group-focus-within:text-gray-600 transition-colors" />
                        </div>
                        <input
                            name="confirmPassword"
                            type={showConfirmPassword ? "text" : "password"}
                            required
                            placeholder="ยืนยันรหัสผ่านใหม่"
                            className="block w-full rounded-xl md:rounded-2xl border-none bg-gray-50 py-3.5 md:py-4 pl-11 md:pl-12 pr-11 md:pr-12 text-sm md:text-base text-gray-900 placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-gray-900/10 focus:outline-none transition-all duration-200 font-medium"
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute inset-y-0 right-0 pr-3 md:pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors p-2"
                        >
                            <Icon icon={showConfirmPassword ? "solar:eye-closed-linear" : "solar:eye-linear"} className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Error Message */}
                    {status?.error && (
                        <div className="p-3 md:p-4 bg-red-50 text-red-600 text-xs md:text-sm font-bold rounded-xl md:rounded-2xl border border-red-100 flex items-center gap-2 animate-shake">
                            <Icon icon="solar:danger-circle-bold" className="w-5 h-5 flex-shrink-0" />
                            <span>{status.error}</span>
                        </div>
                    )}

                    {/* Success Message */}
                    {status?.success && (
                        <div className="p-3 md:p-4 bg-green-50 text-green-600 text-xs md:text-sm font-bold rounded-xl md:rounded-2xl border border-green-100 flex items-center gap-2">
                            <Icon icon="solar:check-circle-bold" className="w-5 h-5 flex-shrink-0" />
                            <span>{status.success}</span>
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading || !isPasswordValid}
                        className="w-full bg-gray-900 hover:bg-black text-white rounded-xl md:rounded-2xl py-3.5 md:py-4 text-base md:text-lg font-black transition-all shadow-lg md:shadow-xl md:shadow-gray-900/20 active:scale-[0.98] mt-2 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <>
                                <Icon icon="line-md:loading-twotone-loop" className="w-5 h-5" />
                                <span>กำลังดำเนินการ...</span>
                            </>
                        ) : (
                            "บันทึกรหัสผ่านใหม่"
                        )}
                    </button>
                </form>

                {/* Back to Login */}
                <div className="mt-6 md:mt-8">
                    <a href="/login" className="inline-flex items-center gap-1.5 md:gap-2 text-xs md:text-sm font-bold text-gray-400 hover:text-gray-900 transition-colors group p-2">
                        <Icon icon="solar:alt-arrow-left-linear" className="w-4 h-4 md:w-5 md:h-5 group-hover:-translate-x-1 transition-transform" />
                        กลับสู่หน้าเข้าสู่ระบบ
                    </a>
                </div>

                <p className="mt-8 md:mt-12 text-[10px] md:text-xs text-gray-300 font-bold tracking-widest uppercase">
                    © 2026 Soft Power Data Management System
                </p>
            </div>

        </div>
    )
}