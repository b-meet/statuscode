import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import { Monitor, CheckCircle2, AlertTriangle, Activity, XCircle, ArrowRight, Clock, Calendar, BarChart3, Wifi, ArrowUpRight } from "lucide-react";
import { cookies } from "next/headers";
import { themes, Theme } from "@/lib/themes";
import { IncidentHistory } from "@/components/status-page/IncidentHistory";

// --- Types ---
interface MonitorData {
    id: number;
    friendly_name: string;
    url: string;
    status: number; // 2=up, 8=seems down, 9=down
    custom_uptime_ratio: string; // "100.00-99.98-99.50" (24h-7d-30d)
    response_times?: { datetime: number; value: number }[];
    logs?: { type: number; datetime: number; duration: number; reason: any }[];
}

// --- Helpers ---
function formatUptime(ratioString: string) {
    if (!ratioString) return { day: '0', week: '0', month: '0' };
    const parts = ratioString.split('-');
    return {
        day: parts[0] || '0',
        week: parts[1] || '0',
        month: parts[2] || '0'
    };
}

function getAverageResponseTime(times: { value: number }[] = []) {
    if (!times.length) return 0;
    const sum = times.reduce((acc, curr) => acc + curr.value, 0);
    return Math.round(sum / times.length);
}

function formatDate(timestamp: number) {
    return new Date(timestamp * 1000).toLocaleString('en-US', {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
}

// --- Data Fetching ---
async function getSite(subdomain: string) {
    const supabase = await createClient();
    const { data: site } = await supabase
        .from('sites')
        .select('*')
        .eq('subdomain', subdomain)
        .single();
    return site;
}

async function getMonitorStatuses(apiKey: string, monitorIds: string[]) {
    if (!apiKey) return [];

    try {
        const params = new URLSearchParams({
            api_key: apiKey,
            format: 'json',
            monitors: monitorIds.join('-'),
            custom_uptime_ratios: '1-7-30', // 24h, 7d, 30d
            response_times: '1',
            response_times_limit: '20', // Last 20 data points for sparkline
            logs: '1',
            logs_limit: '5' // Last 5 incidents
        });

        const res = await fetch(`https://api.uptimerobot.com/v2/getMonitors`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params,
            next: { revalidate: 60 }
        });

        const data = await res.json();
        return data.monitors || [];
    } catch (e) {
        console.error("Failed to fetch uptime status", e);
        return [];
    }
}

// --- Components ---

// Simple SVG Sparkline
const Sparkline = ({ data, color = "#6366f1" }: { data: { value: number }[], color?: string }) => {
    if (!data || data.length < 2) return null;

    const height = 40;
    const width = 120;
    const max = Math.max(...data.map(d => d.value));
    const min = Math.min(...data.map(d => d.value));
    const range = max - min || 1;

    const points = data.map((d, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = height - ((d.value - min) / range) * height; // Invert Y
        return `${x},${y}`;
    }).join(' ');

    return (
        <svg width={width} height={height} className="overflow-visible opacity-50 block">
            <polyline
                fill="none"
                stroke={color}
                strokeWidth="2"
                points={points}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
};

export default async function StatusPage({ params }: { params: Promise<{ subdomain: string }> }) {
    const { subdomain } = await params;

    const site = await getSite(subdomain);

    if (!site) {
        notFound();
    }

    let monitors: MonitorData[] = [];
    if (site.uptimerobot_api_key && site.monitors && site.monitors.length > 0) {
        monitors = await getMonitorStatuses(site.uptimerobot_api_key, site.monitors);
    }

    const downMonitors = monitors.filter((m) => m.status === 8 || m.status === 9);
    const isAllUp = downMonitors.length === 0;
    const themeName = (site.theme_config?.theme || 'modern') as Theme;
    const t = themes[themeName]; // Helper for current theme config
    const primaryColor = site.theme_config?.primaryColor || '#6366f1';

    // Aggregated Stats
    const totalAvgResponse = Math.round(
        monitors.reduce((acc, m) => acc + getAverageResponseTime(m.response_times), 0) / (monitors.length || 1)
    );

    return (
        <div className={`min-h-screen text-white selection:bg-indigo-500/30 font-sans ${t.pageBg}`}>

            {/* Global Noise Texture */}
            <div className={`fixed inset-0 pointer-events-none z-0 mix-blend-overlay ${t.noiseOpacity}`}
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E")` }}
            />

            {/* Huge Logo Background (Brutal Theme / Modern Theme Option) */}
            {site.logo_url && (
                <div
                    className="fixed top-0 right-0 w-[80vw] h-[80vh] opacity-[0.03] pointer-events-none z-0 grayscale mix-blend-screen"
                    style={{
                        backgroundImage: `url(${site.logo_url})`,
                        backgroundSize: 'contain',
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: '50% 50%',
                        filter: 'blur(80px)'
                    }}
                />
            )}

            <div className={`${t.container} flex flex-col min-h-[90vh]`}>

                {/* Header */}
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-16">
                    <div className="flex items-center gap-6">
                        {site.logo_url ? (
                            <img src={site.logo_url} alt="Logo" className={`w-16 h-16 object-contain p-2 bg-white/5 backdrop-blur-md border border-white/10 ${t.rounded}`} />
                        ) : (
                            <div className={`w-16 h-16 bg-white/5 backdrop-blur-md flex items-center justify-center border border-white/10 ${t.rounded}`}>
                                <Activity className="w-8 h-8 text-white/50" />
                            </div>
                        )}
                        <div>
                            <h1 className={`text-4xl text-white ${t.heading}`}>{site.brand_name}</h1>
                            <div className={`flex items-center gap-2 mt-2 ${t.mutedText} text-sm font-medium`}>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    Monitoring {monitors.length} services
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <button className={`px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-medium text-white transition-all backdrop-blur-md flex items-center gap-2 ${t.rounded}`}>
                            Updates <ArrowUpRight className="w-3.5 h-3.5 opacity-50" />
                        </button>
                    </div>
                </header>

                {/* Overall Status Banner */}
                <div className={`p-10 mb-20 relative overflow-hidden transition-all duration-500 group ${t.rounded} ${t.bannerStyle(isAllUp)}`}>

                    {/* Dynamic Glow */}
                    <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-gradient-to-br from-white/10 to-transparent rounded-full blur-3xl opacity-20 pointer-events-none group-hover:opacity-40 transition-opacity duration-700" />

                    <div className="flex flex-col md:flex-row items-center gap-10 relative z-10">
                        <div className={`p-6 rounded-full shrink-0 ${isAllUp ? "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.3)]" : "bg-red-500/10 text-red-500 ring-1 ring-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.3)]"}`}>
                            {isAllUp ? <CheckCircle2 className="w-10 h-10" /> : <AlertTriangle className="w-10 h-10" />}
                        </div>

                        <div className="text-center md:text-left flex-1">
                            <h2 className={`text-3xl text-white mb-2 ${t.heading} drop-shadow-sm`}>
                                {isAllUp ? "All Systems Operational" : "Major System Outage"}
                            </h2>
                            <p className={`${t.mutedText} text-lg leading-relaxed max-w-xl`}>
                                {isAllUp
                                    ? "All services are functioning normally. No active incidents reported."
                                    : "We are currently investigating a major service disruption. Check below for details."}
                            </p>
                        </div>

                        {/* Global Metrics Pill */}
                        <div className={`flex items-center gap-8 bg-black/20 p-6 backdrop-blur-sm border border-white/5 ${t.rounded}`}>
                            <div>
                                <div className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-1">Avg Latency</div>
                                <div className="text-2xl font-mono text-white flex items-baseline gap-1">
                                    {totalAvgResponse}<span className="text-sm text-white/40">ms</span>
                                </div>
                            </div>
                            <div className="w-px h-10 bg-white/10" />
                            <div>
                                <div className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-1">Uptime</div>
                                <div className="text-2xl font-mono text-emerald-400">99.9%</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Grid */}
                {/* Main Content Grid */}
                <div className="flex flex-col gap-12 sm:gap-20">

                    {/* Section 1: Monitors (Full Width) */}
                    <div className="space-y-6">
                        <h3 className={`text-xs ${t.mutedText} uppercase tracking-[0.2em] font-bold mb-6 flex items-center gap-2`}>
                            <Activity className="w-3 h-3" /> System Status
                        </h3>

                        {monitors.map((monitor) => {
                            const uptime = formatUptime(monitor.custom_uptime_ratio);
                            const avgResponse = getAverageResponseTime(monitor.response_times);
                            const isUp = monitor.status === 2;

                            return (
                                <div
                                    key={monitor.id}
                                    className={`group p-6 relative overflow-hidden ${t.card} ${t.cardHover} ${t.rounded}`}
                                >
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">

                                        {/* Status & Info */}
                                        <div className="flex items-start gap-5 min-w-[200px]">
                                            <div className="relative mt-1.5">
                                                <div className={`w-3 h-3 rounded-full ${isUp ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-red-500 shadow-[0_0_10px_#ef4444]'}`} />
                                                <div className={`absolute inset-0 w-3 h-3 rounded-full animate-ping opacity-20 ${isUp ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                            </div>
                                            <div>
                                                <h4 className={`text-lg text-white group-hover:text-indigo-300 transition-colors ${t.heading}`}>{monitor.friendly_name}</h4>
                                                <a href={monitor.url} target="_blank" className={`text-xs ${t.mutedText} hover:text-white transition-colors flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transform translate-y-1 group-hover:translate-y-0 duration-200`}>
                                                    {monitor.url} <ArrowUpRight className="w-2.5 h-2.5" />
                                                </a>
                                            </div>
                                        </div>

                                        {/* Metrics */}
                                        <div className="flex-1 flex items-center justify-between sm:justify-end gap-8 sm:gap-12">

                                            {/* Sparkline (Hidden on Minimal if desired, but keeping for now) */}
                                            <div className="hidden sm:block w-32 h-10 opacity-70 group-hover:opacity-100 transition-opacity">
                                                <Sparkline data={monitor.response_times || []} color={isUp ? "#10b981" : "#ef4444"} />
                                            </div>

                                            {/* Stats */}
                                            <div className="flex items-center gap-6 text-right">
                                                <div className="space-y-0.5">
                                                    <div className="text-[10px] text-white/30 uppercase tracking-wider font-semibold">Latency</div>
                                                    <div className="font-mono text-sm text-white/80">{avgResponse === 0 ? <span className="text-white/30">-</span> : `${avgResponse}ms`}</div>
                                                </div>
                                                <div className="space-y-0.5">
                                                    <div className="text-[10px] text-white/30 uppercase tracking-wider font-semibold">24h</div>
                                                    <div className={`font-mono text-sm font-bold ${parseFloat(uptime?.day || '0') === 100 ? 'text-emerald-400' : uptime ? 'text-yellow-400' : 'text-zinc-600'}`}>{uptime ? `${uptime.day}%` : '-'}</div>
                                                </div>
                                            </div>

                                            {/* Badge */}
                                            <div className={t.statusBadge(isUp).replace("absolute", "") + " px-3 py-1 text-xs rounded-full font-medium shrink-0"}>
                                                {isUp ? 'OPERATIONAL' : 'DOWN'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Section 2: History & Maintenance (Side-by-Side Grid) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 sm:gap-16">

                        {/* Incident Timeline */}
                        <div className="relative">
                            <IncidentHistory
                                logs={monitors.some(m => m.logs && m.logs.length > 0)
                                    ? monitors.flatMap(m => m.logs?.map(l => ({ ...l, monitorName: m.friendly_name })) || [])
                                        .sort((a, b) => b.datetime - a.datetime)
                                    : []
                                }
                                theme={t}
                            />
                        </div>

                        {/* Scheduled Maintenance */}
                        <div>
                            <h3 className={`text-xs ${t.mutedText} uppercase tracking-[0.2em] font-bold mb-6 flex items-center gap-2`}>
                                <Calendar className="w-3 h-3" /> Scheduled Maintenance
                            </h3>
                            <div className={`p-8 text-center border border-dashed border-white/10 ${t.card} ${t.rounded}`}>
                                <div className="w-12 h-12 mx-auto rounded-full bg-white/5 flex items-center justify-center mb-4 border border-white/5">
                                    <Calendar className="w-6 h-6 text-white/20" />
                                </div>
                                <h4 className="text-sm font-medium text-white/80">All Systems Go</h4>
                                <p className={`text-xs ${t.mutedText} mt-2`}>No maintenance windows are currently scheduled.</p>
                            </div>
                        </div>

                    </div>
                </div>

                {/* Footer */}
                <footer className="mt-auto pt-24 pb-8 flex items-center justify-center">
                    <a href="https://statuscode.in" className={`text-xs ${t.mutedText} hover:text-white transition-colors flex items-center gap-2 group`}>
                        <div className="w-2 h-2 rounded-full bg-indigo-500 group-hover:scale-125 transition-transform" />
                        Powered by <span className="font-bold text-white tracking-wide">Statuscode</span>
                    </a>
                </footer>

            </div>
        </div>
    );
}
