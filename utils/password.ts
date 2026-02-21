// utils/password.ts
import bcrypt from 'bcryptjs';

// ลด salt rounds เป็น 8 สำหรับ development (เร็วกว่า ~4 เท่า)
// สำหรับ production แนะนำให้ใช้ 10-12 rounds
const SALT_ROUNDS = 8;

/**
 * แฮชรหัสผ่านด้วย bcrypt
 * @param password - รหัสผ่าน plain text ที่ต้องการแฮช
 * @returns รหัสผ่านที่แฮชแล้ว
 */
export async function hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * เปรียบเทียบรหัสผ่าน plain text กับ hash
 * @param password - รหัสผ่าน plain text ที่ผู้ใช้กรอก
 * @param hashedPassword - รหัสผ่านที่แฮชแล้วจากฐานข้อมูล
 * @returns true ถ้ารหัสผ่านตรงกัน, false ถ้าไม่ตรงกัน
 */
export async function verifyPassword(
    password: string,
    hashedPassword: string
): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
}
