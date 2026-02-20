"use client";

import { useEditor } from "@/context/EditorContext";
import { UploadCloud, Image as ImageIcon, Loader2, X, ExternalLink } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";

export default function BrandSettings() {
    const { config, updateConfig, subdomainError, setSubdomainError } = useEditor();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isVerifyingSubdomain, setIsVerifyingSubdomain] = useState(false);
    const [host, setHost] = useState('');
    const supabase = createClient();

    useEffect(() => {
        setHost(window.location.host);
    }, []);

    // Debounced Subdomain Validation
    useEffect(() => {
        if (!config.subdomain) {
            setSubdomainError(null);
            return;
        }

        const timeoutId = setTimeout(async () => {
            setIsVerifyingSubdomain(true);
            setSubdomainError(null);

            try {
                // Check if subdomain exists in 'sites' table
                const { data, error } = await supabase
                    .from('sites')
                    .select('id')
                    .eq('subdomain', config.subdomain)
                    .neq('id', config.id || '') // Exclude current site
                    .maybeSingle();

                if (error) throw error;

                if (data) {
                    setSubdomainError("This subdomain is already taken");
                }
            } catch (err) {
                console.error("Subdomain check failed:", err);
            } finally {
                setIsVerifyingSubdomain(false);
            }
        }, 500); // 500ms debounce

        return () => clearTimeout(timeoutId);
    }, [config.subdomain, config.id, supabase]);

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validation
        if (!file.type.startsWith('image/')) {
            toast.error("Please upload an image file");
            return;
        }

        if (file.size > 2 * 1024 * 1024) { // 2MB limit
            toast.error("File size must be less than 2MB");
            return;
        }

        setIsUploading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                toast.error("You must be logged in to upload files");
                return;
            }

            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}-${Date.now()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('logos')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: publicUrlData } = supabase.storage
                .from('logos')
                .getPublicUrl(filePath);

            updateConfig({ logoUrl: publicUrlData.publicUrl });
            toast.success("Logo uploaded successfully");

        } catch (error) {
            console.error("Upload failed:", error);
            toast.error("Failed to upload logo");
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    return (
        <div className="space-y-4">
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Brand Configuration</h3>

            {/* Brand Name Input */}
            <div className="space-y-1.5">
                <label className="text-xs text-zinc-500">Brand Name</label>
                <input
                    type="text"
                    value={config.brandName}
                    onChange={(e) => updateConfig({ brandName: e.target.value })}
                    placeholder="e.g. Acme Corp"
                    className="w-full h-9 px-3 rounded-lg bg-black border border-zinc-800 text-white text-sm placeholder:text-zinc-700 focus:outline-none focus:border-zinc-700 transition-colors"
                />
            </div>

            {/* Subdomain Input */}
            <div className="space-y-1.5">
                <label className="text-xs text-zinc-500">Subdomain</label>
                <div className="flex gap-2">
                    <div className={`
                        flex-1 bg-black border rounded-lg flex items-center px-3 gap-1 overflow-hidden transition-colors
                        ${subdomainError ? 'border-red-500/50' : 'border-zinc-800'}
                    `}>
                        <span className="text-zinc-600 text-sm whitespace-nowrap">{host || 'statuscode.in'}/s/</span>
                        <input
                            type="text"
                            value={config.subdomain || ''}
                            onChange={(e) => updateConfig({ subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                            placeholder={config.brandName.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'demo'}
                            className="flex-1 h-9 bg-transparent border-none text-white text-sm placeholder:text-zinc-800 focus:outline-none focus:ring-0 p-0 min-w-0"
                        />
                        {isVerifyingSubdomain && (
                            <Loader2 className="w-3 h-3 text-zinc-500 animate-spin shrink-0" />
                        )}
                    </div>
                    <button
                        onClick={() => {
                            const slug = config.subdomain || config.brandName.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'demo';
                            window.open(`${window.location.origin}/s/${slug}`, '_blank');
                        }}
                        className="px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 transition-colors shrink-0"
                        title="Preview Public Page"
                    >
                        <ExternalLink className="w-4 h-4" />
                    </button>
                </div>
                {subdomainError ? (
                    <p className="text-[10px] text-red-500 font-medium">{subdomainError}</p>
                ) : (
                    <p className="text-[10px] text-zinc-600 text-balanced">
                        The URL where your status page will be publicly accessible.
                    </p>
                )}
            </div>

            {/* Support Configuration */}
            <div className="space-y-3 pt-2 border-t border-zinc-900/50">
                <h4 className="text-xs font-medium text-zinc-400">Support / Report Issue</h4>

                {/* Support Email */}
                <div className="space-y-1.5">
                    <label className="text-xs text-zinc-500">Support Email (Optional)</label>
                    <input
                        type="email"
                        value={config.supportEmail || ''}
                        onChange={(e) => updateConfig({ supportEmail: e.target.value })}
                        placeholder="support@example.com"
                        className="w-full h-9 px-3 rounded-lg bg-black border border-zinc-800 text-white text-sm placeholder:text-zinc-800 focus:outline-none focus:border-zinc-700 transition-colors"
                    />
                </div>

                {/* Support URL */}
                <div className="space-y-1.5">
                    <label className="text-xs text-zinc-500">Custom Support URL (Optional)</label>
                    <input
                        type="url"
                        value={config.supportUrl || ''}
                        onChange={(e) => updateConfig({ supportUrl: e.target.value })}
                        placeholder="https://help.example.com"
                        className="w-full h-9 px-3 rounded-lg bg-black border border-zinc-800 text-white text-sm placeholder:text-zinc-800 focus:outline-none focus:border-zinc-700 transition-colors"
                    />
                    <p className="text-[10px] text-zinc-600">
                        If set, the "Report Issue" button will link here instead of opening a mailto link.
                    </p>
                </div>
            </div>

            {/* Logo Input */}
            <div className="space-y-1.5">
                <label className="text-xs text-zinc-500">Logo</label>

                {/* Hidden File Input */}
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleLogoUpload}
                    accept="image/*"
                    className="hidden"
                />

                <div className="flex gap-3">
                    {/* Preview / Upload Area */}
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className={`
                            relative flex-1 h-20 rounded-lg border border-dashed border-zinc-800 bg-black/50 
                            flex flex-col items-center justify-center gap-1.5 cursor-pointer 
                            hover:border-zinc-700 hover:bg-zinc-900/50 transition-all group
                            ${isUploading ? 'opacity-50 pointer-events-none' : ''}
                        `}
                    >
                        {config.logoUrl ? (
                            <>
                                <img
                                    src={config.logoUrl}
                                    alt="Logo Preview"
                                    className="h-10 object-contain absolute z-0 opacity-50 group-hover:opacity-20 transition-opacity"
                                />
                                <div className="z-10 bg-black/50 backdrop-blur-sm p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity border border-white/10">
                                    <UploadCloud className="w-4 h-4 text-white" />
                                </div>
                                <span className="text-[10px] text-zinc-400 z-10 opacity-0 group-hover:opacity-100 transition-opacity">Change Logo</span>

                                {/* Remove Button */}
                                <div
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        updateConfig({ logoUrl: '' });
                                    }}
                                    className="absolute -top-2 -right-2 p-1 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-white hover:bg-red-500 hover:border-red-500 transition-all z-30 opacity-0 group-hover:opacity-100"
                                    title="Remove Logo"
                                >
                                    <X className="w-3 h-3" />
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="p-2 rounded-full bg-zinc-900 border border-zinc-800 group-hover:border-zinc-700 transition-colors">
                                    <UploadCloud className="w-4 h-4 text-zinc-400" />
                                </div>
                                <span className="text-[10px] text-zinc-500 font-medium">Click to upload</span>
                            </>
                        )}

                        {isUploading && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm z-20">
                                <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
                            </div>
                        )}
                    </div>


                </div>

                <p className="text-[10px] text-zinc-600">
                    Recommended: PNG or SVG, max 2MB.
                </p>
            </div>
        </div>
    );
}
