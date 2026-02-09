"use client";

import Link from "next/link";
import { User, LogOut } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = createClient();
    const router = useRouter();

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push("/");
    };

    return (
        <div className="min-h-screen bg-black text-white flex flex-col">
            {/* Header */}
            <header className="h-16 border-b border-zinc-800 flex items-center justify-between px-6 lg:px-12 bg-zinc-950/50 backdrop-blur-md sticky top-0 z-50">
                <Link href="/dashboard" className="font-bold text-xl tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
                    Statuscode
                </Link>

                <div className="flex items-center gap-6">
                    <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-zinc-400">
                        <Link href="/dashboard" className="text-white hover:text-white transition-colors">Projects</Link>
                        <a href="#" className="hover:text-white transition-colors">Analytics</a>
                        <a href="#" className="hover:text-white transition-colors">Settings</a>
                    </nav>

                    <div className="h-6 w-[1px] bg-zinc-800 hidden md:block" />

                    <div className="flex items-center gap-4">
                        <button className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
                            <User className="w-4 h-4" />
                        </button>
                        <button onClick={handleSignOut} className="text-zinc-500 hover:text-white transition-colors">
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 p-6 lg:p-12 max-w-7xl mx-auto w-full">
                {children}
            </main>
        </div>
    );
}
