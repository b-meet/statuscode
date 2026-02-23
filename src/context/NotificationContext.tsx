"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { AppNotification, NotificationCategory } from '@/lib/types';
import { createClient } from '@/utils/supabase/client';

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
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
    const supabase = createClient();
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const fetchNotifications = useCallback(async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        setIsLoading(true);
        try {
            const { data } = await supabase
                .from('app_notifications')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(20);
            if (data) setNotifications(data);
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
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Optimistic UI could be added here, but let's first ensure the DB result is pushed
        const { data, error } = await supabase
            .from('app_notifications')
            .insert({
                user_id: user.id,
                category,
                type,
                title,
                message,
                metadata,
                is_read: false
            })
            .select()
            .single();

        if (data && !error) {
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
    }, [supabase]);

    const markRead = useCallback(async (id: string) => {
        const { error } = await supabase
            .from('app_notifications')
            .update({ is_read: true })
            .eq('id', id);

        if (!error) {
            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, is_read: true } : n)
            );
        }
    }, [supabase]);

    const markAllRead = useCallback(async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase
            .from('app_notifications')
            .update({ is_read: true })
            .eq('user_id', user.id)
            .eq('is_read', false);

        if (!error) {
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        }
    }, [supabase]);

    // Initial load
    useEffect(() => {
        fetchNotifications();
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
            markAllRead
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
