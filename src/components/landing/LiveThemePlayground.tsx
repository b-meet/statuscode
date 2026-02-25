"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";

type Theme = {
    id: string;
    name: string;
    description: string;
    // Styling classes
    container: string;
    header: string;
    badge: string;
    gridBg: string;
    gridFill: string;
    font: string;
    button: string;
};

const THEMES: Theme[] = [
    {
        id: "modern",
        name: "Modern Glass",
        description: "Sleek, frosted aesthetics for forward-thinking brands.",
        container: "bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl",
        header: "text-white",
        badge: "bg-statuscode-500/20 text-statuscode-300 border border-statuscode-500/30 rounded-full",
        gridBg: "bg-white/5 rounded-sm",
        gridFill: "bg-statuscode-500 rounded-sm",
        font: "font-sans",
        button: "bg-zinc-800 text-white hover:bg-zinc-700 rounded-full"
    },
    {
        id: "minimal",
        name: "Swiss Minimal",
        description: "Pure function. Type-driven. Strictly grid-aligned.",
        container: "bg-white border-2 border-black rounded-none shadow-none",
        header: "text-black",
        badge: "bg-gray-100 text-black border border-black rounded-none",
        gridBg: "bg-gray-100 rounded-none",
        gridFill: "bg-black rounded-none",
        font: "font-mono",
        button: "bg-white text-black border border-black hover:bg-gray-50 rounded-none"
    },
    {
        id: "brutal",
        name: "Neo-Brutal",
        description: "High contrast. Bold borders. Unapologetic personality.",
        container: "bg-[#FFDEE2] border-4 border-black rounded-xl shadow-[8px_8px_0px_rgba(0,0,0,1)]",
        header: "text-black",
        badge: "bg-white text-black border-2 border-black rounded-lg shadow-[2px_2px_0px_rgba(0,0,0,1)]",
        gridBg: "bg-white border border-black rounded-md",
        gridFill: "bg-[#FF4D4D] border border-black rounded-sm",
        font: "font-sans",
        button: "bg-[#4D9FFF] text-black border-2 border-black hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all rounded-lg shadow-[4px_4px_0px_rgba(0,0,0,1)]"
    }
];

export function LiveThemePlayground() {
    const [activeTheme, setActiveTheme] = useState(THEMES[0]);

    return (
        <section className="py-24 md:py-32 relative overflow-hidden">
            {/* Background noise/grid if needed */}
            <div className="absolute inset-0 bg-grid-white/[0.02] -z-10" />

            <div className="container mx-auto px-6">

                {/* Section Header */}
                <div className="max-w-3xl mx-auto text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold mb-6 text-white">
                        Status pages soo premium & relevant.<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-statuscode-500 to-accent-500">
                            That you would break your app on purpose.
                        </span>
                    </h2>
                    <p className="text-lg text-zinc-400">
                        Statuscode adapts to your brand identity instantly. Own your layout, content, and vibe—turning dry data into a premium brand experience.
                    </p>
                </div>


                <div className="grid lg:grid-cols-12 gap-12 items-center">

                    {/* Controls (Left Side) */}
                    <div className="lg:col-span-4 space-y-4">
                        {THEMES.map((theme) => (
                            <button
                                key={theme.id}
                                onClick={() => setActiveTheme(theme)}
                                className={clsx(
                                    "w-full text-left p-6 rounded-xl border-2 transition-all duration-300 group",
                                    activeTheme.id === theme.id
                                        ? "border-statuscode-500 bg-statuscode-500/5 bg-statuscode-500/10 shadow-lg scale-[1.02]"
                                        : "border-transparent bg-zinc-50 bg-zinc-900/50 hover:bg-zinc-100 hover:bg-zinc-800"
                                )}
                            >
                                <div className="flex justify-between items-center mb-1">
                                    <h3 className={clsx(
                                        "font-bold text-lg",
                                        activeTheme.id === theme.id ? "text-statuscode-400" : "text-white"
                                    )}>
                                        {theme.name}
                                    </h3>
                                    {activeTheme.id === theme.id && (
                                        <motion.div layoutId="active-dot" className="w-2 h-2 rounded-full bg-statuscode-500" />
                                    )}
                                </div>
                                <p className="text-sm text-zinc-400">
                                    {theme.description}
                                </p>
                            </button>
                        ))}
                    </div>

                    {/* Preview Area (Right Side) */}
                    <div className="lg:col-span-8 relative flex justify-center items-center min-h-[500px]">

                        {/* Background Blob for Glass Contrast */}
                        <AnimatePresence>
                            {activeTheme.id === 'modern' && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    className="absolute inset-0 flex items-center justify-center -z-10"
                                >
                                    <div className="w-[120%] h-[120%] bg-gradient-to-tr from-statuscode-500/10 via-purple-500/10 to-blue-500/10 blur-3xl animate-pulse-slow rounded-full" />
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <motion.div
                            key={activeTheme.id}
                            initial={{ opacity: 0, scale: 0.95, rotate: 2 }}
                            animate={{ opacity: 1, scale: 1, rotate: 0 }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className={clsx(
                                "w-full max-w-2xl p-8 relative overflow-hidden transition-all duration-500 z-10",
                                activeTheme.container
                            )}
                        >
                            {/* Card Header */}
                            <div className="flex justify-between items-start mb-10">
                                <div>
                                    <div className={clsx("text-xs font-bold mb-2 uppercase tracking-wider", activeTheme.font, activeTheme.header === "text-black" ? "text-zinc-500" : "text-zinc-400")}>CURRENT STATUS</div>
                                    <h2 className={clsx("text-2xl", activeTheme.header, activeTheme.font)}>All Systems Operational</h2>
                                </div>
                                <span className={clsx("px-3 py-1 text-xs font-medium flex items-center gap-2", activeTheme.badge, activeTheme.font)}>
                                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                    LIVE
                                </span>
                            </div>

                            {/* Uptime Visualization */}
                            <div className="space-y-6 mb-10">
                                {['API Gateway', 'Core Database', 'CDN'].map((label) => (
                                    <div key={label} className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className={clsx("text-base font-bold", activeTheme.font, activeTheme.header === "text-black" ? "text-zinc-700" : "text-white")}>{label}</span>
                                            <span className={clsx("text-green-500", activeTheme.font)}>99.9%</span>
                                        </div>
                                        <div className="flex gap-[2px] h-8">
                                            {[...Array(40)].map((_, j) => (
                                                <motion.div
                                                    key={j}
                                                    initial={{ opacity: 0, scaleY: 0 }}
                                                    animate={{ opacity: 1, scaleY: 1 }}
                                                    transition={{ delay: j * 0.01 }}
                                                    className={clsx("flex-1", activeTheme.gridFill)}
                                                    style={{ opacity: Math.random() > 0.95 ? 0.4 : 1 }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Action BG */}
                            <div className="flex justify-end">
                                <button className={clsx("px-6 py-2 text-sm font-semibold transition-colors", activeTheme.button, activeTheme.font)}>
                                    View Incident History →
                                </button>
                            </div>

                        </motion.div>
                    </div>

                </div>
            </div>
        </section>
    );
}
