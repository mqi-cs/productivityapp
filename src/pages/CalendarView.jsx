import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { DndContext, DragOverlay, useDraggable, useDroppable, useSensors, useSensor, PointerSensor } from '@dnd-kit/core';
import { ChevronLeft, ChevronRight, Inbox, Plus, Check, MoreHorizontal, X, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

// CONFIG
const HOURS = Array.from({ length: 18 }, (_, i) => i + 5); // 5 AM to 10 PM
const CELL_HEIGHT = 60; // px
const MINUTE_HEIGHT = CELL_HEIGHT / 60;

export default function CalendarView() {
    const { inboxTasks, scheduleTask, unscheduleTask, addTask, projects, overdueTasks, dueTodayTasks } = useData();
    const [viewMode, setViewMode] = useState('week'); // 'day', '3day', 'week'
    const [currentDate, setCurrentDate] = useState(new Date());
    const [draggedTask, setDraggedTask] = useState(null);

    // Selection / Creation State
    const [isSelecting, setIsSelecting] = useState(false);
    const [selection, setSelection] = useState(null); // { start: Date, end: Date }
    const [showCreationDialog, setShowCreationDialog] = useState(false);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [isRecurring, setIsRecurring] = useState(false); // New State

    const sensors = useSensors(useSensor(PointerSensor, {
        activationConstraint: { distance: 8 }
    }));

    // Date Logic
    const getVisibleDates = () => {
        const dates = [];
        const start = new Date(currentDate);

        if (viewMode === 'week') {
            const day = start.getDay();
            const diff = start.getDate() - day + (day == 0 ? -6 : 1);
            start.setDate(diff); // Set to Monday
            for (let i = 0; i < 7; i++) {
                const d = new Date(start);
                d.setDate(start.getDate() + i);
                dates.push(d);
            }
        } else if (viewMode === '3day') {
            for (let i = 0; i < 3; i++) {
                const d = new Date(start);
                d.setDate(start.getDate() + i);
                dates.push(d);
            }
        } else if (viewMode === 'month') {
            // Logic handled in MonthGrid component, but we need a date for the header
            return [start];
        } else {
            dates.push(new Date(start));
        }
        return dates;
    };

    const visibleDates = getVisibleDates();

    // Date Header Text Helper
    const getDateHeaderText = () => {
        if (viewMode === 'month') return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

        const first = visibleDates[0];
        const last = visibleDates[visibleDates.length - 1];

        if (first.getMonth() === last.getMonth()) {
            return `${first.toLocaleDateString('en-US', { month: 'short' })} ${first.getDate()} - ${last.getDate()}`;
        }
        return `${first.toLocaleDateString('en-US', { month: 'short' })} ${first.getDate()} - ${last.toLocaleDateString('en-US', { month: 'short' })} ${last.getDate()}`;
    };


    // -- Handlers --

    const handleDateChange = (dir) => {
        const d = new Date(currentDate);
        if (viewMode === 'month') {
            d.setMonth(d.getMonth() + dir);
        } else {
            const step = viewMode === 'week' ? 7 : viewMode === '3day' ? 3 : 1;
            d.setDate(d.getDate() + (dir * step));
        }
        setCurrentDate(d);
    };

    // Selection Logic (Click & Drag to Create)
    const gridRef = useRef(null);

    const handleMouseDown = (e, date, hour) => {
        if (e.button !== 0) return; // Only left click
        e.preventDefault();

        const start = new Date(date);
        start.setHours(hour, 0, 0, 0);

        setIsSelecting(true);
        setSelection({ start, end: new Date(start.getTime() + 60 * 60 * 1000) }); // Default 1h
    };

    const handleMouseMove = (e) => { /* ... Unused but keep for safety if needed later ... */ };

    const handleMouseEnterSlot = (date, hour) => {
        if (isSelecting && selection) {
            const current = new Date(date);
            current.setHours(hour + 1, 0, 0, 0); // End of this slot

            // Only allow dragging forward for now
            if (current > selection.start) {
                setSelection(prev => ({ ...prev, end: current }));
            }
        }
    };

    const handleMouseUp = () => {
        if (isSelecting) {
            setIsSelecting(false);
            if (selection) {
                setShowCreationDialog(true);
            }
        }
    };

    const cancelCreation = () => {
        setShowCreationDialog(false);
        setNewTaskTitle('');
        setSelection(null); // Fix: Clear highlight on cancel
        setIsRecurring(false);
    }

    const handleCreateTask = () => {
        if (!newTaskTitle.trim() || !selection) return;

        const duration = (selection.end - selection.start) / (1000 * 60);
        // Pass recurrence 'daily' if checked. Use first project as default.
        addTask(newTaskTitle, projects[0]?.id, duration, selection.start, isRecurring ? 'daily' : null);

        cancelCreation();
    };

    // Task Editing
    const [editingTask, setEditingTask] = useState(null);
    const { updateTask, toggleTaskStatus } = useData();

    const openEditDialog = (task) => {
        setEditingTask(task);
    };

    const handleSaveEdit = () => {
        if (editingTask && editingTask.title.trim()) {
            updateTask(editingTask.id, { title: editingTask.title });
            setEditingTask(null);
        }
    };

    const handleCompleteTask = () => {
        if (editingTask) {
            // Extract the date context from the editing instance
            const dateStr = editingTask.scheduledStart ? editingTask.scheduledStart.split('T')[0] : null;
            toggleTaskStatus(editingTask.id, dateStr);
            setEditingTask(null);
        }
    };

    const handleDeleteTask = () => {
        if (editingTask) {
            // For now just unschedule? Or real delete?
            // Let's unschedule to be safe (move to inbox)
            unscheduleTask(editingTask.id);
            setEditingTask(null);
        }
    }


    // DnD Handlers
    const handleDragStart = (e) => {
        setDraggedTask(e.active.data.current.task);
    };

    const handleDragEnd = (e) => {
        const { active, over } = e;
        setDraggedTask(null);

        if (!over) return;

        if (over.id.startsWith('cell-')) {
            const [cellId, hourStr] = over.id.split('_');
            const dateStr = cellId.replace('cell-', '');
            scheduleTask(active.id, dateStr, parseInt(hourStr));
        } else if (over.id === 'inbox-droppable') {
            unscheduleTask(active.id);
        }
    };


    return (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="flex h-full w-full bg-[#0c0c0c] text-foreground overflow-hidden" onMouseUp={handleMouseUp}>

                {/* 1. MORGEN-STYLE SIDEBAR */}
                <div className="w-72 flex-none border-r border-white/5 bg-[#111] flex flex-col font-sans">

                    {/* Overdue Section */}
                    {overdueTasks.length > 0 && (
                        <div className="py-2">
                            <div className="px-4 py-2 flex items-center justify-between text-xs font-bold text-red-500 uppercase tracking-wider">
                                <span>Overdue</span>
                                <span className="bg-red-500/10 px-1.5 rounded">{overdueTasks.length}</span>
                            </div>
                            <InboxList tasks={overdueTasks} id="overdue-list" />
                        </div>
                    )}

                    {/* Due Today Section */}
                    <div className="py-2">
                        <div className="px-4 py-2 flex items-center justify-between text-xs font-bold text-amber-500 uppercase tracking-wider">
                            <span>Due Today</span>
                        </div>
                        <InboxList tasks={dueTodayTasks} id="today-list" />
                    </div>

                    {/* Inbox / Projects */}
                    <div className="flex-1 overflow-y-auto">
                        <div className="px-4 py-2 flex items-center justify-between text-xs font-bold text-muted-foreground uppercase tracking-wider mt-4">
                            <span className="flex items-center gap-2"><Inbox className="w-4 h-4" /> Inbox</span>
                            <Button size="icon" variant="ghost" className="w-5 h-5 rounded-full hover:bg-white/10" onClick={() => {/* Add generic task logic later */ }}><Plus className="w-3 h-3" /></Button>
                        </div>
                        <InboxList tasks={inboxTasks} id="inbox-droppable" />

                        {/* Project Lists (Collapsible) */}
                        <div className="mt-6 px-4">
                            <div className="flex items-center justify-between text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Projects</div>
                            {projects.map(p => (
                                <div key={p.id} className="flex items-center gap-2 py-1.5 text-sm text-muted-foreground hover:text-white cursor-pointer group">
                                    <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                                    <span>{p.name}</span>
                                    <MoreHorizontal className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 2. MAIN CALENDAR AREA */}
                <div className="flex-1 flex flex-col min-w-0 bg-[#0c0c0c]">
                    {/* Header */}
                    <header className="h-14 border-b border-white/5 flex items-center justify-between px-6 bg-[#0c0c0c]/90 backdrop-blur z-20">
                        <div className="flex items-center gap-4">
                            <h1 className="text-xl font-light tracking-wide text-white">
                                {getDateHeaderText()}
                            </h1>
                            <div className="flex items-center gap-1 bg-white/5 rounded-md p-1">
                                <button onClick={() => handleDateChange(-1)} className="p-1 hover:bg-white/10 rounded"><ChevronLeft className="w-4 h-4" /></button>
                                <button onClick={() => handleDateChange(0)} className="text-xs px-2 hover:bg-white/10 rounded">Today</button>
                                <button onClick={() => handleDateChange(1)} className="p-1 hover:bg-white/10 rounded"><ChevronRight className="w-4 h-4" /></button>
                            </div>
                        </div>
                        <div className="flex bg-white/5 rounded-lg p-1 gap-1">
                            {['day', '3day', 'week', 'month'].map(mode => (
                                <button
                                    key={mode}
                                    onClick={() => setViewMode(mode)}
                                    className={cn(
                                        "text-xs uppercase tracking-wider px-3 py-1.5 rounded-md transition-all",
                                        viewMode === mode ? "bg-neon-blue text-white shadow-lg shadow-neon-blue/20" : "text-muted-foreground hover:text-white"
                                    )}
                                >
                                    {mode}
                                </button>
                            ))}
                        </div>
                    </header>

                    {/* Content Switcher */}
                    <div className="flex-1 overflow-y-auto relative scrollbar-hide select-none">
                        {viewMode === 'month' ? (
                            <MonthGrid currentDate={currentDate} onTaskClick={openEditDialog} />
                        ) : (
                            <div className="flex min-w-full">
                                {/* Time Axis */}
                                <div className="w-14 flex-none border-r border-white/5 pt-10 bg-[#0c0c0c] sticky left-0 z-30">
                                    {HOURS.map(h => (
                                        <div key={h} className="h-[60px] text-xs text-right pr-3 text-muted-foreground relative -top-2 font-mono opacity-50">
                                            {h}:00
                                        </div>
                                    ))}
                                </div>

                                {/* Days Columns */}
                                {visibleDates.map((date, i) => (
                                    <DayColumn
                                        key={i}
                                        date={date}
                                        dayName={date.toLocaleDateString('en-US', { weekday: 'short' })}
                                        onMouseDown={handleMouseDown}
                                        onMouseEnterSlot={handleMouseEnterSlot}
                                        selection={selection}
                                        onTaskClick={openEditDialog}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <DragOverlay>
                    {draggedTask ? <TaskItem task={draggedTask} isOverlay /> : null}
                </DragOverlay>

                {/* Creation Dialog */}
                <Dialog open={showCreationDialog} onOpenChange={(open) => !open && cancelCreation()}>
                    <DialogContent className="sm:max-w-[425px] bg-[#111] border-white/10 text-white">
                        <DialogHeader>
                            <DialogTitle>New Event</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <input
                                autoFocus
                                placeholder="What needs to be done?"
                                className="w-full bg-white/5 border border-white/10 rounded-md p-3 text-lg focus:outline-none focus:border-neon-blue transition-colors"
                                value={newTaskTitle}
                                onChange={(e) => setNewTaskTitle(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleCreateTask()}
                            />
                            <div className="flex items-center justify-between">
                                <div className="flex gap-2 text-sm text-muted-foreground">
                                    <div className="bg-white/5 px-2 py-1 rounded">
                                        {selection?.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        -
                                        {selection?.end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                                <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer hover:text-white">
                                    <input
                                        type="checkbox"
                                        checked={isRecurring}
                                        onChange={(e) => setIsRecurring(e.target.checked)}
                                        className="rounded border-white/10 bg-white/5 text-neon-blue focus:ring-neon-blue/50"
                                    />
                                    Daily Ritual
                                </label>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="ghost" onClick={() => setShowCreationDialog(false)}>Cancel</Button>
                            <Button onClick={handleCreateTask} className="bg-neon-blue hover:bg-neon-blue/80 text-white">Create Task</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Edit Dialog */}
                <Dialog open={!!editingTask} onOpenChange={(open) => !open && setEditingTask(null)}>
                    <DialogContent className="sm:max-w-[425px] bg-[#111] border-white/10 text-white">
                        <DialogHeader>
                            <DialogTitle>Edit Event</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <input
                                className="w-full bg-white/5 border border-white/10 rounded-md p-3 text-lg focus:outline-none focus:border-neon-blue transition-colors"
                                value={editingTask?.title || ''}
                                onChange={(e) => setEditingTask(prev => ({ ...prev, title: e.target.value }))}
                            />
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                {editingTask?.recurrence === 'daily' && <span className="text-neon-cyan flex items-center gap-1">↻ Daily Ritual</span>}
                                {editingTask?.status === 'done' && <span className="text-neon-green flex items-center gap-1">✓ Completed</span>}
                            </div>
                        </div>
                        <DialogFooter className="gap-2 sm:gap-0">
                            <div className="flex gap-2 mr-auto">
                                <Button variant="destructive" onClick={handleDeleteTask} className="bg-red-500/10 text-red-500 hover:bg-red-500/20">Remove</Button>
                                <Button
                                    onClick={handleCompleteTask}
                                    className={cn(
                                        "bg-white/5 hover:bg-white/10",
                                        editingTask?.status === 'done' ? "text-neon-green" : "text-white"
                                    )}
                                >
                                    {editingTask?.status === 'done' ? "Mark Undone" : "Mark Done"}
                                </Button>
                            </div>

                            <Button variant="ghost" onClick={() => setEditingTask(null)}>Cancel</Button>
                            <Button onClick={handleSaveEdit} className="bg-neon-blue hover:bg-neon-blue/80 text-white">Save</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </DndContext>
    );
}

// --- SUB COMPONENTS ---

function MonthGrid({ currentDate, onTaskClick }) {
    const { getTasksByDate, projects } = useData();
    const [days, setDays] = useState([]);

    useEffect(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

        // Pad start
        const startPadding = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1; // Mon start
        const d = [];

        // Padding days
        for (let i = 0; i < startPadding; i++) d.push(null);

        // Actual days
        for (let i = 1; i <= lastDay.getDate(); i++) {
            d.push(new Date(year, month, i));
        }

        setDays(d);
    }, [currentDate]);

    return (
        <div className="h-full grid grid-cols-7 grid-rows-[auto_1fr] bg-[#0c0c0c] gap-px border-l border-white/5">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                <div key={day} className="p-2 text-center text-xs text-muted-foreground uppercase tracking-widest border-b border-white/5">{day}</div>
            ))}

            <div className="col-span-7 grid grid-cols-7 auto-rows-fr gap-px bg-white/5">
                {days.map((date, idx) => {
                    if (!date) return <div key={idx} className="bg-[#0c0c0c] min-h-[100px]" />;

                    const dateStr = date.toISOString().split('T')[0];
                    const tasks = getTasksByDate(dateStr);
                    const isToday = new Date().toDateString() === date.toDateString();

                    return (
                        <div key={idx} className={cn("bg-[#0c0c0c] p-2 min-h-[100px] hover:bg-white/[0.02] transition-colors flex flex-col gap-1", isToday && "bg-white/[0.02]")}>
                            <div className={cn("text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full mb-1", isToday ? "bg-neon-blue text-white" : "text-muted-foreground")}>
                                {date.getDate()}
                            </div>
                            {tasks.slice(0, 4).map(task => {
                                const project = projects.find(p => p.id === task.projectId);
                                return (
                                    <div
                                        key={task.id}
                                        className={cn("text-[10px] truncate px-1.5 py-0.5 rounded border border-white/5 flex items-center gap-1 cursor-pointer", task.status === 'done' ? "opacity-50 line-through grayscale" : "")}
                                        style={{ backgroundColor: `${project?.color}15`, borderColor: `${project?.color}30` }}
                                        onClick={() => onTaskClick(task)}
                                    >
                                        <div className="w-1.5 h-1.5 rounded-full flex-none" style={{ background: project?.color }} />
                                        <span className="truncate opacity-80">{task.title}</span>
                                    </div>
                                )
                            })}
                            {tasks.length > 4 && <div className="text-[10px] text-muted-foreground pl-1">+{tasks.length - 4} more</div>}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

function InboxList({ tasks, id = 'inbox-droppable' }) {
    const { setNodeRef } = useDroppable({ id });
    return (
        <div ref={setNodeRef} className="flex-1 p-2 space-y-2 min-h-[100px]">
            {tasks.map(task => <TaskItem key={task.id} task={task} />)}
            {tasks.length === 0 && <div className="text-center text-xs text-zinc-800 py-4 italic">No tasks</div>}
        </div>
    );
}

function TaskItem({ task, isOverlay }) {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
        id: task.id,
        data: { task }
    });
    const { projects, toggleTaskStatus } = useData();
    const project = projects.find(p => p.id === task.projectId);

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 999
    } : undefined;

    return (
        <div
            ref={setNodeRef}
            className={cn("bg-[#1a1a1a] p-3 rounded-lg border border-white/10 shadow-sm hover:border-white/20 group cursor-grab active:cursor-grabbing flex gap-3 text-left", isOverlay && "shadow-2xl rotate-2")}
            style={style}
            {...listeners}
            {...attributes}
        >
            <button
                onPointerDown={(e) => { e.stopPropagation(); toggleTaskStatus(task.id); }} // Stop propagation so dragging doesn't start
                className={cn("mt-0.5 w-4 h-4 rounded border flex items-center justify-center transition-all", task.status === 'done' ? "bg-neon-green border-neon-green text-black" : "border-white/20 hover:border-white/50")}
            >
                {task.status === 'done' && <Check className="w-3 h-3" />}
            </button>
            <div className="flex-1 min-w-0">
                <div className={cn("text-sm font-medium leading-none mb-1.5", task.status === 'done' && "line-through text-muted-foreground")}>{task.title}</div>
                <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: project?.color }} />
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{project?.name}</span>
                </div>
            </div>
        </div>
    )
}

function DayColumn({ date, dayName, onMouseDown, onMouseEnterSlot, selection, onTaskClick }) {
    const { getTasksByDate, projects, toggleTaskStatus } = useData();
    const dateStr = date.toISOString().split('T')[0];
    const isToday = new Date().toDateString() === date.toDateString();

    const tasks = getTasksByDate(dateStr);

    return (
        <div className="flex-1 min-w-[150px] border-r border-white/5 relative group">
            {/* Header */}
            <div className={cn("h-12 sticky top-0 bg-[#0c0c0c] z-20 border-b border-white/5 flex flex-col items-center justify-center py-2 select-none", isToday && "bg-neon-blue/5 border-b-neon-blue/50")}>
                <span className={cn("text-xs uppercase font-bold tracking-widest", isToday ? "text-neon-blue" : "text-muted-foreground")}>{dayName}</span>
                <div className={cn("text-lg font-light leading-none mt-1", isToday ? "text-white" : "text-muted-foreground")}>
                    {date.getDate()}
                </div>
            </div>

            {/* Grid Cells */}
            <div className="relative">
                {/* Background Grid */}
                {HOURS.map(h => (
                    <DroppableCell
                        key={h}
                        dateStr={dateStr}
                        hour={h}
                        date={date}
                        onMouseDown={onMouseDown}
                        onMouseEnter={onMouseEnterSlot}
                    />
                ))}

                {/* Scheduled Events Layer */}
                {tasks.map(task => {
                    const startHour = new Date(task.scheduledStart).getHours();
                    const top = (startHour - HOURS[0]) * CELL_HEIGHT;
                    const height = (task.duration / 60) * CELL_HEIGHT;
                    const project = projects.find(p => p.id === task.projectId);
                    const isDone = task.status === 'done';

                    if (startHour < HOURS[0]) return null;

                    return (
                        <div
                            key={task.id}
                            onClick={(e) => { e.stopPropagation(); onTaskClick(task); }}
                            className={cn(
                                "absolute left-1 right-1 rounded sm text-xs p-1.5 overflow-hidden shadow-sm hover:brightness-110 transition-all cursor-pointer z-10 flex flex-col",
                                isDone ? "opacity-60 grayscale" : ""
                            )}
                            style={{
                                top: `${top}px`,
                                height: `${height - 2}px`,
                                backgroundColor: `${project?.color}15`,
                                borderLeft: `3px solid ${project?.color}`,
                                borderTop: '1px solid rgba(255,255,255,0.05)',
                                borderRight: '1px solid rgba(255,255,255,0.05)',
                                borderBottom: '1px solid rgba(255,255,255,0.05)',
                            }}
                        >
                            <div className="flex items-start gap-1.5">
                                {/* Checkbox Overlay on Hover/Interactive */}
                                <div
                                    onClick={(e) => { e.stopPropagation(); toggleTaskStatus(task.id, dateStr); }}
                                    className={cn(
                                        "mt-0.5 w-3 h-3 rounded border flex-none flex items-center justify-center transition-all cursor-pointer z-20 hover:scale-110",
                                        isDone ? "bg-green-500 border-green-500 text-black" : "border-white/30 hover:bg-white/10"
                                    )}
                                >
                                    {isDone && <Check className="w-2 h-2" />}
                                </div>
                                <div className={cn("font-medium truncate leading-tight select-none", isDone && "line-through text-white/50")}>
                                    {task.title}
                                </div>
                            </div>
                        </div>
                    )
                })}

                {/* Ghost Selection Layer */}
                {selection && selection.start.toDateString() === date.toDateString() && (
                    <div
                        className="absolute left-1 right-1 rounded-md bg-neon-blue/20 border border-neon-blue/50 z-20 pointer-events-none"
                        style={{
                            top: `${(selection.start.getHours() - HOURS[0]) * CELL_HEIGHT}px`,
                            height: `${((selection.end - selection.start) / (1000 * 60 * 60)) * CELL_HEIGHT}px`
                        }}
                    >
                        <div className="p-2 text-xs text-neon-cyan font-bold">New Event...</div>
                    </div>
                )}

                {/* Current Time Indicator */}
                {isToday && (
                    <div className="absolute left-0 right-0 border-t border-red-500 z-30 pointer-events-none opacity-50" style={{ top: '30%' }}>
                        <div className="absolute -left-1 -top-1 w-2 h-2 rounded-full bg-red-500" />
                    </div>
                )}
            </div>
        </div>
    )
}

function DroppableCell({ dateStr, hour, date, onMouseDown, onMouseEnter }) {
    const { setNodeRef, isOver } = useDroppable({
        id: `cell-${dateStr}_${hour}`
    });

    return (
        <div
            ref={setNodeRef}
            onMouseDown={(e) => onMouseDown(e, date, hour)}
            onMouseEnter={() => onMouseEnter(date, hour)}
            style={{ height: CELL_HEIGHT }}
            className={cn(
                "border-b border-white/5 relative transition-colors cursor-crosshair",
                isOver ? "bg-white/5" : "hover:bg-white/[0.02]"
            )}
        >
        </div>
    )
}
