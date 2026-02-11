"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useEditor } from "@/context/EditorContext";
import { colorPresets, ColorPreset } from "@/lib/themes";
import { Check, ChevronRight, PaintBucket } from "lucide-react";
import { classNames } from "@/lib/utils";

export default function ColorPresetSelector() {
    const { config, updateConfig } = useEditor();
    const [isOpen, setIsOpen] = useState(false);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const [position, setPosition] = useState({ top: 0, left: 0 });

    // Get presets for current theme
    const activePresets = colorPresets[config.theme] || [];
    const activePreset = activePresets.find(p => p.id === config.colorPreset) || activePresets[0];

    // Helper to get preview colors (parsing the long string is hard, so we just use the first color class)
    // Actually, we can just hardcode specific hexes for preview or try to extract from class string.
    // Easier: The preset object matches the keys.
    // Let's use a simple dot system.

    // We'll trust the preset ID/Name for now, and maybe show 4 small dots representing the palette.

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

    // Close on scroll or resize
    useEffect(() => {
        const handleScroll = () => setIsOpen(false);
        window.addEventListener('scroll', handleScroll, true);
        window.addEventListener('resize', handleScroll);
        return () => {
            window.removeEventListener('scroll', handleScroll, true);
            window.removeEventListener('resize', handleScroll);
        };
    }, []);

    // Helper to extract a bg color from class string for preview
    // e.g. "bg-emerald-500/10 ..." -> "bg-emerald-500"
    const getPreviewClass = (fullClass: string) => {
        const match = fullClass.match(/bg-([a-z]+)-500/);
        if (match) return `bg-${match[1]}-500`;
        const textMatch = fullClass.match(/text-([a-z]+)-500/);
        if (textMatch) return `bg-${textMatch[1]}-500`;
        return 'bg-zinc-500';
    };

    // Better preview: just use the raw colors from the class string?
    // "bg-emerald-500/10"
    // Let's simpler approach: Mapping preset ID to a hex color for the main dot?
    // No, dynamic is better.
    // Let's try to extract the base color name and map it to a hex or standard Tailwind class.

    const PalettePreview = ({ preset }: { preset: ColorPreset }) => {
        // Extract main color from 'operational'
        // format: "bg-emerald-500/10" or "text-emerald-500"
        let mainColor = "bg-zinc-500";
        let subColor = "bg-zinc-700";

        // Regex to find "bg-{color}-500" or "text-{color}-500"
        // We look for color names between '-' and '-'.
        const opColor = preset.colors.operational;
        const mainMatch = opColor.match(/(?:bg|text)-([a-z]+)(?:-\d+)?/);

        if (mainMatch) {
            // Reconstruct a simplified class for the dot
            // e.g. "emerald" -> "bg-emerald-500"
            const colorName = mainMatch[1];
            mainColor = `bg-${colorName}-500`;

            // Try to find a secondary color from 'partial'?
            const partialColor = preset.colors.partial;
            const subMatch = partialColor.match(/(?:bg|text)-([a-z]+)(?:-\d+)?/);
            if (subMatch) {
                subColor = `bg-${subMatch[1]}-500`;
            }
        }

        // Tailwind JIT might not pick these up if dynamic.
        // But since we are using standard colors, maybe just use style={{ backgroundColor: ... }}?
        // No, we don't have the hex map handy in this file (it's implicit in Tailwind).
        // Let's use the actual `name` to guess?
        // Actually, for the *sidebar preview*, small dots using the classes from the preset string (e.g. bg-emerald-500) 
        // will work IF those classes are in the preset string itself!
        // The preset strings have `bg-emerald-500/10`. We need `bg-emerald-500`.
        // If `bg-emerald-500` isn't used elsewhere, JIT prunes it. 
        // `bg-emerald-500/10` is NOT `bg-emerald-500` + opacity. It's a unique class.

        // fallback: use hardcoded styles or just circles with the actual class but w/o /10?
        // If I use `className={preset.colors.operational.split(' ')[0]}` it might be `bg-emerald-500/10`.
        // That's very faint for a dot.

        // Solution: Just show the names. Or simple colored squares using generic hexes?
        // I'll trust standard colors are available or just use inline styles with a small map.

        const colorMap: Record<string, string> = {
            emerald: '#10b981', green: '#22c55e', lime: '#84cc16', teal: '#14b8a6',
            cyan: '#06b6d4', sky: '#0ea5e9', blue: '#3b82f6', indigo: '#6366f1',
            violet: '#8b5cf6', purple: '#a855f7', fuchsia: '#d946ef', pink: '#ec4899',
            rose: '#f43f5e', red: '#ef4444', orange: '#f97316', amber: '#f59e0b',
            yellow: '#eab308', zinc: '#71717a', slate: '#64748b', stone: '#78716c',
            white: '#ffffff', black: '#000000'
        };

        const getColorHex = (str: string) => {
            for (const [name, hex] of Object.entries(colorMap)) {
                if (str.includes(name)) return hex;
            }
            return '#71717a';
        };

        return (
            <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getColorHex(preset.colors.operational) }} />
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getColorHex(preset.colors.partial) }} />
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getColorHex(preset.colors.maintenance) }} />
            </div>
        );
    };

    if (activePresets.length === 0) return null;

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
                            <PaintBucket className="w-4 h-4" />
                        </div>
                        <div className="text-left">
                            <h3 className="text-xs font-semibold text-zinc-300">Colors</h3>
                            <div className="text-[10px] text-zinc-500 flex items-center gap-1.5">
                                {activePreset.name}
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
                        className="fixed z-[9999] w-72 bg-[#09090b] border border-zinc-800 rounded-xl shadow-2xl p-2 animate-in fade-in zoom-in-95 duration-200"
                        style={{
                            top: Math.min(position.top, window.innerHeight - 300),
                            left: position.left,
                        }}
                    >
                        <div className="px-2 py-1.5 mb-2 border-b border-zinc-800/50">
                            <div className="text-xs font-semibold text-white">Select Colors</div>
                        </div>
                        <div className="space-y-1">
                            {activePresets.map((preset) => (
                                <button
                                    key={preset.id}
                                    onClick={() => updateConfig({ colorPreset: preset.id })}
                                    className={`w-full group relative p-3 rounded-lg border text-left transition-all ${config.colorPreset === preset.id
                                        ? 'bg-zinc-900 border-zinc-700'
                                        : 'bg-transparent border-transparent hover:bg-zinc-900/50'
                                        }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className={`text-sm font-medium mb-1 ${config.colorPreset === preset.id ? 'text-white' : 'text-zinc-400 group-hover:text-zinc-300'}`}>
                                                {preset.name}
                                            </div>
                                            <PalettePreview preset={preset} />
                                        </div>
                                        {config.colorPreset === preset.id && (
                                            <div className="bg-white text-black rounded-full p-0.5">
                                                <Check className="w-3 h-3" />
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
