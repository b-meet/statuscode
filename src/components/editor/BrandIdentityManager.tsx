"use client";

import { useEditor } from "@/context/EditorContext";
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Globe, ChevronRight, Loader2, ExternalLink } from "lucide-react";
import { useSmartPosition } from "@/hooks/useSmartPosition";
import { createClient } from "@/utils/supabase/client";

export default function BrandIdentityManager() {
    const { config, updateConfig, subdomainError, setSubdomainError } = useEditor();
    const [isOpen, setIsOpen] = useState(false);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const popupRef = useRef<HTMLDivElement>(null);
    const [isVerifyingSubdomain, setIsVerifyingSubdomain] = useState(false);
    const [host, setHost] = useState('');
    const supabase = createClient();

    const { top, bottom, left, maxHeight, transformOrigin, isReady } = useSmartPosition(buttonRef, isOpen);

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
    }, [config.subdomain, config.id, supabase, setSubdomainError]);

    const toggleOpen = () => setIsOpen(!isOpen);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                isOpen &&
                popupRef.current &&
                !popupRef.current.contains(event.target as Node) &&
                buttonRef.current &&
                !buttonRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);


    return (
        <>
            <div className="space-y-3">
                <button
                    ref={buttonRef}
                    onClick={toggleOpen}
                    className={`w-full flex items-center justify-between group p-2 -ml-2 rounded-lg transition-colors ${isOpen ? 'bg-zinc-800' : 'hover:bg-zinc-800/50'}`}
                >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${isOpen ? 'bg-zinc-700 text-white' : 'bg-zinc-800 text-zinc-400 group-hover:text-zinc-300'}`}>
                            <Globe className="w-4 h-4" />
                        </div>
                        <div className="text-left">
                            <h3 className="text-xs font-semibold text-zinc-300">Identity</h3>
                            <div className="text-[10px] text-zinc-500 flex items-center gap-1.5 truncate">
                                {config.brandName || 'Unnamed Project'}
                            </div>
                        </div>
                    </div>
                    <ChevronRight className={`w-4 h-4 text-zinc-500 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                </button>
            </div>

            {isOpen && isReady && createPortal(
                <>
                    {/* Popover Menu */}
                    <div
                        ref={popupRef}
                        className="fixed z-[9999] w-80 bg-[#09090b] border border-zinc-800 rounded-xl shadow-2xl p-4 animate-in fade-in zoom-in-95 duration-200 flex flex-col gap-4"
                        style={{
                            top: top,
                            bottom: bottom,
                            left: left,
                            maxHeight: maxHeight,
                            transformOrigin: transformOrigin
                        }}
                    >
                        <div className="flex items-center justify-between border-b border-zinc-800/50 pb-2 shrink-0">
                            <div className="text-xs font-semibold text-white uppercase tracking-wider">Brand Identity</div>
                        </div>

                        <div className="space-y-4 overflow-y-auto custom-scrollbar px-1 pb-1">

                            {/* Brand Name Input */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-tight">Brand Name</label>
                                <input
                                    type="text"
                                    value={config.brandName}
                                    onChange={(e) => updateConfig({ brandName: e.target.value })}
                                    placeholder="e.g. Acme Corp"
                                    className="w-full h-9 px-3 rounded-lg bg-black border border-zinc-800 text-white text-sm placeholder:text-zinc-700 focus:outline-none focus:border-indigo-500 transition-colors"
                                />
                            </div>

                            {/* Subdomain Input */}
                            <div className="space-y-1.5 flex-1">
                                <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-tight">Subdomain</label>
                                <div className="flex gap-2">
                                    <div className={`
                                        flex-1 bg-black border rounded-lg flex items-center px-3 gap-1 overflow-hidden transition-colors
                                        ${subdomainError ? 'border-red-500/50' : 'border-zinc-800 focus-within:border-indigo-500'}
                                    `}>
                                        <span className="text-zinc-600 text-[11px] whitespace-nowrap">{host || 'statuscode.in'}/s/</span>
                                        <input
                                            type="text"
                                            value={config.subdomain || ''}
                                            onChange={(e) => updateConfig({ subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                                            placeholder={config.brandName.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'demo'}
                                            className="flex-1 h-9 bg-transparent border-none text-white text-xs placeholder:text-zinc-800 focus:outline-none focus:ring-0 p-0 min-w-0"
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
                                    <p className="text-[10px] text-zinc-600 leading-tight">
                                        The URL where your status page will be publicly accessible.
                                    </p>
                                )}
                            </div>
                        </div>

                    </div>
                </>,
                document.body
            )}
        </>
    );
}
