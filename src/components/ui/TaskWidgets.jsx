import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Plus, Trash2, Check, X, GripHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// --- Widget Container ---
export function WidgetContainer({ children, onDelete, title }) {
    return (
        <div className="w-full bg-[#111] border border-white/10 rounded-lg p-4 mb-4 relative group">
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-red-500" onClick={onDelete}>
                    <Trash2 className="w-3 h-3" />
                </Button>
            </div>
            <div className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">{title}</div>
            {children}
        </div>
    );
}

// --- Timer Widget ---
export function TimerWidget({ data, onChange }) {
    const [timeLeft, setTimeLeft] = useState(data.timeLeft || 300); // default 5 min
    const [isRunning, setIsRunning] = useState(data.isRunning || false);
    const [initialTime, setInitialTime] = useState(data.initialTime || 300);

    const intervalRef = useRef(null);

    useEffect(() => {
        if (isRunning && timeLeft > 0) {
            intervalRef.current = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        setIsRunning(false);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else {
            clearInterval(intervalRef.current);
        }
        return () => clearInterval(intervalRef.current);
    }, [isRunning]);

    // Persist state
    useEffect(() => {
        onChange({ ...data, timeLeft, isRunning, initialTime });
    }, [timeLeft, isRunning, initialTime]);

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const toggleTimer = () => setIsRunning(!isRunning);
    const resetTimer = () => {
        setIsRunning(false);
        setTimeLeft(initialTime);
    };

    return (
        <div className="flex flex-col items-center justify-center p-4">
            <div className="text-5xl font-mono mb-4 text-neon-blue">{formatTime(timeLeft)}</div>
            <div className="flex gap-4">
                <Button onClick={toggleTimer} variant="outline" className="border-white/10 hover:bg-white/5">
                    {isRunning ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                    {isRunning ? 'Pause' : 'Start'}
                </Button>
                <Button onClick={resetTimer} variant="ghost" className="hover:text-white">
                    <RotateCcw className="w-4 h-4" />
                </Button>
            </div>
            {/* Simple input to change duration when not running and reset */}
            {!isRunning && timeLeft === initialTime && (
                <div className="mt-4 flex gap-2 items-center">
                    <input
                        type="number"
                        className="bg-white/5 border border-white/10 rounded px-2 py-1 text-sm w-16 text-center focus:outline-none focus:border-neon-blue"
                        value={initialTime / 60}
                        onChange={(e) => {
                            const val = parseInt(e.target.value) || 1;
                            setInitialTime(val * 60);
                            setTimeLeft(val * 60);
                        }}
                    />
                    <span className="text-xs text-muted-foreground">min</span>
                </div>
            )}
        </div>
    );
}

// --- Stopwatch Widget ---
export function StopwatchWidget({ data, onChange }) {
    const [time, setTime] = useState(data.time || 0);
    const [isRunning, setIsRunning] = useState(data.isRunning || false);
    const intervalRef = useRef(null);

    useEffect(() => {
        if (isRunning) {
            intervalRef.current = setInterval(() => {
                setTime(prev => prev + 1);
            }, 1000);
        }
        return () => clearInterval(intervalRef.current);
    }, [isRunning]);

    useEffect(() => {
        onChange({ ...data, time, isRunning });
    }, [time, isRunning]);

    const formatTime = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <div className="flex flex-col items-center justify-center p-4">
            <div className="text-5xl font-mono mb-4 text-neon-pink">{formatTime(time)}</div>
            <div className="flex gap-4">
                <Button onClick={() => setIsRunning(!isRunning)} variant="outline" className="border-white/10 hover:bg-white/5">
                    {isRunning ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                    {isRunning ? 'Pause' : 'Start'}
                </Button>
                <Button onClick={() => { setIsRunning(false); setTime(0); }} variant="ghost" className="hover:text-white">
                    <RotateCcw className="w-4 h-4" />
                </Button>
            </div>
        </div>
    );
}

// --- Streak Counter Widget ---
export function StreakWidget({ data, onChange }) {
    const [count, setCount] = useState(data.count || 0);

    const updateCount = (newCount) => {
        setCount(newCount);
        onChange({ ...data, count: newCount });
    };

    return (
        <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/5">
            <div className="flex flex-col">
                <span className="text-sm font-medium text-white">Current Streak</span>
                <span className="text-xs text-muted-foreground">Keep the momentum going</span>
            </div>
            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => updateCount(Math.max(0, count - 1))}
                    className="hover:bg-white/10 text-muted-foreground"
                >
                    -
                </Button>
                <div className="text-3xl font-bold text-neon-green min-w-[3ch] text-center">
                    {count}
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => updateCount(count + 1)}
                    className="hover:bg-white/10 text-white"
                >
                    +
                </Button>
            </div>
        </div>
    );
}

