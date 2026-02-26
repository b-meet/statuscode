"use client";

import { LayoutDashboard } from "lucide-react";
import { useEditor } from "@/context/EditorContext";
import Link from "next/link";
import BrandIdentityManager from "./BrandIdentityManager";
import BrandLogoManager from "./BrandLogoManager";
import BrandSupportManager from "./BrandSupportManager";
import ThemeSelector from "./ThemeSelector";
import LayoutSelector from "./LayoutSelector";
import MonitorManager from "./MonitorManager";
import PreviewSelector from "./PreviewSelector";
import ColorPresetSelector from "./ColorPresetSelector";
import VisibilitySettings from "./VisibilitySettings";
import MaintenanceManager from "./MaintenanceManager";
import UserAvatar from "../ui/UserAvatar";

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

                    {/* Section 1: Brand Configuration */}
                    <div className="space-y-2">
                        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Brand Configuration</h3>
                        <div className="space-y-1">
                            <BrandIdentityManager />
                            <BrandLogoManager />
                            <BrandSupportManager />
                        </div>
                    </div>

                    <div className="border-t border-zinc-800/50" />

                    {/* Section 2: Monitoring & Maintenance */}
                    <div className="space-y-2">
                        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Monitoring & Maintenance</h3>
                        <div className="space-y-1">
                            <MonitorManager />
                            <MaintenanceManager />
                        </div>
                    </div>

                    <div className="border-t border-zinc-800/50" />

                    {/* Section 3: Appearance (Theme, Colors, Layout, Visibility) */}
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
                        <UserAvatar user={user} size="md" />
                        <div className="text-xs">
                            <div className="text-white font-medium group-hover:text-indigo-400 transition-colors">{user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}</div>
                            <div className="text-zinc-500">Tier: Professional</div>
                        </div>
                    </div>
                    <div className="p-2 rounded-lg text-zinc-500 group-hover:text-indigo-400 group-hover:bg-indigo-400/10 transition-all">
                        <LayoutDashboard className="w-4 h-4" />
                    </div>
                </div>
            </Link>
        </aside>
    );
}
