"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';
import { MonitorData, IncidentUpdate, MaintenanceWindow, Log } from '@/lib/types';
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
    apiKey: string; // UptimeRobot API Key (mask in UI)
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
    showDummyData: false,
    previewScenario: 'none',
    visibility: {
        showSparklines: true,
        showUptimeBars: true,
        showIncidentHistory: true,
        showPerformanceMetrics: true,
    },
    annotations: {},
    customLogs: {},
    maintenance: []
};

// --- Context Creation ---
const EditorContext = createContext<EditorContextType | undefined>(undefined);

export function EditorProvider({ children }: { children: ReactNode }) {
    const [config, setConfig] = useState<SiteConfig>(defaultConfig);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
    const [loading, setLoading] = useState(true);
    const [baseMonitors, setBaseMonitors] = useState<MonitorData[]>([]);
    const [user, setUser] = useState<any | null>(null);
    const [monitorError, setMonitorError] = useState<string | null>(null);
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
                const res = await fetch("/api/uptimerobot/monitors", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        apiKey: config.apiKey,
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

    // Fetch initial data
    useEffect(() => {
        async function fetchSite() {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return; // Should handle auth redirect elsewhere
                setUser(user);

                const { data: site } = await supabase
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
                                    // Migration: Convert legacy string to single update
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
                        apiKey: site.uptimerobot_api_key || '',
                    });

                    // Set published config
                    if (site.published_config) {
                        setPublishedConfig(site.published_config);
                    }

                    // Sync local real-time state with config
                    if (site.theme_config?.previewScenario === 'none') {
                        setIsRealDataEnabled(true);
                    }

                    // If we have an API key, fetch monitors immediately
                    if (site.uptimerobot_api_key) {
                        fetch("/api/uptimerobot/monitors", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ apiKey: site.uptimerobot_api_key }),
                        })
                            .then(async (r) => {
                                const d = await r.json();
                                if (!r.ok) throw new Error(d.error || `API Request Failed: ${r.status}`);
                                return d;
                            })
                            .then(d => {
                                const real = d.monitors || [];
                                // If we have real monitors, don't show demos AND clean up config
                                if (real.length > 0) {
                                    setBaseMonitors(real);

                                    // Clean up selected monitors in config
                                    // We need to do this carefully as config might not be fully loaded or we are inside useEffect
                                    // But we have 'site' variable here which is the raw data
                                    if (site.monitors && site.monitors.length > 0) {
                                        const demoIds = getDemoMonitors().map(m => toDemoStringId(m.id));
                                        const cleaned = site.monitors.filter((id: string) => !demoIds.includes(id));

                                        if (cleaned.length !== site.monitors.length) {
                                            // We need to update the DB/State
                                            // We can call updateConfig but we are inside the 'fetched' callback
                                            // Let's defer it or call it if updateConfig is stable
                                            // ...
                                            // Check if we should auto-select all
                                            const hasSelectedReal = cleaned.some((id: string) => !demoIds.includes(id));
                                            if (!hasSelectedReal) {
                                                const allRealIds = real.map((m: any) => String(m.id));
                                                updateConfig({ monitors: allRealIds });
                                            } else {
                                                updateConfig({ monitors: cleaned });
                                            }
                                        } else {
                                            // Even if no demos were removed, if we have active real monitors but NONE selected
                                            // We should auto select them
                                            const hasSelectedReal = cleaned.some((id: string) => !demoIds.includes(id));
                                            if (!hasSelectedReal) {
                                                const allRealIds = real.map((m: any) => String(m.id));
                                                updateConfig({ monitors: allRealIds });
                                            }
                                        }
                                    }
                                } else {
                                    const demos = getDemoMonitors().filter(m => (site.monitors || []).includes(toDemoStringId(m.id)));
                                    setBaseMonitors(demos);
                                }
                            }).catch(error => {
                                console.error("Failed to fetch monitors:", error);
                                setMonitorError(error.message || "Failed to fetch monitors");
                            });
                    } else {
                        // Just load demo monitors if they are in the list
                        const demos = getDemoMonitors().filter(m => (site.monitors || []).includes(toDemoStringId(m.id)));
                        if (demos.length > 0) setBaseMonitors(demos);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch site config:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchSite();
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
    }, [config, loading, supabase]);

    // --- Real-time Data Logic ---
    const [isRealDataEnabled, setIsRealDataEnabled] = useState(true);

    // Poll for real data if enabled
    useEffect(() => {
        if (!isRealDataEnabled || !config.apiKey) return;

        fetchMonitors(); // Fetch immediately on toggle
        const interval = setInterval(() => {
            fetchMonitors();
        }, 30000);

        return () => clearInterval(interval);
    }, [isRealDataEnabled, config.apiKey, fetchMonitors]);

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
            success: () => {
                const slug = config.subdomain || config.brandName.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'demo';
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

    const addDemoMonitors = () => {
        const demos = getDemoMonitors();
        const demoIds = demos.map(m => toDemoStringId(m.id));

        // Add to config.monitors
        const current = new Set(config.monitors);
        demoIds.forEach(id => current.add(id));

        updateConfig({ monitors: Array.from(current) });

        // Add to monitorsData
        setBaseMonitors(prev => {
            const next = [...prev];
            demos.forEach(d => {
                if (!next.find(m => m.id === d.id)) {
                    next.push(d);
                }
            });
            return next;
        });

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
            publishedConfig
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
