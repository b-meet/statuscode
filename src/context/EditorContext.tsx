"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';

// --- Types ---
export type Theme = 'modern' | 'minimal' | 'brutal';
export type Layout = 'layout1' | 'layout2' | 'layout3' | 'layout4';
export type PreviewScenario =
    | 'none'
    | 'under_50_down'
    | 'over_50_down'
    | 'slow_response'
    | 'all_good'
    | 'maintenance_full'
    | 'maintenance_partial'
    | 'heavy_incidents'
    | 'long_history';

export interface SiteConfig {
    id?: string; // Supabase ID
    brandName: string;
    logoUrl: string;
    theme: Theme;
    layout: Layout;
    primaryColor: string; // Hex code
    monitors: string[]; // List of Monitor IDs
    apiKey: string; // UptimeRobot API Key (mask in UI)
    showDummyData?: boolean; // Preview only
    previewScenario?: PreviewScenario;
}

interface EditorContextType {
    config: SiteConfig;
    updateConfig: (updates: Partial<SiteConfig>) => void;
    saveStatus: 'idle' | 'saving' | 'saved' | 'error';
    setSaveStatus: (status: 'idle' | 'saving' | 'saved' | 'error') => void;
    loading: boolean;
    monitorsData: any[]; // Store full monitor objects
    fetchMonitors: () => Promise<void>;
    isRealDataEnabled: boolean;
    toggleRealData: () => void;
    setIsRealDataEnabled: (enabled: boolean) => void;
    publishSite: () => Promise<void>;
    isPublishing: boolean;
}

// --- Default State ---
const defaultConfig: SiteConfig = {
    brandName: 'My Status Page',
    logoUrl: '',
    theme: 'modern',
    layout: 'layout1',
    primaryColor: '#6366f1', // Indigo-500
    monitors: [],
    apiKey: '',
    showDummyData: false,
    previewScenario: 'none',
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
                        layout: site.theme_config?.layout || defaultConfig.layout,
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
    };

    // Auto-save effect (debounce)
    useEffect(() => {
        if (loading) return; // Don't save if loading

        const timeout = setTimeout(async () => {
            setSaveStatus('saving');
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    // Silent fail or just stay idle if not logged in yet, 
                    // but usually we want to know. 
                    // Let's just return to idle if no user, to avoid "Saving..." loop
                    setSaveStatus('idle');
                    return;
                }

                const payload = {
                    user_id: user.id,
                    brand_name: config.brandName,
                    logo_url: config.logoUrl,
                    uptimerobot_api_key: config.apiKey,
                    monitors: config.monitors,
                    theme_config: {
                        theme: config.theme,
                        layout: config.layout,
                        primaryColor: config.primaryColor
                    },
                    // Automatically update subdomain based on brand name (slugified)
                    subdomain: config.brandName.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'demo'
                };

                if (config.id) {
                    // Update existing
                    const { error } = await supabase
                        .from('sites')
                        .update(payload)
                        .eq('id', config.id);

                    if (error) throw error;
                } else {
                    // Insert new
                    const { data, error } = await supabase
                        .from('sites')
                        .insert([payload])
                        .select()
                        .single();

                    if (error) throw error;

                    // Update local config with new ID so future saves are updates
                    if (data) {
                        setConfig(prev => ({ ...prev, id: data.id }));
                    }
                }

                setSaveStatus('saved');
                toast.success("Saved changes to cloud");

                // Reset to idle after 2 seconds
                setTimeout(() => {
                    setSaveStatus('idle');
                }, 2000);

            } catch (err) {
                console.error("Auto-save failed:", err);
                setSaveStatus('error');
                toast.error("Failed to save changes");
            }
        }, 2000); // 2 second debounce

        return () => clearTimeout(timeout);
    }, [config, loading]);

    // --- Real-time Data Logic ---
    const [isRealDataEnabled, setIsRealDataEnabled] = useState(false);

    // Poll for real data if enabled
    useEffect(() => {
        if (!isRealDataEnabled || !config.apiKey) return;

        fetchMonitors(); // Fetch immediately on toggle
        const interval = setInterval(() => {
            fetchMonitors();
        }, 30000);

        return () => clearInterval(interval);
    }, [isRealDataEnabled, config.apiKey]);

    const toggleRealData = () => {
        setIsRealDataEnabled(prev => {
            const newValue = !prev;
            if (newValue) {
                updateConfig({ previewScenario: 'none' });
            } else {
                // If disabling real data, default to Full Maintenance
                updateConfig({ previewScenario: 'maintenance_full' });
            }
            return newValue;
        });
    };

    // --- Publish Logic ---
    const [isPublishing, setIsPublishing] = useState(false);

    const publishSite = async () => {
        if (!config.id) return;
        setIsPublishing(true);

        const promise = fetch("/api/sites/publish", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ siteId: config.id }),
        }).then(async (res) => {
            if (!res.ok) throw new Error("Failed to publish");
            return res.json();
        });

        toast.promise(promise, {
            loading: 'Publishing your status page...',
            success: () => {
                const slug = config.brandName.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'demo';
                const url = `${window.location.origin}/s/${slug}`;
                window.open(url, '_blank');
                return "Congratulations! Your site is live.";
            },
            error: 'Failed to publish site'
        });

        try {
            await promise;
        } catch (error) {
            console.error("Publish error:", error);
        } finally {
            setIsPublishing(false);
        }
    };

    return (
        <EditorContext.Provider value={{
            config,
            updateConfig,
            saveStatus,
            setSaveStatus,
            loading,
            monitorsData,
            fetchMonitors,
            isRealDataEnabled,
            toggleRealData,
            setIsRealDataEnabled,
            publishSite,
            isPublishing
        }}>
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
