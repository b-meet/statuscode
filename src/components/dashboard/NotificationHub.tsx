"use client";

import React, { useState, useEffect } from 'react';
import { Mail, MessageSquare, Bell, Plus, Trash2, CheckCircle2, AlertCircle, Loader2, X, Hash } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';
import { NotificationChannel, ChannelType } from '@/lib/types';

interface NotificationHubProps {
    userId: string;
}

export default function NotificationHub({ userId }: NotificationHubProps) {
    const supabase = createClient();
    const [channels, setChannels] = useState<NotificationChannel[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddingType, setIsAddingType] = useState<ChannelType | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Form states
    const [formData, setFormData] = useState({
        email: '',
        webhook_url: '',
        channel_name: ''
    });

    useEffect(() => {
        fetchChannels();
    }, [userId]);

    async function fetchChannels() {
        try {
            const { data, error } = await supabase
                .from('notification_channels')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setChannels(data || []);
        } catch (error) {
            console.error('Error fetching channels:', error);
            // Don't toast on first load if table doesn't exist yet, 
            // but in production it should.
        } finally {
            setLoading(false);
        }
    }

    const handleAddChannel = async () => {
        if (!isAddingType) return;
        setIsSaving(true);

        const newChannel = {
            user_id: userId,
            type: isAddingType,
            config: {
                email: isAddingType === 'email' ? formData.email : undefined,
                webhook_url: (isAddingType === 'discord' || isAddingType === 'slack') ? formData.webhook_url : undefined,
                channel_name: formData.channel_name || undefined
            },
            is_enabled: true
        };

        try {
            const { data, error } = await supabase
                .from('notification_channels')
                .insert([newChannel])
                .select();

            if (error) throw error;

            setChannels(prev => [data[0], ...prev]);
            toast.success(`${isAddingType.charAt(0).toUpperCase() + isAddingType.slice(1)} channel added`);
            setIsAddingType(null);
            setFormData({ email: '', webhook_url: '', channel_name: '' });
        } catch (error) {
            console.error('Error adding channel:', error);
            toast.error('Failed to add channel. Ensure the database table exists.');
        } finally {
            setIsSaving(false);
        }
    };

    const toggleChannel = async (id: string, currentState: boolean) => {
        try {
            const { error } = await supabase
                .from('notification_channels')
                .update({ is_enabled: !currentState })
                .eq('id', id);

            if (error) throw error;

            setChannels(prev => prev.map(c => c.id === id ? { ...c, is_enabled: !currentState } : c));
            toast.success(`Channel ${!currentState ? 'enabled' : 'disabled'}`);
        } catch (error) {
            console.error('Error toggling channel:', error);
            toast.error('Failed to update channel');
        }
    };

    const deleteChannel = async (id: string) => {
        try {
            const { error } = await supabase
                .from('notification_channels')
                .delete()
                .eq('id', id);

            if (error) throw error;

            setChannels(prev => prev.filter(c => c.id !== id));
            toast.success('Channel removed');
        } catch (error) {
            console.error('Error deleting channel:', error);
            toast.error('Failed to remove channel');
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-zinc-500 gap-3">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                <p className="text-sm tracking-tight text-zinc-400">Loading notification hub...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white tracking-tight">Notification Channels</h2>
                    <p className="text-zinc-500 text-sm mt-1">Configure where you want to receive alerts when services go down.</p>
                </div>
            </div>

            {/* Channel Type Selection */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <ChannelTypeButton
                    type="email"
                    icon={<Mail className="w-5 h-5" />}
                    title="Email Alerts"
                    description="Receive detailed incident reports."
                    onClick={() => setIsAddingType('email')}
                />
                <ChannelTypeButton
                    type="discord"
                    icon={<MessageSquare className="w-5 h-5 text-[#5865F2]" />}
                    title="Discord Webhook"
                    description="Get instant pings in your server."
                    onClick={() => setIsAddingType('discord')}
                />
                <ChannelTypeButton
                    type="slack"
                    icon={<Hash className="w-5 h-5 text-[#E01E5A]" />}
                    title="Slack Webhook"
                    description="Keep your team in the loop."
                    onClick={() => setIsAddingType('slack')}
                />
            </div>

            {/* Active Channels List */}
            <div className="space-y-4 pt-4">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-500 px-1">Active Channels</h3>
                {channels.length === 0 ? (
                    <div className="border border-dashed border-zinc-800 rounded-2xl p-12 flex flex-col items-center justify-center text-center bg-zinc-900/10">
                        <Bell className="w-8 h-8 text-zinc-700 mb-4" />
                        <p className="text-zinc-500 text-sm">No notification channels configured yet.</p>
                        <p className="text-zinc-600 text-xs mt-1">Add your first channel to stay informed during outages.</p>
                    </div>
                ) : (
                    <div className="grid gap-3">
                        <AnimatePresence mode="popLayout">
                            {channels.map((channel) => (
                                <motion.div
                                    key={channel.id}
                                    layout
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="group relative flex items-center justify-between p-4 rounded-2xl bg-[#09090b] border border-zinc-800 hover:border-zinc-700 transition-all"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${channel.type === 'email' ? 'bg-indigo-500/10 text-indigo-400' :
                                                channel.type === 'discord' ? 'bg-[#5865F2]/10 text-[#5865F2]' :
                                                    'bg-[#E01E5A]/10 text-[#E01E5A]'
                                            }`}>
                                            {channel.type === 'email' ? <Mail className="w-5 h-5" /> :
                                                channel.type === 'discord' ? <MessageSquare className="w-5 h-5" /> :
                                                    <Hash className="w-5 h-5" />}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h4 className="text-sm font-bold text-white uppercase tracking-tight">
                                                    {channel.config.channel_name || channel.type}
                                                </h4>
                                                {!channel.is_enabled && (
                                                    <span className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded font-bold uppercase">Disabled</span>
                                                )}
                                            </div>
                                            <p className="text-xs text-zinc-500 truncate max-w-[200px] sm:max-w-md">
                                                {channel.type === 'email' ? channel.config.email : channel.config.webhook_url}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => toggleChannel(channel.id, channel.is_enabled)}
                                            className={`w-12 h-6 rounded-full transition-all relative ${channel.is_enabled ? 'bg-indigo-600' : 'bg-zinc-800'
                                                }`}
                                        >
                                            <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${channel.is_enabled ? 'translate-x-6' : 'translate-x-0'
                                                }`} />
                                        </button>
                                        <button
                                            onClick={() => deleteChannel(channel.id)}
                                            className="w-9 h-9 rounded-xl flex items-center justify-center text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            {/* Add Channel Modal */}
            <AnimatePresence>
                {isAddingType && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-[#0c0c0e] border border-zinc-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
                        >
                            <div className="p-6 border-b border-zinc-800/50 bg-zinc-900/30 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                                        {isAddingType === 'email' ? <Mail className="w-4 h-4" /> :
                                            isAddingType === 'discord' ? <MessageSquare className="w-4 h-4" /> :
                                                <Hash className="w-4 h-4" />}
                                    </div>
                                    <h3 className="text-lg font-bold text-white capitalize tracking-tight">Add {isAddingType} Channel</h3>
                                </div>
                                <button onClick={() => setIsAddingType(null)} className="text-zinc-500 hover:text-white transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-6 space-y-5">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-1">Label / Name</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Engineering Alerts"
                                        className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                                        value={formData.channel_name}
                                        onChange={(e) => setFormData({ ...formData, channel_name: e.target.value })}
                                    />
                                </div>

                                {isAddingType === 'email' ? (
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-1">Email Address</label>
                                        <input
                                            type="email"
                                            placeholder="alerts@yourdomain.com"
                                            className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        />
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-1">Webhook URL</label>
                                        <input
                                            type="text"
                                            placeholder="https://..."
                                            className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                                            value={formData.webhook_url}
                                            onChange={(e) => setFormData({ ...formData, webhook_url: e.target.value })}
                                        />
                                        <p className="text-[10px] text-zinc-500 px-1 mt-1">Make sure you have created a webhook in your {isAddingType} channel settings.</p>
                                    </div>
                                )}
                            </div>

                            <div className="p-6 bg-zinc-900/20 border-t border-zinc-800/50 flex gap-3">
                                <button
                                    onClick={() => setIsAddingType(null)}
                                    className="flex-1 px-4 py-3 rounded-xl border border-zinc-800 text-sm font-bold text-zinc-400 hover:text-white hover:bg-zinc-900 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAddChannel}
                                    disabled={isSaving || (isAddingType === 'email' ? !formData.email : !formData.webhook_url)}
                                    className="flex-1 px-4 py-3 rounded-xl bg-indigo-600 text-sm font-bold text-white hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_4px_20px_rgba(79,70,229,0.3)] flex items-center justify-center gap-2"
                                >
                                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                    Add Channel
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

function ChannelTypeButton({ type, icon, title, description, onClick }: { type: ChannelType, icon: React.ReactNode, title: string, description: string, onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className="group relative flex flex-col items-center text-center p-6 rounded-2xl bg-zinc-900/30 border border-zinc-800 hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all"
        >
            <div className="w-12 h-12 rounded-2xl bg-zinc-900 flex items-center justify-center mb-4 border border-zinc-800 group-hover:scale-110 group-hover:border-indigo-500/30 transition-all shadow-xl">
                {icon}
            </div>
            <h3 className="text-sm font-bold text-white mb-1 group-hover:text-indigo-400 transition-colors">{title}</h3>
            <p className="text-[11px] text-zinc-500 leading-relaxed">{description}</p>
        </button>
    );
}
