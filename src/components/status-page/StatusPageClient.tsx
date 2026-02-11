"use client";

import { useState, memo, useEffect, useMemo } from "react";
import { Clock, ArrowRight } from "lucide-react";
import { themes, ThemeConfig } from "@/lib/themes";
import { StatusBanner } from "./StatusBanner";
import { MonitorList } from "./MonitorList";
import { IncidentHistory } from "./IncidentHistory";
import { Maintenance } from "./Maintenance";
import { MonitorDetailView } from "./MonitorDetailView";

// --- Types ---
export interface MonitorData {
    id: number;
    friendly_name: string;
    url: string;
    status: number;
    custom_uptime_ratio: string;
    response_times?: { datetime: number; value: number }[];
    logs?: { type: number; datetime: number; duration: number; reason: any }[];
    interval?: number; // Add interval property for Detail View
    create_datetime?: number;
}

interface RenderLayoutProps {
    layout: string;
    showHistoryOverlay: boolean;
    setShowHistoryOverlay: (show: boolean) => void;
    theme: ThemeConfig;
    header: React.ReactNode;
    maintenanceBanner: React.ReactNode;
    // Data props
    monitors: MonitorData[];
    status: 'operational' | 'partial' | 'major' | 'maintenance' | 'maintenance_partial';
    totalAvgResponse: number;
    // Selection for Detail View
    selectedMonitorId: string | null;
    setSelectedMonitorId: (id: string | null) => void;
}

const RenderLayout = memo(({
    layout,
    showHistoryOverlay,
    setShowHistoryOverlay,
    theme: t,
    header,
    maintenanceBanner,
    monitors,
    status,
    totalAvgResponse,
    selectedMonitorId,
    setSelectedMonitorId
}: RenderLayoutProps) => {

    // --- DETAIL VIEW OVERRIDE ---
    if (selectedMonitorId) {
        const monitor = monitors.find(m => String(m.id) === selectedMonitorId);
        // If monitor not found (e.g. data update removed it), clear selection
        if (!monitor) {
            setSelectedMonitorId(null);
            return null; // Will re-render with updated state
        }

        return (
            <div className="w-[95%] mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <MonitorDetailView
                    monitor={monitor}
                    setSelectedMonitorId={setSelectedMonitorId}
                    theme={t}
                />
            </div>
        );
    }

    const banner = <StatusBanner status={status} totalAvgResponse={totalAvgResponse} theme={t} />;
    const monitorsDisplay = <MonitorList monitors={monitors} theme={t} setSelectedMonitorId={setSelectedMonitorId} />;
    const maintenance = <Maintenance theme={t} />;

    // History is only used in overlay currently to match Editor
    const history = (
        <div className="relative">
            <IncidentHistory
                logs={monitors.some(m => m.logs && m.logs.length > 0)
                    ? monitors.flatMap(m => m.logs?.map(l => ({ ...l, monitorName: m.friendly_name })) || [])
                        .sort((a, b) => b.datetime - a.datetime)
                    : []
                }
                theme={t}
            />
        </div>
    );

    switch (layout) {
        case 'layout1': // Standard (Split Bottom)
            return (
                <>
                    {header}
                    {banner}
                    <div className="flex flex-col gap-10 sm:gap-20">
                        {monitorsDisplay}
                        {maintenance}
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
                            <div className="lg:col-span-1">
                                {maintenance}
                            </div>
                        </div>
                    </div>
                </>
            );
        case 'layout3': // Stacked + Banner Maint
            return (
                <>
                    {maintenanceBanner}
                    {header}
                    {banner}
                    <div className="flex flex-col gap-10 sm:gap-20">
                        {monitorsDisplay}
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
                    {maintenanceBanner}
                    {header}
                    {banner}
                    <div className="flex flex-col gap-10 sm:gap-20">
                        {monitorsDisplay}
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
    header: React.ReactNode;
    maintenanceBanner: React.ReactNode;
    footer: React.ReactNode;
    subdomain: string;
    initialMonitors: MonitorData[];
}

function getAverageResponseTime(times: { value: number }[] = []) {
    if (!times.length) return 0;
    const sum = times.reduce((acc, curr) => acc + curr.value, 0);
    return Math.round(sum / times.length);
}

export default function StatusPageClient({
    layout,
    themeCode,
    header,
    maintenanceBanner,
    footer,
    subdomain,
    initialMonitors,
}: StatusPageClientProps) {
    const [showHistoryOverlay, setShowHistoryOverlay] = useState(false);
    const [selectedMonitorId, setSelectedMonitorId] = useState<string | null>(null);
    const [monitors, setMonitors] = useState<MonitorData[]>(initialMonitors);
    const t = themes[themeCode as keyof typeof themes] || themes.modern;

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
        monitors.reduce((acc, m) => acc + getAverageResponseTime(m.response_times), 0) / (monitors.length || 1)
    ), [monitors]);

    return (
        <div className={`${t.container} flex flex-col min-h-[90vh]`}>
            <RenderLayout
                layout={layout}
                showHistoryOverlay={showHistoryOverlay}
                setShowHistoryOverlay={setShowHistoryOverlay}
                theme={t}
                header={header}
                maintenanceBanner={maintenanceBanner}
                monitors={monitors}
                status={status}
                totalAvgResponse={totalAvgResponse}
                selectedMonitorId={selectedMonitorId}
                setSelectedMonitorId={setSelectedMonitorId}
            />
            {!showHistoryOverlay && !selectedMonitorId && footer}
        </div>
    );
}
