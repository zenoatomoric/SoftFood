"use client";

import { useState, useMemo } from "react";
import { Icon } from "@iconify/react";
import { updateUser } from "../actions";

interface User {
    sv_code: string;
    collector_name: string;
    faculty?: string;
    major?: string;
    phone?: string;
    role: string;
    created_at: string;
    supervisor_sv_code?: string;
    supervisor?: {
        collector_name: string;
    };
}

export default function MyTeamClient({
    users: initialUsers,
    currentUserSvCode,
}: {
    users: User[];
    currentUserSvCode: string;
}) {
    const [users, setUsers] = useState(initialUsers);
    const [loading, setLoading] = useState(false);
    const [myTeamSearch, setMyTeamSearch] = useState("");
    const [unassignedSearch, setUnassignedSearch] = useState("");
    const [message, setMessage] = useState<{
        type: "success" | "error";
        text: string;
    } | null>(null);

    // แยกกลุ่มลูกทีม และ คนที่ยังไม่มีผู้ดูแล
    const myTeam = useMemo(() => {
        return users.filter(u =>
            u.supervisor_sv_code === currentUserSvCode &&
            (u.collector_name.toLowerCase().includes(myTeamSearch.toLowerCase()) ||
                u.sv_code.toLowerCase().includes(myTeamSearch.toLowerCase()))
        );
    }, [users, currentUserSvCode, myTeamSearch]);

    const unassignedUsers = useMemo(() => {
        return users.filter(u =>
            !u.supervisor_sv_code &&
            u.sv_code !== currentUserSvCode &&
            u.role === 'user' &&
            (u.collector_name.toLowerCase().includes(unassignedSearch.toLowerCase()) ||
                u.sv_code.toLowerCase().includes(unassignedSearch.toLowerCase()))
        );
    }, [users, currentUserSvCode, unassignedSearch]);

    async function handleAddToTeam(user: User) {
        setLoading(true);
        const formData = new FormData();
        formData.append('sv_code', user.sv_code);
        formData.append('collector_name', user.collector_name);
        formData.append('role', user.role);
        formData.append('supervisor_sv_code', currentUserSvCode);
        if (user.faculty) formData.append('faculty', user.faculty);
        if (user.major) formData.append('major', user.major);
        if (user.phone) formData.append('phone', user.phone);

        const result = await updateUser(formData);

        if (result.error) {
            setMessage({ type: "error", text: result.error });
        } else {
            setMessage({ type: "success", text: `เพิ่ม ${user.collector_name} เข้าทีมสำเร็จ` });
            // Update local state instead of reload for better UX
            setUsers(prev => prev.map(u =>
                u.sv_code === user.sv_code
                    ? { ...u, supervisor_sv_code: currentUserSvCode }
                    : u
            ));
        }
        setLoading(false);
        setTimeout(() => setMessage(null), 3000);
    }

    async function handleRemoveFromTeam(user: User) {
        setLoading(true);
        const formData = new FormData();
        formData.append('sv_code', user.sv_code);
        formData.append('collector_name', user.collector_name);
        formData.append('role', user.role);
        formData.append('supervisor_sv_code', ""); // Clear supervisor
        if (user.faculty) formData.append('faculty', user.faculty);
        if (user.major) formData.append('major', user.major);
        if (user.phone) formData.append('phone', user.phone);

        const result = await updateUser(formData);

        if (result.error) {
            setMessage({ type: "error", text: result.error });
        } else {
            setMessage({ type: "success", text: `นำ ${user.collector_name} ออกจากทีมสำเร็จ` });
            setUsers(prev => prev.map(u =>
                u.sv_code === user.sv_code
                    ? { ...u, supervisor_sv_code: undefined }
                    : u
            ));
        }
        setLoading(false);
        setTimeout(() => setMessage(null), 3000);
    }

    return (
        <div className="max-w-[1200px] mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <h1 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">ทีมของฉัน</h1>
                <p className="text-slate-500 font-medium mt-1">จัดการรายชื่อผู้เก็บข้อมูลในสังกัดของคุณ</p>
            </div>

            {/* Alert Message */}
            {message && (
                <div className={`p-4 rounded-2xl text-sm font-bold text-center border animate-in slide-in-from-top-2 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'
                    }`}>
                    {message.text}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* My Team Section */}
                <div className="space-y-4">
                    <div className="flex items-center gap-3 px-2">
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                            <Icon icon="solar:users-group-two-rounded-bold" width="24" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-800">ลูกทีมปัจจุบัน ({myTeam.length})</h2>
                    </div>

                    <div className="relative group">
                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400">
                            <Icon icon="solar:magnifer-linear" width="20" />
                        </div>
                        <input
                            type="text"
                            placeholder="ค้นหาลูกทีม..."
                            value={myTeamSearch}
                            onChange={(e) => setMyTeamSearch(e.target.value)}
                            className="w-full bg-white border border-slate-100 rounded-2xl py-3 pl-12 pr-4 font-medium text-slate-900 focus:ring-2 focus:ring-gray-900/10 focus:border-slate-200 transition-all outline-none"
                        />
                    </div>

                    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden h-[500px] flex flex-col">
                        {myTeam.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full p-12 text-slate-400">
                                <Icon icon="solar:user-block-bold-duotone" width="64" className="opacity-20 mb-4" />
                                <p className="font-bold">ยังไม่มีลูกทีมในสังกัด</p>
                                <p className="text-sm">สามารถเลือกเพิ่มผู้ใช้งานจากรายการด้านขวา</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-50 overflow-y-auto custom-scrollbar flex-1">
                                {myTeam.map(user => (
                                    <div key={user.sv_code} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-600">
                                                {user.collector_name.charAt(0)}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-900">{user.collector_name}</h3>
                                                <p className="text-xs font-bold text-slate-400">{user.sv_code}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleRemoveFromTeam(user)}
                                            disabled={loading}
                                            className="px-4 py-2 text-rose-600 hover:bg-rose-50 rounded-xl font-bold text-sm transition-all opacity-0 group-hover:opacity-100"
                                        >
                                            นำออก
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Unassigned Users Section */}
                <div className="space-y-4">
                    <div className="flex items-center gap-3 px-2">
                        <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                            <Icon icon="solar:user-plus-bold" width="24" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-800">ผู้ใช้งานที่ยังไม่มีสังกัด ({unassignedUsers.length})</h2>
                    </div>

                    <div className="relative group">
                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400">
                            <Icon icon="solar:magnifer-linear" width="20" />
                        </div>
                        <input
                            type="text"
                            placeholder="ค้นหาชื่อหรือรหัส..."
                            value={unassignedSearch}
                            onChange={(e) => setUnassignedSearch(e.target.value)}
                            className="w-full bg-white border border-slate-100 rounded-2xl py-3 pl-12 pr-4 font-medium text-slate-900 focus:ring-2 focus:ring-gray-900/10 focus:border-slate-200 transition-all outline-none"
                        />
                    </div>

                    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden h-[500px] flex flex-col">
                        {unassignedUsers.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full p-12 text-slate-400">
                                <Icon icon="solar:check-circle-bold-duotone" width="64" className="opacity-20 mb-4" />
                                <p className="font-bold">ไม่มีผู้ใช้งานที่ว่างอยู่</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-50 overflow-y-auto custom-scrollbar flex-1">
                                {unassignedUsers.map(user => (
                                    <div key={user.sv_code} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center font-bold text-slate-400">
                                                {user.collector_name.charAt(0)}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-900">{user.collector_name}</h3>
                                                <p className="text-xs font-bold text-slate-400">{user.sv_code}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleAddToTeam(user)}
                                            disabled={loading}
                                            className="px-4 py-2 bg-slate-900 text-white hover:bg-black rounded-xl font-bold text-sm shadow-sm transition-all active:scale-95"
                                        >
                                            เพิ่มเข้าทีม
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
