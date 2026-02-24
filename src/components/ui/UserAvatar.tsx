"use client";

import React from 'react';
import { User } from 'lucide-react';
import { getContrastColor } from '@/utils/colors';

interface UserAvatarProps {
    user: any;
    className?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
}

export default function UserAvatar({ user, className = "", size = 'md' }: UserAvatarProps) {
    if (!user) {
        const skeletonSizes = {
            sm: 'w-6 h-6',
            md: 'w-8 h-8',
            lg: 'w-10 h-10',
            xl: 'w-24 h-24'
        };
        return (
            <div className={`${skeletonSizes[size]} rounded-full bg-zinc-800 animate-pulse ${className}`} />
        );
    }

    const { user_metadata } = user;
    const avatarUrl = user_metadata?.avatar_url;
    const avatarSelection = user_metadata?.avatar_selection || (avatarUrl ? 'photo' : 'initials');
    const avatarColor = user_metadata?.avatar_color; // Custom hex color

    const initials = (user_metadata?.full_name || user.email || '?')
        .split(' ')
        .map((n: string) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();

    // Generate a consistent deep color based on user ID
    const getDeepColor = (id: string) => {
        if (avatarColor) return null;

        const colors = [
            'bg-indigo-900', 'bg-blue-900', 'bg-emerald-900',
            'bg-rose-900', 'bg-purple-900', 'bg-amber-900',
            'bg-cyan-900', 'bg-fuchsia-900', 'bg-lime-950'
        ];
        let hash = 0;
        if (id) {
            for (let i = 0; i < id.length; i++) {
                hash = id.charCodeAt(i) + ((hash << 5) - hash);
            }
        }
        return colors[Math.abs(hash) % colors.length];
    };

    const sizeClasses = {
        sm: 'w-6 h-6 text-[10px]',
        md: 'w-8 h-8 text-xs',
        lg: 'w-10 h-10 text-sm',
        xl: 'w-24 h-24 text-4xl'
    };

    const bgClass = getDeepColor(user.id);

    return (
        <div
            className={`rounded-full overflow-hidden flex items-center justify-center border border-white/10 shrink-0 ${sizeClasses[size]} ${avatarSelection === 'photo' && avatarUrl ? 'bg-zinc-900' : (bgClass || '')} ${className} transition-all`}
            style={avatarSelection === 'initials' && avatarColor ? { backgroundColor: avatarColor } : {}}
        >
            {avatarSelection === 'photo' && avatarUrl ? (
                <img
                    src={avatarUrl}
                    alt={user_metadata?.full_name || "User"}
                    className="w-full h-full object-cover"
                />
            ) : (
                <span className={`font-bold tracking-tight ${getContrastColor(avatarColor)} ${size === 'xl' ? 'tracking-tighter' : ''}`}>
                    {initials || <User className="w-1/2 h-1/2" />}
                </span>
            )}
        </div>
    );
}
