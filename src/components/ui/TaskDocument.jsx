import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Plus, Clock, Timer, Table, Flame, Kanban, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
    WidgetContainer,
    TimerWidget,
    StopwatchWidget,
    TableWidget,
    StreakWidget,
    KanbanWidget
} from './TaskWidgets';

export default function TaskDocument({ task, visible, onChange }) {
    const [content, setContent] = useState(task.documentContent || '');
    const [widgets, setWidgets] = useState(task.widgets || []);

    useEffect(() => {
        // Sync content and widgets back to parent whenever they change
        onChange({ documentContent: content, widgets });
    }, [content, widgets, onChange]);

    const addWidget = (type) => {
        const newWidget = {
            id: Math.random().toString(36).substr(2, 9),
            type,
            data: {}
        };
        setWidgets([...widgets, newWidget]);
    };

    const removeWidget = (id) => {
        setWidgets(widgets.filter(w => w.id !== id));
    };

    const updateWidgetData = (id, data) => {
        setWidgets(widgets.map(w => w.id === id ? { ...w, data } : w));
    };

    if (!visible) return null;

    return (
        <div className="flex-1 bg-[#1a1a1a] overflow-y-auto flex justify-center p-8 animate-in fade-in duration-200">
            <div className="w-full max-w-3xl bg-[#0c0c0c] min-h-[800px] shadow-2xl border border-white/5 p-12 rounded-lg relative">

                <div className="flex justify-between items-start mb-8 border-b border-white/10 pb-4">
                    <h1 className="text-4xl font-light text-white">
                        {task.title}
                    </h1>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-white">
                                <Plus className="w-4 h-4 mr-2" /> Add
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-[#111] border-white/10 text-white">
                            <DropdownMenuItem onClick={() => addWidget('timer')} className="hover:bg-white/10 cursor-pointer">
                                <Timer className="w-4 h-4 mr-2" /> Timer
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => addWidget('stopwatch')} className="hover:bg-white/10 cursor-pointer">
                                <Clock className="w-4 h-4 mr-2" /> Stopwatch
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => addWidget('table')} className="hover:bg-white/10 cursor-pointer">
                                <Table className="w-4 h-4 mr-2" /> Table
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => addWidget('streak')} className="hover:bg-white/10 cursor-pointer">
                                <Flame className="w-4 h-4 mr-2" /> Streak Counter
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => addWidget('kanban')} className="hover:bg-white/10 cursor-pointer">
                                <Kanban className="w-4 h-4 mr-2" /> Kanban Board
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                <div className="mb-8">
                    {widgets.map(widget => (
                        <WidgetContainer
                            key={widget.id}
                            title={widget.type}
                            onDelete={() => removeWidget(widget.id)}
                        >
                            {widget.type === 'timer' && (
                                <TimerWidget data={widget.data} onChange={(data) => updateWidgetData(widget.id, data)} />
                            )}
                            {widget.type === 'stopwatch' && (
                                <StopwatchWidget data={widget.data} onChange={(data) => updateWidgetData(widget.id, data)} />
                            )}
                            {widget.type === 'table' && (
                                <TableWidget data={widget.data} onChange={(data) => updateWidgetData(widget.id, data)} />
                            )}
                            {widget.type === 'streak' && (
                                <StreakWidget data={widget.data} onChange={(data) => updateWidgetData(widget.id, data)} />
                            )}
                            {widget.type === 'kanban' && (
                                <KanbanWidget data={widget.data} onChange={(data) => updateWidgetData(widget.id, data)} />
                            )}
                        </WidgetContainer>
                    ))}
                </div>

                <textarea
                    className="w-full h-[calc(100%-100px)] bg-transparent resize-none focus:outline-none text-gray-300 text-lg leading-relaxed placeholder:text-white/10"
                    placeholder="Start writing..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    spellCheck={false}
                />
            </div>
        </div>
    );
}
