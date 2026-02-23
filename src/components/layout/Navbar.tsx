"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export function Navbar() {
    return (
        <motion.header
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 backdrop-blur-md bg-white/5 dark:bg-zinc-950/50 border-b border-white/10 dark:border-white/5 supports-[backdrop-filter]:bg-white/5"
        >
            <Link href="/" className="flex items-center gap-2">
                <div className="relative w-8 h-8">
                    <Image
                        src="/logo.svg"
                        alt="Statuscode Logo"
                        fill
                        className="object-contain"
                        priority
                    />
                </div>
                <span className="text-2xl font-bold tracking-tight bg-gradient-to-b from-zinc-700 to-zinc-500 dark:from-white dark:to-zinc-400 bg-clip-text text-transparent">
                    Statuscode
                </span>
            </Link>

            <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-600 dark:text-zinc-400">
                <Link href="#how-it-works" className="hover:text-statuscode-500 transition-colors">
                    How it Works
                </Link>
                <Link href="#features" className="hover:text-statuscode-500 transition-colors">
                    Features
                </Link>
                <Link href="#faq" className="hover:text-statuscode-500 transition-colors">
                    FAQ
                </Link>
            </nav>

            <div className="flex items-center gap-4">
                <Link
                    href="/auth"
                    className="hidden md:block text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
                >
                    Login
                </Link>
                <Link href="/auth">
                    <Button size="sm">
                        Get Started
                    </Button>
                </Link>
            </div>
        </motion.header>
    );
}
