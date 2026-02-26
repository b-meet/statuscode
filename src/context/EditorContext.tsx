"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { createClient } from "@/utils/supabase/client";
import { useNotifications } from "@/context/NotificationContext";
import { toast } from 'sonner';
import { MonitorData, IncidentUpdate, MaintenanceWindow, Log, MonitorProvider } from '@/lib/types';
import { getDemoMonitors, isDemoId, toDemoStringId } from '@/lib/mockMonitors';

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
export interface VisibilityConfig {
    showSparklines: boolean;
    showUptimeBars: boolean;
    showIncidentHistory: boolean;
    showPerformanceMetrics: boolean;
    uptimeDecimals?: 2 | 3;
}

export interface SiteConfig {
    id?: string; // Supabase ID
    brandName: string;
    subdomain: string; // Custom subdomain
    supportEmail?: string;
    supportUrl?: string; // Custom support URL
    logoUrl: string;
    theme: Theme;
    layout: Layout;
    colorPreset: string;
    primaryColor: string; // Hex code
    monitors: string[]; // List of Monitor IDs
    apiKey: string; // Generic Monitor API Key
    monitorProvider?: MonitorProvider; // UptimeRobot | BetterStack | Manual
    showDummyData?: boolean; // Preview only
    previewScenario?: PreviewScenario;
    visibility: VisibilityConfig; // New field
    annotations: Record<string, IncidentUpdate[]>; // Monitor ID -> Timeline of Updates
    customLogs: Record<string, Log[]>; // Monitor ID -> Manual History Logs
    maintenance: MaintenanceWindow[];
}

export interface EditorContextType {
    config: SiteConfig;
    updateConfig: (updates: Partial<SiteConfig>) => void;
    saveStatus: 'idle' | 'saving' | 'saved' | 'error';
    setSaveStatus: (status: 'idle' | 'saving' | 'saved' | 'error') => void;
    loading: boolean;
    monitorsData: MonitorData[]; // Store full monitor objects
    fetchMonitors: () => Promise<void>;
    isRealDataEnabled: boolean;
    toggleRealData: () => void;
    setIsRealDataEnabled: (enabled: boolean) => void;
    publishSite: () => Promise<void>;
    isPublishing: boolean;
    addDemoMonitors: () => void;
    user: any | null; // Supabase user
    monitorError: string | null;
    publishedConfig: SiteConfig | null;
    subdomainError: string | null;
    setSubdomainError: (error: string | null) => void;
}

// --- Default State ---
const defaultConfig: SiteConfig = {
    brandName: 'My Status Page',
    subdomain: '',
    logoUrl: '',
    theme: 'modern',
    layout: 'layout1',
    colorPreset: 'default',
    primaryColor: '#6366f1',
    monitors: [],
    apiKey: '',
    monitorProvider: 'uptimerobot',
    showDummyData: false,
    previewScenario: 'none',
    visibility: {
        showSparklines: true,
        showUptimeBars: true,
        showIncidentHistory: true,
        showPerformanceMetrics: true,
        uptimeDecimals: 3
    },
    annotations: {},
    customLogs: {},
    maintenance: []
};

// --- Context Creation ---
const EditorContext = createContext<EditorContextType | undefined>(undefined);

