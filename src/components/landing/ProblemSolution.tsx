"use client";

import { motion } from "framer-motion";

export function ProblemSolution() {
    return (
        <section className="py-20 bg-white dark:bg-black border-y border-zinc-200 dark:border-white/5">
            <div className="container mx-auto px-6">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    {/* The Problem */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                    >
                        <h2 className="text-sm font-bold tracking-wider text-rose-500 uppercase mb-4">
                            The Problem
                        </h2>
                        <h3 className="text-3xl md:text-4xl font-bold text-zinc-900 dark:text-white mb-6">
                            Stop settling for &quot;Standard&quot;.
                        </h3>
                        <p className="text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed">
                            Most status pages are gray, static, and clinical. They tell your users when things are down, but they don&apos;t reflect the quality of your product.
                        </p>
                    </motion.div>

                    {/* The Solution */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="bg-zinc-50 dark:bg-zinc-900/50 p-8 rounded-2xl border border-zinc-200 dark:border-white/5"
                    >
                        <h2 className="text-sm font-bold tracking-wider text-glaze-500 uppercase mb-4">
                            The Designer Layer
                        </h2>
                        <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">
                            Statuscode doesn&apos;t replace your monitoring; it elevates it.
                        </h3>
                        <p className="text-base text-zinc-600 dark:text-zinc-400 leading-relaxed mb-6">
                            Keep using UptimeRobot, Better Stack, Cronitor, Checkly, or Instatus for the data—use Statuscode to make it beautiful.
                        </p>

                        <ul className="space-y-3">
                            {[
                                "Plug & Play: Connect existing API keys in seconds.",
                                "High-Motion Templates: Powered by Framer Motion.",
                                "Total Brand Control: Custom fonts, fluid grids, and animations."
                            ].map((item, i) => (
                                <li key={i} className="flex items-start gap-3">
                                    <span className="flex-shrink-0 size-5 rounded-full bg-glaze-500/10 text-glaze-500 flex items-center justify-center text-xs">✓</span>
                                    <span className="text-zinc-700 dark:text-zinc-300 text-sm font-medium">{item}</span>
                                </li>
                            ))}
                        </ul>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
