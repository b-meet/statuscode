"use client";

import { LayoutDashboard } from "lucide-react";
import Link from "next/link";
import BrandSettings from "./BrandSettings";
import ThemeSelector from "./ThemeSelector";
import LayoutSelector from "./LayoutSelector";
import MonitorManager from "./MonitorManager";
import PreviewSelector from "./PreviewSelector";

export default function Sidebar() {
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

                    {/* Section 2: Configuration (Theme, Layout, Monitors) */}
                    <div className="space-y-1">
                        <ThemeSelector />
                        <LayoutSelector />
                        <MonitorManager />
                    </div>

                    <div className="border-t border-zinc-800/50" />

                    {/* Section 3: Preview Scenarios */}
                    <PreviewSelector />
                </div>
            </div>

            {/* Footer / Account */}
            <div className="p-4 border-t border-zinc-800 bg-zinc-950/30">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500" />
                    <div className="text-xs">
                        <div className="text-white font-medium">Logged In User</div>
                        <div className="text-zinc-500">Free Plan</div>
                    </div>
                </div>
            </div>
        </aside>
    );
}
