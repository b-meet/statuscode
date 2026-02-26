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

export interface ThemeConfig {
    maintenance?: MaintenanceWindow[];
    supportEmail?: string;
    supportUrl?: string;
    liveWebsiteUrl?: string;
}

export type MonitorProvider = 'uptimerobot' | 'betterstack' | 'manual';

export interface Site {
    id: string;
    brand_name: string | null;
    subdomain: string | null;
    logo_url: string | null;
    theme_config?: ThemeConfig;
    published_config?: any;
    api_key?: string | null;
    monitor_provider?: MonitorProvider;
    uptimerobot_api_key?: string | null; // legacy
    monitors?: string[] | null;
    created_at?: string;
}

export type ChannelType = 'email' | 'discord' | 'slack';

export interface NotificationChannel {
    id: string;
    user_id: string;
    type: ChannelType;
    config: {
        email?: string;
        webhook_url?: string;
        channel_name?: string;
    };
    is_enabled: boolean;
    created_at: string;
}

export type NotificationCategory = 'maintenance' | 'project' | 'billing' | 'platform';

export interface AppNotification {
    id: string;
    user_id: string;
    category: NotificationCategory;
    type: string;
    title: string;
    message: string;
    metadata: Record<string, any>;
    is_read: boolean;
    created_at: string;
}
