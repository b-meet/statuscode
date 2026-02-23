"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { User, LogOut, Bell, Settings, BarChart3 as Analytics, ChevronDown, LayoutDashboard } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import NotificationSidebar from "@/components/dashboard/NotificationSidebar";
import { Site, AppNotification } from "@/lib/types";
import Image from "next/image";
import { useNotifications } from "@/context/NotificationContext";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = createClient();
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [sites, setSites] = useState<Site[]>([]);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

    useEffect(() => {
        supabase.auth.getUser().then((res: any) => {
            if (res.data?.user) setUser(res.data.user);
        });

        const fetchSites = async () => {
            const { data } = await supabase.from('sites').select('*').order('created_at', { ascending: false });
            if (data) setSites(data);
        };

        fetchSites();
    }, [supabase]);

    const initials = user
        ? (user.user_metadata?.full_name || user.email || '?')
            .split(' ')
            .map((n: string) => n[0])
            .slice(0, 2)
            .join('')
            .toUpperCase()
        : '';

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push("/");
    };

    return (
        <div className="min-h-screen bg-black text-white flex flex-col">
            {/* Header */}
            <header className="h-16 border-b border-zinc-800 flex items-center justify-between px-6 lg:px-12 bg-zinc-950/50 backdrop-blur-md sticky top-0 z-50">
                <Link href="/dashboard" className="flex items-center gap-2">
                    <Image src="/logo.svg" alt="Statuscode" width={32} height={32} className="w-8 h-8" />
                    <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
                        Statuscode
                    </span>
                </Link>

                <div className="flex items-center gap-4">
                    {/* Notifications */}
                    <NotificationBell onClick={() => setIsSidebarOpen(true)} />

                    <div className="h-6 w-[1px] bg-zinc-800 mx-2" />

                    {/* Profile Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                            className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition-all group"
                        >
                            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold border border-white/10 group-hover:scale-105 transition-transform">
                                {user ? initials : <User className="w-4 h-4" />}
                            </div>
                            <ChevronDown className={`w-4 h-4 text-zinc-500 group-hover:text-zinc-300 transition-transform duration-300 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                        </button>

                        <AnimatePresence>
                            {isUserMenuOpen && (
                                <>
                                    {/* Backdrop */}
                                    <div className="fixed inset-0 z-40" onClick={() => setIsUserMenuOpen(false)} />

                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                        className="absolute right-0 mt-3 w-56 rounded-2xl bg-[#0c0c0e] border border-zinc-800 shadow-2xl p-2 z-50 overflow-hidden"
                                    >
                                        <div className="px-4 py-3 mb-2 border-b border-zinc-800/50">
                                            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">Account</p>
                                            <p className="text-sm font-semibold text-white truncate">{user?.email}</p>
                                        </div>

                                        <div className="space-y-1">
                                            <Link
                                                href="/dashboard"
                                                onClick={() => setIsUserMenuOpen(false)}
                                                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-all group/item"
                                            >
                                                <LayoutDashboard className="w-4 h-4 group-hover/item:text-indigo-400" />
                                                Projects
                                            </Link>
                                            <a
                                                href="#"
                                                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-all group/item"
                                            >
                                                <Analytics className="w-4 h-4 group-hover/item:text-emerald-400" />
                                                Analytics
                                            </a>
                                            <a
                                                href="#"
                                                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-all group/item"
                                            >
                                                <Settings className="w-4 h-4 group-hover/item:text-amber-400" />
                                                Settings
                                            </a>
                                        </div>

                                        <div className="h-[1px] bg-zinc-800/50 my-2 mx-2" />

                                        <button
                                            onClick={handleSignOut}
                                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-400/5 transition-all group/item"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            Sign Out
                                        </button>
                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 p-6 lg:p-12 max-w-7xl mx-auto w-full">
                {children}
            </main>

            <SidebarWrapper
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                sites={sites}
            />
        </div>
    );
}

// Sub-components to consume context
function NotificationBell({ onClick }: { onClick: () => void }) {
    const { notifications } = useNotifications();
    return (
        <button
            onClick={onClick}
            className="p-2 rounded-xl bg-zinc-900/50 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 transition-all relative group"
        >
            <Bell className="w-5 h-5" />
            {notifications.some((n: AppNotification) => !n.is_read) && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-500 border border-zinc-950 shadow-[0_0_10px_rgba(99,102,241,0.6)] group-hover:scale-110 transition-transform animate-pulse" />
            )}
        </button>
    );
}

function SidebarWrapper({ isOpen, onClose, sites }: { isOpen: boolean, onClose: () => void, sites: Site[] }) {
    const { notifications, isLoading, fetchNotifications } = useNotifications();
    return (
        <NotificationSidebar
            isOpen={isOpen}
            onClose={onClose}
            sites={sites}
            notifications={notifications}
            isLoading={isLoading}
            onRefresh={fetchNotifications}
        />
    );
}
