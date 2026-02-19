"use client";

import React, { memo, useState, useRef, useEffect } from 'react';
import { createPortal } from "react-dom";
import { ThemeConfig, colorPresets, ColorPreset } from '@/lib/themes';
import { MonitorList } from './MonitorList';
import { MonitorDetailView } from '../status-page/MonitorDetailView';
import { StatusBanner } from './StatusBanner';
import { ArrowRight, Calendar } from 'lucide-react';
import { classNames, stripMarkdown } from '@/lib/utils';
import { MonitorData, IncidentUpdate, Log } from '@/lib/types';
import { SiteConfig } from '@/context/EditorContext';
import { toDemoStringId, isDemoId } from '@/lib/mockMonitors';

interface RenderLayoutProps {
    config: SiteConfig;
    selectedMonitors: MonitorData[];
    status: 'operational' | 'partial' | 'major' | 'maintenance' | 'maintenance_partial';
    totalAvgResponse: number;
    isMobileLayout: boolean;
    selectedMonitorId: string | null;
    setSelectedMonitorId: (id: string | null) => void;
    updateConfig: (updates: Partial<SiteConfig>) => void;
    theme: ThemeConfig;
    Header: React.ReactNode;
    History: React.ReactNode;
    Maintenance: React.ReactNode;
    updates?: IncidentUpdate[]; // Optional for override
    monitorError?: string | null;
    onRetry?: () => void;
    isLoading?: boolean;
}

