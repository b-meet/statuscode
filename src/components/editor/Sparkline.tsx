"use client";

import React, { memo } from 'react';

interface SparklineProps {
    data: { value: number }[];
    color?: string;
    width?: number;
    height?: number;
}

// Define types locally if not importing from types.ts to keep component self-contained or import if preferred
// But here we'll stick to the passed props structure
interface SparklineProps {
    data: { value: number; datetime?: number }[];
    color?: string;
    width?: number;
    height?: number;
}

export const Sparkline = memo(({ data, color = "#6366f1", width = 120, height = 40 }: SparklineProps) => {
    const [hoveredData, setHoveredData] = React.useState<{ value: number; datetime?: number; x: number; y: number } | null>(null);
    const containerRef = React.useRef<HTMLDivElement>(null);

    if (!data || data.length < 2) return null;

    const max = Math.max(...data.map(d => d.value));
    const min = Math.min(...data.map(d => d.value));
    const range = max - min || 1;

    const points = data.map((d, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = height - ((d.value - min) / range) * height; // Invert Y
        return `${x},${y}`;
    }).join(' ');

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;

        // Find closest data point
        const index = Math.min(Math.max(0, Math.round((x / rect.width) * (data.length - 1))), data.length - 1);
        const point = data[index];

        // Calculate Y position for the tooltip
        const pointY = height - ((point.value - min) / range) * height;

        setHoveredData({
            value: point.value,
            datetime: point.datetime,
            x: (index / (data.length - 1)) * rect.width, // Scaled to current width
            y: pointY
        });
    };

    const handleMouseLeave = () => {
        setHoveredData(null);
    };

    return (
        <div
            ref={containerRef}
            className="relative w-full h-full group"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        >
            <svg
                viewBox={`0 0 ${width} ${height}`}
                preserveAspectRatio="none"
                className="overflow-visible block w-full h-full opacity-50 group-hover:opacity-100 transition-opacity duration-300"
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

            {/* Interaction Overlay */}
            <div className="absolute inset-0 z-10 cursor-crosshair" />

            {/* Tooltip & Indicator */}
            {hoveredData && (
                <>
                    {/* Vertical Line */}
                    <div
                        className="absolute top-0 bottom-0 w-[1px] bg-white/20 pointer-events-none"
                        style={{ left: hoveredData.x }}
                    />

                    {/* Dot */}
                    <div
                        className="absolute w-2 h-2 rounded-full border border-white/50 bg-black pointer-events-none"
                        style={{
                            left: hoveredData.x,
                            top: `${(hoveredData.y / height) * 100}%`,
                            transform: 'translate(-50%, -50%)',
                            borderColor: color
                        }}
                    />

                    {/* Tooltip */}
                    <div
                        className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-zinc-900/90 border border-white/10 rounded px-2 py-1.5 text-[10px] whitespace-nowrap z-50 shadow-xl backdrop-blur-sm pointer-events-none flex flex-col items-center gap-0.5"
                        style={{
                            left: Math.max(40, Math.min(hoveredData.x, (containerRef.current?.clientWidth || 120) - 40))
                        }}
                    >
                        <span className="font-mono font-bold text-white">
                            {hoveredData.value}ms
                        </span>
                        {hoveredData.datetime && (
                            <span className="text-zinc-400 font-medium">
                                {new Date(hoveredData.datetime * 1000).toLocaleString(undefined, {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </span>
                        )}
                    </div>
                </>
            )}
        </div>
    );
});

Sparkline.displayName = 'Sparkline';
