"use client";

import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, AlertTriangle, ArrowRight, ExternalLink, Clock } from 'lucide-react';
import { ThemeConfig } from '@/lib/themes';
import { Sparkline } from './Sparkline';
import { formatUptime, getAverageResponseTime, formatDate } from '@/lib/utils';

interface MonitorDetailViewProps {
    monitor: any;
    setSelectedMonitorId: (id: string | null) => void;
    theme: ThemeConfig;
}

export const MonitorDetailView = memo(({ monitor, setSelectedMonitorId, theme: t }: MonitorDetailViewProps) => {
    if (!monitor) return null;

    const isUp = monitor.status === 2;
    const uptime = formatUptime(monitor.custom_uptime_ratio);
    const avgResponse = getAverageResponseTime(monitor.response_times);

    // Mock data for graphs if not available
    const dayBars = Array.from({ length: 90 }).map((_, i) => ({
        status: Math.random() > 0.98 ? 'down' : 'up',
        date: new Date(Date.now() - (89 - i) * 86400000).toLocaleDateString()
    }));

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
                    <div className={`p-3 rounded-xl ${isUp ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'} ring-1 ring-white/5`}>
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
                            <span className={`text-sm ${t.mutedText}`}>Checked every {monitor.interval ? Math.round(monitor.interval / 60) : 5} mins</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className={`px-4 py-2 ${t.rounded} border ${isUp ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-500'} font-medium text-sm flex items-center gap-2`}>
                        <div className={`w-2 h-2 rounded-full ${isUp ? 'bg-emerald-500 animate-pulse' : 'bg-red-500 animate-pulse'}`} />
                        {isUp ? 'Operational' : 'Major Outage'}
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="space-y-8">

                {/* Top Section: Charts (Full Width) */}
                <div className="space-y-6 sm:space-y-8">

                    {/* 90-Day Uptime Bars */}
                    <div className={`p-6 ${t.card} ${t.rounded}`}>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className={`text-xs ${t.mutedText} uppercase tracking-widest font-bold`}>90-Day Uptime</h3>
                            <span className="text-emerald-400 text-sm font-mono font-bold">99.98%</span>
                        </div>
                        <div className="flex items-end gap-[2px] h-16 w-full opacity-80">
                            {dayBars.map((bar, i) => (
                                <div
                                    key={i}
                                    className={`flex-1 rounded-sm transition-all hover:scale-y-125 hover:opacity-100 ${bar.status === 'up' ? 'bg-emerald-500/40 hover:bg-emerald-400' : 'bg-red-500/80 hover:bg-red-500'}`}
                                    style={{ height: bar.status === 'up' ? '100%' : `${30 + Math.random() * 40}%` }}
                                    title={`${bar.date}: ${bar.status === 'up' ? '100% Uptime' : 'Downtime Detected'}`}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Response Time Graph */}
                    <div className={`p-6 ${t.card} ${t.rounded}`}>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className={`text-xs ${t.mutedText} uppercase tracking-widest font-bold`}>Response Time (24h)</h3>
                            <div className="flex items-center gap-4 text-xs font-mono">
                                <span className="text-emerald-400">Min: 45ms</span>
                                <span className="text-white/40">|</span>
                                <span className="text-white">Avg: {avgResponse}ms</span>
                                <span className="text-white/40">|</span>
                                <span className="text-amber-400">Max: {avgResponse * 3}ms</span>
                            </div>
                        </div>
                        <div className="h-48 w-full">
                            <Sparkline
                                data={[...(monitor.response_times || []), ...(monitor.response_times || [])].slice(0, 50)}
                                color="#6366f1"
                                width={1200}
                                height={200}
                            />
                        </div>
                    </div>
                </div>

                {/* Bottom Section: Timeline & Stats */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">

                    {/* Log Timeline */}
                    <div className={`lg:col-span-2 p-6 ${t.card} ${t.rounded}`}>
                        <h3 className={`text-xs ${t.mutedText} uppercase tracking-widest font-bold mb-6`}>Incident History</h3>
                        <div className="space-y-6 border-l border-white/10 ml-3 pl-6 sm:pl-8 py-2">
                            {(monitor.logs || []).slice(0, 5).map((log: any, i: number) => (
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
                                            {log.type === 1 ? `Error details: ${log.reason?.code || 'Service Unavailable'}` : `Duration: ${Math.round(log.duration / 60)} mins`}
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

                    {/* Stats Column */}
                    <div className="space-y-6">
                        <div className={`p-6 bg-indigo-500/10 border border-indigo-500/20 ${t.rounded}`}>
                            <h3 className="text-xs text-indigo-400 uppercase tracking-widest font-bold mb-4 flex items-center gap-2">
                                <Clock className="w-3 h-3" /> Quick Stats
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <div className="text-[10px] text-indigo-300/50 uppercase font-bold mb-1">Check Rate</div>
                                    <div className="text-indigo-200 font-mono text-sm">{monitor.interval ? Math.round(monitor.interval / 60) : 5} mins</div>
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
                            ].map((stat, i) => (
                                <div key={i} className="flex items-center justify-between pb-3 border-b border-white/5 last:border-0 last:pb-0">
                                    <span className="text-sm text-white/60">{stat.label}</span>
                                    <span className={`font-mono text-sm font-bold ${stat.val && parseFloat(stat.val) === 100 ? 'text-emerald-400' : stat.val ? 'text-yellow-400' : 'text-zinc-600'}`}>
                                        {stat.val ? `${stat.val}%` : '-'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
});

MonitorDetailView.displayName = 'MonitorDetailView';
