"use client";

import React, { memo } from 'react';
import { Activity } from 'lucide-react';
import { ThemeConfig } from '@/lib/themes';
import { classNames } from '@/lib/utils';
import { useEditor } from '@/context/EditorContext';

interface EditorMaintenanceProps {
    showDummyData: boolean;
    theme: ThemeConfig;
}

export const EditorMaintenance = memo(({ showDummyData, theme: t }: EditorMaintenanceProps) => {
    const { config } = useEditor();

    const isFullMaintenance = config.previewScenario === 'maintenance_full';
    const isPartialMaintenance = config.previewScenario === 'maintenance_partial';

    const isMaintenanceActive = showDummyData || isFullMaintenance || isPartialMaintenance || config.previewScenario === 'heavy_incidents';

    // Determine styles based on maintenance type
    const isAmber = isPartialMaintenance;
    const activeColor = isAmber ? 'text-amber-400' : 'text-indigo-400';
    const activeBg = isAmber ? 'bg-amber-500/20' : 'bg-indigo-500/20';
    const activeBorder = isAmber ? 'border-amber-500/20' : 'border-indigo-500/20';
    const activeBorderL = isAmber ? 'border-l-amber-500' : 'border-l-indigo-500';

    return (
        <div>
            <h3 className={classNames(
                "text-xs uppercase tracking-[0.2em] font-bold mb-6 flex items-center gap-2",
                t.mutedText
            )}>
                <Activity className={`w-3 h-3 ${activeColor}`} /> Planned Maintenance
            </h3>
            {isMaintenanceActive ? (
                <div className={classNames(
                    "p-8 border-l-4",
                    activeBorderL,
                    t.card,
                    t.rounded
                )}>
                    <div className="flex items-center justify-between mb-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${activeBg} ${activeColor} border ${activeBorder}`}>
                            {isAmber ? 'PARTIAL OUTAGE' : 'UPCOMING'}
                        </span>
                        <span className="text-xs text-white/50 font-mono">Oct 24</span>
                    </div>
                    <h4 className="font-medium text-white text-sm">
                        {isAmber ? 'Partial System Maintenance' : 'System-wide Maintenance'}
                    </h4>
                    <p className={classNames("text-xs mt-2 leading-relaxed", t.mutedText)}>
                        {isAmber
                            ? "Some systems are currently under maintenance."
                            : "Scheduled updates to the cluster."}
                    </p>
                </div>
            ) : (
                <div className={classNames(
                    "p-8 text-center border border-dashed border-white/10",
                    t.card,
                    t.rounded
                )}>
                    <Activity className="w-6 h-6 text-white/20 mx-auto mb-4" />
                    <h4 className="text-sm font-medium text-white/80">All Systems Go</h4>
                </div>
            )}
        </div>
    );
});

EditorMaintenance.displayName = 'EditorMaintenance';