export function EditorProvider({ children }: { children: ReactNode }) {
    const { addNotification } = useNotifications();
    const [config, setConfig] = useState<SiteConfig>(defaultConfig);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
    const [loading, setLoading] = useState(true);
    const [baseMonitors, setBaseMonitors] = useState<MonitorData[]>([]);
    const [user, setUser] = useState<any | null>(null);
    const [monitorError, setMonitorError] = useState<string | null>(null);
    const [subdomainError, setSubdomainError] = useState<string | null>(null);
    const [publishedConfig, setPublishedConfig] = useState<SiteConfig | null>(null);
    const supabase = React.useMemo(() => createClient(), []);

    // Derived monitors data with custom logs merged
    const monitorsData = React.useMemo(() => {
        return baseMonitors.map(m => {
            const custom = config.customLogs?.[String(m.id)] || [];
            const originalLogs = m.logs || [];
            // Merge and sort
            const combinedLogs = [...originalLogs, ...custom].sort((a, b) => b.datetime - a.datetime);
            return { ...m, logs: combinedLogs };
        });
    }, [baseMonitors, config.customLogs]);

    const fetchMonitors = useCallback(async () => {
        setMonitorError(null);
        // If we have API key, fetch real ones
        let realMonitors: MonitorData[] = [];
        if (config.apiKey) {
            try {
                const res = await fetch("/api/monitors", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        apiKey: config.apiKey,
                        monitorProvider: config.monitorProvider,
                        custom_uptime_ratios: '1-7-30',
                        response_times: '1',
                        response_times_limit: '20',
                        logs: '1',
                        logs_limit: '5'
                    }),
                });

                if (!res.ok) {
                    let errorMessage = `API Request Failed: ${res.status} ${res.statusText}`;
                    try {
                        const errorData = await res.json();
                        errorMessage = errorData.error || errorData.message || errorMessage;
                    } catch (e) {
                        // Response was not JSON (e.g., 500 HTML page)
                    }
                    throw new Error(errorMessage);
                }

                const data = await res.json();

                if (data.monitors) {
                    realMonitors = data.monitors;
                } else if (data.stat === 'fail') {
                    throw new Error(data.message || "Failed to fetch monitors from UptimeRobot");
                }
            } catch (error: any) {
                console.error("Failed to fetch monitors:", error);
                setMonitorError(error.message || "Failed to fetch monitors");
            }
        }

        // Combine with demo monitors if they are in the config
        const demoMonitors = getDemoMonitors().filter(m =>
            config.monitors.includes(toDemoStringId(m.id))
        );

        setBaseMonitors(prev => {
            // If we have real monitors, ignore demo monitors to avoid duplicates
            if (realMonitors.length > 0) {
                // Remove demo monitors AND any stale IDs (e.g. deleted monitors) from selected list
                const realIds = realMonitors.map(m => String(m.id));
                const validSelected = config.monitors.filter(id => realIds.includes(id));

                if (validSelected.length !== config.monitors.length) {
                    // We filtered something out (demos or deleted monitors)
                    if (validSelected.length === 0) {
                        // User had no real monitors selected (only demos or empty or all deleted)
                        // Auto-select ALL fetched real monitors
                        updateConfig({ monitors: realIds });
                    } else {
                        updateConfig({ monitors: validSelected });
                    }
                } else if (validSelected.length === 0) {
                    // Config didn't change (no demos to remove), BUT we have no real monitors selected
                    // Auto-select ALL fetched real monitors
                    updateConfig({ monitors: realIds });
                }

                return realMonitors;
            }

            // Otherwise, keep existing demo monitors that might not be in the fresh getDemoMonitors() call if we had custom state (though currently we don't)
            // But main goal is to merge results.
            const merged = [...realMonitors];
            demoMonitors.forEach(dm => {
                if (!merged.find(m => m.id === dm.id)) {
                    merged.push(dm);
                }
            });

            return merged;
        });
    }, [config.apiKey, config.monitors]);

    // Fetch initial data & listen for auth changes
    useEffect(() => {
        async function fetchSite() {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;
                setUser(user);

                const res = await fetch("/api/projects");
                if (!res.ok) throw new Error("Failed to load projects");
                const { projects } = await res.json();
                const site = projects?.[0];

                if (site) {
                    setConfig({
                        id: site.id,
                        brandName: site.brand_name || defaultConfig.brandName,
                        subdomain: site.subdomain || '',
                        supportEmail: site.theme_config?.supportEmail || '',
                        supportUrl: site.theme_config?.supportUrl || '',
                        logoUrl: site.logo_url || defaultConfig.logoUrl,
                        theme: site.theme_config?.theme || defaultConfig.theme,
                        layout: site.theme_config?.layout || defaultConfig.layout,
                        colorPreset: site.theme_config?.colorPreset || defaultConfig.colorPreset,
                        primaryColor: site.theme_config?.primaryColor || defaultConfig.primaryColor,
                        visibility: {
                            ...defaultConfig.visibility,
                            ...(site.theme_config?.visibility || {})
                        },
                        annotations: (() => {
                            const raw = site.theme_config?.annotations || {};
                            const migrated: Record<string, IncidentUpdate[]> = {};
                            Object.keys(raw).forEach(key => {
                                const val = raw[key];
                                if (Array.isArray(val)) {
                                    migrated[key] = val;
                                } else if (typeof val === 'string') {
                                    migrated[key] = [{
                                        id: 'legacy-' + Date.now(),
                                        content: val,
                                        createdAt: new Date().toISOString()
                                    }];
                                }
                            });
                            return migrated;
                        })(),
                        customLogs: site.theme_config?.customLogs || {},
                        maintenance: site.theme_config?.maintenance || [],
                        monitors: site.monitors || [],
                        apiKey: site.api_key || site.uptimerobot_api_key || '',
                        monitorProvider: site.monitor_provider || 'uptimerobot',
                    });

                    if (site.published_config) {
                        setPublishedConfig(site.published_config);
                    }

                    if (site.theme_config?.previewScenario === 'none') {
                        setIsRealDataEnabled(true);
                    }

                    const demos = getDemoMonitors().filter(m => (site.monitors || []).includes(toDemoStringId(m.id)));
                    if (demos.length > 0) setBaseMonitors(demos);
                }
            } catch (error) {
                console.error("Failed to fetch site config:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchSite();

        // Listen for metadata updates (like avatar_url or full_name)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event: string, session: any) => {
            if (event === 'USER_UPDATED' || event === 'SIGNED_IN') {
                setUser(session?.user || null);
            }
        });

        return () => subscription.unsubscribe();
    }, [supabase]);

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
                        colorPreset: config.colorPreset,
                        primaryColor: config.primaryColor,
                        visibility: config.visibility,
                        annotations: config.annotations,
                        customLogs: config.customLogs,
                        maintenance: config.maintenance,
                        supportEmail: config.supportEmail,
                        supportUrl: config.supportUrl
                    },
                    // Use custom subdomain if set, otherwise auto-generate from brand name
                    subdomain: config.subdomain || config.brandName.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'demo'
                };

                if (config.id) {
                    // Update existing
                    const res = await fetch(`/api/projects/${config.id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(payload),
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error || "Failed to save project");
                } else {
                    // Insert new
                    const res = await fetch("/api/projects", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(payload),
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error || "Failed to create project");

                    // Update local config with new ID so future saves are updates
                    if (data.project) {
                        setConfig(prev => ({ ...prev, id: data.project.id }));
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
    }, [config, loading, supabase, user]);

    // --- Real-time Data Logic ---
    const [isRealDataEnabled, setIsRealDataEnabled] = useState(true);

    const pollInterval = React.useMemo(() => {
        return monitorsData && monitorsData.length > 0
            ? Math.max(30000, Math.min(...monitorsData.map(m => m.interval ? m.interval * 1000 : 30000)))
            : 30000;
    }, [monitorsData]);

    // Fetch immediately on toggle or API config change
    useEffect(() => {
        if (!isRealDataEnabled || !config.apiKey) return;
        fetchMonitors();
    }, [isRealDataEnabled, config.apiKey, fetchMonitors]);

    // Setup recurring interval loop independently
    useEffect(() => {
        if (!isRealDataEnabled || !config.apiKey) return;

        const interval = setInterval(() => {
            fetchMonitors();
        }, pollInterval);

        return () => clearInterval(interval);
    }, [isRealDataEnabled, config.apiKey, fetchMonitors, pollInterval]);

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
            const data = await res.json();
            // Update local published config with the returned new config
            if (data.publishedConfig) {
                setPublishedConfig(data.publishedConfig);
            }
            // Also refresh site config to get updated timestamps in editor
            fetchMonitors();
            return data;
        });

        toast.promise(promise, {
            loading: 'Publishing your status page...',
            success: (data: any) => {
                const slug = config.subdomain || config.brandName.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'demo';
                const url = `${window.location.origin}/s/${slug}`;
                window.open(url, '_blank');

                // Trigger persistent notification
                if (user) {
                    addNotification(
                        'project',
                        'published',
                        'Changes Published ✨',
                        'Your latest modifications are now live on your status page.',
                        { siteId: config.id }
                    );
                }
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

    const addDemoMonitors = () => {
        const demos = getDemoMonitors();
        const demoIds = demos.map(m => toDemoStringId(m.id));

        // Clear existing config monitors and set only demo IDs
        updateConfig({ monitors: demoIds });

        // Wipe out existing monitorsData completely and replace with demos only
        setBaseMonitors(demos);

        toast.success("Added 3 demo monitors");
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
            isPublishing,
            addDemoMonitors,
            user,
            monitorError,
            publishedConfig,
            subdomainError,
            setSubdomainError
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
