import React from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@radix-ui/react-popover';
import { Button } from '@/components/ui/button';
import { MoreVertical, ArrowUp, ArrowDown, FolderInput, Circle } from 'lucide-react';

export default function TaskMenu({ task, projects, onMoveUp, onMoveDown, onMoveProject, onSetStatus }) {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/10"
                    onClick={(e) => e.stopPropagation()} // Prevent opening task canvas
                >
                    <MoreVertical className="h-4 w-4 text-muted-foreground" />
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className="w-56 bg-[#1a1a1a] border border-white/10 text-white p-1 shadow-xl z-50 overflow-hidden rounded-lg"
                align="end"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex flex-col gap-1">
                    {/* Reordering */}
                    <div className="flex gap-1 p-1">
                        <Button variant="ghost" size="sm" onClick={onMoveUp} className="flex-1 h-8 bg-white/5 hover:bg-white/10 justify-center">
                            <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={onMoveDown} className="flex-1 h-8 bg-white/5 hover:bg-white/10 justify-center">
                            <ArrowDown className="h-4 w-4" />
                        </Button>
                    </div>

                    <div className="h-[1px] bg-white/10 my-1" />

                    {/* Status Colors */}
                    <div className="p-2">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2 font-medium">Status</p>
                        <div className="flex justify-between px-2">
                            {['#22c55e', '#f97316', '#ef4444'].map(color => (
                                <button
                                    key={color}
                                    onClick={() => onSetStatus(color)}
                                    className={`w-6 h-6 rounded-full border-2 transition-all hover:scale-110 ${task.canvasData?.customStatus === color ? 'border-white' : 'border-transparent'}`}
                                    style={{ backgroundColor: color }}
                                />
                            ))}
                            <button
                                onClick={() => onSetStatus(null)}
                                className="w-6 h-6 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/10"
                                title="Clear Status"
                            >
                                <span className="w-3 h-[1px] bg-white/50 rotate-45 transform absolute" />
                            </button>
                        </div>
                    </div>

                    <div className="h-[1px] bg-white/10 my-1" />

                    {/* Move to Project */}
                    <div className="p-1">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider px-2 mb-1 font-medium">Move To</p>
                        <div className="max-h-[120px] overflow-y-auto space-y-0.5 custom-scrollbar">
                            {projects.map(p => {
                                if (p.id === task.projectId) return null;
                                return (
                                    <button
                                        key={p.id}
                                        onClick={() => onMoveProject(p.id)}
                                        className="w-full text-left px-2 py-1.5 text-xs rounded hover:bg-white/10 flex items-center gap-2 truncate"
                                    >
                                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
                                        <span className="truncate">{p.name}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}
