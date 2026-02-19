import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import { Monitor, CheckCircle2, AlertTriangle, Activity, XCircle, ArrowRight, Clock, Calendar, BarChart3, Wifi, ArrowUpRight } from "lucide-react";
import { cookies } from "next/headers";
import { themes, Theme } from "@/lib/themes";
import { IncidentHistory } from "@/components/status-page/IncidentHistory";
import StatusPageClient from "@/components/status-page/StatusPageClient";

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

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
            logs_limit: '50' // Last 50 incidents
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

    const siteData = await getSite(subdomain);

    if (!siteData || !siteData.published_config) {
        notFound();
    }

    const site = siteData.published_config as any;
    const monitorIds = (site.monitors || []) as string[];

    const demoIds = monitorIds.filter(id => id.startsWith('demo-'));
    const realIds = monitorIds.filter(id => !id.startsWith('demo-'));

    let monitors: MonitorData[] = [];

    // Add Demo Monitors
    if (demoIds.length > 0) {
        const { getDemoMonitors } = require('@/lib/mockMonitors');
        const allDemos = getDemoMonitors();
        const selectedDemos = allDemos.filter((dm: MonitorData) =>
            demoIds.includes(`demo-${Math.abs(dm.id)}`)
        );
        monitors = [...selectedDemos];
    }

    // Add Real Monitors
    if (realIds.length > 0 && site.uptimerobot_api_key) {
        const realMonitors = await getMonitorStatuses(site.uptimerobot_api_key, realIds);
        monitors = [...monitors, ...realMonitors];
    }

    // Merge Custom Logs
    const customLogs = site.theme_config?.customLogs || {};
    monitors = monitors.map(m => {
        const mId = String(m.id);
        const custom = customLogs[mId] || [];
        if (custom.length === 0) return m;

        const combined = [...(m.logs || []), ...custom].sort((a, b) => b.datetime - a.datetime);
        return { ...m, logs: combined };
    });

    const downMonitors = monitors.filter((m) => m.status === 8 || m.status === 9);
    const isAllUp = downMonitors.length === 0;
    const themeName = (site.theme_config?.theme || 'modern') as Theme;
    const colorPreset = site.theme_config?.colorPreset || 'default';
    const t = themes[themeName]; // Helper for current theme config
    const primaryColor = site.theme_config?.primaryColor || '#6366f1';

    // Aggregated Stats
    const totalAvgResponse = Math.round(
        monitors.reduce((acc, m) => acc + getAverageResponseTime(m.response_times), 0) / (monitors.length || 1)
    );

    const layout = (site.theme_config?.layout || 'layout1') as string;

    // --- SECTIONS ---

    const headerDisplay = (
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-8 md:mb-16">
            <div className="flex items-center gap-3 sm:gap-6">
                {site.logo_url ? (
                    <img src={site.logo_url} alt="Logo" className={`w-12 h-12 sm:w-16 sm:h-16 object-contain p-2 bg-white/5 backdrop-blur-md border border-white/10 ${t.rounded}`} />
                ) : (
                    <div className={`w-12 h-12 sm:w-16 sm:h-16 bg-white/5 backdrop-blur-md flex items-center justify-center border border-white/10 ${t.rounded}`}>
                        <Activity className="w-5 h-5 sm:w-8 sm:h-8 text-white/50" />
                    </div>
                )}
                <div>
                    <h1 className={`text-lg sm:text-4xl text-white leading-tight ${t.heading}`}>{site.brand_name}</h1>
                    <div className={`flex items-center gap-2 mt-1 sm:mt-2 text-[10px] sm:text-sm font-medium ${t.mutedText}`}>
                        <div className="flex items-center gap-1.5 whitespace-nowrap">
                            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500 animate-pulse" />
                            Monitoring {monitors.length} services
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex gap-4">
                {(site.theme_config?.supportEmail || site.theme_config?.supportUrl) && (
                    <a
                        href={site.theme_config?.supportUrl || `mailto:${site.theme_config?.supportEmail}`}
                        target={site.theme_config?.supportUrl ? "_blank" : undefined}
                        rel={site.theme_config?.supportUrl ? "noopener noreferrer" : undefined}
                        className={`px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-white transition-all backdrop-blur-md flex items-center gap-2 ${t.rounded}`}
                    >
                        Report Issue
                    </a>
                )}
            </div>
        </header>
    );

    const footerDisplay = (
        <footer key="footer" className="mt-auto pt-24 pb-8 flex items-center justify-center">
            <a href="https://statuscode.in" className={`text-xs ${t.mutedText} hover:text-white transition-colors flex items-center gap-2 group`}>
                <div className="w-2 h-2 rounded-full bg-indigo-500 group-hover:scale-125 transition-transform" />
                Powered by <span className="font-bold text-white tracking-wide">Statuscode</span>
            </a>
        </footer>
    );

    // --- Active Maintenance Logic ---
    const activeMaintenanceWindow = (site.theme_config?.maintenance || []).find((m: any) => {
        const start = new Date(m.startTime).getTime();
        const end = start + m.durationMinutes * 60000;
        return end > Date.now();
    });

    const maintenanceBannerDisplay = activeMaintenanceWindow ? (
        <div className="w-full bg-indigo-500/10 border-b border-indigo-500/20 py-3 px-4 flex items-center justify-center gap-3 mb-8 hover:bg-indigo-500/15 transition-colors group text-left cursor-pointer"
            // Click handling will be done in StatusPageClient via event delegation or by passing this as data
            data-monitor-id={activeMaintenanceWindow.monitorId}>
            <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-400 shrink-0" />
                <span className="text-sm font-medium text-indigo-200 truncate flex items-center gap-2">
                    Scheduled Maintenance: {activeMaintenanceWindow.title}
                    {(() => {
                        const mId = activeMaintenanceWindow.monitorId;
                        const monitor = monitors.find(m => String(m.id) === mId || `demo-${Math.abs(m.id)}` === mId);
                        if (monitor) {
                            return (
                                <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 font-mono">
                                    for {monitor.friendly_name}
                                </span>
                            );
                        }
                        return null;
                    })()}
                </span>
            </div>
            <span className="text-indigo-200/50 text-xs hidden sm:inline ml-1">
                — {new Date(activeMaintenanceWindow.startTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' })}
            </span>
            <ArrowRight className="w-4 h-4 text-indigo-400/50 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all ml-auto sm:ml-0" />
        </div>
    ) : null;

    // Pass maintenance windows to client
    const maintenanceWindows = site.theme_config?.maintenance || [];

    return (
        <div className={`min-h-screen text-white selection:bg-indigo-500/30 font-sans ${t.pageBg}`}>
            {/* Noise Texture */}
            <div className="fixed inset-0 opacity-[0.03] pointer-events-none z-0 mix-blend-overlay"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
            />

            {/* Gradient Orbs */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '8s' }} />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '10s', animationDelay: '1s' }} />
            </div>

            {/* Huge Logo Background */}
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

            <StatusPageClient
                layout={layout}
                header={headerDisplay}
                maintenanceBanner={maintenanceBannerDisplay}
                footer={footerDisplay}
                themeCode={themeName}
                colorPreset={colorPreset}
                subdomain={subdomain}
                initialMonitors={monitors}
                visibility={site.theme_config?.visibility}
                maintenance={maintenanceWindows}
                brandName={site.brand_name}
            />
        </div>
    );
}
