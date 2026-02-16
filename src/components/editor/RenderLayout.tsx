"use client";

import React, { memo, useState } from 'react';
import { ThemeConfig, colorPresets, ColorPreset } from '@/lib/themes';
import { MonitorList } from './MonitorList';
import { MonitorDetailView } from '../status-page/MonitorDetailView';
import { StatusBanner } from './StatusBanner';
import { ArrowRight, Calendar } from 'lucide-react';
import { classNames } from '@/lib/utils';
import { MonitorData } from '@/lib/types';
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
    theme: ThemeConfig;
    Header: React.ReactNode;
    History: React.ReactNode;
    Maintenance: React.ReactNode;
}

export const RenderLayout = memo(({
    config,
    selectedMonitors,
    status,
    totalAvgResponse,
    isMobileLayout,
    selectedMonitorId,
    setSelectedMonitorId,
    theme: t,
    Header,
    History,
    Maintenance
}: RenderLayoutProps) => {

    const [showHistoryOverlay, setShowHistoryOverlay] = useState(false);

    // Resolve colors
    const themePresets = colorPresets[config.theme as keyof typeof colorPresets] || [];
    const activePreset = themePresets.find((p: ColorPreset) => p.id === config.colorPreset) || themePresets[0];
    const colors = activePreset?.colors;

    const MaintenanceBanner = config.showDummyData ? (
        <div className="w-full bg-indigo-500/10 border-b border-indigo-500/20 py-3 px-4 flex items-center justify-center gap-3 mb-8">
            <Calendar className="w-4 h-4 text-indigo-400" />
            <span className="text-sm font-medium text-indigo-200">
                Scheduled Maintenance: <span className="text-white">Database Migration</span> &mdash; Oct 24, 13:00 UTC
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
                    visibility={effectiveVisibility}
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
                    {Header}
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
                    {Header}
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
                    {Header}
                    {Banner}
                    {Header}
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
                        {Header}
                        <div className="mt-8">
                            {History}
                        </div>
                    </div>
                );
            }
            return (
                <>
                    {MaintenanceBanner}
                    {Header}
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
