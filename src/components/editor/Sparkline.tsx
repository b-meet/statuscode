"use client";

import React, { memo } from 'react';

interface SparklineProps {
    data: { value: number }[];
    color?: string;
    width?: number;
    height?: number;
}

export const Sparkline = memo(({ data, color = "#6366f1", width = 120, height = 40 }: SparklineProps) => {
    if (!data || data.length < 2) return null;

    const max = Math.max(...data.map(d => d.value));
    const min = Math.min(...data.map(d => d.value));
    const range = max - min || 1;

    const points = data.map((d, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = height - ((d.value - min) / range) * height; // Invert Y
        return `${x},${y}`;
    }).join(' ');

    return (
        <svg
            viewBox={`0 0 ${width} ${height}`}
            preserveAspectRatio="none"
            className="overflow-visible opacity-50 block w-full h-full"
        >
            <polyline
                fill="none"
                stroke={color}
                strokeWidth="2"
                vectorEffect="non-scaling-stroke"
                points={points}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
});

Sparkline.displayName = 'Sparkline';
