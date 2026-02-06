"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, ArrowLeft, Github, ShieldCheck, MousePointerClick, CheckCircle2, Key } from "lucide-react";
import Link from "next/link";

// --- Animation Variants ---
const slideVariants = {
    enter: (direction: number) => ({
        x: direction > 0 ? 100 : -100,
        opacity: 0,
    }),
    center: {
        zIndex: 1,
        x: 0,
        opacity: 1,
    },
    exit: (direction: number) => ({
        zIndex: 0,
        x: direction < 0 ? 100 : -100,
        opacity: 0,
    }),
};

const badgeVariants = {
    initial: { x: 0, opacity: 1, scale: 1 },
    exitLeft: { x: -100, opacity: 0, scale: 0.8 },
    enterRight: { x: 100, opacity: 0, scale: 0.8 },
    active: { x: 0, opacity: 1, scale: 1 },
};

export default function AuthPage() {
    const supabase = createClient();
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState(["", "", "", "", "", ""]); // 6 digits
    const [step, setStep] = useState<"email" | "otp" | "success">("email");
    const [direction, setDirection] = useState(0); // 1 = forward, -1 = back
    const [loading, setLoading] = useState(false);
    const [timer, setTimer] = useState(0);
    const [message, setMessage] = useState("");
    const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (timer > 0) {
            interval = setInterval(() => setTimer((t) => t - 1), 1000);
        }
        return () => clearInterval(interval);
    }, [timer]);

    // --- Actions ---

    const handleSocialLogin = async (provider: "github" | "google") => {
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

        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: { shouldCreateUser: true },
        });

        if (error) {
            setMessage(error.message);
        } else {
            setDirection(1); // Moving forward
            setStep("otp");
            setTimer(60);
        }
        setLoading(false);
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

    const verifyOtp = async (tokenOverride?: string) => {
        const token = tokenOverride || otp.join("");
        setLoading(true);
        const { error } = await supabase.auth.verifyOtp({
            email,
            token,
            type: "email",
        });

        if (error) {
            setMessage(error.message);
            setLoading(false);
        } else {
            setStep("success");
            setLoading(false);
            setTimeout(() => {
                window.location.href = "/dashboard";
            }, 2000);
        }
    };

    const goBack = () => {
        setDirection(-1);
        setStep("email");
        setMessage("");
    };

    const isEmailValid = email.includes('@') && email.includes('.');

    return (
        <div className="min-h-screen bg-black text-white font-sans selection:bg-glaze-500/30 flex items-center justify-center p-4 relative overflow-hidden">

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
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-glaze-500/10 rounded-full blur-[120px] pointer-events-none z-0" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none z-0" />

            {/* Close Button */}
            <Link
                href="/"
                className="absolute top-8 right-8 z-50 text-zinc-500 hover:text-white transition-colors p-2 bg-black/50 backdrop-blur-md rounded-full border border-zinc-800"
            >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </Link>


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
                                    initial={{ x: -50, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    exit={{ x: -100, opacity: 0 }}
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    className="absolute right-0 group"
                                >
                                    {/* Connector */}
                                    <div className="absolute -right-16 top-1/2 -translate-y-1/2 w-16 h-[1px] bg-gradient-to-l from-zinc-600 to-transparent" />
                                    <div className="absolute -right-16 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-zinc-400 rounded-full" />

                                    {/* Smart Auth Badge */}
                                    <div className="bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-full px-5 py-3 flex items-center gap-3 shadow-xl">
                                        <div className="w-8 h-8 rounded-full bg-glaze-500/20 flex items-center justify-center text-glaze-400">
                                            <ShieldCheck className="w-4 h-4" />
                                        </div>
                                        <div className="text-left">
                                            <div className="text-xs font-bold text-white tracking-wide uppercase">Smart Auth</div>
                                            <div className="text-[10px] text-zinc-400">Secure & Seamless</div>
                                        </div>
                                    </div>
                                </motion.div>
                            ) : step === 'otp' ? (
                                <motion.div
                                    key="badge-method"
                                    initial={{ x: 100, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    exit={{ x: 100, opacity: 0 }}
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    className="absolute right-0 group"
                                >
                                    {/* Connector */}
                                    <div className="absolute -right-16 top-1/2 -translate-y-1/2 w-16 h-[1px] bg-gradient-to-l from-zinc-600 to-transparent" />
                                    <div className="absolute -right-16 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-zinc-400 rounded-full" />

                                    {/* Method Badge (Moved from Right) */}
                                    <div className="bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-full px-5 py-3 flex items-center gap-3 shadow-xl">
                                        <div className="text-right">
                                            <div className="text-xs font-bold text-white tracking-wide uppercase">Verification</div>
                                            <div className="text-[10px] text-zinc-400">Enter Code</div>
                                        </div>
                                        <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400">
                                            <MousePointerClick className="w-4 h-4" />
                                        </div>
                                    </div>
                                </motion.div>
                            ) : null}
                        </AnimatePresence>
                    </div>
                </div>

                {/* CENTER: Main Card (Horizontal Slider) */}
                <div className="col-span-1 md:col-start-4 md:col-span-6 relative h-[500px] flex items-center">
                    <AnimatePresence mode="wait" custom={direction}>

                        {/* CARD A: Email Input */}
                        {step === 'email' && (
                            <motion.div
                                key="step-email"
                                custom={direction}
                                variants={slideVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                className="absolute w-full bg-[#09090b] border border-zinc-800 rounded-3xl p-8 shadow-2xl overflow-hidden z-10"
                            >
                                <div className="mb-8">
                                    <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-b from-zinc-700 to-zinc-500 dark:from-white dark:to-zinc-400 bg-clip-text text-transparent">
                                        Statuscode
                                    </h1>
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
                                            className={`w-full h-12 rounded-xl font-medium text-sm transition-all duration-300 ${isEmailValid ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.3)]' : 'bg-zinc-800 text-zinc-400'}`}
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
                                variants={slideVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                className="absolute w-full bg-[#09090b] border border-zinc-800 rounded-3xl p-8 shadow-2xl overflow-hidden z-20"
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
                                    <div className="flex justify-between gap-2">
                                        {otp.map((digit, idx) => (
                                            <input
                                                key={idx}
                                                ref={(el) => { otpInputRefs.current[idx] = el; }} // No return value needed
                                                type="text"
                                                maxLength={1}
                                                value={digit}
                                                onChange={(e) => handleOtpChange(idx, e.target.value)}
                                                onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                                                onPaste={idx === 0 ? handlePaste : undefined}
                                                className="w-12 h-14 rounded-xl bg-black/40 border border-zinc-800 text-white text-center text-2xl font-mono focus:outline-none focus:border-glaze-500/50 focus:ring-4 focus:ring-glaze-500/10 transition-all"
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
                    <AnimatePresence>
                        {step === 'email' && (
                            <motion.div
                                key="badge-select-method"
                                initial={{ x: 50, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                exit={{ x: -100, opacity: 0 }}
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                className="absolute left-0 group"
                            >
                                {/* Connector */}
                                <div className="absolute -left-16 top-1/2 -translate-y-1/2 w-16 h-[1px] bg-gradient-to-r from-zinc-600 to-transparent" />
                                <div className="absolute -left-16 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-zinc-400 rounded-full" />

                                {/* Verification Badge (Next Step) */}
                                <div className="bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-full px-5 py-3 flex items-center gap-3 shadow-xl">
                                    <div className="text-right">
                                        <div className="text-xs font-bold text-white tracking-wide uppercase">Verification</div>
                                        <div className="text-[10px] text-zinc-400">Next Step</div>
                                    </div>
                                    <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400">
                                        <Key className="w-4 h-4" />
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

            </div>
        </div>
    );
}
