"use client";

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import { Plus, ExternalLink, Activity, ArrowRight, Loader2, Cog, RefreshCw, Trash2, AlertCircle, UploadCloud, X, Globe, Search, Filter, ArrowUpDown, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Site, ThemeConfig, MaintenanceWindow } from "@/lib/types";
import { formatUptimePercentage } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useNotifications } from "@/context/NotificationContext";
import { BroadcastChannel } from 'broadcast-channel';


export default function DashboardPage() {
    const supabase = createClient();
    const [sites, setSites] = useState<Site[]>([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const { addNotification, notifyProjectChange } = useNotifications();
    const [uptimeMap, setUptimeMap] = useState<Record<string, string | null>>({});
    // Deletion Modal State
    const [isDeletingSiteId, setIsDeletingSiteId] = useState<string | null>(null);
    const [isDeletingSiteName, setIsDeletingSiteName] = useState<string>('');
    const [deleteConfirmationInput, setDeleteConfirmationInput] = useState('');
    const [hasConsented, setHasConsented] = useState(false);

    // Settings Modal State
    const [isSettingsSiteId, setIsSettingsSiteId] = useState<string | null>(null);
    const [settingsName, setSettingsName] = useState('');
    const [settingsLiveWebsiteUrl, setSettingsLiveWebsiteUrl] = useState('');
    const [settingsSubdomain, setSettingsSubdomain] = useState('');
    const [settingsSupportEmail, setSettingsSupportEmail] = useState('');
    const [settingsSupportUrl, setSettingsSupportUrl] = useState('');
    const [settingsLogoUrl, setSettingsLogoUrl] = useState('');
    const [settingsPublishImmediately, setSettingsPublishImmediately] = useState(false);
    const [isUploadingLogo, setIsUploadingLogo] = useState(false);
    const [settingsSubdomainError, setSettingsSubdomainError] = useState<string | null>(null);
    const [isVerifyingSubdomain, setIsVerifyingSubdomain] = useState(false);
    const [isSavingSettings, setIsSavingSettings] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [mounted, setMounted] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Filtering & Sorting State
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<'all' | 'live' | 'draft' | 'unconfigured'>('all');
    const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'az' | 'za' | 'uptime'>('newest');
    const [isSortOpen, setIsSortOpen] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const loadDashboard = useCallback(async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        setUser(user);

        const { data: sitesData } = await supabase
            .from('sites')
            .select('*')
            .eq('user_id', user.id);

        if (sitesData) {
            setSites(sitesData);
        }
        setLoading(false);
    }, [supabase]);

    useEffect(() => {
        loadDashboard();
    }, [loadDashboard]);

    // Handle cross-tab sync for project data (e.g. from Setup or other Dashboard tabs)
    useEffect(() => {
        const channel = new BroadcastChannel('statuscode-notifications');
        channel.onmessage = (msg) => {
            if (msg.type === 'PROJECT_CHANGE') {
                loadDashboard();
            }
        };
        return () => {
            channel.close();
        };
    }, [loadDashboard]);

    useEffect(() => {
        sites.forEach(async (site) => {
            if (uptimeMap[site.id] !== undefined) return; // Already requested

            // For dashboard display, prefer published monitor settings if they exist, else draft.
            const apiKey = site.published_config?.uptimerobot_api_key || site.uptimerobot_api_key;
            const monitors = (site.published_config?.monitors || site.monitors || []).filter((id: string) => !id.startsWith('demo-'));

            if (!apiKey || monitors.length === 0) {
                setUptimeMap(prev => ({ ...prev, [site.id]: null }));
                return;
            }

            try {
                const res = await fetch("/api/uptimerobot/monitors", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        apiKey,
                        monitors: monitors.join('-'),
                        custom_uptime_ratios: '30'
                    }),
                });

                if (!res.ok) throw new Error("API responded with " + res.status);

                const data = await res.json();
                if (data.monitors && data.monitors.length > 0) {
                    const totalUptime = data.monitors.reduce((sum: number, m: any) => sum + parseFloat(m.custom_uptime_ratio || '0'), 0);
                    const avgUptime = totalUptime / data.monitors.length;
                    setUptimeMap(prev => ({ ...prev, [site.id]: avgUptime.toString() }));
                } else {
                    setUptimeMap(prev => ({ ...prev, [site.id]: null }));
                }
            } catch (err) {
                console.error("Failed to fetch uptime for site:", site.id, err);
                setUptimeMap(prev => ({ ...prev, [site.id]: null }));
            }
        });
    }, [sites, uptimeMap]);

    const handleRefreshUptime = (siteId: string) => {
        setUptimeMap(prev => {
            const next = { ...prev };
            delete next[siteId];
            return next;
        });
        toast.success("Refreshing uptime...");
    };

    const handleDeleteSite = async (id: string | null) => {
        if (!id) return;
        const siteName = isDeletingSiteName;
        setIsDeletingSiteId(null);
        setDeleteConfirmationInput('');
        setHasConsented(false);

        const promise = (async () => {
            // 1. Log consent
            try {
                await supabase
                    .from('deletion_logs')
                    .insert({
                        site_id: id,
                        user_id: user.id,
                        site_name: siteName,
                        consent_text: "I understand the consequences and statuscode is not liable for any issues",
                        action: 'delete'
                    });
            } catch (e) {
                console.warn("Failed to log deletion consent, but proceeding with deletion:", e);
            }

            // 2. Delete site
            const { error } = await supabase
                .from('sites')
                .delete()
                .eq('id', id);

            if (error) throw error;

            // Trigger persistent notification
            if (user) {
                addNotification(
                    'project',
                    'deleted',
                    'Project Deleted',
                    `"${siteName}" and all its history have been removed.`,
                    { siteId: id, siteName }
                );
            }

            // Update local state
            setSites(prev => prev.filter(s => s.id !== id));
            // Broadcast to other tabs
            notifyProjectChange();
            return "Project deleted successfully";
        })();

        toast.promise(promise, {
            loading: 'Deleting project...',
            success: (msg: string) => msg,
            error: 'Failed to delete project'
        });
    };

    // Subdomain Validation Effect for Settings Modal
    useEffect(() => {
        if (!isSettingsSiteId || !settingsSubdomain) {
            setSettingsSubdomainError(null);
            return;
        }

        const timeoutId = setTimeout(async () => {
            setIsVerifyingSubdomain(true);
            setSettingsSubdomainError(null);

            try {
                const { data, error } = await supabase
                    .from('sites')
                    .select('id')
                    .eq('subdomain', settingsSubdomain)
                    .neq('id', isSettingsSiteId || '') // Exclude current site
                    .maybeSingle();

                if (error) throw error;

                if (data) {
                    setSettingsSubdomainError("This subdomain is already taken");
                }
            } catch (err) {
                console.error("Subdomain check failed:", err);
            } finally {
                setIsVerifyingSubdomain(false);
            }
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [settingsSubdomain, isSettingsSiteId, supabase]);

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast.error("Please upload an image file");
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            toast.error("File size must be less than 2MB");
            return;
        }

        setIsUploadingLogo(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}-${Date.now()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('logos')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: publicUrlData } = supabase.storage
                .from('logos')
                .getPublicUrl(filePath);

            setSettingsLogoUrl(publicUrlData.publicUrl);
            toast.success("Logo uploaded successfully");
        } catch (error) {
            console.error("Upload failed:", error);
            toast.error("Failed to upload logo");
        } finally {
            setIsUploadingLogo(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    // Function to calculate response times
    const fetchResponseTimes = async (id: string) => {
        // TODO: Implement actual response time fetching logic here
        console.log("Fetching response times for site ID:", id);
    };

    const handleSaveSettings = async () => {
        if (!isSettingsSiteId || settingsSubdomainError) return;

        setIsSavingSettings(true);
        try {
            // First get the current site to preserve other theme_config values
            const currentSite = sites.find(s => s.id === isSettingsSiteId);
            const currentThemeConfig = currentSite?.theme_config || {};

            const updatedThemeConfig: ThemeConfig = {
                ...currentThemeConfig,
                supportEmail: settingsSupportEmail,
                supportUrl: settingsSupportUrl,
                liveWebsiteUrl: settingsLiveWebsiteUrl,
            };

            const updates: any = {
                brand_name: settingsName,
                subdomain: settingsSubdomain,
                logo_url: settingsLogoUrl,
                theme_config: updatedThemeConfig
            };

            // If the user wants to publish immediately, update published_config too
            if (settingsPublishImmediately) {
                const currentPublishedConfig = currentSite?.published_config || {};
                updates.published_config = {
                    ...currentPublishedConfig,
                    brand_name: settingsName,
                    subdomain: settingsSubdomain,
                    logo_url: settingsLogoUrl,
                    theme_config: updatedThemeConfig,
                    // Preserve existing published monitors and api key
                    monitors: currentPublishedConfig.monitors || currentSite?.monitors || [],
                    uptimerobot_api_key: currentPublishedConfig.uptimerobot_api_key || currentSite?.uptimerobot_api_key || ''
                };
            }

            const { error } = await supabase
                .from('sites')
                .update(updates)
                .eq('id', isSettingsSiteId);

            if (error) throw error;

            // Optimistically update local state
            setSites(prev => prev.map(site => {
                if (site.id === isSettingsSiteId) {
                    return {
                        ...site,
                        ...updates
                    };
                }
                return site;
            }));

            toast.success("Project settings saved");

            // Trigger persistent notification if published immediately
            if (settingsPublishImmediately && user) {
                addNotification(
                    'project',
                    'published',
                    'Changes Published ✨',
                    `Your latest settings for "${settingsName}" are now live.`,
                    { siteId: isSettingsSiteId }
                );
            }

            // Broadcast to other tabs
            notifyProjectChange();

            setIsSettingsSiteId(null);
        } catch (error) {
            console.error("Failed to save settings:", error);
            toast.error("Failed to save settings");
        } finally {
            setIsSavingSettings(false);
        }
    };

    // Check if settings have actually changed to conditionally disable the save button
    const currentEditSite = useMemo(() => sites.find(s => s.id === isSettingsSiteId), [sites, isSettingsSiteId]);
    const hasSettingsChanges = useMemo(() => {
        if (!currentEditSite) return false;
        return (
            settingsName !== (currentEditSite.brand_name || '') ||
            settingsLiveWebsiteUrl !== (currentEditSite.theme_config?.liveWebsiteUrl || '') ||
            settingsSubdomain !== (currentEditSite.subdomain || '') ||
            settingsSupportEmail !== (currentEditSite.theme_config?.supportEmail || '') ||
            settingsSupportUrl !== (currentEditSite.theme_config?.supportUrl || '') ||
            settingsLogoUrl !== (currentEditSite.logo_url || '')
        );
    }, [
        currentEditSite, settingsName, settingsLiveWebsiteUrl, settingsSubdomain,
        settingsSupportEmail, settingsSupportUrl, settingsLogoUrl
    ]);

    // Derived State: Filtered and Sorted Sites
    const filteredAndSortedSites = useMemo(() => {
        let result = [...sites];

        // 1. Search Filter
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter(s =>
                (s.brand_name?.toLowerCase().includes(q)) ||
                (s.subdomain?.toLowerCase().includes(q))
            );
        }

        // 2. Status Filter
        if (statusFilter !== 'all') {
            result = result.filter(site => {
                const isPublished = !!site.published_config;
                const hasApiKey = !!(site.published_config?.uptimerobot_api_key || site.uptimerobot_api_key);

                if (statusFilter === 'live') return isPublished;
                if (statusFilter === 'draft') return !isPublished && hasApiKey;
                if (statusFilter === 'unconfigured') return !hasApiKey;
                return true;
            });
        }

        // 3. Sorting
        result.sort((a, b) => {
            if (sortBy === 'az') return (a.brand_name || "").localeCompare(b.brand_name || "");
            if (sortBy === 'za') return (b.brand_name || "").localeCompare(a.brand_name || "");
            if (sortBy === 'newest') return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
            if (sortBy === 'oldest') return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
            if (sortBy === 'uptime') {
                const uptimeA = parseFloat(uptimeMap[a.id] || '-1');
                const uptimeB = parseFloat(uptimeMap[b.id] || '-1');
                return uptimeB - uptimeA;
            }
            return 0;
        });

        return result;
    }, [sites, searchQuery, statusFilter, sortBy, uptimeMap]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh] text-zinc-500 gap-3">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                <p className="text-sm">Loading your command center...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-white tracking-tight">Projects</h1>
                        <p className="text-zinc-400 mt-2">Manage your status pages and monitors.</p>
                    </div>
                </div>

                {/* 
                  Future: "Create New Project" button 
                  For now, if they have 0 sites, we show a big empty state.
                  If they have sites, we assume they are on the free plan (1 site).
                */}
            </div>

            {/* Filter Bar */}
            {sites.length > 0 && (
                <div className="relative z-50 flex flex-col gap-5">
                    {/* Search row - Prominent Full Width */}
                    <div className="relative group w-full">
                        <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                            <Search className="w-5 h-5 text-zinc-500 group-focus-within:text-indigo-400 transition-colors" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search projects by name or subdomain..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-[#0d0d0f] border border-zinc-800/80 rounded-[2rem] pl-14 pr-14 py-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/50 focus:ring-[6px] focus:ring-indigo-500/10 transition-all shadow-xl"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery("")}
                                className="absolute inset-y-0 right-0 pr-5 flex items-center"
                            >
                                <div className="p-2 hover:bg-zinc-800 rounded-xl transition-colors">
                                    <X className="w-4 h-4 text-zinc-500" />
                                </div>
                            </button>
                        )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                        {/* Status Filters - h-11 container with inner buttons filling height */}
                        <div className="flex items-center gap-1 p-1 bg-zinc-900/40 border border-zinc-800/50 rounded-2xl backdrop-blur-md overflow-x-auto no-scrollbar w-full sm:w-auto h-11">
                            {[
                                { id: 'all', label: 'All Projects' },
                                { id: 'live', label: 'Live' },
                                { id: 'draft', label: 'Draft' },
                                { id: 'unconfigured', label: 'Setup' }
                            ].map((btn) => (
                                <button
                                    key={btn.id}
                                    onClick={() => setStatusFilter(btn.id as any)}
                                    className={`
                                        h-full px-6 rounded-xl text-xs font-bold transition-all whitespace-nowrap
                                        ${statusFilter === btn.id
                                            ? 'bg-white text-black shadow-lg scale-[1.02]'
                                            : 'text-zinc-500 hover:text-white hover:bg-white/5'}
                                    `}
                                >
                                    {btn.label}
                                </button>
                            ))}
                        </div>

                        {/* Sort Dropdown - Perfect match at h-11 */}
                        <div className="relative w-full sm:w-64">
                            <button
                                onClick={() => setIsSortOpen(!isSortOpen)}
                                className="flex items-center justify-between gap-4 w-full h-11 px-6 bg-zinc-900/40 border border-zinc-800/50 rounded-2xl text-[11px] uppercase tracking-widest font-black text-zinc-500 hover:text-white hover:border-zinc-700 transition-all backdrop-blur-md"
                            >
                                <div className="flex items-center gap-2.5">
                                    <ArrowUpDown className="w-4 h-4 text-indigo-400" />
                                    <span className="truncate">Sort: {
                                        sortBy === 'newest' ? 'Newest' :
                                            sortBy === 'oldest' ? 'Oldest' :
                                                sortBy === 'az' ? 'A-Z' :
                                                    sortBy === 'za' ? 'Z-A' : 'Uptime'
                                    }</span>
                                </div>
                                <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isSortOpen ? 'rotate-180' : ''}`} />
                            </button>

                            <AnimatePresence>
                                {isSortOpen && (
                                    <>
                                        <div className="fixed inset-0 z-[60] bg-transparent" onClick={() => setIsSortOpen(false)} />
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                            animate={{ opacity: 1, scale: 1, y: 5 }}
                                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                            className="absolute right-0 top-full mt-2 w-full sm:w-64 bg-[#0d0d0f] border border-zinc-800 rounded-2xl shadow-[0_30px_60px_rgba(0,0,0,0.6)] z-[70] p-1.5 backdrop-blur-xl"
                                        >
                                            {[
                                                { id: 'newest', label: 'Newest First' },
                                                { id: 'oldest', label: 'Oldest First' },
                                                { id: 'az', label: 'Name (A-Z)' },
                                                { id: 'za', label: 'Name (Z-A)' },
                                                { id: 'uptime', label: 'Highest Uptime' }
                                            ].map((opt) => (
                                                <button
                                                    key={opt.id}
                                                    onClick={() => { setSortBy(opt.id as any); setIsSortOpen(false); }}
                                                    className={`
                                                        w-full text-left px-5 py-3 rounded-xl text-xs font-bold transition-all
                                                        ${sortBy === opt.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-zinc-500 hover:bg-white/5 hover:text-white'}
                                                    `}
                                                >
                                                    {opt.label}
                                                </button>
                                            ))}
                                        </motion.div>
                                    </>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            )}

            {/* Grid */}
            {filteredAndSortedSites.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredAndSortedSites.map((site) => {
                        const now = new Date().getTime();
                        const publishedMaintenance = site.published_config?.theme_config?.maintenance || [];

                        const activeMaint = publishedMaintenance.find((m: MaintenanceWindow) => {
                            const start = new Date(m.startTime).getTime();
                            const end = start + m.durationMinutes * 60000;
                            return now >= start && now <= end;
                        });

                        const upcomingMaint = !activeMaint ? publishedMaintenance.find((m: MaintenanceWindow) => {
                            const start = new Date(m.startTime).getTime();
                            return start > now && start <= now + 12 * 60 * 60 * 1000; // within 12 hours
                        }) : null;

                        // Check if site has been published
                        const isPublished = !!site.published_config;

                        // Simple JSON equality check for draft vs published state
                        // We check the fields that actually get published in api/sites/publish/route.ts
                        let hasDraftChanges = false;
                        if (isPublished) {
                            const draftState = {
                                brand_name: site.brand_name,
                                logo_url: site.logo_url,
                                uptimerobot_api_key: site.uptimerobot_api_key,
                                monitors: (site.monitors || []).filter((id: string) => !id.startsWith('demo-')),
                                theme_config: site.theme_config,
                                subdomain: site.subdomain,
                            };

                            const publishedState = {
                                brand_name: site.published_config?.brand_name,
                                logo_url: site.published_config?.logo_url,
                                uptimerobot_api_key: site.published_config?.uptimerobot_api_key,
                                monitors: site.published_config?.monitors || [],
                                theme_config: site.published_config?.theme_config,
                                subdomain: site.published_config?.subdomain,
                            };

                            hasDraftChanges = JSON.stringify(draftState) !== JSON.stringify(publishedState);
                        }

                        // Determine button text and color
                        let btnText = "Start Designing";
                        let btnClass = "w-full h-10 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500 transition-all flex items-center justify-center gap-2 group/btn";

                        const hasApiKey = !!(site.published_config?.uptimerobot_api_key || site.uptimerobot_api_key);

                        if (isPublished) {
                            if (hasDraftChanges) {
                                btnText = "Review Draft";
                                btnClass = "w-full h-10 rounded-xl bg-amber-500 text-black text-sm font-semibold hover:bg-amber-400 transition-all flex items-center justify-center gap-2 group/btn";
                            } else {
                                btnText = "Update Status";
                                btnClass = "w-full h-10 rounded-xl bg-white text-black text-sm font-semibold hover:bg-zinc-200 transition-all flex items-center justify-center gap-2 group/btn";
                            }
                        } else if (!hasApiKey) {
                            btnText = "Preview Editor";
                            btnClass = "w-full h-10 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 text-sm font-semibold hover:bg-zinc-800 hover:text-white transition-all flex items-center justify-center gap-2 group/btn";
                        }

                        return (
                            <motion.div
                                key={site.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="group relative bg-[#09090b] border border-zinc-800 rounded-2xl overflow-hidden hover:border-zinc-700 transition-all hover:shadow-2xl hover:shadow-indigo-500/10 h-full flex flex-col"
                            >
                                {/* Card Header (Preview Mock) */}
                                <div className="h-32 bg-zinc-900/50 border-b border-zinc-800 relative z-0 flex items-center justify-center p-6">
                                    {/* Abstract preview or Logo */}
                                    {site.logo_url ? (
                                        <img src={site.logo_url} alt={site.brand_name || ''} className="h-12 w-auto object-contain opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500" />
                                    ) : (
                                        <div className="w-12 h-12 rounded-lg bg-zinc-800 flex items-center justify-center group-hover:bg-zinc-700 transition-colors">
                                            <Activity className="w-6 h-6 text-zinc-500" />
                                        </div>
                                    )}

                                    {/* Status Badges */}
                                    <div className="absolute top-4 right-4 text-right">
                                        {activeMaint ? (
                                            <div className="flex items-center gap-1.5 bg-blue-500/20 backdrop-blur-sm border border-blue-500/30 px-2 py-1 rounded-full shadow-lg">
                                                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                                                <span className="text-[10px] font-medium text-blue-300">In Maintenance</span>
                                            </div>
                                        ) : upcomingMaint ? (
                                            <div className="flex items-center gap-1.5 bg-amber-500/20 backdrop-blur-sm border border-amber-500/30 px-2 py-1 rounded-full shadow-lg">
                                                <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                                                <span className="text-[10px] font-medium text-amber-300">Upcoming Maint.</span>
                                            </div>
                                        ) : !hasApiKey ? (
                                            <div className="flex items-center gap-1.5 bg-amber-500/10 backdrop-blur-sm border border-amber-500/20 px-2 py-1 rounded-full">
                                                <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                                                <span className="text-[10px] font-medium text-amber-500/80">Add API Key</span>
                                            </div>
                                        ) : !isPublished ? (
                                            <div className="flex items-center gap-1.5 bg-zinc-800/50 backdrop-blur-sm border border-zinc-700/50 px-2 py-1 rounded-full">
                                                <div className="w-2 h-2 rounded-full bg-zinc-500" />
                                                <span className="text-[10px] font-medium text-zinc-400">Draft</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1.5 bg-black/50 backdrop-blur-sm border border-white/10 px-2 py-1 rounded-full">
                                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                                <span className="text-[10px] font-medium text-zinc-300">Live</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Card Body */}
                                <div className="p-6 relative z-10 bg-[#09090b] flex-1 flex flex-col">
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <h3 className="font-bold text-lg text-white group-hover:text-indigo-400 transition-colors">
                                                {site.brand_name || "Untitled Project"}
                                            </h3>
                                            {isPublished ? (
                                                <a
                                                    href={`/s/${site.subdomain}`}
                                                    target="_blank"
                                                    className="text-xs text-zinc-500 hover:text-white flex items-center gap-1 mt-1 transition-colors"
                                                >
                                                    {site.subdomain}.statuscode.in <ExternalLink className="w-3 h-3" />
                                                </a>
                                            ) : (
                                                <div className="text-xs text-zinc-400 flex items-center gap-2 mt-1">
                                                    <span className="opacity-70">{site.subdomain}.statuscode.in</span>
                                                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md border border-zinc-700 bg-zinc-800 text-zinc-300">Unpublished</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Metrics Section (Mock Data for now) */}
                                    <div className="grid grid-cols-2 gap-4 mb-6">
                                        <div className="bg-zinc-900/50 rounded-lg p-3 border border-zinc-800/50">
                                            <div className="text-[10px] text-zinc-500 uppercase font-medium">Monitors</div>
                                            <div className="text-lg font-mono font-medium text-white">{site.monitors?.length || 0}</div>
                                        </div>
                                        <div className="bg-zinc-900/50 rounded-lg p-3 border border-zinc-800/50 relative">
                                            <div className="flex items-center justify-between">
                                                <div className="text-[10px] text-zinc-500 uppercase font-medium">Uptime (30d)</div>
                                                {hasApiKey && (
                                                    <button
                                                        onClick={() => handleRefreshUptime(site.id)}
                                                        className="p-1 rounded-md hover:bg-zinc-800 text-zinc-600 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                                                        title="Refresh Uptime"
                                                    >
                                                        <RefreshCw className={`w-3 h-3 ${uptimeMap[site.id] === undefined ? 'animate-spin' : ''}`} />
                                                    </button>
                                                )}
                                            </div>
                                            <div className="text-lg font-mono font-medium text-emerald-400">
                                                {uptimeMap[site.id] === undefined ? (
                                                    <span className="text-zinc-600 animate-pulse">---.-%</span>
                                                ) : uptimeMap[site.id] === null ? (
                                                    <span className="text-zinc-500">0%</span>
                                                ) : (
                                                    `${formatUptimePercentage(uptimeMap[site.id], 2)}%`
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-3 mt-auto">
                                        <Link href="/editor" target="_blank" className="flex-1">
                                            <button className={btnClass}>
                                                {btnText} <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                                            </button>
                                        </Link>
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                setIsSettingsSiteId(site.id);
                                                setSettingsName(site.brand_name || '');
                                                setSettingsLiveWebsiteUrl(site.theme_config?.liveWebsiteUrl || '');
                                                setSettingsSubdomain(site.subdomain || '');
                                                setSettingsSupportEmail(site.theme_config?.supportEmail || '');
                                                setSettingsSupportUrl(site.theme_config?.supportUrl || '');
                                                setSettingsLogoUrl(site.logo_url || '');
                                                setSettingsPublishImmediately(false); // Default to draft mode
                                            }}
                                            className="h-10 w-10 rounded-xl border border-zinc-800 flex items-center justify-center text-zinc-500 hover:text-white hover:border-zinc-700 transition-colors"
                                            title="Project Settings"
                                        >
                                            <Cog className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                setIsDeletingSiteId(site.id || '');
                                                setIsDeletingSiteName(site.brand_name || "Untitled Project");
                                            }}
                                            className="h-10 w-10 rounded-xl border border-zinc-800 flex items-center justify-center text-zinc-500 hover:text-red-500 hover:bg-red-500/10 hover:border-red-500/50 transition-all"
                                            title="Delete Project"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}

                    {/* Add New Project Card */}
                    <Link href="/setup?mode=create" className="block h-full">
                        <div className="h-full border border-dashed border-zinc-800 rounded-2xl p-6 flex flex-col items-center justify-center text-center gap-4 group hover:border-zinc-700 hover:bg-zinc-900/20 transition-all cursor-pointer">
                            <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center border border-zinc-800 group-hover:border-zinc-600 group-hover:scale-110 transition-all">
                                <Plus className="w-5 h-5 text-zinc-500 group-hover:text-white" />
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-white">Create New Project</h3>
                            </div>
                        </div>
                    </Link>

                </div>
            ) : sites.length > 0 ? (
                // Filter No Results State
                <div className="flex flex-col items-center justify-center min-h-[400px] border border-dashed border-zinc-800 rounded-3xl bg-zinc-900/20">
                    <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center border border-zinc-800 mb-6">
                        <Search className="w-8 h-8 text-zinc-600" />
                    </div>
                    <h2 className="text-xl font-bold text-white">No matches found</h2>
                    <p className="text-zinc-500 mt-2 max-w-sm text-center">We couldn&apos;t find any projects matching your current filters or search query.</p>
                    <button
                        onClick={() => { setSearchQuery(""); setStatusFilter('all'); setSortBy('newest'); }}
                        className="mt-8 px-6 h-12 bg-white text-black rounded-full font-semibold hover:bg-zinc-200 transition-colors"
                    >
                        Clear all filters
                    </button>
                </div>
            ) : (
                // Empty State
                <div className="flex flex-col items-center justify-center min-h-[400px] border border-dashed border-zinc-800 rounded-3xl bg-zinc-900/20">
                    <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center border border-zinc-800 mb-6">
                        <Activity className="w-8 h-8 text-zinc-600" />
                    </div>
                    <h2 className="text-xl font-bold text-white">No projects yet</h2>
                    <p className="text-zinc-500 mt-2 max-w-sm text-center">Get started by creating your first status page. It only takes a minute.</p>
                    <Link href="/setup">
                        {/* Sends back to setup flow starting from brand/connection. */}
                        <button className="mt-8 px-6 h-12 bg-white text-black rounded-full font-semibold hover:bg-zinc-200 transition-colors flex items-center gap-2">
                            <Plus className="w-4 h-4" /> Create Status Page
                        </button>
                    </Link>
                </div>
            )}



            {/* Settings Modal */}
            <AnimatePresence>
                {isSettingsSiteId && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="bg-[#09090b] border border-zinc-800 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between p-6 border-b border-zinc-800/50 bg-zinc-900/20">
                                <div>
                                    <h3 className="text-xl font-bold text-white">Project Settings</h3>
                                    <p className="text-sm text-zinc-400 mt-1">Update your brand and project details.</p>
                                </div>
                                <button
                                    onClick={() => setIsSettingsSiteId(null)}
                                    className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Body */}
                            <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
                                {/* Brand Name */}
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Brand Name</label>
                                    <input
                                        type="text"
                                        value={settingsName}
                                        onChange={(e) => setSettingsName(e.target.value)}
                                        placeholder="e.g. Acme Corp"
                                        className="w-full h-11 px-4 rounded-xl bg-black border border-zinc-800 text-white text-sm placeholder:text-zinc-700 focus:outline-none focus:border-indigo-500/50 transition-colors"
                                    />
                                </div>

                                {/* Live Website URL */}
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Live Website URL (Optional)</label>
                                    <input
                                        type="url"
                                        value={settingsLiveWebsiteUrl}
                                        onChange={(e) => setSettingsLiveWebsiteUrl(e.target.value)}
                                        placeholder="https://example.com"
                                        className="w-full h-11 px-4 rounded-xl bg-black border border-zinc-800 text-white text-sm placeholder:text-zinc-700 focus:outline-none focus:border-indigo-500/50 transition-colors"
                                    />
                                    <p className="text-[11px] text-zinc-600">The primary website this status page belongs to.</p>
                                </div>

                                {/* Logo */}
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Logo</label>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleLogoUpload}
                                        accept="image/*"
                                        className="hidden"
                                    />
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className={`
                                            relative w-full h-24 rounded-xl border border-dashed border-zinc-800 bg-black/50 
                                            flex flex-col items-center justify-center gap-2 cursor-pointer 
                                            hover:border-zinc-700 hover:bg-zinc-900/50 transition-all group
                                            ${isUploadingLogo ? 'opacity-50 pointer-events-none' : ''}
                                        `}
                                    >
                                        {settingsLogoUrl ? (
                                            <>
                                                <img
                                                    src={settingsLogoUrl}
                                                    alt="Logo Preview"
                                                    className="h-12 object-contain absolute z-0 opacity-50 group-hover:opacity-20 transition-opacity"
                                                />
                                                <div className="z-10 bg-black/50 backdrop-blur-sm p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity border border-white/10">
                                                    <UploadCloud className="w-5 h-5 text-white" />
                                                </div>
                                                <span className="text-[11px] text-zinc-400 z-10 opacity-0 group-hover:opacity-100 transition-opacity">Change Logo</span>

                                                <div
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSettingsLogoUrl('');
                                                    }}
                                                    className="absolute -top-3 -right-3 p-1.5 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-white hover:bg-red-500 hover:border-red-500 transition-all z-30 opacity-0 group-hover:opacity-100"
                                                    title="Remove Logo"
                                                >
                                                    <X className="w-4 h-4" />
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div className="p-2.5 rounded-full bg-zinc-900 border border-zinc-800 group-hover:border-zinc-700 transition-colors">
                                                    <UploadCloud className="w-5 h-5 text-zinc-400" />
                                                </div>
                                                <span className="text-xs text-zinc-500 font-medium">Click to upload logo</span>
                                            </>
                                        )}
                                        {isUploadingLogo && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm z-20 rounded-xl">
                                                <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-[11px] text-zinc-600">Recommended: PNG or SVG, max 2MB.</p>
                                </div>

                                {/* Subdomain */}
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Subdomain URL</label>
                                    <div className={`
                                        flex bg-black border rounded-xl items-center px-4 overflow-hidden transition-colors
                                        ${settingsSubdomainError ? 'border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.1)]' : 'border-zinc-800'}
                                    `}>
                                        <span className="text-zinc-500 text-sm whitespace-nowrap">statuscode.in/s/</span>
                                        <input
                                            type="text"
                                            value={settingsSubdomain}
                                            onChange={(e) => setSettingsSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                                            placeholder={settingsName.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'demo'}
                                            className="flex-1 h-11 bg-transparent border-none text-white text-sm placeholder:text-zinc-800 focus:outline-none focus:ring-0 p-0 min-w-0"
                                        />
                                        {isVerifyingSubdomain && (
                                            <Loader2 className="w-4 h-4 text-zinc-500 animate-spin shrink-0 ml-2" />
                                        )}
                                        <button
                                            onClick={() => {
                                                const slug = settingsSubdomain || settingsName.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'demo';
                                                window.open(`/s/${slug}`, '_blank');
                                            }}
                                            className="ml-3 p-1.5 rounded-md text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors shrink-0"
                                            title="Preview Public Page"
                                        >
                                            <ExternalLink className="w-4 h-4" />
                                        </button>
                                    </div>
                                    {settingsSubdomainError ? (
                                        <p className="text-[11px] text-red-500 font-medium">{settingsSubdomainError}</p>
                                    ) : (
                                        <p className="text-[11px] text-zinc-600">The public URL for this status page.</p>
                                    )}
                                </div>

                                {/* Support */}
                                <div className="space-y-4 pt-4 border-t border-zinc-800/50">
                                    <h4 className="text-sm font-semibold text-white">Support Details</h4>

                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Support Email (Optional)</label>
                                        <input
                                            type="email"
                                            value={settingsSupportEmail}
                                            onChange={(e) => setSettingsSupportEmail(e.target.value)}
                                            placeholder="support@example.com"
                                            className="w-full h-11 px-4 rounded-xl bg-black border border-zinc-800 text-white text-sm placeholder:text-zinc-700 focus:outline-none focus:border-zinc-700 transition-colors"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Custom Support URL (Optional)</label>
                                        <input
                                            type="url"
                                            value={settingsSupportUrl}
                                            onChange={(e) => setSettingsSupportUrl(e.target.value)}
                                            placeholder="https://help.example.com"
                                            className="w-full h-11 px-4 rounded-xl bg-black border border-zinc-800 text-white text-sm placeholder:text-zinc-700 focus:outline-none focus:border-zinc-700 transition-colors"
                                        />
                                        <p className="text-[11px] text-zinc-600">If set, overrides the email link.</p>
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="p-6 border-t border-zinc-800/50 bg-[#09090b] flex flex-col sm:flex-row items-center justify-between gap-4">
                                <label className="flex items-center gap-2.5 cursor-pointer group">
                                    <div className="relative flex items-center justify-center">
                                        <input
                                            type="checkbox"
                                            checked={settingsPublishImmediately}
                                            onChange={(e) => setSettingsPublishImmediately(e.target.checked)}
                                            className="peer h-4 w-4 rounded border-zinc-800 bg-black text-indigo-600 focus:ring-indigo-600 focus:ring-offset-zinc-950 transition-all cursor-pointer"
                                        />
                                    </div>
                                    <span className="text-xs text-zinc-400 group-hover:text-zinc-300 transition-colors select-none">
                                        Publish changes immediately
                                    </span>
                                </label>

                                <div className="flex gap-3 w-full sm:w-auto">
                                    <button
                                        onClick={() => setIsSettingsSiteId(null)}
                                        className="flex-1 sm:flex-none px-6 h-11 rounded-xl border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all font-medium text-sm"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSaveSettings}
                                        disabled={!!settingsSubdomainError || isSavingSettings || isVerifyingSubdomain || !hasSettingsChanges}
                                        className={`flex-1 sm:flex-none px-6 h-11 rounded-xl transition-all font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${settingsPublishImmediately
                                            ? "bg-indigo-600 text-white hover:bg-indigo-500 shadow-[0_0_20px_rgba(79,70,229,0.2)]"
                                            : "bg-amber-500 text-black hover:bg-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.2)]"
                                            }`}
                                    >
                                        {isSavingSettings ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Saving...
                                            </>
                                        ) : (
                                            settingsPublishImmediately ? "Publish" : "Save Draft"
                                        )}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {isDeletingSiteId && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="bg-[#09090b] border border-red-500/30 rounded-2xl shadow-2xl shadow-red-500/10 max-w-md w-full overflow-hidden"
                        >
                            <div className="p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                                        <AlertCircle className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-white">Delete Project?</h3>
                                        <p className="text-sm text-red-400">This action is permanent and irreversible.</p>
                                    </div>
                                </div>

                                <div className="space-y-4 mb-6">
                                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                                        <p className="text-sm text-red-200/90 leading-relaxed">
                                            <strong>Warning:</strong> All monitors, incident history, and custom settings for <span className="text-white font-bold">"{isDeletingSiteName}"</span> will be permanently deleted.
                                        </p>
                                        <p className="text-sm text-red-200/90 leading-relaxed mt-2">
                                            If published, the live status page will be immediately taken down, and visitors will see a <strong>404 page not found</strong> error.
                                        </p>
                                    </div>

                                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 space-y-3">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
                                                Please type <span className="font-mono text-white">delete:{isDeletingSiteName}</span> to confirm
                                            </label>
                                            <input
                                                type="text"
                                                value={deleteConfirmationInput}
                                                onChange={(e) => setDeleteConfirmationInput(e.target.value)}
                                                placeholder={`delete:${isDeletingSiteName}`}
                                                className="w-full h-10 px-3 bg-black border border-zinc-800 rounded-lg text-sm text-white placeholder:text-zinc-700 focus:outline-none focus:border-red-500/50 transition-colors font-mono"
                                            />
                                        </div>

                                        <label className="flex items-start gap-3 cursor-pointer group">
                                            <div className="relative flex items-center mt-0.5">
                                                <input
                                                    type="checkbox"
                                                    checked={hasConsented}
                                                    onChange={(e) => setHasConsented(e.target.checked)}
                                                    className="peer h-4 w-4 rounded border-zinc-800 bg-black text-red-600 focus:ring-red-600 focus:ring-offset-zinc-950"
                                                />
                                            </div>
                                            <span className="text-xs text-zinc-500 group-hover:text-zinc-400 transition-colors">
                                                I understand the consequences and statuscode is not liable for any issues
                                            </span>
                                        </label>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => {
                                            setIsDeletingSiteId(null);
                                            setDeleteConfirmationInput('');
                                            setHasConsented(false);
                                        }}
                                        className="flex-1 h-11 rounded-xl border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all font-medium text-sm"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        disabled={deleteConfirmationInput !== `delete:${isDeletingSiteName}` || !hasConsented}
                                        onClick={() => handleDeleteSite(isDeletingSiteId)}
                                        className="flex-1 h-11 rounded-xl bg-red-600 text-white hover:bg-red-500 transition-all font-bold text-sm shadow-[0_0_20px_rgba(220,38,38,0.2)] disabled:opacity-50 disabled:cursor-not-allowed disabled:grayscale disabled:shadow-none"
                                    >
                                        Delete Project
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
