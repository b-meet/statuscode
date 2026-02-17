"use client";

import React, { memo, useState, useRef, useEffect } from 'react';
import { ThemeConfig, colorPresets, ColorPreset } from '@/lib/themes';
import { MonitorList } from './MonitorList';
import { MonitorDetailView } from '../status-page/MonitorDetailView';
import { StatusBanner } from './StatusBanner';
import { ArrowRight, Calendar } from 'lucide-react';
import { classNames } from '@/lib/utils';
import { MonitorData, IncidentUpdate } from '@/lib/types';
import { SiteConfig } from '@/context/EditorContext';
import { toDemoStringId } from '@/lib/mockMonitors';

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
    updates
}: RenderLayoutProps) => {

    const HeaderWithProps = React.isValidElement(Header)
        ? React.cloneElement(Header as React.ReactElement<any>, {
            supportEmail: config.supportEmail,
            supportUrl: config.supportUrl
        })
        : Header;

    const [showHistoryOverlay, setShowHistoryOverlay] = useState(false);

    // Resolve colors
    const themePresets = colorPresets[config.theme as keyof typeof colorPresets] || [];
    const activePreset = themePresets.find((p: ColorPreset) => p.id === config.colorPreset) || themePresets[0];
    const colors = activePreset?.colors;

    const activeMaintenance = config.maintenance?.find(m => {
        const start = new Date(m.startTime).getTime();
        const end = start + m.durationMinutes * 60000;
        return end > Date.now();
    });

    const MaintenanceBanner = (config.showDummyData || activeMaintenance) ? (
        <div className="w-full bg-indigo-500/10 border-b border-indigo-500/20 py-3 px-4 flex items-center justify-center gap-3 mb-8">
            <Calendar className="w-4 h-4 text-indigo-400" />
            <span className="text-sm font-medium text-indigo-200">
                {activeMaintenance
                    ? `Scheduled Maintenance: ${activeMaintenance.title}`
                    : "Scheduled Maintenance: Database Migration"
                }
                <span className="text-white ml-2">
                    {activeMaintenance
                        ? new Date(activeMaintenance.startTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' })
                        : "Oct 24, 13:00 UTC"
                    }
                </span>
            </span>
            <ArrowRight className="w-4 h-4 text-indigo-400/50" />
        </div>
    ) : null;

    // --- VISIBILITY OVERRIDE FOR PREVIEW ---
    const isScenarioActive = config.previewScenario && config.previewScenario !== 'none';
    const effectiveVisibility = isScenarioActive
        ? { showSparklines: true, showUptimeBars: true, showIncidentHistory: true, showPerformanceMetrics: true }
        : config.visibility;

    // --- DETAIL VIEW OVERRIDE ---
    if (selectedMonitorId) {
        const monitor = selectedMonitors.find(m => {
            const idStr = m.id < 0 ? toDemoStringId(m.id) : String(m.id);
            return idStr === selectedMonitorId;
        });
        if (!monitor) return null;

        return (
            <div className="w-[95%] mx-auto px-4 sm:px-6 lg:px-8 py-12">
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
                    onDeleteUpdate={(id) => {
                        const currentUpdates = config.annotations?.[selectedMonitorId] || [];
                        updateConfig({
                            annotations: {
                                ...config.annotations,
                                [selectedMonitorId]: currentUpdates.filter(u => u.id !== id)
                            }
                        });
                    }}
                />
            </div>
        );
    }

    const Monitors = (
        <MonitorList
            monitors={selectedMonitors}
            setSelectedMonitorId={setSelectedMonitorId}
            primaryColor={config.primaryColor}
            theme={t}
            colors={colors}
            visibility={effectiveVisibility}
        />
    );

    const Banner = (
        <StatusBanner
            status={status}
            isMobileLayout={isMobileLayout}
            totalAvgResponse={totalAvgResponse}
            theme={t}
            colors={colors}
            visibility={effectiveVisibility}
        />
    );

    switch (config.layout) {
        case 'layout1': // Standard (Split Bottom)
            return (
                <>
                    {HeaderWithProps}
                    {Banner}
                    <div className="flex flex-col gap-10 sm:gap-20">
                        {Monitors}
                        {effectiveVisibility?.showIncidentHistory !== false && Maintenance}
                    </div>
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
                </>
            );
        case 'layout3': // Stacked + Banner Maint
            return (
                <>
                    {MaintenanceBanner}
                    {HeaderWithProps}
                    {Banner}
                    {HeaderWithProps}
                    {Banner}
                    <div className="flex flex-col gap-10 sm:gap-20">
                        {Monitors}
                        {effectiveVisibility?.showIncidentHistory !== false && Maintenance}
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
                </>
            );
        default:
            return null;
    }
});

RenderLayout.displayName = 'RenderLayout';
