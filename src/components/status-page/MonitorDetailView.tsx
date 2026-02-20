"use client";

import React, { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, AlertTriangle, ArrowRight, ExternalLink, Clock, MessageSquare, Info } from 'lucide-react';
import { ThemeConfig, StatusColors, getBaseColor, getThemeColorHex } from '@/lib/themes';
import { Sparkline } from './Sparkline';
import { UptimeBars } from './UptimeBars';
import { formatUptime, getAverageResponseTime, formatUptimePercentage } from '@/lib/utils';
import { MonitorData, IncidentUpdate, IncidentVariant, MaintenanceWindow } from '@/lib/types';
import { VisibilityConfig, SiteConfig } from '@/context/EditorContext';
import { Markdown } from '@/components/ui/markdown';
import { IncidentHistory, HistoryItem } from './IncidentHistory';
import { RefreshTimer } from './RefreshTimer';

interface MonitorDetailViewProps {
    monitor: MonitorData;
    setSelectedMonitorId: (id: string | null) => void;
    theme: ThemeConfig;
    colors?: StatusColors;
    visibility?: VisibilityConfig;
    updates?: IncidentUpdate[];
    maintenance?: MaintenanceWindow[];
    onAddUpdate?: (content: string, variant?: IncidentVariant) => void;
    onDeleteUpdate?: (id: string) => void;
    brandName?: string;
    publishedConfig?: SiteConfig | null;
    pollInterval?: number;
    lastRefreshTime?: number;
}

