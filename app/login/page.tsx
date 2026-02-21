// src/app/login/page.tsx
"use client";

import { useState } from "react";
// ลบ import { signIn } from 'next-auth/react' ออก
// ลบ import { useRouter, useSearchParams } from 'next/navigation' ออก (เพราะ Server Action จัดการ Redirect ให้แล้ว)
import { login } from "./actions"; // Import Server Action ที่เราเขียนเอง
import { Icon } from "@iconify/react";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // ใช้ Server Action ผ่าน Event Handler
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); // ป้องกันการ reload หน้า
    setLoading(true);
    setError(null);

    // สร้าง FormData จาก form element
    const formData = new FormData(event.currentTarget);

    // เรียกใช้ฟังก์ชัน login จาก actions.ts โดยตรง
    const result = await login(formData);

    // ถ้า Server Action ส่งค่า Error กลับมา (แปลว่า Login ไม่ผ่าน)
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else if (result?.success) {
      // ล็อกอินสำเร็จ - redirect ไปหน้า home
      window.location.href = '/home';
    }
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 bg-white font-sans overflow-hidden relative">
      {/* ประดับตกแต่งพื้นหลัง */}
      <div className="absolute top-[-10%] right-[-10%] w-[300px] h-[300px] bg-gray-50 rounded-full blur-3xl opacity-50"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[300px] h-[300px] bg-gray-50 rounded-full blur-3xl opacity-50"></div>

      {/* Top Left Brand Logo */}
      <div className="absolute top-6 left-6 z-10 flex items-center gap-2">
        <div className="bg-gray-900 text-white p-1 rounded-md flex items-center justify-center">
          <Icon icon="solar:command-linear" width="16" height="16" />
        </div>
        <span className="text-base font-semibold tracking-tight text-gray-900">
          SOFT POWER
        </span>
      </div>

      {/* Main Card */}
      <div className="relative z-10 bg-white p-10 md:p-16 rounded-[3rem] shadow-[0_30px_70px_-20px_rgba(0,0,0,0.1)] w-full max-w-[550px] flex flex-col items-center border border-gray-50 animate-in fade-in slide-in-from-bottom-6 duration-1000">
        {/* Header Icon */}
        <div className="w-20 h-20 bg-gray-900 rounded-[2rem] shadow-2xl shadow-gray-900/20 flex items-center justify-center mb-10 transform hover:scale-105 transition-transform duration-300">
          <Icon
            icon="solar:shield-user-bold-duotone"
            width="36"
            height="36"
            className="text-white"
          />
        </div>

        {/* Title & Subtitle */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight mb-4">
            ยินดีต้อนรับ
          </h1>
          <p className="text-base text-gray-500 leading-relaxed max-w-sm mx-auto font-medium">
            กรุณาเข้าสู่ระบบเพื่อจัดการข้อมูลโครงการ <br />
            <span className="text-gray-900 font-bold">
              อาหารพื้นถิ่นไทย (400 รายการ)
            </span>
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="w-full space-y-6">
          {/* SV Code Input */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">
              Account ID
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                <Icon
                  icon="solar:user-id-linear"
                  width="22"
                  height="22"
                  className="text-gray-400 group-focus-within:text-gray-900 transition-colors"
                />
              </div>
              <input
                name="sv_code"
                type="text"
                required
                placeholder="รหัสประจำตัว (SV Code)"
                className="block w-full rounded-2xl border-2 border-gray-50 bg-gray-50/50 py-4 pl-14 pr-4 text-base text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-gray-900/10 focus:ring-4 focus:ring-gray-900/5 focus:outline-none transition-all duration-300 font-bold"
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">
              Security Key
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                <Icon
                  icon="solar:lock-password-linear"
                  width="22"
                  height="22"
                  className="text-gray-400 group-focus-within:text-gray-900 transition-colors"
                />
              </div>
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                required
                placeholder="รหัสผ่าน"
                className="block w-full rounded-2xl border-2 border-gray-50 bg-gray-50/50 py-4 pl-14 pr-14 text-base text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-gray-900/10 focus:ring-4 focus:ring-gray-900/5 focus:outline-none transition-all duration-300 font-bold"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-5 flex items-center text-gray-400 hover:text-gray-900 transition-colors"
              >
                <Icon
                  icon={
                    showPassword
                      ? "solar:eye-closed-linear"
                      : "solar:eye-linear"
                  }
                  width="22"
                  height="22"
                />
              </button>
            </div>
          </div>

          {/* Forgot/Change Password */}
          <div className="flex justify-end pt-1">
            <a
              href="/settings/change-password"
              className="text-sm font-bold text-gray-400 hover:text-gray-900 transition-colors"
            >
              เปลี่ยนรหัสผ่าน
            </a>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 text-red-600 text-sm font-bold rounded-2xl border border-red-100 text-center animate-bounce">
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
            className="w-full bg-gray-900 hover:bg-black text-white rounded-[1.5rem] py-5 text-lg font-black transition-all shadow-2xl shadow-gray-900/30 active:scale-95 mt-4 flex items-center justify-center gap-3 disabled:opacity-50 disabled:active:scale-100"
          >
            {loading ? (
              <>
                <Icon
                  icon="line-md:loading-twotone-loop"
                  width="24"
                  height="24"
                />
                <span>กำลังยืนยันตัวตน...</span>
              </>
            ) : (
              <>
                <span>เข้าสู่ระบบ</span>
                <Icon
                  icon="solar:login-3-linear"
                  width="24"
                  height="24"
                />
              </>
            )}
          </button>
        </form>

        <p className="mt-16 text-xs text-gray-300 font-bold tracking-widest uppercase">
          © 2026 Soft Power Data Management System
        </p>
      </div>
    </div>
  );
}
