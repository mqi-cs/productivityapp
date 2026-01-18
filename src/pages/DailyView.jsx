import React, { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Circle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function DailyView() {
    const [date, setDate] = useState(new Date());
    const [tasks, setTasks] = useState([
        { id: 1, text: 'Morning Meditation', done: true, time: '07:00' },
        { id: 2, text: 'Deep Work Session: Api', done: false, time: '09:00' },
        { id: 3, text: 'Team Sync', done: false, time: '14:00' },
    ]);

    const toggleTask = (id) => {
        setTasks(tasks.map(t => t.id === id ? { ...t, done: !t.done } : t));
    };

    return (
        <div className="flex h-full p-8 gap-8">
            {/* Left: Schedule/Calendar */}
            <div className="w-1/3 flex flex-col gap-8">
                <div className="glass-panel p-6 rounded-2xl">
                    <h2 className="text-xl font-light mb-4 text-neon-blue uppercase tracking-widest">Timewarp</h2>
                    <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        className="rounded-md border border-white/10"
                    />
                </div>

                <div className="glass-panel p-6 rounded-2xl flex-1">
                    <h2 className="text-xl font-light mb-4 text-neon-purple uppercase tracking-widest">Focus Metrics</h2>
                    <div className="flex flex-col gap-4">
                        <div className="flex justify-between items-end">
                            <span className="text-muted-foreground">Digital</span>
                            <span className="text-2xl">4h 12m</span>
                        </div>
                        <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                            <div className="h-full bg-neon-blue w-[65%]" />
                        </div>

                        <div className="flex justify-between items-end mt-2">
                            <span className="text-muted-foreground">Analog</span>
                            <span className="text-2xl">1h 30m</span>
                        </div>
                        <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                            <div className="h-full bg-neon-pink w-[30%]" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Right: Task Stream */}
            <div className="flex-1 glass-panel p-8 rounded-2xl overflow-y-auto">
                <header className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-4xl font-light text-white">{date ? date.toLocaleDateString('en-US', { weekday: 'long' }) : 'Today'}</h1>
                        <p className="text-muted-foreground">{date ? date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' }) : ''}</p>
                    </div>
                    <Button variant="outline" className="border-neon-cyan/50 text-neon-cyan hover:bg-neon-cyan/10">
                        + Add Ritual
                    </Button>
                </header>

                <div className="space-y-4">
                    {tasks.map(task => (
                        <div
                            key={task.id}
                            onClick={() => toggleTask(task.id)}
                            className={cn(
                                "group flex items-center gap-4 p-4 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 transition-all cursor-pointer",
                                task.done && "opacity-50"
                            )}
                        >
                            <div className={cn(
                                "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors",
                                task.done ? "border-neon-blue bg-neon-blue/20" : "border-muted-foreground group-hover:border-neon-cyan"
                            )}>
                                {task.done && <CheckCircle2 className="w-4 h-4 text-neon-blue" />}
                            </div>

                            <div className="flex-1">
                                <p className={cn("text-lg", task.done && "line-through text-muted-foreground")}>{task.text}</p>
                            </div>

                            <div className="flex items-center gap-2 text-muted-foreground text-sm">
                                <Clock className="w-4 h-4" />
                                <span>{task.time}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
