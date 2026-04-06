export const dynamic = 'force-dynamic'

import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Icon } from '@iconify/react'
import StatCard from '@/app/components/StatCard'
import CanalSummaryCard from '@/app/components/dashboard/CanalSummaryCard'
import DashboardTable from '@/app/components/dashboard/DashboardTable'
import DashboardGlobalSearch from '@/app/components/dashboard/DashboardGlobalSearch'

export default async function DashboardHomePage({
  searchParams
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedParams = await searchParams
  const svCode = typeof resolvedParams?.sv_code === 'string' ? resolvedParams.sv_code : ''

  // ตรวจสอบ authentication
  const session = await auth()

  // No redirect to allow public access to stats

  const userRole = session?.user?.role

  let totalMenus = 0
  let totalInfo = 0
  let canalStats: { name: string; menuCount: number; infoCount: number }[] = []

  try {
    // ใช้ Admin Client เพื่อให้ทุกโรลเห็นสถิติรวมของโครงการ (Bypass RLS)
    // ย้ายเข้ามาใน try-catch เพื่อไม่ให้หน้าเว็บพังถ้า Env Var หาย
    const supabase = createAdminClient()

    // ดึงข้อมูลจำนวนสถิติต่างๆ (Server Side Fetching)
    let menuQuery = supabase.from('menus').select('*', { count: 'exact', head: true })
    let infoQuery = supabase.from('informants').select('*', { count: 'exact', head: true })

    if (svCode) {
      menuQuery = menuQuery.eq('ref_sv_code', svCode)
      infoQuery = infoQuery.eq('ref_sv_code', svCode)
    }

    const { count: mCount, error: menuErr } = await menuQuery
    const { count: iCount, error: infoErr } = await infoQuery

    if (menuErr) console.error('[Home] Error fetching menus:', menuErr)
    if (infoErr) console.error('[Home] Error fetching informants:', infoErr)

    totalMenus = mCount || 0
    totalInfo = iCount || 0

    const canalNames = ['บางเขน', 'เปรมประชากร', 'ลาดพร้าว']
    canalStats = await Promise.all(canalNames.map(async (name) => {
      // Count menus for this canal - join check
      let mQuery = supabase
        .from('menus')
        .select('menu_id, informants!inner(canal_zone)', { count: 'exact', head: true })
        .eq('informants.canal_zone', name)

      let iQuery = supabase
        .from('informants')
        .select('*', { count: 'exact', head: true })
        .eq('canal_zone', name)

      if (svCode) {
        mQuery = mQuery.eq('ref_sv_code', svCode)
        iQuery = iQuery.eq('ref_sv_code', svCode)
      }

      const { count: mC } = await mQuery
      const { count: iC } = await iQuery

      return { name, menuCount: mC || 0, infoCount: iC || 0 }
    }))
  } catch (err) {
    console.error('[Home] Critical error during statistics fetching:', err)
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-1">ภาพรวมโครงการ</h1>
          <p className="text-sm text-slate-500 font-medium">สรุปข้อมูลการลงพื้นที่เก็บข้อมูลอาหารพื้นถิ่น <span className="text-slate-400">(เป้าหมาย 400 รายการ)</span></p>
        </div>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <DashboardGlobalSearch initialValue={svCode} />
          <Link
            href="/survey"
            className="flex items-center justify-center w-full md:w-auto gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm active:scale-95 shrink-0"
          >
            <Icon icon="solar:document-add-bold-duotone" className="text-xl" />
            ทำแบบสอบถาม
          </Link>
        </div>
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
              idx === 0 ? { color: 'text-red-600', bg: 'bg-red-50', iconBg: 'bg-red-100' } :
                idx === 1 ? { color: 'text-emerald-600', bg: 'bg-emerald-50', iconBg: 'bg-emerald-100' } :
                  { color: 'text-sky-600', bg: 'bg-sky-50', iconBg: 'bg-sky-100' }
            }
          />
        ))}
      </div>

      {/* Dashboard Table Section */}
      <DashboardTable svCode={svCode} />

      {/* พื้นที่สำหรับกราฟ */}
      <div className="bg-slate-50 rounded-2xl p-10 border border-slate-200 flex flex-col items-center justify-center text-slate-400 font-bold text-center text-sm italic">
        <Icon icon="solar:chart-square-bold-duotone" className="text-4xl text-slate-300 mb-2" />
        Analytics section coming soon
      </div>
    </div>
  )
}