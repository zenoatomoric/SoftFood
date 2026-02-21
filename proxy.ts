import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { auth } from '@/auth'

export async function proxy(request: NextRequest) {
    const session = await auth()
    const { pathname } = request.nextUrl

    // ป้องกันหน้า users (admin เท่านั้น)
    if (pathname.startsWith('/users')) {
        if (!session) {
            return NextResponse.redirect(new URL('/login', request.url))
        }

        const userRole = session.user?.role
        if (userRole !== 'admin') {
            return NextResponse.redirect(new URL('/home', request.url))
        }
    }

    // ป้องกันหน้า survey (user และ admin เท่านั้น - director ไม่สามารถเข้าถึง)
    if (pathname.startsWith('/survey')) {
        if (!session) {
            return NextResponse.redirect(new URL('/login', request.url))
        }

        const userRole = session.user?.role
        if (userRole === 'director') {
            return NextResponse.redirect(new URL('/home', request.url))
        }
    }

    // ป้องกันหน้า menus (ต้อง login)
    if (pathname.startsWith('/menus')) {
        if (!session) {
            return NextResponse.redirect(new URL('/login', request.url))
        }
    }

    // ป้องกันหน้า home (ต้อง login)
    if (pathname.startsWith('/home')) {
        if (!session) {
            return NextResponse.redirect(new URL('/login', request.url))
        }
    }

    // ป้องกันหน้า settings (ต้อง login) - ยกเว้นหน้าเปลี่ยนรหัสผ่าน
    if (pathname.startsWith('/settings')) {
        // อนุญาตให้เข้าหน้าเปลี่ยนรหัสผ่านได้โดยไม่ต้อง login (เพื่อให้คนที่รู้รหัสเดิมเปลี่ยนได้)
        if (pathname === '/settings/change-password') {
            return NextResponse.next()
        }

        if (!session) {
            return NextResponse.redirect(new URL('/login', request.url))
        }
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/menus/:path*', '/users/:path*', '/survey/:path*', '/settings/:path*', '/home/:path*']
}
