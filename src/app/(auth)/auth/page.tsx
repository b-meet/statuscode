"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, ArrowRight, Github, Mail, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function AuthPage() {
    const supabase = createClient();
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [step, setStep] = useState<"email" | "otp" | "success">("email");
    const [loading, setLoading] = useState(false);
    const [timer, setTimer] = useState(0);
    const [isSignUp, setIsSignUp] = useState(false);
    const [message, setMessage] = useState("");

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (timer > 0) {
            interval = setInterval(() => setTimer((t) => t - 1), 1000);
        }
        return () => clearInterval(interval);
    }, [timer]);

    const handleSocialLogin = async (provider: "github" | "google") => {
        await supabase.auth.signInWithOAuth({
            provider,
            options: {
                redirectTo: `${location.origin}/auth/callback`,
            },
        });
    };

    const checkEmailAndSendOtp = async () => {
        if (!email) return;
        setLoading(true);
        setMessage("");

        // 1. Try to initiate sign in (OTP)
        // If user doesn't exist and we wanted to separate flows, we'd check existence first.
        // However, Supabase doesn't reveal user existence easily for security.
        // Strategy: We will just attempt to sign in. 
        // If the user entered this flow, they want to log in or sign up.
        // Custom flow request: "check if user exists... if not redirect to sign up"
        // We can simulate this by trying to generic sign in. 
        // Actually, simplifying: Use signInWithOtp. It handles both. 
        // But to match the UI "Login" vs "Sign Up" text, we can infer.

        // For this specific request "we check if user exists", we can't reliably do it client-side without edge functions/admin.
        // So we will assume standard flow: Send OTP.

        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                shouldCreateUser: true, // Allow both login and signup flow seamlessly
            },
        });

        if (error) {
            setMessage(error.message);
        } else {
            setStep("otp");
            setTimer(60);
        }
        setLoading(false);
    };

    const verifyOtp = async () => {
        setLoading(true);
        const { error } = await supabase.auth.verifyOtp({
            email,
            token: otp,
            type: "email",
        });

        if (error) {
            setMessage(error.message);
            setLoading(false);
        } else {
            setStep("success");
            setLoading(false);
            // Success triggers 'success' step which shows the screen.
            // After a delay, we could redirect.
            setTimeout(() => {
                window.location.href = "/dashboard";
            }, 2000);
        }
    };

    return (
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Gradients */}
            <div className="absolute top-0 right-0 -z-10 opacity-20 translate-x-1/3 -translate-y-1/4">
                <div className="w-[800px] h-[800px] bg-glaze-500/30 rounded-full blur-[120px]" />
            </div>
            <div className="absolute bottom-0 left-0 -z-10 opacity-20 -translate-x-1/3 translate-y-1/4">
                <div className="w-[600px] h-[600px] bg-accent-500/30 rounded-full blur-[100px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md bg-zinc-900/50 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-2xl relative overflow-hidden"
            >
                {/* Success Overlay */}
                <AnimatePresence>
                    {step === "success" && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="absolute inset-0 z-50 bg-zinc-900 flex flex-col items-center justify-center text-center p-8"
                        >
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 200, damping: 10 }}
                                className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mb-6 shadow-[0_0_50px_rgba(34,197,94,0.5)]"
                            >
                                <CheckCircle2 className="w-10 h-10 text-white" />
                            </motion.div>
                            <h2 className="text-3xl font-bold text-white mb-2">Huge Success!</h2>
                            <p className="text-zinc-400">Taking you to your dashboard...</p>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="mb-8 text-center">
                    <Link href="/" className="text-2xl font-bold tracking-tight bg-gradient-to-r from-glaze-400 to-accent-400 bg-clip-text text-transparent">
                        Statuscode
                    </Link>
                    <h1 className="text-xl font-semibold text-white mt-4">
                        {step === 'otp' ? 'Check your inbox' : 'Ship something new'}
                    </h1>
                    <p className="text-sm text-zinc-400 mt-2">
                        {step === 'otp' ? `We sent a code to ${email}` : 'Manage your status pages with style.'}
                    </p>
                </div>

                {step === "email" ? (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <Button variant="outline" onClick={() => handleSocialLogin('github')} className="w-full">
                                <Github className="w-4 h-4 mr-2" />
                                GitHub
                            </Button>
                            <Button variant="outline" onClick={() => handleSocialLogin('google')} className="w-full">
                                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                                    <path
                                        fill="currentColor"
                                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    />
                                    <path
                                        fill="currentColor"
                                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    />
                                    <path
                                        fill="currentColor"
                                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                    />
                                    <path
                                        fill="currentColor"
                                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    />
                                </svg>
                                Google
                            </Button>
                        </div>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-zinc-800" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-zinc-900/50 px-2 text-zinc-500">Or continue with</span>
                            </div>
                        </div>

                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                checkEmailAndSendOtp();
                            }}
                            className="space-y-4"
                        >
                            <input
                                type="email"
                                placeholder="name@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full h-11 px-4 rounded-lg bg-zinc-800/50 border border-zinc-700 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-glaze-500/50 transition-all"
                                required
                            />
                            <Button type="submit" className="w-full h-11" disabled={loading}>
                                {loading ? <Loader2 className="animate-spin w-4 h-4" /> : "Continue with Email"}
                            </Button>
                        </form>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                verifyOtp();
                            }}
                            className="space-y-4"
                        >
                            <input
                                type="text"
                                placeholder="Enter 6-digit code"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                className="w-full h-11 px-4 rounded-lg bg-zinc-800/50 border border-zinc-700 text-white placeholder:text-zinc-500 text-center text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-glaze-500/50 transition-all"
                                required
                            />
                            <Button type="submit" className="w-full h-11" disabled={loading}>
                                {loading ? <Loader2 className="animate-spin w-4 h-4" /> : "Verify Code"}
                            </Button>
                        </form>

                        <div className="flex justify-between items-center text-sm">
                            <button
                                onClick={() => setStep("email")}
                                className="text-zinc-400 hover:text-white transition-colors"
                            >
                                Edit Email
                            </button>
                            <button
                                onClick={timer === 0 ? checkEmailAndSendOtp : undefined}
                                disabled={timer > 0}
                                className={`${timer > 0 ? 'text-zinc-600 cursor-not-allowed' : 'text-glaze-400 hover:text-glaze-300'} transition-colors`}
                            >
                                {timer > 0 ? `Resend in ${timer}s` : "Resend Code"}
                            </button>
                        </div>
                    </div>
                )}

                {message && (
                    <p className="mt-4 text-center text-sm text-red-400 bg-red-400/10 p-2 rounded-lg">
                        {message}
                    </p>
                )}
            </motion.div>
        </div>
    );
}
