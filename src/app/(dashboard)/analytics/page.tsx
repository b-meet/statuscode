"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Activity, Clock, AlertTriangle, MonitorSmartphone } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { MonitorData, Log } from "@/lib/types";

export default function AnalyticsPage() {
    const supabase = createClient();
    const [monitors, setMonitors] = useState<MonitorData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchAnalyticsData();
    }, []);

    const fetchAnalyticsData = async () => {
        setIsLoading(true);
        setError(null);

        try {
            // 1. Get the unified API key from the user's sites
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("No active user session.");

            const { data: sites, error: sitesError } = await supabase
                .from("sites")
                .select("api_key, monitor_provider")
                .eq("user_id", user.id);

            if (sitesError) throw sitesError;

            // Find the first valid configured API key across sites
            const siteWithKey = sites?.find((s: any) => s.api_key);
            const apiKey = siteWithKey?.api_key;
            const monitorProvider = siteWithKey?.monitor_provider || 'uptimerobot';

            if (!apiKey) {
                // If no API key is configured yet, we can't show real analytics
                setIsLoading(false);
                return;
            }

            // 2. Fetch rich data from Provider via our proxy
            const res = await fetch("/api/monitors", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    apiKey,
                    monitorProvider,
                    response_times: 1, // Get recent response times for charting
                    custom_uptime_ratios: "30", // 30-day uptime
                    logs: 1 // Get recent incidents
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to fetch monitors");
            }

            setMonitors(data.monitors || []);
        } catch (err: any) {
            console.error("Analytics fetch error:", err);
            setError(err.message || "Failed to load analytics data.");
        } finally {
            setIsLoading(false);
        }
    };

    const calculateKPIs = () => {
        if (!monitors.length) return { uptime: "0.00", totalMonitors: 0, incidents: 0, avgResponse: 0, chartData: [] };

        // Global Uptime (Average of 30-day ratios)
        const totalRatio = monitors.reduce((sum: number, m: MonitorData) => sum + parseFloat(m.custom_uptime_ratio || "0"), 0);
        const globalUptime = (totalRatio / monitors.length).toFixed(2);

        // Incident Count (Logs of type 1 = Down)
        let totalIncidents = 0;
        let totalResponseTime = 0;
        let responseTimeCount = 0;

        // Process chart data map
        const timeMap = new Map<number, { sum: number; count: number }>();

        monitors.forEach((m: MonitorData) => {
            if (m.logs) {
                totalIncidents += m.logs.filter((log: Log) => log.type === 1).length;
            }
            if (m.response_times) {
                m.response_times.forEach((rt: any) => {
                    totalResponseTime += rt.value;
                    responseTimeCount++;

                    // Group by nearest 30 mins (1800 seconds) for clean chart aggregation
                    const roundedTime = Math.floor(rt.datetime / 1800) * 1800;
                    const existing = timeMap.get(roundedTime) || { sum: 0, count: 0 };
                    timeMap.set(roundedTime, { sum: existing.sum + rt.value, count: existing.count + 1 });
                });
            }
        });

        const avgResponse = responseTimeCount > 0 ? Math.round(totalResponseTime / responseTimeCount) : 0;

        // Format chart data
        const chartData = Array.from(timeMap.entries())
            .map(([time, stats]) => ({
                timeFormatted: new Date(time * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                dateFormatted: new Date(time * 1000).toLocaleDateString(),
                timestamp: time,
                responseTime: Math.round(stats.sum / stats.count)
            }))
            .sort((a, b) => a.timestamp - b.timestamp);

        return {
            uptime: globalUptime,
            totalMonitors: monitors.length,
            incidents: totalIncidents,
            avgResponse,
            chartData
        };
    };

    const kpis = calculateKPIs();

    return (
        <div className="space-y-12 pb-24">
            <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-10 border-b border-zinc-900/50">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Analytics</h1>
                    <p className="text-zinc-500 font-medium">Gain insights into your infrastructure reliability and performance.</p>
                </div>
            </header>

            {isLoading ? (
                <div className="flex items-center justify-center min-h-[40vh]">
                    <div className="w-8 h-8 border-2 border-zinc-800 border-t-emerald-400 rounded-full animate-spin" />
                </div>
            ) : error ? (
                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-center">
                    <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-3" />
                    <h3 className="text-white font-bold mb-1">Failed to load analytics</h3>
                    <p className="text-red-400/80 text-sm">{error}</p>
                </div>
            ) : monitors.length === 0 ? (
                <div className="bg-zinc-950 border border-zinc-900 rounded-3xl p-12 text-center">
                    <Activity className="w-12 h-12 text-zinc-800 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">No Data Available</h3>
                    <p className="text-zinc-500 max-w-md mx-auto">
                        Connect your providers API key in project settings and add monitors to see analytics.
                    </p>
                </div>
            ) : (
                <>
                    {/* Top Section: KPIs */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <KPICard
                            title="Global Uptime (30d)"
                            value={`${kpis.uptime}%`}
                            icon={<Activity className="w-4 h-4 text-emerald-400" />}
                            trend={parseFloat(kpis.uptime) >= 99 ? "Healthy" : "Needs Attention"}
                            trendPositive={parseFloat(kpis.uptime) >= 99}
                        />
                        <KPICard
                            title="Total Monitors"
                            value={kpis.totalMonitors.toString()}
                            icon={<MonitorSmartphone className="w-4 h-4 text-blue-400" />}
                            trend="Active Tracking"
                            trendPositive={true}
                        />
                        <KPICard
                            title="Avg Response Time"
                            value={`${kpis.avgResponse}ms`}
                            icon={<Clock className="w-4 h-4 text-amber-400" />}
                            trend={kpis.avgResponse < 500 ? "Fast" : "Slow"}
                            trendPositive={kpis.avgResponse < 500}
                        />
                        <KPICard
                            title="Recent Incidents"
                            value={kpis.incidents.toString()}
                            icon={<AlertTriangle className="w-4 h-4 text-rose-400" />}
                            trend={kpis.incidents === 0 ? "All Clear" : "Review Logs"}
                            trendPositive={kpis.incidents === 0}
                        />
                    </div>

                    {/* Middle Section: Chart Frame (Placeholder for Recharts) */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        <section className="lg:col-span-12 space-y-6">
                            <div className="flex items-center justify-between px-1">
                                <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">Performance Over Time</h2>
                            </div>
                            <div className="bg-zinc-950 border border-zinc-900 rounded-3xl p-8 min-h-[400px] flex items-center justify-center relative overflow-hidden group">
                                {/* Grid Background */}
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-900/20 via-zinc-950/0 to-transparent mix-blend-screen opacity-50" />
                                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />

                                <div className="text-center relative z-10">
                                    <Activity className="w-8 h-8 text-zinc-800 mx-auto mb-3" />
                                    <h3 className="text-zinc-400 font-medium">Chart Area Placeholder</h3>
                                    <p className="text-zinc-600 text-sm mt-1">Recharts implementation coming next</p>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Bottom Section: Details */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Unreliable Monitors */}
                        <div className="space-y-6">
                            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 px-1">Needs Attention</h2>
                            <div className="bg-zinc-950 border border-zinc-900 rounded-3xl p-6">
                                <div className="space-y-4">
                                    {/* Sort monitors by lowest uptime */}
                                    {[...monitors]
                                        .sort((a, b) => parseFloat(a.custom_uptime_ratio || "0") - parseFloat(b.custom_uptime_ratio || "0"))
                                        .slice(0, 3)
                                        .map((monitor) => (
                                            <div key={monitor.id} className="flex items-center justify-between p-4 rounded-2xl bg-[#0a0a0c] border border-zinc-900 hover:border-zinc-800 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-2 h-2 rounded-full ${parseFloat(monitor.custom_uptime_ratio) < 99 ? 'bg-amber-500' : 'bg-emerald-500'} shadow-[0_0_10px_currentColor]`} />
                                                    <span className="font-semibold text-white truncate max-w-[200px]">{monitor.friendly_name}</span>
                                                </div>
                                                <div className="text-right">
                                                    <span className={`text-sm font-black ${parseFloat(monitor.custom_uptime_ratio) < 99 ? 'text-amber-400' : 'text-emerald-400'}`}>
                                                        {monitor.custom_uptime_ratio}%
                                                    </span>
                                                    <p className="text-[10px] text-zinc-600 uppercase tracking-wider font-bold mt-0.5">Uptime</p>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        </div>

                        {/* Recent Incidents */}
                        <div className="space-y-6">
                            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 px-1">Recent Outages</h2>
                            <div className="bg-zinc-950 border border-zinc-900 rounded-3xl p-6">
                                <div className="space-y-4">
                                    {/* Flatten logs, filter down events, sort by date */}
                                    {monitors
                                        .flatMap((m: MonitorData) => (m.logs || []).map((l: Log) => ({ ...l, monitorName: m.friendly_name })))
                                        .filter((l: any) => l.type === 1) // Down
                                        .sort((a: any, b: any) => b.datetime - a.datetime)
                                        .slice(0, 3)
                                        .map((log: any, i: number) => (
                                            <div key={i} className="flex items-start gap-4 p-4 rounded-2xl bg-[#0a0a0c] border border-zinc-900 hover:border-zinc-800 transition-colors">
                                                <div className="w-8 h-8 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0 mt-0.5">
                                                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-bold text-white text-sm truncate">{log.monitorName}</h4>
                                                    <p className="text-zinc-500 text-xs mt-1">
                                                        Went down {new Date(log.datetime * 1000).toLocaleDateString()} at {new Date(log.datetime * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                    {log.duration > 0 && (
                                                        <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-zinc-900 text-zinc-400 text-[10px] font-bold mt-2">
                                                            <Clock className="w-3 h-3" />
                                                            {Math.floor(log.duration / 60)}m {log.duration % 60}s downtime
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}

                                    {monitors.every((m: MonitorData) => !m.logs || m.logs.filter((l: Log) => l.type === 1).length === 0) && (
                                        <div className="text-center py-8">
                                            <Activity className="w-6 h-6 text-emerald-500/50 mx-auto mb-2" />
                                            <p className="text-sm font-medium text-emerald-500">No recent incidents detected</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

// Helper Card Component
function KPICard({ title, value, icon, trend, trendPositive }: { title: string, value: string, icon: React.ReactNode, trend: string, trendPositive: boolean }) {
    return (
        <div className="bg-zinc-950 border border-zinc-900 rounded-3xl p-6 transition-all hover:border-zinc-800 group relative overflow-hidden">
            {/* Subtle gradient background based on trend */}
            <div className={`absolute -right-8 -top-8 w-32 h-32 blur-3xl rounded-full opacity-10 transition-opacity group-hover:opacity-20 ${trendPositive ? 'bg-emerald-500' : 'bg-rose-500'}`} />

            <div className="flex items-center gap-3 mb-6 relative z-10">
                <div className="w-8 h-8 rounded-xl bg-[#0a0a0c] border border-zinc-800 flex items-center justify-center shadow-inner">
                    {icon}
                </div>
                <h3 className="text-[10px] uppercase tracking-[0.2em] font-black text-zinc-500">{title}</h3>
            </div>

            <div className="relative z-10">
                <p className="text-4xl font-bold tracking-tighter text-white mb-2">{value}</p>
                <div className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${trendPositive ? 'bg-emerald-500' : 'bg-rose-500'} shadow-[0_0_10px_currentColor]`} />
                    <span className="text-xs font-bold text-zinc-400">{trend}</span>
                </div>
            </div>
        </div>
    );
}
