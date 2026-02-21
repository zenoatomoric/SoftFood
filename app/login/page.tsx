// src/app/login/page.tsx
"use client";

import { useState } from "react";
import { login } from "./actions";
import { Icon } from "@iconify/react";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const result = await login(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else if (result?.success) {
      window.location.href = '/home';
    }
  }

  return (
    // เปลี่ยน min-h-screen เป็น min-h-[100dvh] เพื่อรองรับเบราว์เซอร์มือถือได้ดีขึ้น
    <div className="min-h-[100dvh] w-full flex flex-col items-center justify-center p-4 sm:p-6 bg-white font-sans overflow-hidden relative">
      {/* ประดับตกแต่งพื้นหลัง */}
      <div className="absolute top-[-10%] right-[-10%] w-[200px] md:w-[300px] h-[200px] md:h-[300px] bg-gray-50 rounded-full blur-2xl md:blur-3xl opacity-50"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[200px] md:w-[300px] h-[200px] md:h-[300px] bg-gray-50 rounded-full blur-2xl md:blur-3xl opacity-50"></div>

      {/* Top Left Brand Logo */}
      <div className="absolute top-4 left-4 md:top-6 md:left-6 z-10 flex items-center gap-2">
        <div className="bg-gray-900 text-white p-1.5 rounded-md flex items-center justify-center">
          <Icon icon="solar:command-linear" className="w-4 h-4 md:w-5 md:h-5" />
        </div>
        <span className="text-sm md:text-base font-semibold tracking-tight text-gray-900">
          SOFT POWER
        </span>
      </div>

      {/* Main Card */}
      {/* ปรับ Padding และ Border Radius ให้เล็กลงในหน้าจอมือถือ (p-6, rounded-[2rem]) */}
      <div className="relative z-10 bg-white p-6 sm:p-10 md:p-16 rounded-[2rem] md:rounded-[3rem] shadow-[0_15px_40px_-15px_rgba(0,0,0,0.1)] md:shadow-[0_30px_70px_-20px_rgba(0,0,0,0.1)] w-full max-w-[550px] flex flex-col items-center border border-gray-50 animate-in fade-in slide-in-from-bottom-6 duration-1000 mt-10 md:mt-0">

        {/* Header Icon */}
        <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-900 rounded-[1.5rem] md:rounded-[2rem] shadow-xl md:shadow-2xl shadow-gray-900/20 flex items-center justify-center mb-6 md:mb-10 transform hover:scale-105 transition-transform duration-300">
          <Icon
            icon="solar:shield-user-bold-duotone"
            className="text-white w-8 h-8 md:w-9 md:h-9"
          />
        </div>

        {/* Title & Subtitle */}
        <div className="text-center mb-8 md:mb-12">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 tracking-tight mb-2 md:mb-4">
            ยินดีต้อนรับ
          </h1>
          <p className="text-sm md:text-base text-gray-500 leading-relaxed max-w-[280px] sm:max-w-sm mx-auto font-medium">
            กรุณาเข้าสู่ระบบเพื่อจัดการข้อมูลโครงการ <br className="hidden sm:block" />
            <span className="text-gray-900 font-bold">
              อาหารพื้นถิ่นไทย (400 รายการ)
            </span>
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="w-full space-y-4 md:space-y-6">

          {/* SV Code Input */}
          <div className="space-y-1.5 md:space-y-2">
            <label className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">
              Account ID
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 md:pl-5 flex items-center pointer-events-none">
                <Icon
                  icon="solar:user-id-linear"
                  className="text-gray-400 group-focus-within:text-gray-900 transition-colors w-5 h-5 md:w-[22px] md:h-[22px]"
                />
              </div>
              <input
                name="sv_code"
                type="text"
                required
                placeholder="รหัสประจำตัว (SV Code)"
                className="block w-full rounded-xl md:rounded-2xl border-2 border-gray-50 bg-gray-50/50 py-3.5 md:py-4 pl-12 md:pl-14 pr-4 text-sm md:text-base text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-gray-900/10 focus:ring-4 focus:ring-gray-900/5 focus:outline-none transition-all duration-300 font-bold"
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1.5 md:space-y-2">
            <label className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">
              Security Key
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 md:pl-5 flex items-center pointer-events-none">
                <Icon
                  icon="solar:lock-password-linear"
                  className="text-gray-400 group-focus-within:text-gray-900 transition-colors w-5 h-5 md:w-[22px] md:h-[22px]"
                />
              </div>
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                required
                placeholder="รหัสผ่าน"
                className="block w-full rounded-xl md:rounded-2xl border-2 border-gray-50 bg-gray-50/50 py-3.5 md:py-4 pl-12 md:pl-14 pr-12 md:pr-14 text-sm md:text-base text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-gray-900/10 focus:ring-4 focus:ring-gray-900/5 focus:outline-none transition-all duration-300 font-bold"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 md:pr-5 flex items-center text-gray-400 hover:text-gray-900 transition-colors p-2"
              >
                <Icon
                  icon={showPassword ? "solar:eye-closed-linear" : "solar:eye-linear"}
                  className="w-5 h-5 md:w-[22px] md:h-[22px]"
                />
              </button>
            </div>
          </div>

          {/* Forgot/Change Password */}
          <div className="flex justify-end pt-1">
            <a
              href="/settings/change-password"
              className="text-xs md:text-sm font-bold text-gray-400 hover:text-gray-900 transition-colors p-1"
            >
              เปลี่ยนรหัสผ่าน
            </a>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 md:p-4 bg-red-50 text-red-600 text-xs md:text-sm font-bold rounded-xl md:rounded-2xl border border-red-100 text-center animate-bounce">
              <Icon
                icon="solar:danger-circle-bold-duotone"
                className="inline mr-2"
                width="18"
              />
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gray-900 hover:bg-black text-white rounded-xl md:rounded-[1.5rem] py-4 md:py-5 text-base md:text-lg font-black transition-all shadow-lg md:shadow-2xl md:shadow-gray-900/30 active:scale-95 mt-2 md:mt-4 flex items-center justify-center gap-2 md:gap-3 disabled:opacity-50 disabled:active:scale-100"
          >
            {loading ? (
              <>
                <Icon icon="line-md:loading-twotone-loop" className="w-5 h-5 md:w-6 md:h-6" />
                <span>กำลังยืนยันตัวตน...</span>
              </>
            ) : (
              <>
                <span>เข้าสู่ระบบ</span>
                <Icon icon="solar:login-3-linear" className="w-5 h-5 md:w-6 md:h-6" />
              </>
            )}
          </button>
        </form>

        <p className="mt-8 md:mt-16 text-[10px] md:text-xs text-gray-300 font-bold tracking-widest uppercase text-center">
          © 2026 Soft Power Data Management System
        </p>
      </div>
    </div>
  );
}