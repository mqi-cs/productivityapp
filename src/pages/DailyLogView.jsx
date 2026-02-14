import React, { useState, useMemo, useEffect } from 'react';
import { useData } from '@/context/DataContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Save, Plus, X, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Helper Components ---

function BlockEditor({ block, projects, onSave, onCancel, onDelete }) {
    const [selectedProject, setSelectedProject] = useState(block?.projectId || projects[0]?.id);
    const [note, setNote] = useState(block?.note || '');
    const [duration, setDuration] = useState(block?.duration || 60);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 bg-[#1a1a1a] border border-white/10 rounded-xl p-4 shadow-2xl z-50 flex flex-col gap-4"
        >
            <h3 className="text-white font-medium">Log Time Block</h3>

            {/* Project Selection */}
            <div className="grid grid-cols-2 gap-2">
                {projects.map(p => (
                    <button
                        key={p.id}
                        onClick={() => setSelectedProject(p.id)}
                        className={cn(
                            "flex items-center gap-2 p-2 rounded border text-xs transition-all",
                            selectedProject === p.id
                                ? "bg-white/10 border-white/20 text-white"
                                : "border-transparent hover:bg-white/5 text-muted-foreground hover:text-white"
                        )}
                        style={{
                            borderColor: selectedProject === p.id ? p.color : 'transparent'
                        }}
                    >
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                        {p.name}
                    </button>
                ))}
            </div>

            {/* Note Input */}
            <input
                className="w-full bg-[#111] border border-white/10 rounded p-2 text-sm text-white focus:border-neon-blue outline-none"
                placeholder="What did you do?"
                value={note}
                onChange={e => setNote(e.target.value)}
                autoFocus
            />

            {/* Controls */}
            <div className="flex gap-2 justify-end mt-2">
                {onDelete && (
                    <Button variant="ghost" size="sm" onClick={onDelete} className="mr-auto text-red-500 hover:text-red-400 hover:bg-red-500/10">
                        <X className="w-4 h-4" />
                    </Button>
                )}
                <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
                <Button
                    size="sm"
                    className="bg-neon-blue text-white hover:bg-neon-blue/80"
                    onClick={() => onSave({
                        ...block,
                        projectId: selectedProject,
                        note,
                        duration: parseInt(duration),
                        // Calculate end time based on start + duration? 
                        // For now we assume the block has a start time.
                    })}
                >
                    <Save className="w-4 h-4 mr-1" /> Save
                </Button>
            </div>
        </motion.div>
    );
}

