"use client";

import { useState, memo } from "react";
import { Clock, ArrowRight } from "lucide-react";
import { themes, ThemeConfig } from "@/lib/themes";

interface RenderLayoutProps {
    layout: string;
    showHistoryOverlay: boolean;
    setShowHistoryOverlay: (show: boolean) => void;
    theme: ThemeConfig;
    header: React.ReactNode;
    banner: React.ReactNode;
    maintenanceBanner: React.ReactNode;
    monitors: React.ReactNode;
    history: React.ReactNode;
    maintenance: React.ReactNode;
}

const RenderLayout = memo(({
    layout,
    showHistoryOverlay,
    setShowHistoryOverlay,
    theme: t,
    header,
    banner,
    maintenanceBanner,
    monitors,
    history,
    maintenance
}: RenderLayoutProps) => {
    switch (layout) {
        case 'layout1': // Standard (Split Bottom)
            return (
                <>
                    {header}
                    {banner}
                    <div className="flex flex-col gap-12 sm:gap-20">
                        {monitors}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 sm:gap-16 mt-12">
                            {history}
                            {maintenance}
                        </div>
                    </div>
                </>
            );
        case 'layout2': // Split Middle
            return (
                <>
                    {header}
                    {banner}
                    <div className="flex flex-col gap-12 sm:gap-20">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 sm:gap-16">
                            <div className="lg:col-span-2 space-y-12">
                                {monitors}
                            </div>
                            <div className="lg:col-span-1">
                                {maintenance}
                            </div>
                        </div>
                        <div className="mt-12">
                            {history}
                        </div>
                    </div>
                </>
            );
        case 'layout3': // Stacked + Banner Maint
            return (
                <>
                    {maintenanceBanner}
                    {header}
                    {banner}
                    <div className="flex flex-col gap-12 sm:gap-20">
                        {monitors}
                        <div className="mt-12">
                            {history}
                        </div>
                    </div>
                </>
            );
        case 'layout4': // Minimal + History Link + Banner Maint
            if (showHistoryOverlay) {
                return (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <button
                            onClick={() => setShowHistoryOverlay(false)}
                            className={`mb-8 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 ${t.rounded} text-sm font-medium text-white transition-all flex items-center gap-2 group`}
                        >
                            <ArrowRight className="w-4 h-4 rotate-180 group-hover:-translate-x-1 transition-transform" />
                            Back to Status
                        </button>
                        {header}
                        <div className="mt-8">
                            {history}
                        </div>
                    </div>
                );
            }
            return (
                <>
                    {maintenanceBanner}
                    {header}
                    {banner}
                    <div className="flex flex-col gap-12 sm:gap-20">
                        {monitors}
                        <div className="flex justify-center pt-8 border-t border-white/5 mt-12">
                            <button
                                onClick={() => setShowHistoryOverlay(true)}
                                className={`px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 ${t.rounded} text-sm font-medium text-white transition-all flex items-center gap-2 group`}
                            >
                                <Clock className="w-4 h-4 text-white/50 group-hover:text-white transition-colors" />
                                View Incident History
                                <ArrowRight className="w-4 h-4 opacity-50 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </div>
                </>
            );
        default:
            return null;
    }
});

RenderLayout.displayName = 'RenderLayout';

interface StatusPageClientProps {
    layout: string;
    themeCode: string;
    header: React.ReactNode;
    banner: React.ReactNode;
    maintenanceBanner: React.ReactNode;
    monitors: React.ReactNode;
    history: React.ReactNode;
    maintenance: React.ReactNode;
    footer: React.ReactNode;
}

export default function StatusPageClient({
    layout,
    themeCode,
    header,
    banner,
    maintenanceBanner,
    monitors,
    history,
    maintenance,
    footer,
}: StatusPageClientProps) {
    const [showHistoryOverlay, setShowHistoryOverlay] = useState(false);
    const t = themes[themeCode as keyof typeof themes] || themes.modern;

    return (
        <div className={`${t.container} flex flex-col min-h-[90vh]`}>
            <RenderLayout
                layout={layout}
                showHistoryOverlay={showHistoryOverlay}
                setShowHistoryOverlay={setShowHistoryOverlay}
                theme={t}
                header={header}
                banner={banner}
                maintenanceBanner={maintenanceBanner}
                monitors={monitors}
                history={history}
                maintenance={maintenance}
            />
            {!showHistoryOverlay && footer}
        </div>
    );
}
