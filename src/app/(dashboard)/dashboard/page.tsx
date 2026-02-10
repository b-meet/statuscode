"use client";

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import { Plus, ExternalLink, Activity, ArrowRight, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

interface Site {
    id: string;
    brand_name: string;
    subdomain: string;
    logo_url: string;
    uptimerobot_api_key?: string;
    monitors?: string[];
}

export default function DashboardPage() {
    const supabase = createClient();
    const [sites, setSites] = useState<Site[]>([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);

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
    }, []);

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
                    {sites.map((site) => (
                        <motion.div
                            key={site.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="group relative bg-[#09090b] border border-zinc-800 rounded-2xl overflow-hidden hover:border-zinc-700 transition-all hover:shadow-2xl hover:shadow-indigo-500/10"
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

                                {/* Status Dot */}
                                <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-black/50 backdrop-blur-sm border border-white/10 px-2 py-1 rounded-full">
                                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                    <span className="text-[10px] font-medium text-zinc-300">Live</span>
                                </div>
                            </div>

                            {/* Card Body */}
                            <div className="p-6 relative z-10 bg-[#09090b]">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <h3 className="font-bold text-lg text-white group-hover:text-indigo-400 transition-colors">{site.brand_name}</h3>
                                        <a
                                            href={`/s/${site.subdomain}`}
                                            target="_blank"
                                            className="text-xs text-zinc-500 hover:text-white flex items-center gap-1 mt-1 transition-colors"
                                        >
                                            {site.subdomain}.statuscode.in <ExternalLink className="w-3 h-3" />
                                        </a>
                                    </div>
                                </div>

                                {/* Metrics Section (Mock Data for now) */}
                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <div className="bg-zinc-900/50 rounded-lg p-3 border border-zinc-800/50">
                                        <div className="text-[10px] text-zinc-500 uppercase font-medium">Monitors</div>
                                        <div className="text-lg font-mono font-medium text-white">{site.monitors?.length || 0}</div>
                                    </div>
                                    <div className="bg-zinc-900/50 rounded-lg p-3 border border-zinc-800/50">
                                        <div className="text-[10px] text-zinc-500 uppercase font-medium">Uptime (30d)</div>
                                        <div className="text-lg font-mono font-medium text-emerald-400">99.9%</div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-3">
                                    <Link href="/editor" target="_blank" className="flex-1">
                                        <button className="w-full h-10 rounded-xl bg-white text-black text-sm font-semibold hover:bg-zinc-200 transition-all flex items-center justify-center gap-2 group/btn">
                                            Edit Design <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                                        </button>
                                    </Link>
                                    <button disabled className="h-10 w-10 rounded-xl border border-zinc-800 flex items-center justify-center text-zinc-500 hover:text-white hover:border-zinc-700 transition-colors">
                                        <Activity className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}

                    {/* Add New Project Card (Disabled for Free Plan simulation) */}
                    <div className="border border-dashed border-zinc-800 rounded-2xl p-6 flex flex-col items-center justify-center text-center gap-4 group hover:border-zinc-700 hover:bg-zinc-900/20 transition-all cursor-pointer">
                        <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center border border-zinc-800 group-hover:border-zinc-600 group-hover:scale-110 transition-all">
                            <Plus className="w-5 h-5 text-zinc-500 group-hover:text-white" />
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-white">Create New Project</h3>
                            <p className="text-xs text-zinc-500 mt-1">Upgrade to Pro to add more.</p>
                        </div>
                    </div>

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
