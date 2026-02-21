// scripts/hash-existing-passwords.ts
/**
 * สคริปต์สำหรับแฮชรหัสผ่านที่เป็น plain text ในฐานข้อมูล
 * 
 * วิธีใช้งาน:
 * 1. ตรวจสอบว่าได้ตั้งค่า environment variables ให้ถูกต้องแล้ว
 * 2. รันคำสั่ง: npx tsx scripts/hash-existing-passwords.ts
 * 
 * คำเตือน: สคริปต์นี้จะอัปเดตรหัสผ่านทั้งหมดในฐานข้อมูล
 * กรุณาสำรองข้อมูลก่อนรัน!
 */

import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'

const SALT_ROUNDS = 10

async function hashExistingPasswords() {
    // สร้าง Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
        console.error('❌ ไม่พบ environment variables ที่จำเป็น')
        console.error('กรุณาตั้งค่า NEXT_PUBLIC_SUPABASE_URL และ SUPABASE_SERVICE_ROLE_KEY')
        process.exit(1)
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    console.log('🔍 กำลังค้นหาผู้ใช้ที่มีรหัสผ่านเป็น plain text...\n')

    // ดึงข้อมูลผู้ใช้ทั้งหมด
    const { data: users, error } = await supabase
        .from('users')
        .select('sv_code, password_hash')

    if (error) {
        console.error('❌ เกิดข้อผิดพลาดในการดึงข้อมูล:', error.message)
        process.exit(1)
    }

    if (!users || users.length === 0) {
        console.log('ℹ️  ไม่พบผู้ใช้ในระบบ')
        return
    }

    console.log(`📊 พบผู้ใช้ทั้งหมด ${users.length} คน\n`)

    let updatedCount = 0
    let skippedCount = 0
    let errorCount = 0

    for (const user of users) {
        // ตรวจสอบว่ารหัสผ่านถูก hash แล้วหรือยัง
        const isAlreadyHashed = user.password_hash.startsWith('$2a$') ||
            user.password_hash.startsWith('$2b$')

        if (isAlreadyHashed) {
            console.log(`⏭️  ${user.sv_code}: รหัสผ่านถูก hash แล้ว (ข้าม)`)
            skippedCount++
            continue
        }

        try {
            // แฮชรหัสผ่าน
            const hashedPassword = await bcrypt.hash(user.password_hash, SALT_ROUNDS)

            // อัปเดตในฐานข้อมูล
            const { error: updateError } = await supabase
                .from('users')
                .update({ password_hash: hashedPassword })
                .eq('sv_code', user.sv_code)

            if (updateError) {
                console.error(`❌ ${user.sv_code}: เกิดข้อผิดพลาด - ${updateError.message}`)
                errorCount++
            } else {
                console.log(`✅ ${user.sv_code}: แฮชรหัสผ่านสำเร็จ`)
                updatedCount++
            }
        } catch (err) {
            console.error(`❌ ${user.sv_code}: เกิดข้อผิดพลาด - ${err}`)
            errorCount++
        }
    }

    console.log('\n' + '='.repeat(50))
    console.log('📈 สรุปผลการดำเนินการ:')
    console.log(`   ✅ อัปเดตสำเร็จ: ${updatedCount} คน`)
    console.log(`   ⏭️  ข้าม (hash แล้ว): ${skippedCount} คน`)
    console.log(`   ❌ เกิดข้อผิดพลาด: ${errorCount} คน`)
    console.log('='.repeat(50))
}

// รันสคริปต์
hashExistingPasswords()
    .then(() => {
        console.log('\n✨ เสร็จสิ้นการดำเนินการ')
        process.exit(0)
    })
    .catch((error) => {
        console.error('\n❌ เกิดข้อผิดพลาดร้ายแรง:', error)
        process.exit(1)
    })
