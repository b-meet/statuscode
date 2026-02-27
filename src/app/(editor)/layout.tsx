"use client";

import { EditorProvider } from "@/context/EditorContext";
import Sidebar from "@/components/editor/Sidebar";
import { useState, Suspense } from "react";
import { ChevronLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function EditorLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <Suspense fallback={<div className="h-screen w-full flex items-center justify-center bg-black text-white">Loading Editor...</div>}>
            <EditorProvider>
                <EditorLayoutContent>{children}</EditorLayoutContent>
            </EditorProvider>
        </Suspense>
    );
}

function EditorLayoutContent({ children }: { children: React.ReactNode }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    return (
        <div className="flex bg-black text-white h-screen overflow-hidden relative">
            {/* Sidebar Area - Relative layout to avoid covering the canvas */}
            <motion.div
                initial={false}
                animate={{
                    width: isSidebarOpen ? 320 : 0,
                }}
                transition={{ duration: 0.3, ease: "linear" }}
                className={`flex-col border-zinc-800 bg-zinc-900 overflow-hidden relative shrink-0 hidden min-[800px]:flex
                    ${isSidebarOpen ? 'border-r' : 'border-none'}
                `}
            >
                <div className="w-[320px] h-full flex flex-col shrink-0">
                    <Sidebar />
                </div>
            </motion.div>

            {/* Collapse Toggle Button Container */}
            <div
                className="hidden min-[800px]:flex flex-col justify-center relative h-full z-[100] shrink-0"
            >
                <div className="relative">
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="w-4 h-12 bg-zinc-800 border border-zinc-700 rounded-r-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors shadow-lg -ml-[1px]"
                        title={isSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
                    >
                        <ChevronLeft className={`w-4 h-4 transition-transform duration-300 ${isSidebarOpen ? '' : 'rotate-180'}`} />
                    </button>
                </div>
            </div>

            {/* Main Canvas Area */}
            <main className="flex-1 bg-zinc-950 flex flex-col min-w-0 relative z-0">
                {children}
            </main>
        </div>
    );
}

