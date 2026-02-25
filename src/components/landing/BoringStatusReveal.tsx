"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

export function BoringStatusReveal() {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"]
    });

    // --- Animation Transforms ---

    // 1. "Boring Page" Opacity and Fall
    // It stays visible until 0.4, then falls/fades by 0.7
    const pageOpacity = useTransform(scrollYProgress, [0.4, 0.6], [1, 0]);
    const pageY = useTransform(scrollYProgress, [0.4, 0.8], ["0%", "100%"]);

    // Debris Rotation/Scatter - We'll apply these to individual rows for "falling apart" feel
    const rotate1 = useTransform(scrollYProgress, [0.4, 0.8], [0, 45]);
    const x1 = useTransform(scrollYProgress, [0.4, 0.8], [0, -100]);

    const rotate2 = useTransform(scrollYProgress, [0.4, 0.8], [0, -25]);
    const x2 = useTransform(scrollYProgress, [0.4, 0.8], [0, 150]);

    const rotate3 = useTransform(scrollYProgress, [0.4, 0.8], [0, 15]);
    const x3 = useTransform(scrollYProgress, [0.4, 0.8], [0, 50]);

    // 2. "Reveal Text" Appearance
    // Unveils as the debris clears (0.5 -> 0.8)
    const revealScale = useTransform(scrollYProgress, [0.5, 0.9], [0.8, 1]);
    const revealOpacity = useTransform(scrollYProgress, [0.5, 0.8], [0, 1]);


    // 1.5. "Pre-break Shake"
    // Shakes violently just before falling (0.30 -> 0.4)
    const shakeX = useTransform(
        scrollYProgress,
        [0.20, 0.31, 0.32, 0.33, 0.34, 0.35, 0.36, 0.37, 0.38, 0.39, 0.4],
        [0, -5, 5, -5, 5, -5, 5, -5, 5, -5, 0]
    );

    return (
        <section ref={containerRef} className="relative h-[300vh] bg-zinc-950">
            {/* Sticky Viewport - Adjusted top to clear Navbar (approx 80px/top-20) */}
            <div className="sticky top-0 md:top-20 h-[calc(100vh-80px)] w-full overflow-hidden flex items-center justify-center z-10">

                {/* --- The Reveal (Underneath) --- */}
                <motion.div
                    style={{ scale: revealScale, opacity: revealOpacity }}
                    className="absolute inset-0 flex items-center justify-center z-10 p-6 pointer-events-none"
                >
                    <h2 className="text-5xl md:text-7xl lg:text-8xl font-black text-center max-w-5xl leading-tight tracking-tighter text-white">
                        Say{" "}
                        <span className="relative inline-block px-6 py-2 mx-2 -rotate-3 bg-statuscode-500 text-white rounded-lg shadow-[6px_6px_0px_rgba(0,0,0,0.2)] border-2 border-white/20 transform">
                            bye bye
                        </span>
                        {" "}to native{" "}
                        <span className="relative inline-block px-4 mx-1 rotate-2 bg-yellow-400 text-zinc-900 rounded-md shadow-[4px_4px_0px_rgba(0,0,0,0.15)] border border-yellow-500/50">
                            boring
                        </span>
                        {" "}status pages.
                    </h2>
                </motion.div>


                {/* --- The "Boring" Page (Overlay) --- */}
                <motion.div
                    style={{ opacity: pageOpacity, y: pageY, x: shakeX }}
                    className="absolute inset-0 z-20 flex flex-col bg-white overflow-hidden font-sans text-[#333333]"
                >
                    {/* Top Bar */}
                    <motion.div
                        style={{ y: x1 }}
                        className="w-full max-w-6xl mx-auto px-6 py-8 flex justify-between items-center"
                    >
                        <div className="flex items-center gap-4">
                            {/* Generic Logo */}
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-[#333] rounded-sm"></div>
                                <h1 className="text-2xl font-bold tracking-tight">System Status</h1>
                            </div>
                        </div>
                        <button className="bg-[#333333] hidden md:block text-white px-5 py-2 rounded font-medium text-sm hover:bg-gray-800 transition">
                            Subscribe to updates
                        </button>
                    </motion.div>

                    {/* Main Status Banner */}
                    <motion.div
                        style={{ rotate: rotate1, x: x2 }}
                        className="w-full bg-[#2fcc66] py-4 text-white text-center mb-12 shadow-sm"
                    >
                        <h2 className="text-xl md:text-2xl font-bold">All Systems Operational</h2>
                    </motion.div>

                    {/* Uptime Grid */}
                    <div className="w-full max-w-4xl mx-auto px-6 space-y-8">

                        {/* API */}
                        <motion.div style={{ x: x1, rotate: rotate2 }} className="space-y-2">
                            <div className="flex justify-between items-baseline mb-1">
                                <span className="font-bold text-lg text-[#333]">API</span>
                                <span className="text-[#2fcc66] font-medium text-sm">Operational</span>
                            </div>
                            <div className="flex gap-[2px] h-[34px]">
                                {[...Array(60)].map((_, i) => (
                                    <div key={i} className="flex-1 bg-[#2fcc66] rounded-[1px] opacity-90 hover:opacity-100" />
                                ))}
                            </div>
                        </motion.div>

                        {/* Inference Engine */}
                        <motion.div style={{ x: x3, rotate: rotate3 }} className="space-y-2">
                            <div className="flex justify-between items-baseline mb-1">
                                <span className="font-bold text-lg text-[#333]">Inference Engine</span>
                                <span className="text-[#2fcc66] font-medium text-sm">Operational</span>
                            </div>
                            <div className="flex gap-[2px] h-[34px]">
                                {[...Array(60)].map((_, i) => (
                                    <div key={i} className="flex-1 bg-[#2fcc66] rounded-[1px] opacity-90 hover:opacity-100" />
                                ))}
                            </div>
                        </motion.div>

                        {/* Labs */}
                        <motion.div style={{ x: x2, rotate: rotate1 }} className="space-y-2">
                            <div className="flex justify-between items-baseline mb-1">
                                <span className="font-bold text-lg text-[#333]">Labs</span>
                                <span className="text-[#2fcc66] font-medium text-sm">Operational</span>
                            </div>
                            <div className="flex gap-[2px] h-[34px]">
                                {[...Array(60)].map((_, i) => (
                                    <div key={i} className="flex-1 bg-[#2fcc66] rounded-[1px] opacity-90 hover:opacity-100" />
                                ))}
                            </div>
                        </motion.div>

                        {/* Playground */}
                        <motion.div style={{ x: x1, rotate: rotate3 }} className="space-y-2">
                            <div className="flex justify-between items-baseline mb-1">
                                <span className="font-bold text-lg text-[#333]">Playground</span>
                                <span className="text-[#2fcc66] font-medium text-sm">Operational</span>
                            </div>
                            <div className="flex gap-[2px] h-[34px]">
                                {[...Array(60)].map((_, i) => (
                                    <div key={i} className="flex-1 bg-[#2fcc66] rounded-[1px] opacity-90 hover:opacity-100" />
                                ))}
                            </div>
                        </motion.div>

                    </div>

                    {/* Footer/Past Incidents */}
                    <motion.div
                        style={{ y: pageY }}
                        className="w-full max-w-4xl mx-auto px-6 mt-16 border-t border-gray-200 pt-8"
                    >
                        <h3 className="text-xl font-bold mb-4">Past Incidents</h3>
                        <div className="space-y-4">
                            <div className="border-b border-gray-100 pb-4">
                                <p className="font-bold text-[#333]">Feb 12, 2025</p>
                                <p className="text-gray-500">No incidents reported today.</p>
                            </div>
                            <div className="border-b border-gray-100 pb-4">
                                <p className="font-bold text-[#333]">Feb 11, 2025</p>
                                <p className="text-gray-500">No incidents reported today.</p>
                            </div>
                        </div>
                    </motion.div>

                </motion.div>

            </div>
        </section>
    );
}


