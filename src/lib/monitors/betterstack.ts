import { MonitorData } from "../types";
import { GetMonitorsOptions } from "./index";

export async function getMonitors(apiKey: string, options: GetMonitorsOptions): Promise<MonitorData[]> {
    // Basic implementation for fetching BetterStack monitors
    // BetterStack uses JSON:API standard and Bearer Auth
    const response = await fetch("https://uptime.betterstack.com/api/v2/monitors", {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        next: { revalidate: 30 }
    });

    if (!response.ok) {
        throw new Error(`BetterStack API Error: ${response.statusText}`);
    }

    const json = await response.json();
    let monitors = json.data || [];

    // Filter by requested IDs (if specific ones were requested, e.g. for a site status page)
    if (options.monitors && options.monitors.length > 0) {
        const idSet = new Set(options.monitors.map(String));
        monitors = monitors.filter((m: any) => idSet.has(String(m.id)));
    }

    return monitors.map((m: any) => {
        const attrs = m.attributes;

        // Map BetterStack status strings to UptimeRobot legacy integers so the frontend UI doesn't break
        let statusNum = 1; // Not checked / Pending
        if (attrs.status === 'up') statusNum = 2; // UP
        else if (attrs.status === 'down') statusNum = 9; // DOWN
        else if (attrs.status === 'paused' || attrs.status === 'maintenance') statusNum = 0; // PAUSED

        return {
            id: m.id,
            friendly_name: attrs.pronounceable_name || attrs.url || "Untitled",
            url: attrs.url,
            status: statusNum,

            // BetterStack ratios & logs require separate API calls (SLA / Incidents). 
            // For MVP compatibility, we mock the 100% success state.
            custom_uptime_ratio: "100.000",

            create_datetime: Math.floor(new Date(attrs.created_at).getTime() / 1000),

            // Separate fetches needed in the future for deep analytics
            response_times: [],
            logs: [],
        };
    });
}
