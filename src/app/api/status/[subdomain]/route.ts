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
        const { data: site } = await supabase
            .from('sites')
            .select('uptimerobot_api_key, monitors')
            .eq('subdomain', subdomain)
            .single();

        if (!site || !site.uptimerobot_api_key) {
            return NextResponse.json({ error: "Site not found or not configured" }, { status: 404 });
        }

        // 2. Fetch from UptimeRobot
        const uptimerobotParams = new URLSearchParams({
            api_key: site.uptimerobot_api_key,
            format: 'json',
            monitors: (site.monitors || []).join('-'),
            custom_uptime_ratios: '1-7-30', // 24h, 7d, 30d
            response_times: '1',
            response_times_limit: '20',
            logs: '1',
            logs_limit: '5'
        });

        const res = await fetch("https://api.uptimerobot.com/v2/getMonitors", {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: uptimerobotParams.toString(),
            next: { revalidate: 30 } // Cache for 30s
        });

        const data = await res.json();

        if (data.stat !== 'ok') {
            throw new Error(data.error?.message || "UptimeRobot API Error");
        }

        return NextResponse.json({ monitors: data.monitors });

    } catch (error) {
        console.error("[Status API] Error:", error);
        return NextResponse.json({ error: "Failed to fetch status" }, { status: 500 });
    }
}
