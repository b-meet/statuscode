"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity } from "lucide-react";
import { ThemeConfig, StatusColors, getBaseColor, getThemeColorHex } from '@/lib/themes';
import { Sparkline } from './Sparkline';
import { UptimeBars } from './UptimeBars';
import { MonitorData, IncidentUpdate } from "@/lib/types";
import { toDemoStringId } from "@/lib/mockMonitors";
import { formatUptime, getAverageResponseTime, getLogReason, formatDuration } from "@/lib/utils";
import { Markdown } from "@/components/ui/markdown";

// --- Helpers ---
// These functions are now imported from "@/lib/utils"

interface MonitorListProps {
    monitors: MonitorData[];
    theme: ThemeConfig;
    setSelectedMonitorId: (id: string | null) => void;
    colors?: StatusColors;
    visibility?: { showSparklines: boolean; showIncidentHistory: boolean; showUptimeBars: boolean };
    annotations?: Record<string, IncidentUpdate[]>;
    brandName?: string;
}

export function MonitorList({ monitors, theme: t, setSelectedMonitorId, colors, visibility, annotations, brandName }: MonitorListProps) {
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
        <div className="space-y-6 @container">
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
                                    onClick={() => {
                                        const idStr = monitor.id < 0 ? toDemoStringId(monitor.id) : String(monitor.id);
                                        setSelectedMonitorId(idStr);
                                    }}
                                    className={`group relative overflow-hidden ${t.card} ${t.cardHover} ${t.rounded} cursor-pointer transition-colors duration-200`}
                                    onMouseEnter={() => setHoveredId(String(monitor.id))}
                                    onMouseLeave={() => setHoveredId(null)}
                                >
                                    <motion.div layout className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6 relative z-10">

                                        {/* Status & Info - Left Side */}
                                        <div className="flex-1 min-w-0 w-full">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex items-start gap-3 min-w-0">
                                                    <div className="relative mt-1.5 flex-shrink-0">
                                                        <div className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full ${activeBgClass}`} style={{ boxShadow: `0 0 10px ${activeHex}` }} />
                                                        <div className={`absolute inset-0 w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full animate-ping opacity-20 ${activeBgClass}`} />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <h4 className={`text-base sm:text-lg text-white group-hover:text-indigo-300 transition-colors ${t.heading} line-clamp-1 flex items-center gap-2`}>
                                                            <span className="truncate">{monitor.friendly_name}</span>
                                                            {annotations?.[monitor.id] && annotations[monitor.id].length > 0 && (
                                                                <span className="flex h-2 w-2 relative flex-shrink-0" title="Active Status Update">
                                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                                                                </span>
                                                            )}
                                                        </h4>
                                                        <div className={`text-xs ${t.mutedText} flex items-center gap-3 mt-1`}>
                                                            <span>{uptime?.month || '99.9'}% Uptime</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Mobile Badge */}
                                                <div className={`sm:hidden ${t.statusBadge(statusType, colors).replace("absolute", "")} px-2.5 py-0.5 text-[10px] rounded-full font-medium shrink-0`}>
                                                    {isUp ? 'OPERATIONAL' : 'MAINTENANCE'}
                                                </div>
                                            </div>

                                            {/* Mobile Stats Row */}
                                            <div className="flex sm:hidden items-center justify-between gap-4 mt-3 pl-5.5 border-t border-white/5 pt-3">
                                                <div className="flex items-center gap-4">
                                                    <div className="space-y-0.5">
                                                        <div className="text-[9px] text-white/30 uppercase tracking-wider font-semibold">Latency</div>
                                                        <div className="font-mono text-xs text-white/80">
                                                            {avgResponse === 0 ? <span className="text-white/30">-</span> : `${avgResponse}ms`}
                                                        </div>
                                                    </div>
                                                    <div className="space-y-0.5">
                                                        <div className="text-[9px] text-white/30 uppercase tracking-wider font-semibold">24h</div>
                                                        <div className={`font-mono text-xs font-bold ${hasData && uptime && parseFloat(uptime.day) === 100 ? activeTextClass : hasData ? 'text-yellow-400' : 'text-zinc-600'}`}>
                                                            {hasData ? `${uptime?.day}%` : '-'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Uptime Bars - Full Width on Desktop Container */}
                                            {visibility?.showUptimeBars !== false && (
                                                <div className="hidden @[1000px]:block h-6 w-[98%] mt-3 sm:mt-2 opacity-60 group-hover:opacity-100 transition-opacity pl-0 sm:pl-6">
                                                    <UptimeBars monitor={monitor} theme={t} colors={colors} gap={1} />
                                                </div>
                                            )}
                                        </div>

                                        {/* Desktop Metrics - Right Side */}
                                        <div className="hidden sm:flex items-center justify-end gap-6">

                                            {/* Sparkline */}
                                            {visibility?.showSparklines !== false && (
                                                <div className="w-32 h-10 opacity-70 group-hover:opacity-100 transition-opacity">
                                                    <Sparkline data={monitor.response_times || []} color={activeHex} />
                                                </div>
                                            )}

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

                                            {/* Desktop Badge */}
                                            <div className={t.statusBadge(statusType, colors).replace("absolute", "") + " px-3 py-1 text-xs rounded-full font-medium shrink-0"}>
                                                {isUp ? 'OPERATIONAL' : 'MAINTENANCE'}
                                            </div>
                                        </div>
                                    </motion.div>

                                    {/* Expandable Incident Section (Combined History) */}
                                    <AnimatePresence>
                                        {(isHovered && visibility?.showIncidentHistory !== false) && (
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
                                                                const idStr = monitor.id < 0 ? toDemoStringId(monitor.id) : String(monitor.id);
                                                                setSelectedMonitorId(idStr);
                                                            }}
                                                            className="text-[10px] text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
                                                        >
                                                            See All <Activity className="w-3 h-3" />
                                                        </button>
                                                    </div>

                                                    {(() => {
                                                        const updates = annotations?.[monitor.id] || [];
                                                        const logs = monitor.logs || [];

                                                        const combinedHistory = [
                                                            ...updates.map(u => ({
                                                                type: 'update',
                                                                date: new Date(u.createdAt),
                                                                title: brandName ? `Update from ${brandName}` : 'Status Update',
                                                                // Pass raw content for Markdown rendering
                                                                description: u.content,
                                                                variant: u.variant || 'info',
                                                                isMarkdown: true
                                                            })),
                                                            ...logs.map(l => {
                                                                const isDown = l.type === 1;
                                                                const reasonData = getLogReason(l.reason?.code, l.reason?.detail);

                                                                let desc = '';
                                                                if (isDown) {
                                                                    desc = reasonData.reason;
                                                                    if (l.duration > 0) desc += ` • ${formatDuration(l.duration)}`;
                                                                } else {
                                                                    // Use Time for Recovery to match Editor
                                                                    desc = new Date(l.datetime * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                                                }

                                                                return {
                                                                    type: 'log',
                                                                    date: new Date(l.datetime * 1000),
                                                                    title: isDown ? 'Outage Detected' : 'Service Recovered',
                                                                    description: desc,
                                                                    variant: isDown ? 'error' : 'success',
                                                                    isMarkdown: false
                                                                };
                                                            })
                                                        ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 3);

                                                        if (combinedHistory.length > 0) {
                                                            return (
                                                                <div className="space-y-3">
                                                                    {combinedHistory.map((item, i) => (
                                                                        <div key={i} className="flex gap-3 text-sm">
                                                                            <div className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${item.variant === 'error' ? 'bg-red-500' :
                                                                                item.variant === 'warning' ? 'bg-amber-500' :
                                                                                    item.variant === 'success' ? 'bg-emerald-500' : 'bg-blue-500'
                                                                                }`} />
                                                                            <div className="flex-1 min-w-0">
                                                                                <div className="flex items-baseline justify-between gap-2">
                                                                                    <span className={`font-medium truncate ${item.variant === 'error' ? 'text-red-400' :
                                                                                        item.variant === 'warning' ? 'text-amber-400' :
                                                                                            item.variant === 'success' ? 'text-emerald-400' : 'text-blue-400'
                                                                                        }`}>
                                                                                        {item.title}
                                                                                    </span>
                                                                                    <span className="text-[10px] text-zinc-500 font-mono whitespace-nowrap">
                                                                                        {item.date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                                                    </span>
                                                                                </div>
                                                                                {item.isMarkdown ? (
                                                                                    <Markdown content={item.description} className="text-xs text-zinc-500 mt-0.5" />
                                                                                ) : (
                                                                                    <p className="text-xs text-zinc-500 truncate mt-0.5">
                                                                                        {item.description}
                                                                                    </p>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            );
                                                        }
                                                        return <div className="text-xs text-zinc-500 py-2">No recent incidents.</div>
                                                    })()}
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
        </div >
    );
}
