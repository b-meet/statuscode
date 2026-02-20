import { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';

interface RefreshTimerProps {
    intervalMs: number;
    lastRefresh: number;
    className?: string;
}

export function RefreshTimer({ intervalMs, lastRefresh, className = '' }: RefreshTimerProps) {
    const [timeLeft, setTimeLeft] = useState(intervalMs);

    useEffect(() => {
        // Calculate immediately so it doesn't await the first interval tick
        const calculateTimeLeft = () => {
            const elapsed = Date.now() - lastRefresh;
            const remaining = Math.max(0, intervalMs - elapsed);
            setTimeLeft(remaining);
        };

        calculateTimeLeft();

        const intervalId = setInterval(calculateTimeLeft, 1000);
        return () => clearInterval(intervalId);
    }, [intervalMs, lastRefresh]);

    const seconds = Math.ceil(timeLeft / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;

    return (
        <div className={`flex items-center gap-1.5 opacity-60 hover:opacity-100 transition-opacity ${className}`}>
            <RefreshCw className={`w-3.5 h-3.5 ${timeLeft < 2000 ? 'animate-spin' : ''}`} />
            <span className="text-xs font-medium tabular-nums">
                Refresh in {mins > 0 ? `${mins}m ` : ''}{secs}s
            </span>
        </div>
    );
}
