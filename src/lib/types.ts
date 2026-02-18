export interface Log {
    type: number;
    datetime: number;
    duration: number;
    reason?: { code: string; detail: string };
    isManual?: boolean;
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

export interface MaintenanceWindow {
    id: string;
    monitorId: string; // "all" or specific monitor ID
    title: string;
    description?: string;
    startTime: string; // ISO string
    durationMinutes: number;
    status: 'scheduled' | 'in_progress' | 'completed';
}
