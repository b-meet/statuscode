"use client";

import { Activity } from "lucide-react";
import { ThemeConfig } from "@/lib/themes";
import { classNames } from "@/lib/utils";

interface MaintenanceProps {
    theme: ThemeConfig;
}

export function Maintenance({ theme: t }: MaintenanceProps) {
    // TODO: Dynamic maintenance windows from API if available
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
