"use client";

import { memo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity } from 'lucide-react';
import { ThemeConfig, StatusColors, getBaseColor, getThemeColorHex } from '@/lib/themes';
import { Sparkline } from './Sparkline';
import { formatUptime, getAverageResponseTime } from '@/lib/utils';
import { MonitorData, Log } from '@/lib/types';

// Define explicit types used in the component
interface MonitorListProps {
    monitors: MonitorData[];
    setSelectedMonitorId: (id: string | null) => void;
    primaryColor: string;
    theme: ThemeConfig;
    colors?: StatusColors;
}

export const MonitorList = memo(({ monitors, setSelectedMonitorId, primaryColor, theme: t, colors }: MonitorListProps) => {
    const [hoveredId, setHoveredId] = useState<string | null>(null);

    // Dynamic Colors Helpers
    const opBase = getBaseColor(colors?.operational) || 'emerald';
    const maintBase = getBaseColor(colors?.maintenance) || 'blue';
    const downBase = getBaseColor(colors?.major) || 'red';

    const opHex = getThemeColorHex(opBase);
    const maintHex = getThemeColorHex(maintBase);
    const downHex = getThemeColorHex(downBase);

    // Helper to get tailwind class safe color
    const getColorClass = (base: string) => {
        if (base === 'white' || base === 'black') return `bg-${base}`;
        return `bg-${base}-500`;
    };

    const getTextClass = (base: string) => {
        if (base === 'white' || base === 'black') return `text-${base}`;
        return `text-${base}-400`;
    };

    return (
        <div className="space-y-6">
            <h3 className={`text-xs ${t.mutedText} uppercase tracking-[0.2em] font-bold mb-6 flex items-center gap-2`}>
                <Activity className="w-3 h-3" /> System Status
            </h3>

            {monitors.length > 0 ? (
                <div className="space-y-4">
                    <AnimatePresence mode="popLayout">
                        {monitors.map((monitor) => {
                            const uptime = formatUptime(monitor.custom_uptime_ratio);
                            const avgResponse = getAverageResponseTime(monitor.response_times);
                            const isUp = monitor.status === 2;
                            const isMaintenance = monitor.status === 0;
                            const statusType = isUp ? 'up' : isMaintenance ? 'maintenance' : 'down';
                            const hasData = !!uptime;
                            const isHovered = hoveredId === String(monitor.id);

                            // Determine active colors for this item
                            const activeBase = isUp ? opBase : isMaintenance ? maintBase : downBase;
                            const activeHex = isUp ? opHex : isMaintenance ? maintHex : downHex;
                            const activeBgClass = getColorClass(activeBase);
                            const activeTextClass = getTextClass(activeBase);

                            return (
                                <motion.div
                                    layout
                                    key={monitor.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{
                                        layout: { duration: 0.2, ease: "easeInOut" },
                                        opacity: { duration: 0.2 }
                                    }}
                                    onClick={() => setSelectedMonitorId(String(monitor.id))}
                                    className={`group relative overflow-hidden ${t.card} ${t.cardHover} ${t.rounded} cursor-pointer transition-colors duration-200`}
                                    onMouseEnter={() => setHoveredId(String(monitor.id))}
                                    onMouseLeave={() => setHoveredId(null)}
                                >
                                    <motion.div layout className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6 relative z-10">

                                        {/* Status & Info */}
                                        <div className="flex items-start gap-5 min-w-[200px]">
                                            <div className="relative mt-1.5 flex-shrink-0">
                                                <div className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full ${activeBgClass}`} style={{ boxShadow: `0 0 10px ${activeHex}` }} />
                                                <div className={`absolute inset-0 w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full animate-ping opacity-20 ${activeBgClass}`} />
                                            </div>
                                            <div>
                                                <h4 className={`text-base sm:text-lg text-white group-hover:text-indigo-300 transition-colors ${t.heading} line-clamp-1`}>{monitor.friendly_name}</h4>
                                                <div className={`text-xs ${t.mutedText} mt-1`} style={{ color: primaryColor }}>
                                                    99.9% Uptime
                                                </div>
                                            </div>
                                        </div>


                                        {/* Metrics */}
                                        <div className="flex-1 flex items-center justify-between sm:justify-end gap-8 sm:gap-12">

                                            {/* Sparkline */}
                                            <div className="hidden sm:block w-32 h-10 opacity-70 group-hover:opacity-100 transition-opacity">
                                                <Sparkline data={monitor.response_times || []} color={activeHex} />
                                            </div>

                                            {/* Stats */}
                                            <div className="flex items-center gap-6 text-right">
                                                <div className="space-y-0.5">
                                                    <div className="text-[10px] text-white/30 uppercase tracking-wider font-semibold">Latency</div>
                                                    <div className="font-mono text-sm text-white/80">
                                                        {avgResponse === 0 ? <span className="text-white/30">-</span> : `${avgResponse}ms`}
                                                    </div>
                                                </div>
                                                <div className="space-y-0.5">
                                                    <div className="text-[10px] text-white/30 uppercase tracking-wider font-semibold">24h</div>
                                                    <div className={`font-mono text-sm font-bold ${hasData && uptime && parseFloat(uptime.day) === 100 ? activeTextClass : hasData ? 'text-yellow-400' : 'text-zinc-600'}`}>
                                                        {hasData ? `${uptime?.day}%` : '-'}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Badge */}
                                            <div className={t.statusBadge(statusType, colors).replace("absolute", "") + " px-3 py-1 text-xs rounded-full font-medium shrink-0"}>
                                                {isUp ? 'OPERATIONAL' : isMaintenance ? 'MAINTENANCE' : 'DOWN'}
                                            </div>
                                        </div>
                                    </motion.div>

                                    {/* Expandable Incident Section */}
                                    <AnimatePresence>
                                        {isHovered && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.2, ease: "easeInOut" }}
                                                className="overflow-hidden bg-zinc-900/50 border-t border-white/5"
                                            >
                                                <div className="p-4 sm:px-6 pb-6">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <h5 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Recent Incidents</h5>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setSelectedMonitorId(String(monitor.id));
                                                            }}
                                                            className="text-[10px] text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
                                                        >
                                                            See All <Activity className="w-3 h-3" />
                                                        </button>
                                                    </div>

                                                    {(monitor.logs && monitor.logs.length > 0) ? (
                                                        <div className="space-y-3">
                                                            {monitor.logs.slice(0, 3).map((log: Log, i: number) => (
                                                                <div key={i} className="flex gap-3 text-sm">
                                                                    <div className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${log.type === 1 ? 'bg-red-500' : 'bg-emerald-500'}`} />
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="flex items-baseline justify-between gap-2">
                                                                            <span className={`font-medium truncate ${log.type === 1 ? 'text-red-400' : 'text-emerald-400'}`}>
                                                                                {log.type === 1 ? 'Outage Detected' : 'Service Recovered'}
                                                                            </span>
                                                                            <span className="text-[10px] text-zinc-500 font-mono whitespace-nowrap">
                                                                                {new Date(log.datetime * 1000).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                                            </span>
                                                                        </div>
                                                                        <p className="text-xs text-zinc-500 truncate mt-0.5">
                                                                            {log.type === 1 ? (log.reason?.code || 'Service Unavailable') : `Duration: ${Math.round(log.duration / 60)} mins`}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div className="text-xs text-zinc-500 py-2">No recent incidents.</div>
                                                    )}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            ) : (
                <div className={`text-center py-12 border border-dashed border-white/10 ${t.rounded} bg-white/5`}>
                    <p className={`${t.mutedText} text-sm`}>No monitors being tracked.</p>
                </div>
            )}
        </div>
    );
});

MonitorList.displayName = 'MonitorList';
