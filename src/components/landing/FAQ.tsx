"use client";

import { motion } from "framer-motion";
import { Plus, Minus } from "lucide-react";
import { useState } from "react";

const faqs = [
    {
        question: "What exactly is a \"Designer Layer\"?",
        answer: "Think of it as a premium skin for your data. You keep your existing monitoring service (like UptimeRobot) to do the heavy lifting of checking your servers, and Glaze acts as the front-end. We fetch that data and display it through high-end, animated templates that look custom-built."
    },
    {
        question: "Do I need to switch from my current monitoring tool?",
        answer: "Not at all. Glaze is built to be \"provider agnostic.\" We are launching with support for UptimeRobot, Better Stack, and Instatus. You just provide a read-only API key, and we handle the rest."
    },
    {
        question: "Will these animations slow down my site?",
        answer: "Efficiency is our priority. We use optimized libraries like Framer Motion and GSAP, and because we only fetch the essential status data, the impact on performance is negligible—often faster than the bulky default pages of legacy providers."
    },
    {
        question: "Can I host the status page on my own domain?",
        answer: "Yes. You can use a glaze.sh/yourbrand link for the fastest setup, or map it to your own custom subdomain (e.g., status.yourdomain.com) to keep your branding consistent."
    }
];

export function FAQ() {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    return (
        <section id="faq" className="py-24 bg-zinc-50 dark:bg-zinc-900/30 border-t border-zinc-200 dark:border-white/5 relative overflow-hidden">
            {/* Background Dots with Fade */}
            <div className="absolute inset-0 pointer-events-none z-0">
                <div
                    className="absolute inset-0 bg-[size:24px_24px] [mask-image:linear-gradient(to_top,black,transparent)] opacity-40 dark:opacity-30"
                    style={{
                        backgroundImage: "radial-gradient(#52525b 1.5px, transparent 1.5px)",
                    }}
                />
            </div>
            <div className="container mx-auto px-6 max-w-3xl relative z-10">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold text-zinc-900 dark:text-white mb-4">
                        Common Questions
                    </h2>
                    <p className="text-lg text-zinc-600 dark:text-zinc-400">
                        Everything you need to know about the product and billing.
                    </p>
                </div>

                <div className="space-y-4">
                    {faqs.map((faq, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.3, delay: idx * 0.1 }}
                            className="bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-white/5 overflow-hidden"
                        >
                            <button
                                onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                                className="flex items-center justify-between w-full p-6 text-left"
                            >
                                <span className="text-lg font-medium text-zinc-900 dark:text-white pr-8">
                                    {faq.question}
                                </span>
                                <span className={`flex-shrink-0 transition-transform duration-300 ${openIndex === idx ? "rotate-45" : ""}`}>
                                    <Plus className="size-5 text-glaze-500" />
                                </span>
                            </button>
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{
                                    height: openIndex === idx ? "auto" : 0,
                                    opacity: openIndex === idx ? 1 : 0
                                }}
                                transition={{ duration: 0.3 }}
                                className="overflow-hidden"
                            >
                                <div className="p-6 pt-0 text-zinc-600 dark:text-zinc-400 leading-relaxed border-t border-dashed border-zinc-100 dark:border-white/5 mt-2">
                                    {faq.answer}
                                </div>
                            </motion.div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
