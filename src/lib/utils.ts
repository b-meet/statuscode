import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export const classNames = cn;

export function formatUptime(ratioString: string) {
    if (!ratioString || ratioString === "0" || ratioString === "0-0-0") return null;
    const parts = ratioString.split('-');
    return {
        day: parts[0] || '0',
        week: parts[1] || '0',
        month: parts[2] || '0'
    };
}

export function formatUptimePercentage(val: string | number | undefined | null, decimals: number = 3): string {
    if (val === undefined || val === null) return '-';
    const num = typeof val === 'string' ? parseFloat(val) : val;
    if (isNaN(num)) return '-';
    // Remove trailing zeros generically if not 100? Requirement states trailing zeros are optional depending on selection.
    return num.toFixed(decimals);
}

export function getAverageResponseTime(times: { value: number }[] = []) {
    if (!times.length) return 0;
    const sum = times.reduce((acc, curr) => acc + curr.value, 0);
    return Math.round(sum / times.length);
}

export function formatDate(timestamp: number): string {
    return new Date(timestamp * 1000).toLocaleString('en-US', {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
}

export function formatDuration(seconds: number) {
    if (!seconds) return '0 mins';
    const totalMinutes = Math.round(seconds / 60);
    const days = Math.floor(totalMinutes / 1440);
    const hours = Math.floor((totalMinutes % 1440) / 60);
    const minutes = totalMinutes % 60;

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0 || parts.length === 0) parts.push(`${minutes}m`);

    return parts.join(' ');
}

export function getLogReason(code?: string, originalDetail?: string): { reason: string; detail?: string } {
    if (!code) return { reason: 'Unknown Error', detail: originalDetail };

    const codeMap: Record<string, { reason: string; detail?: string }> = {
        '100001': { reason: 'DNS Resolving Problem', detail: 'Could not get IP address from the domain.' },
        '100002': { reason: 'Connection Timeout', detail: 'The server took too long to respond.' },
        '100003': { reason: 'Connection Refused', detail: 'The server refused the connection.' },
        'TIMEOUT': { reason: 'Connection Timeout' },
        'HTTP_ERROR': { reason: 'HTTP Error' },
        'KEYWORD_MISSING': { reason: 'Keyword Missing' },
    };

    const mapped = codeMap[code];
    if (mapped) {
        return {
            reason: mapped.reason,
            detail: mapped.detail || originalDetail
        };
    }

    return {
        reason: originalDetail || `Error ${code}`,
        detail: originalDetail ? `Code: ${code}` : undefined
    };
}

export function stripMarkdown(text: string): string {
    if (!text) return '';
    return text
        // Headers
        .replace(/^#+\s+/gm, '')
        // Bold/Italic
        .replace(/(\*\*|__)(.*?)\1/g, '$2')
        .replace(/(\*|_)(.*?)\1/g, '$2')
        // Links [text](url) -> text
        .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
        // Code blocks
        .replace(/`{3}[\s\S]*?`{3}/g, '')
        .replace(/`([^`]+)`/g, '$1')
        // Blockquotes
        .replace(/^>\s+/gm, '')
        // Lists
        .replace(/^[\*\-\+]\s+/gm, '')
        // Horizontal rules
        .replace(/^-{3,}$/gm, '')
        .trim();
}
