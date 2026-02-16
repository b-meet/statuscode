"use client";

import React, { memo } from 'react';
import { CheckCircle2, AlertTriangle, Construction } from 'lucide-react';
import { ThemeConfig, StatusColors } from '@/lib/themes';
import { classNames } from '@/lib/utils';

interface StatusBannerProps {
    status: 'operational' | 'partial' | 'major' | 'maintenance' | 'maintenance_partial';
    totalAvgResponse: number;
    theme: ThemeConfig;
    colors?: StatusColors;
    visibility?: { showPerformanceMetrics: boolean };
}

// Safelist for dynamic classes (Tailwind JIT needs to see these)
// bg-emerald-500/5 ring-emerald-500/20 bg-emerald-500/10 text-emerald-500 ring-emerald-500/50 from-emerald-500
// bg-amber-500/5 ring-amber-500/20 bg-amber-500/10 text-amber-500 ring-amber-500/50 from-amber-500
// bg-red-500/5 ring-red-500/20 bg-red-500/10 text-red-500 ring-red-500/50 from-red-500
// bg-blue-500/5 ring-blue-500/20 bg-blue-500/10 text-blue-500 ring-blue-500/50 from-blue-500
// bg-sky-500/5 ring-sky-500/20 bg-sky-500/10 text-sky-500 ring-sky-500/50 from-sky-500
// bg-indigo-500/5 ring-indigo-500/20 bg-indigo-500/10 text-indigo-500 ring-indigo-500/50 from-indigo-500
// bg-violet-500/5 ring-violet-500/20 bg-violet-500/10 text-violet-500 ring-violet-500/50 from-violet-500
// bg-purple-500/5 ring-purple-500/20 bg-purple-500/10 text-purple-500 ring-purple-500/50 from-purple-500
// bg-fuchsia-500/5 ring-fuchsia-500/20 bg-fuchsia-500/10 text-fuchsia-500 ring-fuchsia-500/50 from-fuchsia-500
// bg-pink-500/5 ring-pink-500/20 bg-pink-500/10 text-pink-500 ring-pink-500/50 from-pink-500
// bg-rose-500/5 ring-rose-500/20 bg-rose-500/10 text-rose-500 ring-rose-500/50 from-rose-500
// bg-orange-500/5 ring-orange-500/20 bg-orange-500/10 text-orange-500 ring-orange-500/50 from-orange-500
// bg-yellow-500/5 ring-yellow-500/20 bg-yellow-500/10 text-yellow-500 ring-yellow-500/50 from-yellow-500
// bg-lime-500/5 ring-lime-500/20 bg-lime-500/10 text-lime-500 ring-lime-500/50 from-lime-500
// bg-green-500/5 ring-green-500/20 bg-green-500/10 text-green-500 ring-green-500/50 from-green-500
// bg-teal-500/5 ring-teal-500/20 bg-teal-500/10 text-teal-500 ring-teal-500/50 from-teal-500
// bg-cyan-500/5 ring-cyan-500/20 bg-cyan-500/10 text-cyan-500 ring-cyan-500/50 from-cyan-500
// bg-zinc-500/5 ring-zinc-500/20 bg-zinc-500/10 text-zinc-500 ring-zinc-500/50 from-zinc-500
// bg-stone-500/5 ring-stone-500/20 bg-stone-500/10 text-stone-500 ring-stone-500/50 from-stone-500

