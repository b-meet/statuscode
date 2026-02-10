"use client";

import { useEditor } from "@/context/EditorContext";
import { Monitor, Smartphone, Activity, ExternalLink } from "lucide-react";
import { useRef, useState, useEffect, useMemo } from "react";
import { themes } from "@/lib/themes";
import { RenderLayout } from "@/components/editor/RenderLayout";
import { Footer } from "@/components/editor/Footer";
import { EditorHeader } from "@/components/editor/EditorHeader";
import { EditorHistory } from "@/components/editor/EditorHistory";
import { EditorMaintenance } from "@/components/editor/EditorMaintenance";
import { getAverageResponseTime, classNames } from "@/lib/utils";
import { IncidentHistory } from "@/components/status-page/IncidentHistory";


export default function EditorPage() {
    const { config, updateConfig, saveStatus, monitorsData } = useEditor();
    const [viewport, setViewport] = useState<'desktop' | 'mobile'>('desktop');
    const [isMaximized, setIsMaximized] = useState(false);
    const [selectedMonitorId, setSelectedMonitorId] = useState<string | null>(null);

    // Resizing logic
    const [containerWidth, setContainerWidth] = useState(1200);
    const [isResizing, setIsResizing] = useState(false);
    const dragStartRef = useRef<{ x: number, width: number } | null>(null);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizing || !dragStartRef.current) return;
            const deltaX = e.clientX - dragStartRef.current.x;
            const newWidth = Math.max(400, Math.min(1440, dragStartRef.current.width + deltaX * 2));
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

    const selectedMonitors = useMemo(() =>
        monitorsData.filter(m => config.monitors.includes(String(m.id))),
        [monitorsData, config.monitors]);

    const stats = useMemo(() => {
        const downCount = selectedMonitors.filter(m => m.status === 8 || m.status === 9).length;
        const totalCount = selectedMonitors.length;

        let status: 'operational' | 'partial' | 'major' = 'operational';

        if (totalCount > 0) {
            if (downCount >= totalCount / 2 && downCount > 0) {
                status = 'major';
            } else if (downCount > 0) {
                status = 'partial';
            }
        }

        const avg = Math.round(
            selectedMonitors.reduce((acc, m) => acc + getAverageResponseTime(m.response_times), 0) / (totalCount || 1)
        );

        return { status, totalAvgResponse: avg };
    }, [selectedMonitors]);

    const t = useMemo(() => themes[config.theme] || themes.modern, [config.theme]);
    const previewUrl = useMemo(() => `/s/${config.brandName?.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'demo'}`, [config.brandName]);


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
                    <span className="text-xs text-zinc-500 font-medium">Live Preview</span>
                </div>

                <div className="flex items-center gap-3">
                    {/* Example Data Toggle */}
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

                            <div className={`${t.container} flex flex-col min-h-[90vh] relative z-10`}>
                                <RenderLayout
                                    config={config}
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
        </div>
    );
}
