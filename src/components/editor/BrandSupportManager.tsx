"use client";

import { useEditor } from "@/context/EditorContext";
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { LifeBuoy, ChevronRight } from "lucide-react";
import { useSmartPosition } from "@/hooks/useSmartPosition";

export default function BrandSupportManager() {
    const { config, updateConfig } = useEditor();
    const [isOpen, setIsOpen] = useState(false);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const popupRef = useRef<HTMLDivElement>(null);

    const { top, bottom, left, maxHeight, transformOrigin, isReady } = useSmartPosition(buttonRef, isOpen);

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
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${isOpen ? 'bg-zinc-700 text-white' : 'bg-zinc-800 text-zinc-400 group-hover:text-zinc-300'}`}>
                            <LifeBuoy className="w-4 h-4" />
                        </div>
                        <div className="text-left">
                            <h3 className="text-xs font-semibold text-zinc-300">Support Links</h3>
                            <div className="text-[10px] text-zinc-500 flex items-center gap-1.5 truncate">
                                {config.supportEmail ? 'Email configured' : config.supportUrl ? 'URL configured' : 'Not configured'}
                            </div>
                        </div>
                    </div>
                    <ChevronRight className={`w-4 h-4 text-zinc-500 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                </button>
            </div>

            {isOpen && isReady && createPortal(
                <>
                    {/* Popover Menu */}
                    <div
                        ref={popupRef}
                        className="fixed z-[9999] w-80 bg-[#09090b] border border-zinc-800 rounded-xl shadow-2xl p-4 animate-in fade-in zoom-in-95 duration-200 flex flex-col gap-4"
                        style={{
                            top: top,
                            bottom: bottom,
                            left: left,
                            maxHeight: maxHeight,
                            transformOrigin: transformOrigin
                        }}
                    >
                        <div className="flex items-center justify-between border-b border-zinc-800/50 pb-2 shrink-0">
                            <div className="text-xs font-semibold text-white uppercase tracking-wider">Support Settings</div>
                        </div>

                        <div className="space-y-4 overflow-y-auto custom-scrollbar px-1 pb-1">
                            {/* Support Email */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-tight">Support Email (Optional)</label>
                                <input
                                    type="email"
                                    value={config.supportEmail || ''}
                                    onChange={(e) => updateConfig({ supportEmail: e.target.value })}
                                    placeholder="support@example.com"
                                    className="w-full h-9 px-3 rounded-lg bg-black border border-zinc-800 text-white text-sm placeholder:text-zinc-700 focus:outline-none focus:border-indigo-500 transition-colors"
                                />
                            </div>

                            {/* Support URL */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-tight">Custom Support URL (Optional)</label>
                                <input
                                    type="url"
                                    value={config.supportUrl || ''}
                                    onChange={(e) => updateConfig({ supportUrl: e.target.value })}
                                    placeholder="https://help.example.com"
                                    className="w-full h-9 px-3 rounded-lg bg-black border border-zinc-800 text-white text-sm placeholder:text-zinc-700 focus:outline-none focus:border-indigo-500 transition-colors"
                                />
                                <p className="text-[10px] text-zinc-600 leading-tight">
                                    If set, the "Report Issue" button will link here instead of opening a mailto link.
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
