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

    const headers = {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
    };

    return Promise.all(monitors.map(async (m: any) => {
        const attrs = m.attributes;

        // Map BetterStack status strings to UptimeRobot legacy integers so the frontend UI doesn't break
        let statusNum = 1; // Not checked / Pending
        if (attrs.status === 'up') statusNum = 2; // UP
        else if (attrs.status === 'down') statusNum = 9; // DOWN
        else if (attrs.status === 'paused' || attrs.status === 'maintenance') statusNum = 0; // PAUSED

        // Fetch SLA (Uptime Ratio) for 24h, 7d, 30d
        const now = Date.now();
        const d24 = new Date(now - 24 * 3600 * 1000).toISOString();
        const d7 = new Date(now - 7 * 24 * 3600 * 1000).toISOString();
        const d30 = new Date(now - 30 * 24 * 3600 * 1000).toISOString();

        const [sla24, sla7, sla30] = await Promise.all([
            fetch(`https://uptime.betterstack.com/api/v2/monitors/${m.id}/sla?from=${d24}`, { headers, next: { revalidate: 30 } }).catch(() => null),
            fetch(`https://uptime.betterstack.com/api/v2/monitors/${m.id}/sla?from=${d7}`, { headers, next: { revalidate: 30 } }).catch(() => null),
            fetch(`https://uptime.betterstack.com/api/v2/monitors/${m.id}/sla?from=${d30}`, { headers, next: { revalidate: 30 } }).catch(() => null),
        ]);

        let u24 = 100, u7 = 100, u30 = 100;
        if (sla24?.ok) u24 = (await sla24.json()).data?.attributes?.availability ?? u24;
        if (sla7?.ok) u7 = (await sla7.json()).data?.attributes?.availability ?? u7;
        if (sla30?.ok) u30 = (await sla30.json()).data?.attributes?.availability ?? u30;

        let uptimeStr = `${u24}-${u7}-${u30}`;

        // Fetch Incidents
        const incRes = await fetch(`https://uptime.betterstack.com/api/v2/incidents?monitor_id=${m.id}&per_page=10`, {
            headers,
            next: { revalidate: 30 }
        }).catch(() => null);

        let logs: any[] = [];
        if (incRes?.ok) {
            const incJson = await incRes.json();
            logs = (incJson.data || []).flatMap((inc: any) => {
                const iAttr = inc.attributes;

                const isResolved = !!iAttr.resolved_at;
                const durationInSeconds = isResolved
                    ? Math.floor((new Date(iAttr.resolved_at).getTime() - new Date(iAttr.started_at).getTime()) / 1000)
                    : 0;

                const events: any[] = [];
                // Down event
                events.push({
                    type: 1, // DOWN
                    datetime: Math.floor(new Date(iAttr.started_at).getTime() / 1000),
                    duration: durationInSeconds,
                    reason: {
                        code: iAttr.cause || "Outage",
                        detail: iAttr.name || "Incident Detected"
                    }
                });

                // Up event (if resolved)
                if (isResolved) {
                    events.push({
                        type: 2, // UP
                        datetime: Math.floor(new Date(iAttr.resolved_at).getTime() / 1000),
                        duration: 0,
                        reason: {
                            code: "Resolved",
                            detail: "Service Recovered"
                        }
                    });
                }
                return events;
            });
        }

        // Inject "Monitoring Started" mock log for UI parity
        logs.push({
            type: 98,
            datetime: Math.floor(new Date(attrs.created_at).getTime() / 1000),
            duration: 0,
            reason: { code: "Started", detail: "Monitoring Started" }
        });

        // Ensure sorted newest first
        logs.sort((a, b) => b.datetime - a.datetime);

        // Fetch Response Times
        const rtRes = await fetch(`https://uptime.betterstack.com/api/v2/monitors/${m.id}/response-times`, {
            headers,
            next: { revalidate: 30 }
        }).catch(() => null);

        let responseTimes: any[] = [];
        if (rtRes?.ok) {
            const rtJson = await rtRes.json();
            // Data is { id, type, attributes: { regions: [ { region: "as", response_times: [ { at, response_time } ] } ] } }
            const regionsInfo = rtJson.data?.attributes?.regions || [];
            if (regionsInfo.length > 0) {
                const rtArray = regionsInfo[0].response_times || [];
                responseTimes = rtArray.map((rt: any) => ({
                    datetime: Math.floor(new Date(rt.at).getTime() / 1000),
                    // UptimeRobot uses integer milliseconds, BetterStack provides seconds with float points (e.g. 0.0516)
                    value: Math.floor((rt.response_time || 0) * 1000)
                }));
            }
        }

        return {
            id: m.id,
            friendly_name: attrs.pronounceable_name || attrs.url || "Untitled",
            url: attrs.url,
            status: statusNum,
            custom_uptime_ratio: uptimeStr,
            create_datetime: Math.floor(new Date(attrs.created_at).getTime() / 1000),
            response_times: responseTimes,
            logs: logs,
        };
    }));
}
