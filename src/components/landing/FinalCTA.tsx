"use client";

import { motion, useMotionTemplate, useMotionValue } from "framer-motion";
import { MouseEvent } from "react";
import Link from "next/link";

export function FinalCTA() {
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    function handleMouseMove({ currentTarget, clientX, clientY }: MouseEvent) {
        const { left, top } = currentTarget.getBoundingClientRect();
        mouseX.set(clientX - left);
        mouseY.set(clientY - top);
    }

    return (
        <section
            className="relative py-32 overflow-hidden bg-zinc-950 text-white group"
            onMouseMove={handleMouseMove}
        >
            {/* Ambient Background Glow that follows mouse slightly or just exists */}
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_50%_50%,_rgba(99,102,241,0.2),_transparent_70%)]" />

            <motion.div
                className="pointer-events-none absolute -inset-px opacity-0 transition duration-300 group-hover:opacity-100"
                style={{
                    background: useMotionTemplate`
                        radial-gradient(
                            650px circle at ${mouseX}px ${mouseY}px,
                            rgba(99, 102, 241, 0.15),
                            transparent 80%
                        )
                    `,
                }}
            />

            <div className="container relative z-10 mx-auto px-6 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="max-w-3xl mx-auto"
                >
                    <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-8">
                        Ready to make your status page{" "}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-statuscode-400 to-accent-400">
                            status-worthy?
                        </span>
                    </h2>
                    <p className="text-lg md:text-xl text-zinc-400 mb-12 max-w-2xl mx-auto">
                        Join engineering teams who have stopped settling for default.
                        Claim your username and start designing in minutes.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link href="/auth" className="relative group px-8 py-4 bg-white text-zinc-950 font-bold rounded-full text-lg overflow-hidden shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_-10px_rgba(255,255,255,0.5)] transition-shadow duration-300">
                            <span className="relative z-10 flex items-center gap-2">
                                Get Started for Free
                                <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                            </span>
                            <div className="absolute inset-0 bg-gradient-to-r from-statuscode-500 via-accent-500 to-statuscode-500 opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
                        </Link>
                        {/* 
                        <button className="px-8 py-4 text-zinc-300 font-medium hover:text-white transition-colors">
                            View Pricing →
                        </button> */}
                    </div>
                </motion.div>
            </div>

            {/* Decorative Particles/Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
        </section>
    );
}
