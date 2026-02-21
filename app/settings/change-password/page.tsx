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
        <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 bg-white font-sans">

            {/* Top Left Brand Logo */}
            <div className="absolute top-6 left-6 z-10 flex items-center gap-2">
                <div className="bg-gray-900 text-white p-1 rounded-md flex items-center justify-center">
                    <Icon icon="solar:command-linear" width="16" height="16" />
                </div>
                <span className="text-base font-semibold tracking-tight text-gray-900">SOFT POWER</span>
            </div>

            {/* Main Card */}
            <div className="relative z-10 bg-white p-12 md:p-16 rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] w-full max-w-[600px] flex flex-col items-center border border-gray-100 animate-in fade-in slide-in-from-bottom-4 duration-700">

                {/* Header Icon */}
                <div className="w-16 h-16 bg-gray-50 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center mb-8">
                    <Icon icon="solar:lock-password-bold-duotone" width="28" height="28" className="text-gray-900" />
                </div>

                {/* Title & Subtitle */}
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-3">เปลี่ยนรหัสผ่าน</h1>
                    <p className="text-base text-gray-500 leading-relaxed max-w-sm mx-auto">
                        จัดการความปลอดภัยของบัญชีผู้เก็บข้อมูลเพื่อความปลอดภัยสูงสุด
                    </p>
                </div>

                {/* Form */}
                <form action={handleSubmit} className="w-full space-y-5">

                    {/* SV Code Input */}
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Icon icon="solar:user-id-linear" width="20" height="20" className="text-gray-400 group-focus-within:text-gray-600 transition-colors" />
                        </div>
                        <input
                            name="sv_code"
                            type="text"
                            required
                            placeholder="รหัสประจำตัว (Account ID)"
                            className="block w-full rounded-xl border-none bg-gray-50 py-4 pl-12 pr-12 text-base text-gray-900 placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-gray-900/10 focus:outline-none transition-all duration-200 font-medium"
                        />
                    </div>

                    {/* Current Password Input */}
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Icon icon="solar:key-linear" width="20" height="20" className="text-gray-400 group-focus-within:text-gray-600 transition-colors" />
                        </div>
                        <input
                            name="currentPassword"
                            type={showCurrentPassword ? "text" : "password"}
                            required
                            placeholder="รหัสผ่านเดิม"
                            className="block w-full rounded-xl border-none bg-gray-50 py-4 pl-12 pr-12 text-base text-gray-900 placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-gray-900/10 focus:outline-none transition-all duration-200 font-medium"
                        />
                        <button
                            type="button"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <Icon icon={showCurrentPassword ? "solar:eye-closed-linear" : "solar:eye-linear"} width="20" height="20" />
                        </button>
                    </div>

                    {/* New Password Input */}
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Icon icon="solar:lock-password-linear" width="20" height="20" className="text-gray-400 group-focus-within:text-gray-600 transition-colors" />
                        </div>
                        <input
                            name="newPassword"
                            type={showNewPassword ? "text" : "password"}
                            required
                            placeholder="รหัสผ่านใหม่"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="block w-full rounded-xl border-none bg-gray-50 py-4 pl-12 pr-12 text-base text-gray-900 placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-gray-900/10 focus:outline-none transition-all duration-200 font-medium"
                        />
                        <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <Icon icon={showNewPassword ? "solar:eye-closed-linear" : "solar:eye-linear"} width="20" height="20" />
                        </button>
                    </div>

                    {/* Password Requirements */}
                    {newPassword && (
                        <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                            <p className="text-xs font-semibold text-gray-600 mb-2">ข้อกำหนดรหัสผ่าน:</p>
                            <div className="space-y-1.5">
                                <div className={`flex items-center gap-2 text-xs ${hasMinLength ? 'text-green-600' : 'text-gray-400'}`}>
                                    <Icon icon={hasMinLength ? "solar:check-circle-bold" : "solar:close-circle-linear"} width="16" height="16" />
                                    <span>อย่างน้อย 8 ตัวอักษร</span>
                                </div>
                                <div className={`flex items-center gap-2 text-xs ${hasUppercase ? 'text-green-600' : 'text-gray-400'}`}>
                                    <Icon icon={hasUppercase ? "solar:check-circle-bold" : "solar:close-circle-linear"} width="16" height="16" />
                                    <span>มีตัวพิมพ์ใหญ่ (A-Z)</span>
                                </div>
                                <div className={`flex items-center gap-2 text-xs ${hasLowercase ? 'text-green-600' : 'text-gray-400'}`}>
                                    <Icon icon={hasLowercase ? "solar:check-circle-bold" : "solar:close-circle-linear"} width="16" height="16" />
                                    <span>มีตัวพิมพ์เล็ก (a-z)</span>
                                </div>
                                <div className={`flex items-center gap-2 text-xs ${hasNumber ? 'text-green-600' : 'text-gray-400'}`}>
                                    <Icon icon={hasNumber ? "solar:check-circle-bold" : "solar:close-circle-linear"} width="16" height="16" />
                                    <span>มีตัวเลข (0-9)</span>
                                </div>
                                <div className={`flex items-center gap-2 text-xs ${hasSpecialChar ? 'text-green-600' : 'text-gray-400'}`}>
                                    <Icon icon={hasSpecialChar ? "solar:check-circle-bold" : "solar:close-circle-linear"} width="16" height="16" />
                                    <span>มีอักษรพิเศษ (!@#$%^&*)</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Confirm Password Input */}
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Icon icon="solar:shield-check-linear" width="20" height="20" className="text-gray-400 group-focus-within:text-gray-600 transition-colors" />
                        </div>
                        <input
                            name="confirmPassword"
                            type={showConfirmPassword ? "text" : "password"}
                            required
                            placeholder="ยืนยันรหัสผ่านใหม่"
                            className="block w-full rounded-xl border-none bg-gray-50 py-4 pl-12 pr-12 text-base text-gray-900 placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-gray-900/10 focus:outline-none transition-all duration-200 font-medium"
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <Icon icon={showConfirmPassword ? "solar:eye-closed-linear" : "solar:eye-linear"} width="20" height="20" />
                        </button>
                    </div>

                    {/* Error Message */}
                    {status?.error && (
                        <div className="p-4 bg-red-50 text-red-600 text-sm font-medium rounded-xl border border-red-100 flex items-center gap-2 animate-shake">
                            <Icon icon="solar:danger-circle-bold" width="20" height="20" className="flex-shrink-0" />
                            <span>{status.error}</span>
                        </div>
                    )}

                    {/* Success Message */}
                    {status?.success && (
                        <div className="p-4 bg-green-50 text-green-600 text-sm font-medium rounded-xl border border-green-100 flex items-center gap-2">
                            <Icon icon="solar:check-circle-bold" width="20" height="20" className="flex-shrink-0" />
                            <span>{status.success}</span>
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading || !isPasswordValid}
                        className="w-full bg-gray-900 hover:bg-black text-white rounded-xl py-4 text-base font-bold transition-all shadow-xl shadow-gray-900/20 active:scale-[0.98] mt-4 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <>
                                <Icon icon="line-md:loading-twotone-loop" width="20" height="20" />
                                <span>กำลังดำเนินการ...</span>
                            </>
                        ) : (
                            "บันทึกรหัสผ่านใหม่"
                        )}
                    </button>
                </form>

                {/* Back to Login */}
                <div className="mt-8">
                    <a href="/login" className="inline-flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-gray-900 transition-colors group">
                        <Icon icon="solar:alt-arrow-left-linear" width="16" height="16" className="group-hover:-translate-x-1 transition-transform" />
                        กลับสู่หน้าเข้าสู่ระบบ
                    </a>
                </div>

                <p className="mt-12 text-sm text-gray-400 font-medium">
                    © 2026 Fieldwork Data System
                </p>
            </div>

        </div>
    )
}