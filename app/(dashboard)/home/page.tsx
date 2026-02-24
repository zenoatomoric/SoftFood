import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Icon } from '@iconify/react'
import StatCard from '@/app/components/StatCard'
import CanalSummaryCard from '@/app/components/dashboard/CanalSummaryCard'
import DashboardTable from '@/app/components/dashboard/DashboardTable'


export default async function DashboardHomePage() {
  // ตรวจสอบ authentication
  const session = await auth()

  // No redirect to allow public access to stats

  const userRole = session?.user?.role

  // ใช้ Admin Client เพื่อให้ทุกโรลเห็นสถิติรวมของโครงการ (Bypass RLS)
  const supabase = createAdminClient()

  // ดึงข้อมูลจำนวนสถิติต่างๆ (Server Side Fetching)
  const { count: totalMenus, error: menuErr } = await supabase.from('menus').select('*', { count: 'exact', head: true })
  const { count: totalInfo, error: infoErr } = await supabase.from('informants').select('*', { count: 'exact', head: true })

  const canalNames = ['บางเขน', 'เปรมประชากร', 'ลาดพร้าว']
  const canalStats = await Promise.all(canalNames.map(async (name) => {
    const { count: menuCount } = await supabase.from('menus').select('menu_id, informants(canal_zone)', { count: 'exact', head: true }).eq('informants.canal_zone', name)
    const { count: infoCount } = await supabase.from('informants').select('*', { count: 'exact', head: true }).eq('canal_zone', name)
    return { name, menuCount: menuCount || 0, infoCount: infoCount || 0 }
  }))

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 md:gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold text-slate-950 mb-2">ภาพรวมโครงการ</h1>
          <p className="text-sm md:text-base text-slate-600 font-medium">สรุปข้อมูลการลงพื้นที่เก็บข้อมูลอาหารพื้นถิ่น (เป้าหมาย 400 รายการ)</p>
        </div>
        <Link
          href="/survey"
          className="flex items-center justify-center w-full md:w-auto gap-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white px-8 py-5 md:px-6 md:py-3 rounded-3xl md:rounded-xl font-semibold text-xl md:text-base transition-all shadow-xl shadow-indigo-400/30 active:scale-95 border-2 border-white/10"
        >
          <Icon icon="solar:document-add-bold-duotone" className="text-3xl md:text-2xl" />
          ทำแบบสอบถาม
        </Link>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 md:gap-6">
        <StatCard
          title="เมนูอาหารทั้งหมด"
          value={totalMenus || 0}
          unit="รายการ"
          icon="solar:chef-hat-heart-bold-duotone"
          color="text-orange-600"
          bg="bg-orange-50"
        />
        <StatCard
          title="ผู้ให้ข้อมูลทั้งหมด"
          value={totalInfo || 0}
          unit="คน"
          icon="solar:users-group-two-rounded-bold-duotone"
          color="text-indigo-600"
          bg="bg-indigo-50"
        />
      </div>

      {/* Canal Selection Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {canalStats.map((canal, idx) => (
          <CanalSummaryCard
            key={canal.name}
            canalName={canal.name}
            infoCount={canal.infoCount}
            menuCount={canal.menuCount}
            theme={
              idx === 0 ? { color: 'text-red-500', bg: 'bg-red-50', iconBg: 'bg-red-100' } :
                idx === 1 ? { color: 'text-emerald-500', bg: 'bg-emerald-50', iconBg: 'bg-emerald-100' } :
                  { color: 'text-sky-500', bg: 'bg-sky-50', iconBg: 'bg-sky-100' }
            }
          />
        ))}
      </div>

      {/* Dashboard Table Section */}
      <DashboardTable />

      {/* พื้นที่สำหรับกราฟ */}
      <div className="bg-white rounded-3xl md:rounded-[2.5rem] p-8 border border-slate-100 shadow-sm h-32 flex items-center justify-center text-slate-400 font-medium text-center text-sm md:text-base italic">
        Analytics section coming soon...
      </div>
    </div>
  )
}