
export type Theme = 'modern' | 'minimal' | 'brutal';

export interface ThemeConfig {
    // Layout
    pageBg: string; // The main background class (color + gradients)
    container: string; // Max-width and padding

    // Components
    card: string; // Background, border, shadow, blurring
    cardHover: string; // Hover states for interactive cards

    // Typography
    font: string; // Font family class
    heading: string; // Heading styles (tracking, weight)
    mutedText: string; // Subtext color

    // UI Elements
    rounded: string; // Border radius consistency
    border: string; // Border color/width
    shadow: string; // Shadow style

    // Status Elements
    statusBadge: (status: 'up' | 'down' | 'maintenance', colors?: StatusColors) => string;

    // Specifics
    noiseOpacity: string; // 'opacity-5' etc.
    bannerStyle: (isAllUp: boolean) => string;
}

export interface StatusColors {
    operational: string;
    partial: string;
    major: string;
    maintenance: string;
}

export interface ColorPreset {
    id: string;
    name: string;
    colors: StatusColors;
}

export const colorPresets: Record<Theme, ColorPreset[]> = {
    modern: [
        {
            id: 'default', name: 'Emerald (Default)', colors: {
                operational: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.2)]",
                partial: "bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.2)]",
                major: "bg-red-500/10 text-red-400 border border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.2)]",
                maintenance: "bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.2)]"
            }
        },
        {
            id: 'ocean', name: 'Oceanic', colors: {
                operational: "bg-sky-500/10 text-sky-400 border border-sky-500/20 shadow-[0_0_10px_rgba(14,165,233,0.2)]",
                partial: "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-[0_0_10px_rgba(99,102,241,0.2)]",
                major: "bg-rose-500/10 text-rose-400 border border-rose-500/20 shadow-[0_0_10px_rgba(244,63,94,0.2)]",
                maintenance: "bg-teal-500/10 text-teal-400 border border-teal-500/20 shadow-[0_0_10px_rgba(20,184,166,0.2)]"
            }
        },
        {
            id: 'sunset', name: 'Sunset', colors: {
                operational: "bg-orange-500/10 text-orange-400 border border-orange-500/20 shadow-[0_0_10px_rgba(249,115,22,0.2)]",
                partial: "bg-pink-500/10 text-pink-400 border border-pink-500/20 shadow-[0_0_10px_rgba(236,72,153,0.2)]",
                major: "bg-red-600/10 text-red-500 border border-red-600/20 shadow-[0_0_10px_rgba(220,38,38,0.2)]",
                maintenance: "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 shadow-[0_0_10px_rgba(234,179,8,0.2)]"
            }
        },
        {
            id: 'royal', name: 'Royal', colors: {
                operational: "bg-violet-500/10 text-violet-400 border border-violet-500/20 shadow-[0_0_10px_rgba(139,92,246,0.2)]",
                partial: "bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/20 shadow-[0_0_10px_rgba(217,70,239,0.2)]",
                major: "bg-purple-600/10 text-purple-500 border border-purple-600/20 shadow-[0_0_10px_rgba(147,51,234,0.2)]",
                maintenance: "bg-indigo-400/10 text-indigo-300 border border-indigo-400/20 shadow-[0_0_10px_rgba(129,140,248,0.2)]"
            }
        },
        {
            id: 'nature', name: 'Nature', colors: {
                operational: "bg-lime-500/10 text-lime-400 border border-lime-500/20 shadow-[0_0_10px_rgba(132,204,22,0.2)]",
                partial: "bg-yellow-600/10 text-yellow-500 border border-yellow-600/20 shadow-[0_0_10px_rgba(202,138,4,0.2)]",
                major: "bg-red-700/10 text-red-600 border border-red-700/20 shadow-[0_0_10px_rgba(185,28,28,0.2)]",
                maintenance: "bg-green-600/10 text-green-500 border border-green-600/20 shadow-[0_0_10px_rgba(22,163,74,0.2)]"
            }
        },
        {
            id: 'stealth', name: 'Stealth', colors: {
                operational: "bg-zinc-100/10 text-zinc-100 border border-zinc-100/20 shadow-[0_0_10px_rgba(244,244,245,0.2)]",
                partial: "bg-zinc-500/10 text-zinc-400 border border-zinc-500/20 shadow-[0_0_10px_rgba(113,113,122,0.2)]",
                major: "bg-red-900/10 text-red-700 border border-red-900/20 shadow-[0_0_10px_rgba(127,29,29,0.2)]",
                maintenance: "bg-stone-500/10 text-stone-400 border border-stone-500/20 shadow-[0_0_10px_rgba(120,113,108,0.2)]"
            }
        }
    ],
    minimal: [
        {
            id: 'default', name: 'Classic', colors: {
                operational: "text-emerald-500 font-mono text-[10px] uppercase tracking-widest border-b border-emerald-500/50 pb-0.5",
                partial: "text-amber-500 font-mono text-[10px] uppercase tracking-widest border-b border-amber-500/50 pb-0.5",
                major: "text-red-500 font-mono text-[10px] uppercase tracking-widest border-b border-red-500/50 pb-0.5",
                maintenance: "text-blue-500 font-mono text-[10px] uppercase tracking-widest border-b border-blue-500/50 pb-0.5"
            }
        },
        {
            id: 'mono', name: 'Mono', colors: {
                operational: "text-white font-mono text-[10px] uppercase tracking-widest border-b border-white/50 pb-0.5",
                partial: "text-zinc-400 font-mono text-[10px] uppercase tracking-widest border-b border-zinc-400/50 pb-0.5",
                major: "text-zinc-600 font-mono text-[10px] uppercase tracking-widest border-b border-zinc-600/50 pb-0.5",
                maintenance: "text-zinc-500 font-mono text-[10px] uppercase tracking-widest border-b border-zinc-500/50 pb-0.5"
            }
        },
        {
            id: 'neon', name: 'Neon', colors: {
                operational: "text-lime-400 font-mono text-[10px] uppercase tracking-widest border-b border-lime-400/50 pb-0.5 drop-shadow-[0_0_5px_rgba(163,230,53,0.5)]",
                partial: "text-yellow-400 font-mono text-[10px] uppercase tracking-widest border-b border-yellow-400/50 pb-0.5 drop-shadow-[0_0_5px_rgba(250,204,21,0.5)]",
                major: "text-pink-500 font-mono text-[10px] uppercase tracking-widest border-b border-pink-500/50 pb-0.5 drop-shadow-[0_0_5px_rgba(236,72,153,0.5)]",
                maintenance: "text-cyan-400 font-mono text-[10px] uppercase tracking-widest border-b border-cyan-400/50 pb-0.5 drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]"
            }
        },
        {
            id: 'warm', name: 'Warm', colors: {
                operational: "text-orange-400 font-mono text-[10px] uppercase tracking-widest border-b border-orange-400/50 pb-0.5",
                partial: "text-red-400 font-mono text-[10px] uppercase tracking-widest border-b border-red-400/50 pb-0.5",
                major: "text-rose-600 font-mono text-[10px] uppercase tracking-widest border-b border-rose-600/50 pb-0.5",
                maintenance: "text-amber-300 font-mono text-[10px] uppercase tracking-widest border-b border-amber-300/50 pb-0.5"
            }
        },
        {
            id: 'cold', name: 'Cold', colors: {
                operational: "text-cyan-400 font-mono text-[10px] uppercase tracking-widest border-b border-cyan-400/50 pb-0.5",
                partial: "text-blue-400 font-mono text-[10px] uppercase tracking-widest border-b border-blue-400/50 pb-0.5",
                major: "text-indigo-600 font-mono text-[10px] uppercase tracking-widest border-b border-indigo-600/50 pb-0.5",
                maintenance: "text-sky-300 font-mono text-[10px] uppercase tracking-widest border-b border-sky-300/50 pb-0.5"
            }
        },
        {
            id: 'soft', name: 'Soft', colors: {
                operational: "text-teal-300 font-mono text-[10px] uppercase tracking-widest border-b border-teal-300/50 pb-0.5",
                partial: "text-purple-300 font-mono text-[10px] uppercase tracking-widest border-b border-purple-300/50 pb-0.5",
                major: "text-rose-300 font-mono text-[10px] uppercase tracking-widest border-b border-rose-300/50 pb-0.5",
                maintenance: "text-indigo-300 font-mono text-[10px] uppercase tracking-widest border-b border-indigo-300/50 pb-0.5"
            }
        }
    ],
    brutal: [
        {
            id: 'default', name: 'Standard', colors: {
                operational: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.2)]",
                partial: "bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.2)]",
                major: "bg-red-500/10 text-red-400 border border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.2)]",
                maintenance: "bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.2)]"
            }
        },
        {
            id: 'bw', name: 'High Contrast', colors: {
                operational: "bg-white text-black border-2 border-black shadow-[4px_4px_0px_0px_#ffffff]",
                partial: "bg-zinc-400 text-black border-2 border-black shadow-[4px_4px_0px_0px_#a1a1aa]",
                major: "bg-zinc-800 text-white border-2 border-white shadow-[4px_4px_0px_0px_#52525b]",
                maintenance: "bg-zinc-200 text-black border-2 border-dashed border-black shadow-[4px_4px_0px_0px_#e4e4e7]"
            }
        },
        {
            id: 'comic', name: 'Comic', colors: {
                operational: "bg-yellow-400 text-black border-2 border-black shadow-[4px_4px_0px_0px_#000000]",
                partial: "bg-orange-400 text-black border-2 border-black shadow-[4px_4px_0px_0px_#000000]",
                major: "bg-red-500 text-white border-2 border-black shadow-[4px_4px_0px_0px_#000000]",
                maintenance: "bg-blue-400 text-black border-2 border-black shadow-[4px_4px_0px_0px_#000000]"
            }
        },
        {
            id: 'cyber', name: 'Cyber', colors: {
                operational: "bg-black text-lime-400 border border-lime-400 shadow-[0_0_15px_rgba(163,230,53,0.5)]",
                partial: "bg-black text-yellow-400 border border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.5)]",
                major: "bg-black text-rose-500 border border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.5)]",
                maintenance: "bg-black text-cyan-400 border border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.5)]"
            }
        },
        {
            id: 'pop', name: 'Pop Art', colors: {
                operational: "bg-pink-500 text-white border-2 border-black",
                partial: "bg-purple-500 text-white border-2 border-black",
                major: "bg-black text-white border-2 border-white",
                maintenance: "bg-cyan-500 text-black border-2 border-black"
            }
        },
        {
            id: 'blueprint', name: 'Blueprint', colors: {
                operational: "bg-[#1e40af] text-white border border-white/50",
                partial: "bg-[#1e3a8a] text-white/70 border border-white/30",
                major: "bg-[#172554] text-white/50 border border-white/20",
                maintenance: "bg-[#2563eb] text-white border border-dashed border-white"
            }
        }
    ]
};