export const RenderLayout = memo(({
    config,
    selectedMonitors,
    status,
    totalAvgResponse,
    isMobileLayout,
    selectedMonitorId,
    setSelectedMonitorId,
    updateConfig,
    theme: t,
    Header,
    History,
    Maintenance,
    updates,
    monitorError,
    onRetry,
    isLoading
}: RenderLayoutProps) => {

    const HeaderWithProps = React.isValidElement(Header)
        ? React.cloneElement(Header as React.ReactElement<any>, {
            supportEmail: config.supportEmail,
            supportUrl: config.supportUrl
        })
        : Header;

    const [showHistoryOverlay, setShowHistoryOverlay] = useState(false);
    const [updateToDelete, setUpdateToDelete] = useState<string | null>(null);

    // Resolve colors
    const themePresets = colorPresets[config.theme as keyof typeof colorPresets] || [];
    const activePreset = themePresets.find((p: ColorPreset) => p.id === config.colorPreset) || themePresets[0];
    const colors = activePreset?.colors;

    const activeMaintenance = config.maintenance?.find(m => {
        const start = new Date(m.startTime).getTime();
        const end = start + m.durationMinutes * 60000;
        return end > Date.now();
    });

    const scrollToMaintenance = () => {
        const el = document.getElementById('maintenance-view');
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    const MaintenanceBanner = (config.showDummyData || activeMaintenance) ? (
        <button
            onClick={scrollToMaintenance}
            className="w-full bg-indigo-500/10 border-b border-indigo-500/20 py-3 px-4 flex items-center justify-center gap-3 mb-8 cursor-pointer hover:bg-indigo-500/15 transition-colors group text-left"
        >
            <Calendar className="w-4 h-4 text-indigo-400 shrink-0" />
            <span className="text-sm font-medium text-indigo-200 truncate">
                {activeMaintenance
                    ? (() => {
                        const monitor = selectedMonitors.find(m => String(m.id) === activeMaintenance.monitorId || toDemoStringId(m.id) === activeMaintenance.monitorId);
                        const forText = monitor ? ` for ${monitor.friendly_name}` : '';
                        return `Scheduled Maintenance: ${activeMaintenance.title}${forText}`;
                    })()
                    : "Scheduled Maintenance: Database Migration"
                }
                <span className="text-white ml-2 opacity-80 group-hover:opacity-100 transition-opacity hidden sm:inline">
                    {activeMaintenance
                        ? new Date(activeMaintenance.startTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' })
                        : "Oct 24, 13:00 UTC"
                    }
                </span>
            </span>
            <ArrowRight className="w-4 h-4 text-indigo-400/50 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all ml-auto sm:ml-0" />
        </button>
    ) : null;

    // --- VISIBILITY OVERRIDE FOR PREVIEW ---
    const isScenarioActive = config.previewScenario && config.previewScenario !== 'none';
    const effectiveVisibility = isScenarioActive
        ? { showSparklines: true, showUptimeBars: true, showIncidentHistory: true, showPerformanceMetrics: true }
        : config.visibility;

    // --- SMART DELETE MODAL LOGIC (Hidden for brevity) ---
    // (Wait, I should NOT replace this part if I can avoid it. But MonitorList logic is further down)

    // Let's target the START of the file to add props. And then a separate Replace for Monitors logic.
    // This is safer.
    // I will split this into two replacements.


    // --- SMART DELETE MODAL LOGIC ---
    const confirmDelete = (type: 'permanent' | 'history') => {
        if (!updateToDelete || !config.annotations) return;

        // Find the update and its associated monitor
        let foundUpdate: IncidentUpdate | undefined;
        let monitorId: string | undefined;

        for (const [mId, updates] of Object.entries(config.annotations)) {
            const u = updates.find(u => u.id === updateToDelete);
            if (u) {
                foundUpdate = u;
                monitorId = mId;
                break;
            }
        }

        if (foundUpdate && monitorId) {
            const currentUpdates = config.annotations[monitorId] || [];

            // Remove from annotations
            const newAnnotations = {
                ...config.annotations,
                [monitorId]: currentUpdates.filter(u => u.id !== updateToDelete)
            };

            // If moving to history, add to customLogs (ONLY FOR REAL MONITORS)
            let newCustomLogs = config.customLogs || {};

            // Check if it's a real monitor (not a demo)
            const isRealMonitor = !isDemoId(monitorId);

            if (type === 'history' && isRealMonitor) {
                const existingLogs = config.customLogs?.[monitorId] || [];

                // Determine log type based on variant
                let typeCode = 1; // Default to 'Issue' (Red)
                if (foundUpdate.variant === 'success') typeCode = 2; // Recovery (Green)
                if (foundUpdate.variant === 'info') typeCode = 98; // Info (Blue/Neutral)
                if (foundUpdate.variant === 'warning') typeCode = 99; // Warning (Yellow)

                const newLog: Log = {
                    type: typeCode,
                    datetime: new Date(foundUpdate.createdAt).getTime() / 1000,
                    duration: 0,
                    reason: {
                        code: 'Manual Update',
                        detail: stripMarkdown(foundUpdate.content)
                    },
                    isManual: true
                };

                newCustomLogs = {
                    ...newCustomLogs,
                    [monitorId]: [...existingLogs, newLog]
                };
            }

            updateConfig({
                annotations: newAnnotations,
                customLogs: newCustomLogs
            });
        }

        setUpdateToDelete(null);
    };

    // Modal Rendering (Portalled)
    const activeUpdateToDelete = updateToDelete && config.annotations ?
        Object.values(config.annotations).flat().find(u => u.id === updateToDelete) : null;

    const DeleteModal = updateToDelete && activeUpdateToDelete ? createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-sm bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl p-6 m-4 animate-in zoom-in-95 duration-200">
                <div className="mb-6">
                    <h2 className="text-lg font-bold text-white mb-2">Delete Update?</h2>
                    <p className="text-sm text-zinc-400 leading-relaxed">
                        Do you want to remove this update completely, or keep it in the history?
                    </p>
                    <div className="mt-3 p-3 bg-zinc-950 border border-zinc-800 rounded-lg">
                        <p className="text-xs text-zinc-500 line-clamp-2 italic">
                            "{activeUpdateToDelete.content}"
                        </p>
                    </div>
                </div>

                <div className="space-y-3">
                    <button
                        onClick={() => confirmDelete('history')}
                        className="w-full px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-lg transition-colors flex items-center justify-between group"
                    >
                        <span>Move to Incident History</span>
                        <ArrowRight className="w-4 h-4 opacity-70 group-hover:translate-x-1 transition-transform" />
                    </button>

                    <button
                        onClick={() => confirmDelete('permanent')}
                        className="w-full px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-red-400 hover:text-red-300 text-sm font-medium rounded-lg transition-colors flex items-center justify-between"
                    >
                        <span>Delete Permanently</span>
                    </button>

                    <button
                        onClick={() => setUpdateToDelete(null)}
                        className="w-full px-4 py-2 text-zinc-500 hover:text-white text-xs font-medium transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>,
        document.body
    ) : null;

    // --- DETAIL VIEW OVERRIDE ---
    if (selectedMonitorId) {
        const monitor = selectedMonitors.find(m => {
            const idStr = m.id < 0 ? toDemoStringId(m.id) : String(m.id);
            return idStr === selectedMonitorId;
        });
        if (!monitor) return null;

        return (
            <div className="w-full mx-auto px-2 sm:px-6 lg:px-8 py-6 sm:py-12">
                <MonitorDetailView
                    monitor={monitor}
                    setSelectedMonitorId={setSelectedMonitorId}
                    theme={t}
                    colors={colors}
                    visibility={config.visibility}
                    updates={updates || config.annotations?.[selectedMonitorId] || []}
                    onAddUpdate={(content, variant) => {
                        const newUpdate: IncidentUpdate = {
                            id: crypto.randomUUID(),
                            content,
                            variant,
                            createdAt: new Date().toISOString()
                        };
                        const currentUpdates = config.annotations?.[selectedMonitorId] || [];
                        updateConfig({
                            annotations: {
                                ...config.annotations,
                                [selectedMonitorId]: [newUpdate, ...currentUpdates]
                            }
                        });
                    }}
                    maintenance={config.maintenance}
                    onDeleteUpdate={(id) => setUpdateToDelete(id)}
                />
                {DeleteModal}
            </div>
        );
    }

    // --- MONITORS RENDER LOGIC ---
    let MonitorsContent;

    if (monitorError) {
        MonitorsContent = (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center rounded-xl bg-red-500/5 border border-red-500/10">
                <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
                    <div className="w-6 h-6 text-red-500">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                        </svg>
                    </div>
                </div>
                <h3 className="text-lg font-bold text-red-100 mb-2">Unable to Load Monitors</h3>
                <p className="text-sm text-red-200/60 max-w-sm mb-6">
                    {monitorError === "Failed to fetch" ? "Check your internet connection or try again later." : monitorError}
                </p>
                {onRetry && (
                    <button
                        onClick={onRetry}
                        className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-300 text-sm font-medium rounded-lg transition-colors border border-red-500/20 hover:border-red-500/30"
                    >
                        Try Again
                    </button>
                )}
            </div>
        );
    } else if (isLoading) {
        MonitorsContent = (
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
                <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-sm text-zinc-500 animate-pulse">Updating status...</p>
            </div>
        );
    } else {
        MonitorsContent = (
            <MonitorList
                monitors={selectedMonitors}
                setSelectedMonitorId={setSelectedMonitorId}
                primaryColor={config.primaryColor}
                theme={t}
                colors={colors}
                visibility={effectiveVisibility}
            />
        );
    }

    const Monitors = MonitorsContent;

    const Banner = (
        <StatusBanner
            status={status}
            isMobileLayout={isMobileLayout}
            totalAvgResponse={totalAvgResponse}
            theme={t}
            colors={colors}
            visibility={effectiveVisibility}
            monitorError={monitorError}
        />
    );

    switch (config.layout) {
        case 'layout1': // Legacy Standard (Treat as Stacked)
        case 'layout3': // Stacked + Banner Maint
            return (
                <>
                    {HeaderWithProps}
                    {Banner}
                    <div className="flex flex-col gap-10 sm:gap-20">
                        {Monitors}
                        {effectiveVisibility?.showIncidentHistory !== false && Maintenance}
                    </div>
                    {DeleteModal}
                </>
            );
        case 'layout2': // Split Middle
            return (
                <>
                    {HeaderWithProps}
                    {Banner}
                    <div className="flex flex-col gap-10 sm:gap-20">
                        <div className={classNames(
                            "grid gap-12 sm:gap-16",
                            isMobileLayout ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-3"
                        )}>
                            <div className={classNames(
                                "space-y-12",
                                isMobileLayout ? "col-span-1" : "lg:col-span-2"
                            )}>
                                {Monitors}
                            </div>
                            {effectiveVisibility?.showIncidentHistory !== false && (
                                <div className={classNames(
                                    isMobileLayout ? "col-span-1" : "lg:col-span-1"
                                )}>
                                    {Maintenance}
                                </div>
                            )}
                        </div>
                    </div>
                    {DeleteModal}
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
                        {HeaderWithProps}
                        <div className="mt-8">
                            {History}
                        </div>
                    </div>
                );
            }
            return (
                <>
                    {MaintenanceBanner}
                    {HeaderWithProps}
                    {Banner}
                    <div className="flex flex-col gap-10 sm:gap-20">
                        {Monitors}
                    </div>
                    {DeleteModal}
                </>
            );
        default:
            return null;
    }
});

RenderLayout.displayName = 'RenderLayout';
