"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createClient } from '@/utils/supabase/client';

// --- Types ---
export type Theme = 'modern' | 'minimal' | 'brutal';

export interface SiteConfig {
    id?: string; // Supabase ID
    brandName: string;
    logoUrl: string;
    theme: Theme;
    primaryColor: string; // Hex code
    monitors: string[]; // List of Monitor IDs
    apiKey: string; // UptimeRobot API Key (mask in UI)
    showDummyData?: boolean; // Preview only
}

interface EditorContextType {
    config: SiteConfig;
    updateConfig: (updates: Partial<SiteConfig>) => void;
    saveStatus: 'idle' | 'saving' | 'saved' | 'error';
    setSaveStatus: (status: 'idle' | 'saving' | 'saved' | 'error') => void;
    loading: boolean;
    monitorsData: any[]; // Store full monitor objects
    fetchMonitors: () => Promise<void>;
}

// --- Default State ---
const defaultConfig: SiteConfig = {
    brandName: 'My Status Page',
    logoUrl: '',
    theme: 'modern',
    primaryColor: '#6366f1', // Indigo-500
    monitors: [],
    apiKey: '',
    showDummyData: false,
};

// --- Context Creation ---
const EditorContext = createContext<EditorContextType | undefined>(undefined);

export function EditorProvider({ children }: { children: ReactNode }) {
    const [config, setConfig] = useState<SiteConfig>(defaultConfig);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
    const [loading, setLoading] = useState(true);
    const [monitorsData, setMonitorsData] = useState<any[]>([]);
    const supabase = createClient();

    const fetchMonitors = async () => {
        if (!config.apiKey) return;
        try {
            const res = await fetch("/api/uptimerobot/monitors", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    apiKey: config.apiKey,
                    // Request rich data
                    custom_uptime_ratios: '1-7-30',
                    response_times: '1',
                    response_times_limit: '20',
                    logs: '1',
                    logs_limit: '5'
                }),
            });
            const data = await res.json();
            if (res.ok) {
                setMonitorsData(data.monitors || []);
            }
        } catch (error) {
            console.error("Failed to fetch monitors:", error);
        }
    };

    // Fetch initial data
    useEffect(() => {
        async function fetchSite() {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return; // Should handle auth redirect elsewhere

                const { data: site, error } = await supabase
                    .from('sites')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .single();

                if (site) {
                    setConfig({
                        id: site.id,
                        brandName: site.brand_name || defaultConfig.brandName,
                        logoUrl: site.logo_url || defaultConfig.logoUrl,
                        theme: site.theme_config?.theme || defaultConfig.theme,
                        primaryColor: site.theme_config?.primaryColor || defaultConfig.primaryColor,
                        monitors: site.monitors || [],
                        apiKey: site.uptimerobot_api_key || '',
                    });

                    // If we have an API key, fetch monitors immediately
                    if (site.uptimerobot_api_key) {
                        // We need to call it but config isn't updated yet in this render cycle
                        // So we pass the key directly or use a separate effect.
                        // Let's use a separate effect or just call it here with the key if we refactor fetchMonitors.
                        // Simple hack:
                        fetch("/api/uptimerobot/monitors", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ apiKey: site.uptimerobot_api_key }),
                        })
                            .then(r => r.json())
                            .then(d => {
                                if (d.monitors) setMonitorsData(d.monitors);
                            });
                    }
                }
            } catch (error) {
                console.error("Failed to fetch site config:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchSite();
    }, []);

    const updateConfig = (updates: Partial<SiteConfig>) => {
        setConfig(prev => {
            const newConfig = { ...prev, ...updates };
            return newConfig;
        });
        setSaveStatus('idle'); // Reset save status on change

        // Auto-save logic could go here or be triggered separately
        // For now, we'll just update state
    };

    // Auto-save effect (debounce)
    useEffect(() => {
        if (loading || !config.id) return; // Don't save initial load or if no ID

        const timeout = setTimeout(async () => {
            setSaveStatus('saving');
            try {
                const { error } = await supabase
                    .from('sites')
                    .update({
                        brand_name: config.brandName,
                        logo_url: config.logoUrl,
                        uptimerobot_api_key: config.apiKey,
                        monitors: config.monitors,
                        theme_config: {
                            theme: config.theme,
                            primaryColor: config.primaryColor
                        }
                    })
                    .eq('id', config.id);

                if (error) throw error;
                setSaveStatus('saved');
            } catch (err) {
                console.error("Auto-save failed:", err);
                setSaveStatus('error');
            }
        }, 2000); // 2 second debounce

        return () => clearTimeout(timeout);
    }, [config, loading]);

    return (
        <EditorContext.Provider value={{ config, updateConfig, saveStatus, setSaveStatus, loading, monitorsData, fetchMonitors }}>
            {children}
        </EditorContext.Provider>
    );
}

// --- Hook ---
export function useEditor() {
    const context = useContext(EditorContext);
    if (context === undefined) {
        throw new Error('useEditor must be used within an EditorProvider');
    }
    return context;
}
