import { MonitorData, MonitorProvider } from "../types";
import { getMonitors as getUptimeRobotMonitors } from "./uptimerobot";
import { getMonitors as getBetterStackMonitors } from "./betterstack";
import { getMonitors as getInstatusMonitors } from "./instatus";

export interface GetMonitorsOptions {
    monitors?: string[];
    custom_uptime_ratios?: string;
    response_times?: '1' | '0';
    response_times_limit?: string;
    logs?: '1' | '0';
    logs_limit?: string;
    [key: string]: any;
}

export async function getMonitors(
    provider: MonitorProvider | null | undefined,
    apiKey: string,
    options: GetMonitorsOptions = {}
): Promise<MonitorData[]> {
    const activeProvider = provider || 'uptimerobot';

    if (activeProvider === 'uptimerobot') {
        return getUptimeRobotMonitors(apiKey, options);
    } else if (activeProvider === 'betterstack') {
        return getBetterStackMonitors(apiKey, options);
    } else if (activeProvider === 'instatus') {
        return getInstatusMonitors(apiKey, options);
    }

    throw new Error(`Unsupported monitor provider: ${activeProvider}`);
}
