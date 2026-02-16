import { MonitorData } from "./types";

export function getDemoMonitors(): MonitorData[] {
    const now = Math.floor(Date.now() / 1000);

    return [
        {
            id: -1, // Use negative IDs for demo monitors internally or prefix strings
            friendly_name: "API Gateway (Demo)",
            url: "https://api.example.com",
            status: 2,
            custom_uptime_ratio: "100.00-100.00-100.00",
            create_datetime: now - 7884000, // 3 months ago
            response_times: Array.from({ length: 20 }).map((_, i) => ({
                datetime: now - (i * 300),
                value: 45 + Math.floor(Math.random() * 20)
            })),
            logs: []
        },
        {
            id: -2,
            friendly_name: "Web Dashboard (Demo)",
            url: "https://app.example.com",
            status: 2,
            custom_uptime_ratio: "99.99-100.00-100.00",
            create_datetime: now - 7884000,
            response_times: Array.from({ length: 20 }).map((_, i) => ({
                datetime: now - (i * 300),
                value: 120 + Math.floor(Math.random() * 50)
            })),
            logs: []
        },
        {
            id: -3,
            friendly_name: "Database Cluster (Demo)",
            url: "postgresql://db.example.com",
            status: 2,
            custom_uptime_ratio: "100.00-100.00-100.00",
            create_datetime: now - 7884000,
            response_times: Array.from({ length: 20 }).map((_, i) => ({
                datetime: now - (i * 300),
                value: 5 + Math.floor(Math.random() * 5)
            })),
            logs: []
        }
    ];
}

// Helper to check if an ID is a demo ID
export const isDemoId = (id: string | number) => {
    if (typeof id === 'number') return id < 0;
    return id.startsWith('demo-') || parseInt(id) < 0;
};

// Helper to convert internal negative ID to demo string ID for persistence
export const toDemoStringId = (id: number) => `demo-${Math.abs(id)}`;
export const fromDemoStringId = (id: string) => -parseInt(id.replace('demo-', ''));
