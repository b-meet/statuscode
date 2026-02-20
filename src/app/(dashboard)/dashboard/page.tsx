"use client";

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import { Plus, ExternalLink, Activity, ArrowRight, Loader2, Cog, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import { MaintenanceWindow } from "@/lib/types";
import { formatUptimePercentage } from "@/lib/utils";
import { toast } from "sonner";

interface Site {
    id: string;
    brand_name: string;
    subdomain: string;
    logo_url: string;
    uptimerobot_api_key?: string;
    monitors?: string[];
    theme_config?: {
        maintenance?: MaintenanceWindow[];
    };
    published_config?: {
        brand_name?: string;
        logo_url?: string;
        uptimerobot_api_key?: string;
        monitors?: string[];
        subdomain?: string;
        theme_config?: {
            maintenance?: MaintenanceWindow[];
        };
    };
}

export default function DashboardPage() {
    const supabase = createClient();
    const [sites, setSites] = useState<Site[]>([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [uptimeMap, setUptimeMap] = useState<Record<string, string | null>>({});

    useEffect(() => {
        async function loadDashboard() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return; // Middleware should handle redirect
            setUser(user);

            const { data: sitesData, error } = await supabase
                .from('sites')
                .select('*')
                .eq('user_id', user.id); // Show all sites for user

            if (sitesData) {
                setSites(sitesData);
            }
            setLoading(false);
        }
        loadDashboard();
    }, [supabase]);

    useEffect(() => {
        sites.forEach(async (site) => {
            if (uptimeMap[site.id] !== undefined) return; // Already requested

            // For dashboard display, prefer published monitor settings if they exist, else draft.
            const apiKey = site.published_config?.uptimerobot_api_key || site.uptimerobot_api_key;
            const monitors = (site.published_config?.monitors || site.monitors || []).filter(id => !id.startsWith('demo-'));

            if (!apiKey || monitors.length === 0) {
                setUptimeMap(prev => ({ ...prev, [site.id]: null }));
                return;
            }

            try {
                const res = await fetch("/api/uptimerobot/monitors", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        apiKey,
                        monitors: monitors.join('-'),
                        custom_uptime_ratios: '30'
                    }),
                });

                if (!res.ok) throw new Error("API responded with " + res.status);

                const data = await res.json();
                if (data.monitors && data.monitors.length > 0) {
                    const totalUptime = data.monitors.reduce((sum: number, m: any) => sum + parseFloat(m.custom_uptime_ratio || '0'), 0);
                    const avgUptime = totalUptime / data.monitors.length;
                    setUptimeMap(prev => ({ ...prev, [site.id]: avgUptime.toString() }));
                } else {
                    setUptimeMap(prev => ({ ...prev, [site.id]: null }));
                }
            } catch (err) {
                console.error("Failed to fetch uptime for site:", site.id, err);
                setUptimeMap(prev => ({ ...prev, [site.id]: null }));
            }
        });
    }, [sites, uptimeMap]);

    const handleRefreshUptime = (siteId: string) => {
        setUptimeMap(prev => {
            const next = { ...prev };
            delete next[siteId];
            return next;
        });
        toast.success("Refreshing uptime...");
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh] text-zinc-500 gap-3">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                <p className="text-sm">Loading your command center...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Projects</h1>
                    <p className="text-zinc-400 mt-2">Manage your status pages and monitors.</p>
                </div>

                {/* 
                  Future: "Create New Project" button 
                  For now, if they have 0 sites, we show a big empty state.
                  If they have sites, we assume they are on the free plan (1 site).
                */}
            </div>

            {/* Grid */}
            {sites.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sites.map((site) => {
                        const now = new Date().getTime();
                        const publishedMaintenance = site.published_config?.theme_config?.maintenance || [];

                        const activeMaint = publishedMaintenance.find(m => {
                            const start = new Date(m.startTime).getTime();
                            const end = start + m.durationMinutes * 60000;
                            return now >= start && now <= end;
                        });

                        const upcomingMaint = !activeMaint ? publishedMaintenance.find(m => {
                            const start = new Date(m.startTime).getTime();
                            return start > now && start <= now + 12 * 60 * 60 * 1000; // within 12 hours
                        }) : null;

                        // Check if site has been published
                        const isPublished = !!site.published_config;

                        // Simple JSON equality check for draft vs published state
                        // We check the fields that actually get published in api/sites/publish/route.ts
                        let hasDraftChanges = false;
                        if (isPublished) {
                            const draftState = {
                                brand_name: site.brand_name,
                                logo_url: site.logo_url,
                                uptimerobot_api_key: site.uptimerobot_api_key,
                                monitors: (site.monitors || []).filter((id: string) => !id.startsWith('demo-')),
                                theme_config: site.theme_config,
                                subdomain: site.subdomain,
                            };

                            const publishedState = {
                                brand_name: site.published_config?.brand_name,
                                logo_url: site.published_config?.logo_url,
                                uptimerobot_api_key: site.published_config?.uptimerobot_api_key,
                                monitors: site.published_config?.monitors || [],
                                theme_config: site.published_config?.theme_config,
                                subdomain: site.published_config?.subdomain,
                            };

                            hasDraftChanges = JSON.stringify(draftState) !== JSON.stringify(publishedState);
                        }

                        // Determine button text and color
                        let btnText = "Start Designing";
                        let btnClass = "w-full h-10 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500 transition-all flex items-center justify-center gap-2 group/btn";

                        const hasApiKey = !!(site.published_config?.uptimerobot_api_key || site.uptimerobot_api_key);

                        if (isPublished) {
                            if (hasDraftChanges) {
                                btnText = "Review Draft";
                                btnClass = "w-full h-10 rounded-xl bg-amber-500 text-black text-sm font-semibold hover:bg-amber-400 transition-all flex items-center justify-center gap-2 group/btn";
                            } else {
                                btnText = "Update Status";
                                btnClass = "w-full h-10 rounded-xl bg-white text-black text-sm font-semibold hover:bg-zinc-200 transition-all flex items-center justify-center gap-2 group/btn";
                            }
                        } else if (!hasApiKey) {
                            btnText = "Preview Editor";
                            btnClass = "w-full h-10 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 text-sm font-semibold hover:bg-zinc-800 hover:text-white transition-all flex items-center justify-center gap-2 group/btn";
                        }

                        return (
                            <motion.div
                                key={site.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="group relative bg-[#09090b] border border-zinc-800 rounded-2xl overflow-hidden hover:border-zinc-700 transition-all hover:shadow-2xl hover:shadow-indigo-500/10 h-full flex flex-col"
                            >
                                {/* Card Header (Preview Mock) */}
                                <div className="h-32 bg-zinc-900/50 border-b border-zinc-800 relative z-0 flex items-center justify-center p-6">
                                    {/* Abstract preview or Logo */}
                                    {site.logo_url ? (
                                        <img src={site.logo_url} alt={site.brand_name} className="h-12 w-auto object-contain opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500" />
                                    ) : (
                                        <div className="w-12 h-12 rounded-lg bg-zinc-800 flex items-center justify-center group-hover:bg-zinc-700 transition-colors">
                                            <Activity className="w-6 h-6 text-zinc-500" />
                                        </div>
                                    )}

                                    {/* Status Badges */}
                                    <div className="absolute top-4 right-4 text-right">
                                        {activeMaint ? (
                                            <div className="flex items-center gap-1.5 bg-blue-500/20 backdrop-blur-sm border border-blue-500/30 px-2 py-1 rounded-full shadow-lg">
                                                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                                                <span className="text-[10px] font-medium text-blue-300">In Maintenance</span>
                                            </div>
                                        ) : upcomingMaint ? (
                                            <div className="flex items-center gap-1.5 bg-amber-500/20 backdrop-blur-sm border border-amber-500/30 px-2 py-1 rounded-full shadow-lg">
                                                <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                                                <span className="text-[10px] font-medium text-amber-300">Upcoming Maint.</span>
                                            </div>
                                        ) : !hasApiKey ? (
                                            <div className="flex items-center gap-1.5 bg-amber-500/10 backdrop-blur-sm border border-amber-500/20 px-2 py-1 rounded-full">
                                                <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                                                <span className="text-[10px] font-medium text-amber-500/80">Add API Key</span>
                                            </div>
                                        ) : !isPublished ? (
                                            <div className="flex items-center gap-1.5 bg-zinc-800/50 backdrop-blur-sm border border-zinc-700/50 px-2 py-1 rounded-full">
                                                <div className="w-2 h-2 rounded-full bg-zinc-500" />
                                                <span className="text-[10px] font-medium text-zinc-400">Draft</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1.5 bg-black/50 backdrop-blur-sm border border-white/10 px-2 py-1 rounded-full">
                                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                                <span className="text-[10px] font-medium text-zinc-300">Live</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Card Body */}
                                <div className="p-6 relative z-10 bg-[#09090b] flex-1 flex flex-col">
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <h3 className="font-bold text-lg text-white group-hover:text-indigo-400 transition-colors">
                                                {site.brand_name || "Untitled Project"}
                                            </h3>
                                            {isPublished ? (
                                                <a
                                                    href={`/s/${site.subdomain}`}
                                                    target="_blank"
                                                    className="text-xs text-zinc-500 hover:text-white flex items-center gap-1 mt-1 transition-colors"
                                                >
                                                    {site.subdomain}.statuscode.in <ExternalLink className="w-3 h-3" />
                                                </a>
                                            ) : (
                                                <div className="text-xs text-zinc-400 flex items-center gap-2 mt-1">
                                                    <span className="opacity-70">{site.subdomain}.statuscode.in</span>
                                                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md border border-zinc-700 bg-zinc-800 text-zinc-300">Unpublished</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Metrics Section (Mock Data for now) */}
                                    <div className="grid grid-cols-2 gap-4 mb-6">
                                        <div className="bg-zinc-900/50 rounded-lg p-3 border border-zinc-800/50">
                                            <div className="text-[10px] text-zinc-500 uppercase font-medium">Monitors</div>
                                            <div className="text-lg font-mono font-medium text-white">{site.monitors?.length || 0}</div>
                                        </div>
                                        <div className="bg-zinc-900/50 rounded-lg p-3 border border-zinc-800/50 relative">
                                            <div className="flex items-center justify-between">
                                                <div className="text-[10px] text-zinc-500 uppercase font-medium">Uptime (30d)</div>
                                                {hasApiKey && (
                                                    <button
                                                        onClick={() => handleRefreshUptime(site.id)}
                                                        className="p-1 rounded-md hover:bg-zinc-800 text-zinc-600 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                                                        title="Refresh Uptime"
                                                    >
                                                        <RefreshCw className={`w-3 h-3 ${uptimeMap[site.id] === undefined ? 'animate-spin' : ''}`} />
                                                    </button>
                                                )}
                                            </div>
                                            <div className="text-lg font-mono font-medium text-emerald-400">
                                                {uptimeMap[site.id] === undefined ? (
                                                    <span className="text-zinc-600 animate-pulse">---.-%</span>
                                                ) : uptimeMap[site.id] === null ? (
                                                    <span className="text-zinc-500">0%</span>
                                                ) : (
                                                    `${formatUptimePercentage(uptimeMap[site.id], 2)}%`
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-3 mt-auto">
                                        <Link href="/editor" target="_blank" className="flex-1">
                                            <button className={btnClass}>
                                                {btnText} <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                                            </button>
                                        </Link>
                                        <button
                                            onClick={() => toast.info("Project settings coming soon!")}
                                            className="h-10 w-10 rounded-xl border border-zinc-800 flex items-center justify-center text-zinc-500 hover:text-white hover:border-zinc-700 transition-colors"
                                            title="Project Settings"
                                        >
                                            <Cog className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}

                    {/* Add New Project Card */}
                    <Link href="/setup?mode=create" className="block h-full">
                        <div className="h-full border border-dashed border-zinc-800 rounded-2xl p-6 flex flex-col items-center justify-center text-center gap-4 group hover:border-zinc-700 hover:bg-zinc-900/20 transition-all cursor-pointer">
                            <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center border border-zinc-800 group-hover:border-zinc-600 group-hover:scale-110 transition-all">
                                <Plus className="w-5 h-5 text-zinc-500 group-hover:text-white" />
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-white">Create New Project</h3>
                            </div>
                        </div>
                    </Link>

                </div>
            ) : (
                // Empty State
                <div className="flex flex-col items-center justify-center min-h-[400px] border border-dashed border-zinc-800 rounded-3xl bg-zinc-900/20">
                    <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center border border-zinc-800 mb-6">
                        <Activity className="w-8 h-8 text-zinc-600" />
                    </div>
                    <h2 className="text-xl font-bold text-white">No projects yet</h2>
                    <p className="text-zinc-500 mt-2 max-w-sm text-center">Get started by creating your first status page. It only takes a minute.</p>
                    <Link href="/setup">
                        {/* Sends back to setup flow starting from brand/connection. */}
                        <button className="mt-8 px-6 h-12 bg-white text-black rounded-full font-semibold hover:bg-zinc-200 transition-colors flex items-center gap-2">
                            <Plus className="w-4 h-4" /> Create Status Page
                        </button>
                    </Link>
                </div>
            )}
        </div>
    );
}
