"use client";

import { useState, useEffect, useMemo } from "react";
import { Icon } from "@iconify/react";
import { createUser, deleteUser, updateUser } from "./actions";

interface User {
    sv_code: string;
    collector_name: string;
    faculty?: string;
    major?: string;
    phone?: string;
    role: string;
    created_at: string;
}

export default function UserManagementClient({
    users: initialUsers,
}: {
    users: User[];
}) {
    const [users, setUsers] = useState(initialUsers);
    const [roleFilter, setRoleFilter] = useState("all");
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{
        type: "success" | "error";
        text: string;
    } | null>(null);

    const [userToDelete, setUserToDelete] = useState<User | null>(null);
    const [pendingUpdateData, setPendingUpdateData] = useState<FormData | null>(
        null,
    );

    // Sync users when prop changes (e.g. after revalidatePath)
    useEffect(() => {
        setUsers(initialUsers);
    }, [initialUsers]);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        const formData = new FormData(e.currentTarget);
        const result = await createUser(formData);

        if (result.error) {
            setMessage({ type: "error", text: result.error });
        } else {
            setMessage({
                type: "success",
                text: result.success || "เพิ่มผู้ใช้สำเร็จ",
            });
            setShowAddForm(false);
            // Trigger a refresh/reload handled by parent/server component technically,
            // but for client-side we'll just wait for the prop update or manual reload
            window.location.reload();
        }
        setLoading(false);
    }

    async function handleUpdateSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        // Basic validation could happen here if needed
        setPendingUpdateData(formData);
    }

    async function confirmUpdate() {
        if (!pendingUpdateData) return;
        setLoading(true);
        setMessage(null);

        const result = await updateUser(pendingUpdateData);

        if (result.error) {
            setMessage({ type: "error", text: result.error });
            // Keep the form/confirmation open to let user retry or cancel
            setPendingUpdateData(null);
        } else {
            setMessage({
                type: "success",
                text: result.success || "แก้ไขข้อมูลผู้ใช้สำเร็จ",
            });
            setEditingUser(null);
            setPendingUpdateData(null);
            window.location.reload();
        }
        setLoading(false);
    }

    // Open delete modal
    function requestDelete(user: User) {
        setUserToDelete(user);
    }

    // Actual delete action
    async function confirmDelete() {
        if (!userToDelete) return;

        setLoading(true);
        const result = await deleteUser(userToDelete.sv_code);

        if (result.error) {
            alert(result.error);
        } else {
            setUsers(users.filter((u) => u.sv_code !== userToDelete.sv_code));
            // alert(result.success) // Optional: remove alert for smoother UX or use message state
            setMessage({ type: "success", text: result.success || "ลบผู้ใช้สำเร็จ" });
        }
        setLoading(false);
        setUserToDelete(null);
    }

    const getRoleBadge = (role: string) => {
        switch (role.toLowerCase()) {
            case "admin":
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] sm:text-xs font-bold bg-purple-100 text-purple-700 border border-purple-200 whitespace-nowrap">
                        <Icon icon="solar:shield-user-bold" />
                        แอดมิน (Admin)
                    </span>
                );
            case "director":
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] sm:text-xs font-bold bg-blue-100 text-blue-700 border border-blue-200 whitespace-nowrap">
                        <Icon icon="solar:user-id-bold" />
                        กรรมการ (Director)
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] sm:text-xs font-bold bg-green-100 text-green-700 border border-green-200 whitespace-nowrap">
                        <Icon icon="solar:user-rounded-bold" />
                        ผู้กรอก (User)
                    </span>
                );
        }
    };

    const filteredUsers = useMemo(() => {
        if (roleFilter === "all") return users;
        return users.filter((u) => u.role.toLowerCase() === roleFilter.toLowerCase());
    }, [users, roleFilter]);

    const stats = useMemo(() => {
        return {
            all: users.length,
            admin: users.filter((u) => u.role.toLowerCase() === "admin").length,
            director: users.filter((u) => u.role.toLowerCase() === "director").length,
            user: users.filter((u) => u.role.toLowerCase() === "user").length,
        };
    }, [users]);

    return (
        <div className="max-w-[1600px] mx-auto space-y-4 sm:space-y-6 lg:space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="text-center sm:text-left">
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
                        จัดการผู้ใช้งาน
                    </h1>
                    <p className="text-slate-500 font-medium text-xs sm:text-sm lg:text-base">
                        จัดการบัญชีผู้ใช้ทั้งหมดในระบบ ({users.length} บัญชี)
                    </p>
                </div>
                <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="flex items-center justify-center gap-2 px-6 py-3.5 bg-gray-900 text-white rounded-2xl font-bold hover:bg-black transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-gray-900/20 w-full sm:w-auto"
                >
                    <Icon
                        icon={
                            showAddForm ? "solar:close-circle-bold" : "solar:user-plus-bold"
                        }
                        width="20"
                    />
                    {showAddForm ? "ยกเลิก" : "เพิ่มผู้ใช้"}
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 bg-slate-100/50 p-1.5 rounded-2xl w-full sm:w-fit overflow-x-auto sm:overflow-visible no-scrollbar">
                <button
                    onClick={() => setRoleFilter("all")}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${roleFilter === "all" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-white/50"}`}
                >
                    ทั้งหมด
                    <span className={`px-2 py-0.5 rounded-md text-[10px] ${roleFilter === "all" ? "bg-slate-900 text-white" : "bg-slate-200 text-slate-500"}`}>
                        {stats.all}
                    </span>
                </button>
                <button
                    onClick={() => setRoleFilter("admin")}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${roleFilter === "admin" ? "bg-white text-purple-700 shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-white/50"}`}
                >
                    <Icon icon="solar:shield-user-bold" />
                    แอดมิน
                    <span className={`px-2 py-0.5 rounded-md text-[10px] ${roleFilter === "admin" ? "bg-purple-600 text-white" : "bg-slate-200 text-slate-500"}`}>
                        {stats.admin}
                    </span>
                </button>
                <button
                    onClick={() => setRoleFilter("director")}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${roleFilter === "director" ? "bg-white text-blue-700 shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-white/50"}`}
                >
                    <Icon icon="solar:user-id-bold" />
                    กรรมการ
                    <span className={`px-2 py-0.5 rounded-md text-[10px] ${roleFilter === "director" ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-500"}`}>
                        {stats.director}
                    </span>
                </button>
                <button
                    onClick={() => setRoleFilter("user")}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${roleFilter === "user" ? "bg-white text-green-700 shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-white/50"}`}
                >
                    <Icon icon="solar:user-rounded-bold" />
                    ผู้กรอก
                    <span className={`px-2 py-0.5 rounded-md text-[10px] ${roleFilter === "user" ? "bg-green-600 text-white" : "bg-slate-200 text-slate-500"}`}>
                        {stats.user}
                    </span>
                </button>
            </div>

            {/* Message Alert */}
            {message && (
                <div
                    className={`p-4 rounded-xl text-sm font-bold text-center animate-in slide-in-from-top-2 ${message.type === "success" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-red-50 text-red-600 border border-red-100"}`}
                >
                    {message.text}
                </div>
            )}

            {/* Add User Form */}
            {showAddForm && (
                <div className="bg-white p-5 sm:p-8 lg:p-10 rounded-3xl shadow-sm border border-slate-100 animate-in slide-in-from-top-4 overflow-hidden">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center">
                            <Icon icon="solar:user-plus-bold" width="20" />
                        </div>
                        <h2 className="text-xl lg:text-2xl font-black text-slate-900 uppercase tracking-tight">
                            เพิ่มผู้ใช้ใหม่
                        </h2>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase ml-1">
                                    SV Code (Username) *
                                </label>
                                <input
                                    name="sv_code"
                                    type="text"
                                    required
                                    placeholder="เช่น SV-001"
                                    className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 font-medium text-slate-900 focus:ring-2 focus:ring-gray-900/10"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase ml-1">
                                    รหัสผ่านเริ่มต้น *
                                </label>
                                <input
                                    name="password"
                                    type="text"
                                    required
                                    placeholder="กำหนดรหัสผ่าน"
                                    className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 font-medium text-slate-900 focus:ring-2 focus:ring-gray-900/10"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase ml-1">
                                ชื่อ-นามสกุล *
                            </label>
                            <input
                                name="collector_name"
                                type="text"
                                required
                                placeholder="ชื่อจริงผู้ใช้งาน"
                                className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 font-medium text-slate-900 focus:ring-2 focus:ring-gray-900/10"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase ml-1">
                                    คณะ
                                </label>
                                <input
                                    name="faculty"
                                    type="text"
                                    placeholder="คณะ"
                                    className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 font-medium text-slate-900 focus:ring-2 focus:ring-gray-900/10"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase ml-1">
                                    สาขา
                                </label>
                                <input
                                    name="major"
                                    type="text"
                                    placeholder="สาขา"
                                    className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 font-medium text-slate-900 focus:ring-2 focus:ring-gray-900/10"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase ml-1">
                                    เบอร์โทร
                                </label>
                                <input
                                    name="phone"
                                    type="text"
                                    placeholder="เบอร์โทรศัพท์"
                                    className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 font-medium text-slate-900 focus:ring-2 focus:ring-gray-900/10"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase ml-1">
                                สิทธิ์การใช้งาน (Role) *
                            </label>
                            <CustomRoleSelect name="role" />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gray-900 text-white py-4 lg:py-5 rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-gray-900/10 hover:bg-black transition-all hover:scale-[1.01] active:scale-[0.99] flex justify-center items-center gap-3 disabled:opacity-50 mt-4"
                        >
                            {loading ? (
                                "กำลังบันทึก..."
                            ) : (
                                <>
                                    <Icon icon="solar:user-plus-bold" width="22" /> สร้างบัญชีใหม่
                                </>
                            )}
                        </button>
                    </form>
                </div>
            )}

            {editingUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
                    <div className="flex min-h-full w-full items-center justify-center py-8">
                        <div className="relative w-full max-w-2xl bg-white p-6 sm:p-8 rounded-3xl shadow-2xl animate-in zoom-in-95 duration-200">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-black text-slate-900">
                                    แก้ไขข้อมูลผู้ใช้
                                </h2>
                                <button
                                    onClick={() => setEditingUser(null)}
                                    className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                                >
                                    <Icon
                                        icon="solar:close-circle-bold"
                                        width="24"
                                        className="text-slate-400 hover:text-slate-900"
                                    />
                                </button>
                            </div>

                            <form onSubmit={handleUpdateSubmit} className="space-y-6">
                                {/* Hidden SV Code field - ensure it's sent but not editable */}
                                <input
                                    type="hidden"
                                    name="sv_code"
                                    value={editingUser.sv_code}
                                />

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-400 uppercase ml-1">
                                            SV Code
                                        </label>
                                        <div className="w-full bg-slate-100 border-none rounded-xl py-3 px-4 font-bold text-slate-500 cursor-not-allowed">
                                            {editingUser.sv_code}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-400 uppercase ml-1">
                                            เปลี่ยนรหัสผ่าน (ถ้าต้องการ)
                                        </label>
                                        <input
                                            name="password"
                                            type="text"
                                            placeholder="เว้นว่างไว้ถ้าไม่ต้องการเปลี่ยน"
                                            className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 font-medium text-slate-900 focus:ring-2 focus:ring-gray-900/10 placeholder:text-slate-300"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase ml-1">
                                        ชื่อ-นามสกุล *
                                    </label>
                                    <input
                                        name="collector_name"
                                        type="text"
                                        required
                                        defaultValue={editingUser.collector_name}
                                        placeholder="ชื่อจริงผู้ใช้งาน"
                                        className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 font-medium text-slate-900 focus:ring-2 focus:ring-gray-900/10"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-400 uppercase ml-1">
                                            คณะ
                                        </label>
                                        <input
                                            name="faculty"
                                            type="text"
                                            defaultValue={editingUser.faculty}
                                            placeholder="คณะ"
                                            className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 font-medium text-slate-900 focus:ring-2 focus:ring-gray-900/10"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-400 uppercase ml-1">
                                            สาขา
                                        </label>
                                        <input
                                            name="major"
                                            type="text"
                                            defaultValue={editingUser.major}
                                            placeholder="สาขา"
                                            className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 font-medium text-slate-900 focus:ring-2 focus:ring-gray-900/10"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-400 uppercase ml-1">
                                            เบอร์โทร
                                        </label>
                                        <input
                                            name="phone"
                                            type="text"
                                            defaultValue={editingUser.phone}
                                            placeholder="เบอร์โทรศัพท์"
                                            className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 font-medium text-slate-900 focus:ring-2 focus:ring-gray-900/10"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase ml-1">
                                        สิทธิ์การใช้งาน (Role) *
                                    </label>
                                    <CustomRoleSelect
                                        name="role"
                                        defaultValue={editingUser.role}
                                    />
                                </div>

                                <div className="flex gap-4 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setEditingUser(null)}
                                        className="flex-1 bg-slate-100 text-slate-600 py-4 rounded-xl font-bold hover:bg-slate-200 transition-all"
                                    >
                                        ยกเลิก
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="flex-1 bg-gray-900 text-white py-4 rounded-xl font-bold shadow-lg shadow-gray-900/10 hover:bg-black transition-all flex justify-center items-center gap-2 disabled:opacity-50"
                                    >
                                        {loading ? (
                                            "กำลังบันทึก..."
                                        ) : (
                                            <>
                                                <Icon icon="solar:disk-bold" width="20" />{" "}
                                                บันทึกการแก้ไข
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Update Confirmation Modal */}
            {pendingUpdateData && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white p-6 rounded-3xl shadow-2xl w-full max-w-sm animate-in zoom-in-95 duration-200 text-center">
                        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Icon icon="solar:check-circle-bold-duotone" width="32" />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 mb-2">
                            ยืนยันการบันทึก?
                        </h3>
                        <p className="text-slate-500 mb-6 font-medium">
                            คุณต้องการบันทึกการเปลี่ยนแปลง <br />
                            <span className="text-slate-900 font-bold">
                                ข้อมูลผู้ใช้
                            </span>{" "}
                            ใช่หรือไม่?
                        </p>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setPendingUpdateData(null)}
                                className="flex-1 bg-slate-100 text-slate-600 py-3 rounded-xl font-bold hover:bg-slate-200 transition-all"
                            >
                                ตรวจสอบอีกครั้ง
                            </button>
                            <button
                                onClick={confirmUpdate}
                                disabled={loading}
                                className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all flex justify-center items-center gap-2 disabled:opacity-50"
                            >
                                {loading ? "กำลังบันทึก..." : "ยืนยัน"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {userToDelete && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white p-6 rounded-3xl shadow-2xl w-full max-w-sm animate-in zoom-in-95 duration-200 text-center">
                        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Icon icon="solar:trash-bin-trash-bold-duotone" width="32" />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 mb-2">
                            ยืนยันการลบ?
                        </h3>
                        <p className="text-slate-500 mb-6 font-medium">
                            คุณต้องการลบผู้ใช้{" "}
                            <span className="text-slate-900 font-bold">
                                {userToDelete.collector_name}
                            </span>{" "}
                            ใช่หรือไม่? <br />
                            <span className="text-xs text-red-400">
                                การกระทำนี้ไม่สามารถย้อนกลับได้
                            </span>
                        </p>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setUserToDelete(null)}
                                className="flex-1 bg-slate-100 text-slate-600 py-3 rounded-xl font-bold hover:bg-slate-200 transition-all"
                            >
                                ยกเลิก
                            </button>
                            <button
                                onClick={confirmDelete}
                                disabled={loading}
                                className="flex-1 bg-red-500 text-white py-3 rounded-xl font-bold shadow-lg shadow-red-500/20 hover:bg-red-600 transition-all flex justify-center items-center gap-2 disabled:opacity-50"
                            >
                                {loading ? "กำลังลบ..." : "ลบเลย"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Mobile/Tablet Card View */}
            <div className="block lg:hidden">
                {filteredUsers.length === 0 ? (
                    <div className="bg-white rounded-3xl p-16 text-center text-slate-400 border border-slate-100">
                        <Icon
                            icon="solar:user-cross-bold-duotone"
                            width="64"
                            className="mx-auto mb-4 opacity-30"
                        />
                        <p className="font-bold text-lg">ไม่พบผู้ใช้ในหมวดหมู่นี้</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredUsers.map((user) => (
                            <div
                                key={user.sv_code}
                                className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-4"
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                        <h3 className="font-bold text-slate-900 text-base sm:text-lg truncate">
                                            {user.collector_name}
                                        </h3>
                                        <p className="text-[10px] sm:text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-lg inline-block mt-1">
                                            {user.sv_code}
                                        </p>
                                    </div>
                                    <div className="shrink-0">
                                        {getRoleBadge(user.role)}
                                    </div>
                                </div>

                                <div className="space-y-2 text-sm text-slate-600">
                                    <div className="flex items-center gap-2">
                                        <Icon
                                            icon="solar:diploma-bold-duotone"
                                            className="text-slate-400"
                                        />
                                        <span>
                                            {user.faculty && user.major
                                                ? `${user.faculty} / ${user.major}`
                                                : user.faculty || user.major || "-"}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Icon
                                            icon="solar:phone-bold-duotone"
                                            className="text-slate-400"
                                        />
                                        <span>{user.phone || "-"}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Icon
                                            icon="solar:calendar-bold-duotone"
                                            className="text-slate-400"
                                        />
                                        <span>
                                            {new Date(user.created_at).toLocaleDateString(
                                                "th-TH",
                                            )}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex gap-2 pt-2 border-t border-slate-50">
                                    <button
                                        onClick={() => setEditingUser(user)}
                                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors font-bold text-sm"
                                    >
                                        <Icon icon="solar:pen-new-square-bold" width="18" />
                                        แก้ไข
                                    </button>
                                    <button
                                        onClick={() => requestDelete(user)}
                                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors font-bold text-sm"
                                    >
                                        <Icon icon="solar:trash-bin-trash-bold" width="18" />
                                        ลบ
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Desktop Users Table */}
            <div className="hidden lg:block bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
                                    SV Code
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
                                    ชื่อ-นามสกุล
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
                                    คณะ/สาขา
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider min-w-[120px]">
                                    เบอร์โทร
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider min-w-[140px]">
                                    สิทธิ์
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
                                    วันที่สร้าง
                                </th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">
                                    จัดการ
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredUsers.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={7}
                                        className="px-6 py-12 text-center text-slate-400"
                                    >
                                        <Icon
                                            icon="solar:user-cross-bold-duotone"
                                            width="48"
                                            className="mx-auto mb-2 opacity-50"
                                        />
                                        <p className="font-medium">
                                            ไม่พบผู้ใช้ในหมวดหมู่นี้
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((user) => (
                                    <tr
                                        key={user.sv_code}
                                        className="hover:bg-slate-50 transition-colors"
                                    >
                                        <td className="px-6 py-4 font-bold text-slate-900">
                                            {user.sv_code}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-slate-900">
                                            {user.collector_name}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600">
                                            {user.faculty && user.major
                                                ? `${user.faculty} / ${user.major}`
                                                : user.faculty || user.major || "-"}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600">
                                            {user.phone || "-"}
                                        </td>
                                        <td className="px-6 py-4">
                                            {getRoleBadge(user.role)}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600">
                                            {new Date(user.created_at).toLocaleDateString(
                                                "th-TH",
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => setEditingUser(user)}
                                                    className="inline-flex items-center gap-1 px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors font-medium text-sm"
                                                >
                                                    <Icon
                                                        icon="solar:pen-new-square-bold"
                                                        width="18"
                                                    />
                                                    แก้ไข
                                                </button>
                                                <button
                                                    onClick={() => requestDelete(user)}
                                                    className="inline-flex items-center gap-1 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium text-sm"
                                                >
                                                    <Icon
                                                        icon="solar:trash-bin-trash-bold"
                                                        width="18"
                                                    />
                                                    ลบ
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

const ROLE_OPTIONS = [
    {
        value: "user",
        label: "User (ผู้เก็บข้อมูล)",
        icon: "solar:user-rounded-bold",
        color: "text-green-600 bg-green-50",
    },
    {
        value: "admin",
        label: "Admin (ผู้ดูแลระบบ)",
        icon: "solar:shield-user-bold",
        color: "text-purple-600 bg-purple-50",
    },
    {
        value: "director",
        label: "Director (กรรมการคัดเลือก)",
        icon: "solar:user-id-bold",
        color: "text-blue-600 bg-blue-50",
    },
];

function CustomRoleSelect({
    name,
    defaultValue = "user",
}: {
    name: string;
    defaultValue?: string;
}) {
    const [selected, setSelected] = useState(defaultValue);

    return (
        <div className="relative">
            <input type="hidden" name={name} value={selected} />

            {/* Desktop Transition: Hidden on Desktop, Grid on Mobile */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {ROLE_OPTIONS.map((option) => (
                    <button
                        key={option.value}
                        type="button"
                        onClick={() => setSelected(option.value)}
                        className={`relative flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all group ${selected === option.value ? "bg-slate-900 border-slate-900 shadow-lg shadow-slate-900/10" : "bg-white border-slate-100 hover:border-slate-200"}`}
                    >
                        <div
                            className={`p-2 rounded-xl ${selected === option.value ? "bg-white/10 text-white" : option.color}`}
                        >
                            <Icon icon={option.icon} width="24" />
                        </div>
                        <span
                            className={`text-xs font-bold text-center ${selected === option.value ? "text-white" : "text-slate-600"}`}
                        >
                            {option.label}
                        </span>
                        {selected === option.value && (
                            <div className="absolute top-2 right-2">
                                <Icon
                                    icon="solar:check-circle-bold"
                                    className="text-emerald-400 bg-white rounded-full"
                                />
                            </div>
                        )}
                    </button>
                ))}
            </div>

            <p className="mt-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-1">
                การเลือกสิทธิ์จะมีผลต่อการเข้าถึงปุ่มต่างๆ ในระบบ
            </p>
        </div>
    );
}
