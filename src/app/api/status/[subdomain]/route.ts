import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export const runtime = 'edge';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ subdomain: string }> }
) {
    const { subdomain } = await params;

    if (!subdomain) {
        return NextResponse.json({ error: "Subdomain is required" }, { status: 400 });
    }

    try {
        const supabase = await createClient();

        // 1. Get site config
        // We fetch published_config as well
        const { data: site } = await supabase
            .from('sites')
            .select('published_config, subdomain')
            .eq('subdomain', subdomain)
            .single();

        if (!site || !site.published_config) {
            return NextResponse.json({ error: "Site not found or not published" }, { status: 404 });
        }

        // Extract config from the JSONB column
        const config = site.published_config as any;
        const monitorIds = config.monitors || [];

        // 2. Handle Demo Monitors vs Real Monitors
        const demoIds = monitorIds.filter((id: string) => id.startsWith('demo-'));
        const realIds = monitorIds.filter((id: string) => !id.startsWith('demo-'));

        let allMonitors: any[] = [];

        // Fetch demo data if needed
        if (demoIds.length > 0) {
            const { getDemoMonitors, fromDemoStringId } = require('@/lib/mockMonitors');
            const allDemos = getDemoMonitors();
            const selectedDemos = allDemos.filter((dm: any) =>
                demoIds.includes(`demo-${Math.abs(dm.id)}`)
            );
            allMonitors = [...selectedDemos];
        }

        // Fetch from UptimeRobot if we have real IDs and an API key
        if (realIds.length > 0) {
            if (!config.uptimerobot_api_key) {
                // If we have real IDs but no API key, we have a config issue, 
                // but we can still return whatever demo data we found.
                console.warn("[Status API] Real monitors requested but no API key present.");
            } else {
                const uptimerobotParams = new URLSearchParams({
                    api_key: config.uptimerobot_api_key,
                    format: 'json',
                    monitors: realIds.join('-'),
                    custom_uptime_ratios: '1-7-30',
                    response_times: '1',
                    response_times_limit: '20',
                    logs: '1',
                    logs_limit: '5'
                });

                const res = await fetch("https://api.uptimerobot.com/v2/getMonitors", {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: uptimerobotParams.toString(),
                    next: { revalidate: 30 }
                });

                const data = await res.json();
                if (data.stat === 'ok' && data.monitors) {
                    allMonitors = [...allMonitors, ...data.monitors];
                }
            }
        }

        // 3. Merge Custom Logs (Manual History) safely
        const customLogs = config.theme_config?.customLogs || {};
        allMonitors = allMonitors.map(m => {
            const mId = String(m.id);
            const custom = customLogs[mId] || [];
            if (custom.length === 0) return m;

            // Merge and sort desc
            const combined = [...(m.logs || []), ...custom].sort((a: any, b: any) => b.datetime - a.datetime);
            return { ...m, logs: combined };
        });

        return NextResponse.json({
            monitors: allMonitors,
            annotations: config.annotations || {}
        });

    } catch (error) {
        console.error("[Status API] Error:", error);
        return NextResponse.json({ error: "Failed to fetch status" }, { status: 500 });
    }
}
