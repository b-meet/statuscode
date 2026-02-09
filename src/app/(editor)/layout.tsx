"use client";

import { EditorProvider } from "@/context/EditorContext";
import Sidebar from "@/components/editor/Sidebar";

export default function EditorLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <EditorProvider>
            <div className="flex bg-black text-white h-screen overflow-hidden">
                {/* 
                  Sidebar Area 
                  - Fixed width: 320px
                  - Scrollable
                  - Contains controls
                */}
                <Sidebar />

                {/* 
                  Main Canvas Area 
                  - Flexible width
                  - Contains live preview
                */}
                <main className="flex-1 bg-zinc-950 flex flex-col min-w-0">
                    {children}
                </main>
            </div>
        </EditorProvider>
    );
}
