"use client";

import { useEditor } from "@/context/EditorContext";
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Hammer, Calendar, Clock, Plus, Trash2, X, AlertTriangle, ChevronRight } from "lucide-react";
import { MaintenanceWindow } from "@/lib/types";
import { toDemoStringId } from "@/lib/mockMonitors";

export default function MaintenanceManager() {
    const { config, updateConfig, monitorsData } = useEditor();
    const [isOpen, setIsOpen] = useState(false);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const [view, setView] = useState<'list' | 'add'>('list');

    // Form State
    const [title, setTitle] = useState("");
    const [monitorId, setMonitorId] = useState("all");
    const [date, setDate] = useState("");
    const [time, setTime] = useState("");
    const [duration, setDuration] = useState(60);
    const [description, setDescription] = useState("");

    const [editingId, setEditingId] = useState<string | null>(null);

    const toggleOpen = () => {
        if (!isOpen && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setPosition({
                top: rect.top,
                left: rect.right + 12,
            });
        }
        setIsOpen(!isOpen);
    };

    const popupRef = useRef<HTMLDivElement>(null);

    // Close on scroll or resize
    useEffect(() => {
        const handleScroll = (e: Event) => {
            if (popupRef.current && popupRef.current.contains(e.target as Node)) {
                return;
            }
            setIsOpen(false);
        };

        window.addEventListener('scroll', handleScroll, true);
        window.addEventListener('resize', handleScroll);
        return () => {
            window.removeEventListener('scroll', handleScroll, true);
            window.removeEventListener('resize', handleScroll);
        };
    }, [isOpen]);

    const maintenanceList = config.maintenance || [];
    const activeCount = maintenanceList.filter(m => {
        const start = new Date(m.startTime).getTime();
        const end = start + m.durationMinutes * 60000;
        const now = Date.now();
        return end > now;
    }).length;

    const handleEdit = (window: MaintenanceWindow) => {
        const d = new Date(window.startTime);
        // Format to local date YYYY-MM-DD
        const localDate = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
        // Format to local time HH:mm
        const localTime = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');

        setTitle(window.title);
        setMonitorId(window.monitorId);
        setDate(localDate);
        setTime(localTime);
        setDuration(window.durationMinutes);
        setDescription(window.description || "");
        setEditingId(window.id);
        setView('add');
    };

    const handleSave = () => {
        if (!title || !date || !time) return;

        const startDateTime = new Date(`${date}T${time}`);

        if (editingId) {
            // Update existing
            const updatedList = maintenanceList.map(m => {
                if (m.id === editingId) {
                    return {
                        ...m,
                        monitorId,
                        title,
                        description,
                        startTime: startDateTime.toISOString(),
                        durationMinutes: duration,
                    };
                }
                return m;
            });
            updateConfig({ maintenance: updatedList });
        } else {
            // Create new
            const newWindow: MaintenanceWindow = {
                id: crypto.randomUUID(),
                monitorId,
                title,
                description,
                startTime: startDateTime.toISOString(),
                durationMinutes: duration,
                status: 'scheduled'
            };
            updateConfig({
                maintenance: [...maintenanceList, newWindow]
            });
        }

        // Reset and go back
        setTitle("");
        setMonitorId("all");
        setDescription("");
        setEditingId(null);
        setView('list');
    };

    const handleDelete = (id: string) => {
        updateConfig({
            maintenance: maintenanceList.filter(m => m.id !== id)
        });
    };

    const handleCancel = () => {
        setTitle("");
        setMonitorId("all");
        setDescription("");
        setEditingId(null);
        setView('list');
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
                            <Hammer className="w-4 h-4" />
                        </div>
                        <div className="text-left">
                            <h3 className="text-xs font-semibold text-zinc-300">Maintenance</h3>
                            <div className="text-[10px] text-zinc-500 flex items-center gap-1.5">
                                {activeCount > 0 ? (
                                    <span className="text-amber-400 flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
                                        {activeCount} Active
                                    </span>
                                ) : (
                                    <span className="truncate">No scheduled maintenance</span>
                                )}
                            </div>
                        </div>
                    </div>
                    <ChevronRight className={`w-4 h-4 text-zinc-500 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                </button>
            </div>

            {isOpen && createPortal(
                <>
                    <div
                        className="fixed inset-0 z-[9998] bg-transparent"
                        onClick={() => setIsOpen(false)}
                    />

                    <div
                        ref={popupRef}
                        className="fixed z-[9999] w-80 bg-[#09090b] border border-zinc-800 rounded-xl shadow-2xl p-4 animate-in fade-in zoom-in-95 duration-200"
                        style={{
                            top: Math.min(position.top, window.innerHeight - 500),
                            left: position.left,
                        }}
                    >
                        {view === 'list' ? (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between border-b border-zinc-800/50 pb-2">
                                    <div className="text-xs font-semibold text-white uppercase tracking-wider">Planned Maintenance</div>
                                    <button
                                        onClick={() => {
                                            setTitle("");
                                            setMonitorId("all");
                                            setDescription("");
                                            setEditingId(null);
                                            setView('add');
                                        }}
                                        className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white transition-colors"
                                    >
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                                    {maintenanceList.length === 0 ? (
                                        <div className="text-center py-6 border border-dashed border-zinc-800 rounded-lg bg-zinc-900/20">
                                            <Calendar className="w-6 h-6 text-zinc-600 mx-auto mb-2" />
                                            <p className="text-xs text-zinc-500">No maintenance scheduled.</p>
                                        </div>
                                    ) : (
                                        maintenanceList.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()).map(window => {
                                            const start = new Date(window.startTime);
                                            const end = new Date(start.getTime() + window.durationMinutes * 60000);
                                            const now = new Date();
                                            const isActive = now >= start && now <= end;
                                            const isPast = now > end;

                                            return (
                                                <div key={window.id} className="p-3 rounded-lg border border-zinc-800 bg-zinc-900/50 group relative">
                                                    <div className="flex items-start justify-between">
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <h4 className="text-xs font-medium text-zinc-200">{window.title}</h4>
                                                                {isActive && <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/20">ACTIVE</span>}
                                                                {isPast && <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-zinc-800 text-zinc-500 border border-zinc-700">PAST</span>}
                                                                {!isActive && !isPast && <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/20">UPCOMING</span>}
                                                            </div>
                                                            <div className="text-[10px] text-zinc-500 flex items-center gap-2">
                                                                <Calendar className="w-3 h-3" />
                                                                {start.toLocaleDateString()} {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </div>
                                                            <div className="text-[10px] text-zinc-500 flex items-center gap-2 mt-0.5">
                                                                <Clock className="w-3 h-3" />
                                                                {window.durationMinutes} minutes
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <button
                                                                onClick={() => handleEdit(window)}
                                                                className="text-zinc-600 hover:text-indigo-400 transition-colors p-1"
                                                            >
                                                                <Hammer className="w-3.5 h-3.5" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(window.id)}
                                                                className="text-zinc-600 hover:text-red-400 transition-colors p-1"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between border-b border-zinc-800/50 pb-2">
                                    <div className="text-xs font-semibold text-white uppercase tracking-wider">{editingId ? 'Edit Maintenance' : 'Schedule Maintenance'}</div>
                                    <button
                                        onClick={handleCancel}
                                        className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-medium text-zinc-500 uppercase">Title</label>
                                        <input
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            placeholder="e.g. Database Migration"
                                            className="w-full h-8 px-2 bg-zinc-900 border border-zinc-800 rounded text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500 transition-colors"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[10px] font-medium text-zinc-500 uppercase">Impact</label>
                                        <select
                                            value={monitorId}
                                            onChange={(e) => setMonitorId(e.target.value)}
                                            className="w-full h-8 px-2 bg-zinc-900 border border-zinc-800 rounded text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors appearance-none"
                                        >
                                            <option value="all">All Systems (Full Maintenance)</option>
                                            {monitorsData.map(m => (
                                                <option key={m.id} value={m.id < 0 ? toDemoStringId(m.id) : String(m.id)}>
                                                    {m.friendly_name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-medium text-zinc-500 uppercase">Date</label>
                                            <input
                                                type="date"
                                                value={date}
                                                onChange={(e) => setDate(e.target.value)}
                                                className="w-full h-8 px-2 bg-zinc-900 border border-zinc-800 rounded text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-medium text-zinc-500 uppercase">Time</label>
                                            <input
                                                type="time"
                                                value={time}
                                                onChange={(e) => setTime(e.target.value)}
                                                className="w-full h-8 px-2 bg-zinc-900 border border-zinc-800 rounded text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[10px] font-medium text-zinc-500 uppercase">Duration (Minutes)</label>
                                        <input
                                            type="number"
                                            value={duration}
                                            onChange={(e) => setDuration(parseInt(e.target.value))}
                                            min="1"
                                            className="w-full h-8 px-2 bg-zinc-900 border border-zinc-800 rounded text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <div className="flex items-center justify-between">
                                            <label className="text-[10px] font-medium text-zinc-500 uppercase">Description (Optional)</label>
                                            <div className="group relative">
                                                <div className="cursor-help text-zinc-600 hover:text-zinc-400">
                                                    <AlertTriangle className="w-3 h-3 text-indigo-500" />
                                                </div>
                                                <div className="absolute right-0 bottom-full mb-2 w-48 p-2 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl text-[10px] text-zinc-400 hidden group-hover:block z-[10000]">
                                                    <p className="mb-1 font-bold text-zinc-300">Markdown Supported:</p>
                                                    <ul className="space-y-0.5 font-mono">
                                                        <li>**bold**</li>
                                                        <li>*italic*</li>
                                                        <li>[link](url)</li>
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>
                                        <textarea
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            placeholder="Markdown supported..."
                                            rows={3}
                                            className="w-full p-2 bg-zinc-900 border border-zinc-800 rounded text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                                        />
                                        <div className="text-[9px] text-zinc-600 flex items-center justify-end gap-1">
                                            <span>Markdown supported</span>
                                            <span className="font-mono text-zinc-700">**bold** *italic*</span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleSave}
                                        disabled={!title || !date || !time}
                                        className="w-full py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                                    >
                                        {editingId ? 'Update Maintenance' : 'Schedule Maintenance'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </>,
                document.body
            )}
        </>
    );
}
