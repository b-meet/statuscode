"use client";

import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Bell, X, Activity, AlertCircle, Clock, CheckCircle2,
    Zap, Layout, Globe, Trash2, Calendar, Check, Circle,
    ChevronRight, Sparkles, AlertTriangle
} from 'lucide-react';
import { Site, MaintenanceWindow } from '@/lib/types';

interface NotificationSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    sites: Site[];
}

type NotificationType =
    | 'maintenance'
    | 'maintenance-update'
    | 'publish'
    | 'draft'
    | 'premium'
    | 'tips'
    | 'deletion';

interface NotificationItem {
    id: string;
    type: NotificationType;
    title: string;
    description: string;
    time: string;
    isRead: boolean;
    icon: React.ReactNode;
    color: string;
    bgColor: string;
}

export default function NotificationSidebar({ isOpen, onClose, sites }: NotificationSidebarProps) {
    const [activeTab, setActiveTab] = useState<'unread' | 'read'>('unread');

    // Generate high-fidelity static notifications
    const notifications = useMemo(() => {
        const items: NotificationItem[] = [
            // 1. Maintenance Examples (High Priority)
            {
                id: 'm-1',
                type: 'maintenance',
                title: 'Maintenance: 1 hour to go',
                description: 'Scheduled maintenance for "API Gateway" starts in 60 minutes.',
                time: '1h ago',
                isRead: false,
                icon: <Clock className="w-4 h-4" />,
                color: 'text-amber-400',
                bgColor: 'bg-amber-500/10'
            },
            {
                id: 'm-2',
                type: 'maintenance',
                title: 'Maintenance Started',
                description: 'The maintenance window for "Main Database" has begun.',
                time: '12m ago',
                isRead: false,
                icon: <Zap className="w-4 h-4" />,
                color: 'text-indigo-400',
                bgColor: 'bg-indigo-500/10'
            },
            {
                id: 'm-3',
                type: 'maintenance',
                title: 'Maintenance Completed',
                description: 'System upgrade for "Europe West" server finished successfully.',
                time: '2h ago',
                isRead: true,
                icon: <CheckCircle2 className="w-4 h-4" />,
                color: 'text-emerald-400',
                bgColor: 'bg-emerald-500/10'
            },
            // 2. Published Example
            {
                id: 'p-1',
                type: 'publish',
                title: 'New Stuff Published',
                description: 'You successfully published updates to "Acme Dashboard".',
                time: '5m ago',
                isRead: false,
                icon: <Globe className="w-4 h-4" />,
                color: 'text-blue-400',
                bgColor: 'bg-blue-500/10'
            },
            // 3. Draft Reminder
            {
                id: 'd-1',
                type: 'draft',
                title: 'Unpublished Drafts',
                description: 'You have 4 unpublished changes in "Portfolio Site". Don\'t forget to deploy!',
                time: '4h ago',
                isRead: false,
                icon: <Layout className="w-4 h-4" />,
                color: 'text-zinc-400',
                bgColor: 'bg-zinc-500/10'
            },
            // 4. Premium Reminder
            {
                id: 'pr-1',
                type: 'premium',
                title: 'Upgrade for Custom Domains',
                description: 'Unlock custom domain support and 1-minute monitoring frequency.',
                time: '1d ago',
                isRead: true,
                icon: <Sparkles className="w-4 h-4" />,
                color: 'text-purple-400',
                bgColor: 'bg-purple-500/10'
            },
            // 5. Tips & Updates
            {
                id: 't-1',
                type: 'tips',
                title: 'New Feature: Discord Hooks',
                description: 'You can now route server alerts directly to your Discord channels.',
                time: 'Ready now',
                isRead: false,
                icon: <AlertCircle className="w-4 h-4" />,
                color: 'text-indigo-400',
                bgColor: 'bg-indigo-500/10'
            },
            // 6. Deletion
            {
                id: 'del-1',
                type: 'deletion',
                title: 'Project Deleted',
                description: '"Legacy API" and all its monitor history have been removed.',
                time: '3h ago',
                isRead: true,
                icon: <Trash2 className="w-4 h-4" />,
                color: 'text-red-400',
                bgColor: 'bg-red-500/10'
            }
        ];

        return items;
    }, []);

    const filteredNotifications = notifications.filter(n =>
        activeTab === 'unread' ? !n.isRead : n.isRead
    );

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed right-0 top-0 bottom-0 z-[130] w-full max-w-sm bg-[#09090b] border-l border-zinc-800 shadow-2xl flex flex-col"
                    >
                        {/* Header */}
                        <div className="p-6 pb-4 flex flex-col gap-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                                        <Bell className="w-5 h-5" />
                                    </div>
                                    <h2 className="text-xl font-bold text-white tracking-tight">Notifications</h2>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-500 hover:text-white hover:bg-zinc-800 transition-all"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Tabs */}
                            <div className="flex bg-zinc-900/50 p-1 rounded-xl border border-zinc-800/50">
                                <button
                                    onClick={() => setActiveTab('unread')}
                                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'unread'
                                            ? 'bg-zinc-800 text-white shadow-lg'
                                            : 'text-zinc-500 hover:text-zinc-300'
                                        }`}
                                >
                                    Unread
                                    {notifications.filter(n => !n.isRead).length > 0 && (
                                        <span className="ml-2 px-1.5 py-0.5 rounded-full bg-indigo-500 text-[10px] text-white">
                                            {notifications.filter(n => !n.isRead).length}
                                        </span>
                                    )}
                                </button>
                                <button
                                    onClick={() => setActiveTab('read')}
                                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'read'
                                            ? 'bg-zinc-800 text-white shadow-lg'
                                            : 'text-zinc-500 hover:text-zinc-300'
                                        }`}
                                >
                                    Archive
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto px-6 py-2 scrollbar-none space-y-4">
                            <div className="flex items-center justify-between px-1">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
                                    {activeTab === 'unread' ? 'New for you' : 'Recently Archived'}
                                </h3>
                                {activeTab === 'unread' && filteredNotifications.length > 0 && (
                                    <button className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1">
                                        Mark all as read <Check className="w-3 h-3" />
                                    </button>
                                )}
                            </div>

                            {filteredNotifications.length === 0 ? (
                                <div className="py-20 flex flex-col items-center justify-center text-center gap-4">
                                    <div className="w-16 h-16 rounded-full bg-zinc-900/50 flex items-center justify-center border border-zinc-800/50">
                                        <Bell className="w-8 h-8 text-zinc-800" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-zinc-400 uppercase tracking-wider">All caught up!</p>
                                        <p className="text-xs text-zinc-600 mt-1">No {activeTab} notifications to show.</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {filteredNotifications.map((item) => (
                                        <div
                                            key={item.id}
                                            className={`group relative p-4 rounded-xl border transition-all ${item.isRead
                                                    ? 'bg-transparent border-zinc-800/30'
                                                    : item.type === 'tips'
                                                        ? 'bg-indigo-500/[0.03] border-indigo-500/20 hover:border-indigo-500/40'
                                                        : 'bg-zinc-900/20 border-zinc-800 hover:border-zinc-700'
                                                }`}
                                        >
                                            <div className="flex gap-4">
                                                <div className={`mt-0.5 w-10 h-10 shrink-0 rounded-xl flex items-center justify-center border border-white/5 ${item.bgColor} ${item.color}`}>
                                                    {item.icon}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <h4 className={`text-sm font-bold truncate transition-colors ${item.isRead ? 'text-zinc-500' : 'text-white group-hover:text-indigo-400'}`}>
                                                            {item.title}
                                                        </h4>
                                                        {!item.isRead && (
                                                            <button
                                                                className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-zinc-800 text-zinc-500 hover:text-emerald-400 transition-all"
                                                                title="Mark as read"
                                                            >
                                                                <Check className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                    </div>
                                                    <p className={`text-xs mt-1 leading-relaxed ${item.isRead ? 'text-zinc-600' : 'text-zinc-400'}`}>
                                                        {item.description}
                                                    </p>
                                                    <div className="mt-3 flex items-center gap-2">
                                                        <span className="text-[10px] font-medium text-zinc-600">{item.time}</span>
                                                        <div className="w-1 h-1 rounded-full bg-zinc-800" />
                                                        <span className="text-[10px] font-bold text-zinc-700 uppercase tracking-tighter">{item.type.split('-')[0]}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-zinc-800 bg-zinc-900/30">
                            <button
                                onClick={onClose}
                                className="w-full h-12 rounded-xl border border-zinc-800 text-zinc-400 text-sm font-bold hover:text-white hover:bg-zinc-800 transition-all flex items-center justify-center gap-2"
                            >
                                Close Activity Feed
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
