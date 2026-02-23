"use client";

import { motion } from "framer-motion";
import { Palette, Zap, Shield, LayoutTemplate } from "lucide-react";

const features = [
    {
        icon: LayoutTemplate,
        title: "Interactive Timelines",
        description: "Uptime history that users actually want to scroll through.",
    },
    {
        icon: Zap,
        title: "Micro-Animations",
        description: "Smooth transitions that make \"System Operational\" feel like a premium feature.",
    },
    {
        icon: Shield,
        title: "One-Click Deploy",
        description: "Host it with us or export the code to your own stack.",
    },
    {
        icon: Palette,
        title: "Dark Mode by Default",
        description: "Because we know your users (and you) prefer it.",
    },
];

export function Features() {
    return (
        <section id="features" className="py-24 bg-zinc-50 dark:bg-zinc-900/30">
            <div className="container mx-auto px-6">
                <div className="mb-16 text-center">
                    <h2 className="text-3xl md:text-5xl font-bold text-zinc-900 dark:text-white mb-4">
                        Everything you need.
                    </h2>
                    <p className="text-lg text-zinc-600 dark:text-zinc-400">
                        We handle the complexity, you get the credit for looking good.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {features.map((feature, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: idx * 0.1 }}
                            viewport={{ once: true }}
                            className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/5 hover:border-statuscode-500/30 transition-colors"
                        >
                            <div className="w-12 h-12 rounded-lg bg-statuscode-100 dark:bg-statuscode-500/10 flex items-center justify-center text-statuscode-600 dark:text-statuscode-400 mb-4">
                                <feature.icon className="size-6" />
                            </div>
                            <h3 className="text-xl font-semibold text-zinc-900 dark:text-white mb-2">
                                {feature.title}
                            </h3>
                            <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                {feature.description}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
