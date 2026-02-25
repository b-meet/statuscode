"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { AppNotification, NotificationCategory } from '@/lib/types';
import { createClient } from '@/utils/supabase/client';
import { BroadcastChannel } from 'broadcast-channel';

type NotificationMessage =
    | { type: 'MARK_READ', id: string }
    | { type: 'MARK_ALL_READ' }
    | { type: 'REFRESH' }
    | { type: 'PROJECT_CHANGE' };

interface NotificationContextType {
    notifications: AppNotification[];
    isLoading: boolean;
    fetchNotifications: () => Promise<void>;
    addNotification: (
        category: NotificationCategory,
        type: string,
        title: string,
        message: string,
        metadata?: Record<string, any>
    ) => Promise<void>;
    markRead: (id: string) => Promise<void>;
    markAllRead: () => Promise<void>;
    notifyProjectChange: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
    const supabase = createClient();
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const syncChannel = useRef<BroadcastChannel<NotificationMessage> | null>(null);

    const fetchNotifications = useCallback(async () => {
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;
        if (!user) return;

        setIsLoading(true);
        try {
            const res = await fetch("/api/notifications");
            if (res.ok) {
                const { notifications: data } = await res.json();
                if (data) setNotifications(data);
            }
        } catch (error) {
            console.error("Failed to fetch notifications via API:", error);
        } finally {
            setIsLoading(false);
        }
    }, [supabase]);

    const addNotification = useCallback(async (
        category: NotificationCategory,
        type: string,
        title: string,
        message: string,
        metadata: Record<string, any> = {}
    ) => {
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;
        if (!user) return;

        try {
            const res = await fetch("/api/notifications", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    category,
                    type,
                    title,
                    message,
                    metadata
                })
            });
            const { notification: data, error } = await res.json();

            if (data && !error && res.ok) {
                // DIRECT STATE UPDATE: This is what ensures it shows up immediately
                // without waiting for Realtime propagation
                setNotifications(prev => {
                    // Check if already exists (to prevent double entry if Realtime is fast)
                    if (prev.some(n => n.id === data.id)) return prev;
                    return [data as AppNotification, ...prev].slice(0, 20);
                });
            } else if (error) {
                console.error("Failed to add notification:", error);
            }
        } catch (err) {
            console.error("Failed to add notification request:", err);
        }
    }, [supabase]);

    const markRead = useCallback(async (id: string) => {
        try {
            const res = await fetch("/api/notifications", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id })
            });

            if (res.ok) {
                setNotifications(prev =>
                    prev.map(n => n.id === id ? { ...n, is_read: true } : n)
                );
                // Broadcast to other tabs
                syncChannel.current?.postMessage({ type: 'MARK_READ', id });
            }
        } catch (error) {
            console.error("Failed to mark read request:", error);
        }
    }, [supabase]);

    const markAllRead = useCallback(async () => {
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;
        if (!user) return;

        try {
            const res = await fetch("/api/notifications", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ all: true })
            });

            if (res.ok) {
                setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
                // Broadcast to other tabs
                syncChannel.current?.postMessage({ type: 'MARK_ALL_READ' });
            }
        } catch (error) {
            console.error("Failed to mark all read request:", error);
        }
    }, [supabase]);

    const notifyProjectChange = useCallback(() => {
        syncChannel.current?.postMessage({ type: 'PROJECT_CHANGE' });
    }, []);

    // Initial load
    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    // Cross-tab Synchronization using broadcast-channel
    useEffect(() => {
        const channel = new BroadcastChannel<NotificationMessage>('statuscode-notifications');
        syncChannel.current = channel;

        channel.onmessage = (msg) => {
            if (msg.type === 'MARK_READ') {
                setNotifications(prev =>
                    prev.map(n => n.id === msg.id ? { ...n, is_read: true } : n)
                );
            } else if (msg.type === 'MARK_ALL_READ') {
                setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            } else if (msg.type === 'REFRESH') {
                fetchNotifications();
            } else if (msg.type === 'PROJECT_CHANGE') {
                // This will be handled by components listening to the context
                // But we can also trigger a local notification refresh if needed
                fetchNotifications();
            }
        };

        return () => {
            channel.close();
        };
    }, [fetchNotifications]);

    // Realtime Sync for multi-tab / background events
    useEffect(() => {
        const channel = supabase
            .channel('notification-sync')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'app_notifications'
                },
                (payload: any) => {
                    if (payload.eventType === 'INSERT') {
                        setNotifications(prev => {
                            if (prev.some(n => n.id === payload.new.id)) return prev;
                            return [payload.new as AppNotification, ...prev].slice(0, 20);
                        });
                    } else if (payload.eventType === 'UPDATE') {
                        setNotifications(prev =>
                            prev.map(n => n.id === payload.new.id ? payload.new as AppNotification : n)
                        );
                    } else {
                        fetchNotifications();
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [supabase, fetchNotifications]);

    return (
        <NotificationContext.Provider value={{
            notifications,
            isLoading,
            fetchNotifications,
            addNotification,
            markRead,
            markAllRead,
            notifyProjectChange
        }}>
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotifications() {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
}
