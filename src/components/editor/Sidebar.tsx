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

import Image from "next/image";

export default function Sidebar() {
    const { user } = useEditor();
    return (
        <aside className="flex flex-col shrink-0 h-full overflow-hidden">
            {/* Header */}
            <div className="h-14 px-6 border-b border-zinc-800 flex items-center shrink-0">
                <div className="flex items-center gap-2">
                    <Image src="/logo.svg" alt="Statuscode" width={24} height={24} className="w-6 h-6" />
                    <div className="font-bold text-lg bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">Statuscode</div>
                </div>
            </div>

            {/* Content Scroller */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
                <div className="p-4 space-y-6">

                    {/* Section 1: Brand */}
                    <BrandSettings />

                    <div className="border-t border-zinc-800/50" />

                    {/* Section 2: Appearance (Theme, Colors, Layout, Visibility) */}
                    <div className="space-y-2">
                        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Appearance</h3>
                        <div className="space-y-1">
                            <ThemeSelector />
                            <ColorPresetSelector />
                            <LayoutSelector />
                            <VisibilitySettings />
                        </div>
                    </div>

                    <div className="border-t border-zinc-800/50" />

                    {/* Section 3: Monitoring & Maintenance */}
                    <div className="space-y-2">
                        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Monitoring & Maintenance</h3>
                        <div className="space-y-1">
                            <MonitorManager />
                            <MaintenanceManager />
                        </div>
                    </div>

                    <div className="border-t border-zinc-800/50" />

                    {/* Section 4: Preview Scenarios */}
                    <div className="space-y-2">
                        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Preview</h3>
                        <PreviewSelector />
                    </div>
                </div>
            </div>

            {/* Footer / Account */}
            <Link
                href="/dashboard"
                className="p-4 border-t border-zinc-800 bg-zinc-950/30 hover:bg-zinc-800/80 transition-colors group block"
                title="Back to Dashboard"
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <UserAvatar user={user} />
                        <div className="text-xs">
                            <div className="text-white font-medium group-hover:text-amber-400 transition-colors">{user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}</div>
                            <div className="text-zinc-500">Free Plan</div>
                        </div>
                    </div>
                    <div className="p-2 rounded-lg text-zinc-500 group-hover:text-amber-400 group-hover:bg-amber-400/10 transition-all">
                        <LayoutDashboard className="w-4 h-4" />
                    </div>
                </div>
            </Link>
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
