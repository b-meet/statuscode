"use client";

import { useEditor, Theme } from "@/context/EditorContext";
import { Check } from "lucide-react";

const themes: { id: Theme; name: string; description: string; color: string }[] = [
    { id: 'modern', name: 'Modern', description: 'Clean, professional, and trustworthy.', color: '#6366f1' },
    { id: 'minimal', name: 'Minimal', description: 'Strip away the noise. Focus on status.', color: '#18181b' },
    { id: 'brutal', name: 'Brutal', description: 'High contrast. Bold typography.', color: '#ef4444' },
];

export default function ThemeSelector() {
    const { config, updateConfig } = useEditor();

    return (
        <div className="space-y-4">
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Theme & Style</h3>

            <div className="grid grid-cols-1 gap-3">
                {themes.map((theme) => (
                    <button
                        key={theme.id}
                        onClick={() => updateConfig({ theme: theme.id, primaryColor: theme.color })}
                        className={`group relative p-3 rounded-xl border text-left transition-all ${config.theme === theme.id
                                ? 'bg-zinc-900 border-white ring-1 ring-white/20'
                                : 'bg-black border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/50'
                            }`}
                    >
                        <div className="flex items-start justify-between">
                            <div>
                                <div className="text-sm font-medium text-white mb-1">{theme.name}</div>
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
                            className="absolute bottom-3 right-3 w-2 h-2 rounded-full"
                            style={{ backgroundColor: theme.color }}
                        />
                    </button>
                ))}
            </div>

            {/* Custom Color Input */}
            <div className="space-y-1.5 pt-2">
                <label className="text-xs text-zinc-500">Accent Color</label>
                <div className="flex items-center gap-2">
                    <input
                        type="color"
                        value={config.primaryColor}
                        onChange={(e) => updateConfig({ primaryColor: e.target.value })}
                        className="w-8 h-8 rounded-lg bg-transparent cursor-pointer"
                    />
                    <input
                        type="text"
                        value={config.primaryColor}
                        onChange={(e) => updateConfig({ primaryColor: e.target.value })}
                        className="flex-1 h-8 px-3 rounded-lg bg-black border border-zinc-800 text-white text-xs font-mono placeholder:text-zinc-700 focus:outline-none focus:border-zinc-700 transition-colors uppercase"
                    />
                </div>
            </div>
        </div>
    );
}
