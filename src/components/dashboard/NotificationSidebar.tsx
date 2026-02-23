"use client";

import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Bell, X, Activity, AlertCircle, Clock, CheckCircle2,
    Zap, Layout, Globe, Trash2, Calendar, Check, Circle,
    ChevronRight, Sparkles, AlertTriangle,
    RefreshCw
} from 'lucide-react';
import { Site, AppNotification, NotificationCategory } from '@/lib/types';
import { useNotifications } from '@/context/NotificationContext';

interface NotificationSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    sites: Site[];
    notifications: AppNotification[];
    isLoading?: boolean;
    onRefresh: () => void;
}

interface NotificationItemProps {
    item: AppNotification;
    onMarkRead: (id: string) => void;
}

export default function NotificationSidebar({ isOpen, onClose, sites, notifications, isLoading, onRefresh }: NotificationSidebarProps) {
    const { markRead, markAllRead } = useNotifications();
    const [activeTab, setActiveTab] = useState<'unread' | 'read'>('unread');

    const handleMarkRead = async (id: string) => {
        await markRead(id);
    };

    const handleMarkAllRead = async () => {
        await markAllRead();
    };

    const getIcon = (category: NotificationCategory, type: string) => {
        switch (category) {
            case 'maintenance':
                if (type === 'maint_started') return <Zap className="w-4 h-4" />;
                if (type === 'maint_completed') return <CheckCircle2 className="w-4 h-4" />;
                return <Clock className="w-4 h-4" />;
            case 'project':
                if (type === 'published') return <Globe className="w-4 h-4" />;
                if (type === 'deleted') return <Trash2 className="w-4 h-4" />;
                if (type === 'draft_reminder') return <Layout className="w-4 h-4" />;
                return <Activity className="w-4 h-4" />;
            case 'billing':
                return <Sparkles className="w-4 h-4" />;
            case 'platform':
                return <AlertCircle className="w-4 h-4" />;
            default:
                return <Bell className="w-4 h-4" />;
        }
    };

    const getColorClass = (category: NotificationCategory) => {
        switch (category) {
            case 'maintenance': return { color: 'text-amber-400', bg: 'bg-amber-500/10' };
            case 'project': return { color: 'text-blue-400', bg: 'bg-blue-500/10' };
            case 'billing': return { color: 'text-purple-400', bg: 'bg-purple-500/10' };
            case 'platform': return { color: 'text-indigo-400', bg: 'bg-indigo-500/10' };
            default: return { color: 'text-zinc-400', bg: 'bg-zinc-500/10' };
        }
    };

    const filteredNotifications = notifications.filter((n: AppNotification) =>
        activeTab === 'unread' ? !n.is_read : n.is_read
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
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={onRefresh}
                                        disabled={isLoading}
                                        className={`p-2 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 transition-all ${isLoading ? 'animate-spin opacity-50' : ''}`}
                                        title="Refresh notifications"
                                    >
                                        <RefreshCw className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={onClose}
                                        className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-500 hover:text-white hover:bg-zinc-800 transition-all"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
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
                                    {notifications.filter(n => !n.is_read).length > 0 && (
                                        <span className={`ml-2 px-1.5 py-0.5 rounded-full text-[10px] text-white transition-colors ${activeTab === 'unread' ? 'bg-indigo-500' : 'bg-zinc-800'}`}>
                                            {notifications.filter(n => !n.is_read).length}
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
                                {activeTab === 'unread' && filteredNotifications.length > 0 && !isLoading && (
                                    <button
                                        onClick={handleMarkAllRead}
                                        className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1"
                                    >
                                        Mark all as read <Check className="w-3 h-3" />
                                    </button>
                                )}
                            </div>

                            {isLoading ? (
                                <div className="space-y-3">
                                    {[1, 2, 3, 4].map((i) => (
                                        <div key={i} className="p-4 rounded-xl border border-zinc-800/50 bg-zinc-900/10 animate-pulse">
                                            <div className="flex gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-zinc-800/50" />
                                                <div className="flex-1 space-y-2">
                                                    <div className="h-4 bg-zinc-800/50 rounded w-1/3" />
                                                    <div className="h-3 bg-zinc-800/30 rounded w-3/4" />
                                                    <div className="h-2 bg-zinc-800/20 rounded w-1/4 mt-2" />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : filteredNotifications.length === 0 ? (
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
                                    {filteredNotifications.map((item: AppNotification) => (
                                        <div
                                            key={item.id}
                                            className={`group relative p-4 rounded-xl border transition-all ${item.is_read
                                                ? 'bg-transparent border-zinc-800/30'
                                                : item.category === 'platform'
                                                    ? 'bg-indigo-500/[0.03] border-indigo-500/20 hover:border-indigo-500/40'
                                                    : 'bg-zinc-900/20 border-zinc-800 hover:border-zinc-700'
                                                }`}
                                        >
                                            <div className="flex gap-4">
                                                <div className={`mt-0.5 w-10 h-10 shrink-0 rounded-xl flex items-center justify-center border border-white/5 ${getColorClass(item.category).bg} ${getColorClass(item.category).color}`}>
                                                    {getIcon(item.category, item.type)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <h4 className={`text-sm font-bold truncate transition-colors ${item.is_read ? 'text-zinc-500' : 'text-white group-hover:text-indigo-400'}`}>
                                                            {item.title}
                                                        </h4>
                                                        {!item.is_read && (
                                                            <button
                                                                onClick={() => handleMarkRead(item.id)}
                                                                className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-zinc-800 text-zinc-500 hover:text-emerald-400 transition-all"
                                                                title="Mark as read"
                                                            >
                                                                <Check className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                    </div>
                                                    <p className={`text-xs mt-1 leading-relaxed ${item.is_read ? 'text-zinc-500' : 'text-zinc-300'}`}>
                                                        {item.message}
                                                    </p>
                                                    <div className="mt-3 flex items-center gap-2">
                                                        <span className="text-[10px] font-medium text-zinc-500">
                                                            {new Date(item.created_at).toLocaleDateString()} • {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                        <div className="w-1 h-1 rounded-full bg-zinc-800" />
                                                        <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-tighter">{item.category}</span>
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