// --- Table Widget ---
export function TableWidget({ data, onChange }) {
    const [rows, setRows] = useState(data.rows || [['', '']]);
    const [cols, setCols] = useState(data.cols || 2);

    useEffect(() => {
        onChange({ ...data, rows, cols });
    }, [rows, cols]);

    const updateCell = (rowIndex, colIndex, value) => {
        const newRows = [...rows];
        newRows[rowIndex][colIndex] = value;
        setRows(newRows);
    };

    const addRow = () => setRows([...rows, new Array(cols).fill('')]);

    return (
        <div className="w-full overflow-x-auto">
            <table className="w-full border-collapse">
                <tbody>
                    {rows.map((row, rIndex) => (
                        <tr key={rIndex} className="border-b border-white/10">
                            {row.map((cell, cIndex) => (
                                <td key={`${rIndex}-${cIndex}`} className="border-r border-white/10 last:border-r-0 p-0">
                                    <input
                                        className="w-full bg-transparent p-2 text-sm text-gray-300 focus:outline-none focus:bg-white/5"
                                        value={cell}
                                        onChange={(e) => updateCell(rIndex, cIndex, e.target.value)}
                                        placeholder="..."
                                    />
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
            <Button variant="ghost" size="sm" onClick={addRow} className="mt-2 w-full text-xs text-muted-foreground hover:text-white border border-dashed border-white/10">
                <Plus className="w-3 h-3 mr-1" /> Add Row
            </Button>
        </div>
    );
}

// --- Kanban Widget ---
export function KanbanWidget({ data, onChange }) {
    const [columns, setColumns] = useState(data.columns || [
        { id: 'todo', title: 'To Do', items: [] },
        { id: 'prog', title: 'In Progress', items: [] },
        { id: 'done', title: 'Done', items: [] }
    ]);

    useEffect(() => {
        onChange({ ...data, columns });
    }, [columns]);

    const addItem = (colId) => {
        const text = prompt("Item name:");
        if (!text) return;
        setColumns(cols => cols.map(c => {
            if (c.id === colId) {
                return { ...c, items: [...c.items, { id: Math.random().toString(36).substr(2, 9), text }] };
            }
            return c;
        }));
    };

    const moveItem = (itemId, fromColId, toColId) => {
        setColumns(cols => {
            const newCols = [...cols];
            const fromCol = newCols.find(c => c.id === fromColId);
            const toCol = newCols.find(c => c.id === toColId);
            const itemIndex = fromCol.items.findIndex(i => i.id === itemId);
            if (itemIndex === -1) return cols;

            const [item] = fromCol.items.splice(itemIndex, 1);
            toCol.items.push(item);
            return newCols;
        });
    };

    // Simple drag and drop simulation with move buttons for MVP
    const deleteItem = (colId, itemId) => {
        setColumns(cols => cols.map(c => {
            if (c.id === colId) {
                return { ...c, items: c.items.filter(i => i.id !== itemId) };
            }
            return c;
        }));
    };

    return (
        <div className="flex gap-4 overflow-x-auto pb-2">
            {columns.map(col => (
                <div key={col.id} className="min-w-[200px] flex-1 bg-white/5 rounded-lg p-3">
                    <div className="text-xs font-semibold text-muted-foreground mb-3 flex justify-between items-center">
                        {col.title}
                        <button onClick={() => addItem(col.id)} className="hover:text-white"><Plus className="w-3 h-3" /></button>
                    </div>
                    <div className="flex flex-col gap-2 min-h-[50px]">
                        {col.items.map(item => (
                            <div key={item.id} className="bg-[#1a1a1a] p-2 rounded border border-white/5 text-sm flex justify-between group">
                                <span>{item.text}</span>
                                <div className="hidden group-hover:flex gap-1">
                                    {col.id !== 'todo' && (
                                        <button onClick={() => moveItem(item.id, col.id, columns[columns.indexOf(col) - 1].id)} className="text-muted-foreground hover:text-white">
                                            &lt;
                                        </button>
                                    )}
                                    <button onClick={() => deleteItem(col.id, item.id)} className="text-red-500 hover:text-red-400">
                                        <X className="w-3 h-3" />
                                    </button>
                                    {col.id !== 'done' && (
                                        <button onClick={() => moveItem(item.id, col.id, columns[columns.indexOf(col) + 1].id)} className="text-muted-foreground hover:text-white">
                                            &gt;
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                        {col.items.length === 0 && <div className="text-[10px] text-white/20 text-center py-2">Empty</div>}
                    </div>
                </div>
            ))}
        </div>
    );
}
