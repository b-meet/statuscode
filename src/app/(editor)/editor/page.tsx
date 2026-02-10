"use client";

import { useEditor } from "@/context/EditorContext";
import { Monitor, Smartphone, CheckCircle2, AlertTriangle, Activity, XCircle, ArrowRight, Clock, Calendar, BarChart3, Wifi, ArrowUpRight, ExternalLink } from "lucide-react";
import { useState } from "react";
import { themes } from "@/lib/themes";
import { IncidentHistory } from "@/components/status-page/IncidentHistory";

// Inline helpers for Client Component
function classNames(...classes: (string | undefined | null | false)[]) {
    return classes.filter(Boolean).join(' ');
}

function formatUptime(ratioString: string) {
    if (!ratioString || ratioString === "0" || ratioString === "0-0-0") return null;
    const parts = ratioString.split('-');
    return {
        day: parts[0] || '0',
        week: parts[1] || '0',
        month: parts[2] || '0'
    };
}

function getAverageResponseTime(times: { value: number }[] = []) {
    if (!times.length) return 0;
    const sum = times.reduce((acc, curr) => acc + curr.value, 0);
    return Math.round(sum / times.length);
}

function formatDate(timestamp: number) {
    return new Date(timestamp * 1000).toLocaleString('en-US', {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
}

// Simple SVG Sparkline
const Sparkline = ({ data, color = "#6366f1" }: { data: { value: number }[], color?: string }) => {
    if (!data || data.length < 2) return null;

    const height = 40;
    const width = 120;
    const max = Math.max(...data.map(d => d.value));
    const min = Math.min(...data.map(d => d.value));
    const range = max - min || 1;

    const points = data.map((d, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = height - ((d.value - min) / range) * height; // Invert Y
        return `${x},${y}`;
    }).join(' ');

    return (
        <svg width={width} height={height} className="overflow-visible opacity-50 block">
            <polyline
                fill="none"
                stroke={color}
                strokeWidth="2"
                points={points}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
};

export default function EditorPage() {
    const { config, updateConfig, saveStatus, monitorsData } = useEditor();
    const [viewport, setViewport] = useState<'desktop' | 'mobile'>('desktop');
    const [isMaximized, setIsMaximized] = useState(false);

    // Filter selected monitors
    const selectedMonitors = monitorsData.filter(m => config.monitors.includes(String(m.id)));

    // Stats
    const downMonitors = selectedMonitors.filter(m => m.status === 8 || m.status === 9);
    const isAllUp = downMonitors.length === 0 && selectedMonitors.length > 0;
    const t = themes[config.theme] || themes.modern; // Theme helper

    const totalAvgResponse = Math.round(
        selectedMonitors.reduce((acc, m) => acc + getAverageResponseTime(m.response_times), 0) / (selectedMonitors.length || 1)
    );

    const previewUrl = `/s/${config.brandName?.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'demo'}`;

    // --- SECTIONS ---

    const headerDisplay = (
        <div className={classNames(
            "flex justify-between mb-8",
            viewport === 'mobile' ? "flex-col gap-6" : "flex-row items-center gap-8"
        )}>
            <div className="flex items-center gap-4">
                {config.logoUrl ? (
                    <img src={config.logoUrl} alt="Logo" className={`w-10 h-10 sm:w-16 sm:h-16 object-contain p-1.5 sm:p-2 bg-white/5 backdrop-blur-md border border-white/10 ${t.rounded}`} />
                ) : (
                    <div className={`w-10 h-10 sm:w-16 sm:h-16 bg-white/5 backdrop-blur-md flex items-center justify-center border border-white/10 ${t.rounded}`}>
                        <Activity className="w-5 h-5 sm:w-8 sm:h-8 text-white/50" />
                    </div>
                )}
                <div>
                    <h1 className={`text-lg sm:text-4xl text-white ${t.heading} leading-tight`}>{config.brandName || "Brand Name"}</h1>
                    <div className={`flex items-center gap-2 mt-1 sm:mt-2 ${t.mutedText} text-[10px] sm:text-sm font-medium`}>
                        <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500 animate-pulse" />
                            Monitoring {selectedMonitors.length} services
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex gap-4">
                <button className={`w-full sm:w-auto px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-white transition-all backdrop-blur-md flex items-center justify-center gap-2 ${t.rounded}`}>
                    Updates <ArrowUpRight className="w-3 h-3 opacity-50" />
                </button>
            </div>
        </div>
    );

    const bannerDisplay = (
        <div className={`p-4 sm:p-5 md:p-10 mb-8 md:mb-20 relative overflow-hidden transition-all duration-500 group ${t.rounded} ${t.bannerStyle(isAllUp)}`}>
            {/* Dynamic Glow */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-40 h-40 sm:w-80 sm:h-80 bg-gradient-to-br from-white/10 to-transparent rounded-full blur-2xl sm:blur-3xl opacity-20 pointer-events-none group-hover:opacity-40 transition-opacity duration-700" />

            <div className={classNames(
                "relative z-10 flex",
                viewport === 'mobile' ? "flex-col items-start gap-6" : "flex-row items-center gap-10"
            )}>
                <div className={`p-6 rounded-full shrink-0 ${isAllUp ? "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.3)]" : "bg-red-500/10 text-red-500 ring-1 ring-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.3)]"}`}>
                    {isAllUp ? <CheckCircle2 className="w-10 h-10" /> : <AlertTriangle className="w-10 h-10" />}
                </div>

                <div className="text-center md:text-left flex-1">
                    <h2 className={`text-lg sm:text-3xl text-white mb-2 ${t.heading} drop-shadow-sm`}>
                        {isAllUp ? "All Systems Operational" : "Major System Outage"}
                    </h2>
                    <p className={`${t.mutedText} text-sm sm:text-lg leading-relaxed max-w-xl mx-auto md:mx-0`}>
                        {isAllUp
                            ? "All services are functioning normally."
                            : "Major service disruption. Check below."}
                    </p>
                </div>

                {/* Global Metrics Pill */}
                <div className={classNames(
                    "bg-black/20 p-4 sm:p-6 backdrop-blur-sm border border-white/5",
                    t.rounded,
                    viewport === 'mobile' ? "w-full flex flex-col gap-4" : "w-auto flex flex-row items-center gap-8"
                )}>
                    <div>
                        <div className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-1">Avg Latency</div>
                        <div className="text-xl sm:text-2xl font-mono text-white flex items-baseline gap-1">
                            {totalAvgResponse === 0 ? '< 1' : totalAvgResponse}<span className="text-xs sm:text-sm text-white/40">ms</span>
                        </div>
                    </div>
                    {viewport !== 'mobile' && <div className="w-px h-10 bg-white/10" />}
                    {viewport === 'mobile' && <div className="h-px w-full bg-white/10" />}
                    <div>
                        <div className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-1">Uptime</div>
                        <div className="text-xl sm:text-2xl font-mono text-emerald-400">99.9%</div>
                    </div>
                </div>
            </div>
        </div>
    );

    const monitorsDisplay = (
        <div className="space-y-6">
            <h3 className={`text-xs ${t.mutedText} uppercase tracking-[0.2em] font-bold mb-6 flex items-center gap-2`}>
                <Activity className="w-3 h-3" /> System Status
            </h3>

            {selectedMonitors.length > 0 ? (
                selectedMonitors.map((monitor) => {
                    const uptime = formatUptime(monitor.custom_uptime_ratio);
                    const avgResponse = getAverageResponseTime(monitor.response_times);
                    const isUp = monitor.status === 2;
                    const hasData = !!uptime;

                    return (
                        <div
                            key={monitor.id}
                            className={`group p-4 sm:p-6 relative overflow-hidden ${t.card} ${t.cardHover} ${t.rounded}`}
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
                                        <div className={`text-xs ${t.mutedText} mt-1`} style={{ color: config.primaryColor }}>
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
                                            <div className={`font-mono text-sm font-bold ${hasData && parseFloat(uptime.day) === 100 ? 'text-emerald-400' : hasData ? 'text-yellow-400' : 'text-zinc-600'}`}>
                                                {hasData ? `${uptime.day}%` : '-'}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Badge */}
                                    <div className={t.statusBadge(isUp).replace("absolute", "") + " px-3 py-1 text-xs rounded-full font-medium shrink-0"}>
                                        {isUp ? 'OPERATIONAL' : 'DOWN'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })
            ) : (
                <div className={`text-center py-12 border border-dashed border-white/10 ${t.rounded} bg-white/5`}>
                    <p className={`${t.mutedText} text-sm`}>No monitors selected.</p>
                </div>
            )}
        </div>
    );

    const historyDisplay = (
        <div className="relative">
            <IncidentHistory
                logs={config.showDummyData ? [
                    { type: 2, datetime: Date.now() / 1000 - 3600, duration: 300, monitorName: "API Gateway", reason: null },
                    { type: 1, datetime: Date.now() / 1000 - 86400, duration: 1200, monitorName: "Database Cluster", reason: { code: "502" } },
                    { type: 2, datetime: Date.now() / 1000 - 172800, duration: 450, monitorName: "CDN Edge", reason: null },
                    { type: 2, datetime: Date.now() / 1000 - 259200, duration: 600, monitorName: "Auth Service", reason: null },
                    { type: 2, datetime: Date.now() / 1000 - 345600, duration: 300, monitorName: "Search Index", reason: null },
                    { type: 2, datetime: Date.now() / 1000 - 432000, duration: 900, monitorName: "Image Resizer", reason: null }
                ] : selectedMonitors.flatMap(m => m.logs?.map((l: any) => ({ ...l, monitorName: m.friendly_name })) || [])
                    .sort((a: any, b: any) => b.datetime - a.datetime)
                }
                theme={t}
            />
        </div>
    );

    const maintenanceDisplay = (
        <div>
            <h3 className={`text-xs ${t.mutedText} uppercase tracking-[0.2em] font-bold mb-6 flex items-center gap-2`}>
                <Calendar className="w-3 h-3" /> Scheduled Maintenance
            </h3>

            {config.showDummyData ? (
                <div className={`p-8 ${t.card} ${t.rounded} border-l-4 border-l-indigo-500`}>
                    <div className="flex items-center justify-between mb-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/20">UPCOMING</span>
                        <span className="text-xs text-white/50 font-mono">Oct 24</span>
                    </div>
                    <h4 className="font-medium text-white text-sm">Database Migration</h4>
                    <p className={`text-xs ${t.mutedText} mt-2 leading-relaxed`}>
                        Broad updates to the cluster.
                    </p>
                </div>
            ) : (
                <div className={`p-8 text-center border border-dashed border-white/10 ${t.card} ${t.rounded}`}>
                    <div className="w-12 h-12 mx-auto rounded-full bg-white/5 flex items-center justify-center mb-4 border border-white/5">
                        <Calendar className="w-6 h-6 text-white/20" />
                    </div>
                    <h4 className="text-sm font-medium text-white/80">All Systems Go</h4>
                    <p className={`text-xs ${t.mutedText} mt-2`}>No maintenance windows are currently scheduled.</p>
                </div>
            )}
        </div>
    );

    const footerDisplay = (
        <footer className="mt-auto pt-24 pb-8 flex items-center justify-center">
            <a href="https://statuscode.in" className={`text-xs ${t.mutedText} hover:text-white transition-colors flex items-center gap-2 group`}>
                <div className="w-2 h-2 rounded-full bg-indigo-500 group-hover:scale-125 transition-transform" />
                Powered by <span className="font-bold text-white tracking-wide">Statuscode</span>
            </a>
        </footer>
    );

    const maintenanceBannerDisplay = config.showDummyData ? (
        <div className="w-full bg-indigo-500/10 border-b border-indigo-500/20 py-3 px-4 flex items-center justify-center gap-3 mb-8">
            <Calendar className="w-4 h-4 text-indigo-400" />
            <span className="text-sm font-medium text-indigo-200">
                Scheduled Maintenance: <span className="text-white">Database Migration</span> &mdash; Oct 24, 13:00 UTC
            </span>
            <ArrowRight className="w-4 h-4 text-indigo-400/50" />
        </div>
    ) : null; // Don't show if no maintenance (in real app, check maintenance data)

    // Layout 4 State
    const [showHistoryOverlay, setShowHistoryOverlay] = useState(false);

    const RenderLayout = () => {
        // Reset overlay if layout changes (optional, but good UX)
        // useEffect(() => setShowHistoryOverlay(false), [config.layout]); 
        // Cannot use useEffect inside this render function easily without moving it up, 
        // but since RenderLayout is called in render, we just handle the switch logic here.

        switch (config.layout) {
            case 'layout1': // Standard (Split Bottom)
                return (
                    <>
                        {headerDisplay}
                        {bannerDisplay}
                        <div className="flex flex-col gap-10 sm:gap-20">
                            {monitorsDisplay}
                            <div className={classNames(
                                "grid gap-12 sm:gap-16",
                                viewport === 'mobile' ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2"
                            )}>
                                {historyDisplay}
                                {maintenanceDisplay}
                            </div>
                        </div>
                    </>
                );
            case 'layout2': // Split Middle
                return (
                    <>
                        {headerDisplay}
                        {bannerDisplay}
                        <div className="flex flex-col gap-10 sm:gap-20">
                            <div className={classNames(
                                "grid gap-12 sm:gap-16",
                                viewport === 'mobile' ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-3"
                            )}>
                                <div className={classNames(
                                    "space-y-12",
                                    viewport === 'mobile' ? "col-span-1" : "lg:col-span-2"
                                )}>
                                    {monitorsDisplay}
                                </div>
                                <div className={classNames(
                                    viewport === 'mobile' ? "col-span-1" : "lg:col-span-1"
                                )}>
                                    {maintenanceDisplay}
                                </div>
                            </div>
                            {historyDisplay}
                        </div>
                    </>
                );
            case 'layout3': // Stacked + Banner Maint
                return (
                    <>
                        {maintenanceBannerDisplay}
                        {headerDisplay}
                        {bannerDisplay}
                        <div className="flex flex-col gap-10 sm:gap-20">
                            {monitorsDisplay}
                            {historyDisplay}
                        </div>
                    </>
                );
            case 'layout4': // Minimal + History Link + Banner Maint
                if (showHistoryOverlay) {
                    return (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                            <button
                                onClick={() => setShowHistoryOverlay(false)}
                                className={`mb-8 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 ${t.rounded} text-sm font-medium text-white transition-all flex items-center gap-2 group`}
                            >
                                <ArrowRight className="w-4 h-4 rotate-180 group-hover:-translate-x-1 transition-transform" />
                                Back to Status
                            </button>
                            {headerDisplay}
                            <div className="mt-8">
                                {historyDisplay}
                            </div>
                        </div>
                    );
                }
                return (
                    <>
                        {maintenanceBannerDisplay}
                        {headerDisplay}
                        {bannerDisplay}
                        <div className="flex flex-col gap-10 sm:gap-20">
                            {monitorsDisplay}
                            <div className="flex justify-center pt-8 border-t border-white/5">
                                <button
                                    onClick={() => setShowHistoryOverlay(true)}
                                    className={`px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 ${t.rounded} text-sm font-medium text-white transition-all flex items-center gap-2 group`}
                                >
                                    <Clock className="w-4 h-4 text-white/50 group-hover:text-white transition-colors" />
                                    View Incident History
                                    <ArrowRight className="w-4 h-4 opacity-50 group-hover:translate-x-1 transition-transform" />
                                </button>
                            </div>
                        </div>
                    </>
                );
            default:
                return null;
        }
    };

    return (
        <div className="h-full flex flex-col bg-zinc-950 relative">

            {/* Small Screen Warning */}
            <div className="min-[800px]:hidden absolute inset-0 z-[100] bg-black flex flex-col items-center justify-center p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-indigo-500/10 flex items-center justify-center mb-6">
                    <Monitor className="w-8 h-8 text-indigo-500" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-3">Desktop Required</h2>
                <p className="text-zinc-500 max-w-sm">
                    The editor is optimized for larger screens. Please switch to a desktop or laptop for the best experience.
                </p>
                <div className="mt-8 flex gap-2">
                    <span className="w-2 h-2 rounded-full bg-zinc-800" />
                    <span className="w-2 h-2 rounded-full bg-zinc-800" />
                    <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                </div>
            </div>

            {/* Toolbar */}
            <header className="h-14 border-b border-zinc-800 bg-zinc-900/50 flex items-center justify-between px-4 shrink-0 backdrop-blur-md z-50">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => {
                            setViewport('desktop');
                            setIsMaximized(false);
                        }}
                        className={classNames(
                            "p-2 rounded-lg transition-colors",
                            viewport === 'desktop' ? "text-white bg-zinc-800" : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
                        )}
                        title="Desktop View"
                    >
                        <Monitor className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => {
                            setViewport('mobile');
                            setIsMaximized(false);
                        }}
                        className={classNames(
                            "p-2 rounded-lg transition-colors",
                            viewport === 'mobile' ? "text-white bg-zinc-800" : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
                        )}
                        title="Mobile View"
                    >
                        <Smartphone className="w-4 h-4" />
                    </button>
                    <div className="h-4 w-[1px] bg-zinc-800 mx-2" />
                    <span className="text-xs text-zinc-500">Live Preview</span>
                </div>

                <div className="flex items-center gap-3">

                    {/* Example Data Toggle (Moved from Sidebar) */}
                    <div className="flex items-center gap-3 bg-zinc-900 rounded-full px-3 py-1.5 border border-zinc-800">
                        <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Example Data</span>
                        <button
                            onClick={() => updateConfig({ showDummyData: !config.showDummyData })}
                            className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors focus:outline-none ${config.showDummyData ? 'bg-indigo-500' : 'bg-zinc-700'}`}
                        >
                            <span className={`${config.showDummyData ? 'translate-x-3.5' : 'translate-x-[2px]'} inline-block h-3 w-3 transform rounded-full bg-white transition-transform`} />
                        </button>
                    </div>

                    <div className="h-4 w-[1px] bg-zinc-800" />

                    <div className="flex items-center gap-3">
                        <span className="text-xs text-zinc-500 font-medium uppercase tracking-wider hidden md:block w-24 text-right">
                            {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved' : 'Auto-Save On'}
                        </span>
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" title="Auto-Save Active" />
                    </div>
                    <div className="h-4 w-[1px] bg-zinc-800" />

                    <a href={previewUrl} target="_blank" className="bg-white text-black px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-zinc-200 transition-colors shadow-[0_0_15px_rgba(255,255,255,0.1)] flex items-center gap-2">
                        Publish <ExternalLink className="w-3 h-3" />
                    </a>
                </div>
            </header>

            {/* Canvas Area */}
            <div className={`flex-1 overflow-hidden relative flex items-center justify-center bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:16px_16px] transition-all duration-500 ${isMaximized ? 'p-0' : 'p-8'}`}>

                {/* Device Frame */}
                <div
                    className={classNames(
                        "bg-black border border-zinc-800 shadow-2xl overflow-hidden flex flex-col relative transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] z-20",
                        isMaximized ? "w-full h-full rounded-none border-0" :
                            viewport === 'desktop' ? "w-full h-full max-w-[1500px] rounded-xl" : "w-[420px] h-[812px] border-[8px] border-zinc-900 rounded-[3rem]"
                    )}
                >

                    {/* Browser Chrome (Desktop only) */}
                    {viewport === 'desktop' && (
                        <div className="h-10 bg-zinc-900/90 border-b border-zinc-800 flex items-center px-4 gap-2 shrink-0">
                            <div className="flex gap-1.5 group">
                                <button
                                    onClick={() => setIsMaximized(false)} // Close (Minimize effect)
                                    className="w-3 h-3 rounded-full bg-[#ff5f56] flex items-center justify-center hover:scale-110 transition-transform"
                                >
                                    <div className="w-1.5 h-1.5 bg-black/20 opacity-0 group-hover:opacity-100 rounded-full transition-opacity" />
                                </button>
                                <button
                                    onClick={() => setIsMaximized(false)} // Minimize (Yellow)
                                    className="w-3 h-3 rounded-full bg-[#ffbd2e] flex items-center justify-center hover:scale-110 transition-transform"
                                >
                                    <div className="w-2 h-0.5 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </button>
                                <button
                                    onClick={() => setIsMaximized(true)} // Maximize (Green)
                                    className="w-3 h-3 rounded-full bg-[#27c93f] flex items-center justify-center hover:scale-110 transition-transform"
                                >
                                    <div className="w-1.5 h-1.5 bg-black/20 opacity-0 group-hover:opacity-100 rounded-full transition-opacity" />
                                </button>
                            </div>
                            <div className="ml-4 flex-1 max-w-sm h-7 bg-zinc-950/50 rounded flex items-center justify-center text-xs text-zinc-500 font-mono transition-all">
                                statuscode.in/s/{config.brandName?.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'demo'}
                            </div>
                        </div>
                    )}

                    {/* --- PREVIEW CONTENT --- */}
                    <div className={`flex-1 overflow-y-auto relative custom-scrollbar font-sans selection:bg-indigo-500/30 ${t.pageBg} [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']`}>

                        {/* Global Noise Texture */}
                        <div className={`absolute inset-0 pointer-events-none z-0 mix-blend-overlay ${t.noiseOpacity}`}
                            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E")` }}
                        />

                        {/* Logo Background Effect */}
                        {config.logoUrl && (
                            <div
                                className="absolute top-0 right-0 w-[80vw] h-[80vh] opacity-[0.03] pointer-events-none z-0 grayscale mix-blend-screen"
                                style={{
                                    backgroundImage: `url(${config.logoUrl})`,
                                    backgroundSize: 'contain',
                                    backgroundRepeat: 'no-repeat',
                                    backgroundPosition: '50% 50%',
                                    filter: 'blur(80px)'
                                }}
                            />
                        )}

                        <div className={`${t.container} flex flex-col min-h-[90vh]`}>
                            <RenderLayout />
                            {footerDisplay}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
