"use client";

import { useEditor } from "@/context/EditorContext";
import { Monitor, Smartphone, Activity, ExternalLink, AlertTriangle, ArrowLeft } from "lucide-react";
import { useRef, useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { themes } from "@/lib/themes";
import { RenderLayout } from "@/components/editor/RenderLayout";
import { Footer } from "@/components/editor/Footer";
import { motion, AnimatePresence } from "framer-motion";
import { EditorHeader } from "@/components/editor/EditorHeader";
import { EditorHistory } from "@/components/editor/EditorHistory";
import { EditorMaintenance } from "@/components/editor/EditorMaintenance";
import { getAverageResponseTime, classNames } from "@/lib/utils";
import { IncidentHistory } from "@/components/status-page/IncidentHistory";
import { toDemoStringId } from "@/lib/mockMonitors";


export default function EditorPage() {
    const { config, updateConfig, saveStatus, monitorsData, isRealDataEnabled, toggleRealData, publishSite, isPublishing, loading } = useEditor();
    const [viewport, setViewport] = useState<'desktop' | 'mobile'>('desktop');
    const [isMaximized, setIsMaximized] = useState(false);
    const [selectedMonitorId, setSelectedMonitorId] = useState<string | null>(null);
    const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);

    // Resizing logic
    const [containerWidth, setContainerWidth] = useState(1200);
    const [isResizing, setIsResizing] = useState(false);
    const dragStartRef = useRef<{ x: number, width: number } | null>(null);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizing || !dragStartRef.current) return;
            const deltaX = e.clientX - dragStartRef.current.x;
            const newWidth = Math.max(700, Math.min(1500, dragStartRef.current.width + deltaX * 2));
            setContainerWidth(newWidth);
        };

        const handleMouseUp = () => setIsResizing(false);

        if (isResizing) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizing]);

    // Derived state (Memoized)
    const isMobileLayout = viewport === 'mobile' || containerWidth < 800;

    const selectedMonitorsData = useMemo(() => {
        if (!config.previewScenario || config.previewScenario === 'none') return monitorsData;

        // Mock data based on scenario
        return monitorsData.map((m, idx) => {
            const mockMonitor = { ...m };
            const isDown = (config.previewScenario === 'under_50_down' && idx === 0) ||
                (config.previewScenario === 'over_50_down' && idx % 2 === 0);

            if (isDown) {
                mockMonitor.status = 9; // Down
            } else if (config.previewScenario === 'all_good') {
                mockMonitor.status = 2; // Up
            } else if (config.previewScenario === 'maintenance_full') {
                mockMonitor.status = 0; // Paused/Maintenance
            } else if (config.previewScenario === 'maintenance_partial' && idx === 0) {
                mockMonitor.status = 0; // Paused/Maintenance for first monitor
            }

            if (config.previewScenario === 'slow_response') {
                mockMonitor.response_times = Array(20).fill(0).map(() => ({ datetime: Date.now() / 1000, value: 2000 + Math.random() * 1000 }));
            }

            if (config.previewScenario === 'heavy_incidents' && idx === 0) {
                mockMonitor.logs = [
                    {
                        type: 1, // Down
                        datetime: Date.now() / 1000 - 3600, // 1 hour ago
                        duration: 1800,
                        reason: { code: 'Database Connection Timeout', detail: 'Connection refused by peer' }
                    },
                    {
                        type: 2, // Up
                        datetime: Date.now() / 1000 - 10000,
                        duration: 0,
                    },
                    {
                        type: 1,
                        datetime: Date.now() / 1000 - 86400, // 1 day ago
                        duration: 3200,
                        reason: { code: 'API Gateway Error', detail: 'Upstream timed out' }
                    }
                ];
            }

            return mockMonitor;
        });
    }, [monitorsData, config.previewScenario]);

    const selectedMonitors = useMemo(() =>
        selectedMonitorsData.filter(m => {
            const idStr = m.id < 0 ? toDemoStringId(m.id) : String(m.id);
            return config.monitors.includes(idStr);
        }),
        [selectedMonitorsData, config.monitors]);

    const stats = useMemo(() => {
        const downCount = selectedMonitors.filter(m => m.status === 8 || m.status === 9).length;
        const totalCount = selectedMonitors.length;

        let status: 'operational' | 'partial' | 'major' | 'maintenance' | 'maintenance_partial' = 'operational';

        // Override status for maintenance previews
        if (config.previewScenario === 'maintenance_full') {
            status = 'maintenance';
        } else if (config.previewScenario === 'maintenance_partial') {
            status = 'maintenance_partial';
        } else {
            // Normal calculation based on monitor status
            if (totalCount > 0) {
                if (downCount >= totalCount / 2 && downCount > 0) {
                    status = 'major';
                } else if (downCount > 0) {
                    status = 'partial';
                }
            }
        }

        const avg = Math.round(
            selectedMonitors.reduce((acc, m) => acc + getAverageResponseTime(m.response_times), 0) / (totalCount || 1)
        );

        return { status, totalAvgResponse: avg };
    }, [selectedMonitors]);

    const t = useMemo(() => themes[config.theme] || themes.modern, [config.theme]);
    const previewUrl = useMemo(() => `/s/${config.brandName?.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'demo'}`, [config.brandName]);



    const [currentTip, setCurrentTip] = useState(0);

    const tips = [
        {
            title: "Did you know?",
            text: "You can customize your status page with your own brand colors and logo."
        },
        {
            title: "Pro Tip",
            text: "Connect your custom domain to make your status page look professional."
        },
        {
            title: "Stay Updated",
            text: "Enable email notifications to keep your users informed during incidents."
        },
        {
            title: "Real-time Data",
            text: "Connect your UptimeRobot API key for live monitoring updates."
        }
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTip((prev) => (prev + 1) % tips.length);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    // --- LOADING STATE ---
    if (loading) {
        return (
            <div className="h-screen w-full bg-zinc-950 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4 animate-pulse">
                    <Activity className="w-12 h-12 text-zinc-700" />
                    <p className="text-zinc-500 text-sm font-medium">Loading Editor...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-zinc-950 relative">

            {/* Small Screen Warning */}
            <div className="min-[800px]:hidden absolute inset-0 z-[100] bg-black flex flex-col items-center justify-center p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-indigo-500/10 flex items-center justify-center mb-6">
                    <Monitor className="w-8 h-8 text-indigo-500" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Desktop Required</h2>
                <p className="text-zinc-500 max-w-sm mb-8">
                    The editor is optimized for larger screens. Please switch to a desktop or laptop for the best experience.
                </p>

                {/* Tips Carousel */}
                <div className="w-full max-w-xs bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-zinc-950/50 pointer-events-none" />

                    <div className="relative z-10 min-h-[100px] flex flex-col justify-between">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentTip}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.3 }}
                                className="space-y-2"
                            >
                                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                                    {tips[currentTip].title}
                                </span>
                                <p className="text-sm text-zinc-300 leading-relaxed">
                                    {tips[currentTip].text}
                                </p>
                            </motion.div>
                        </AnimatePresence>

                        <div className="flex justify-center gap-1.5 mt-6">
                            {tips.map((_, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setCurrentTip(idx)}
                                    className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${idx === currentTip ? 'bg-indigo-500 w-4' : 'bg-zinc-700 hover:bg-zinc-600'
                                        }`}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                <Link
                    href="/dashboard"
                    className="mt-8 px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2 text-sm"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Go back to dashboard
                </Link>
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
                    <span className="text-xs text-zinc-500 font-medium">Live Preview</span>
                </div>

                <div className="flex items-center gap-3">


                    <div className="flex items-center gap-3">
                        <span className="text-xs text-zinc-500 font-medium uppercase tracking-wider hidden md:block w-24 text-right">
                            {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved' : 'Auto-Save On'}
                        </span>
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" title="Auto-Save Active" />
                    </div>
                    <div className="h-4 w-[1px] bg-zinc-800" />

                    {/* Real Data Toggle */}
                    {config.apiKey && config.monitors.length > 0 && (
                        <div className="flex items-center gap-2 mr-2">
                            <span className={`text-xs font-medium ${isRealDataEnabled ? 'text-emerald-400' : 'text-zinc-500'}`}>
                                Real Data
                            </span>
                            <button
                                onClick={toggleRealData}
                                className={`w-8 h-4 rounded-full transition-colors relative ${isRealDataEnabled ? 'bg-emerald-500/20' : 'bg-zinc-800'}`}
                            >
                                <div className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full transition-transform ${isRealDataEnabled ? 'translate-x-4 bg-emerald-400' : 'bg-zinc-500'}`} />
                            </button>
                        </div>
                    )}

                    {(() => {
                        const hasRealMonitors = config.monitors.some(id => !id.startsWith('demo-'));
                        const isDisabled = isPublishing || !hasRealMonitors;
                        const tooltip = !hasRealMonitors ? "You need at least 1 active (non-demo) monitor to publish your page" : undefined;

                        return (
                            <button
                                onClick={() => setIsPublishModalOpen(true)}
                                disabled={isDisabled}
                                title={tooltip}
                                className="bg-white text-black px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-zinc-200 transition-colors shadow-[0_0_15px_rgba(255,255,255,0.1)] flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isPublishing ? 'Publishing...' : 'Publish'} <ExternalLink className="w-3 h-3" />
                            </button>
                        );
                    })()}
                </div>
            </header>

            {/* Canvas Area */}
            <div className={`flex-1 overflow-hidden relative flex items-center justify-center bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:16px_16px] transition-all duration-500 ${isMaximized ? 'p-0' : 'p-8'}`}>

                {/* Device Frame */}
                <div
                    className={classNames(
                        "relative z-20 flex flex-col items-center",
                        isMaximized ? "w-full h-full transition-all duration-300 ease-out" :
                            viewport === 'desktop' ?
                                `transition-all ${isResizing ? 'duration-0 ease-linear' : 'duration-300 ease-[cubic-bezier(0.25,1,0.5,1)]'}`
                                : "w-[420px] h-[812px] transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)]"
                    )}
                    style={{
                        width: viewport === 'desktop' && !isMaximized ? `${containerWidth}px` : undefined,
                        height: viewport === 'desktop' && !isMaximized ? '100%' : undefined
                    }}
                >
                    {/* Drag Handle (Desktop only) */}
                    {viewport === 'desktop' && !isMaximized && (
                        <>
                            <div
                                className={classNames(
                                    "absolute right-0 top-1/2 -translate-y-1/2 translate-x-6 w-6 h-24 rounded-r-lg flex items-center justify-center cursor-col-resize shadow-xl z-50 group transition-colors",
                                    isResizing ? "bg-indigo-600 border-indigo-500 ring-2 ring-indigo-500/50" : "bg-zinc-800 hover:bg-zinc-700 border border-zinc-700"
                                )}
                                onMouseDown={(e) => {
                                    setIsResizing(true);
                                    dragStartRef.current = { x: e.clientX, width: containerWidth };
                                }}
                            >
                                <div className="flex flex-col gap-1 pointer-events-none">
                                    <div className={`w-1 h-1 rounded-full transition-colors ${isResizing ? 'bg-white' : 'bg-zinc-500'}`} />
                                    <div className={`w-1 h-1 rounded-full transition-colors ${isResizing ? 'bg-white' : 'bg-zinc-500'}`} />
                                    <div className={`w-1 h-1 rounded-full transition-colors ${isResizing ? 'bg-white' : 'bg-zinc-500'}`} />
                                </div>
                            </div>

                            {/* Width Label overlay during resize */}
                            {isResizing && (
                                <div className="absolute top-4 right-4 bg-black/90 text-white text-sm font-bold font-mono px-3 py-1.5 rounded-lg backdrop-blur-md border border-white/10 z-50 shadow-2xl pointer-events-none">
                                    {Math.round(containerWidth)}px
                                </div>
                            )}

                            {/* Interaction overlay during resize */}
                            {isResizing && (
                                <div className="fixed inset-0 z-[100] cursor-col-resize" />
                            )}
                        </>
                    )}

                    {/* Inner Clipping Frame - Contains Chrome & Content */}
                    <div className={classNames(
                        "flex-1 w-full h-full bg-black shadow-2xl overflow-hidden flex flex-col relative transition-all duration-300",
                        isMaximized ? "rounded-none" :
                            viewport === 'desktop' ? "rounded-xl border border-zinc-800" : "rounded-[3rem] border-[8px] border-zinc-900",
                        isResizing && "pointer-events-none select-none opacity-90 grayscale-[0.5] scale-[0.99]"
                    )}>
                        {/* Browser Chrome (Desktop only) */}
                        {viewport === 'desktop' && (
                            <div className="h-10 bg-zinc-900/90 border-b border-zinc-800 flex items-center px-4 gap-2 shrink-0">
                                <div className="flex gap-1.5 group">
                                    <button onClick={() => setIsMaximized(false)} className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                                    <button onClick={() => setIsMaximized(false)} className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                                    <button onClick={() => setIsMaximized(true)} className="w-3 h-3 rounded-full bg-[#27c93f]" />
                                </div>
                                <div className="ml-4 flex-1 max-w-sm h-7 bg-zinc-950/50 rounded flex items-center justify-center text-xs text-zinc-500 font-mono">
                                    statuscode.in/s/{config.brandName?.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'demo'}
                                </div>
                            </div>
                        )}

                        {/* --- PREVIEW CONTENT --- */}
                        <div className={`flex-1 overflow-y-auto relative custom-scrollbar font-sans selection:bg-indigo-500/30 ${t.pageBg}`}>

                            {/* Global Noise Texture */}
                            <div className={`absolute inset-0 pointer-events-none z-0 mix-blend-overlay ${t.noiseOpacity}`}
                                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E")` }}
                            />

                            {/* Dummy Preview Data Banner */}
                            {!isRealDataEnabled && (
                                <div className="sticky top-4 z-50 w-full flex justify-center pointer-events-none h-0 overflow-visible">
                                    <div className="bg-amber-500/10 border border-amber-500/20 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-2 shadow-lg">
                                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                        <span className="text-[10px] font-medium text-amber-200 uppercase tracking-wide">
                                            Dummy Preview Data
                                        </span>
                                    </div>
                                </div>
                            )}

                            <div className={`${t.container} flex flex-col min-h-[90vh] relative z-10`}>
                                <RenderLayout
                                    config={config}
                                    updateConfig={updateConfig}
                                    selectedMonitors={selectedMonitors}
                                    status={stats.status}
                                    totalAvgResponse={stats.totalAvgResponse}
                                    isMobileLayout={isMobileLayout}
                                    selectedMonitorId={selectedMonitorId}
                                    setSelectedMonitorId={setSelectedMonitorId}
                                    theme={t}
                                    Header={
                                        <EditorHeader
                                            logoUrl={config.logoUrl}
                                            brandName={config.brandName}
                                            isMobileLayout={isMobileLayout}
                                            serviceCount={selectedMonitors.length}
                                            theme={t}
                                        />
                                    }
                                    History={
                                        <EditorHistory
                                            showDummyData={config.showDummyData ?? false}
                                            selectedMonitors={selectedMonitors}
                                            theme={t}
                                        />
                                    }
                                    Maintenance={
                                        <EditorMaintenance
                                            showDummyData={config.showDummyData ?? false}
                                            theme={t}
                                        />
                                    }
                                />
                                <Footer theme={t} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* Publish Confirmation Modal */}
            {isPublishModalOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-md bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl p-6 m-4 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center">
                                <ExternalLink className="w-5 h-5 text-indigo-400" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-white">Confirm Publish</h2>
                                <p className="text-sm text-zinc-400">Review before going live</p>
                            </div>
                        </div>

                        <div className="space-y-4 mb-6">
                            <div className="text-sm text-zinc-300">
                                You are about to publish <strong>{config.monitors.filter(id => !id.startsWith('demo-')).length} active monitors</strong> to your live status page.
                            </div>

                            {(() => {
                                const activeUpdates = Object.values(config.annotations || {}).flat();
                                const totalUpdates = activeUpdates.length;
                                const monitorsWithUpdates = Object.keys(config.annotations || {}).filter(key => (config.annotations?.[key]?.length ?? 0) > 0).length;

                                if (totalUpdates > 0) {
                                    return (
                                        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                                            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wide mb-1">
                                                <AlertTriangle className="w-3 h-3" />
                                                {totalUpdates} Active Status Update{totalUpdates > 1 ? 's' : ''}
                                            </div>
                                            <p className="text-xs text-amber-200/80">
                                                You have {totalUpdates} manual status notes attached to {monitorsWithUpdates} monitor{monitorsWithUpdates > 1 ? 's' : ''}. These will be visible to the public.
                                            </p>
                                        </div>
                                    );
                                }
                                return null;
                            })()}

                            <div className="text-xs text-zinc-500 bg-zinc-800/50 p-2 rounded">
                                Public URL: <span className="font-mono text-zinc-300 text-[10px]">{window.location.origin}/s/{config.brandName.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'demo'}</span>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3">
                            <button
                                onClick={() => setIsPublishModalOpen(false)}
                                className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    setIsPublishModalOpen(false);
                                    publishSite();
                                }}
                                className="px-4 py-2 bg-white text-black text-sm font-bold rounded-lg hover:bg-zinc-200 transition-colors flex items-center gap-2"
                            >
                                Confirm & Publish
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
