"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function WaitlistForm() {
    const [email, setEmail] = useState("");
    const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setStatus("loading");
        // Simulate API call
        setTimeout(() => {
            setStatus("success");
            setEmail("");
        }, 1500);
    };

    return (
        <form onSubmit={handleSubmit} className="relative w-full max-w-sm">
            <AnimatePresence mode="wait">
                {status === "success" ? (
                    <motion.div
                        key="success"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex items-center gap-2 text-glaze-500 font-medium p-2"
                    >
                        <Check className="size-5" />
                        <span>You're on the list! We'll be in touch.</span>
                    </motion.div>
                ) : (
                    <motion.div
                        key="form"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex gap-2"
                    >
                        <input
                            id="waitlist-email"
                            type="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={status === "loading"}
                            className="flex-1 h-10 px-4 rounded-full bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-glaze-500/50 transition-all text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500"
                            required
                        />
                        <Button
                            type="submit"
                            disabled={status === "loading"}
                            className="px-5 h-10"
                        >
                            {status === "loading" ? (
                                <span className="opacity-70">Joining...</span>
                            ) : (
                                <>
                                    Join
                                    <ArrowRight className="ml-2 size-4" />
                                </>
                            )}
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>
        </form>
    );
}