export default function DailyLogView() {
    const { projects, dailyLogs, saveDailyLog } = useData();
    const [currentDate, setCurrentDate] = useState(() => {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        return d;
    });

    // Derived date key for lookup
    const dateKey = currentDate.toISOString().split('T')[0];
    const todaysBlocks = dailyLogs[dateKey] || [];

    const [editingBlock, setEditingBlock] = useState(null); // { id, start, duration, projectId, note } or null
    const [isCreating, setIsCreating] = useState(false);
    const [creationTime, setCreationTime] = useState(null); // start time in minutes

    // Time Grid Generation (24h)
    const hours = Array.from({ length: 24 }, (_, i) => i);

    // -- Handlers --

    const changeDate = (days) => {
        const d = new Date(currentDate);
        d.setDate(d.getDate() + days);
        setCurrentDate(d);
        setEditingBlock(null);
        setIsCreating(false);
    };

    const handleSlotClick = (hour, minute = 0) => {
        const startTime = hour * 60 + minute;
        // Check if overlaps? (Optional)
        setCreationTime(startTime);
        setIsCreating(true);
    };

    const saveBlock = (blockData) => {
        // blockData: { id, start, duration, projectId, note }
        const newBlock = {
            id: blockData.id || Math.random().toString(36).substr(2, 9),
            start: isCreating ? creationTime : blockData.start,
            duration: blockData.duration || 60,
            projectId: blockData.projectId,
            note: blockData.note
        };

        let newBlocks;
        if (isCreating) {
            newBlocks = [...todaysBlocks, newBlock];
        } else {
            newBlocks = todaysBlocks.map(b => b.id === blockData.id ? newBlock : b);
        }

        saveDailyLog(dateKey, newBlocks);
        setIsCreating(false);
        setEditingBlock(null);
    };

    const deleteBlock = (id) => {
        const newBlocks = todaysBlocks.filter(b => b.id !== id);
        saveDailyLog(dateKey, newBlocks);
        setEditingBlock(null);
    };

    // Calculate position for blocks
    // 1440 minutes in a day. Height: let's say 24 * 60 = 1440px or scaled.
    // Let's use 60px per hour -> 1px per minute. Total height 1440px.
    const PIXELS_PER_MINUTE = 1.0;

    return (
        <div className="relative h-full flex flex-col bg-[#0c0c0c] overflow-hidden">
            {/* Header */}
            <header className="h-20 border-b border-white/5 flex items-center justify-between px-8 bg-[#0c0c0c]/90 backdrop-blur z-20">
                <div className="flex items-center gap-4">
                    <h1 className="text-3xl font-light tracking-tight text-white">Daily Log</h1>
                    <div className="flex items-center gap-2 bg-[#1a1a1a] rounded p-1 border border-white/5">
                        <Button variant="ghost" size="icon" onClick={() => changeDate(-1)} className="h-8 w-8 hover:bg-white/5">
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <span className="text-sm font-mono w-32 text-center text-neon-blue">
                            {currentDate.toLocaleDateString(undefined, { weekday: 'short', month: 'long', day: 'numeric' })}
                        </span>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => changeDate(1)}
                            className="h-8 w-8 hover:bg-white/5"
                            disabled={dateKey === new Date().toISOString().split('T')[0]}
                        >
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-neon-blue/20 border border-neon-blue rounded-sm" />
                        <span>Logged: {todaysBlocks.reduce((acc, b) => acc + b.duration, 0) / 60}h</span>
                    </div>
                    {/* Could add 'Auto-fill from Tasks' button later */}
                </div>
            </header>

            {/* Scrollable Timeline */}
            <div className="flex-1 overflow-y-auto relative custom-scrollbar">
                <div className="relative w-full max-w-4xl mx-auto min-h-[1440px] bg-[#111] my-8 rounded-xl shadow-2xl border border-white/5">

                    {/* Background Grid */}
                    {hours.map(h => (
                        <div
                            key={h}
                            className="absolute w-full border-t border-white/5 flex group cursor-crosshair"
                            style={{ top: h * 60 * PIXELS_PER_MINUTE, height: 60 * PIXELS_PER_MINUTE }}
                            onClick={() => handleSlotClick(h)}
                        >
                            <div className="w-16 text-right pr-4 text-xs text-muted-foreground/50 -translate-y-2 font-mono">
                                {h.toString().padStart(2, '0')}:00
                            </div>
                            <div className="flex-1 group-hover:bg-white/[0.02] transition-colors" />
                        </div>
                    ))}

                    {/* Current Time Indicator (if today) */}
                    {dateKey === new Date().toISOString().split('T')[0] && (
                        <div
                            className="absolute w-full border-t-2 border-red-500/50 z-10 pointer-events-none"
                            style={{
                                top: (new Date().getHours() * 60 + new Date().getMinutes()) * PIXELS_PER_MINUTE
                            }}
                        >
                            <div className="absolute left-14 -translate-y-2.5 text-[10px] bg-red-500 text-white px-1 rounded-sm font-mono">
                                NOW
                            </div>
                        </div>
                    )}

                    {/* Blocks */}
                    <AnimatePresence>
                        {todaysBlocks.map(block => {
                            const project = projects.find(p => p.id === block.projectId) || projects[0];
                            return (
                                <motion.div
                                    key={block.id}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="absolute left-20 right-4 rounded-md border text-xs p-2 cursor-pointer hover:brightness-110 flex flex-col justify-center overflow-hidden"
                                    style={{
                                        top: block.start * PIXELS_PER_MINUTE,
                                        height: block.duration * PIXELS_PER_MINUTE,
                                        backgroundColor: `${project.color}20`,
                                        borderColor: `${project.color}40`,
                                        color: project.color
                                    }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setEditingBlock(block);
                                    }}
                                >
                                    <div className="font-bold truncate">{project.name}</div>
                                    <div className="opacity-70 truncate">{block.note}</div>
                                    <div className="absolute top-1 right-2 opacity-50 text-[10px]">
                                        {Math.floor(block.duration / 60)}h {block.duration % 60}m
                                    </div>
                                </motion.div>
                            )
                        })}
                    </AnimatePresence>

                    {/* Editor Overlay */}
                    {(isCreating || editingBlock) && (
                        <>
                            <div
                                className="fixed inset-0 bg-black/50 backdrop-blur-[1px] z-40"
                                onClick={() => { setIsCreating(false); setEditingBlock(null); }}
                            />
                            <BlockEditor
                                block={editingBlock || { start: creationTime }}
                                projects={projects}
                                onSave={saveBlock}
                                onCancel={() => { setIsCreating(false); setEditingBlock(null); }}
                                onDelete={editingBlock ? () => deleteBlock(editingBlock.id) : null}
                            />
                        </>
                    )}

                </div>
            </div>
        </div>
    );
}
