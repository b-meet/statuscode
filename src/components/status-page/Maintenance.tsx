"use client";

import { Activity } from "lucide-react";
import { ThemeConfig } from "@/lib/themes";
import { classNames } from "@/lib/utils";
import { Markdown } from "@/components/ui/markdown";

import { MaintenanceWindow } from "@/lib/types";

interface MaintenanceProps {
    theme: ThemeConfig;
    windows?: MaintenanceWindow[];
}

export function Maintenance({ theme: t, windows = [] }: MaintenanceProps) {
    const activeWindows = windows.filter(m => {
        const start = new Date(m.startTime).getTime();
        const end = start + m.durationMinutes * 60000;
        const now = Date.now();
        return end > now;
    }).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

    if (activeWindows.length === 0) {
        return (
            <div>
                <h3 className={classNames(
                    "text-xs uppercase tracking-[0.2em] font-bold mb-6 flex items-center gap-2",
                    t.mutedText
                )}>
                    <Activity className="w-3 h-3" /> Planned Maintenance
                </h3>
                <div className={classNames(
                    "p-8 text-center border border-dashed border-white/10",
                    t.card,
                    t.rounded
                )}>
                    <Activity className="w-6 h-6 text-white/20 mx-auto mb-4" />
                    <h4 className="text-sm font-medium text-white/80">All Systems Go</h4>
                </div>
            </div>
        );
    }

    const firstWindow = activeWindows[0];
    const isAmber = firstWindow.monitorId !== 'all';

    // Derived values for the display
    const activeColor = isAmber ? 'text-amber-400' : 'text-indigo-400';
    const activeBg = isAmber ? 'bg-amber-500/20' : 'bg-indigo-500/20';
    const activeBorder = isAmber ? 'border-amber-500/20' : 'border-indigo-500/20';
    const activeBorderL = isAmber ? 'border-l-amber-500' : 'border-l-indigo-500';

    const displayTitle = firstWindow.title;
    const displayDesc = firstWindow.description || "Scheduled maintenance is currently in progress.";
    const displayDate = new Date(firstWindow.startTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' });
    const statusLabel = new Date(firstWindow.startTime) > new Date() ? 'UPCOMING' : 'IN PROGRESS';

    return (
        <div>
            <h3 className={classNames(
                "text-xs uppercase tracking-[0.2em] font-bold mb-6 flex items-center gap-2",
                t.mutedText
            )}>
                <Activity className={`w-3 h-3 ${activeColor}`} /> Planned Maintenance
            </h3>
            <div className={classNames(
                "p-8 border-l-4",
                activeBorderL,
                t.card,
                t.rounded
            )}>
                <div className="flex items-center justify-between mb-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${activeBg} ${activeColor} border ${activeBorder}`}>
                        {statusLabel}
                    </span>
                    <span className="text-xs text-white/50 font-mono">{displayDate}</span>
                </div>
                <h4 className="font-medium text-white text-sm">
                    {displayTitle}
                </h4>
                <div className={classNames("text-xs mt-2 leading-relaxed", t.mutedText)}>
                    <Markdown content={displayDesc} />
                </div>
            </div>
        </div>
    );
}
