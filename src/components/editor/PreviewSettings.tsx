"use client";

import { useEditor } from "@/context/EditorContext";
import { Sparkles } from "lucide-react";

export default function PreviewSettings() {
    const { config, updateConfig } = useEditor();

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Preview Controls</label>
            </div>

            {/* Example Data Toggle */}
            <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-indigo-400" />
                        <span className="text-sm font-medium text-zinc-200">Example Data</span>
                    </div>
                    <button
                        onClick={() => updateConfig({ showDummyData: !config.showDummyData })}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-zinc-900 ${config.showDummyData ? 'bg-indigo-500' : 'bg-zinc-700'
                            }`}
                    >
                        <span
                            className={`${config.showDummyData ? 'translate-x-5' : 'translate-x-1'
                                } inline-block h-3 w-3 transform rounded-full bg-white transition-transform`}
                        />
                    </button>
                </div>
                <p className="text-xs text-zinc-500">
                    Injects fake incidents and maintenance schedules to visualize rich states.
                </p>
            </div>


        </div>
    );
}
