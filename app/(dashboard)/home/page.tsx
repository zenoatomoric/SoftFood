import { createClient } from "@/utils/supabase/server";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Icon } from "@iconify/react";
import StatCard from "../../components/StatCard";

export default async function DashboardHomePage() {
  // ตรวจสอบ authentication
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const userRole = session.user.role;

  const supabase = await createClient();

  // ดึงข้อมูลจำนวนสถิติต่างๆ (Server Side Fetching)
  const { count: totalMenus } = await supabase
    .from("menus")
    .select("*", { count: "exact", head: true });
  const { count: bkkCount } = await supabase
    .from("informants")
    .select("*", { count: "exact", head: true })
    .eq("canal_zone", "บางเขน");
  const { count: premCount } = await supabase
    .from("informants")
    .select("*", { count: "exact", head: true })
    .eq("canal_zone", "เปรมประชากร");
  const { count: latCount } = await supabase
    .from("informants")
    .select("*", { count: "exact", head: true })
    .eq("canal_zone", "ลาดพร้าว");

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 mb-2">
            ภาพรวมโครงการ
          </h1>
          <p className="text-slate-500 font-medium">
            สรุปข้อมูลการลงพื้นที่เก็บข้อมูลอาหารพื้นถิ่น (เป้าหมาย 400 รายการ)
          </p>
        </div>
        <Link
          href="/survey"
          className="flex items-center justify-center w-full md:w-auto gap-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white px-8 py-5 md:px-6 md:py-3 rounded-3xl md:rounded-xl font-black text-xl md:text-base transition-all shadow-xl shadow-indigo-400/30 active:scale-95 border-2 border-white/10"
        >
          <Icon icon="solar:document-add-bold-duotone" className="text-3xl md:text-2xl" />
          ทำแบบสอบถาม
        </Link>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="เมนูทั้งหมด"
          value={totalMenus || 0}
          icon="solar:database-bold-duotone"
          color="text-indigo-600"
          bg="bg-indigo-50"
        />
        <StatCard
          title="คลองบางเขน"
          value={bkkCount || 0}
          icon="solar:map-point-bold-duotone"
          color="text-red-500"
          bg="bg-red-50"
        />
        <StatCard
          title="คลองเปรมฯ"
          value={premCount || 0}
          icon="solar:map-point-bold-duotone"
          color="text-emerald-500"
          bg="bg-emerald-50"
        />
        <StatCard
          title="คลองลาดพร้าว"
          value={latCount || 0}
          icon="solar:map-point-bold-duotone"
          color="text-sky-500"
          bg="bg-sky-50"
        />
      </div>

      {/* สามารถเพิ่มส่วนกราฟ หรือ ตารางสรุปย่อตรงนี้ได้ */}
      <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm h-64 flex items-center justify-center text-slate-400 font-medium">
        coming soon...
      </div>
    </div>
  );
}
