// src/app/login/actions.ts
'use server'

import { signIn } from '@/auth'
import { AuthError } from 'next-auth'

export async function login(formData: FormData) {
  const sv_code = formData.get('sv_code') as string
  const password = formData.get('password') as string

  try {
    // ใช้ NextAuth signIn
    await signIn('credentials', {
      sv_code,
      password,
      redirect: false, // ไม่ให้ redirect อัตโนมัติ
    })

    // ถ้าสำเร็จ return success (ไม่มี error)
    return { success: true }
  } catch (error) {
    // จัดการ error จาก NextAuth
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return { error: 'รหัสผ่านไม่ถูกต้อง' }
        default:
          return { error: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ' }
      }
    }
    throw error
  }
}