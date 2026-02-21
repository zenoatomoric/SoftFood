'use server'

import { createClient } from '@/utils/supabase/server'
import { auth } from '@/auth'
import { verifyPassword, hashPassword } from '@/utils/password'

export async function changePassword(formData: FormData) {
    const currentPassword = formData.get('currentPassword') as string
    const newPassword = formData.get('newPassword') as string
    const confirmPassword = formData.get('confirmPassword') as string

    // 1. ตรวจสอบว่ารหัสผ่านใหม่ตรงกันหรือไม่
    if (newPassword !== confirmPassword) {
        return { error: 'รหัสผ่านใหม่ไม่ตรงกัน' }
    }

    // 2. ตรวจสอบความยาวรหัสผ่าน (อย่างน้อย 8 ตัวอักษร)
    if (newPassword.length < 8) {
        return { error: 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร' }
    }

    // 3. ตรวจสอบว่ามีตัวพิมพ์ใหญ่ (A-Z)
    if (!/[A-Z]/.test(newPassword)) {
        return { error: 'รหัสผ่านต้องมีตัวพิมพ์ใหญ่อย่างน้อย 1 ตัว (A-Z)' }
    }

    // 4. ตรวจสอบว่ามีตัวพิมพ์เล็ก (a-z)
    if (!/[a-z]/.test(newPassword)) {
        return { error: 'รหัสผ่านต้องมีตัวพิมพ์เล็กอย่างน้อย 1 ตัว (a-z)' }
    }

    // 5. ตรวจสอบว่ามีตัวเลข (0-9)
    if (!/[0-9]/.test(newPassword)) {
        return { error: 'รหัสผ่านต้องมีตัวเลขอย่างน้อย 1 ตัว (0-9)' }
    }

    // 6. ตรวจสอบว่ามีอักษรพิเศษ
    if (!/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(newPassword)) {
        return { error: 'รหัสผ่านต้องมีอักษรพิเศษอย่างน้อย 1 ตัว (!@#$%^&* ฯลฯ)' }
    }

    // 7. ดึงข้อมูลผู้ใช้ (จาก Session หรือจาก Form)
    const session = await auth()

    // รับ sv_code จาก formData (ถ้ามี)
    const formSvCode = formData.get('sv_code') as string

    // ถ้ามี session ให้ใช้จาก session, ถ้าไม่มีให้ใช้จาก form
    const sv_code = session?.user?.sv_code || formSvCode

    if (!sv_code) {
        return { error: 'กรุณาระบุรหัสประจำตัว' }
    }

    // 8. ตรวจสอบรหัสผ่านเดิม
    const supabase = await createClient()
    const { data: user, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('sv_code', sv_code)
        .single()

    if (fetchError || !user) {
        return { error: 'ไม่พบข้อมูลผู้ใช้' }
    }

    // 9. ตรวจสอบว่ารหัสผ่านเดิมถูกต้องหรือไม่
    let isCurrentPasswordValid = false

    if (user.password_hash.startsWith('$2a$') || user.password_hash.startsWith('$2b$')) {
        // รหัสผ่านถูก hash แล้ว
        isCurrentPasswordValid = await verifyPassword(currentPassword, user.password_hash)
    } else {
        // รหัสผ่านยังเป็น plain text
        isCurrentPasswordValid = user.password_hash === currentPassword
    }

    if (!isCurrentPasswordValid) {
        return { error: 'รหัสผ่านเดิมไม่ถูกต้อง' }
    }

    // 10. Hash รหัสผ่านใหม่และอัพเดท
    const hashedNewPassword = await hashPassword(newPassword)

    const { error: updateError } = await supabase
        .from('users')
        .update({ password_hash: hashedNewPassword })
        .eq('sv_code', sv_code)

    if (updateError) {
        return { error: 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน' }
    }

    return { success: 'เปลี่ยนรหัสผ่านสำเร็จ' }
}
