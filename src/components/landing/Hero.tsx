"use client";

import { motion } from "framer-motion";
import { PhysicsBadges } from "./PhysicsBadges";
import { WaitlistForm } from "./WaitlistForm";

export function Hero() {

    return (
        <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden min-h-[90vh] flex flex-col justify-center">

            {/* Physics Layer */}
            <PhysicsBadges />

            {/* Background Gradients */}
            <div className="absolute top-0 right-0 -z-10 opacity-40 dark:opacity-20 translate-x-1/3 -translate-y-1/4">
                <div className="w-[800px] h-[800px] bg-glaze-400/30 rounded-full blur-[120px]" />
            </div>
            <div className="absolute bottom-0 left-0 -z-10 opacity-40 dark:opacity-20 -translate-x-1/3 translate-y-1/4">
                <div className="w-[600px] h-[600px] bg-accent-500/30 rounded-full blur-[100px]" />
            </div>

            <div className="container mx-auto px-6 flex flex-col items-center text-center">

                {/* Coming Soon Pill */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white dark:bg-white/10 border border-zinc-200 dark:border-white/10 mb-8 shadow-sm backdrop-blur-sm relative z-30"
                >
                    <span className="flex h-2 w-2 rounded-full bg-glaze-500 animate-pulse"></span>
                    <span className="text-sm font-medium text-zinc-600 dark:text-zinc-200">
                        Coming Soon v1.0
                    </span>
                </motion.div>

                {/* Headline */}
                <div className="relative z-30 mb-6 max-w-4xl pointer-events-none select-none">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-zinc-900 dark:text-white"
                    >
                        Status Pages, <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-glaze-500 to-accent-500">
                            Elevated by Design.
                        </span>
                    </motion.h1>
                </div>

                {/* Subtext */}
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="text-lg md:text-xl text-zinc-600 dark:text-zinc-400 max-w-3xl mb-10 leading-relaxed relative z-30"
                >
                    Your brand isn&apos;t basic. Your status page shouldn&apos;t be either. Statuscode is the designer layer that sits on top of your existing uptime monitors, turning clinical data into a premium brand experience.
                </motion.p>

                {/* Form & Actions */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="flex flex-col items-center gap-6 w-full relative z-30"
                >
                    <WaitlistForm />
                    <div className="flex flex-col items-center gap-2">

                        <p className="text-xs text-zinc-400 dark:text-zinc-600">
                            No credit card required. Free tier included.
                        </p>
                    </div>
                </motion.div>

                {/* Abstract dashboard preview placeholder */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 40 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
                    className="mt-20 relative w-full max-w-5xl aspect-[16/9] rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-zinc-900/50 shadow-2xl overflow-hidden z-30"
                >
                    <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-zinc-950 via-transparent to-transparent z-10" />

                    {/* Disclaimer Badge */}
                    <div className="absolute bottom-4 right-4 z-20 px-3 py-1 rounded-full bg-zinc-900/80 dark:bg-black/80 backdrop-blur text-[10px] font-medium text-zinc-400 border border-white/10">
                        Placeholder Concept. Actual templates vary.
                    </div>

                    {/* Mock Data Vis */}
                    <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-6 opacity-90">
                        {/* Box 1: Uptime Chart */}
                        <div className="col-span-1 md:col-span-2 h-64 rounded-xl bg-white dark:bg-zinc-800/50 border border-zinc-200 dark:border-white/5 p-6 flex flex-col justify-between relative overflow-hidden">
                            <div className="flex justify-between items-start z-10">
                                <div>
                                    <h4 className="text-zinc-500 dark:text-zinc-400 text-sm font-medium mb-1">System Uptime</h4>
                                    <span className="text-3xl font-bold text-zinc-900 dark:text-white">99.99%</span>
                                </div>
                                <div className="px-2 py-1 rounded bg-green-500/10 text-green-500 text-xs font-medium">
                                    Last 90 days
                                </div>
                            </div>

                            {/* Mock Chart */}
                            <div className="flex items-end gap-1 h-32 mt-4 z-10">
                                {[...Array(24)].map((_, i) => {
                                    // Use i to get a deterministic "random" height for the mock chart
                                    // to avoid calling Math.random() directly in render
                                    const h = 30 + (Math.abs(Math.sin(i * 1.5)) * 70);
                                    return (
                                        <div
                                            key={i}
                                            className="flex-1 bg-glaze-500/20 dark:bg-glaze-500/20 rounded-t-sm"
                                            style={{ height: `${h}%` }}
                                        >
                                            <div className="w-full bg-glaze-500 dark:bg-glaze-500 rounded-t-sm opacity-80" style={{ height: '100%' }} />
                                        </div>
                                    );
                                })}
                            </div>
                            {/* Glow effect */}
                            <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-glaze-500/10 to-transparent pointer-events-none" />
                        </div>

                        {/* Box 2: Current Status */}
                        <div className="col-span-1 h-64 rounded-xl bg-white dark:bg-zinc-800/50 border border-zinc-200 dark:border-white/5 p-6 flex flex-col items-center justify-center text-center relative overflow-hidden">
                            <div className="absolute inset-0 bg-green-500/5 animate-pulse" />
                            <div className="size-16 rounded-full bg-green-500/10 flex items-center justify-center mb-4 relative z-10">
                                <div className="size-3 rounded-full bg-green-500 shadow-[0_0_20px_rgba(34,197,94,0.5)]" />
                            </div>
                            <h4 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2 relative z-10">All Systems Operational</h4>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400 relative z-10">
                                Everything is running smoothly.
                            </p>
                        </div>

                        {/* Box 3: Incident History */}
                        <div className="col-span-1 h-40 rounded-xl bg-white dark:bg-zinc-800/50 border border-zinc-200 dark:border-white/5 p-5 flex flex-col justify-between">
                            <h4 className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">Past Incidents</h4>
                            <div className="space-y-3">
                                {[1, 2].map((_, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <div className="size-2 rounded-full bg-zinc-300 dark:bg-zinc-600" />
                                        <div className="h-2 w-24 bg-zinc-100 dark:bg-zinc-700 rounded-full" />
                                        <div className="h-2 w-12 bg-zinc-100 dark:bg-zinc-700 rounded-full ml-auto" />
                                    </div>
                                ))}
                                <div className="flex items-center gap-3">
                                    <div className="size-2 rounded-full bg-green-500" />
                                    <div className="h-2 w-32 bg-zinc-100 dark:bg-zinc-700 rounded-full" />
                                    <span className="text-[10px] text-zinc-400 ml-auto">Resolved</span>
                                </div>
                            </div>
                        </div>

                        {/* Box 4: Service Health */}
                        <div className="col-span-1 md:col-span-2 h-40 rounded-xl bg-white dark:bg-zinc-800/50 border border-zinc-200 dark:border-white/5 p-5 flex flex-col">
                            <div className="flex justify-between items-center mb-4">
                                <h4 className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">Service Health</h4>
                                <span className="text-xs text-green-500 font-medium bg-green-500/10 px-2 py-0.5 rounded">100% Valid</span>
                            </div>
                            <div className="grid grid-cols-3 gap-4 h-full">
                                {['API', 'Dashboard', 'Database'].map((label, i) => (
                                    <div key={i} className="flex flex-col justify-end p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/5">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="size-1.5 rounded-full bg-green-500" />
                                            <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">{label}</span>
                                        </div>
                                        <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-1 rounded-full overflow-hidden">
                                            <div className="bg-green-500 h-full w-full" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