export const StatusBanner = memo(({ status, totalAvgResponse, theme: t, colors, visibility }: StatusBannerProps) => {
    const isMajor = status === 'major';
    const isPartial = status === 'partial';
    const isMaintenance = status === 'maintenance';
    const isMaintenancePartial = status === 'maintenance_partial';
    const isOperational = status === 'operational';

    const getBaseColor = (type: 'operational' | 'partial' | 'major' | 'maintenance') => {
        if (!colors) return null;
        const classString = colors[type];
        // Match bg-{color}-500 or text-{color}-500/400
        const match = classString.match(/(?:bg|text)-([a-z]+)(?:-\d+)?/);
        return match ? match[1] : null; // e.g. 'emerald'
    };

    const opColor = getBaseColor('operational') || 'emerald';
    const partColor = getBaseColor('partial') || 'amber';
    const majColor = getBaseColor('major') || 'red';
    const maintColor = getBaseColor('maintenance') || 'blue';

    const statusBannerStyle = () => {
        if (colors) {
            if (isMajor) return `bg-${majColor}-500/5 ring-1 ring-${majColor}-500/20`;
            if (isPartial) return `bg-${partColor}-500/5 ring-1 ring-${partColor}-500/20`;
            if (isMaintenance) return `bg-${maintColor}-500/5 ring-1 ring-${maintColor}-500/20`;
            if (isMaintenancePartial) return `bg-${partColor}-500/5 ring-1 ring-${partColor}-500/20`;
            return `bg-${opColor}-500/5 ring-1 ring-${opColor}-500/20`;
        }
        if (isMajor) return "bg-red-500/5 ring-1 ring-red-500/20";
        if (isPartial) return "bg-amber-500/5 ring-1 ring-amber-500/20";
        if (isMaintenance) return "bg-blue-500/5 ring-1 ring-blue-500/20";
        if (isMaintenancePartial) return "bg-amber-500/5 ring-1 ring-amber-500/20";
        return "bg-emerald-500/5 ring-1 ring-emerald-500/20";
    };

    const statusIconColor = () => {
        if (colors) {
            if (isMajor) return `bg-${majColor}-500/10 text-${majColor}-500 ring-1 ring-${majColor}-500/50 shadow-[0_0_30px_rgba(var(--color-${majColor}-500),0.3)] shadow-${majColor}-500/20`;
            // Tailwind shadow with opacity is hard dynamically. fallback to simple shadow class if exists or just standard shadow.
            // simpler: `shadow-lg shadow-${color}-500/20`
            if (isMajor) return `bg-${majColor}-500/10 text-${majColor}-500 ring-1 ring-${majColor}-500/50`;
            if (isPartial) return `bg-${partColor}-500/10 text-${partColor}-500 ring-1 ring-${partColor}-500/50`;
            if (isMaintenance) return `bg-${maintColor}-500/10 text-${maintColor}-500 ring-1 ring-${maintColor}-500/50`;
            if (isMaintenancePartial) return `bg-${partColor}-500/10 text-${partColor}-500 ring-1 ring-${partColor}-500/50`;
            return `bg-${opColor}-500/10 text-${opColor}-500 ring-1 ring-${opColor}-500/50`;
        }
        if (isMajor) return "bg-red-500/10 text-red-500 ring-1 ring-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.3)]";
        if (isPartial) return "bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/50 shadow-[0_0_30px_rgba(245,158,11,0.3)]";
        if (isMaintenance) return "bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/50 shadow-[0_0_30px_rgba(59,130,246,0.3)]";
        if (isMaintenancePartial) return "bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/50 shadow-[0_0_30px_rgba(245,158,11,0.3)]";
        return "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.3)]";
    };

    // Helper for title text
    const getTitle = () => {
        if (isOperational) return "All Systems Operational";
        if (isMajor) return "Major System Outage";
        if (isPartial) return "Partial System Outage";
        if (isMaintenance) return "System Under Maintenance";
        if (isMaintenancePartial) return "Partial System Maintenance";
        return "";
    };

    // Helper for description text
    const getDescription = () => {
        if (isOperational) return "All services are functioning normally.";
        if (isMajor) return "Large-scale service disruption. Check below.";
        if (isPartial) return "Some monitors are experiencing issues.";
        if (isMaintenance) return "We are currently performing scheduled maintenance.";
        if (isMaintenancePartial) return "Some systems are undergoing maintenance.";
        return "";
    };

    // Helper for gradient color
    const getGradientColor = () => {
        if (colors) {
            if (isMajor) return `from-${majColor}-500`;
            if (isPartial || isMaintenancePartial) return `from-${partColor}-500`;
            if (isMaintenance) return `from-${maintColor}-500`;
            return `from-${opColor}-500`;
        }
        if (isMajor) return "from-red-500";
        if (isPartial || isMaintenancePartial) return "from-amber-500";
        if (isMaintenance) return "from-blue-500";
        return "from-emerald-500";
    };

    return (
        <div className={`p-4 sm:p-5 md:p-10 mb-8 md:mb-20 relative overflow-hidden transition-all duration-500 group ${t.rounded} ${statusBannerStyle()}`}>
            {/* Dynamic Glow */}
            <div className={`absolute top-0 right-0 -mr-20 -mt-20 w-40 h-40 sm:w-80 sm:h-80 bg-gradient-to-br rounded-full blur-2xl sm:blur-3xl opacity-20 pointer-events-none group-hover:opacity-40 transition-opacity duration-700 ${getGradientColor()} to-transparent`} />

            <div className={classNames(
                "relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-10"
            )}>
                <div className={`p-6 rounded-full shrink-0 ${statusIconColor()}`}>
                    {isOperational ? <CheckCircle2 className="w-10 h-10" /> :
                        (isMaintenance || isMaintenancePartial) ? <Construction className="w-10 h-10" /> :
                            <AlertTriangle className="w-10 h-10" />}
                </div>

                <div className="text-center md:text-left flex-1">
                    <h2 className={`text-lg sm:text-3xl text-white mb-2 ${t.heading} drop-shadow-sm`}>
                        {getTitle()}
                    </h2>
                    <p className={`${t.mutedText} text-sm sm:text-lg leading-relaxed max-w-xl mx-auto md:mx-0`}>
                        {getDescription()}
                    </p>
                </div>

                {/* Global Metrics Pill */}
                {visibility?.showPerformanceMetrics !== false && (
                    <div className={classNames(
                        "bg-black/20 p-4 sm:p-6 backdrop-blur-sm border border-white/5",
                        t.rounded,
                        "w-full md:w-auto flex flex-col md:flex-row items-center gap-4 md:gap-8"
                    )}>
                        <div>
                            <div className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-1">Avg Latency</div>
                            <div className="text-xl sm:text-2xl font-mono text-white flex items-baseline gap-1">
                                {totalAvgResponse === 0 ? '< 1' : totalAvgResponse}<span className="text-xs sm:text-sm text-white/40">ms</span>
                            </div>
                        </div>

                        <div className="w-px h-10 bg-white/10 hidden md:block" />
                        <div className="h-px w-full bg-white/10 block md:hidden" />

                        <div>
                            <div className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-1">Uptime</div>
                            <div className="text-xl sm:text-2xl font-mono text-emerald-400">99.9%</div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
});

StatusBanner.displayName = 'StatusBanner';
