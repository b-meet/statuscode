"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useEditor, Theme } from "@/context/EditorContext";
import { Check, ChevronRight, Palette } from "lucide-react";

const themes: { id: Theme; name: string; description: string; color: string }[] = [
    { id: 'modern', name: 'Modern', description: 'Clean, professional, and trustworthy.', color: '#6366f1' },
    { id: 'minimal', name: 'Minimal', description: 'Strip away the noise. Focus on status.', color: '#18181b' },
    { id: 'brutal', name: 'Brutal', description: 'High contrast. Bold typography.', color: '#ef4444' },
];

export default function ThemeSelector() {
    const { config, updateConfig } = useEditor();
    const [isOpen, setIsOpen] = useState(false);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const popupRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({ top: 0, left: 0 });

    const activeTheme = themes.find(t => t.id === config.theme) || themes[0];

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

    useEffect(() => {
        const handleResize = () => setIsOpen(false);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

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
                            <Palette className="w-4 h-4" />
                        </div>
                        <div className="text-left">
                            <h3 className="text-xs font-semibold text-zinc-300">Theme</h3>
                            <div className="text-[10px] text-zinc-500 flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full shrink-0 ring-1 ring-white/20" style={{ backgroundColor: activeTheme.color }} />
                                <span className="truncate">{activeTheme.name}</span>
                            </div>
                        </div>
                    </div>
                    <ChevronRight className={`w-4 h-4 text-zinc-500 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                </button>
            </div>

            {isOpen && createPortal(
                <>
                    {/* Backdrop */}

                    {/* Popover Menu */}
                    <div
                        ref={popupRef}
                        className="fixed z-[9999] w-72 bg-[#09090b] border border-zinc-800 rounded-xl shadow-2xl p-2 animate-in fade-in zoom-in-95 duration-200"
                        style={{
                            top: Math.min(position.top, window.innerHeight - 300), // Prevent overflow bottom
                            left: position.left,
                        }}
                    >
                        <div className="px-2 py-1.5 mb-2 border-b border-zinc-800/50">
                            <div className="text-xs font-semibold text-white">Select Theme</div>
                        </div>
                        <div className="space-y-1">
                            {themes.map((theme) => (
                                <button
                                    key={theme.id}
                                    onClick={() => {
                                        updateConfig({ theme: theme.id, primaryColor: theme.color });
                                        // Optional: Keep open or close? Providing instant feedback, so leaving open is okay, but closing feels more like a menu.
                                        // Let's keep it open for quick comparison.
                                    }}
                                    className={`w-full group relative p-3 rounded-lg border text-left transition-all ${config.theme === theme.id
                                        ? 'bg-zinc-900 border-zinc-700'
                                        : 'bg-transparent border-transparent hover:bg-zinc-900/50'
                                        }`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <div className={`text-sm font-medium mb-0.5 ${config.theme === theme.id ? 'text-white' : 'text-zinc-400 group-hover:text-zinc-300'}`}>
                                                {theme.name}
                                            </div>
                                            <div className="text-[10px] text-zinc-500 leading-tight">{theme.description}</div>
                                        </div>
                                        {config.theme === theme.id && (
                                            <div className="bg-white text-black rounded-full p-0.5">
                                                <Check className="w-3 h-3" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Color Preview Dot */}
                                    <div
                                        className="absolute bottom-3 right-3 w-1.5 h-1.5 rounded-full ring-1 ring-white/20"
                                        style={{ backgroundColor: theme.color }}
                                    />
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
