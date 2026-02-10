"use client";

import React, { memo, useState } from 'react';
import { ThemeConfig } from '@/lib/themes';
import { MonitorList } from './MonitorList';
import { MonitorDetailView } from './MonitorDetailView';
import { StatusBanner } from './StatusBanner';
import { Clock, ArrowRight, Calendar } from 'lucide-react';

interface RenderLayoutProps {
    config: any;
    selectedMonitors: any[];
    status: 'operational' | 'partial' | 'major';
    totalAvgResponse: number;
    isMobileLayout: boolean;
    selectedMonitorId: string | null;
    setSelectedMonitorId: (id: string | null) => void;
    theme: ThemeConfig;
    Header: React.ReactNode;
    History: React.ReactNode;
    Maintenance: React.ReactNode;
}

import { classNames } from '@/lib/utils';

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

    const MaintenanceBanner = config.showDummyData ? (
        <div className="w-full bg-indigo-500/10 border-b border-indigo-500/20 py-3 px-4 flex items-center justify-center gap-3 mb-8">
            <Calendar className="w-4 h-4 text-indigo-400" />
            <span className="text-sm font-medium text-indigo-200">
                Scheduled Maintenance: <span className="text-white">Database Migration</span> &mdash; Oct 24, 13:00 UTC
            </span>
            <ArrowRight className="w-4 h-4 text-indigo-400/50" />
        </div>
    ) : null;

    // --- DETAIL VIEW OVERRIDE ---
    if (selectedMonitorId) {
        const monitor = selectedMonitors.find(m => String(m.id) === selectedMonitorId);
        return (
            <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <MonitorDetailView
                    monitor={monitor}
                    setSelectedMonitorId={setSelectedMonitorId}
                    theme={t}
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
        />
    );

    const Banner = (
        <StatusBanner
            status={status}
            isMobileLayout={isMobileLayout}
            totalAvgResponse={totalAvgResponse}
            theme={t}
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
                        <div className={classNames(
                            "grid gap-12 sm:gap-16",
                            isMobileLayout ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2"
                        )}>
                            {History}
                            {Maintenance}
                        </div>
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
                            <div className={classNames(
                                isMobileLayout ? "col-span-1" : "lg:col-span-1"
                            )}>
                                {Maintenance}
                            </div>
                        </div>
                        {History}
                    </div>
                </>
            );
        case 'layout3': // Stacked + Banner Maint
            return (
                <>
                    {MaintenanceBanner}
                    {Header}
                    {Banner}
                    <div className="flex flex-col gap-10 sm:gap-20">
                        {Monitors}
                        {History}
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
                        <div className="flex justify-center pt-8 border-t border-white/5">
                            <button
                                onClick={() => setShowHistoryOverlay(true)}
                                className={`px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 ${t.rounded} text-sm font-medium text-white transition-all flex items-center gap-2 group`}
                            >
                                <Clock className="w-4 h-4 text-white/50 group-hover:text-white transition-colors" />
                                View Incident History
                                <ArrowRight className="w-4 h-4 opacity-50 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </div>
                </>
            );
        default:
            return null;
    }
});

RenderLayout.displayName = 'RenderLayout';
