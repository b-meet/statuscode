
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
    statusBadge: (status: 'up' | 'down' | 'maintenance') => string;

    // Specifics
    noiseOpacity: string; // 'opacity-5' etc.
    bannerStyle: (isAllUp: boolean) => string;
}

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

        statusBadge: (status) => {
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

        statusBadge: (status) => {
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

        statusBadge: (status) => {
            if (status === 'up') return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.2)] whitespace-nowrap";
            if (status === 'maintenance') return "bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.2)] whitespace-nowrap";
            return "bg-red-500/10 text-red-400 border border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.2)] whitespace-nowrap";
        },

        bannerStyle: (isAllUp) => isAllUp
            ? "bg-[#1E1E1E] border-2 border-zinc-700 shadow-[6px_6px_0px_0px_#3f3f46]"
            : "bg-red-900 border-2 border-red-500 shadow-[6px_6px_0px_0px_#ef4444]"
    }
};
