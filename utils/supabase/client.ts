import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // สร้าง Client โดยใช้ค่าจาก .env.local ที่คุณตั้งค่าไว้
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}