"use client";

import { useEditor } from "@/context/EditorContext";
import { useState } from "react";
import { Loader2, Plus, CheckCircle2, XCircle, AlertCircle } from "lucide-react";

interface Monitor {
    id: number;
    friendly_name: string;
    url: string;
    status: number; // 2=up, 8=seems down, 9=down
}

export default function MonitorManager() {
    const { config, updateConfig, monitorsData, fetchMonitors, loading: globalLoading } = useEditor();
    const [fetching, setFetching] = useState(false);
    const [error, setError] = useState("");

    const handleFetch = async () => {
        if (!config.apiKey) {
            setError("Please enter an API Key first.");
            return;
        }

        setFetching(true);
        setError("");

        try {
            await fetchMonitors();
        } catch (err: any) {
            setError(err.message);
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

    return (
        <div className="space-y-4">
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Monitors</h3>

            {/* API Key Input */}
            <div className="space-y-1.5">
                <label className="text-xs text-zinc-500">UptimeRobot API Key</label>
                <div className="flex gap-2">
                    <input
                        type="password"
                        value={config.apiKey}
                        onChange={(e) => updateConfig({ apiKey: e.target.value })}
                        placeholder="u12345-..."
                        disabled={globalLoading}
                        className="flex-1 min-w-0 h-9 px-3 rounded-lg bg-black border border-zinc-800 text-white text-sm placeholder:text-zinc-700 focus:outline-none focus:border-zinc-700 transition-colors font-mono disabled:opacity-50"
                    />
                    <button
                        onClick={handleFetch}
                        disabled={fetching || globalLoading || !config.apiKey}
                        className="px-3 h-9 bg-white text-black rounded-lg text-xs font-medium hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {fetching ? <Loader2 className="w-4 h-4 animate-spin" /> : "Fetch"}
                    </button>
                </div>
                {globalLoading && <p className="text-[10px] text-zinc-500 animate-pulse">Loading settings...</p>}
                {error && <p className="text-[10px] text-red-500">{error}</p>}
            </div>

            {/* Monitor List */}
            {monitorsData && monitorsData.length > 0 ? (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                    {monitorsData.map((monitor: Monitor) => {
                        const isSelected = config.monitors.includes(String(monitor.id));
                        return (
                            <button
                                key={monitor.id}
                                onClick={() => toggleMonitor(String(monitor.id))}
                                className={`w-full text-left p-2.5 rounded-lg border flex items-center justify-between transition-all ${isSelected
                                    ? 'bg-zinc-900 border-zinc-700'
                                    : 'bg-black border-zinc-800 hover:border-zinc-700'
                                    }`}
                            >
                                <div className="flex items-center gap-2 overflow-hidden">
                                    <div className={`w-2 h-2 rounded-full shrink-0 ${monitor.status === 2 ? 'bg-green-500' :
                                        monitor.status === 8 || monitor.status === 9 ? 'bg-red-500' : 'bg-zinc-500'
                                        }`} />
                                    <span className="text-xs text-zinc-300 truncate">{monitor.friendly_name}</span>
                                </div>
                                {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500" />}
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
    );
}
