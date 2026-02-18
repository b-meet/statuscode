import React, { memo } from 'react';
import { Activity, ArrowRight } from 'lucide-react';
import { ThemeConfig } from '@/lib/themes';
import { classNames } from '@/lib/utils';
import { useEditor } from '@/context/EditorContext';
import { Markdown } from '@/components/ui/markdown';
import { MonitorData } from '@/lib/types';
import { toDemoStringId } from '@/lib/mockMonitors';

interface EditorMaintenanceProps {
    showDummyData: boolean;
    theme: ThemeConfig;
    monitors?: MonitorData[];
    setSelectedMonitorId?: (id: string | null) => void;
}

export const EditorMaintenance = memo(({ showDummyData, theme: t, monitors = [], setSelectedMonitorId }: EditorMaintenanceProps) => {
    const { config } = useEditor();

    const maintenanceList = config.maintenance || [];
    const activeWindows = maintenanceList.filter(m => {
        const start = new Date(m.startTime).getTime();
        const end = start + m.durationMinutes * 60000;
        const now = Date.now();
        // Show if active OR upcoming within 24 hours
        return end > now;
    }).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

    const isMaintenanceActive = showDummyData || config.previewScenario === 'heavy_incidents' || activeWindows.length > 0;

    const firstWindow = activeWindows[0];
    const isAmber = (firstWindow && firstWindow.monitorId !== 'all');

    // Resolve monitor name
    let contextText = '';
    let monitor: MonitorData | undefined;

    if (firstWindow) {
        monitor = monitors.find(m => String(m.id) === firstWindow.monitorId || toDemoStringId(m.id) === firstWindow.monitorId);
        contextText = monitor ? `for ${monitor.friendly_name}` : (firstWindow.monitorId === 'all' ? 'System-wide' : '');
    } else if (isAmber) {
        contextText = 'Partial Outage';
    }

    // Derived values for the display
    const activeColor = isAmber ? 'text-amber-400' : 'text-indigo-400';
    const activeBg = isAmber ? 'bg-amber-500/20' : 'bg-indigo-500/20';
    const activeBorder = isAmber ? 'border-amber-500/20' : 'border-indigo-500/20';
    const activeBorderL = isAmber ? 'border-l-amber-500' : 'border-l-indigo-500';

    const displayTitle = firstWindow ? firstWindow.title : (isAmber ? 'Partial System Maintenance' : 'System-wide Maintenance');
    const displayDesc = firstWindow ? (firstWindow.description || "Scheduled maintenance is currently in progress.") : (isAmber ? "Some systems are currently under maintenance." : "Scheduled updates to the cluster.");
    const displayDate = firstWindow ? new Date(firstWindow.startTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' }) : "Oct 24";
    const statusLabel = firstWindow ? (new Date(firstWindow.startTime) > new Date() ? 'UPCOMING' : 'IN PROGRESS') : (isAmber ? 'PARTIAL OUTAGE' : 'UPCOMING');

    return (
        <div>
            <h3 className={classNames(
                "text-xs uppercase tracking-[0.2em] font-bold mb-6 flex items-center gap-2",
                t.mutedText
            )}>
                <Activity className={`w-3 h-3 ${activeColor}`} /> Planned Maintenance
            </h3>
            {isMaintenanceActive ? (
                <div
                    onClick={() => {
                        if (monitor && setSelectedMonitorId) {
                            setSelectedMonitorId(String(monitor.id));
                            // In editor, scrolling might be handled differently or we just select it
                        }
                    }}
                    className={classNames(
                        "p-8 border-l-4 relative group transition-all",
                        monitor && setSelectedMonitorId ? "cursor-pointer hover:bg-white/5" : "",
                        activeBorderL,
                        t.card,
                        t.rounded
                    )}>
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${activeBg} ${activeColor} border ${activeBorder}`}>
                                {statusLabel}
                            </span>
                            {contextText && (
                                <span className="text-[10px] text-white/40 font-mono border border-white/5 px-1.5 py-0.5 rounded">
                                    {contextText}
                                </span>
                            )}
                        </div>
                        <span className="text-xs text-white/50 font-mono">{displayDate}</span>
                    </div>
                    <h4 className="font-medium text-white text-sm flex items-center gap-2">
                        {displayTitle}
                    </h4>
                    <div className={classNames("text-xs mt-2 leading-relaxed", t.mutedText)}>
                        <Markdown content={displayDesc} />
                    </div>

                    {monitor && setSelectedMonitorId && (
                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <ArrowRight className="w-4 h-4 text-white/30" />
                        </div>
                    )}
                </div>
            ) : (
                <div className={classNames(
                    "p-8 text-center border border-dashed border-white/10",
                    t.card,
                    t.rounded
                )}>
                    <Activity className="w-6 h-6 text-white/20 mx-auto mb-4" />
                    <h4 className="text-sm font-medium text-white/80">All Systems Go</h4>
                </div>
            )}
        </div>
    );
});

EditorMaintenance.displayName = 'EditorMaintenance';
