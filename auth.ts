import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { createClient } from "@/utils/supabase/server"
import { verifyPassword, hashPassword } from "@/utils/password"

export const { handlers, signIn, signOut, auth } = NextAuth({
    secret: process.env.AUTH_SECRET,
    providers: [
        Credentials({
            credentials: {
                sv_code: { label: "SV Code", type: "text" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                console.log('🔐 Authorizing user:', credentials?.sv_code)

                if (!credentials?.sv_code || !credentials?.password) {
                    console.log('❌ Missing credentials')
                    return null
                }

                const supabase = await createClient()

                // ดึงข้อมูลผู้ใช้จาก Supabase
                const { data: user, error } = await supabase
                    .from('users')
                    .select('*')
                    .eq('sv_code', credentials.sv_code)
                    .single()

                if (error || !user) {
                    console.log('❌ User not found or DB error:', error?.message)
                    return null
                }

                if (!user.password_hash) {
                    console.log('❌ User has no password set')
                    return null
                }

                console.log('✅ User found:', user.sv_code, 'Role:', user.role)
                console.log('🔑 Hash in DB:', user.password_hash)

                // ตรวจสอบรหัสผ่าน
                // ถ้ารหัสผ่านเป็น plain text (ยังไม่ได้ hash) ให้เปรียบเทียบตรงๆ
                let isValid = false

                if (user.password_hash.startsWith('$2a$') || user.password_hash.startsWith('$2b$')) {
                    // รหัสผ่านถูก hash แล้ว ใช้ bcrypt compare
                    console.log('🔄 Verifying with bcryptjs...')
                    isValid = await verifyPassword(credentials.password as string, user.password_hash)
                } else {
                    // รหัสผ่านยังเป็น plain text
                    console.log('📝 Verifying plain text...')
                    isValid = user.password_hash === credentials.password

                    // ถ้าถูกต้อง ให้ hash และอัพเดทในฐานข้อมูล
                    if (isValid) {
                        console.log('✨ Updating plain text password to hash...')
                        const hashedPassword = await hashPassword(credentials.password as string)
                        await supabase
                            .from('users')
                            .update({ password_hash: hashedPassword })
                            .eq('sv_code', user.sv_code)
                    }
                }

                console.log('🔓 Password valid:', isValid)

                if (!isValid) {
                    return null
                }

                // Return user object
                return {
                    id: user.sv_code,
                    name: user.collector_name,
                    email: user.sv_code, // ใช้ sv_code แทน email
                    role: user.role || 'user'
                }
            }
        })
    ],
    session: {
        strategy: "jwt"
    },
    callbacks: {
        async jwt({ token, user }) {
            // เพิ่มข้อมูล role และ sv_code ลง JWT token
            if (user) {
                token.role = user.role
                token.sv_code = user.id
            }
            return token
        },
        async session({ session, token }) {
            // เพิ่มข้อมูล role และ sv_code ลง session
            if (session.user) {
                session.user.role = token.role as string
                session.user.sv_code = token.sv_code as string
            }
            return session
        }
    },
    pages: {
        signIn: '/login',
    }
})
