"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import {
    Save,
    Check,
    Zap,
    LogOut,
    CreditCard,
    Mail,
    UserCircle,
    Camera,
    Image as ImageIcon,
    Link as LinkIcon,
    Github,
    Unplug
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { getContrastColor } from "@/utils/colors";

export default function AccountSettingsPage() {
    const supabase = createClient();
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [sitesCount, setSitesCount] = useState(0);

    // Form State
    const [fullName, setFullName] = useState("");
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [avatarSelection, setAvatarSelection] = useState<'photo' | 'initials'>('initials');
    const [avatarColor, setAvatarColor] = useState<string>("");
    const [isSaving, setIsSaving] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    // Connection State
    const [isLinking, setIsLinking] = useState<string | false>(false);
    const [isUnlinking, setIsUnlinking] = useState<string | false>(false);

    useEffect(() => {
        const loadUserData = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                setUser(user);

                if (user) {
                    setFullName(user.user_metadata?.full_name || "");
                    setAvatarUrl(user.user_metadata?.avatar_url || null);
                    setAvatarSelection(user.user_metadata?.avatar_selection || (user.user_metadata?.avatar_url ? 'photo' : 'initials'));
                    setAvatarColor(user.user_metadata?.avatar_color || "");

                    const { count } = await supabase
                        .from('sites')
                        .select('*', { count: 'exact', head: true });
                    setSitesCount(count || 0);
                }
            } catch (err) {
                console.error("Auth initialization failed:", err);
            } finally {
                setLoading(false);
            }
        };

        loadUserData();
    }, [supabase]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        if (!file.type.startsWith('image/')) {
            toast.error("Invalid file type", { description: "Please upload an image file." });
            return;
        }

        setIsUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}-${Date.now()}.${fileExt}`;
            const filePath = `avatars/${fileName}`;

            const formData = new FormData();
            formData.append("file", file);
            formData.append("bucket", "avatars");

            const res = await fetch("/api/upload", {
                method: "POST",
                body: formData
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to upload");

            setAvatarUrl(data.url);
            setAvatarSelection('photo');
            setIsDirty(true);

            toast.success("Photo uploaded", {
                description: "Save changes to update your profile picture.",
                icon: <ImageIcon className="w-4 h-4 text-white" />
            });
        } catch (err: any) {
            console.error("Upload failed:", err);
            toast.error("Upload failed", {
                description: "Please try again or check your connection."
            });
        } finally {
            setIsUploading(false);
        }
    };

    const handleSaveProfile = async () => {
        if (!isDirty || isSaving) return;

        setIsSaving(true);
        try {
            const res = await fetch("/api/user/me", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    full_name: fullName,
                    avatar_url: avatarUrl,
                    avatar_selection: avatarSelection,
                    avatar_color: avatarColor
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to update profile");

            setUser(data.user);
            setIsDirty(false);
            toast.success("Profile updated", {
                description: "Your changes have been saved successfully.",
                icon: <Check className="w-4 h-4 text-emerald-500" />
            });
        } catch (err: any) {
            console.error("Update failed:", err);
            toast.error("Update failed", {
                description: err.message || "Something went wrong."
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push("/");
    };

    const handleLink = async (provider: 'github' | 'google') => {
        setIsLinking(provider);
        try {
            const { error } = await supabase.auth.linkIdentity({
                provider: provider,
                options: {
                    redirectTo: `${window.location.origin}/auth/callback?next=/settings`
                }
            });
            if (error) throw error;
        } catch (err: any) {
            toast.error(`Failed to connect ${provider}`, { description: err.message });
            setIsLinking(false);
        }
    };

    const handleUnlink = async (provider: string) => {
        const identity = user?.identities?.find((id: any) => id.provider === provider);
        if (!identity) return;

        setIsUnlinking(provider);
        try {
            const { error } = await supabase.auth.unlinkIdentity(identity);
            if (error) throw error;

            // Refresh user data to update identities list
            const { data: { user: updatedUser } } = await supabase.auth.getUser();
            setUser(updatedUser);
            toast.success(`Disconnected from ${provider}`);
        } catch (err: any) {
            toast.error(`Failed to disconnect ${provider}`, { description: err.message });
        } finally {
            setIsUnlinking(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="w-6 h-6 border-2 border-zinc-800 border-t-zinc-400 rounded-full animate-spin" />
            </div>
        );
    }

    const userInitials = (fullName || user?.email || "?")
        .split(" ")
        .map((n: string) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();

    const avatarBgColors = [
        { label: 'Default', value: '' },
        { label: 'Indigo', value: '#4f46e5' },
        { label: 'Blue', value: '#2563eb' },
        { label: 'Emerald', value: '#059669' },
        { label: 'Rose', value: '#e11d48' },
        { label: 'Purple', value: '#9333ea' },
        { label: 'Amber', value: '#d97706' },
        { label: 'Slate', value: '#475569' },
        { label: 'Black', value: '#000000' },
    ];

    return (
        <div className="max-w-6xl mx-auto py-12 px-6 font-sans selection:bg-indigo-500/20">
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-12"
            >
                {/* Header */}
                <header className="flex flex-col sm:flex-row sm:items-start justify-between gap-8 pb-10 border-b border-zinc-900/50">
                    <div className="flex flex-col sm:flex-row items-center gap-6">
                        <div className="relative group shrink-0">
                            <div
                                className="w-24 h-24 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-4xl font-bold text-white uppercase overflow-hidden shadow-xl shadow-black/20 transition-all group-hover:border-zinc-700"
                                style={avatarSelection === 'initials' && avatarColor ? { backgroundColor: avatarColor } : {}}
                            >
                                {avatarSelection === 'photo' && avatarUrl ? (
                                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <span className={`tracking-tighter ${getContrastColor(avatarColor)}`}>{userInitials}</span>
                                )}

                                {avatarSelection === 'photo' && (
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]"
                                        title="Update Photo"
                                    >
                                        {isUploading ? (
                                            <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <div className="flex flex-col items-center gap-1.5">
                                                <Camera className="w-6 h-6 text-white" />
                                                <span className="text-[10px] font-black uppercase tracking-widest text-white/80">Update</span>
                                            </div>
                                        )}
                                    </button>
                                )}
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleFileUpload}
                                />
                            </div>

                            <div className="absolute -bottom-2 -right-2 flex bg-zinc-950 border border-zinc-800 rounded-full p-0.5 shadow-2xl z-10">
                                <button
                                    onClick={() => { setAvatarSelection('photo'); setIsDirty(true); }}
                                    className={`relative w-6 h-6 flex items-center justify-center rounded-full transition-colors duration-200 z-10 ${avatarSelection === 'photo' ? 'text-black' : 'text-zinc-500 hover:text-zinc-300'}`}
                                    title="Use Photo"
                                >
                                    {avatarSelection === 'photo' && (
                                        <motion.div
                                            layoutId="avatarModeToggle"
                                            className="absolute inset-0 bg-white rounded-full shadow-sm"
                                            transition={{ type: "spring", stiffness: 500, damping: 35 }}
                                        />
                                    )}
                                    <ImageIcon className="w-3.5 h-3.5 relative z-20" />
                                </button>
                                <button
                                    onClick={() => { setAvatarSelection('initials'); setIsDirty(true); }}
                                    className={`relative w-6 h-6 flex items-center justify-center rounded-full transition-colors duration-200 z-10 ${avatarSelection === 'initials' ? 'text-black' : 'text-zinc-500 hover:text-zinc-300'}`}
                                    title="Use Initials"
                                >
                                    {avatarSelection === 'initials' && (
                                        <motion.div
                                            layoutId="avatarModeToggle"
                                            className="absolute inset-0 bg-white rounded-full shadow-sm"
                                            transition={{ type: "spring", stiffness: 500, damping: 35 }}
                                        />
                                    )}
                                    <span className="text-[10px] font-black leading-none uppercase relative z-20">Az</span>
                                </button>
                            </div>
                        </div>

                        <div className="text-center sm:text-left">
                            <h1 className="text-2xl font-bold tracking-tight text-white mb-1">Account</h1>
                            <p className="text-zinc-500 text-sm font-medium">Manage your profile and appearance.</p>
                        </div>
                    </div>

                    <AnimatePresence>
                        {isDirty && (
                            <motion.button
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                onClick={handleSaveProfile}
                                disabled={isSaving}
                                className="h-10 px-6 bg-white text-black text-xs font-bold uppercase tracking-widest rounded-lg hover:bg-zinc-200 transition-all flex items-center gap-2 shadow-xl shadow-white/5 active:scale-95 disabled:opacity-50"
                            >
                                {isSaving ? <div className="w-3 h-3 border-2 border-black/20 border-t-black rounded-full animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                                Save Changes
                            </motion.button>
                        )}
                    </AnimatePresence>
                </header>

                {/* Avatar Color Picker - animated collapse/expand */}
                <div className={`grid transition-all duration-300 ease-in-out ${avatarSelection === 'initials' ? 'grid-rows-[1fr] opacity-100 -mt-4' : 'grid-rows-[0fr] opacity-0 -mt-12'}`}>
                    <div className="overflow-hidden">
                        <div className="space-y-2.5 pb-2">
                            <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest leading-none">Avatar Background</p>
                            <div className="flex flex-wrap gap-3">
                                {avatarBgColors.map((color) => (
                                    <button
                                        key={color.label}
                                        onClick={() => {
                                            setAvatarColor(color.value);
                                            setIsDirty(true);
                                        }}
                                        className={`w-7 h-7 rounded-full border-2 transition-all shadow-sm ${avatarColor === color.value ? 'border-white scale-110 shadow-lg shadow-white/20' : 'border-zinc-800 hover:border-zinc-600 hover:scale-105'}`}
                                        style={{ backgroundColor: color.value || '#18181b' }}
                                        title={color.label}
                                    />
                                ))}

                                <div className="relative group">
                                    <input
                                        type="color"
                                        value={avatarColor && !avatarBgColors.some(c => c.value === avatarColor) ? avatarColor : "#4f46e5"}
                                        onChange={(e) => {
                                            setAvatarColor(e.target.value);
                                            setIsDirty(true);
                                        }}
                                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                                        title="Custom Color"
                                    />
                                    <div className={`w-7 h-7 rounded-full border-2 border-dashed transition-all flex items-center justify-center ${avatarColor && !avatarBgColors.some(c => c.value === avatarColor) ? 'border-white scale-110' : 'border-zinc-800 hover:border-zinc-600 hover:scale-105'}`}
                                        style={{ backgroundColor: avatarColor && !avatarBgColors.some(c => c.value === avatarColor) ? avatarColor : 'transparent' }}
                                    >
                                        <Zap className={`w-3.5 h-3.5 ${avatarColor && !avatarBgColors.some(c => c.value === avatarColor) ? getContrastColor(avatarColor) : 'text-zinc-500'}`} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    {/* Form Area */}
                    <div className="lg:col-span-8 space-y-12">
                        <section className="space-y-6">
                            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 px-1">Personal Details</h2>
                            <div className="bg-zinc-950 border border-zinc-900 rounded-3xl p-10 space-y-10">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                    <div className="space-y-3">
                                        <label className="text-[10px] uppercase font-black text-zinc-500 tracking-widest ml-1">Full Name</label>
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-600 group-focus-within:text-white transition-colors">
                                                <UserCircle className="w-4 h-4" />
                                            </div>
                                            <input
                                                type="text"
                                                value={fullName}
                                                onChange={(e) => {
                                                    setFullName(e.target.value);
                                                    setIsDirty(true);
                                                }}
                                                placeholder="Your Name"
                                                className="w-full h-12 bg-zinc-900/40 border border-zinc-800 focus:border-white/20 rounded-2xl pl-12 pr-4 text-sm text-white font-medium transition-all outline-none placeholder:text-zinc-700 hover:border-zinc-700"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] uppercase font-black text-zinc-500 tracking-widest ml-1">Email Address</label>
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-700">
                                                <Mail className="w-4 h-4" />
                                            </div>
                                            <div className="w-full h-12 bg-black/40 border border-zinc-900 rounded-2xl pl-12 pr-4 flex items-center text-sm font-medium text-zinc-500">
                                                <span className="truncate lg:whitespace-nowrap">{user?.email}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className="pt-6 border-t border-zinc-900">
                            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 px-1 mb-6">Connected Accounts</h2>
                            <div className="bg-zinc-950 border border-zinc-900 rounded-3xl p-6 sm:p-10">
                                <p className="text-zinc-500 text-sm font-medium mb-8">Connect your accounts to instantly log in to your dashboard.</p>

                                <div className="space-y-4">
                                    {/* Google */}
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl border border-zinc-800/50 bg-black/20">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0">
                                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-white">Google</p>
                                                <p className="text-xs text-zinc-500 font-medium">Continue with Google</p>
                                            </div>
                                        </div>

                                        {user?.identities?.find((id: any) => id.provider === 'google') ? (
                                            <button
                                                onClick={() => handleUnlink('google')}
                                                disabled={isUnlinking === 'google' || user.identities.length <= 1}
                                                className="h-9 px-4 rounded-xl text-xs font-bold uppercase tracking-widest border border-zinc-800 text-zinc-400 hover:text-red-400 hover:border-red-400/30 hover:bg-red-400/10 transition-all flex items-center justify-center gap-2"
                                            >
                                                {isUnlinking === 'google' ? <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <Unplug className="w-3.5 h-3.5" />}
                                                Disconnect
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleLink('google')}
                                                disabled={isLinking === 'google'}
                                                className="h-9 px-4 rounded-xl text-xs font-bold uppercase tracking-widest bg-white text-black hover:bg-zinc-200 transition-all flex items-center justify-center gap-2"
                                            >
                                                {isLinking === 'google' ? <div className="w-3.5 h-3.5 border-2 border-black/20 border-t-black rounded-full animate-spin" /> : <LinkIcon className="w-3.5 h-3.5" />}
                                                Connect
                                            </button>
                                        )}
                                    </div>

                                    {/* GitHub */}
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl border border-zinc-800/50 bg-black/20">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-[#18181b] flex items-center justify-center shrink-0">
                                                <Github className="w-5 h-5 text-white" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-white">GitHub</p>
                                                <p className="text-xs text-zinc-500 font-medium">Continue with GitHub</p>
                                            </div>
                                        </div>

                                        {user?.identities?.find((id: any) => id.provider === 'github') ? (
                                            <button
                                                onClick={() => handleUnlink('github')}
                                                disabled={isUnlinking === 'github' || user.identities.length <= 1}
                                                className="h-9 px-4 rounded-xl text-xs font-bold uppercase tracking-widest border border-zinc-800 text-zinc-400 hover:text-red-400 hover:border-red-400/30 hover:bg-red-400/10 transition-all flex items-center justify-center gap-2"
                                            >
                                                {isUnlinking === 'github' ? <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <Unplug className="w-3.5 h-3.5" />}
                                                Disconnect
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleLink('github')}
                                                disabled={isLinking === 'github'}
                                                className="h-9 px-4 rounded-xl text-xs font-bold uppercase tracking-widest bg-white text-black hover:bg-zinc-200 transition-all flex items-center justify-center gap-2"
                                            >
                                                {isLinking === 'github' ? <div className="w-3.5 h-3.5 border-2 border-black/20 border-t-black rounded-full animate-spin" /> : <LinkIcon className="w-3.5 h-3.5" />}
                                                Connect
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className="pt-6 border-t border-zinc-900">
                            <button
                                onClick={handleSignOut}
                                className="flex items-center gap-2.5 text-[11px] font-bold uppercase tracking-widest text-zinc-500 hover:text-red-400 transition-all active:scale-95"
                            >
                                <LogOut className="w-4 h-4" />
                                Sign out of Account
                            </button>
                        </section>
                    </div>

                    {/* Subscription Sidebar */}
                    <div className="lg:col-span-4 self-start">
                        <section className="space-y-6">
                            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 px-1">Subscription</h2>
                            <div className="bg-[#050505] border border-zinc-800 rounded-2xl p-6 space-y-6 shadow-2xl transition-all hover:border-zinc-700">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none mb-1">Current Tier</p>
                                        <p className="text-xl font-bold text-white tracking-tight">Statuscode Pro</p>
                                    </div>
                                    <div className="w-10 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-white">
                                        <Zap className="w-5 h-5 fill-white/10" />
                                    </div>
                                </div>

                                <div className="space-y-3 pt-2">
                                    <div className="flex justify-between text-[10px] font-black text-zinc-600 uppercase tracking-widest">
                                        <span>Sites Created</span>
                                        <span className="text-white">{sitesCount} Sites</span>
                                    </div>
                                    <div className="h-1 bg-zinc-900 rounded-full overflow-hidden">
                                        <div className="h-full bg-white/80 w-1/4 rounded-full" />
                                    </div>
                                </div>

                                <button className="w-full h-10 bg-zinc-900/50 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-white transition-all">
                                    Manage Plan
                                </button>
                            </div>
                        </section>
                    </div>
                </div >
            </motion.div >
        </div >
    );
}
