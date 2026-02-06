"use client";

import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Server, Activity } from "lucide-react";

export function IntegrationShowcase() {
    return (
        <section id="integrations" className="py-24 overflow-hidden">
            <div className="container mx-auto px-6">
                <div className="flex flex-col lg:flex-row items-center gap-16">
                    <div className="lg:w-1/2">
                        <h2 className="text-3xl md:text-5xl font-bold text-zinc-900 dark:text-white mb-6">
                            Connects with your existing tools.
                        </h2>
                        <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-8 leading-relaxed">
                            You don't need to change how you monitor uptime. Statuscode sits on top of your existing providers to give you a stunning public face.
                        </p>

                        <div className="grid grid-cols-2 gap-4">
                            {[
                                "UptimeRobot",
                                "Better Stack",
                                "Cronitor",
                                "Checkly",
                                "Instatus"
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900/50">
                                    <CheckCircle2 className="size-5 text-glaze-500 flex-shrink-0" />
                                    <span className="font-medium text-zinc-800 dark:text-zinc-200">{item}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="lg:w-1/2 w-full">
                        <div className="relative rounded-2xl bg-zinc-100 dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/5 p-8 md:p-12">
                            <div className="flex justify-between items-center mb-12">
                                {/* Source App (e.g. UptimeRobot) */}
                                <motion.div
                                    initial={{ x: -20, opacity: 0 }}
                                    whileInView={{ x: 0, opacity: 1 }}
                                    transition={{ duration: 0.5 }}
                                    className="w-24 h-24 rounded-xl bg-white dark:bg-zinc-800 shadow-xl flex flex-col items-center justify-center gap-2 border border-zinc-200 dark:border-white/5"
                                >
                                    <Activity className="size-8 text-green-500" />
                                    <span className="text-xs font-medium text-zinc-500">Monitor</span>
                                </motion.div>

                                {/* Connection Animation */}
                                <div className="flex-1 flex items-center justify-center relative px-4">
                                    <div className="h-0.5 w-full bg-zinc-300 dark:bg-zinc-700 relative overflow-hidden">
                                        <motion.div
                                            animate={{ x: ["-100%", "100%"] }}
                                            transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                                            className="absolute inset-0 bg-glaze-500 w-1/2"
                                        />
                                    </div>
                                    <div className="absolute bg-white dark:bg-zinc-950 p-2 rounded-full border border-zinc-200 dark:border-zinc-800">
                                        <ArrowRight className="size-4 text-zinc-400" />
                                    </div>
                                </div>

                                {/* Glaze */}
                                <motion.div
                                    initial={{ x: 20, opacity: 0 }}
                                    whileInView={{ x: 0, opacity: 1 }}
                                    transition={{ duration: 0.5 }}
                                    className="w-24 h-24 rounded-xl bg-gradient-to-br from-glaze-500 to-glaze-600 shadow-xl shadow-glaze-500/20 flex flex-col items-center justify-center gap-2 text-white"
                                >
                                    <Server className="size-8" />
                                    <span className="text-xs font-medium text-white/90">Statuscode</span>
                                </motion.div>
                            </div>

                            <div className="bg-white dark:bg-zinc-950 rounded-lg p-4 shadow-sm border border-zinc-200 dark:border-white/5">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                                    <span className="text-xs font-mono text-green-600 dark:text-green-400">api.statuscode.in is operational</span>
                                </div>
                                <div className="h-1 w-full bg-zinc-100 dark:bg-zinc-900 rounded-full overflow-hidden">
                                    <div className="h-full w-full bg-green-500" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
