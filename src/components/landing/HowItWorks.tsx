"use client";

import { motion } from "framer-motion";
import { Plug, Palette, Sliders, Play, Rocket, Star } from "lucide-react";
import { useEffect, useState } from "react";

// Falling Star Component
// Falling Star Component
const FallingStar = ({ delay }: { delay: number }) => {
    return (
        <motion.div
            initial={{ x: -100, y: -100, opacity: 0 }}
            animate={{
                x: ["0vw", "100vw"],
                y: ["0vh", "100vh"],
                opacity: [0, 1, 0]
            }}
            transition={{
                duration: 3,
                repeat: Infinity,
                delay: delay,
                ease: "linear",
                repeatDelay: 2
            }}
            className="absolute top-0 left-0 w-[2px] h-[100px] bg-gradient-to-b from-transparent via-white to-transparent rotate-[-45deg] pointer-events-none z-0 shadow-[0_0_10px_rgba(255,255,255,0.5)]"
            style={{
                left: `${Math.random() * 100}%`,
                top: `-${Math.random() * 20}%`
            }}
        />
    );
};

export function HowItWorks() {
    const [stars, setStars] = useState<number[]>([]);

    useEffect(() => {
        setStars(Array.from({ length: 15 }, (_, i) => i));
    }, []);

    return (
        <section id="how-it-works" className="py-24 bg-zinc-50 dark:bg-zinc-900/10 relative overflow-hidden">
            {/* Background Stars */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                {stars.map((i) => (
                    <FallingStar key={i} delay={i * 2} />
                ))}
            </div>

            <div className="container mx-auto px-6 relative z-10">
                <div className="text-center mb-20">
                    <h2 className="text-3xl md:text-5xl font-bold text-zinc-900 dark:text-white mb-6">
                        How Glaze Works
                    </h2>
                    <p className="text-lg text-zinc-600 dark:text-zinc-400">
                        From clinical data to brand experience in minutes.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
                    {/* Step 1: Connect (Wide) */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="md:col-span-2 min-h-[300px] rounded-3xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 p-8 relative overflow-hidden group"
                    >
                        <div className="relative z-10 max-w-md">
                            <div className="w-10 h-10 rounded-xl bg-glaze-500/10 flex items-center justify-center text-glaze-500 mb-4">
                                <Plug className="size-5" />
                            </div>
                            <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">1. Connect Your Source</h3>
                            <p className="text-zinc-600 dark:text-zinc-400">Paste your read-only API key. We instantly sync monitors and history.</p>
                        </div>

                        {/* Mock: API Key Input */}
                        <div className="absolute right-0 bottom-8 w-2/3 md:w-1/2 translate-x-12 group-hover:translate-x-8 transition-transform duration-500">
                            <div className="rounded-l-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 p-4 shadow-xl">
                                <div className="space-y-3">
                                    <div className="h-2 w-16 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
                                    <div className="flex gap-2">
                                        <div className="h-10 flex-1 rounded-lg bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 flex items-center px-3 text-xs text-zinc-400 font-mono">
                                            ur12948-2948...
                                        </div>
                                        <div className="h-10 w-10 rounded-lg bg-green-500 flex items-center justify-center text-white">
                                            <Plug className="size-4" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-glaze-500/5 pointer-events-none" />
                    </motion.div>

                    {/* Step 2: Choose Vibe (Standard) */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="md:col-span-1 min-h-[300px] rounded-3xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 p-8 relative overflow-hidden group"
                    >
                        {/* Header */}
                        <div className="relative z-10">
                            <div className="w-10 h-10 rounded-xl bg-glaze-500/10 flex items-center justify-center text-glaze-500 mb-4">
                                <Palette className="size-5" />
                            </div>
                            <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">2. Choose Vibe</h3>
                            <p className="text-zinc-600 dark:text-zinc-400 text-sm">Minimalist White or Cyberpunk Dark.</p>
                        </div>

                        {/* Mock: Template Cards */}
                        <div className="absolute inset-x-0 bottom-0 h-40 flex justify-center gap-4 px-4 items-end">
                            {/* Card 1: Minimalist White (Silver/Zinc) */}
                            <div className="w-20 h-24 rounded-t-lg bg-zinc-200 border-t border-x border-zinc-300 translate-y-8 group-hover:translate-y-0 transition-transform duration-500 ease-out delay-0" />

                            {/* Card 2: Brand (Glaze Indigo) - Taller */}
                            <div className="w-20 h-32 rounded-t-lg bg-glaze-500 shadow-[0_0_30px_rgba(99,102,241,0.4)] z-10 translate-y-8 group-hover:translate-y-0 transition-transform duration-500 ease-out delay-75" />

                            {/* Card 3: Cyberpunk Dark (Black/Zinc-900) */}
                            <div className="w-20 h-28 rounded-t-lg bg-zinc-900 border-t border-x border-zinc-800 translate-y-8 group-hover:translate-y-0 transition-transform duration-500 ease-out delay-150" />
                        </div>
                    </motion.div>

                    {/* Step 3: Customize Motion (Standard) */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="md:col-span-1 min-h-[300px] rounded-3xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 p-8 relative overflow-hidden group"
                    >
                        <div className="relative z-10">
                            <div className="w-10 h-10 rounded-xl bg-glaze-500/10 flex items-center justify-center text-glaze-500 mb-4">
                                <Sliders className="size-5" />
                            </div>
                            <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">3. Tune Motion</h3>
                            <p className="text-zinc-600 dark:text-zinc-400 text-sm">Control animation intensity.</p>
                        </div>

                        {/* Mock: Sliders */}
                        <div className="absolute inset-x-6 bottom-8 space-y-3">
                            <div className="space-y-1">
                                <div className="flex justify-between text-[10px] uppercase tracking-wider text-zinc-400">
                                    <span>Pulse</span>
                                    <span>High</span>
                                </div>
                                <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-900 rounded-full overflow-hidden">
                                    <div className="h-full w-[80%] bg-glaze-500" />
                                </div>
                            </div>
                            <div className="space-y-1 opacity-60">
                                <div className="flex justify-between text-[10px] uppercase tracking-wider text-zinc-400">
                                    <span>Slide</span>
                                    <span>Med</span>
                                </div>
                                <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-900 rounded-full overflow-hidden">
                                    <div className="h-full w-[50%] bg-glaze-500" />
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Step 4: Preview (Wide) */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3 }}
                        className="md:col-span-2 min-h-[300px] rounded-3xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 p-8 relative overflow-hidden group"
                    >
                        <div className="relative z-10 max-w-sm">
                            <div className="w-10 h-10 rounded-xl bg-glaze-500/10 flex items-center justify-center text-glaze-500 mb-4">
                                <Play className="size-5" />
                            </div>
                            <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">4. Live Preview</h3>
                            <p className="text-zinc-600 dark:text-zinc-400">Check responsive layouts instantly. No deployments needed.</p>
                        </div>

                        {/* Mock: Responsive Preview */}
                        <div className="absolute right-8 bottom-0 flex items-end gap-4 translate-y-6 group-hover:translate-y-2 transition-transform duration-500">
                            {/* Mobile Mock */}
                            <div className="w-20 h-40 bg-zinc-900 rounded-t-2xl border-4 border-zinc-800 border-b-0 shadow-2xl relative z-20">
                                <div className="w-full h-full bg-zinc-950 rounded-t-lg p-2">
                                    <div className="h-2 w-8 bg-zinc-800 rounded-full mx-auto mb-2" />
                                    <div className="h-20 w-full bg-glaze-900/20 rounded-lg border border-glaze-500/20" />
                                </div>
                            </div>
                            {/* Desktop Mock */}
                            <div className="w-64 h-48 bg-zinc-900 rounded-t-xl border-4 border-zinc-800 border-b-0 shadow-2xl relative z-10 -ml-10">
                                <div className="w-full h-full bg-zinc-950 rounded-t-lg p-3">
                                    <div className="flex gap-2 mb-3">
                                        <div className="size-2 rounded-full bg-red-500/50" />
                                        <div className="size-2 rounded-full bg-yellow-500/50" />
                                        <div className="size-2 rounded-full bg-green-500/50" />
                                    </div>
                                    <div className="h-32 w-full bg-glaze-900/10 rounded-lg border border-glaze-500/10 p-2">
                                        <div className="flex justify-between items-center mb-4">
                                            <div className="h-2 w-16 bg-zinc-800 rounded-full" />
                                            <div className="h-4 w-12 bg-green-500/20 rounded-full" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-bl from-transparent via-transparent to-glaze-500/5 pointer-events-none" />
                    </motion.div>

                    {/* Step 5: Deploy (Full Width) */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.4 }}
                        className="md:col-span-3 min-h-[200px] rounded-3xl bg-zinc-950 border border-zinc-200 dark:border-white/10 p-8 flex flex-col md:flex-row items-center justify-between relative overflow-hidden group"
                    >
                        <div className="relative z-10 max-w-lg">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 rounded-lg bg-glaze-500/10 text-glaze-500">
                                    <Rocket className="size-5" />
                                </div>
                                <h3 className="text-xl font-bold text-white">5. Deploy Anywhere</h3>
                            </div>
                            <p className="text-zinc-400">
                                Launch on <code className="bg-white/5 px-1.5 py-0.5 rounded text-white border border-white/5">glaze.sh</code> or map to <code className="bg-white/5 px-1.5 py-0.5 rounded text-white border border-white/5">status.yours.com</code>.
                            </p>
                        </div>

                        <div className="relative z-10 mt-6 md:mt-0">
                            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-glaze-600 text-white font-bold shadow-lg shadow-glaze-500/20 group-hover:scale-105 transition-transform hover:bg-glaze-500 cursor-pointer">
                                <span>Launch Now</span>
                                <Rocket className="size-4" />
                            </div>
                        </div>

                        {/* Decor */}
                        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-glaze-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
