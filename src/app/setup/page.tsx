"use client";

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import {
    Loader2, ArrowLeft, CheckCircle2,
    Key, Activity, Rocket, HelpCircle, ExternalLink,
    ChevronDown, Monitor, FileText, UploadCloud,
    Trash2, Sparkles, Palette
} from "lucide-react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useNotifications } from "@/context/NotificationContext";
import { MonitorProvider } from "@/lib/types";

// --- Animation Variants ---
const slideVariants = {
    enter: (direction: number) => ({
        x: direction > 0 ? '110%' : '-110%',
        opacity: 0,
        scale: 0.95,
        zIndex: 0,
    }),
    center: {
        zIndex: 1,
        x: 0,
        opacity: 1,
        scale: 1,
    },
    exit: (direction: number) => ({
        zIndex: 0,
        x: direction < 0 ? '110%' : '-110%',
        opacity: 0,
        scale: 0.95,
    }),
};

function SetupPageContent() {
    const supabase = createClient();
    const router = useRouter();
    const searchParams = useSearchParams();
    const mode = searchParams.get('mode');
    const [user, setUser] = useState<any>(null);
    const { addNotification, notifyProjectChange } = useNotifications();
    const [step, setStep] = useState<"setup" | "setup-theme" | "success">("setup");
    const [direction, setDirection] = useState(0);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [authLoading, setAuthLoading] = useState(true);

    // Setup State
    const [brandName, setBrandName] = useState("");
    const [brandLogo, setBrandLogo] = useState<File | null>(null);
    const [brandLogoPreview, setBrandLogoPreview] = useState<string | null>(null);
    const [source, setSource] = useState<MonitorProvider | "manual">("manual");

    // Mobile Detection
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);
    const [isSourceOpen, setIsSourceOpen] = useState(false);
    const [apiKey, setApiKey] = useState("");
    const [showApiTooltip, setShowApiTooltip] = useState(false);
    const [showSkipModal, setShowSkipModal] = useState(false);

    // Theme State
    const [selectedTheme, setSelectedTheme] = useState<'modern' | 'minimal' | 'brutal'>('modern');

    useEffect(() => {
        async function checkUser() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push("/auth");
            } else {
                setUser(user);
                setAuthLoading(false);
            }
        }
        checkUser();
    }, [router, supabase.auth]);

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setBrandLogo(file);
            const objectUrl = URL.createObjectURL(file);
            setBrandLogoPreview(objectUrl);
        }
    };

    const clearLogo = () => {
        setBrandLogo(null);
        setBrandLogoPreview(null);
    };

    const handleSetupSubmit = async () => {
        setLoading(true);
        try {
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            if (userError) throw userError;
            if (!user) throw new Error("No user found");

            let logoUrl = "";

            // Upload Logo if exists
            if (brandLogo instanceof File) {
                try {
                    const formData = new FormData();
                    formData.append("file", brandLogo);
                    formData.append("bucket", "logos");

                    const res = await fetch("/api/upload", {
                        method: "POST",
                        body: formData
                    });

                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error || "Failed to upload logo");
                    logoUrl = data.url;
                } catch (err: any) {
                    console.warn("Logo upload failed:", err.message);
                }
            }

            // Check if site with this brand name already exists for this user (Idempotency check)
            const resProjects = await fetch('/api/projects');
            let existingSite = null;
            if (resProjects.ok) {
                const dataProjects = await resProjects.json();
                existingSite = dataProjects.projects?.find((p: any) => p.brand_name === brandName);
            }

            const baseSubdomain = brandName.toLowerCase().replace(/[^a-z0-9]/g, '-');
            let subdomain = `${baseSubdomain}-${user.id.slice(0, 4)}`;

            const sitePayload = {
                user_id: user.id,
                brand_name: brandName,
                logo_url: logoUrl,
                api_key: apiKey || null,
                monitor_provider: source === 'manual' ? null : source,
                monitors: source === 'manual' ? ['demo-1', 'demo-2', 'demo-3'] : [],
                theme_config: {
                    theme: selectedTheme,
                    primaryColor: selectedTheme === 'modern' ? '#6366f1' : selectedTheme === 'brutal' ? '#ef4444' : '#18181b'
                }
            };

            const submitProjectReq = async (payloadWithSub: any) => {
                if (existingSite && mode !== 'create') {
                    const res = await fetch(`/api/projects/${existingSite.id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(payloadWithSub)
                    });
                    const resData = await res.json();
                    if (!res.ok) throw Object.assign(new Error(resData.error || "Update failed"), { code: resData.code });
                    return { isNew: false, id: existingSite.id };
                } else {
                    const res = await fetch(`/api/projects`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(payloadWithSub)
                    });
                    const resData = await res.json();
                    if (!res.ok) throw Object.assign(new Error(resData.error || "Create failed"), { code: resData.code });
                    return { isNew: true, id: resData.project.id };
                }
            };

            try {
                const result = await submitProjectReq({ ...sitePayload, subdomain });
                if (result.isNew && user) {
                    addNotification('project', 'created', 'Welcome to Statuscode! ✨', `Your project "${brandName}" is ready for customization.`, { siteId: result.id });
                    notifyProjectChange();
                }
            } catch (error: any) {
                if (error.code === '23505') {
                    // Fallback to a highly unique ID on collision
                    const fallbackSubdomain = `site-${user.id.slice(0, 8)}-${Math.random().toString(36).slice(2, 6)}`;
                    try {
                        const fallbackResult = await submitProjectReq({ ...sitePayload, subdomain: fallbackSubdomain });
                        if (fallbackResult.isNew && user) {
                            addNotification('project', 'created', 'Welcome to Statuscode! ✨', `Your project "${brandName}" is ready for customization.`, { siteId: fallbackResult.id });
                            notifyProjectChange();
                        }
                    } catch (retryError) {
                        throw retryError;
                    }
                } else {
                    throw error;
                }
            }

            if (isMobile) {
                window.location.href = "/dashboard";
            } else {
                window.location.href = "/editor";
            }
        } catch (error: any) {
            console.error("Setup failed:", error);
            setMessage(error.message || "Failed to save setup");
            setLoading(false);
        }
    };

    const handleSkip = () => setShowSkipModal(true);
    const confirmSkip = () => window.location.href = "/dashboard";
    const goBack = () => {
        setDirection(-1);
        setStep("setup");
    };

    if (authLoading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <Loader2 className="animate-spin text-white w-8 h-8" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white font-sans selection:bg-statuscode-500/30 flex items-center justify-center p-4 relative overflow-hidden">
            {/* SKIP CONFIRMATION MODAL */}
            <AnimatePresence>
                {showSkipModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl w-full max-w-sm shadow-2xl"
                        >
                            <h3 className="text-lg font-bold text-white mb-2">Skip Quick Setup?</h3>
                            <p className="text-zinc-400 text-sm mb-6">Your page is almost ready. Configuring it now saves you time later.</p>
                            <div className="flex gap-3">
                                <Button onClick={() => setShowSkipModal(false)} variant="outline" className="flex-1 bg-transparent border-zinc-700 hover:bg-zinc-800 text-white">
                                    Go Back
                                </Button>
                                <Button onClick={confirmSkip} className="flex-1 bg-white text-black hover:bg-zinc-200">
                                    Yes, Skip
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* --- VISUALS: Grid & Glow --- */}
            <div
                className="absolute inset-0 z-0 pointer-events-none"
                style={{
                    backgroundImage: `
                        linear-gradient(to right, #333333 1px, transparent 1px),
                        linear-gradient(to bottom, #333333 1px, transparent 1px)
                    `,
                    backgroundSize: '80px 80px',
                    opacity: 0.25
                }}
            />
            <div className="absolute inset-0 bg-[radial-gradient(circle_800px_at_50%_50%,transparent,rgba(0,0,0,0.4))] z-0" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-statuscode-500/10 rounded-full blur-[120px] pointer-events-none z-0" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none z-0" />

            <div className="relative z-10 w-full max-w-6xl grid grid-cols-1 md:grid-cols-12 items-center gap-8 md:gap-12 h-[600px]">
                {/* LEFT REGION: Breadcrumbs */}
                <div className="hidden md:flex col-span-3 justify-end items-center relative h-full">
                    <div className="relative w-full h-[60px] flex justify-end items-center">
                        <motion.div
                            key="letss-gooo"
                            initial={{ x: 20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            className="absolute right-0 group"
                        >
                            <div className="absolute -right-16 top-1/2 -translate-y-1/2 w-16 h-[1px] bg-gradient-to-l from-zinc-600 to-transparent" />
                            <div className="absolute -right-16 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-zinc-400 rounded-full" />
                            <div className="flex flex-col items-end pr-8">
                                <div className="text-2xl font-bold text-white tracking-tight">
                                    Lets Goo!!
                                </div>
                                <div className="text-[10px] uppercase tracking-[0.3em] font-bold text-zinc-500 mt-1 flex items-center gap-2">
                                    <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                                    READY FOR SETUP
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>

                {/* CENTER: Main Card */}
                <div className="col-span-1 md:col-start-4 md:col-span-6 relative h-[500px] flex items-center">
                    <AnimatePresence mode="popLayout" custom={direction}>
                        {step === 'setup' && (
                            <motion.div
                                key="step-setup"
                                custom={direction}
                                variants={slideVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                className="absolute w-full bg-[#09090b] border border-zinc-800 rounded-3xl p-8 shadow-2xl z-20"
                            >
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <h1 className="text-3xl font-bold text-white tracking-tight">Quick Setup</h1>
                                        <p className="text-zinc-400 text-xs mt-1">Configure your brand identity & connection.</p>
                                    </div>
                                    <button onClick={handleSkip} className="text-xs text-zinc-500 hover:text-white transition-colors underline decoration-zinc-700 underline-offset-4">
                                        Back to Dashboard
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-4">
                                        <div className="space-y-1">
                                            <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">1. Brand Identity</label>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <input
                                                    type="text"
                                                    placeholder="Brand Name (e.g. Acme)"
                                                    value={brandName}
                                                    onChange={(e) => setBrandName(e.target.value)}
                                                    className="w-full h-12 px-4 rounded-xl bg-black/40 border border-zinc-800 text-white placeholder:text-zinc-700 focus:outline-none focus:border-zinc-600 transition-all text-sm"
                                                />
                                                <div className="relative h-12">
                                                    {!brandLogoPreview ? (
                                                        <label className="flex items-center justify-center w-full h-full gap-2 px-4 transition-all border border-dashed rounded-xl cursor-pointer bg-black/40 border-zinc-800 hover:border-zinc-600 hover:bg-zinc-900/50 group">
                                                            <UploadCloud className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
                                                            <span className="text-xs text-zinc-500 group-hover:text-zinc-300 transition-colors">Upload Logo</span>
                                                            <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                                                        </label>
                                                    ) : (
                                                        <div className="flex items-center justify-between w-full h-full px-3 border rounded-xl bg-zinc-900/50 border-zinc-800">
                                                            <div className="flex items-center gap-3 overflow-hidden">
                                                                <div className="relative w-8 h-8 overflow-hidden bg-white rounded-lg shrink-0 border border-zinc-700">
                                                                    <img src={brandLogoPreview} alt="Preview" className="object-contain w-full h-full" />
                                                                </div>
                                                                <span className="text-xs text-zinc-300 truncate max-w-[100px]">{brandLogo?.name}</span>
                                                            </div>
                                                            <button onClick={clearLogo} className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className={`space-y-2 relative ${isSourceOpen ? 'z-50' : 'z-40'}`}>
                                        <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">2. Connection Source</label>
                                        <div className="relative">
                                            <button
                                                onClick={() => setIsSourceOpen(!isSourceOpen)}
                                                className="w-full h-12 px-4 rounded-xl bg-black/40 border border-zinc-800 text-white flex items-center justify-between text-sm hover:bg-zinc-900/50 transition-colors"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${source === 'uptimerobot' ? 'bg-green-500/20 text-green-400' : source === 'betterstack' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-zinc-800 text-zinc-400'}`}>
                                                        {source === 'uptimerobot' || source === 'betterstack' ? <Activity className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                                                    </div>
                                                    <div className="font-medium">
                                                        {source === 'uptimerobot' ? 'UptimeRobot' : source === 'betterstack' ? 'Better Stack' : 'Demo (No API Key)'}
                                                    </div>
                                                </div>
                                                <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform ${isSourceOpen ? 'rotate-180' : ''}`} />
                                            </button>
                                            <AnimatePresence>
                                                {isSourceOpen && (
                                                    <motion.div
                                                        initial={{ opacity: 0, y: -10 }}
                                                        animate={{ opacity: 1, y: 4 }}
                                                        exit={{ opacity: 0, y: -10 }}
                                                        className="absolute top-full left-0 right-0 bg-[#09090b] border border-zinc-800 rounded-xl p-2 shadow-2xl z-50 flex flex-col gap-1"
                                                    >
                                                        <button onClick={() => { setSource('uptimerobot'); setIsSourceOpen(false); }} className="w-full p-2 rounded-lg flex items-center gap-3 hover:bg-zinc-900 transition-colors">
                                                            <div className="w-8 h-8 rounded-lg bg-green-500/20 text-green-400 flex items-center justify-center">
                                                                <Activity className="w-4 h-4" />
                                                            </div>
                                                            <div className="text-left">
                                                                <div className="text-sm font-medium text-white">UptimeRobot</div>
                                                                <div className="text-xs text-zinc-500">Auto-sync monitors</div>
                                                            </div>
                                                            {source === 'uptimerobot' && <CheckCircle2 className="w-4 h-4 text-green-500 ml-auto" />}
                                                        </button>
                                                        <button onClick={() => { setSource('betterstack'); setIsSourceOpen(false); }} className="w-full p-2 rounded-lg flex items-center gap-3 hover:bg-zinc-900 transition-colors">
                                                            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                                                                <Activity className="w-4 h-4" />
                                                            </div>
                                                            <div className="text-left">
                                                                <div className="text-sm font-medium text-white">Better Stack</div>
                                                                <div className="text-xs text-zinc-500">Auto-sync monitors</div>
                                                            </div>
                                                            {source === 'betterstack' && <CheckCircle2 className="w-4 h-4 text-green-500 ml-auto" />}
                                                        </button>
                                                        <button onClick={() => { setSource('manual'); setIsSourceOpen(false); }} className="w-full p-2 rounded-lg flex items-center gap-3 hover:bg-zinc-900 transition-colors">
                                                            <div className="w-8 h-8 rounded-lg bg-zinc-800 text-zinc-400 flex items-center justify-center">
                                                                <FileText className="w-4 h-4" />
                                                            </div>
                                                            <div className="text-left">
                                                                <div className="text-sm font-medium text-white">Demo Mode</div>
                                                                <div className="text-xs text-zinc-500">Test with fake data</div>
                                                            </div>
                                                            {source === 'manual' && <CheckCircle2 className="w-4 h-4 text-green-500 ml-auto" />}
                                                        </button>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </div>

                                    {(source === 'uptimerobot' || source === 'betterstack') && (
                                        <div className="space-y-2 relative">
                                            <div className="flex justify-between items-center">
                                                <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">3. API Configuration</label>
                                                <div className="relative" onMouseEnter={() => setShowApiTooltip(true)} onMouseLeave={() => setShowApiTooltip(false)}>
                                                    <button onClick={() => setShowApiTooltip(!showApiTooltip)} className="text-[10px] flex items-center gap-1 text-statuscode-400 hover:underline cursor-help">
                                                        <HelpCircle className="w-3 h-3" /> Where to find {source === 'betterstack' ? 'Better Stack Token' : 'UptimeRobot Key'}?
                                                    </button>
                                                    <AnimatePresence>
                                                        {showApiTooltip && (
                                                            <motion.div
                                                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                                className="absolute bottom-full right-0 mb-2 w-64 bg-zinc-900 border border-zinc-700 rounded-xl p-4 shadow-2xl z-[100]"
                                                            >
                                                                {source === 'betterstack' ? (
                                                                    <div className="text-xs text-zinc-300 space-y-2">
                                                                        <p>1. Log in to <strong>Better Stack</strong>.</p>
                                                                        <p>2. Go to <a href="https://betterstack.com/settings/global-api-tokens" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors underline decoration-zinc-500 underline-offset-4"><strong>Settings</strong> {'->'} <strong>API tokens</strong></a>.</p>
                                                                        <p>3. Create a new <strong>Uptime API Token</strong>.</p>
                                                                    </div>
                                                                ) : (
                                                                    <div className="text-xs text-zinc-300 space-y-2">
                                                                        <p>1. Log in to <strong>UptimeRobot</strong>.</p>
                                                                        <p>2. Go to <a href="https://dashboard.uptimerobot.com/integrations" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors underline decoration-zinc-500 underline-offset-4"><strong>Integrations and API</strong></a> → <strong>API</strong>.</p>
                                                                        <p>3. Create a <strong>Read-Only API Key</strong>.</p>
                                                                    </div>
                                                                )}
                                                                <div className="absolute top-full right-4 -mt-1 w-2 h-2 bg-zinc-900 border-r border-b border-zinc-700 rotate-45 transform" />
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>
                                            </div>
                                            <div className="relative">
                                                <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                                <input
                                                    type="password"
                                                    placeholder={source === 'betterstack' ? "Paste Uptime API Token" : "Paste Read-Only API Key"}
                                                    value={apiKey}
                                                    onChange={(e) => setApiKey(e.target.value)}
                                                    className="w-full h-12 pl-12 pr-4 rounded-xl bg-black/40 border border-zinc-800 text-white placeholder:text-zinc-700 focus:outline-none focus:border-statuscode-500/50 focus:ring-4 focus:ring-statuscode-500/10 transition-all text-sm font-mono"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <div className="pt-2">
                                        <Button
                                            onClick={() => { setDirection(1); setStep("setup-theme" as any); }}
                                            disabled={source !== 'manual' && !apiKey}
                                            className="w-full h-12 bg-white text-black transition-all rounded-xl font-medium shadow-[0_0_20px_rgba(255,255,255,0.2)] disabled:opacity-50 disabled:cursor-not-allowed enabled:hover:bg-zinc-200"
                                        >
                                            Next: Select Theme <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {step === 'setup-theme' && (
                            <motion.div
                                key="step-setup-theme"
                                custom={direction}
                                variants={slideVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                className={`absolute w-full border rounded-3xl p-8 shadow-2xl overflow-hidden z-20 flex flex-col transition-colors duration-500 
                                    ${selectedTheme === 'modern' ? 'bg-zinc-950/90 border-zinc-800' :
                                        selectedTheme === 'minimal' ? 'bg-black border-zinc-800' :
                                            'bg-[#121212] border-black shadow-[8px_8px_0px_rgba(255,255,255,0.1)]'}`}
                            >
                                <div className="flex justify-between items-start mb-8">
                                    <button onClick={goBack} className="text-zinc-500 hover:text-white transition-colors flex items-center gap-2 text-sm">
                                        <ArrowLeft className="w-4 h-4" /> Back
                                    </button>
                                    <div className="text-right">
                                        <h1 className={`text-2xl font-bold text-white tracking-tight ${selectedTheme === 'brutal' ? 'uppercase font-mono tracking-widest' : ''}`}>Choose Style</h1>
                                        <p className="text-zinc-400 text-xs mt-1">Select a theme that fits your brand.</p>
                                    </div>
                                </div>

                                <div className="flex-1 flex flex-col justify-center space-y-6">
                                    <div className="grid grid-cols-1 gap-4">
                                        {[
                                            { id: 'modern', name: 'Modern', desc: 'Clean, trusted.', color: '#6366f1' },
                                            { id: 'minimal', name: 'Minimal', desc: 'No noise. Just status.', color: '#18181b' },
                                            { id: 'brutal', name: 'Brutal', desc: 'Bold. High contrast.', color: '#ef4444' }
                                        ].map((t) => (
                                            <button
                                                key={t.id}
                                                onClick={() => setSelectedTheme(t.id as any)}
                                                className={`relative p-4 rounded-xl border text-left transition-all duration-300 group
                                                    ${selectedTheme === t.id
                                                        ? (t.id === 'modern' ? 'bg-zinc-900 border-indigo-500/50 ring-1 ring-indigo-500/20' :
                                                            t.id === 'minimal' ? 'bg-black border-white' :
                                                                'bg-zinc-900 border-black shadow-[4px_4px_0px_white]')
                                                        : 'bg-transparent border-zinc-800 hover:border-zinc-600 hover:bg-zinc-900/30'
                                                    }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${selectedTheme === t.id ? 'scale-110' : 'scale-100'} ${t.id === 'modern' ? 'bg-indigo-500/20 text-indigo-400' : t.id === 'brutal' ? 'bg-red-500/20 text-red-500 rounded-none' : 'bg-white/10 text-white'}`}>
                                                            {t.id === 'modern' ? <Sparkles className="w-5 h-5" /> : t.id === 'brutal' ? <Activity className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
                                                        </div>
                                                        <div>
                                                            <div className={`font-medium text-white ${t.id === 'brutal' ? 'font-mono uppercase tracking-wider' : 'font-sans'}`}>{t.name}</div>
                                                            <div className="text-xs text-zinc-500">{t.desc}</div>
                                                        </div>
                                                    </div>
                                                    {selectedTheme === t.id && (
                                                        <div className={`w-6 h-6 flex items-center justify-center rounded-full ${t.id === 'modern' ? 'bg-indigo-500 text-white' : t.id === 'brutal' ? 'bg-red-500 text-black rounded-none' : 'bg-white text-black'}`}>
                                                            <CheckCircle2 className="w-4 h-4" />
                                                        </div>
                                                    )}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                    <div className="pt-4">
                                        <Button
                                            onClick={handleSetupSubmit}
                                            className={`w-full h-14 text-lg font-medium transition-all duration-300
                                                ${selectedTheme === 'modern' ? 'bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-[0_0_20px_rgba(99,102,241,0.4)]' :
                                                    selectedTheme === 'minimal' ? 'bg-white hover:bg-zinc-200 text-black rounded-none border-b-2 border-zinc-300' :
                                                        'bg-red-600 hover:bg-red-700 text-black border-2 border-black shadow-[4px_4px_0px_black] rounded-md uppercase tracking-widest'
                                                }`}
                                        >
                                            {loading ? <Loader2 className="animate-spin w-5 h-5" /> : "Launch Editor"}
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* RIGHT REGION: Contextual Badge */}
                <div className="hidden md:flex col-span-3 justify-start items-center relative h-full">
                    <AnimatePresence mode="popLayout" initial={false}>
                        <motion.div
                            key="badge-final"
                            initial={{ x: 20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            className="absolute left-0 group"
                        >
                            <div className="absolute -left-16 top-1/2 -translate-y-1/2 w-16 h-[1px] bg-gradient-to-r from-zinc-600 to-transparent" />
                            <div className="absolute -left-16 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-zinc-400 rounded-full" />
                            <div className="bg-statuscode-500/10 backdrop-blur-md border border-statuscode-500/20 rounded-full px-5 py-3 flex items-center gap-3 shadow-[0_0_20px_rgba(168,85,247,0.2)]">
                                <div className="text-right">
                                    <div className="text-xs font-bold text-statuscode-300 tracking-wide uppercase">
                                        {step === 'setup' ? 'Next Step' : 'Final Step'}
                                    </div>
                                    <div className="text-[10px] text-statuscode-400/80">
                                        {step === 'setup' ? 'Select Theme' : 'Launch Control'}
                                    </div>
                                </div>
                                <div className="w-8 h-8 rounded-full bg-statuscode-500/20 flex items-center justify-center text-statuscode-400">
                                    {step === 'setup' ? <Palette className="w-4 h-4" /> : <Rocket className="w-4 h-4" />}
                                </div>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}

import { Suspense } from "react";

export default function SetupPageWrapper() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-black flex items-center justify-center">
                <Loader2 className="animate-spin text-white w-8 h-8" />
            </div>
        }>
            <SetupPageContent />
        </Suspense>
    );
}
