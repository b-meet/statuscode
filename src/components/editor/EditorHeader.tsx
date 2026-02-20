"use client";

import React, { memo } from 'react';
import { Activity } from 'lucide-react';
import { ThemeConfig } from '@/lib/themes';
import { classNames } from '@/lib/utils';
import { RefreshTimer } from '../status-page/RefreshTimer';

interface EditorHeaderProps {
    logoUrl?: string;
    brandName?: string;
    isMobileLayout: boolean;
    serviceCount: number;
    theme: ThemeConfig;
    supportEmail?: string;
    supportUrl?: string;
    pollInterval?: number;
    lastRefreshTime?: number | null;
}

export const EditorHeader = memo(({
    logoUrl,
    brandName,
    isMobileLayout,
    serviceCount,
    theme: t,
    supportEmail,
    supportUrl,
    pollInterval,
    lastRefreshTime
}: EditorHeaderProps) => {
    return (
        <div className={classNames(
            "flex justify-between mb-8",
            isMobileLayout ? "flex-col gap-5" : "flex-row items-center gap-8"
        )}>
            <div className="flex items-center gap-3 sm:gap-4">
                {logoUrl ? (
                    <img src={logoUrl} alt="Logo" className={classNames(
                        "w-12 h-12 sm:w-16 sm:h-16 object-contain p-2 bg-white/5 backdrop-blur-md border border-white/10",
                        t.rounded
                    )} />
                ) : (
                    <div className={classNames(
                        "w-12 h-12 sm:w-16 sm:h-16 bg-white/5 backdrop-blur-md flex items-center justify-center border border-white/10",
                        t.rounded
                    )}>
                        <Activity className="w-5 h-5 sm:w-8 sm:h-8 text-white/50" />
                    </div>
                )}
                <div className="min-w-0 flex-1">
                    <h1 className={classNames("text-lg sm:text-4xl text-white leading-tight truncate px-1", t.heading)}>
                        {brandName || "Brand Name"}
                    </h1>
                    <div className={classNames("flex items-center gap-4 mt-1 sm:mt-2 text-[10px] sm:text-sm font-medium px-1", t.mutedText)}>
                        <div className="flex items-center gap-1.5 whitespace-nowrap">
                            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500 animate-pulse" />
                            Monitoring {serviceCount} services
                        </div>
                        {pollInterval && lastRefreshTime && (
                            <>
                                <div className="w-1 h-1 rounded-full bg-white/20 hidden sm:block" />
                                <RefreshTimer intervalMs={pollInterval} lastRefresh={lastRefreshTime} className="font-mono text-[9px] sm:text-xs text-indigo-400" />
                            </>
                        )}
                    </div>
                </div>
            </div>
            <div className="flex gap-4 w-full sm:w-auto">
                {(supportEmail || supportUrl) && (
                    <a
                        href={supportUrl || `mailto:${supportEmail}`}
                        target={supportUrl ? "_blank" : undefined}
                        rel={supportUrl ? "noopener noreferrer" : undefined}
                        className={classNames(
                            "w-full sm:w-auto px-4 py-2.5 sm:py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-white transition-all backdrop-blur-md flex items-center justify-center gap-2",
                            t.rounded
                        )}
                    >
                        Report Issue
                    </a>
                )}
            </div>
        </div>
    );
});

EditorHeader.displayName = 'EditorHeader';
