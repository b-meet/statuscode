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
    Image as ImageIcon
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

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            setAvatarUrl(publicUrl);
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
            const { data, error } = await supabase.auth.updateUser({
                data: {
                    full_name: fullName,
                    avatar_url: avatarUrl,
                    avatar_selection: avatarSelection,
                    avatar_color: avatarColor
                }
            });

            if (error) throw error;

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
        router.push("/login");
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
                <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-8 pb-10 border-b border-zinc-900/50">
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

                            <div className="absolute -bottom-2 -right-2 flex bg-zinc-950 border border-zinc-800 rounded-xl p-1 shadow-2xl z-10">
                                <button
                                    onClick={() => { setAvatarSelection('photo'); setIsDirty(true); }}
                                    className={`p-1.5 rounded-lg transition-all ${avatarSelection === 'photo' ? 'bg-white text-black shadow-md' : 'text-zinc-500 hover:text-zinc-300'}`}
                                    title="Use Photo"
                                >
                                    <ImageIcon className="w-3.5 h-3.5" />
                                </button>
                                <button
                                    onClick={() => { setAvatarSelection('initials'); setIsDirty(true); }}
                                    className={`p-1.5 rounded-lg transition-all ${avatarSelection === 'initials' ? 'bg-white text-black shadow-md' : 'text-zinc-500 hover:text-zinc-300'}`}
                                    title="Use Initials"
                                >
                                    <span className="text-[10px] font-black leading-none uppercase">Az</span>
                                </button>
                            </div>
                        </div>

                        <div className="space-y-4 text-center sm:text-left">
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight text-white mb-1">Account</h1>
                                <p className="text-zinc-500 text-sm font-medium">Manage your profile and appearance.</p>
                            </div>

                            {avatarSelection === 'initials' && (
                                <div className="space-y-2.5">
                                    <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest leading-none">Avatar Background</p>
                                    <div className="flex flex-wrap justify-center sm:justify-start gap-3">
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
                            )}
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
                </div>
            </motion.div>
        </div>
    );
}
