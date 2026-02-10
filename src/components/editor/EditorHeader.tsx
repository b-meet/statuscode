"use client";

import React, { memo } from 'react';
import { Activity } from 'lucide-react';
import { ThemeConfig } from '@/lib/themes';
import { classNames } from '@/lib/utils';

interface EditorHeaderProps {
    logoUrl?: string;
    brandName?: string;
    isMobileLayout: boolean;
    serviceCount: number;
    theme: ThemeConfig;
}

export const EditorHeader = memo(({
    logoUrl,
    brandName,
    isMobileLayout,
    serviceCount,
    theme: t
}: EditorHeaderProps) => {
    return (
        <div className={classNames(
            "flex justify-between mb-8",
            isMobileLayout ? "flex-col gap-6" : "flex-row items-center gap-8"
        )}>
            <div className="flex items-center gap-4">
                {logoUrl ? (
                    <img src={logoUrl} alt="Logo" className={classNames(
                        "w-10 h-10 sm:w-16 sm:h-16 object-contain p-1.5 sm:p-2 bg-white/5 backdrop-blur-md border border-white/10",
                        t.rounded
                    )} />
                ) : (
                    <div className={classNames(
                        "w-10 h-10 sm:w-16 sm:h-16 bg-white/5 backdrop-blur-md flex items-center justify-center border border-white/10",
                        t.rounded
                    )}>
                        <Activity className="w-5 h-5 sm:w-8 sm:h-8 text-white/50" />
                    </div>
                )}
                <div>
                    <h1 className={classNames("text-lg sm:text-4xl text-white leading-tight", t.heading)}>
                        {brandName || "Brand Name"}
                    </h1>
                    <div className={classNames("flex items-center gap-2 mt-1 sm:mt-2 text-[10px] sm:text-sm font-medium", t.mutedText)}>
                        <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500 animate-pulse" />
                            Monitoring {serviceCount} services
                        </div>
                    </div>
                </div>
            </div>
            <div className="flex gap-4">
                <button className={classNames(
                    "w-full sm:w-auto px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-white transition-all backdrop-blur-md flex items-center justify-center gap-2",
                    t.rounded
                )}>
                    Report Issue
                </button>
            </div>
        </div>
    );
});

EditorHeader.displayName = 'EditorHeader';
