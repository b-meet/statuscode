"use client";

import { EditorProvider } from "@/context/EditorContext";
import Sidebar from "@/components/editor/Sidebar";
import { useState } from "react";
import { ChevronLeft } from "lucide-react";

export default function EditorLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <EditorProvider>
            <EditorLayoutContent>{children}</EditorLayoutContent>
        </EditorProvider>
    );
}

function EditorLayoutContent({ children }: { children: React.ReactNode }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    return (
        <div className="flex bg-black text-white h-screen overflow-hidden">
            {/* 
              Sidebar Area 
              - Collapsible width
              - Scrollable
              - Contains controls
            */}
            {/* 
              Sidebar Area 
              - Collapsible width
              - Scrollable
              - Contains controls
            */}
            <div
                className={`${isSidebarOpen ? 'w-80 min-[1000px]:w-80 border-r' : 'w-0 min-[1000px]:w-0 border-none'} transition-all duration-300 ease-in-out flex flex-col border-zinc-800 bg-zinc-900 overflow-hidden
                    min-[1000px]:relative min-[1000px]:shrink-0
                    max-[1000px]:absolute max-[1000px]:top-0 max-[1000px]:bottom-0 max-[1000px]:z-[9999] max-[1000px]:shadow-2xl
                `}
            >
                <div className="w-80 h-full flex flex-col">
                    <Sidebar />
                </div>
            </div>

            {/* Collapse Toggle Button */}
            <div
                className={`flex flex-col justify-center transition-all duration-300 ease-in-out
                    min-[1000px]:relative min-[1000px]:z-[50] min-[1000px]:transform-none
                    max-[1000px]:absolute max-[1000px]:z-[9999] max-[1000px]:top-1/2 max-[1000px]:-translate-y-1/2
                    ${isSidebarOpen ? 'max-[1000px]:left-80' : 'max-[1000px]:left-0'}
                `}
            >
                <button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="absolute w-4 h-12 bg-zinc-800 border border-zinc-700 rounded-r-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors shadow-lg"
                    title={isSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
                >
                    <ChevronLeft className={`w-4 h-4 transition-transform duration-300 ${isSidebarOpen ? '' : 'rotate-180'}`} />
                </button>
            </div>

            {/* 
              Main Canvas Area 
              - Flexible width
              - Contains live preview
            */}
            <main className="flex-1 bg-zinc-950 flex flex-col min-w-0">
                {children}
            </main>
        </div>
    );
}

