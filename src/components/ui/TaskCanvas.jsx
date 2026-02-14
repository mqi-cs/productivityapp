import React, { useState, useEffect } from 'react';
import { X, FileText, Layout, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import TaskCanvasBoard from './TaskCanvasBoard';
import TaskDocument from './TaskDocument';

export default function TaskCanvas({ task, onClose, onSave }) {
    const [activeView, setActiveView] = useState('canvas'); // 'canvas' | 'document'

    // Local State for Persistence
    const [canvasData, setCanvasData] = useState(task.canvasData || { nodes: [], edges: [] });
    const [documentContent, setDocumentContent] = useState(task.documentContent || '');
    const [widgets, setWidgets] = useState(task.widgets || []);

    // Debounced Save
    useEffect(() => {
        const timer = setTimeout(() => {
            onSave({
                ...task,
                canvasData,
                documentContent,
                widgets
            });
        }, 1500);
        return () => clearTimeout(timer);
    }, [canvasData, documentContent, widgets]); // We assume onSave is stable or we don't care about re-triggering

    // Handlers to update local state from children
    const handleCanvasChange = (data) => {
        setCanvasData(data);
    };

    const handleDocumentChange = ({ documentContent, widgets }) => {
        setDocumentContent(documentContent);
        setWidgets(widgets);
    };

    return (
        <div className="fixed inset-0 z-50 bg-[#0c0c0c] flex flex-col animate-in fade-in duration-200 font-sans">
            {/* Header */}
            <div className="h-14 border-b border-white/10 flex items-center justify-between px-6 bg-[#111] z-50 shadow-sm">
                <div className="flex items-center gap-4">
                    <h2 className="text-lg font-medium text-white tracking-tight">{task.title}</h2>

                    {/* View Switcher */}
                    <div className="bg-white/5 p-1 rounded-lg flex items-center gap-1 border border-white/5">
                        <button
                            onClick={() => setActiveView('canvas')}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${activeView === 'canvas' ? 'bg-neon-blue text-white shadow-lg shadow-neon-blue/20' : 'text-muted-foreground hover:text-white hover:bg-white/5'}`}
                        >
                            <Layout className="w-3.5 h-3.5" />
                            Canvas
                        </button>
                        <button
                            onClick={() => setActiveView('document')}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${activeView === 'document' ? 'bg-neon-blue text-white shadow-lg shadow-neon-blue/20' : 'text-muted-foreground hover:text-white hover:bg-white/5'}`}
                        >
                            <FileText className="w-3.5 h-3.5" />
                            Document
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="ghost" onClick={onClose} className="hover:bg-red-500/10 hover:text-red-500 transition-colors">
                        <X className="w-5 h-5" />
                    </Button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 relative overflow-hidden bg-[#0c0c0c]">
                {activeView === 'canvas' && (
                    <TaskCanvasBoard
                        task={{ ...task, canvasData }}
                        visible={true}
                        onChange={handleCanvasChange}
                    />
                )}
                {activeView === 'document' && (
                    <TaskDocument
                        task={{ ...task, documentContent, widgets }}
                        visible={true}
                        onChange={handleDocumentChange}
                    />
                )}
            </div>
        </div>
    );
}
