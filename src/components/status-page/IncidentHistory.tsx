"use client";

import { memo, useState } from "react";
import { CheckCircle2, ChevronDown, ChevronUp, Clock, AlertTriangle, Info } from "lucide-react";
import { ThemeConfig } from "@/lib/themes";
import { getLogReason, formatDuration } from "@/lib/utils";
import { Markdown } from "@/components/ui/markdown";

// Combined type for history items
export interface HistoryItem {
    id: string; // unique key
    type: 'log' | 'update';
    timestamp: number;
    // Log specific
    logType?: number;
    logReason?: any;
    logDuration?: number;
    // Update specific
    isManual?: boolean; // For logs that are manual
    content?: string;
    variant?: 'info' | 'warning' | 'error' | 'success';
}

interface IncidentHistoryProps {
    items: HistoryItem[];
    theme: ThemeConfig;
    monitorName: string;
    brandName?: string;
}

function formatDate(timestamp: number) {
    return new Date(timestamp * 1000).toLocaleString('en-US', {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
}

export const IncidentHistory = memo(({ items, theme, monitorName, brandName }: IncidentHistoryProps) => {
    const [displayCount, setDisplayCount] = useState(10);

    // Sort just in case, though parent should provide sorted
    const sortedItems = [...items].sort((a, b) => b.timestamp - a.timestamp);
    const visibleItems = sortedItems.slice(0, displayCount);
    const hasMore = sortedItems.length > displayCount;

    const handleLoadMore = () => {
        setDisplayCount(prev => prev + 10);
    };

    return (
        <div>
            <h3 className={`text-xs ${theme.mutedText} uppercase tracking-[0.2em] font-bold mb-6 flex items-center gap-2`}>
                <Clock className="w-3 h-3" /> Incident History
            </h3>

            <div className={`relative pl-6 sm:pl-8 border-l border-white/10 space-y-8 sm:space-y-10 py-2 ml-1 sm:ml-0`}>
                {sortedItems.length > 0 ? (
                    <>
                        {visibleItems.map((item) => {
                            // Determine visual properties based on type
                            let colorClass = 'bg-emerald-500';
                            let iconColor = 'text-emerald-400';
                            let title = 'Service Recovered';
                            let isOutage = false;

                            if (item.type === 'log') {
                                isOutage = item.logType === 1;
                                if (isOutage) {
                                    colorClass = 'bg-red-500';
                                    iconColor = 'text-red-400';
                                    title = 'Outage Detected';
                                } else if (item.logType === 99) {
                                    colorClass = 'bg-amber-500';
                                    iconColor = 'text-amber-400';
                                    title = brandName ? `Update from ${brandName}` : 'Manual Update';
                                } else if (item.logType === 98) {
                                    colorClass = 'bg-blue-500';
                                    iconColor = 'text-blue-400';
                                    title = 'Monitoring Started';
                                }
                            } else if (item.type === 'update') {
                                if (item.variant === 'error') {
                                    colorClass = 'bg-red-500';
                                    iconColor = 'text-red-400';
                                } else if (item.variant === 'warning') {
                                    colorClass = 'bg-amber-500';
                                    iconColor = 'text-amber-400';
                                } else if (item.variant === 'info') {
                                    colorClass = 'bg-blue-500';
                                    iconColor = 'text-blue-400';
                                }
                                title = brandName ? `Update from ${brandName}` : 'Manual Update';
                            }

                            return (
                                <div key={item.id} className="relative group ml-0">
                                    <div className={`absolute -left-[31px] sm:-left-[41px] w-3 h-3 sm:w-4 sm:h-4 rounded-full border-[3px] border-zinc-950 ${colorClass} top-1.5 sm:top-0`} />

                                    <div className="flex flex-col gap-1.5">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4">
                                            <div className="flex items-center gap-2">
                                                <span className={`text-sm font-bold ${iconColor} break-words`}>
                                                    {title}
                                                </span>
                                                {(item.type === 'update' || item.isManual) && (
                                                    <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-500/10 font-medium">
                                                        added via statuscode
                                                    </span>
                                                )}
                                            </div>
                                            <span className={`text-[10px] ${theme.mutedText} font-mono border border-white/5 px-1.5 py-0.5 rounded self-start sm:self-auto whitespace-nowrap`}>
                                                {formatDate(item.timestamp)}
                                            </span>
                                        </div>
                                        {/* Monitor Name is redundant if we are in detail view, but useful if mixed history in future */}
                                        {/* <div className="text-sm text-white/90 font-medium">{monitorName}</div> */}

                                        <div className={`text-xs ${theme.mutedText} leading-relaxed`}>
                                            {item.type === 'log' ? (
                                                item.content ? (
                                                    <div className="prose prose-invert max-w-none prose-sm text-white/80">
                                                        <Markdown content={item.content} />
                                                    </div>
                                                ) : isOutage ? (
                                                    <>
                                                        {getLogReason(item.logReason?.code, item.logReason?.detail).reason}
                                                        {getLogReason(item.logReason?.code, item.logReason?.detail).detail ? `. ${getLogReason(item.logReason?.code, item.logReason?.detail).detail}` : ''}
                                                        <span className="block mt-1 opacity-75">
                                                            Lasted for: {formatDuration(item.logDuration || 0)}
                                                        </span>
                                                    </>
                                                ) : (
                                                    `at ${new Date(item.timestamp * 1000).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`
                                                )
                                            ) : (
                                                <div className="prose prose-invert max-w-none prose-sm text-white/80">
                                                    <Markdown content={item.content || ''} />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        {hasMore && (
                            <button
                                onClick={handleLoadMore}
                                className={`flex items-center gap-2 text-xs font-medium ${theme.mutedText} hover:text-white transition-colors mt-4 -ml-4 pl-4`}
                            >
                                <ChevronDown className="w-3 h-3" /> Load More Incidents ({sortedItems.length - displayCount} remaining)
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
});

IncidentHistory.displayName = 'IncidentHistory';
