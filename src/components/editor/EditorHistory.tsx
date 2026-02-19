"use client";

import React, { memo, useMemo } from 'react';
import { ThemeConfig } from '@/lib/themes';
import { IncidentHistory } from '@/components/status-page/IncidentHistory';
import { useEditor } from '@/context/EditorContext';

import { MonitorData } from '@/lib/types';

interface EditorHistoryProps {
    showDummyData: boolean;
    selectedMonitors: MonitorData[];
    theme: ThemeConfig;
    brandName?: string;
}

export const EditorHistory = memo(({ showDummyData, selectedMonitors, theme: t, brandName }: EditorHistoryProps) => {
    const { config } = useEditor();

    // We need to map these to HistoryItem format now
    const items = useMemo(() => {
        // eslint-disable-next-line react-hooks/purity
        const now = Date.now();
        if (config.previewScenario === 'heavy_incidents') {
            return [
                ...Array(12).fill(0).map((_, i) => ({
                    id: `mock-${i}`,
                    type: 'log' as const,
                    timestamp: now / 1000 - (i * 3600),
                    logDuration: 300,
                    monitorName: `Service ${i + 1}`,
                    logType: 2,
                }))
            ];
        }

        if (config.previewScenario === 'long_history') {
            return Array(100).fill(0).map((_, i) => ({
                id: `mock-${i}`,
                type: 'log' as const,
                timestamp: now / 1000 - (i * 86400),
                logDuration: 600,
                monitorName: "Core API",
                logType: i % 10 === 0 ? 1 : 2,
                logReason: i % 10 === 0 ? { code: "500", detail: "Internal Server Error" } : undefined
            }));
        }

        if (showDummyData) {
            return [
                { id: 'mock-1', type: 'log' as const, logType: 2, timestamp: now / 1000 - 3600, logDuration: 300, monitorName: "API Gateway" },
                { id: 'mock-2', type: 'log' as const, logType: 1, timestamp: now / 1000 - 86400, logDuration: 1200, monitorName: "Database Cluster", logReason: { code: "502", detail: "Bad Gateway" } },
                { id: 'mock-3', type: 'log' as const, logType: 2, timestamp: now / 1000 - 172800, logDuration: 450, monitorName: "CDN Edge" },
                { id: 'mock-4', type: 'log' as const, logType: 2, timestamp: now / 1000 - 259200, logDuration: 600, monitorName: "Auth Service" },
                { id: 'mock-5', type: 'log' as const, logType: 2, timestamp: now / 1000 - 345600, logDuration: 300, monitorName: "Search Index" },
                { id: 'mock-6', type: 'log' as const, logType: 2, timestamp: now / 1000 - 432000, logDuration: 900, monitorName: "Image Resizer" }
            ];
        }

        // Real data mapping
        const logs = selectedMonitors.flatMap(m => m.logs?.map((l: any) => ({
            id: `log-${l.datetime}-${l.type}-${m.id}`,
            type: 'log' as const,
            timestamp: l.datetime,
            logType: l.type,
            logReason: l.reason,
            logDuration: l.duration,
            isManual: l.isManual,
            content: l.content,
            monitorName: m.friendly_name
        })) || []);

        // Add manual updates if available in config.annotations?
        // The EditorHistory usually just shows logs, but let's confirm if it needs updates too.
        // For now, let's just stick to logs as it was, but mapped correctly.

        return logs.sort((a, b) => b.timestamp - a.timestamp);
    }, [showDummyData, selectedMonitors, config.previewScenario]);

    return (
        <IncidentHistory
            items={items}
            theme={t}
            monitorName="All Monitors"
            brandName={brandName}
        />
    );
});

EditorHistory.displayName = 'EditorHistory';
