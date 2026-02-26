import { MonitorData, IncidentUpdate } from "../types";
import { GetMonitorsOptions } from "./index";

/**
 * Unified Edge Backend wrapper to fetch multiple properties from Instatus.
 */
export async function getMonitors(apiKey: string, options: GetMonitorsOptions): Promise<MonitorData[]> {
    // 1. Fetch available pages to find a page_id
    const pagesRes = await fetch("https://api.instatus.com/v2/pages", {
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        next: { revalidate: 30 }
    });

    if (!pagesRes.ok) {
        throw new Error(`Instatus API Error: Failed to fetch pages (${pagesRes.status})`);
    }

    const pagesResult = await pagesRes.json();
    if (!pagesResult || pagesResult.length === 0) {
        return []; // No pages, return empty
    }

    const pageId = pagesResult[0].id;

    // 2. We can fetch components / monitors, incidents, metrics in parallel!
    // For now we fulfill the core Promise<MonitorData[]> structure, 
    // but we can make it richer if wanted in the future.
    let monitorsEndpoint = `https://api.instatus.com/v1/${pageId}/monitors`;
    // Fallback or secondary endpoints based on Instatus documentation trends:
    // If the account only uses Components, we might need a different endpoint, 
    // but the API docs mention `GET /:page_id/monitors`.

    // As proof-of-concept for the "unified wrapper" plan we fetch Incidents too, 
    // though the UI currently parses timeline from UI. We could attach it securely here.
    const [monitorsRes, incidentsRes] = await Promise.allSettled([
        fetch(monitorsEndpoint, {
            headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
            next: { revalidate: 30 }
        }),
        fetch(`https://api.instatus.com/v1/${pageId}/incidents`, {
            headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
            next: { revalidate: 30 }
        })
    ]);

    let monitorsData: any[] = [];
    if (monitorsRes.status === 'fulfilled' && monitorsRes.value.ok) {
        const mJson = await monitorsRes.value.json();
        // Instatus documentation says the response contains a "monitors" array or is the array.
        monitorsData = Array.isArray(mJson) ? mJson : mJson.monitors || mJson.components || [];
    }

    // Filter by requested IDs
    if (options.monitors && options.monitors.length > 0) {
        const idSet = new Set(options.monitors.map(String));
        monitorsData = monitorsData.filter((m: any) => idSet.has(String(m.id)));
    }

    return monitorsData.map((m: any) => {
        let statusNum = 1; // Not checked / Unknown
        // Instatus statuses: UP, DOWN, DEGRADED, UNKNOWN
        // Optional component statuses: OPERATIONAL, UNDERMAINTENANCE, DEGRADEDPERFORMANCE, PARTIALOUTAGE, MAJOROUTAGE
        const status = (m.status || "").toUpperCase();
        if (status === 'UP' || status === 'OPERATIONAL') statusNum = 2; // UP
        else if (status === 'DOWN' || status === 'MAJOROUTAGE') statusNum = 9; // DOWN
        else if (status === 'DEGRADED' || status === 'PARTIALOUTAGE' || status === 'DEGRADEDPERFORMANCE') statusNum = 8; // SEEMS DOWN
        else if (status === 'UNKNOWN' || status === 'UNDERMAINTENANCE') statusNum = 0; // PAUSED / MAINT

        return {
            id: m.id,
            friendly_name: m.name || m.friendly_name || "Untitled Resource",
            url: m.url || "",
            status: statusNum,
            custom_uptime_ratio: m.uptime ? String(m.uptime) : "100.000",

            // Convert start date to unix if available
            create_datetime: m.created_at ? Math.floor(new Date(m.created_at).getTime() / 1000) : 0,

            // For now return empty arrays, we can weave the raw incidents in later 
            // if we update MonitorData typing across the whole app
            response_times: [],
            logs: []
        };
    });
}
