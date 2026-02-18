"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useEditor, Layout } from "@/context/EditorContext";
import { Check, ChevronRight, LayoutDashboard } from "lucide-react";
import { useSmartPosition } from "@/hooks/useSmartPosition";

const layouts: { id: Layout; name: string; description: string; preview: React.ReactNode }[] = [
    {
        id: 'layout3',
        name: 'Stacked',
        description: 'Vertical stack with top banner.',
        preview: (
            <div className="flex flex-col gap-1 w-full h-12 p-1 border border-zinc-800 rounded bg-zinc-950/50">
                <div className="w-full h-1 bg-indigo-500/20 rounded-sm mb-0.5" />
                <div className="h-1.5 w-1/3 bg-zinc-800 rounded-sm mb-0.5" />
                <div className="h-2 w-full bg-zinc-800 rounded-sm" />
                <div className="h-2 w-full bg-zinc-800 rounded-sm" />
                <div className="mt-auto h-2 w-full bg-zinc-800 rounded-sm" />
            </div>
        )
    },
    {
        id: 'layout2',
        name: 'Split Middle',
        description: 'Side-by-side monitors & maintenance.',
        preview: (
            <div className="flex flex-col gap-1 w-full h-12 p-1 border border-zinc-800 rounded bg-zinc-950/50">
                <div className="h-1.5 w-1/3 bg-zinc-800 rounded-sm mb-0.5" />
                <div className="h-2 w-full bg-zinc-800 rounded-sm" />
                <div className="flex gap-1 h-4">
                    <div className="w-2/3 bg-zinc-800 rounded-sm" />
                    <div className="flex-1 bg-zinc-800 rounded-sm" />
                </div>
                <div className="mt-auto h-2 w-full bg-zinc-800 rounded-sm" />
            </div>
        )
    },
    {
        id: 'layout4',
        name: 'Minimal',
        description: 'Top banner + history focus.',
        preview: (
            <div className="flex flex-col gap-1 w-full h-12 p-1 border border-zinc-800 rounded bg-zinc-950/50">
                <div className="w-full h-1 bg-indigo-500/20 rounded-sm mb-0.5" />
                <div className="h-1.5 w-1/3 bg-zinc-800 rounded-sm mb-0.5" />
                <div className="h-2 w-full bg-zinc-800 rounded-sm" />
                <div className="h-3 w-full bg-zinc-800 rounded-sm" />
                <div className="mt-auto h-2 w-full bg-zinc-700/50 border border-zinc-700 rounded-sm flex items-center justify-center">
                    <div className="w-8 h-0.5 bg-zinc-600 rounded-full" />
                </div>
            </div>
        )
    }
];

export default function LayoutSelector() {
    const { config, updateConfig } = useEditor();
    const [isOpen, setIsOpen] = useState(false);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const popupRef = useRef<HTMLDivElement>(null);

    const { top, bottom, left, maxHeight, transformOrigin, isReady } = useSmartPosition(buttonRef, isOpen);

    const activeLayout = layouts.find(l => l.id === config.layout) || layouts[0];

    const toggleOpen = () => setIsOpen(!isOpen);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                isOpen &&
                popupRef.current &&
                !popupRef.current.contains(event.target as Node) &&
                buttonRef.current &&
                !buttonRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
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
                    <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${isOpen ? 'bg-zinc-700 text-white' : 'bg-zinc-800 text-zinc-400 group-hover:text-zinc-300'}`}>
                            <LayoutDashboard className="w-4 h-4" />
                        </div>
                        <div className="text-left">
                            <h3 className="text-xs font-semibold text-zinc-300">Layout</h3>
                            <div className="text-[10px] text-zinc-500">
                                {activeLayout.name}
                            </div>
                        </div>
                    </div>
                    <ChevronRight className={`w-4 h-4 text-zinc-500 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                </button>
            </div>

            {isOpen && isReady && createPortal(
                <>
                    {/* Backdrop */}

                    {/* Popover Menu */}
                    <div
                        ref={popupRef}
                        className="fixed z-[9999] w-72 bg-[#09090b] border border-zinc-800 rounded-xl shadow-2xl p-2 animate-in fade-in zoom-in-95 duration-200 flex flex-col"
                        style={{
                            top: top,
                            bottom: bottom,
                            left: left,
                            maxHeight: maxHeight,
                            transformOrigin: transformOrigin
                        }}
                    >
                        <div className="px-2 py-1.5 mb-2 border-b border-zinc-800/50 shrink-0">
                            <div className="text-xs font-semibold text-white">Select Layout</div>
                        </div>
                        <div className="space-y-1 grid grid-cols-1 gap-1 overflow-y-auto px-1">
                            {layouts.map((layout) => (
                                <button
                                    key={layout.id}
                                    onClick={() => updateConfig({ layout: layout.id })}
                                    className={`w-full group relative p-2 rounded-lg border text-left transition-all ${config.layout === layout.id
                                        ? 'bg-zinc-900 border-zinc-700'
                                        : 'bg-transparent border-transparent hover:bg-zinc-900/50'
                                        }`}
                                >
                                    <div className="mb-2 opacity-80 group-hover:opacity-100 transition-opacity">
                                        {layout.preview}
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className={`text-xs font-medium ${config.layout === layout.id ? 'text-white' : 'text-zinc-400 group-hover:text-zinc-300'}`}>
                                                {layout.name}
                                            </div>
                                            <div className="text-[10px] text-zinc-600 leading-tight">{layout.description}</div>
                                        </div>
                                        {config.layout === layout.id && (
                                            <div className="bg-white text-black rounded-full p-0.5">
                                                <Check className="w-2.5 h-2.5" />
                                            </div>
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
