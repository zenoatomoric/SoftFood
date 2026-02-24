'use server'

import { createClient } from '@/utils/supabase/server'
import { auth } from '@/auth'
import { hashPassword } from '@/utils/password'
import { revalidatePath } from 'next/cache'

export async function getUsers() {
  const session = await auth()

  // ตรวจสอบว่าเป็น admin หรือไม่
  if (session?.user?.role !== 'admin') {
    return { error: 'ไม่มีสิทธิ์เข้าถึง' }
  }

  const supabase = await createClient()
  const { data: users, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return { error: 'เกิดข้อผิดพลาดในการดึงข้อมูล' }
  }

  return { users }
}

export async function createUser(formData: FormData) {
  const session = await auth()

  // ตรวจสอบว่าเป็น admin หรือไม่
  if (session?.user?.role !== 'admin') {
    return { error: 'ไม่มีสิทธิ์เข้าถึง' }
  }

  const sv_code = formData.get('sv_code') as string
  const password = formData.get('password') as string
  const collector_name = formData.get('collector_name') as string
  const faculty = formData.get('faculty') as string
  const major = formData.get('major') as string
  const phone = formData.get('phone') as string
  const role = formData.get('role') as string

  // Validate required fields
  if (!sv_code || !password || !collector_name || !role) {
    return { error: 'กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน' }
  }

  // Hash password
  const hashedPassword = await hashPassword(password)

  const supabase = await createClient()
  const { error } = await supabase
    .from('users')
    .insert({
      sv_code,
      password_hash: hashedPassword,
      collector_name,
      faculty,
      major,
      phone,
      role
    })

  if (error) {
    if (error.code === '23505') {
      return { error: 'รหัส SV Code นี้มีอยู่ในระบบแล้ว' }
    }
    return { error: 'เกิดข้อผิดพลาดในการเพิ่มผู้ใช้' }
  }

  revalidatePath('/users')
  return { success: 'เพิ่มผู้ใช้สำเร็จ' }
}

export async function deleteUser(sv_code: string) {
  const session = await auth()

  // ตรวจสอบว่าเป็น admin หรือไม่
  if (session?.user?.role !== 'admin') {
    return { error: 'ไม่มีสิทธิ์เข้าถึง' }
  }

  // ป้องกันไม่ให้ลบตัวเอง
  if (session?.user?.sv_code === sv_code) {
    return { error: 'ไม่สามารถลบบัญชีของตัวเองได้' }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('users')
    .delete()
    .eq('sv_code', sv_code)

  if (error) {
    return { error: 'เกิดข้อผิดพลาดในการลบผู้ใช้' }
  }

  revalidatePath('/users')
  return { success: 'ลบผู้ใช้สำเร็จ' }
}

export async function updateUser(formData: FormData) {
  const session = await auth()

  // ตรวจสอบว่าเป็น admin หรือไม่
  if (session?.user?.role !== 'admin') {
    return { error: 'ไม่มีสิทธิ์เข้าถึง' }
  }

  const sv_code = formData.get('sv_code') as string
  const password = formData.get('password') as string
  const collector_name = formData.get('collector_name') as string
  const faculty = formData.get('faculty') as string
  const major = formData.get('major') as string
  const phone = formData.get('phone') as string
  const role = formData.get('role') as string

  // Validate required fields
  if (!sv_code || !collector_name || !role) {
    return { error: 'กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน' }
  }

  const supabase = await createClient()

  // Prepare update data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateData: any = {
    collector_name,
    faculty,
    major,
    phone,
    role
  }

  // Only update password if provided
  if (password && password.trim() !== '') {
    updateData.password_hash = await hashPassword(password)
  }

  const { error } = await supabase
    .from('users')
    .update(updateData)
    .eq('sv_code', sv_code)

  if (error) {
    return { error: 'เกิดข้อผิดพลาดในการแก้ไขผู้ใช้' }
  }

  revalidatePath('/users')
  return { success: 'แก้ไขข้อมูลผู้ใช้สำเร็จ' }
}
