'use client'
import { signOut } from 'next-auth/react'
import { Icon } from '@iconify/react'

interface HeaderProps {
    userName: string
    userRole: string
    onMenuClick?: () => void
    isCollapsed?: boolean
}

export default function Header({ userName, userRole, onMenuClick, isCollapsed }: HeaderProps) {
    const getRoleBadgeColor = (role: string) => {
        switch (role.toLowerCase()) {
            case 'admin':
                return 'bg-purple-100 text-purple-700 border-purple-200'
            case 'director':
                return 'bg-blue-100 text-blue-700 border-blue-200'
            default:
                return 'bg-green-100 text-green-700 border-green-200'
        }
    }

    const getRoleLabel = (role: string) => {
        switch (role.toLowerCase()) {
            case 'admin':
                return 'แอดมิน'
            case 'director':
                return 'กรรมการ'
            default:
                return 'ผู้กรอก'
        }
    }

    return (
        <header className="bg-white border-b border-gray-100 sticky top-0 z-10 transition-all duration-300">
            <div className="px-4 lg:px-8 py-4 flex items-center justify-between">
                {/* Left side */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={onMenuClick}
                        className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors"
                        aria-label={isCollapsed ? "ขยายเมนู" : "ย่อเมนู"}
                    >
                        <Icon
                            icon={isCollapsed ? "solar:hamburger-menu-linear" : "solar:hamburger-menu-linear"}
                            width="24"
                        />
                    </button>
                    <h2 className="text-xl font-bold text-gray-900 hidden sm:block">Dashboard</h2>
                </div>

                {/* Right side - User info and actions */}
                <div className="flex items-center gap-4">
                    {/* User info */}
                    <div className="flex items-center gap-3 px-3 py-1.5 lg:px-4 lg:py-2 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="w-8 h-8 bg-gradient-to-br from-gray-700 to-gray-900 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                            {userName.charAt(0).toUpperCase()}
                        </div>
                        <div className="hidden md:block">
                            <p className="text-sm font-bold text-gray-900">{userName}</p>
                            <span className={`inline-block px-2 py-0.5 rounded-md text-xs font-bold border ${getRoleBadgeColor(userRole)}`}>
                                {getRoleLabel(userRole)}
                            </span>
                        </div>
                    </div>

                    {/* Logout button */}
                    <button
                        onClick={() => signOut({ callbackUrl: '/login' })}
                        className="flex items-center gap-2 px-3 py-2 lg:px-4 lg:py-2 rounded-xl text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all border border-transparent hover:border-red-200"
                    >
                        <Icon icon="solar:logout-2-bold-duotone" width="20" height="20" />
                        <span className="font-medium hidden md:block">ออกจากระบบ</span>
                    </button>
                </div>
            </div>
        </header>
    )
}
