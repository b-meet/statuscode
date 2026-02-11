"use client";

import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';

interface SparklineProps {
    data: { value: number; datetime?: number }[];
    color?: string;
    width?: number;
    height?: number;
    interactive?: boolean;
}

export const Sparkline = React.memo(({ data, color = "#6366f1", width = 120, height = 40, interactive = false }: SparklineProps) => {
    const [hoveredData, setHoveredData] = useState<{ value: number; datetime?: number; x: number; y: number } | null>(null);
    const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
    const svgRef = useRef<SVGSVGElement>(null);

    if (!data || data.length < 2) return null;

    const max = Math.max(...data.map(d => d.value));
    const min = Math.min(...data.map(d => d.value));
    const range = max - min || 1;

    // Ensure we don't go below the bottom padding
    const padding = 5;
    const effectiveHeight = height - padding * 2;

    const points = data.map((d, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = padding + (effectiveHeight - ((d.value - min) / range) * effectiveHeight); // Invert Y
        return `${x},${y}`;
    }).join(' ');

    const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
        if (!interactive || !svgRef.current) return;

        const rect = svgRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;

        // Find closest data point
        const index = Math.round((x / rect.width) * (data.length - 1));
        const clampedIndex = Math.max(0, Math.min(index, data.length - 1));
        const point = data[clampedIndex];

        const pointX = (clampedIndex / (data.length - 1)) * width;
        const pointY = padding + (effectiveHeight - ((point.value - min) / range) * effectiveHeight);

        setHoveredData({ ...point, x: pointX, y: pointY });
        setTooltipPos({ x: e.clientX, y: e.clientY - 10 });
    };

    const handleMouseLeave = () => {
        setHoveredData(null);
    };

    return (
        <>
            <svg
                ref={svgRef}
                viewBox={`0 0 ${width} ${height}`}
                preserveAspectRatio="none"
                className={`overflow-visible block w-full h-full ${interactive ? 'cursor-crosshair' : ''}`}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
            >
                <polyline
                    fill="none"
                    stroke={color}
                    strokeWidth="2"
                    vectorEffect="non-scaling-stroke"
                    points={points}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="opacity-50"
                />

                {/* Fill area below the line */}
                <polygon
                    fill={color}
                    fillOpacity="0.1"
                    points={`0,${height} ${points} ${width},${height}`}
                />

                {interactive && hoveredData && (
                    <>
                        {/* Vertical Indicator Line */}
                        <line
                            x1={hoveredData.x}
                            y1={0}
                            x2={hoveredData.x}
                            y2={height}
                            stroke="white"
                            strokeWidth="1"
                            strokeDasharray="4 4"
                            opacity="0.5"
                            vectorEffect="non-scaling-stroke"
                        />
                        {/* Point Highlight */}
                        <circle
                            cx={hoveredData.x}
                            cy={hoveredData.y}
                            r="3"
                            fill="white"
                            stroke={color}
                            strokeWidth="2"
                            vectorEffect="non-scaling-stroke"
                        />
                    </>
                )}
            </svg>

            {/* Portal Tooltip to Body to avoid clipping/coordinate issues */}
            {interactive && hoveredData && (
                <Tooltip
                    x={tooltipPos.x}
                    y={tooltipPos.y}
                    value={hoveredData.value}
                    datetime={hoveredData.datetime}
                />
            )}
        </>
    );
}, (prev, next) => prev.data === next.data && prev.color === next.color && prev.width === next.width && prev.height === next.height && prev.interactive === next.interactive);

// Simple Portal Tooltip component
const Tooltip = ({ x, y, value, datetime }: { x: number, y: number, value: number, datetime?: number }) => {
    // We use a portal to ensure the tooltip breaks out of any overflow:hidden containers
    if (typeof window === 'undefined') return null;

    return createPortal(
        <div
            className="fixed pointer-events-none z-50 px-3 py-2 bg-zinc-900 border border-white/10 rounded shadow-xl text-xs flex flex-col items-center gap-1 transform -translate-x-1/2 -translate-y-full"
            style={{ left: x, top: y }}
        >
            <div className="font-mono font-bold text-white">{value}ms</div>
            {datetime && (
                <div className="text-zinc-400 text-[10px]">
                    {new Date(datetime * 1000).toLocaleTimeString()}
                </div>
            )}
        </div>,
        document.body
    );
};


Sparkline.displayName = 'Sparkline';
