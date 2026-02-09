"use client";

import { useState } from "react";
import { CheckCircle2, ChevronDown, ChevronUp, Clock } from "lucide-react";
import { ThemeConfig } from "@/lib/themes";

interface Log {
    type: number;
    datetime: number;
    duration: number;
    reason: any;
    monitorName: string;
}

interface IncidentHistoryProps {
    logs: Log[];
    theme: ThemeConfig;
}

export function IncidentHistory({ logs, theme }: IncidentHistoryProps) {
    const [showAll, setShowAll] = useState(false);
    const visibleLogs = showAll ? logs : logs.slice(0, 5);

    function formatDate(timestamp: number) {
        return new Date(timestamp * 1000).toLocaleString('en-US', {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    }

    return (
        <div>
            <h3 className={`text-xs ${theme.mutedText} uppercase tracking-[0.2em] font-bold mb-6 flex items-center gap-2`}>
                <Clock className="w-3 h-3" /> Incident History
            </h3>

            <div className={`relative pl-8 border-l border-white/10 space-y-10 py-2`}>
                {logs.length > 0 ? (
                    <>
                        {visibleLogs.map((log, i) => (
                            <div key={i} className="relative group">
                                <div className={`absolute -left-[41px] w-4 h-4 rounded-full border-[3px] border-zinc-950 ${log.type === 1 ? 'bg-red-500' : 'bg-emerald-500'}`} />

                                <div className="flex flex-col gap-1.5">
                                    <div className="flex items-center justify-between">
                                        <span className={`text-sm font-bold ${log.type === 1 ? 'text-red-400' : 'text-emerald-400'}`}>
                                            {log.type === 1 ? 'Outage Detected' : 'Resolved'}
                                        </span>
                                        <span className={`text-[10px] ${theme.mutedText} font-mono border border-white/5 px-1.5 py-0.5 rounded`}>
                                            {formatDate(log.datetime)}
                                        </span>
                                    </div>
                                    <div className="text-sm text-white/90 font-medium">
                                        {log.monitorName}
                                    </div>
                                    <p className={`text-xs ${theme.mutedText} leading-relaxed`}>
                                        {log.type === 1
                                            ? `Service unavailable. Error code: ${log.reason.code || 'TIMEOUT'}.`
                                            : `Service recovered after ${Math.round(log.duration / 60)}m.`}
                                    </p>
                                </div>
                            </div>
                        ))}

                        {logs.length > 5 && (
                            <button
                                onClick={() => setShowAll(!showAll)}
                                className={`flex items-center gap-2 text-xs font-medium ${theme.mutedText} hover:text-white transition-colors mt-4 -ml-4 pl-4`}
                            >
                                {showAll ? (
                                    <>
                                        <ChevronUp className="w-3 h-3" /> Show Less
                                    </>
                                ) : (
                                    <>
                                        <ChevronDown className="w-3 h-3" /> Show {logs.length - 5} More Incidents
                                    </>
                                )}
                            </button>
                        )}
                    </>
                ) : (
                    <div className={`p-6 text-center ${theme.card} ${theme.rounded} border-dashed`}>
                        <div className="w-10 h-10 mx-auto rounded-full bg-white/5 flex items-center justify-center mb-3">
                            <CheckCircle2 className="w-5 h-5 text-emerald-500/50" />
                        </div>
                        <p className="text-sm text-white/60">No incidents in the last 30 days.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
