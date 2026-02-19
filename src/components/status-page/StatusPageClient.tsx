"use client";

import { useState, memo, useEffect, useMemo } from "react";

import { ArrowRight } from "lucide-react";
import { themes, ThemeConfig, colorPresets, StatusColors } from "@/lib/themes";
import { StatusBanner } from "./StatusBanner";
import { MonitorList } from "./MonitorList";
import { IncidentHistory } from "./IncidentHistory";
import { Maintenance } from "./Maintenance";
import { MonitorDetailView } from "./MonitorDetailView";

import { MonitorData, IncidentUpdate, MaintenanceWindow } from "@/lib/types";
import { VisibilityConfig } from "@/context/EditorContext";
import { toDemoStringId } from "@/lib/mockMonitors";

interface RenderLayoutProps {
    layout: string;
    showHistoryOverlay: boolean;
    setShowHistoryOverlay: (show: boolean) => void;
    theme: ThemeConfig;
    colors?: StatusColors;
    header: React.ReactNode;
    maintenanceBanner: React.ReactNode;
    // Data props
    monitors: MonitorData[];
    status: 'operational' | 'partial' | 'major' | 'maintenance' | 'maintenance_partial';
    totalAvgResponse: number;
    // Selection for Detail View
    selectedMonitorId: string | null;
    setSelectedMonitorId: (id: string | null) => void;
    visibility?: VisibilityConfig;
    annotations?: Record<string, IncidentUpdate[]>;
    maintenance?: MaintenanceWindow[];
    brandName?: string;
}

