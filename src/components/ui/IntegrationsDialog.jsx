import React, { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Plus, Trash2, Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useData } from '../../context/DataContext';
import { supabase } from '../../supabaseClient';

export default function IntegrationsDialog({ open, onOpenChange }) {
    const { user } = useData();
    const [sources, setSources] = useState([]);
    const [newUrl, setNewUrl] = useState('');
    const [newName, setNewName] = useState('');
    const [newColor, setNewColor] = useState('#3b82f6'); // Default blue
    const [loading, setLoading] = useState(false);
    const [adding, setAdding] = useState(false);

    const COLORS = ['#3b82f6', '#22c55e', '#ef4444', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#6366f1'];

    useEffect(() => {
        if (open && user) {
            fetchSources();
        }
    }, [open, user]);

    const fetchSources = async () => {
        setLoading(true);
        const { data } = await supabase.from('calendar_sources').select('*');
        setSources(data || []);
        setLoading(false);
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!newUrl || !newName) return;

        setAdding(true);
        const { data, error } = await supabase.from('calendar_sources').insert({
            user_id: user.id,
            name: newName,
            url: newUrl,
            color: newColor
        }).select().single();

        if (data) {
            setSources(prev => [...prev, data]);
            setNewUrl('');
            setNewName('');
            setNewColor('#3b82f6');
        }
        setAdding(false);
    };

    const handleDelete = async (id) => {
        const { error } = await supabase.from('calendar_sources').delete().eq('id', id);
        if (!error) {
            setSources(prev => prev.filter(s => s.id !== id));
        }
    };

    return (
        <Dialog.Root open={open} onOpenChange={onOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]" />
                <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-[#0c0c0c] border border-white/10 rounded-2xl shadow-2xl p-6 z-[101] outline-none">

                    <div className="flex justify-between items-center mb-6">
                        <Dialog.Title className="text-xl font-light text-white flex items-center gap-2">
                            <CalendarIcon className="w-5 h-5 text-neon-blue" />
                            Calendar Integrations
                        </Dialog.Title>
                        <Dialog.Close className="text-neutral-500 hover:text-white transition-colors">
                            <X className="w-5 h-5" />
                        </Dialog.Close>
                    </div>

                    <div className="space-y-6">
                        {/* Add New */}
                        <form onSubmit={handleAdd} className="bg-white/5 p-4 rounded-xl border border-white/5 space-y-3">
                            <h3 className="text-sm font-medium text-neutral-400">Add New Subscription (ICS/WebCal)</h3>
                            <div className="grid gap-3">
                                <input
                                    placeholder="Calendar Name (e.g. Work Outlook)"
                                    value={newName}
                                    onChange={e => setNewName(e.target.value)}
                                    className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-neon-blue/50 outline-none"
                                />

                                <div className="flex gap-2 items-center">
                                    {COLORS.map(c => (
                                        <button
                                            key={c}
                                            type="button"
                                            onClick={() => setNewColor(c)}
                                            className={`w-6 h-6 rounded-full border-2 transition-all ${newColor === c ? 'border-white scale-110' : 'border-transparent hover:scale-110'}`}
                                            style={{ backgroundColor: c }}
                                        />
                                    ))}
                                </div>

                                <div className="flex gap-2">
                                    <input
                                        placeholder="https://outlook.office365.com/.../reachcalendar.ics"
                                        value={newUrl}
                                        onChange={e => setNewUrl(e.target.value)}
                                        className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-neon-blue/50 outline-none"
                                    />
                                    <button
                                        disabled={adding || !newUrl}
                                        type="submit"
                                        className="bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                                    >
                                        {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                            <p className="text-xs text-neutral-600">
                                Paste the Secret Address from Outlook or Public URL from iCloud/Google.
                            </p>
                        </form>

                        {/* List */}
                        <div className="space-y-2">
                            <h3 className="text-sm font-medium text-neutral-400">Active Sources</h3>
                            {loading ? (
                                <div className="flex justify-center p-4"><Loader2 className="w-5 h-5 animate-spin text-neutral-600" /></div>
                            ) : sources.length === 0 ? (
                                <div className="text-center p-4 text-neutral-600 text-sm italic">No external calendars connected.</div>
                            ) : (
                                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                                    {sources.map(source => (
                                        <div key={source.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg group">
                                            <div className="flex items-center gap-3">
                                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: source.color }} />
                                                <span className="text-sm text-neutral-200">{source.name}</span>
                                            </div>
                                            <button
                                                onClick={() => handleDelete(source.id)}
                                                className="text-neutral-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all p-1"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
