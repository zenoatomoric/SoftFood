'use client'
import { Icon } from '@iconify/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface SidebarProps {
  role: string
  isCollapsed: boolean
  isOpen: boolean // For mobile
  onCloseAction: () => void
}

export default function Sidebar({ role, isCollapsed, isOpen, onCloseAction }: SidebarProps) {
  const pathname = usePathname()

  // กำหนดสิทธิ์การเข้าถึงเมนู
  const menus = [
    {
      name: 'หน้าแรกสรุปข้อมูล',
      icon: 'solar:chart-square-bold-duotone',
      href: '/home',
      roles: ['user', 'admin', 'director']
    },
    {
      name: 'จัดการผู้ใช้งาน',
      icon: 'solar:users-group-rounded-bold-duotone',
      href: '/users',
      roles: ['admin'] // เฉพาะ Admin เท่านั้น
    },
    {
      name: 'แบบสอบถาม',
      icon: 'solar:clipboard-list-bold-duotone',
      href: '/survey',
      roles: ['user', 'admin', 'director'] // User และ Admin เท่านั้น (Director ไม่เห็น)
    },
    {
      name: 'รายการอาหาร',
      icon: 'solar:chef-hat-heart-bold-duotone',
      href: '/menus',
      roles: ['user', 'admin', 'director']
    },
    {
      name: 'คัดเลือกรายการอาหาร',
      icon: 'solar:medal-star-bold-duotone',
      href: '/food',
      roles: ['admin']
    },
    {
      name: 'ข้อมูลผู้ให้ข้อมูล',
      icon: 'solar:users-group-rounded-bold-duotone',
      href: '/informants',
      roles: ['admin', 'user']
    },
  ]

  return (
    <>
      {/* Mobile Overlay is handled in Layout for better z-index control usually, 
          but if it's passed here we can use it, or rely on parent. 
          The parent 'DashboardLayoutClient' handles the overlay. 
          Here we just handle the sidebar itself. */}

      <aside
        className={`
          fixed lg:fixed top-0 left-0 z-50 h-screen bg-white border-r border-slate-100 flex flex-col transition-all duration-300
          ${isOpen ? 'translate-x-0 w-72' : '-translate-x-full lg:translate-x-0'} 
          ${isCollapsed ? 'lg:w-20' : 'lg:w-72'}
        `}
      >
        {/* Logo */}
        <div className={`flex items-center gap-3 h-20 ${isCollapsed ? 'justify-center px-0' : 'px-8'}`}>
          <div className="bg-gray-900 text-white p-2 rounded-xl flex-shrink-0">
            <Icon icon="solar:command-bold" width="24" />
          </div>
          <div className={`transition-opacity duration-200 ${isCollapsed ? 'opacity-0 w-0 overflow-hidden hidden' : 'opacity-100'}`}>
            <h1 className="font-black text-xl tracking-tight text-gray-900 whitespace-nowrap">SOFT POWER</h1>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Food Data System</p>
          </div>
        </div>

        {/* Menu Links */}
        <nav className="flex-1 px-4 space-y-2 py-4 overflow-y-auto custom-scrollbar">
          {menus.filter(m => m.roles.includes(role)).map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => {
                  // Close mobile sidebar on navigation
                  if (window.innerWidth < 1024) onCloseAction()
                }}
                className={`flex items-center gap-4 px-4 py-3 rounded-2xl font-bold transition-all duration-200 group relative
                  ${isActive
                    ? 'bg-gray-900 text-white shadow-lg shadow-gray-900/20'
                    : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
                  }
                  ${isCollapsed ? 'justify-center' : ''}
                `}
                title={isCollapsed ? item.name : ''}
              >
                <Icon icon={item.icon} width="24" height="24" className="flex-shrink-0" />

                <span className={`whitespace-nowrap transition-all duration-200 ${isCollapsed ? 'w-0 overflow-hidden opacity-0 hidden' : 'w-auto opacity-100'}`}>
                  {item.name}
                </span>

                {/* Tooltip for collapsed mode - Removed to prevents scrollbar/overflow issues. Relying on title attribute. */}
              </Link>
            )
          })}
        </nav>

        {/* User Profile Summary */}
        <div className={`mt-auto border-t border-slate-50 transition-all ${isCollapsed ? 'p-2 flex justify-center' : 'p-4'}`}>
          <div className={`rounded-2xl flex items-center gap-3 transition-all ${isCollapsed ? 'justify-center bg-transparent border-none p-0' : 'bg-slate-50 p-3 border border-slate-100'}`}>
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-black text-lg border-2 border-white shadow-sm flex-shrink-0">
              {role.charAt(0).toUpperCase()}
            </div>
            <div className={`overflow-hidden transition-all duration-200 ${isCollapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100'}`}>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Current Role</p>
              <p className="text-sm font-black text-slate-900 capitalize truncate">{role}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}