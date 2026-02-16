"use client";

import React, { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, AlertTriangle, ArrowRight, ExternalLink, Clock } from 'lucide-react';
import { ThemeConfig, StatusColors, getBaseColor, getThemeColorHex } from '@/lib/themes';
import { Sparkline } from './Sparkline';
import { UptimeBars } from './UptimeBars';
import { formatUptime, getAverageResponseTime } from '@/lib/utils';
import { MonitorData, Log } from '@/lib/types';
import { VisibilityConfig } from '@/context/EditorContext';

interface MonitorDetailViewProps {
    monitor: MonitorData;
    setSelectedMonitorId: (id: string | null) => void;
    theme: ThemeConfig;
    colors?: StatusColors;
    visibility?: VisibilityConfig;
}

// Helper to format duration
function formatDuration(seconds: number) {
    if (!seconds) return '0 mins';
    const totalMinutes = Math.round(seconds / 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours > 0) {
        return `${hours} hrs ${minutes} mins`;
    }
    return `${minutes} mins`;
}

export const MonitorDetailView = memo(({ monitor, setSelectedMonitorId, theme: t, colors, visibility }: MonitorDetailViewProps) => {
    // Dynamic Colors Helpers
    const opBase = getBaseColor(colors?.operational) || 'emerald';
    const majBase = getBaseColor(colors?.major) || 'red';
    // const maintBase = getBaseColor(colors?.maintenance) || 'blue';

    const opHex = getThemeColorHex(opBase);
    // const majHex = getThemeColorHex(majBase);

    // Helper for subtle backgrounds
    const getLowAlphaClass = (base: string) => {
        if (base === 'white' || base === 'black') return `bg-${base}/10`;
        return `bg-${base}-500/10`;
    };

    // Helper for text
    const getTextClass = (base: string) => {
        if (base === 'white' || base === 'black') return `text-${base}`;
        return `text-${base}-400`;
    };

    // Helper for bars (higher opacity)
    // const getBarClass = ... (removed unused)

    const opBgLow = getLowAlphaClass(opBase);
    const majBgLow = getLowAlphaClass(majBase);
    const opText = getTextClass(opBase);
    const majText = getTextClass(majBase);

    // and 90-day logic stays consistent within a single render cycle.
    // eslint-disable-next-line react-hooks/purity
    const now = useMemo(() => Date.now(), []);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const creationDate = useMemo(() => monitor.create_datetime ? new Date(monitor.create_datetime * 1000) : new Date(0), [monitor.create_datetime]);

    // Generate 90-day bars based on ACTUAL data and creation date
    const dayBars = useMemo(() => {
        if (!monitor) return [];

        const totalDays = 90;

        // Identify days with actual recorded outages from logs
        const outageDates = new Set<string>();
        if (monitor.logs) {
            (monitor.logs as Log[]).forEach((log) => {
                // type 1 = Down, type 99 = Paused
                if (log.type === 1) {
                    const date = new Date(log.datetime * 1000).toLocaleDateString();
                    outageDates.add(date);
                }
            });
        }

        return Array.from({ length: totalDays }).map((_, i) => {
            const timestamp = now - (totalDays - 1 - i) * 86400000;
            const dateObj = new Date(timestamp);
            const dateStr = dateObj.toLocaleDateString();

            // Check if this date is before the monitor was created
            const isBeforeCreation = dateObj < creationDate && dateObj.toDateString() !== creationDate.toDateString();

            if (isBeforeCreation) {
                return { status: 'empty', date: dateStr, height: '100%' };
            }

            // CRITICAL: If we have a log saying it was down this day, FORCE it down.
            if (outageDates.has(dateStr)) {
                // Deterministic height for visual interest
                const deterministicRandom = Math.abs(Math.sin(timestamp)) * 40 + 30;
                return { status: 'down', date: dateStr, height: `${deterministicRandom}%` };
            }

            // Default to UP if monitored and no outage log
            return { status: 'up', date: dateStr, height: '100%' };
        });
    }, [monitor, now, creationDate]);

    if (!monitor) return null;

    const isUp = monitor.status === 2;
    const uptime = formatUptime(monitor.custom_uptime_ratio);
    const avgResponse = getAverageResponseTime(monitor.response_times);


    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
            className="w-full"
        >
            {/* Navigation Header */}
            <button
                onClick={() => setSelectedMonitorId(null)}
                className={`mb-6 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 ${t.rounded} text-xs font-medium text-white transition-all flex items-center gap-2 group w-fit`}
            >
                <ArrowRight className="w-3 h-3 rotate-180 group-hover:-translate-x-1 transition-transform" />
                Back to Dashboard
            </button>

            {/* Service Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
                <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${isUp ? `${opBgLow} ${opText}` : `${majBgLow} ${majText}`} ring-1 ring-white/5`}>
                        {isUp ? <CheckCircle2 className="w-8 h-8" /> : <AlertTriangle className="w-8 h-8" />}
                    </div>
                    <div>
                        <h2 className={`text-2xl sm:text-3xl text-white ${t.heading} flex items-center gap-3`}>
                            {monitor.friendly_name}
                            <ExternalLink className="w-5 h-5 opacity-40 hover:opacity-100 transition-opacity cursor-pointer" />
                        </h2>
                        <div className="flex items-center gap-3 mt-1">
                            <a href={monitor.url} target="_blank" rel="noopener noreferrer" className={`text-sm ${t.mutedText} hover:text-indigo-400 transition-colors`}>
                                {monitor.url}
                            </a>
                            <span className="w-1 h-1 rounded-full bg-white/20" />
                            <span className={`text-sm ${t.mutedText}`}>Checked every 5 mins</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {/* Status Badge */}
                    <div className={t.statusBadge(
                        monitor.status === 2 ? 'up' : (monitor.status === 0 ? 'maintenance' : 'down'),
                        colors
                    )}>
                        {monitor.status === 2 ? 'Operational' : (monitor.status === 0 ? 'Maintenance' : 'Downtime')}
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="space-y-8">

                {/* Top Section: Charts */}
                <div className="space-y-6 sm:space-y-8">

                    {/* 90-Day Uptime Bars */}
                    {visibility?.showUptimeBars !== false && (
                        <div className={`p-6 ${t.card} ${t.rounded}`}>
                            <div className="flex items-center justify-between mb-6">
                                <h3 className={`text-xs ${t.mutedText} uppercase tracking-widest font-bold`}>90-Day Uptime</h3>
                                <span className={`${opText} text-sm font-mono font-bold`}>{uptime?.month || '99.9'}%</span>
                            </div>
                            <div className="h-16 w-full opacity-80">
                                <UptimeBars monitor={monitor} theme={t} colors={colors} days={90} height={64} />
                            </div>
                        </div>
                    )}

                    {/* Response Time Graph */}
                    {visibility?.showSparklines !== false && (
                        <div className={`p-6 ${t.card} ${t.rounded}`}>
                            <div className="flex items-center justify-between mb-6">
                                <h3 className={`text-xs ${t.mutedText} uppercase tracking-widest font-bold`}>Response Time (24h)</h3>
                                <div className="flex items-center gap-4 text-xs font-mono">
                                    <span className={opText}>Min: {monitor.response_times && monitor.response_times.length > 0 ? Math.min(...monitor.response_times.map((r: { value: number }) => r.value)) : '-'}ms</span>
                                    <span className="text-white/40">|</span>
                                    <span className="text-white">Avg: {avgResponse}ms</span>
                                    <span className="text-white/40">|</span>
                                    <span className="text-amber-400">Max: {monitor.response_times && monitor.response_times.length > 0 ? Math.max(...monitor.response_times.map((r: { value: number }) => r.value)) : '-'}ms</span>
                                </div>
                            </div>
                            <div className="h-48 w-full">
                                <Sparkline
                                    data={[...(monitor.response_times || []), ...(monitor.response_times || [])].slice(0, 50)}
                                    color={opHex}
                                    width={1200}
                                    height={200}
                                    interactive={true}
                                />
                            </div>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">

                    {/* Log Timeline */}
                    {visibility?.showIncidentHistory !== false && (
                        <div className={`${visibility?.showPerformanceMetrics === false ? 'lg:col-span-3' : 'lg:col-span-2'} p-6 ${t.card} ${t.rounded}`}>
                            <h3 className={`text-xs ${t.mutedText} uppercase tracking-widest font-bold mb-6`}>Incident History</h3>
                            <div className="space-y-6 border-l border-white/10 ml-3 pl-6 sm:pl-8 py-2">
                                {(monitor.logs || []).slice(0, 5).map((log: Log, i: number) => (
                                    <div key={i} className="relative group">
                                        <div className={`absolute -left-[31px] sm:-left-[39px] w-3 h-3 rounded-full border-[3px] border-zinc-950 ${log.type === 1 ? 'bg-red-500' : 'bg-emerald-500'} top-1`} />
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center justify-between">
                                                <span className={`text-sm font-bold ${log.type === 1 ? 'text-red-400' : 'text-emerald-400'}`}>
                                                    {log.type === 1 ? 'Outage Detected' : 'Service Recovered'}
                                                </span>
                                                <span className={`text-[10px] ${t.mutedText} font-mono border border-white/5 px-1.5 py-0.5 rounded`}>
                                                    {new Date(log.datetime * 1000).toLocaleString()}
                                                </span>
                                            </div>
                                            <p className={`text-xs ${t.mutedText}`}>
                                                {log.type === 1 ? `Error details: ${log.reason?.code || 'Service Unavailable'}` : `Duration: ${formatDuration(log.duration)}`}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                                <div className="relative group opacity-50">
                                    <div className="absolute -left-[31px] sm:-left-[39px] w-3 h-3 rounded-full border-[3px] border-zinc-950 bg-zinc-600 top-1" />
                                    <span className="text-xs text-zinc-500 font-medium">Monitoring Started</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Stats Column */}
                    {visibility?.showPerformanceMetrics !== false && (
                        <div className={`${visibility?.showIncidentHistory === false ? 'lg:col-span-3' : 'lg:col-span-1'} space-y-6`}>
                            <div className={`p-6 bg-indigo-500/10 border border-indigo-500/20 ${t.rounded}`}>
                                <h3 className="text-xs text-indigo-400 uppercase tracking-widest font-bold mb-4 flex items-center gap-2">
                                    <Clock className="w-3 h-3" /> Quick Stats
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <div className="text-[10px] text-indigo-300/50 uppercase font-bold mb-1">Check Rate</div>
                                        <div className="text-indigo-200 font-mono text-sm">5 mins</div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] text-indigo-300/50 uppercase font-bold mb-1">Last Check</div>
                                        <div className="text-indigo-200 font-mono text-sm">Just now</div>
                                    </div>
                                </div>
                            </div>

                            <div className={`p-6 ${t.card} ${t.rounded} space-y-6`}>
                                <h3 className={`text-xs ${t.mutedText} uppercase tracking-widest font-bold mb-2`}>Availability</h3>

                                {[
                                    { label: '24 Hours', val: uptime?.day },
                                    { label: '7 Days', val: uptime?.week },
                                    { label: '30 Days', val: uptime?.month },
                                    { label: '90 Days', val: uptime?.month }
                                ].map((stat, i) => {
                                    const is100 = stat.val && parseFloat(stat.val) === 100;
                                    return (
                                        <div key={i} className="flex items-center justify-between pb-3 border-b border-white/5 last:border-0 last:pb-0">
                                            <span className="text-sm text-white/60">{stat.label}</span>
                                            <span className={`font-mono text-sm font-bold ${is100 ? opText : stat.val ? 'text-yellow-400' : 'text-zinc-600'}`}>
                                                {stat.val ? `${stat.val}%` : '-'}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
});

MonitorDetailView.displayName = 'MonitorDetailView';
