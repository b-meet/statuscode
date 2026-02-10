"use client";

import React, { memo } from 'react';
import { ThemeConfig } from '@/lib/themes';

interface FooterProps {
    theme: ThemeConfig;
}

export const Footer = memo(({ theme: t }: FooterProps) => {
    return (
        <footer className="mt-auto pt-24 pb-8 flex items-center justify-center">
            <a href="https://statuscode.in" className={`text-xs ${t.mutedText} hover:text-white transition-colors flex items-center gap-2 group`}>
                <div className="w-2 h-2 rounded-full bg-indigo-500 group-hover:scale-125 transition-transform" />
                Powered by <span className="font-bold text-white tracking-wide">Statuscode</span>
            </a>
        </footer>
    );
});

Footer.displayName = 'Footer';
