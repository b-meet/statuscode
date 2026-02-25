"use client";

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, ArrowLeft, Github, ShieldCheck, MousePointerClick, CheckCircle2, Key, Sun, Moon, Activity, Rocket, X, HelpCircle, ExternalLink, Image as ImageIcon, ChevronDown, Monitor, FileText, UploadCloud, Trash2, Sparkles, Palette } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";

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

const badgeVariants = {
    initial: { x: -20, opacity: 0, scale: 0.9 },
    animate: { x: 0, opacity: 1, scale: 1 },
    exit: { x: 20, opacity: 0, scale: 0.9 },
};

function AuthPageContent() {
    const supabase = createClient();
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState(["", "", "", "", "", ""]); // 6 digits
    const [step, setStep] = useState<"email" | "otp" | "setup" | "success">("email");
    const [direction, setDirection] = useState(0); // 1 = forward, -1 = back
    const [loading, setLoading] = useState(false);
    const [timer, setTimer] = useState(0);
    const [message, setMessage] = useState("");

    // Setup State
    const [brandName, setBrandName] = useState("");
    const [brandLogo, setBrandLogo] = useState<File | null>(null);
    const [brandLogoPreview, setBrandLogoPreview] = useState<string | null>(null);
    const [source, setSource] = useState<"uptimerobot" | "manual">("uptimerobot");
    const [isSourceOpen, setIsSourceOpen] = useState(false);
    const [apiKey, setApiKey] = useState("");
    const [showApiTooltip, setShowApiTooltip] = useState(false);
    const [showSkipModal, setShowSkipModal] = useState(false);
    const [isNewUser, setIsNewUser] = useState<boolean>(true); // Assume new until checked
    // Theme State
    const [selectedTheme, setSelectedTheme] = useState<'modern' | 'minimal' | 'brutal'>('modern');

    const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Mobile Detection for disabling transitions
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const searchParams = useSearchParams();

    useEffect(() => {
        const emailParam = searchParams.get("email");
        const stepParam = searchParams.get("step");

        if (emailParam) {
            setEmail(emailParam);
        }

        if (stepParam === "otp" && emailParam) {
            setStep("otp");
            setDirection(1);
            setTimer(60);
        }
    }, [searchParams]);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (timer > 0) {
            interval = setInterval(() => setTimer((t) => t - 1), 1000);
        }
        return () => clearInterval(interval);
    }, [timer]);

    // --- Actions ---

    const handleSocialLogin = async (provider: "github" | "google") => {
        // Mocking setup transition for social login for now (or handle in callback)
        await supabase.auth.signInWithOAuth({
            provider,
            options: {
                redirectTo: `${location.origin}/auth/callback`,
            },
        });
    };

    const handleEmailContinue = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        // Basic validation
        if (!email || !email.includes('@')) {
            setMessage("Please enter a valid email.");
            return;
        }

        setLoading(true);
        setMessage("");

        try {
            const res = await fetch("/api/auth/otp/send", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || "Failed to send verification code");

            if (data.isNewUser !== undefined) {
                setIsNewUser(data.isNewUser);
            }

            setDirection(1); // Moving forward
            setStep("otp");
            setTimer(60);
        } catch (err: any) {
            setMessage(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleOtpChange = (index: number, value: string) => {
        if (isNaN(Number(value))) return;

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Auto-focus next input
        if (value && index < 5) {
            otpInputRefs.current[index + 1]?.focus();
        }

        // Auto-submit if full
        if (index === 5 && value && newOtp.every(d => d !== "")) {
            verifyOtp(newOtp.join(""));
        }
    };

    const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
        // Backspace focus previous
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            otpInputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);

        if (!pastedData) return;

        const newOtp = [...otp];
        for (let i = 0; i < pastedData.length; i++) {
            newOtp[i] = pastedData[i];
        }
        setOtp(newOtp);

        // Focus validation
        if (pastedData.length === 6) {
            otpInputRefs.current[5]?.focus();
            verifyOtp(pastedData);
        } else {
            otpInputRefs.current[pastedData.length]?.focus();
        }
    };

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

    const verifyOtp = async (tokenOverride?: string) => {
        const token = tokenOverride || otp.join("");
        setLoading(true);
        try {
            const res = await fetch("/api/auth/otp/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, token }),
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || "Invalid verification code");

            // Success
            if (isMobile || !isNewUser) {
                // Return users or Mobile: Skip setup, go to dashboard
                window.location.href = "/dashboard";
            } else {
                // Desktop New User: Go to Setup
                setDirection(1);
                setStep("setup");
            }
        } catch (err: any) {
            setMessage(err.message);
        } finally {
            setLoading(false);
        }
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
                const fileExt = brandLogo.name.split('.').pop();
                const fileName = `${user.id}-${Math.random()}.${fileExt}`;
                const { error: uploadError } = await supabase.storage
                    .from('logos')
                    .upload(fileName, brandLogo);

                if (uploadError) {
                    console.warn("Logo upload failed (bucket might be missing):", uploadError.message);
                } else {
                    const { data: { publicUrl } } = supabase.storage
                        .from('logos')
                        .getPublicUrl(fileName);
                    logoUrl = publicUrl;
                }
            }

            // Check if site exists for this user
            const { data: existingSite } = await supabase
                .from('sites')
                .select('id')
                .eq('user_id', user.id)
                .maybeSingle();

            const baseSubdomain = brandName.toLowerCase().replace(/[^a-z0-9]/g, '-');
            let subdomain = `${baseSubdomain}-${user.id.slice(0, 4)}`; // Default: brand-shortid

            const sitePayload = {
                user_id: user.id,
                brand_name: brandName,
                logo_url: logoUrl,
                uptimerobot_api_key: apiKey,
                // subdomain: subdomain, // Set below dynamically
                monitors: [],
                theme_config: {
                    theme: selectedTheme,
                    primaryColor: selectedTheme === 'modern' ? '#6366f1' : selectedTheme === 'brutal' ? '#ef4444' : '#18181b'
                }
            };

            try {
                if (existingSite) {
                    // Update existing
                    const { error } = await supabase
                        .from('sites')
                        .update({ ...sitePayload, subdomain }) // Try updating subdomain too
                        .eq('id', existingSite.id);
                    if (error) throw error;
                } else {
                    // Insert new
                    const { error } = await supabase
                        .from('sites')
                        .insert({ ...sitePayload, subdomain });
                    if (error) throw error;
                }
            } catch (error: any) {
                // Handle Subdomain Collision (Postgres Code 23505 = unique_violation)
                if (error.code === '23505') {
                    console.warn("Subdomain taken, falling back to unique ID method.");
                    // Fallback: Use full user ID or random string to guarantee uniqueness
                    // "dont user the brandname as subdomain" -> We switch to a generic ID-based subdomain
                    const fallbackSubdomain = `site-${user.id.slice(0, 8)}-${Math.random().toString(36).slice(2, 6)}`;

                    if (existingSite) {
                        const { error: retryError } = await supabase
                            .from('sites')
                            .update({ ...sitePayload, subdomain: fallbackSubdomain })
                            .eq('id', existingSite.id);
                        if (retryError) throw retryError;
                    } else {
                        const { error: retryError } = await supabase
                            .from('sites')
                            .insert({ ...sitePayload, subdomain: fallbackSubdomain });
                        if (retryError) throw retryError;
                    }
                } else {
                    throw error; // Rethrow other errors
                }
            }

            // Redirect
            if (!isMobile) {
                window.open("/editor", "_blank");
            }
            window.location.href = "/dashboard";
        } catch (error: any) {
            console.error("Setup failed:", error);
            setMessage(error.message || "Failed to save setup");
            setLoading(false);
        }
    };

    const handleSkip = () => {
        setShowSkipModal(true);
    };

    const confirmSkip = () => {
        window.location.href = "/dashboard";
    };

    const goBack = () => {
        setDirection(-1);
        if (step === 'setup') {
            setStep("otp");
            return;
        }
        setStep("email");
        setMessage("");
    };

    const isEmailValid = email.includes('@') && email.includes('.');

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

            {/* Backlight Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-statuscode-500/10 rounded-full blur-[120px] pointer-events-none z-0" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none z-0" />

            {/* Close Button - Hide on Setup Step */}



            {/* --- MAIN LAYOUT GRID --- */}
            <div className="relative z-10 w-full max-w-6xl grid grid-cols-1 md:grid-cols-12 items-center gap-8 md:gap-12 h-[600px]">

                {/* 
                    LEFT REGION: Badge Breadcrumbs 
                    Logic: 
                    - Step 'email': "Smart Auth" is here (active).
                    - Step 'otp': "Smart Auth" moves left (exit), "Select Method" moves here (active).
                 */}
                <div className="hidden md:flex col-span-3 justify-end items-center relative h-full">
                    <div className="relative w-full h-[60px] flex justify-end items-center">
                        <AnimatePresence mode="popLayout" initial={false}>
                            {step === 'email' ? (
                                <motion.div
                                    key="badge-smart"
                                    initial={{ x: -20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    exit={{ x: -20, opacity: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="absolute right-0 group"
                                >
                                    {/* Connector */}
                                    <div className="absolute -right-16 top-1/2 -translate-y-1/2 w-16 h-[1px] bg-gradient-to-l from-zinc-600 to-transparent" />
                                    <div className="absolute -right-16 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-zinc-400 rounded-full" />

                                    {/* Smart Auth Badge */}
                                    <div className="bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-full px-5 py-3 flex items-center gap-3 shadow-xl">
                                        <div className="w-8 h-8 rounded-full bg-statuscode-500/20 flex items-center justify-center text-statuscode-400">
                                            <ShieldCheck className="w-4 h-4" />
                                        </div>
                                        <div className="text-left">
                                            <div className="text-xs font-bold text-white tracking-wide uppercase">Smart Auth</div>
                                            <div className="text-[10px] text-zinc-400">Secure & Seamless</div>
                                        </div>
                                    </div>
                                </motion.div>
                            ) : (step === 'otp' || step === 'setup' || step === ('setup-theme' as any)) ? (
                                <motion.div
                                    key="badge-method"
                                    initial={{ x: 20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    exit={{ x: 20, opacity: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="absolute right-0 group"
                                >
                                    {/* Connector */}
                                    <div className="absolute -right-16 top-1/2 -translate-y-1/2 w-16 h-[1px] bg-gradient-to-l from-zinc-600 to-transparent" />
                                    <div className="absolute -right-16 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-zinc-400 rounded-full" />

                                    {/* Verification Badge (Next Step) */}
                                    <div className={`backdrop-blur-md border rounded-full px-5 py-3 flex items-center gap-3 shadow-xl transition-colors ${step === 'setup' || step === ('setup-theme' as any) ? 'bg-zinc-800/50 border-zinc-700' : 'bg-zinc-900/80 border-zinc-800'}`}>
                                        <div className="text-right">
                                            <div className="text-xs font-bold text-white tracking-wide uppercase">
                                                {step === 'otp' ? 'Verification' : 'Completed'}
                                            </div>
                                            <div className="text-[10px] text-zinc-400">
                                                {step === 'otp' ? 'Current Step' : 'Identity Verified'}
                                            </div>
                                        </div>
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'setup' || step === ('setup-theme' as any) ? 'bg-green-500/20 text-green-400' : 'bg-zinc-800 text-zinc-400'}`}>
                                            {step === 'setup' || step === ('setup-theme' as any) ? <CheckCircle2 className="w-4 h-4" /> : <Key className="w-4 h-4" />}
                                        </div>
                                    </div>
                                </motion.div>
                            ) : null}
                        </AnimatePresence>
                    </div>
                </div>

                {/* CENTER: Main Card (Horizontal Slider) */}
                <div className="col-span-1 md:col-start-4 md:col-span-6 relative h-[500px] flex items-center">
                    <AnimatePresence mode="popLayout" custom={direction}>

                        {/* CARD A: Email Input */}
                        {step === 'email' && (
                            <motion.div
                                key="step-email"
                                custom={direction}
                                variants={!isMobile ? slideVariants : undefined}
                                initial={!isMobile ? "enter" : undefined}
                                animate={!isMobile ? "center" : undefined}
                                exit={!isMobile ? "exit" : undefined}
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                className="absolute left-0 w-full bg-[#09090b] border border-zinc-800 rounded-3xl p-8 shadow-2xl overflow-hidden z-10"
                            >
                                <div className="mb-8">
                                    <div className="flex items-center gap-3">
                                        <div className="relative w-10 h-10">
                                            <Image
                                                src="/logo.svg"
                                                alt="Statuscode Logo"
                                                fill
                                                className="object-contain"
                                                priority
                                            />
                                        </div>
                                        <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-b from-white to-zinc-400 bg-clip-text text-transparent">
                                            Statuscode
                                        </h1>
                                    </div>
                                    <p className="text-zinc-400 text-sm mt-3">Create your brand's status page exactly how you want.</p>
                                </div>

                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <Button variant="outline" onClick={() => handleSocialLogin('github')} className="h-12 bg-zinc-900/50 border-zinc-800 hover:bg-zinc-800 hover:text-white rounded-xl">
                                            <Github className="w-5 h-5 mr-2" /> GitHub
                                        </Button>
                                        <Button variant="outline" onClick={() => handleSocialLogin('google')} className="h-12 bg-zinc-900/50 border-zinc-800 hover:bg-zinc-800 hover:text-white rounded-xl">
                                            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg> Google
                                        </Button>
                                    </div>

                                    <div className="relative py-2">
                                        <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-zinc-800" /></div>
                                        <div className="relative flex justify-center text-[10px] uppercase tracking-wider"><span className="bg-[#09090b] px-3 text-zinc-500">Or continue with email</span></div>
                                    </div>

                                    <form onSubmit={handleEmailContinue} className="space-y-4">
                                        <input
                                            type="email"
                                            placeholder="name@example.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full h-12 px-5 rounded-xl bg-black/40 border border-zinc-800 text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/30 focus:ring-4 focus:ring-white/5 transition-all text-sm"
                                            required
                                        />
                                        <Button
                                            type="submit"
                                            className={`w-full h-12 rounded-xl font-medium text-sm transition-all duration-300 ${isEmailValid ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.4)]' : 'bg-zinc-800 text-zinc-400 shadow-[0_0_20px_rgba(0,0,0,0.4)]'}`}
                                            disabled={loading}
                                        >
                                            {loading ? <Loader2 className="animate-spin w-4 h-4" /> : "Get Verification Code"}
                                        </Button>
                                    </form>

                                    {message && (
                                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-center">
                                            <p className="text-xs text-red-400 font-medium">{message}</p>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {/* CARD B: OTP Verification */}
                        {step === 'otp' && (
                            <motion.div
                                key="step-otp"
                                custom={direction}
                                variants={!isMobile ? slideVariants : undefined}
                                initial={!isMobile ? "enter" : undefined}
                                animate={!isMobile ? "center" : undefined}
                                exit={!isMobile ? "exit" : undefined}
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                className="absolute left-0 w-full bg-[#09090b] border border-zinc-800 rounded-3xl p-6 md:p-8 shadow-2xl overflow-hidden z-20"
                            >
                                <button
                                    onClick={goBack}
                                    className="mb-6 text-zinc-500 hover:text-white transition-colors flex items-center gap-2 text-sm"
                                >
                                    <ArrowLeft className="w-4 h-4" /> Back
                                </button>

                                <div className="mb-8">
                                    <h1 className="text-3xl font-bold text-white tracking-tight">Check your inbox</h1>
                                    <p className="text-zinc-400 text-sm mt-3">We've sent a code to <span className="text-white">{email}</span></p>
                                </div>

                                <div className="space-y-8">
                                    {/* Segmented OTP Input */}
                                    <div className="flex justify-between gap-1 md:gap-2">
                                        {otp.map((digit, idx) => (
                                            <input
                                                key={idx}
                                                ref={(el) => { otpInputRefs.current[idx] = el; }} // No return value needed
                                                type="text"
                                                pattern="[0-9]*"
                                                inputMode="numeric"
                                                maxLength={1}
                                                value={digit}
                                                onChange={(e) => handleOtpChange(idx, e.target.value)}
                                                onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                                                onPaste={idx === 0 ? handlePaste : undefined}
                                                className="w-10 h-12 md:w-12 md:h-14 rounded-xl bg-black/40 border border-zinc-800 text-white text-center text-xl md:text-2xl font-mono focus:outline-none focus:border-statuscode-500/50 focus:ring-4 focus:ring-statuscode-500/10 transition-all"
                                                autoFocus={idx === 0}
                                            />
                                        ))}
                                    </div>

                                    <Button
                                        onClick={() => verifyOtp()}
                                        className="w-full h-12 bg-white text-black hover:bg-zinc-200 transition-all rounded-xl font-medium"
                                        disabled={loading}
                                    >
                                        {loading ? <Loader2 className="animate-spin w-4 h-4" /> : "Verify Access"}
                                    </Button>

                                    <div className="text-center">
                                        <button
                                            onClick={timer === 0 ? handleEmailContinue : undefined}
                                            disabled={timer > 0}
                                            className={`${timer > 0 ? 'text-zinc-600' : 'text-zinc-400 hover:text-white'} text-xs transition-colors`}
                                        >
                                            {timer > 0 ? `Resend code in ${timer}s` : "Didn't receive the email? Resend"}
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}



                        {/* CARD Setup Step 1: Brand & Connection */}
                        {step === 'setup' && (
                            <motion.div
                                key="step-setup"
                                custom={direction}
                                variants={!isMobile ? slideVariants : undefined}
                                initial={!isMobile ? "enter" : undefined}
                                animate={!isMobile ? "center" : undefined}
                                exit={!isMobile ? "exit" : undefined}
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                className="absolute left-0 w-full bg-[#09090b] border border-zinc-800 rounded-3xl p-8 shadow-2xl overflow-hidden z-20"
                            >
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <h1 className="text-3xl font-bold text-white tracking-tight">Quick Setup</h1>
                                        <p className="text-zinc-400 text-xs mt-1">Configure your brand identity & connection.</p>
                                    </div>
                                    <button onClick={handleSkip} className="text-xs text-zinc-500 hover:text-white transition-colors underline decoration-zinc-700 underline-offset-4">
                                        Skip to Dashboard
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    {/* 1. Brand Details */}
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
                                                            <input
                                                                type="file"
                                                                accept="image/png, image/jpeg, image/jpg"
                                                                className="hidden"
                                                                onChange={handleLogoUpload}
                                                            />
                                                        </label>
                                                    ) : (
                                                        <div className="flex items-center justify-between w-full h-full px-3 border rounded-xl bg-zinc-900/50 border-zinc-800">
                                                            <div className="flex items-center gap-3 overflow-hidden">
                                                                <div className="relative w-8 h-8 overflow-hidden bg-white rounded-lg shrink-0 border border-zinc-700">
                                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                                    <img src={brandLogoPreview} alt="Logo Preview" className="object-contain w-full h-full" />
                                                                </div>
                                                                <span className="text-xs text-zinc-300 truncate max-w-[100px]">{brandLogo?.name}</span>
                                                            </div>
                                                            <button
                                                                onClick={clearLogo}
                                                                className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 2. Connection Source */}
                                    <div className={`space-y-2 relative ${isSourceOpen ? 'z-50' : 'z-40'}`}>
                                        <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">2. Connection Source</label>
                                        <div className="relative">
                                            <button
                                                onClick={() => setIsSourceOpen(!isSourceOpen)}
                                                className="w-full h-12 px-4 rounded-xl bg-black/40 border border-zinc-800 text-white flex items-center justify-between text-sm hover:bg-zinc-900/50 transition-colors"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${source === 'uptimerobot' ? 'bg-green-500/20 text-green-400' : 'bg-zinc-800 text-zinc-400'}`}>
                                                        {source === 'uptimerobot' ? <Activity className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                                                    </div>
                                                    <div className="text-left">
                                                        <div className="font-medium">{source === 'uptimerobot' ? 'UptimeRobot' : 'Manual / Custom'}</div>
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
                                                        className="absolute top-full left-0 right-0 bg-[#09090b] border border-zinc-800 rounded-xl p-2 shadow-2xl z-50"
                                                    >
                                                        <button
                                                            onClick={() => { setSource('uptimerobot'); setIsSourceOpen(false); }}
                                                            className="w-full p-2 rounded-lg flex items-center gap-3 hover:bg-zinc-900 transition-colors"
                                                        >
                                                            <div className="w-8 h-8 rounded-lg bg-green-500/20 text-green-400 flex items-center justify-center">
                                                                <Activity className="w-4 h-4" />
                                                            </div>
                                                            <div className="text-left">
                                                                <div className="text-sm font-medium text-white">UptimeRobot</div>
                                                                <div className="text-xs text-zinc-500">Auto-sync monitors</div>
                                                            </div>
                                                            {source === 'uptimerobot' && <CheckCircle2 className="w-4 h-4 text-green-500 ml-auto" />}
                                                        </button>

                                                        <button
                                                            disabled
                                                            className="w-full p-2 rounded-lg flex items-center gap-3 opacity-50 cursor-not-allowed"
                                                        >
                                                            <div className="w-8 h-8 rounded-lg bg-zinc-800 text-zinc-400 flex items-center justify-center">
                                                                <FileText className="w-4 h-4" />
                                                            </div>
                                                            <div className="text-left">
                                                                <div className="text-sm font-medium text-zinc-400">Manual / Custom</div>
                                                                <div className="text-xs text-zinc-600">Coming Soon</div>
                                                            </div>
                                                        </button>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </div>

                                    {/* 3. API Key Config */}
                                    {source === 'uptimerobot' && (
                                        <div className={`space-y-2 relative ${showApiTooltip ? 'z-[60]' : 'z-30'}`}>
                                            <div className="flex justify-between items-center">
                                                <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">3. API Configuration</label>
                                                <div
                                                    className="relative"
                                                    onMouseEnter={() => setShowApiTooltip(true)}
                                                    onMouseLeave={() => setShowApiTooltip(false)}
                                                >
                                                    <button
                                                        onClick={() => setShowApiTooltip(!showApiTooltip)}
                                                        className="text-[10px] flex items-center gap-1 text-statuscode-400 hover:underline cursor-help"
                                                    >
                                                        <HelpCircle className="w-3 h-3" /> Where to find?
                                                    </button>
                                                    <AnimatePresence>
                                                        {showApiTooltip && (
                                                            <motion.div
                                                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                                className="absolute bottom-full right-0 mb-2 w-64 bg-zinc-900 border border-zinc-700 rounded-xl p-4 shadow-2xl z-[100]"
                                                            >
                                                                <div className="text-xs text-zinc-300 space-y-2">
                                                                    <p>1. Log in to <strong>UptimeRobot</strong>.</p>
                                                                    <p>2. Go to <strong>Integrations and API</strong> → <strong>API</strong>.</p>
                                                                    <p>3. Create a <strong>Read-Only API Key</strong>.</p>
                                                                    <a href="https://dashboard.uptimerobot.com/integrations" target="_blank" rel="noopener noreferrer" className="mt-2 text-[10px] inline-flex items-center gap-1 text-statuscode-400 hover:text-white transition-colors">
                                                                        Open Settings <ExternalLink className="w-3 h-3" />
                                                                    </a>
                                                                </div>
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
                                                    placeholder="Paste Read-Only API Key"
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
                                            className="w-full h-12 bg-white text-black hover:bg-zinc-200 transition-all rounded-xl font-medium shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                                        >
                                            Next: Select Theme <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* CARD Setup Step 2: Immersive Theme Selection */}
                        {step === ('setup-theme' as any) && (
                            <motion.div
                                key="step-setup-theme"
                                custom={direction}
                                variants={!isMobile ? slideVariants : undefined}
                                initial={!isMobile ? "enter" : undefined}
                                animate={!isMobile ? "center" : undefined}
                                exit={!isMobile ? "exit" : undefined}
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                className={`absolute w-full border rounded-3xl p-8 shadow-2xl overflow-hidden z-20 flex flex-col transition-colors duration-500 
                                    ${selectedTheme === 'modern' ? 'bg-zinc-950/90 border-zinc-800' :
                                        selectedTheme === 'minimal' ? 'bg-black border-zinc-800' :
                                            'bg-[#121212] border-black shadow-[8px_8px_0px_rgba(255,255,255,0.1)]'}`}
                            >
                                <div className="flex justify-between items-start mb-8">
                                    <button
                                        onClick={() => { setDirection(-1); setStep("setup"); }}
                                        className="text-zinc-500 hover:text-white transition-colors flex items-center gap-2 text-sm"
                                    >
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

                        {/* CARD C: Success */}
                        {step === 'success' && (
                            <motion.div
                                key="step-success"
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="absolute w-full h-full bg-[#09090b] border border-zinc-800 rounded-3xl p-8 shadow-2xl flex flex-col items-center justify-center text-center z-30"
                            >
                                <motion.div
                                    initial={{ scale: 0, rotate: -45 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{ type: "spring", stiffness: 300, damping: 15 }}
                                >
                                    <CheckCircle2 className="w-20 h-20 text-green-500 mb-6" />
                                </motion.div>
                                <h2 className="text-3xl font-bold text-white">Huge Success!</h2>
                                <p className="text-zinc-500 text-sm mt-2">Redirecting to dashboard...</p>
                            </motion.div>
                        )}

                    </AnimatePresence>
                </div>

                {/* 
                    RIGHT REGION: "Select Method" Badge 
                    Logic:
                    - Step 'email': Moves here (default).
                    - Step 'otp': Slides left to become the 'active' badge in the left region.
                 */}
                <div className="hidden md:flex col-span-3 justify-start items-center relative h-full">
                    <AnimatePresence mode="popLayout" initial={false}>
                        {(step === 'email' || step === 'otp') && isNewUser ? (
                            <motion.div
                                key="badge-select-method"
                                initial={{ x: 20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                exit={{ x: -20, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="absolute left-0 group"
                            >
                                {/* Connector */}
                                <div className="absolute -left-16 top-1/2 -translate-y-1/2 w-16 h-[1px] bg-gradient-to-r from-zinc-600 to-transparent" />
                                <div className="absolute -left-16 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-zinc-400 rounded-full" />

                                {/* Contextual Badge */}
                                <div className="bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-full px-5 py-3 flex items-center gap-3 shadow-xl">
                                    <div className="text-right">
                                        <div className="text-xs font-bold text-white tracking-wide uppercase">
                                            {step === 'email' ? 'Verification' : 'Quick Setup'}
                                        </div>
                                        <div className="text-[10px] text-zinc-400">
                                            {step === 'email' ? 'Next Step' : 'Almost There'}
                                        </div>
                                    </div>
                                    <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400">
                                        {/* Dynamic Icon based on next step */}
                                        {step === 'email' ? <Key className="w-4 h-4" /> : <Rocket className="w-4 h-4" />}
                                    </div>
                                </div>
                            </motion.div>
                        ) : (step === 'setup' || step === ('setup-theme' as any)) ? (
                            <motion.div
                                key="badge-final"
                                initial={{ x: 20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                exit={{ x: -20, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="absolute left-0 group"
                            >
                                {/* Connector */}
                                <div className="absolute -left-16 top-1/2 -translate-y-1/2 w-16 h-[1px] bg-gradient-to-r from-zinc-600 to-transparent" />
                                <div className="absolute -left-16 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-zinc-400 rounded-full" />

                                {/* Final Step Badge */}
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
                        ) : null}
                    </AnimatePresence>
                </div>

            </div>
        </div>
    );
}

export default function AuthPageWrapper() {
    return (
        <AuthPageContent />
    );
}

