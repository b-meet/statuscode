"use client";

import { useEditor } from "@/context/EditorContext";
import { UploadCloud } from "lucide-react";

export default function BrandSettings() {
    const { config, updateConfig } = useEditor();

    return (
        <div className="space-y-4">
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Brand Configuration</h3>

            {/* Brand Name Input */}
            <div className="space-y-1.5">
                <label className="text-xs text-zinc-500">Brand Name</label>
                <input
                    type="text"
                    value={config.brandName}
                    onChange={(e) => updateConfig({ brandName: e.target.value })}
                    placeholder="e.g. Acme Corp"
                    className="w-full h-9 px-3 rounded-lg bg-black border border-zinc-800 text-white text-sm placeholder:text-zinc-700 focus:outline-none focus:border-zinc-700 transition-colors"
                />
            </div>

            {/* Logo Input (Placeholder for now) */}
            <div className="space-y-1.5">
                <label className="text-xs text-zinc-500">Logo</label>
                <div className="relative">
                    <input
                        type="text"
                        value={config.logoUrl}
                        onChange={(e) => updateConfig({ logoUrl: e.target.value })}
                        placeholder="https://..."
                        className="w-full h-9 pl-3 pr-9 rounded-lg bg-black border border-zinc-800 text-white text-sm placeholder:text-zinc-700 focus:outline-none focus:border-zinc-700 transition-colors"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-600">
                        <UploadCloud className="w-4 h-4" />
                    </div>
                </div>
                <p className="text-[10px] text-zinc-600">Enter a URL for your logo or upload (soon).</p>
            </div>
        </div>
    );
}
