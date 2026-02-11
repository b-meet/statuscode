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
        // This ensures the public page ONLY sees what was snapshotted at publish time
        const config = site.published_config as any;

        if (!config.uptimerobot_api_key) {
            return NextResponse.json({ error: "Site configuration invalid" }, { status: 500 });
        }

        // 2. Fetch from UptimeRobot
        const uptimerobotParams = new URLSearchParams({
            api_key: config.uptimerobot_api_key,
            format: 'json',
            monitors: (config.monitors || []).join('-'),
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

        // We also need to inject the published theme config into the response
        // so the frontend can render the correct theme without querying Supabase again
        // OPTIONAL: The frontend currently fetches theme? No, the frontend currently hardcodes theme or expects it?
        // Wait, the frontend `StatusPageClient` seems to take props. 
        // The `page.tsx` for the public status page must be fetching the theme.
        // Let's check how the public page gets its data. 
        // For now, just return monitors as requested. The public page main component likely fetches the theme separately or we need to update how it gets props.
        // NOTE: The previous code only returned monitors. 
        // If the public page needs theme, it might be fetching it in `page.tsx` (server component). 
        // Let's stick to returning monitors here.

        return NextResponse.json({ monitors: data.monitors });

    } catch (error) {
        console.error("[Status API] Error:", error);
        return NextResponse.json({ error: "Failed to fetch status" }, { status: 500 });
    }
}
