"use client";

import React, { memo, useMemo } from 'react';
import { ThemeConfig } from '@/lib/themes';
import { IncidentHistory } from '@/components/status-page/IncidentHistory';
import { useEditor } from '@/context/EditorContext';

interface EditorHistoryProps {
    showDummyData: boolean;
    selectedMonitors: any[];
    theme: ThemeConfig;
}

export const EditorHistory = memo(({ showDummyData, selectedMonitors, theme: t }: EditorHistoryProps) => {
    const { config } = useEditor();

    const logs = useMemo(() => {
        if (config.previewScenario === 'heavy_incidents') {
            return [
                ...Array(12).fill(0).map((_, i) => ({
                    type: 2,
                    datetime: Date.now() / 1000 - (i * 3600),
                    duration: 300,
                    monitorName: `Service ${i + 1}`,
                    reason: null
                }))
            ];
        }

        if (config.previewScenario === 'long_history') {
            return Array(100).fill(0).map((_, i) => ({
                type: i % 10 === 0 ? 1 : 2,
                datetime: Date.now() / 1000 - (i * 86400),
                duration: 600,
                monitorName: "Core API",
                reason: i % 10 === 0 ? { code: "500" } : null
            }));
        }

        if (showDummyData) {
            return [
                { type: 2, datetime: Date.now() / 1000 - 3600, duration: 300, monitorName: "API Gateway", reason: null },
                { type: 1, datetime: Date.now() / 1000 - 86400, duration: 1200, monitorName: "Database Cluster", reason: { code: "502" } },
                { type: 2, datetime: Date.now() / 1000 - 172800, duration: 450, monitorName: "CDN Edge", reason: null },
                { type: 2, datetime: Date.now() / 1000 - 259200, duration: 600, monitorName: "Auth Service", reason: null },
                { type: 2, datetime: Date.now() / 1000 - 345600, duration: 300, monitorName: "Search Index", reason: null },
                { type: 2, datetime: Date.now() / 1000 - 432000, duration: 900, monitorName: "Image Resizer", reason: null }
            ];
        }

        return selectedMonitors.flatMap(m => m.logs?.map((l: any) => ({ ...l, monitorName: m.friendly_name })) || [])
            .sort((a: any, b: any) => b.datetime - a.datetime);
    }, [showDummyData, selectedMonitors, config.previewScenario]);

    return (
        <IncidentHistory
            logs={logs}
            theme={t}
        />
    );
});

EditorHistory.displayName = 'EditorHistory';