const RenderLayout = memo(({
    layout,
    showHistoryOverlay,
    setShowHistoryOverlay,
    theme: t,
    colors,
    header,
    maintenanceBanner,
    monitors,
    status,
    totalAvgResponse,
    selectedMonitorId,
    setSelectedMonitorId,
    visibility,
    annotations,
    maintenance,
    brandName
}: RenderLayoutProps) => {
    // History is only used in overlay currently to match Editor
    const historyLogs = useMemo(() => {
        if (!monitors.some(m => m.logs && m.logs.length > 0)) return [];

        return monitors.flatMap(m => m.logs?.map((l: any) => ({
            id: `log-${l.datetime}-${l.type}-${m.id}`,
            type: 'log' as const,
            timestamp: l.datetime,
            logType: l.type,
            logReason: l.reason,
            logDuration: l.duration,
            isManual: l.isManual,
            content: l.content,
            monitorName: m.friendly_name
        })) || [])
            .sort((a, b) => b.timestamp - a.timestamp);
    }, [monitors]);



    const scrollToMaintenance = () => {
        const el = document.getElementById('maintenance-view');
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    // Determine active maintenance for the banner click action
    const activeMaintenance = useMemo(() => {
        if (!maintenance || maintenance.length === 0) return null;
        const active = maintenance.filter(m => {
            const start = new Date(m.startTime).getTime();
            const end = start + m.durationMinutes * 60000;
            return end > Date.now();
        }).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())[0];
        return active;
    }, [maintenance]);

    const handleBannerClick = () => {
        if (activeMaintenance && activeMaintenance.monitorId !== 'all') {
            const mId = activeMaintenance.monitorId;
            const monitor = monitors.find(m => String(m.id) === mId || `demo-${Math.abs(m.id)}` === mId);
            if (monitor) {
                setSelectedMonitorId(String(monitor.id));
                window.scrollTo({ top: 0, behavior: 'smooth' });
                return;
            }
        }
        scrollToMaintenance();
    };

    const InteractiveMaintenanceBanner = maintenanceBanner ? (
        <div onClick={handleBannerClick} className="cursor-pointer group">
            {maintenanceBanner}
        </div>
    ) : null;


    const history = (
        <div className="relative">
            <IncidentHistory
                items={historyLogs}
                theme={t}
                monitorName="All Monitors"
                brandName={brandName}
            />
        </div>
    );

    const banner = (
        <StatusBanner
            status={status}
            totalAvgResponse={totalAvgResponse}
            theme={t}
            colors={colors}
            visibility={visibility}
        />
    );

    const monitorsDisplay = (
        <MonitorList
            monitors={monitors}
            setSelectedMonitorId={setSelectedMonitorId}
            theme={t}
            colors={colors}
            visibility={visibility}
            annotations={annotations}
            brandName={brandName}
        />
    );

    const maintenanceView = (
        <Maintenance
            theme={t}
            windows={maintenance}
            monitors={monitors}
            setSelectedMonitorId={setSelectedMonitorId}
        />
    );


    switch (layout) {
        case 'layout1': // Standard (Treat as Stacked)
        case 'layout3': // Stacked + Banner Maint
            return (
                <>
                    {header}
                    {banner}
                    <div className="flex flex-col gap-10 sm:gap-20">
                        {monitorsDisplay}
                        {visibility?.showIncidentHistory !== false && (
                            <div id="maintenance-view" className="scroll-mt-24">
                                {maintenanceView}
                            </div>
                        )}
                    </div>
                </>
            );
        case 'layout2': // Split Middle
            return (
                <>
                    {header}
                    {banner}
                    <div className="flex flex-col gap-10 sm:gap-20">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 sm:gap-16">
                            <div className="lg:col-span-2 space-y-12">
                                {monitorsDisplay}
                            </div>
                            {visibility?.showIncidentHistory !== false && (
                                <div className="lg:col-span-1">
                                    <div id="maintenance-view" className="scroll-mt-24">
                                        {maintenanceView}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            );
        case 'layout4': // Minimal + History Link + Banner Maint
            if (showHistoryOverlay) {
                return (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <button
                            onClick={() => setShowHistoryOverlay(false)}
                            className={`mb-8 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 ${t.rounded} text-sm font-medium text-white transition-all flex items-center gap-2 group`}
                        >
                            <ArrowRight className="w-4 h-4 rotate-180 group-hover:-translate-x-1 transition-transform" />
                            Back to Status
                        </button>
                        {header}
                        <div className="mt-8">
                            {history}
                        </div>
                    </div>
                );
            }
            return (
                <>
                    {InteractiveMaintenanceBanner}
                    {header}
                    {banner}
                    <div className="flex flex-col gap-10 sm:gap-20">
                        {monitorsDisplay}
                        {visibility?.showIncidentHistory !== false && (
                            <div id="maintenance-view" className="scroll-mt-24">
                                {maintenanceView}
                            </div>
                        )}
                    </div>
                </>
            );
        default:
            return null;
    }
});

RenderLayout.displayName = 'RenderLayout';

interface StatusPageClientProps {
    layout: string;
    themeCode: string;
    colorPreset?: string;
    header: React.ReactNode;
    maintenanceBanner: React.ReactNode;
    footer: React.ReactNode;
    subdomain: string;
    initialMonitors: MonitorData[];
    visibility?: VisibilityConfig;
    maintenance?: MaintenanceWindow[];
    brandName?: string;
    annotations?: Record<string, IncidentUpdate[]>;
}

function getAverageResponseTime(times: { value: number }[] = []) {
    if (!times.length) return 0;
    const sum = times.reduce((acc, curr) => acc + curr.value, 0);
    return Math.round(sum / times.length);
}

export default function StatusPageClient({
    layout,
    themeCode,
    colorPreset = 'default',
    header,
    maintenanceBanner,
    footer,
    subdomain,
    initialMonitors,
    visibility,
    maintenance,
    brandName,
    annotations
}: StatusPageClientProps) {
    const [showHistoryOverlay, setShowHistoryOverlay] = useState(false);
    const [selectedMonitorId, setSelectedMonitorId] = useState<string | null>(null);
    const [monitors, setMonitors] = useState<MonitorData[]>(initialMonitors);
    // Initial annotations should ideally be passed from server prop, but defaulting to empty or fetching is ok for now. 
    // Ideally page.tsx should pass it. But let's fetch it or assume empty for initial hydration if prop missing.
    const [fetchedAnnotations, setFetchedAnnotations] = useState<Record<string, IncidentUpdate[]>>({});
    const [updateToDelete, setUpdateToDelete] = useState<string | null>(null);
    const t = themes[themeCode as keyof typeof themes] || themes.modern;

    // Resolve Colors
    const themePresets = colorPresets[themeCode as keyof typeof colorPresets] || colorPresets.modern;
    const activePreset = themePresets.find((p) => p.id === colorPreset) || themePresets[0];
    const colors = activePreset?.colors;

    // Polling Effect
    useEffect(() => {
        if (!subdomain) return;

        const poll = async () => {
            // Avoid polling if hidden
            if (document.hidden) return;

            try {
                const res = await fetch(`/api/status/${subdomain}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.monitors) {
                        setMonitors(data.monitors);
                        if (data.annotations) {
                            const raw = data.annotations;
                            const migrated: Record<string, IncidentUpdate[]> = {};
                            Object.keys(raw).forEach(key => {
                                const val = raw[key];
                                if (Array.isArray(val)) {
                                    migrated[key] = val;
                                } else if (typeof val === 'string') {
                                    migrated[key] = [{
                                        id: 'legacy-' + Date.now(),
                                        content: val,
                                        createdAt: new Date().toISOString()
                                    }];
                                }
                            });
                            setFetchedAnnotations(migrated);
                        }
                    }
                }
            } catch (err) {
                console.error("Status Poll Error:", err);
            }
        };

        // Initial poll after mount (short delay to allow hydration)
        const initialTimer = setTimeout(poll, 1000);

        const interval = setInterval(poll, 30000); // Poll every 30s
        return () => {
            clearTimeout(initialTimer);
            clearInterval(interval);
        };
    }, [subdomain]);

    // Derived State
    const downMonitors = useMemo(() => monitors.filter((m) => m.status === 8 || m.status === 9), [monitors]);
    const maintenanceMonitors = useMemo(() => monitors.filter((m) => m.status === 0), [monitors]);

    const status: 'operational' | 'partial' | 'major' | 'maintenance' | 'maintenance_partial' = useMemo(() => {
        if (downMonitors.length > 0) {
            return downMonitors.length === monitors.length ? 'major' : 'partial';
        }
        if (maintenanceMonitors.length > 0) {
            return maintenanceMonitors.length === monitors.length ? 'maintenance' : 'maintenance_partial';
        }
        return 'operational';
    }, [monitors, downMonitors, maintenanceMonitors]);

    const totalAvgResponse = useMemo(() => Math.round(
        monitors.reduce((acc: number, m) => acc + getAverageResponseTime(m.response_times), 0) / (monitors.length || 1)
    ), [monitors]);

    // --- DETAIL VIEW OVERRIDE ---
    if (selectedMonitorId) {
        const monitor = monitors.find(m => {
            const idStr = m.id < 0 ? toDemoStringId(m.id) : String(m.id);
            return idStr === selectedMonitorId;
        });
        // If monitor not found (e.g. data update removed it), clear selection
        if (!monitor) {
            setSelectedMonitorId(null);
            return null; // Will re-render with updated state
        }

        return (
            <div className={`${t.container} flex flex-col min-h-[90vh]`}>
                <div className="w-full mx-auto px-2 sm:px-6 lg:px-8 py-6 sm:py-12">
                    <MonitorDetailView
                        monitor={monitor}
                        setSelectedMonitorId={setSelectedMonitorId}
                        theme={t}
                        colors={colors}
                        visibility={visibility}
                        updates={(annotations && Object.keys(annotations).length > 0 ? annotations : fetchedAnnotations)?.[monitor.id] || []}
                        maintenance={maintenance}
                        brandName={brandName}
                    />
                </div>
                {!showHistoryOverlay && !selectedMonitorId && footer}
            </div>
        );
    }

    return (
        <div className={`${t.container} flex flex-col min-h-[90vh]`}>
            <RenderLayout
                layout={layout}
                showHistoryOverlay={showHistoryOverlay}
                setShowHistoryOverlay={setShowHistoryOverlay}
                theme={t}
                colors={colors}
                header={header}
                maintenanceBanner={maintenanceBanner}
                monitors={monitors}
                status={status}
                totalAvgResponse={totalAvgResponse}
                selectedMonitorId={selectedMonitorId}
                setSelectedMonitorId={setSelectedMonitorId}
                visibility={visibility}
                maintenance={maintenance || []}
                brandName={brandName}
                annotations={Object.keys(annotations || {}).length > 0 ? annotations : fetchedAnnotations}
            />
            {!showHistoryOverlay && !selectedMonitorId && footer}
        </div>
    );
}
