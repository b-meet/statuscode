"use client";

import { useEditor } from "@/context/EditorContext";
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { ImageIcon, ChevronRight, UploadCloud, Loader2, X } from "lucide-react";
import { useSmartPosition } from "@/hooks/useSmartPosition";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";

export default function BrandLogoManager() {
    const { config, updateConfig } = useEditor();
    const [isOpen, setIsOpen] = useState(false);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const popupRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);
    const supabase = createClient();

    const { top, bottom, left, maxHeight, transformOrigin, isReady } = useSmartPosition(buttonRef, isOpen);

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

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast.error("Please upload an image file");
            return;
        }

        if (file.size > 2 * 1024 * 1024) {
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
        <>
            <div className="space-y-3">
                <button
                    ref={buttonRef}
                    onClick={toggleOpen}
                    className={`w-full flex items-center justify-between group p-2 -ml-2 rounded-lg transition-colors ${isOpen ? 'bg-zinc-800' : 'hover:bg-zinc-800/50'}`}
                >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${isOpen ? 'bg-zinc-700 text-white' : 'bg-zinc-800 text-zinc-400 group-hover:text-zinc-300'}`}>
                            {config.logoUrl ? (
                                <img src={config.logoUrl} alt="Logo" className="w-5 h-5 object-contain" />
                            ) : (
                                <ImageIcon className="w-4 h-4" />
                            )}
                        </div>
                        <div className="text-left">
                            <h3 className="text-xs font-semibold text-zinc-300">Logo</h3>
                            <div className="text-[10px] text-zinc-500 flex items-center gap-1.5 truncate">
                                {config.logoUrl ? 'Custom uploaded' : 'Click to setup'}
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
                            <div className="text-xs font-semibold text-white uppercase tracking-wider">Brand Logo</div>
                        </div>

                        <div className="overflow-y-auto custom-scrollbar px-1 pb-1">
                            {/* Logo Input */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-tight">Image Upload</label>

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
                                            relative flex-1 h-32 rounded-xl border border-dashed border-zinc-700 bg-zinc-900/50 
                                            flex flex-col items-center justify-center gap-2 cursor-pointer 
                                            hover:border-zinc-500 hover:bg-zinc-800/50 transition-all group
                                            ${isUploading ? 'opacity-50 pointer-events-none' : ''}
                                        `}
                                    >
                                        {config.logoUrl ? (
                                            <>
                                                <img
                                                    src={config.logoUrl}
                                                    alt="Logo Preview"
                                                    className="h-16 object-contain absolute z-0 opacity-80 group-hover:opacity-20 transition-opacity"
                                                />
                                                <div className="z-10 bg-black/60 shadow-xl backdrop-blur p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity border border-white/10">
                                                    <UploadCloud className="w-5 h-5 text-white" />
                                                </div>
                                                <span className="text-[10px] text-zinc-300 font-bold z-10 opacity-0 group-hover:opacity-100 transition-opacity mt-2">Change Image</span>

                                                {/* Remove Button */}
                                                <div
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        updateConfig({ logoUrl: '' });
                                                    }}
                                                    className="absolute -top-2 -right-2 p-1.5 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-white hover:bg-red-500 hover:border-red-500 shadow-xl transition-all z-30 opacity-0 group-hover:opacity-100"
                                                    title="Remove Logo"
                                                >
                                                    <X className="w-3.5 h-3.5" />
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div className="p-3 rounded-full bg-zinc-800 border border-zinc-700 shadow-inner group-hover:border-zinc-600 group-hover:bg-zinc-700 transition-colors">
                                                    <UploadCloud className="w-5 h-5 text-zinc-300" />
                                                </div>
                                                <div className="text-center">
                                                    <span className="text-xs text-white font-medium block">Click to browse</span>
                                                    <span className="text-[10px] text-zinc-500 mt-1 block">PNG, JPG or SVG</span>
                                                </div>
                                            </>
                                        )}

                                        {isUploading && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm z-20 rounded-xl">
                                                <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <p className="text-[10px] text-zinc-600 mt-2 text-center">
                                    Maximum file size is 2MB.
                                </p>
                            </div>
                        </div>
                    </div>
                </>,
                document.body
            )}
        </>
    );
}
