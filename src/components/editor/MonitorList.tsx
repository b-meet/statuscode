"use client";

import React, { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity } from 'lucide-react';
import { ThemeConfig } from '@/lib/themes';
import { Sparkline } from './Sparkline';
import { formatUptime, getAverageResponseTime } from '@/lib/utils';
import { classNames } from '@/lib/utils';

interface MonitorListProps {
    monitors: any[];
    setSelectedMonitorId: (id: string | null) => void;
    primaryColor: string;
    theme: ThemeConfig;
}

export const MonitorList = memo(({ monitors, setSelectedMonitorId, primaryColor, theme: t }: MonitorListProps) => {
    return (
        <div className="space-y-6">
            <h3 className={`text-xs ${t.mutedText} uppercase tracking-[0.2em] font-bold mb-6 flex items-center gap-2`}>
                <Activity className="w-3 h-3" /> System Status
            </h3>

            {monitors.length > 0 ? (
                <div className="space-y-4">
                    <AnimatePresence mode="popLayout">
                        {monitors.map((monitor, index) => {
                            const uptime = formatUptime(monitor.custom_uptime_ratio);
                            const avgResponse = getAverageResponseTime(monitor.response_times);
                            const isUp = monitor.status === 2;
                            const hasData = !!uptime;

                            return (
                                <motion.div
                                    key={monitor.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{
                                        duration: 0.4,
                                        delay: index * 0.05,
                                        ease: [0.25, 1, 0.5, 1]
                                    }}
                                    onClick={() => setSelectedMonitorId(String(monitor.id))}
                                    className={`group p-4 sm:p-6 relative overflow-hidden ${t.card} ${t.cardHover} ${t.rounded} cursor-pointer`}
                                >
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6 relative z-10">

                                        {/* Status & Info */}
                                        <div className="flex items-start gap-5 min-w-[200px]">
                                            <div className="relative mt-1.5 flex-shrink-0">
                                                <div className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full ${isUp ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-red-500 shadow-[0_0_10px_#ef4444]'}`} />
                                                <div className={`absolute inset-0 w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full animate-ping opacity-20 ${isUp ? 'bg-emerald-500' : 'bg-red-500'}`} />
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
                                                <Sparkline data={monitor.response_times || []} color={isUp ? "#10b981" : "#ef4444"} />
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
                                                    <div className={`font-mono text-sm font-bold ${hasData && uptime && parseFloat(uptime.day) === 100 ? 'text-emerald-400' : hasData ? 'text-yellow-400' : 'text-zinc-600'}`}>
                                                        {hasData ? `${uptime?.day}%` : '-'}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Badge */}
                                            <div className={t.statusBadge(isUp).replace("absolute", "") + " px-3 py-1 text-xs rounded-full font-medium shrink-0"}>
                                                {isUp ? 'OPERATIONAL' : 'DOWN'}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            ) : (
                <div className={`text-center py-12 border border-dashed border-white/10 ${t.rounded} bg-white/5`}>
                    <p className={`${t.mutedText} text-sm`}>No monitors selected.</p>
                </div>
            )}
        </div>
    );
});

MonitorList.displayName = 'MonitorList';
