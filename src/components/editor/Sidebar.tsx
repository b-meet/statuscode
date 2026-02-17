"use client";

import { LayoutDashboard } from "lucide-react";
import { useEditor } from "@/context/EditorContext";
import Link from "next/link";
import BrandSettings from "./BrandSettings";
import ThemeSelector from "./ThemeSelector";
import LayoutSelector from "./LayoutSelector";
import MonitorManager from "./MonitorManager";
import PreviewSelector from "./PreviewSelector";
import ColorPresetSelector from "./ColorPresetSelector";
import VisibilitySettings from "./VisibilitySettings";
import MaintenanceManager from "./MaintenanceManager";

export default function Sidebar() {
    const { user } = useEditor();
    return (
        <aside className="flex flex-col shrink-0 h-full overflow-hidden">
            {/* Header */}
            <div className="h-14 px-6 border-b border-zinc-800 flex items-center justify-between shrink-0">
                <div className="font-bold text-lg bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">Statuscode</div>
                <Link
                    href="/dashboard"
                    className="p-2 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 transition-all group"
                    title="Back to Dashboard"
                >
                    <LayoutDashboard className="w-4 h-4" />
                </Link>
            </div>

            {/* Content Scroller */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
                <div className="p-6 space-y-8">

                    {/* Section 1: Brand */}
                    <BrandSettings />

                    <div className="border-t border-zinc-800/50" />

                    {/* Section 2: Configuration (Theme, Layout, Monitors, Visibility) */}
                    <div className="space-y-1">
                        <ThemeSelector />
                        <ColorPresetSelector />
                        <LayoutSelector />
                        <VisibilitySettings />
                        <MonitorManager />
                        <MaintenanceManager />
                    </div>

                    <div className="border-t border-zinc-800/50" />

                    {/* Section 3: Preview Scenarios */}
                    <PreviewSelector />
                </div>
            </div>

            {/* Footer / Account */}
            <div className="p-4 border-t border-zinc-800 bg-zinc-950/30">
                <div className="flex items-center gap-3">
                    <UserAvatar user={user} />
                    <div className="text-xs">
                        <div className="text-white font-medium">{user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}</div>
                        <div className="text-zinc-500">Free Plan</div>
                    </div>
                </div>
            </div>
        </aside>
    );
}

function UserAvatar({ user }: { user: any }) {
    if (!user) return <div className="w-8 h-8 rounded-full bg-zinc-800 animate-pulse" />;

    const initials = (user.user_metadata?.full_name || user.email || '?')
        .split(' ')
        .map((n: string) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();

    // Generate a consistent deep color based on user ID
    const getDeepColor = (id: string) => {
        const colors = [
            'bg-indigo-900', 'bg-blue-900', 'bg-emerald-900',
            'bg-rose-900', 'bg-purple-900', 'bg-amber-900',
            'bg-cyan-900', 'bg-fuchsia-900', 'bg-lime-950'
        ];
        let hash = 0;
        for (let i = 0; i < id.length; i++) {
            hash = id.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    };

    const bgClass = getDeepColor(user.id);

    return (
        <div className={`w-8 h-8 rounded-full ${bgClass} flex items-center justify-center border border-white/10`}>
            <span className="text-xs font-bold text-white/90 tracking-wide">{initials}</span>
        </div>
    );
}
