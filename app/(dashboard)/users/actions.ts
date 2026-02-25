'use server'

import { createClient } from '@/utils/supabase/server'
import { auth } from '@/auth'
import { hashPassword } from '@/utils/password'
import { revalidatePath } from 'next/cache'

export async function getUsers() {
  const session = await auth()

  // ตรวจสอบว่าเป็น admin หรือ director หรือไม่ (รองรับหลายรูปแบบตัวอักษรและภาษาไทย)
  const currentRole = (session?.user?.role || '').toLowerCase().trim();
  const isAuthorized = ['admin', 'director', 'กรรมการ', 'ผู้ดูแลระบบ'].includes(currentRole);

  if (!isAuthorized) {
    return { error: 'ไม่มีสิทธิ์เข้าถึง' }
  }

  const supabase = await createClient()

  // Try with join first - Using column name as hint for self-join
  let { data: users, error } = await supabase
    .from('users')
    .select(`
      *,
      supervisor:supervisor_sv_code(collector_name)
    `)
    .order('created_at', { ascending: false })

  // If failed (likely due to missing column/relation), try simple select
  if (error) {
    console.warn('Supervisor join failed, falling back to simple select. Error:', error.message || error);

    const simpleResult = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    users = simpleResult.data;
    error = simpleResult.error;
  }

  if (error) {
    console.error('Error fetching users final attempt:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint
    })
    return { error: `เกิดข้อผิดพลาดในการดึงข้อมูล: ${error.message || 'Unknown database error'}` }
  }

  // กรองข้อมูลตามสิทธิ์ (Admin เห็นทุกคน, Director เห็นเฉพาะทีมตัวเองและคนไม่มีสังกัด)
  const isAdmin = ['admin', 'ผู้ดูแลระบบ'].includes(currentRole);
  const isDirector = ['director', 'กรรมการ'].includes(currentRole);

  if (isDirector && users) {
    const svCode = session?.user?.sv_code;
    if (svCode) {
      users = users.filter((u: any) => {
        const userRole = (u.role || '').toLowerCase().trim();
        const isUserAdminOrDirector = ['admin', 'director', 'กรรมการ', 'ผู้ดูแลระบบ'].includes(userRole);

        return (
          u.supervisor_sv_code === svCode || // ลูกทีมตัวเอง
          !u.supervisor_sv_code ||           // คนที่ยังไม่มีสังกัด
          u.sv_code === svCode ||            // ตัวเอง
          isUserAdminOrDirector              // Admin/Director คนอื่นๆ
        );
      });
    }
  }

  return { users }
}

export async function createUser(formData: FormData) {
  const session = await auth()

  // ตรวจสอบว่าเป็น admin หรือ director หรือไม่ (รองรับภาษาไทย)
  const currentRole = (session?.user?.role || '').toLowerCase().trim();
  const isAuthorized = ['admin', 'director', 'กรรมการ', 'ผู้ดูแลระบบ'].includes(currentRole);

  if (!isAuthorized) {
    return { error: 'ไม่มีสิทธิ์เข้าถึง' }
  }

  const sv_code = formData.get('sv_code') as string
  const password = formData.get('password') as string
  const collector_name = formData.get('collector_name') as string
  const faculty = formData.get('faculty') as string
  const major = formData.get('major') as string
  const phone = formData.get('phone') as string
  const role = formData.get('role') as string
  const supervisor_sv_code = formData.get('supervisor_sv_code') as string

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
      role,
      supervisor_sv_code: supervisor_sv_code || null
    })

  if (error) {
    if (error.code === '23505') {
      return { error: 'รหัส SV Code นี้มีอยู่ในระบบแล้ว' }
    }
    return { error: 'เกิดข้อผิดพลาดในการเพิ่มผู้ใช้' }
  }

  revalidatePath('/users')
  revalidatePath('/users/my-team')
  return { success: 'เพิ่มผู้ใช้สำเร็จ' }
}

export async function deleteUser(sv_code: string) {
  const session = await auth()

  // ตรวจสอบว่าเป็น admin หรือ director หรือไม่ (รองรับภาษาไทย)
  const currentRole = (session?.user?.role || '').toLowerCase().trim();
  const isAuthorized = ['admin', 'director', 'กรรมการ', 'ผู้ดูแลระบบ'].includes(currentRole);

  if (!isAuthorized) {
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
  revalidatePath('/users/my-team')
  return { success: 'ลบผู้ใช้สำเร็จ' }
}

export async function updateUser(formData: FormData) {
  const session = await auth()

  // ตรวจสอบว่าเป็น admin หรือ director หรือไม่ (รองรับภาษาไทย)
  const currentRole = (session?.user?.role || '').toLowerCase().trim();
  const isAuthorized = ['admin', 'director', 'กรรมการ', 'ผู้ดูแลระบบ'].includes(currentRole);

  if (!isAuthorized) {
    return { error: 'ไม่มีสิทธิ์เข้าถึง' }
  }

  const sv_code = formData.get('sv_code') as string
  const password = formData.get('password') as string
  const collector_name = formData.get('collector_name') as string
  const faculty = formData.get('faculty') as string
  const major = formData.get('major') as string
  const phone = formData.get('phone') as string
  const role = formData.get('role') as string
  const supervisor_sv_code = formData.get('supervisor_sv_code') as string

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
    role,
    supervisor_sv_code: supervisor_sv_code || null
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
  revalidatePath('/users/my-team')
  return { success: 'แก้ไขข้อมูลผู้ใช้สำเร็จ' }
}
