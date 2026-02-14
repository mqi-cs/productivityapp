import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ListTodo,
    Archive,
    Quote,
    Plus,
    Trash2,
    Check,
    ExternalLink,
    Copy,
    Search,
    X,
    BookOpen,
    ChevronLeft,
    ChevronRight,
    Calendar as CalendarIcon,
    Flame,
    TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// --- Tab Components ---

function TodoTab() {
    const [todos, setTodos] = useState(() => {
        const saved = localStorage.getItem('personal-todos');
        return saved ? JSON.parse(saved) : [];
    });
    const [newItem, setNewItem] = useState('');

    useEffect(() => {
        localStorage.setItem('personal-todos', JSON.stringify(todos));
    }, [todos]);

    const addTodo = (e) => {
        e.preventDefault();
        if (!newItem.trim()) return;
        setTodos([...todos, { id: Date.now(), text: newItem, completed: false }]);
        setNewItem('');
    };

    const toggleTodo = (id) => {
        setTodos(todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
    };

    const deleteTodo = (id) => {
        setTodos(todos.filter(t => t.id !== id));
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="text-center space-y-2 mb-8">
                <h2 className="text-2xl font-light text-white">Quick Tasks</h2>
                <p className="text-sm text-muted-foreground">Capture thoughts and errands instantly.</p>
            </div>

            <form onSubmit={addTodo} className="relative group">
                <input
                    type="text"
                    placeholder="Add a new task..."
                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg py-4 px-5 pr-12 text-lg text-white placeholder:text-white/20 focus:outline-none focus:border-neon-blue transition-colors shadow-lg"
                    value={newItem}
                    onChange={(e) => setNewItem(e.target.value)}
                    autoFocus
                />
                <Button
                    type="submit"
                    size="icon"
                    variant="ghost"
                    className="absolute right-2 top-1/2 -translate-y-1/2 hover:bg-neon-blue/20 hover:text-neon-blue"
                    disabled={!newItem.trim()}
                >
                    <Plus className="w-5 h-5" />
                </Button>
            </form>

            <div className="space-y-2">
                <AnimatePresence mode="popLayout">
                    {todos.map(todo => (
                        <motion.div
                            key={todo.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            layout
                            className={cn(
                                "group flex items-center gap-3 p-4 rounded-lg border transition-all cursor-pointer",
                                todo.completed
                                    ? "bg-[#111]/50 border-white/5 opacity-60"
                                    : "bg-[#161616] border-white/10 hover:border-white/20"
                            )}
                            onClick={() => toggleTodo(todo.id)}
                        >
                            <div className={cn(
                                "w-5 h-5 rounded-full border flex items-center justify-center transition-colors",
                                todo.completed ? "bg-neon-green border-neon-green text-black" : "border-white/20 group-hover:border-neon-blue"
                            )}>
                                {todo.completed && <Check className="w-3 h-3" />}
                            </div>
                            <span className={cn(
                                "flex-1 text-base transition-all",
                                todo.completed ? "line-through text-muted-foreground" : "text-white"
                            )}>
                                {todo.text}
                            </span>
                            <Button
                                size="icon"
                                variant="ghost"
                                className="opacity-0 group-hover:opacity-100 h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-all"
                                onClick={(e) => { e.stopPropagation(); deleteTodo(todo.id); }}
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </motion.div>
                    ))}
                </AnimatePresence>
                {todos.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground/50 italic">
                        No tasks yet. Clear mind, clear space.
                    </div>
                )}
            </div>
        </div>
    );
}

function StorageTab() {
    const [items, setItems] = useState(() => {
        const saved = localStorage.getItem('personal-storage');
        return saved ? JSON.parse(saved) : [];
    });
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [search, setSearch] = useState('');

    useEffect(() => {
        localStorage.setItem('personal-storage', JSON.stringify(items));
    }, [items]);

    const addItem = () => {
        if (!title.trim() && !content.trim()) return;
        setItems([{ id: Date.now(), title, content, type: content.startsWith('http') ? 'link' : 'note', createdAt: Date.now() }, ...items]);
        setTitle('');
        setContent('');
        setIsFormOpen(false);
    };

    const deleteItem = (id) => {
        setItems(items.filter(i => i.id !== id));
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        // Could add toast here
    };

    const filteredItems = items.filter(i =>
        i.title.toLowerCase().includes(search.toLowerCase()) ||
        i.content.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="max-w-4xl mx-auto h-full flex flex-col">
            <div className="text-center space-y-2 mb-8">
                <h2 className="text-2xl font-light text-white">Digital Storage</h2>
                <p className="text-sm text-muted-foreground">Keep useful links, snippets, and knowledge handy.</p>
            </div>

            <div className="flex gap-4 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg py-2 pl-9 pr-4 text-sm text-white focus:outline-none focus:border-neon-blue"
                        placeholder="Search storage..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <Button onClick={() => setIsFormOpen(!isFormOpen)} className={cn("gap-2", isFormOpen ? "bg-white/10" : "bg-neon-blue text-white hover:bg-neon-blue/80")}>
                    {isFormOpen ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    {isFormOpen ? 'Cancel' : 'Add Item'}
                </Button>
            </div>

            <AnimatePresence>
                {isFormOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden mb-6"
                    >
                        <div className="bg-[#1a1a1a] border border-white/10 rounded-lg p-4 space-y-4">
                            <input
                                className="w-full bg-transparent border-b border-white/10 py-2 text-lg font-medium text-white placeholder:text-muted-foreground focus:outline-none focus:border-neon-blue"
                                placeholder="Title / Label"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                autoFocus
                            />
                            <textarea
                                className="w-full bg-transparent border border-white/5 rounded p-3 text-sm text-gray-300 resize-none h-24 focus:outline-none focus:border-white/20"
                                placeholder="Content or URL..."
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                            />
                            <div className="flex justify-end">
                                <Button onClick={addItem} size="sm" className="bg-white text-black hover:bg-gray-200">
                                    Save Item
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-12">
                {filteredItems.map(item => (
                    <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-[#161616] border border-white/10 rounded-lg p-4 group hover:border-neon-blue/50 transition-colors flex flex-col"
                    >
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="font-medium text-white truncate pr-2" title={item.title}>{item.title || 'Untitled'}</h3>
                            <button onClick={() => deleteItem(item.id)} className="text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        </div>
                        <div className="flex-1 text-sm text-gray-400 break-words line-clamp-4 mb-4 font-mono bg-black/20 p-2 rounded">
                            {item.content}
                        </div>
                        <div className="flex justify-end gap-2 mt-auto">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-xs"
                                onClick={() => copyToClipboard(item.content)}
                            >
                                <Copy className="w-3 h-3 mr-1" /> Copy
                            </Button>
                            {item.type === 'link' && (
                                <a
                                    href={item.content}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center justify-center h-7 px-2 text-xs font-medium rounded-md bg-white/5 hover:bg-white/10 text-neon-blue transition-colors"
                                >
                                    <ExternalLink className="w-3 h-3 mr-1" /> Open
                                </a>
                            )}
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}

function MotivationTab() {
    const [quotes, setQuotes] = useState(() => {
        const saved = localStorage.getItem('personal-quotes');
        return saved ? JSON.parse(saved) : [
            { id: 1, text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
            { id: 2, text: "It always seems impossible until it's done.", author: "Nelson Mandela" }
        ];
    });
    const [newQuote, setNewQuote] = useState('');
    const [newAuthor, setNewAuthor] = useState('');
    const [isAdding, setIsAdding] = useState(false);

    useEffect(() => {
        localStorage.setItem('personal-quotes', JSON.stringify(quotes));
    }, [quotes]);

    const addQuote = () => {
        if (!newQuote.trim()) return;
        setQuotes([{ id: Date.now(), text: newQuote, author: newAuthor || 'Unknown' }, ...quotes]);
        setNewQuote('');
        setNewAuthor('');
        setIsAdding(false);
    };

    const deleteQuote = (id) => {
        setQuotes(quotes.filter(q => q.id !== id));
    };

    return (
        <div className="max-w-3xl mx-auto space-y-8">
            <div className="text-center space-y-2 mb-8">
                <h2 className="text-2xl font-light text-white">Daily Drive</h2>
                <p className="text-sm text-muted-foreground">Fuel for your ambition.</p>
            </div>

            <div className="flex justify-center mb-8">
                <Button onClick={() => setIsAdding(!isAdding)} variant="outline" className="border-white/10 hover:bg-white/5">
                    {isAdding ? 'Close' : 'Add Quote'}
                </Button>
            </div>

            <AnimatePresence>
                {isAdding && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden mb-8 bg-[#1a1a1a] border border-white/10 rounded-lg p-6 max-w-xl mx-auto"
                    >
                        <textarea
                            className="w-full bg-transparent text-xl font-serif text-white placeholder:text-white/20 resize-none h-32 focus:outline-none mb-4 text-center"
                            placeholder="Type your quote here..."
                            value={newQuote}
                            onChange={(e) => setNewQuote(e.target.value)}
                            autoFocus
                        />
                        <input
                            className="w-full bg-transparent border-t border-white/10 py-2 text-center text-sm text-muted-foreground focus:outline-none"
                            placeholder="- Author (Optional)"
                            value={newAuthor}
                            onChange={(e) => setNewAuthor(e.target.value)}
                        />
                        <div className="flex justify-center mt-4">
                            <Button onClick={addQuote} className="bg-neon-pink hover:bg-neon-pink/80 text-white">Add to Collection</Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="grid gap-6">
                {quotes.map(quote => (
                    <motion.div
                        key={quote.id}
                        layout
                        className="relative group bg-[#111] border border-white/5 rounded-xl p-8 hover:border-white/10 transition-colors"
                    >
                        <Quote className="absolute top-6 left-6 w-8 h-8 text-white/5 -z-0" />
                        <button
                            onClick={() => deleteQuote(quote.id)}
                            className="absolute top-4 right-4 text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <X className="w-4 h-4" />
                        </button>
                        <blockquote className="relative z-10 text-center">
                            <p className="text-xl md:text-2xl font-serif text-gray-200 leading-relaxed mb-4">
                                "{quote.text}"
                            </p>
                            <footer className="text-sm text-neon-pink/80 font-medium tracking-wide">
                                — {quote.author}
                            </footer>
                        </blockquote>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}

function JournalTab() {
    const [entries, setEntries] = useState(() => {
        const saved = localStorage.getItem('personal-journal');
        return saved ? JSON.parse(saved) : {};
    });

    // Default to today, normalized to midnight for easier keying
    const [currentDate, setCurrentDate] = useState(() => {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        return d;
    });

    const dateKey = currentDate.toISOString().split('T')[0];
    const [content, setContent] = useState(entries[dateKey] || '');
    const [isSaving, setIsSaving] = useState(false);

    // Sync content when date changes
    useEffect(() => {
        setContent(entries[dateKey] || '');
    }, [dateKey, entries]);

    const handleSave = () => {
        setIsSaving(true);
        const newEntries = { ...entries, [dateKey]: content };
        setEntries(newEntries);
        localStorage.setItem('personal-journal', JSON.stringify(newEntries));

        // Fake delay for UX
        setTimeout(() => setIsSaving(false), 500);
    };

    const changeDate = (days) => {
        const d = new Date(currentDate);
        d.setDate(d.getDate() + days);
        setCurrentDate(d);
    };

    return (
        <div className="max-w-3xl mx-auto h-full flex flex-col">
            <div className="text-center space-y-2 mb-8">
                <h2 className="text-2xl font-light text-white">Daily Log</h2>
                <p className="text-sm text-muted-foreground">Reflect on your day. Record your journey.</p>
            </div>

            {/* Date Navigation */}
            <div className="flex items-center justify-between mb-6 bg-[#1a1a1a] p-2 rounded-lg border border-white/5">
                <Button variant="ghost" size="icon" onClick={() => changeDate(-1)}>
                    <ChevronLeft className="w-5 h-5 text-muted-foreground" />
                </Button>

                <div className="flex items-center gap-2 text-white font-medium">
                    <CalendarIcon className="w-4 h-4 text-neon-purple" />
                    {currentDate.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>

                <Button variant="ghost" size="icon" onClick={() => changeDate(1)} disabled={currentDate >= new Date().setHours(0, 0, 0, 0)}>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </Button>
            </div>

            <div className="flex-1 relative">
                <textarea
                    className="w-full h-full bg-[#111] border border-white/10 rounded-lg p-6 text-lg leading-relaxed text-gray-300 resize-none focus:outline-none focus:border-white/20 custom-scrollbar"
                    placeholder="How was your day? What did you accomplish? How did you feel?"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    spellCheck={false}
                />

                <div className="absolute bottom-4 right-4 flex items-center gap-4">
                    {content !== (entries[dateKey] || '') && (
                        <span className="text-xs text-muted-foreground italic">Unsaved changes</span>
                    )}
                    <Button
                        onClick={handleSave}
                        className={cn("min-w-[100px] transition-all", isSaving ? "bg-neon-green text-black" : "bg-white/10 hover:bg-white/20 text-white")}
                    >
                        {isSaving ? 'Saved!' : 'Save Entry'}
                    </Button>
                </div>
            </div>
        </div>
    );
}

function HabitTrackerTab() {
    const [habits, setHabits] = useState(() => {
        const saved = localStorage.getItem('personal-habits');
        return saved ? JSON.parse(saved) : [];
    });
    const [newHabit, setNewHabit] = useState('');

    useEffect(() => {
        localStorage.setItem('personal-habits', JSON.stringify(habits));
    }, [habits]);

    const addHabit = (e) => {
        e.preventDefault();
        if (!newHabit.trim()) return;
        setHabits([...habits, {
            id: Date.now(),
            name: newHabit,
            streak: 0,
            lastCompleted: null,
            history: [] // Array of date strings
        }]);
        setNewHabit('');
    };

    const toggleHabit = (id) => {
        const today = new Date().toISOString().split('T')[0];

        setHabits(habits.map(h => {
            if (h.id !== id) return h;

            const isDoneToday = h.lastCompleted === today;

            if (isDoneToday) {
                // Undo completion
                return {
                    ...h,
                    streak: Math.max(0, h.streak - 1),
                    lastCompleted: h.history[h.history.length - 2] || null, // Revert to previous date
                    history: h.history.slice(0, -1)
                };
            } else {
                // Complete habit
                // Check if streak continues (was completed yesterday?)
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                const yesterdayStr = yesterday.toISOString().split('T')[0];

                const isStreakContinues = h.lastCompleted === yesterdayStr;
                // If never completed before, streak starts at 1. If completed yesterday, +1. If missed days, reset to 1.
                const newStreak = (isStreakContinues || h.lastCompleted === null && h.streak === 0) ? h.streak + 1 : 1;

                return {
                    ...h,
                    streak: newStreak,
                    lastCompleted: today,
                    history: [...h.history, today]
                };
            }
        }));
    };

    const deleteHabit = (id) => {
        setHabits(habits.filter(h => h.id !== id));
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="text-center space-y-2 mb-8">
                <h2 className="text-2xl font-light text-white">Habit Tracker</h2>
                <p className="text-sm text-muted-foreground">Build consistency. Igniting streaks.</p>
            </div>

            <form onSubmit={addHabit} className="relative group mb-8">
                <input
                    type="text"
                    placeholder="New habit to track..."
                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg py-4 px-5 pr-12 text-lg text-white placeholder:text-white/20 focus:outline-none focus:border-neon-orange transition-colors shadow-lg"
                    value={newHabit}
                    onChange={(e) => setNewHabit(e.target.value)}
                />
                <Button
                    type="submit"
                    size="icon"
                    variant="ghost"
                    className="absolute right-2 top-1/2 -translate-y-1/2 hover:bg-neon-orange/20 hover:text-neon-orange"
                    disabled={!newHabit.trim()}
                >
                    <Plus className="w-5 h-5" />
                </Button>
            </form>

            <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                    {habits.map(habit => {
                        const today = new Date().toISOString().split('T')[0];
                        const isDoneToday = habit.lastCompleted === today;

                        return (
                            <motion.div
                                key={habit.id}
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className={cn(
                                    "flex items-center justify-between p-4 rounded-xl border transition-all select-none group",
                                    isDoneToday
                                        ? "bg-neon-orange/10 border-neon-orange/30 shadow-[0_0_15px_-5px_var(--neon-orange)]"
                                        : "bg-[#161616] border-white/10 hover:border-white/20"
                                )}
                            >
                                <div className="flex items-center gap-4 flex-1">
                                    <button
                                        onClick={() => toggleHabit(habit.id)}
                                        className={cn(
                                            "w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-300",
                                            isDoneToday
                                                ? "bg-neon-orange border-neon-orange text-black scale-110"
                                                : "border-white/20 hover:border-neon-orange hover:text-neon-orange text-transparent"
                                        )}
                                    >
                                        <Check className="w-5 h-5 stroke-[3]" />
                                    </button>

                                    <div className="flex flex-col">
                                        <span className={cn(
                                            "text-lg font-medium transition-colors",
                                            isDoneToday ? "text-white" : "text-gray-300"
                                        )}>
                                            {habit.name}
                                        </span>
                                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                                            {habit.streak > 0 ? (
                                                <>
                                                    <Flame className={cn("w-3 h-3", isDoneToday ? "text-neon-orange fill-neon-orange" : "text-gray-500")} />
                                                    {habit.streak} day streak
                                                </>
                                            ) : "Start a streak!"}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <div className="flex gap-0.5 opacity-50">
                                        {/* Mini history visualization - Last 5 days */}
                                        {[4, 3, 2, 1, 0].map(daysAgo => {
                                            const d = new Date();
                                            d.setDate(d.getDate() - daysAgo);
                                            const ds = d.toISOString().split('T')[0];
                                            const done = habit.history.includes(ds);
                                            return (
                                                <div
                                                    key={daysAgo}
                                                    className={cn(
                                                        "w-1.5 h-6 rounded-full transition-colors",
                                                        done ? "bg-neon-orange" : "bg-white/10"
                                                    )}
                                                    title={ds}
                                                />
                                            )
                                        })}
                                    </div>
                                    <button
                                        onClick={() => deleteHabit(habit.id)}
                                        className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </motion.div>
                        )
                    })}
                </AnimatePresence>
                {habits.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground/50 border-2 border-dashed border-white/5 rounded-xl">
                        <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-20" />
                        <p>No habits tracked yet.</p>
                    </div>
                )}
            </div>
        </div>
    )
}

// --- Main View Component ---

export default function PersonalView() {
    const [activeTab, setActiveTab] = useState('todo'); // 'todo' | 'storage' | 'motivation'

    const tabs = [
        { id: 'todo', label: 'To-Do', icon: ListTodo, color: 'text-neon-blue' },
        { id: 'storage', label: 'Storage', icon: Archive, color: 'text-neon-cyan' },
        { id: 'motivation', label: 'Motivation', icon: Quote, color: 'text-neon-pink' },
        { id: 'journal', label: 'Daily Log', icon: BookOpen, color: 'text-neon-purple' },
        { id: 'habits', label: 'Habits', icon: Flame, color: 'text-neon-orange' },
    ];

    return (
        <div className="h-full flex flex-col bg-[#0c0c0c] overflow-hidden">
            {/* Header */}
            <header className="h-20 border-b border-white/5 flex items-center justify-between px-8 bg-[#0c0c0c]/90 backdrop-blur z-20">
                <h1 className="text-3xl font-light tracking-tight text-white">Personal Space</h1>

                <nav className="flex bg-[#1a1a1a] p-1 rounded-lg border border-white/5">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "flex items-center gap-2 px-6 py-2 rounded-md text-sm font-medium transition-all",
                                activeTab === tab.id
                                    ? "bg-white/10 text-white shadow-sm"
                                    : "text-muted-foreground hover:text-white hover:bg-white/5"
                            )}
                        >
                            <tab.icon className={cn("w-4 h-4", activeTab === tab.id ? tab.color : "")} />
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </header>

            {/* Content Content */}
            <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                        className="h-full"
                    >
                        {activeTab === 'todo' && <TodoTab />}
                        {activeTab === 'storage' && <StorageTab />}
                        {activeTab === 'motivation' && <MotivationTab />}
                        {activeTab === 'journal' && <JournalTab />}
                        {activeTab === 'habits' && <HabitTrackerTab />}
                    </motion.div>
                </AnimatePresence>
            </main>
        </div>
    );
}
