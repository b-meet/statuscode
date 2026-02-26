"use client";

import { useEditor } from "@/context/EditorContext";
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Loader2, CheckCircle2, ChevronRight, Activity as ActivityIcon, Sparkles } from "lucide-react";
import { toDemoStringId } from "@/lib/mockMonitors";
import { MonitorProvider } from "@/lib/types";

interface Monitor {
    id: number;
    friendly_name: string;
    url: string;
    status: number; // 2=up, 8=seems down, 9=down
}

export default function MonitorManager() {
    const { config, updateConfig, monitorsData, fetchMonitors, loading: globalLoading, addDemoMonitors, monitorError, setIsRealDataEnabled } = useEditor();
    const [fetching, setFetching] = useState(false);
    const [error, setError] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const popupRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const [isAddingDemos, setIsAddingDemos] = useState(false);

    const handleAddDemos = async () => {
        setIsAddingDemos(true);
        // Artificial delay for "refilling" effect
        await new Promise(resolve => setTimeout(resolve, 800));
        addDemoMonitors();
        setIsAddingDemos(false);
    };

    const handleFetch = async () => {
        if (!config.apiKey) {
            setError("Please enter an API Key first.");
            return;
        }

        setFetching(true);
        setError("");

        try {
            await fetchMonitors();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "An unknown error occurred");
        } finally {
            setFetching(false);
        }
    };

    const toggleMonitor = (id: string) => {
        const current = new Set(config.monitors);
        if (current.has(id)) {
            current.delete(id);
        } else {
            current.add(id);
        }
        updateConfig({ monitors: Array.from(current) });
    };

    const toggleOpen = () => {
        if (!isOpen && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setPosition({
                top: rect.top,
                left: rect.right + 12,
            });
        }
        setIsOpen(!isOpen);
    };

    // Close on scroll or resize
    useEffect(() => {
        const handleScroll = (e: Event) => {
            if (popupRef.current && popupRef.current.contains(e.target as Node)) {
                return;
            }
            setIsOpen(false);
        };
        window.addEventListener('scroll', handleScroll, true);
        window.addEventListener('resize', handleScroll);
        return () => {
            window.removeEventListener('scroll', handleScroll, true);
            window.removeEventListener('resize', handleScroll);
        };
    }, [isOpen]);

    const selectedCount = config.monitors.length;
    const totalCount = monitorsData?.length || 0;

    return (
        <>
            <div className="space-y-3">
                <button
                    ref={buttonRef}
                    onClick={toggleOpen}
                    className={`w-full flex items-center justify-between group p-2 -ml-2 rounded-lg transition-colors ${isOpen ? 'bg-zinc-800' : 'hover:bg-zinc-800/50'}`}
                >
                    <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${monitorError ? 'bg-red-500/10 text-red-500' : isOpen ? 'bg-zinc-700 text-white' : 'bg-zinc-800 text-zinc-400 group-hover:text-zinc-300'}`}>
                            {monitorError ? (
                                <ActivityIcon className="w-4 h-4" />
                            ) : (
                                <ActivityIcon className="w-4 h-4" />
                            )}
                        </div>
                        <div className="text-left">
                            <h3 className={`text-xs font-semibold ${monitorError ? 'text-red-400' : 'text-zinc-300'}`}>
                                {monitorError ? 'Error' : 'Monitors'}
                            </h3>
                            <div className={`text-[10px] flex items-center gap-1.5 ${monitorError ? 'text-red-500/70' : 'text-zinc-500'}`}>
                                {monitorError ? 'Failed to fetch' : `${selectedCount} / ${totalCount} Active`}
                            </div>
                        </div>
                    </div>
                    <ChevronRight className={`w-4 h-4 text-zinc-500 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                </button>
            </div>

            {isOpen && createPortal(
                <>
                    <div
                        className="fixed inset-0 z-[9998] bg-transparent"
                        onClick={() => setIsOpen(false)}
                    />

                    <div
                        ref={popupRef}
                        className="fixed z-[9999] w-72 bg-[#09090b] border border-zinc-800 rounded-xl shadow-2xl p-4 animate-in fade-in zoom-in-95 duration-200"
                        style={{
                            top: Math.min(position.top, window.innerHeight - 450),
                            left: position.left,
                        }}
                    >
                        <div className="px-1 py-1 mb-4 border-b border-zinc-800/50 flex items-center justify-between">
                            <div className="text-xs font-semibold text-white uppercase tracking-wider">Monitor Settings</div>
                        </div>

                        {/* Provider & API Key Input */}
                        <div className="space-y-3 mb-6">
                            <div className="space-y-1.5">
                                <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-tight">Provider</label>
                                <select
                                    value={config.monitorProvider || 'uptimerobot'}
                                    onChange={(e) => {
                                        const newProvider = e.target.value as MonitorProvider;
                                        if (config.monitorProvider !== newProvider) {
                                            updateConfig({ monitorProvider: newProvider, apiKey: '' });
                                            setIsRealDataEnabled(false);
                                            addDemoMonitors();
                                        }
                                    }}
                                    className="w-full h-8 px-2 rounded bg-black border border-zinc-800 text-white text-[11px] focus:outline-none focus:border-zinc-700 transition-colors"
                                >
                                    <option value="uptimerobot">UptimeRobot</option>
                                    <option value="betterstack">Better Stack</option>
                                    <option value="manual">Demo Mode</option>
                                </select>
                            </div>

                            {config.monitorProvider !== 'manual' && (
                                <div className="space-y-1.5">
                                    <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-tight">
                                        {config.monitorProvider === 'betterstack' ? 'Better Stack Token' : 'UptimeRobot Key'}
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="password"
                                            value={config.apiKey}
                                            onChange={(e) => updateConfig({ apiKey: e.target.value })}
                                            placeholder={config.monitorProvider === 'betterstack' ? "u12345-..." : "ur12345-..."}
                                            disabled={globalLoading}
                                            className="flex-1 min-w-0 h-8 px-2 rounded bg-black border border-zinc-800 text-white text-xs placeholder:text-zinc-700 focus:outline-none focus:border-zinc-700 transition-colors font-mono disabled:opacity-50"
                                        />
                                        <button
                                            onClick={handleFetch}
                                            disabled={fetching || globalLoading || !config.apiKey}
                                            className="px-2 h-8 bg-white text-black rounded text-[10px] font-bold hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            {fetching ? <Loader2 className="w-3 h-3 animate-spin" /> : (monitorsData && monitorsData.length > 0 ? "REFRESH" : "FETCH")}
                                        </button>
                                    </div>
                                    {globalLoading && <p className="text-[9px] text-zinc-500 animate-pulse">Loading settings...</p>}
                                    {(error || monitorError) && (
                                        <p className="text-[9px] text-red-500 leading-tight">
                                            {error || monitorError}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="text-[10px] uppercase font-bold text-zinc-500 tracking-tight mb-2">Select Services</div>

                        {/* Demo Action (Only show if empty) */}
                        {!monitorsData?.length && (
                            <button
                                onClick={handleAddDemos}
                                disabled={isAddingDemos}
                                className="w-full mb-4 p-3 border border-dashed border-indigo-500/30 bg-indigo-500/5 hover:bg-indigo-500/10 rounded-lg text-center transition-all group/demo disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <div className="text-[11px] font-bold text-indigo-400 group-hover/demo:text-indigo-300 flex items-center justify-center gap-2">
                                    {isAddingDemos ? (
                                        <>
                                            <Loader2 className="w-3 h-3 animate-spin" />
                                            Adding Monitors...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="w-3 h-3" />
                                            Add 3 Demo Monitors
                                        </>
                                    )}
                                </div>
                                <p className="text-[9px] text-indigo-500/60 mt-0.5">Quickly see how it looks without an API key</p>
                            </button>
                        )}

                        {/* Monitor List */}
                        {monitorsData && monitorsData.length > 0 ? (
                            <div className="space-y-1 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                                {monitorsData.map((monitor: Monitor) => {
                                    const monitorIdStr = monitor.id < 0 ? toDemoStringId(monitor.id) : String(monitor.id);
                                    const isSelected = config.monitors.includes(monitorIdStr);
                                    return (
                                        <button
                                            key={monitor.id}
                                            onClick={() => toggleMonitor(monitorIdStr)}
                                            className={`w-full text-left p-2 rounded border flex items-center justify-between transition-all ${isSelected
                                                ? 'bg-zinc-900 border-zinc-800'
                                                : 'bg-transparent border-transparent hover:bg-zinc-900/50'
                                                }`}
                                        >
                                            <div className="flex items-center gap-2 overflow-hidden">
                                                <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${monitor.status === 2 ? 'bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]' :
                                                    monitor.status === 8 || monitor.status === 9 ? 'bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.5)]' : 'bg-zinc-500'
                                                    }`} />
                                                <span className={`text-[11px] truncate ${isSelected ? 'text-white font-medium' : 'text-zinc-400 group-hover:text-zinc-300'}`}>
                                                    {monitor.friendly_name}
                                                </span>
                                            </div>
                                            {isSelected && <CheckCircle2 className="w-3 h-3 text-indigo-500" />}
                                        </button>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="p-4 text-center border border-dashed border-zinc-800 rounded-lg bg-zinc-900/20">
                                <p className="text-[10px] text-zinc-500">No monitors loaded yet.</p>
                            </div>
                        )}
                    </div>
                </>,
                document.body
            )}
        </>
    );
}
