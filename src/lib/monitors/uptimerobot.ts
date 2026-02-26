import { MonitorData } from "../types";
import { GetMonitorsOptions } from "./index";

export async function getMonitors(apiKey: string, options: GetMonitorsOptions): Promise<MonitorData[]> {
    const params = new URLSearchParams();
    params.append('api_key', apiKey);
    params.append('format', 'json');

    if (options.monitors && options.monitors.length > 0) {
        params.append('monitors', options.monitors.join('-'));
    }

    // Default or explicitly requested options
    if (options.custom_uptime_ratios) params.append('custom_uptime_ratios', options.custom_uptime_ratios);
    if (options.response_times) params.append('response_times', options.response_times);
    if (options.response_times_limit) params.append('response_times_limit', options.response_times_limit);
    if (options.logs) params.append('logs', options.logs);
    if (options.logs_limit) params.append('logs_limit', options.logs_limit);

    // Any generic appends
    Object.keys(options).forEach(key => {
        if (!['monitors', 'custom_uptime_ratios', 'response_times', 'response_times_limit', 'logs', 'logs_limit'].includes(key) && options[key] !== undefined) {
            params.append(key, String(options[key]));
        }
    });

    const response = await fetch("https://api.uptimerobot.com/v2/getMonitors", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Cache-Control': 'no-cache',
        },
        body: params.toString(),
        next: { revalidate: 30 }
    });

    const data = await response.json();

    if (data.stat !== 'ok') {
        throw new Error(data.error?.message || "Failed to fetch monitors from UptimeRobot");
    }

    return (data.monitors || []).map((m: any) => ({
        id: m.id,
        friendly_name: m.friendly_name,
        url: m.url,
        status: m.status,
        custom_uptime_ratio: m.custom_uptime_ratio,
        response_times: m.response_times || [],
        logs: m.logs || [],
        create_datetime: m.create_datetime,
    }));
}
