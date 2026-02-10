"use client";

import React, { memo } from 'react';
import { ThemeConfig } from '@/lib/themes';
import { IncidentHistory } from '@/components/status-page/IncidentHistory';

interface EditorHistoryProps {
    showDummyData: boolean;
    selectedMonitors: any[];
    theme: ThemeConfig;
}

export const EditorHistory = memo(({ showDummyData, selectedMonitors, theme: t }: EditorHistoryProps) => {
    const logs = showDummyData ? [
        { type: 2, datetime: Date.now() / 1000 - 3600, duration: 300, monitorName: "API Gateway", reason: null },
        { type: 1, datetime: Date.now() / 1000 - 86400, duration: 1200, monitorName: "Database Cluster", reason: { code: "502" } },
        { type: 2, datetime: Date.now() / 1000 - 172800, duration: 450, monitorName: "CDN Edge", reason: null },
        { type: 2, datetime: Date.now() / 1000 - 259200, duration: 600, monitorName: "Auth Service", reason: null },
        { type: 2, datetime: Date.now() / 1000 - 345600, duration: 300, monitorName: "Search Index", reason: null },
        { type: 2, datetime: Date.now() / 1000 - 432000, duration: 900, monitorName: "Image Resizer", reason: null }
    ] : selectedMonitors.flatMap(m => m.logs?.map((l: any) => ({ ...l, monitorName: m.friendly_name })) || [])
        .sort((a: any, b: any) => b.datetime - a.datetime);

    return (
        <IncidentHistory
            logs={logs}
            theme={t}
        />
    );
});

EditorHistory.displayName = 'EditorHistory';