export const MonitorDetailView = memo(({
    monitor,
    setSelectedMonitorId,
    theme: t,
    colors,
    visibility,
    updates,
    maintenance,
    onAddUpdate,
    onDeleteUpdate,
    brandName,
    publishedConfig,
    pollInterval,
    lastRefreshTime
}: MonitorDetailViewProps) => {
    // Local state for new update input
    const [newUpdateContent, setNewUpdateContent] = React.useState('');
    const [newUpdateVariant, setNewUpdateVariant] = React.useState<IncidentVariant>('info');
    const [isPreviewMode, setIsPreviewMode] = React.useState(false);

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

    const opBgLow = getLowAlphaClass(opBase);
    const majBgLow = getLowAlphaClass(majBase);
    const opText = getTextClass(opBase);
    const majText = getTextClass(majBase);

    // Combine Logs and Updates
    const historyItems: HistoryItem[] = useMemo(() => {
        const items: HistoryItem[] = [];

        // 1. Add System Logs
        if (monitor?.logs) {
            monitor.logs.forEach((log) => {
                items.push({
                    id: `log-${log.datetime}-${log.type}`,
                    type: 'log',
                    timestamp: log.datetime,
                    logType: log.type,
                    logReason: log.reason,
                    logDuration: log.duration,
                    isManual: log.isManual,
                    content: (log as any).content
                });
            });
        }

        // 2. Add Manual Updates
        if (updates) {
            const publishedUpdates = publishedConfig?.annotations?.[monitor.id] || [];
            updates.forEach((update) => {
                const isUnpublished = publishedConfig ? !publishedUpdates.some(u => u.id === update.id) : false;
                items.push({
                    id: update.id,
                    type: 'update',
                    timestamp: new Date(update.createdAt).getTime() / 1000,
                    content: update.content,
                    variant: update.variant,
                    originalId: update.id,
                    isUnpublished
                });
            });
        }

        // 3. Add Monitoring Started Event (if available)
        if (monitor.create_datetime) {
            items.push({
                id: `monitor-created-${monitor.id}`,
                type: 'log',
                timestamp: monitor.create_datetime,
                logType: 98, // Using 98 for "Monitor Started"
                logReason: { code: 'STARTED', detail: 'Monitoring for this resource began.' }
            });
        }

        // Sort by timestamp descending
        return items.sort((a, b) => b.timestamp - a.timestamp);
    }, [monitor?.logs, updates, monitor.create_datetime, monitor.id, publishedConfig]);



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
            className="w-full @container"
        >
            {/* Active/Upcoming Maintenance Banner - Non-dismissable */}
            {(() => {
                if (!maintenance) return null;
                const activeMaint = maintenance.find(m => {
                    const mIdString = String(m.monitorId);
                    const currentIdString = String(monitor.id);
                    // Match exact ID, demo ID, or if monitorId is "all" (though usually "all" doesn't show in detail view unless specified)
                    // Also check if m.monitorId contains the current ID if it's a combined string (rare but possible)
                    const isForThis = mIdString === currentIdString ||
                        mIdString === `demo-${Math.abs(monitor.id)}` ||
                        (mIdString === 'all'); // Should we show system-wide maintenance on detail view? Yes, usually.

                    if (!isForThis) return false;
                    const start = new Date(m.startTime).getTime();
                    const end = start + m.durationMinutes * 60000;
                    return end > Date.now();
                });

                if (activeMaint) {
                    const now = Date.now();
                    const start = new Date(activeMaint.startTime).getTime();
                    const isUpcoming = start > now;

                    return (
                        <div className="w-full bg-indigo-500/10 border-b border-indigo-500/20 py-3 px-4 mb-6 flex items-start sm:items-center gap-3">
                            <Clock className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5 sm:mt-0" />
                            <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                                <span className="text-sm font-bold text-indigo-200 whitespace-nowrap">
                                    {isUpcoming ? 'Upcoming Maintenance:' : 'Maintenance in Progress:'}
                                </span>
                                <span className="text-sm text-indigo-200/80 truncate">
                                    {activeMaint.title}
                                </span>
                            </div>
                            <div className="text-xs text-indigo-300/50 whitespace-nowrap bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/10 font-mono">
                                {isUpcoming
                                    ? `Starts ${new Date(activeMaint.startTime).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`
                                    : `Ends ${new Date(start + activeMaint.durationMinutes * 60000).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`
                                }
                            </div>
                        </div>
                    );
                }
                return null;
            })()}

            {/* Navigation Header */}
            <div className="mb-4 @[600px]:mb-8 flex items-center justify-between px-1">
                <button
                    onClick={() => setSelectedMonitorId(null)}
                    className="group flex items-center gap-2 text-xs font-medium text-white/50 hover:text-white transition-colors pl-1"
                >
                    <ArrowRight className="w-3.5 h-3.5 rotate-180 group-hover:-translate-x-1 transition-transform" />
                    Back to Dashboard
                </button>
            </div>

            {/* Service Header - Premium Mobile Layout */}
            <div className="flex flex-col @[600px]:flex-row items-center @[600px]:items-start @[600px]:justify-between gap-4 @[600px]:gap-6 mb-6 @[600px]:mb-10 text-center @[600px]:text-left">
                <div className="flex flex-col @[600px]:flex-row items-center gap-3 @[600px]:gap-6">
                    <div className={`p-3 @[600px]:p-4 rounded-2xl ${isUp ? `${opBgLow} ${opText}` : `${majBgLow} ${majText}`} ring-1 ring-white/10 shadow-xl shadow-black/20`}>
                        {isUp ? <CheckCircle2 className="w-8 h-8 @[600px]:w-10 @[600px]:h-10" /> : <AlertTriangle className="w-8 h-8 @[600px]:w-10 @[600px]:h-10" />}
                    </div>
                    <div>
                        <h2 className={`text-2xl @[600px]:text-4xl text-white ${t.heading} flex items-center justify-center @[600px]:justify-start gap-2 @[600px]:gap-3 tracking-tight`}>
                            {monitor.friendly_name}
                            <a href={monitor.url} target="_blank" rel="noopener noreferrer" className="opacity-40 hover:opacity-100 transition-opacity">
                                <ExternalLink className="w-5 h-5 @[600px]:w-6 @[600px]:h-6" />
                            </a>
                        </h2>
                        <div className="flex flex-wrap items-center justify-center @[600px]:justify-start gap-x-3 gap-y-1 mt-1 @[600px]:mt-2">
                            <span className={`text-sm @[600px]:text-base ${t.mutedText} font-medium`}>
                                {monitor.url.replace(/^https?:\/\//, '')}
                            </span>
                            <span className="hidden @[600px]:block w-1 h-1 rounded-full bg-white/20" />
                            <span className={`text-xs @[600px]:text-sm ${t.mutedText} opacity-60 flex items-center gap-1.5`}>
                                <span className="w-1 h-1 rounded-full bg-white/40 block @[600px]:hidden"></span>
                                {pollInterval ? `Checked every ${Math.round(pollInterval / 60000)} mins` : 'Checked frequently'}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {/* Status Badge */}
                    <div className={`${t.statusBadge(
                        monitor.status === 2 ? 'up' : (monitor.status === 0 ? 'maintenance' : 'down'),
                        colors
                    )} text-xs @[600px]:text-sm px-3 @[600px]:px-4 py-1 @[600px]:py-1.5 shadow-lg shadow-black/10`}>
                        {monitor.status === 2 ? 'Operational' : (monitor.status === 0 ? 'Maintenance' : 'Downtime')}
                    </div>
                </div>
            </div>


            {/* Add New Update (Editor Mode) - Keep this separate at top if needed, or integrate? 
                Usually editors want the input field separate. Keeping it here.
            */}
            {onAddUpdate && (
                <div className="mb-8 @[600px]:mb-12">
                    <div className={`p-1 border border-zinc-800 bg-zinc-900/30 ${t.rounded}`}>
                        <div className="p-3 @[600px]:p-4">
                            <div className="flex items-center justify-between mb-3 @[600px]:mb-4">
                                <span className="text-xs @[600px]:text-sm font-medium text-zinc-300">New Update</span>
                                <div className="flex gap-2">
                                    {(['info', 'success', 'warning', 'error'] as const).map((v) => (
                                        <button
                                            key={v}
                                            onClick={() => setNewUpdateVariant(v)}
                                            className={`w-3.5 h-3.5 @[600px]:w-4 @[600px]:h-4 rounded-full border border-white/10 transition-transform hover:scale-110 ${newUpdateVariant === v ? 'ring-2 ring-white ring-offset-1 ring-offset-zinc-900' : 'opacity-50 hover:opacity-100'
                                                } ${v === 'info' ? 'bg-blue-500' : v === 'success' ? 'bg-emerald-500' : v === 'warning' ? 'bg-amber-500' : 'bg-red-500'}`}
                                            title={v.charAt(0).toUpperCase() + v.slice(1)}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-between items-center mb-2">
                                <div className="text-[10px] @[600px]:text-xs text-zinc-500">
                                    Selected: <span className={`font-bold uppercase ${newUpdateVariant === 'info' ? 'text-blue-400' :
                                        newUpdateVariant === 'success' ? 'text-emerald-400' :
                                            newUpdateVariant === 'warning' ? 'text-amber-400' : 'text-red-400'
                                        }`}>{newUpdateVariant}</span>
                                </div>
                                <button
                                    onClick={() => setIsPreviewMode(!isPreviewMode)}
                                    className="text-[10px] @[600px]:text-xs text-indigo-400 hover:text-indigo-300"
                                >
                                    {isPreviewMode ? 'Edit' : 'Preview Markdown'}
                                </button>
                            </div>

                            {isPreviewMode ? (
                                <div className="min-h-[80px] @[600px]:min-h-[100px] p-2 @[600px]:p-3 text-xs @[600px]:text-sm text-zinc-300 bg-zinc-950 rounded border border-zinc-800">
                                    {newUpdateContent ? <Markdown content={newUpdateContent} /> : <span className="text-zinc-600 italic">Nothing to preview</span>}
                                </div>
                            ) : (
                                <textarea
                                    value={newUpdateContent}
                                    onChange={(e) => setNewUpdateContent(e.target.value)}
                                    placeholder="Write a status update..."
                                    className={`w-full p-2 @[600px]:p-3 bg-zinc-950 border border-zinc-800 ${t.rounded} text-white text-xs @[600px]:text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 min-h-[80px] @[600px]:min-h-[100px] resize-y`}
                                />
                            )}
                        </div>

                        <div className="flex items-center justify-between p-2 bg-white/5 border-t border-white/5 rounded-b-[inherit]">
                            <div className="text-[10px] text-zinc-500 flex items-center gap-1.5 px-2">
                                <Info className="w-3 h-3" />
                                <span className="hidden @[400px]:inline">Updates deletable for 30m after publish.</span>
                            </div>
                            <button
                                disabled={!newUpdateContent.trim()}
                                onClick={() => {
                                    if (newUpdateContent.trim()) {
                                        onAddUpdate(newUpdateContent, newUpdateVariant);
                                        setNewUpdateContent('');
                                        setIsPreviewMode(false);
                                        setNewUpdateVariant('info');
                                    }
                                }}
                                className="px-3 py-1.5 @[600px]:px-4 @[600px]:py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] @[600px]:text-xs font-bold rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Preview Update
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content Grid */}
            <div className="space-y-4 @[600px]:space-y-8">

                {/* Top Section: Charts */}
                <div className="space-y-3 @[600px]:space-y-6 sm:space-y-8">

                    {/* 90-Day Uptime Bars */}
                    {visibility?.showUptimeBars !== false && (
                        <div className={`p-4 @[600px]:p-6 ${t.card} ${t.rounded}`}>
                            <div className="flex items-center justify-between mb-4 @[600px]:mb-6">
                                <h3 className={`text-[10px] @[600px]:text-xs ${t.mutedText} uppercase tracking-widest font-bold`}>90-Day Uptime</h3>
                                <span className={`${opText} text-xs @[600px]:text-sm font-mono font-bold`}>{formatUptimePercentage(uptime?.month || '100', visibility?.uptimeDecimals)}%</span>
                            </div>
                            <div className="h-12 @[600px]:h-16 w-full opacity-80">
                                <UptimeBars monitor={monitor} theme={t} colors={colors} days={90} height={64} />
                            </div>
                        </div>
                    )}

                    {/* Response Time Graph */}
                    {
                        visibility?.showSparklines !== false && (
                            <div className={`p-4 @[600px]:p-6 ${t.card} ${t.rounded}`}>
                                <div className="flex items-center justify-between mb-4 @[600px]:mb-6">
                                    <h3 className={`text-[10px] @[600px]:text-xs ${t.mutedText} uppercase tracking-widest font-bold`}>Response Time (24h)</h3>
                                    <div className="flex items-center gap-2 @[600px]:gap-4 text-[10px] @[600px]:text-xs font-mono">
                                        <span className={opText}>Min: {monitor.response_times && monitor.response_times.length > 0 ? Math.min(...monitor.response_times.map((r: { value: number }) => r.value)) : '-'}ms</span>
                                        <span className="text-white/40">|</span>
                                        <span className="text-white">Avg: {avgResponse}ms</span>
                                        <span className="text-white/40">|</span>
                                        <span className="text-amber-400">Max: {monitor.response_times && monitor.response_times.length > 0 ? Math.max(...monitor.response_times.map((r: { value: number }) => r.value)) : '-'}ms</span>
                                    </div>
                                </div>
                                <div className="h-32 @[600px]:h-48 w-full">
                                    <Sparkline
                                        data={[...(monitor.response_times || []), ...(monitor.response_times || [])].slice(0, 50)}
                                        color={opHex}
                                        width={1200}
                                        height={200}
                                        interactive={true}
                                    />
                                </div>
                            </div>
                        )
                    }
                </div >

                <div className="grid grid-cols-1 @[800px]:grid-cols-3 gap-3 @[600px]:gap-6 sm:gap-8">

                    {/* Unified Incident History */}
                    {visibility?.showIncidentHistory !== false && (
                        <div className={`${visibility?.showPerformanceMetrics === false ? '@[800px]:col-span-3' : '@[800px]:col-span-2'} p-4 @[600px]:p-6 ${t.card} ${t.rounded}`}>
                            <IncidentHistory
                                items={historyItems}
                                theme={t}
                                monitorName={monitor.friendly_name}
                                brandName={brandName}
                                onDeleteUpdate={onDeleteUpdate}
                            />
                        </div>
                    )}

                    {/* Stats Column */}
                    {visibility?.showPerformanceMetrics !== false && (
                        <div className={`${visibility?.showIncidentHistory === false ? '@[800px]:col-span-3' : '@[800px]:col-span-1'} space-y-4 @[600px]:space-y-6`}>
                            <div className={`p-4 @[600px]:p-6 bg-indigo-500/10 border border-indigo-500/20 ${t.rounded}`}>
                                <h3 className="text-[10px] @[600px]:text-xs text-indigo-400 uppercase tracking-widest font-bold mb-3 @[600px]:mb-4 flex items-center gap-2">
                                    <Clock className="w-3 h-3" /> Quick Stats
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <div className="text-[8px] @[600px]:text-[10px] text-indigo-300/50 uppercase font-bold mb-1">Check Rate</div>
                                        <div className="text-indigo-200 font-mono text-xs @[600px]:text-sm">{pollInterval ? `${Math.round(pollInterval / 60000)} mins` : 'Unknown'}</div>
                                    </div>
                                    <div>
                                        <div className="text-[8px] @[600px]:text-[10px] text-indigo-300/50 uppercase font-bold mb-1">Next Fast Check</div>
                                        {pollInterval && lastRefreshTime ? (
                                            <RefreshTimer intervalMs={pollInterval} lastRefresh={lastRefreshTime} className="text-indigo-200 font-mono text-xs @[600px]:text-sm" />
                                        ) : (
                                            <div className="text-indigo-200 font-mono text-xs @[600px]:text-sm">-</div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className={`p-4 @[600px]:p-6 ${t.card} ${t.rounded} space-y-4 @[600px]:space-y-6`}>
                                <h3 className={`text-[10px] @[600px]:text-xs ${t.mutedText} uppercase tracking-widest font-bold mb-2`}>Availability</h3>

                                {[
                                    { label: '24 Hours', val: uptime?.day },
                                    { label: '7 Days', val: uptime?.week },
                                    { label: '30 Days', val: uptime?.month },
                                    { label: '90 Days', val: uptime?.month }
                                ].map((stat, i) => {
                                    const is100 = stat.val && parseFloat(stat.val) === 100;
                                    return (
                                        <div key={i} className="flex items-center justify-between pb-2 @[600px]:pb-3 border-b border-white/5 last:border-0 last:pb-0">
                                            <span className="text-xs @[600px]:text-sm text-white/60">{stat.label}</span>
                                            <span className={`font-mono text-xs @[600px]:text-sm font-bold ${is100 ? opText : stat.val ? 'text-yellow-400' : 'text-zinc-600'}`}>
                                                {stat.val ? `${formatUptimePercentage(stat.val, visibility?.uptimeDecimals)}%` : '-'}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div >
        </motion.div >
    );
});

MonitorDetailView.displayName = 'MonitorDetailView';
