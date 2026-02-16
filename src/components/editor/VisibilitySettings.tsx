"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useEditor } from "@/context/EditorContext";
import { Eye, BarChart2, Activity, History, Gauge, ChevronRight, Check } from "lucide-react";

export default function VisibilitySettings() {
    const { config, updateConfig } = useEditor();
    const [isOpen, setIsOpen] = useState(false);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const [position, setPosition] = useState({ top: 0, left: 0 });

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
        const handleScroll = () => setIsOpen(false);
        window.addEventListener('scroll', handleScroll, true);
        window.addEventListener('resize', handleScroll);
        return () => {
            window.removeEventListener('scroll', handleScroll, true);
            window.removeEventListener('resize', handleScroll);
        };
    }, []);

    const toggles = [
        {
            id: 'showSparklines',
            label: 'Response Time Graphs',
            description: 'Show sparklines for monitors',
            icon: BarChart2
        },
        {
            id: 'showUptimeBars',
            label: '90-Day Uptime Bars',
            description: 'Show daily status history',
            icon: Activity
        },
        {
            id: 'showIncidentHistory',
            label: 'Incident History',
            description: 'Show past incidents',
            icon: History
        },
        {
            id: 'showPerformanceMetrics',
            label: 'Performance Metrics',
            description: 'Show avg response time stats',
            icon: Gauge
        }
    ];

    const handleToggle = (id: string, value: boolean) => {
        updateConfig({
            visibility: {
                ...config.visibility,
                [id]: value
            }
        });
    };

    // Count currently enabled items for the button label
    const enabledCount = Object.values(config.visibility).filter(Boolean).length;

    return (
        <>
            <div className="space-y-3">
                <button
                    ref={buttonRef}
                    onClick={toggleOpen}
                    className={`w-full flex items-center justify-between group p-2 -ml-2 rounded-lg transition-colors ${isOpen ? 'bg-zinc-800' : 'hover:bg-zinc-800/50'}`}
                >
                    <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${isOpen ? 'bg-zinc-700 text-white' : 'bg-zinc-800 text-zinc-400 group-hover:text-zinc-300'}`}>
                            <Eye className="w-4 h-4" />
                        </div>
                        <div className="text-left">
                            <h3 className="text-xs font-semibold text-zinc-300">Visibility</h3>
                            <div className="text-[10px] text-zinc-500">
                                {enabledCount} items visible
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
                        className="fixed z-[9999] w-72 bg-[#09090b] border border-zinc-800 rounded-xl shadow-2xl p-2 animate-in fade-in zoom-in-95 duration-200"
                        style={{
                            top: Math.min(position.top, window.innerHeight - 350),
                            left: position.left,
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="px-2 py-1.5 mb-2 border-b border-zinc-800/50">
                            <div className="text-xs font-semibold text-white">Visibility Controls</div>
                            <p className="text-[10px] text-zinc-500 mt-0.5">
                                Toggle visible elements on your status page.
                            </p>
                        </div>
                        <div className="space-y-1">
                            {toggles.map((item) => {
                                const Icon = item.icon;
                                const isVisible = config.visibility[item.id as keyof typeof config.visibility];

                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => handleToggle(item.id, !isVisible)}
                                        className={`w-full group relative p-2.5 rounded-lg border text-left transition-all ${isVisible
                                            ? 'bg-zinc-900 border-zinc-700'
                                            : 'bg-transparent border-transparent hover:bg-zinc-900/50'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`p-1.5 rounded-md ${isVisible ? 'bg-indigo-500/10 text-indigo-400' : 'bg-zinc-800 text-zinc-500 group-hover:text-zinc-400'}`}>
                                                <Icon className="w-3.5 h-3.5" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className={`text-xs font-medium ${isVisible ? 'text-white' : 'text-zinc-500 group-hover:text-zinc-300'}`}>
                                                    {item.label}
                                                </div>
                                                <div className="text-[9px] text-zinc-600 leading-tight mt-0.5 truncate">
                                                    {item.description}
                                                </div>
                                            </div>
                                            {isVisible && (
                                                <div className="bg-indigo-500 text-white rounded-full p-0.5">
                                                    <Check className="w-2.5 h-2.5" />
                                                </div>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        <div className="mt-2 p-2 rounded-lg bg-indigo-500/5 border border-indigo-500/10">
                            <div className="flex gap-2">
                                <Eye className="w-3 h-3 text-indigo-400 shrink-0 mt-0.5" />
                                <p className="text-[9px] text-zinc-500 leading-relaxed">
                                    Refresh or <span className="text-indigo-400 font-medium">Publish</span> to see changes live.
                                </p>
                            </div>
                        </div>
                    </div>
                </>,
                document.body
            )}
        </>
    );
}
