export interface Log {
    type: number;
    datetime: number;
    duration: number;
    reason?: { code: string; detail: string };
}

export interface MonitorData {
    id: number;
    friendly_name: string;
    url: string;
    status: number;
    custom_uptime_ratio: string;
    response_times?: { datetime: number; value: number }[];
    logs?: Log[];
    interval?: number;
    create_datetime?: number;
}

export type IncidentVariant = 'info' | 'warning' | 'error' | 'success';

export interface IncidentUpdate {
    id: string;
    content: string;
    variant?: IncidentVariant;
    createdAt: string; // ISO string
}
