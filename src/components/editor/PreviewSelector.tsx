"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useEditor, PreviewScenario } from "@/context/EditorContext";
import { Eye, CheckCircle2, AlertCircle, XCircle, Clock, Construction, Activity, ChevronRight, Check, LucideIcon } from "lucide-react";

const scenarios: { id: PreviewScenario; label: string; icon: LucideIcon; color: string }[] = [
    { id: 'all_good', label: 'Everything is working fine', icon: CheckCircle2, color: 'text-emerald-500' },
    { id: 'under_50_down', label: '< 50% of services are down', icon: AlertCircle, color: 'text-amber-500' },
    { id: 'over_50_down', label: '> 50% of services are down', icon: XCircle, color: 'text-rose-500' },
    { id: 'slow_response', label: 'Response time is slow', icon: Clock, color: 'text-orange-500' },
    { id: 'maintenance_full', label: 'Full Maintenance', icon: Construction, color: 'text-blue-500' },
    { id: 'maintenance_partial', label: 'Partial Maintenance', icon: Construction, color: 'text-amber-500' },
    { id: 'heavy_incidents', label: 'Recent Incidents Example', icon: Activity, color: 'text-purple-500' },
];

export default function PreviewSelector() {
    const { config, updateConfig, setIsRealDataEnabled } = useEditor();
    const [isOpen, setIsOpen] = useState(false);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const popupRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({ top: 0, left: 0 });

    const activeScenario = scenarios.find(s => s.id === config.previewScenario) || {
        id: 'none',
        label: 'Live',
        icon: Eye,
        color: 'text-zinc-400'
    };

    const toggleOpen = () => {
        if (!isOpen && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setPosition({
                top: rect.top,
                left: rect.right + 12, // 12px gap
            });
        }
        setIsOpen(!isOpen);
    };

    // Close on scroll or resize to prevent detachment
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

    return (
        <>
            <div className="space-y-3">
                <button
                    ref={buttonRef}
                    onClick={toggleOpen}
                    className={`w-full flex items-center justify-between group p-2 -ml-2 rounded-lg transition-colors ${isOpen ? 'bg-zinc-800' : 'hover:bg-zinc-800/50'}`}
                >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${isOpen ? 'bg-zinc-700 text-white' : 'bg-zinc-800 text-zinc-400 group-hover:text-zinc-300'}`}>
                            <Eye className="w-4 h-4" />
                        </div>
                        <div className="text-left">
                            <h3 className="text-xs font-semibold text-zinc-300">Preview</h3>
                            <div className="text-[10px] text-zinc-500 flex items-center gap-1.5 min-w-0">
                                {activeScenario?.id !== 'none' && (
                                    <activeScenario.icon className={`w-3 h-3 ${activeScenario.color}`} />
                                )}
                                <span className="truncate">{activeScenario?.label || 'Live'}</span>
                            </div>
                        </div>
                    </div>
                    <ChevronRight className={`w-4 h-4 text-zinc-500 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                </button>
            </div>

            {isOpen && createPortal(
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-[9998] bg-transparent"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Popover Menu */}
                    <div
                        ref={popupRef}
                        className="fixed z-[9999] w-72 bg-[#09090b] border border-zinc-800 rounded-xl shadow-2xl p-2 animate-in fade-in zoom-in-95 duration-200"
                        style={{
                            top: Math.min(position.top, window.innerHeight - 400), // Adjusted for longer list
                            left: position.left,
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="px-2 py-1.5 mb-2 border-b border-zinc-800/50 flex items-center justify-between">
                            <div>
                                <div className="text-xs font-semibold text-white">Preview</div>
                                <p className="text-[10px] text-zinc-500 mt-0.5">
                                    Simulate states
                                </p>
                            </div>
                            {config.previewScenario && config.previewScenario !== 'none' && (
                                <button
                                    onClick={() => {
                                        updateConfig({ previewScenario: 'none' });
                                        setIsRealDataEnabled(true);
                                    }}
                                    className="text-[10px] px-1.5 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded border border-zinc-700 transition-colors"
                                >
                                    Reset
                                </button>
                            )}
                        </div>
                        <div className="space-y-1 max-h-[400px] overflow-y-auto custom-scrollbar">


                            {scenarios.map((scenario) => (
                                <button
                                    key={scenario.id}
                                    onClick={() => {
                                        updateConfig({ previewScenario: scenario.id });
                                        setIsRealDataEnabled(false);
                                    }}
                                    className={`w-full group relative p-2 rounded-lg border text-left transition-all ${config.previewScenario === scenario.id
                                        ? 'bg-zinc-900 border-zinc-700'
                                        : 'bg-transparent border-transparent hover:bg-zinc-900/50'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <scenario.icon className={`w-4 h-4 ${scenario.color}`} />
                                        <span className={`text-sm ${config.previewScenario === scenario.id ? 'text-white' : 'text-zinc-400 group-hover:text-zinc-300'}`}>
                                            {scenario.label}
                                        </span>
                                        {config.previewScenario === scenario.id && (
                                            <Check className="w-3 h-3 text-white ml-auto" />
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </>,
                document.body
            )}
        </>
    );
}