export const themes: Record<Theme, ThemeConfig> = {
    modern: {
        pageBg: "bg-zinc-950 bg-[radial-gradient(ellipse_at_top,rgba(120,119,198,0.15),transparent_50%)]",
        container: "max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 relative z-10",

        card: "bg-zinc-900/40 backdrop-blur-xl border border-white/10 shadow-xl ring-1 ring-black/5",
        cardHover: "hover:bg-zinc-900/60 hover:border-white/20 hover:shadow-2xl hover:scale-[1.01] transition-all duration-300",

        font: "font-sans",
        heading: "tracking-tight font-bold",
        mutedText: "text-zinc-400",

        rounded: "rounded-2xl",
        border: "border-white/10",
        shadow: "shadow-2xl shadow-black/50",

        noiseOpacity: "opacity-[0.03]",

        statusBadge: (status, colors) => {
            if (colors) {
                const map = { up: 'operational', maintenance: 'maintenance', down: 'major' } as const;
                const key = map[status];
                if (colors[key]) return `${colors[key]} whitespace-nowrap`;
            }

            // Keep default for fallback, but this should be overridden by dynamic palette
            if (status === 'up') return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.2)] whitespace-nowrap";
            if (status === 'maintenance') return "bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.2)] whitespace-nowrap";
            return "bg-red-500/10 text-red-400 border border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.2)] whitespace-nowrap";
        },

        bannerStyle: (isAllUp) => isAllUp
            ? "bg-zinc-900/50 backdrop-blur-2xl border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)]"
            : "bg-red-950/30 backdrop-blur-2xl border-red-500/30 shadow-[0_0_50px_rgba(239,68,68,0.1)]"
    },

    minimal: {
        pageBg: "bg-black",
        container: "max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 relative z-10",

        card: "bg-transparent border-b border-zinc-800",
        cardHover: "hover:bg-zinc-900/30 transition-colors duration-200",

        font: "font-sans tracking-tight",
        heading: "font-medium tracking-tighter",
        mutedText: "text-zinc-500",

        rounded: "rounded-none",
        border: "border-zinc-800",
        shadow: "shadow-none",

        noiseOpacity: "opacity-0",

        statusBadge: (status, colors) => {
            if (colors) {
                const map = { up: 'operational', maintenance: 'maintenance', down: 'major' } as const;
                const key = map[status];
                if (colors[key]) return `${colors[key]} whitespace-nowrap`;
            }

            if (status === 'up') return "text-emerald-500 font-mono text-[10px] uppercase tracking-widest border-b border-emerald-500/50 pb-0.5 whitespace-nowrap";
            if (status === 'maintenance') return "text-blue-500 font-mono text-[10px] uppercase tracking-widest border-b border-blue-500/50 pb-0.5 whitespace-nowrap";
            return "text-red-500 font-mono text-[10px] uppercase tracking-widest border-b border-red-500/50 pb-0.5 whitespace-nowrap";
        },

        bannerStyle: (isAllUp) => isAllUp
            ? "bg-transparent border border-zinc-800 border-l-4 border-l-white"
            : "bg-transparent border border-zinc-800 border-l-4 border-l-red-500"
    },

    brutal: {
        pageBg: "bg-[#121212] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-800/20 via-zinc-950 to-black",
        container: "max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 relative z-10",

        card: "bg-zinc-900 border-2 border-black shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)]",
        cardHover: "hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(255,255,255,0.2)] transition-all duration-200",

        font: "font-mono",
        heading: "font-bold uppercase tracking-widest",
        mutedText: "text-zinc-400",

        rounded: "rounded-md",
        border: "border-black",
        shadow: "shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)]",

        noiseOpacity: "opacity-[0.15]",

        statusBadge: (status, colors) => {
            if (colors) {
                const map = { up: 'operational', maintenance: 'maintenance', down: 'major' } as const;
                const key = map[status];
                if (colors[key]) return `${colors[key]} whitespace-nowrap`;
            }

            if (status === 'up') return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.2)] whitespace-nowrap";
            if (status === 'maintenance') return "bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.2)] whitespace-nowrap";
            return "bg-red-500/10 text-red-400 border border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.2)] whitespace-nowrap";
        },

        bannerStyle: (isAllUp) => isAllUp
            ? "bg-[#1E1E1E] border-2 border-zinc-700 shadow-[6px_6px_0px_0px_#3f3f46]"
            : "bg-red-900 border-2 border-red-500 shadow-[6px_6px_0px_0px_#ef4444]"
    }
};

// --- Helpers ---

export const tailwindHexMap: Record<string, string> = {
    emerald: '#10b981',
    green: '#22c55e',
    lime: '#84cc16',
    teal: '#14b8a6',
    cyan: '#06b6d4',
    sky: '#0ea5e9',
    blue: '#3b82f6',
    indigo: '#6366f1',
    violet: '#8b5cf6',
    purple: '#a855f7',
    fuchsia: '#d946ef',
    pink: '#ec4899',
    rose: '#f43f5e',
    red: '#ef4444',
    orange: '#f97316',
    amber: '#f59e0b',
    yellow: '#eab308',
    zinc: '#71717a',
    slate: '#64748b',
    stone: '#78716c',
    gray: '#6b7280',
    neutral: '#737373',
    white: '#ffffff',
    black: '#000000',
};

export function getBaseColor(classString: string | undefined): string {
    if (!classString) return 'emerald';
    const match = classString.match(/(?:bg|text)-([a-z]+)(?:-\d+)?/);
    return match ? match[1] : 'emerald';
}

export function getThemeColorHex(colorName: string): string {
    return tailwindHexMap[colorName] || '#10b981'; // Default to emerald hex
}
