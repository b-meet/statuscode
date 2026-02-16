"use client";

import React, { useMemo } from 'react';
import { ThemeConfig, StatusColors, getBaseColor } from '@/lib/themes';
import { MonitorData, Log } from '@/lib/types';

interface UptimeBarsProps {
    monitor: MonitorData;
    theme: ThemeConfig;
    colors?: StatusColors;
    days?: number;
    height?: number | string;
    gap?: number;
}

export const UptimeBars = ({
    monitor,
    theme: t,
    colors,
    days = 90,
    height = 16,
    gap = 2
}: UptimeBarsProps) => {
    const now = useMemo(() => Date.now(), []);
    const creationDate = useMemo(() =>
        monitor.create_datetime ? new Date(monitor.create_datetime * 1000) : new Date(0),
        [monitor.create_datetime]
    );

    const opBase = getBaseColor(colors?.operational) || 'emerald';
    const majBase = getBaseColor(colors?.major) || 'red';

    const dayBars = useMemo(() => {
        if (!monitor) return [];

        const totalDays = days;
        const outageDates = new Set<string>();

        if (monitor.logs) {
            (monitor.logs as Log[]).forEach((log) => {
                if (log.type === 1) {
                    const date = new Date(log.datetime * 1000).toLocaleDateString();
                    outageDates.add(date);
                }
            });
        }

        return Array.from({ length: totalDays }).map((_, i) => {
            const timestamp = now - (totalDays - 1 - i) * 86400000;
            const dateObj = new Date(timestamp);
            const dateStr = dateObj.toLocaleDateString();
            const isBeforeCreation = dateObj < creationDate && dateObj.toDateString() !== creationDate.toDateString();

            if (isBeforeCreation) {
                return { status: 'empty', date: dateStr, barHeight: '100%' };
            }

            if (outageDates.has(dateStr)) {
                const deterministicHeight = Math.abs(Math.sin(timestamp)) * 40 + 30;
                return { status: 'down', date: dateStr, barHeight: `${deterministicHeight}%` };
            }

            return { status: 'up', date: dateStr, barHeight: '100%' };
        });
    }, [monitor, now, creationDate, days]);

    return (
        <div className="flex items-end h-full w-full" style={{ gap: `${gap}px` }}>
            {dayBars.map((bar, i) => {
                let colorClass = 'bg-white/5';

                if (bar.status === 'up') {
                    const base = opBase === 'white' || opBase === 'black' ? opBase : `${opBase}-500`;
                    colorClass = `bg-${base}/40 hover:bg-${base}`;
                } else if (bar.status === 'down') {
                    const base = majBase === 'white' || majBase === 'black' ? majBase : `${majBase}-500`;
                    colorClass = `bg-${base}/80 hover:bg-${base}`;
                }

                return (
                    <div
                        key={i}
                        className={`flex-1 rounded-sm transition-all hover:scale-y-125 hover:opacity-100 ${colorClass}`}
                        style={{ height: bar.barHeight }}
                        title={`${bar.date}: ${bar.status === 'up' ? '100% Uptime' : bar.status === 'down' ? 'Downtime Detected' : 'Not monitored'}`}
                    />
                );
            })}
        </div>
    );
};
