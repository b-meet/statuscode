"use client";

import React, { memo } from 'react';
import { Activity } from 'lucide-react';
import { ThemeConfig } from '@/lib/themes';
import { classNames } from '@/lib/utils';

interface EditorMaintenanceProps {
    showDummyData: boolean;
    theme: ThemeConfig;
}

export const EditorMaintenance = memo(({ showDummyData, theme: t }: EditorMaintenanceProps) => {
    return (
        <div>
            <h3 className={classNames(
                "text-xs uppercase tracking-[0.2em] font-bold mb-6 flex items-center gap-2",
                t.mutedText
            )}>
                <Activity className="w-3 h-3 text-indigo-400" /> Planned Maintenance
            </h3>
            {showDummyData ? (
                <div className={classNames(
                    "p-8 border-l-4 border-l-indigo-500",
                    t.card,
                    t.rounded
                )}>
                    <div className="flex items-center justify-between mb-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/20">UPCOMING</span>
                        <span className="text-xs text-white/50 font-mono">Oct 24</span>
                    </div>
                    <h4 className="font-medium text-white text-sm">Database Migration</h4>
                    <p className={classNames("text-xs mt-2 leading-relaxed", t.mutedText)}>
                        Scheduled updates to the cluster.
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
