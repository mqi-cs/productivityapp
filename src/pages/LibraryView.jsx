import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Button } from '@/components/ui/button';
import { Plus, Tag, Trash2, FolderOpen } from 'lucide-react';
// We reused the Dialog component
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

export default function LibraryView() {
    const { projects, addProject, tasks } = useData();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [newProjectName, setNewProjectName] = useState('');
    const [newProjectColor, setNewProjectColor] = useState('#3b82f6');

    const handleCreate = () => {
        if (newProjectName.trim()) {
            addProject(newProjectName, newProjectColor);
            setIsDialogOpen(false);
            setNewProjectName('');
        }
    };

    return (
        <div className="h-full w-full bg-[#0c0c0c] text-white p-8">
            <header className="flex items-center justify-between mb-8 max-w-4xl mx-auto">
                <div>
                    <h1 className="text-3xl font-light mb-2">Project Library</h1>
                    <p className="text-muted-foreground">Manage your areas of focus and tags.</p>
                </div>
                <Button onClick={() => setIsDialogOpen(true)} className="bg-neon-blue text-white hover:bg-neon-blue/80 gap-2">
                    <Plus className="w-4 h-4" /> New Project
                </Button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
                {projects.map(project => {
                    const taskCount = tasks.filter(t => t.projectId === project.id).length;
                    return (
                        <div key={project.id} className="p-6 rounded-xl border border-white/10 bg-[#111] hover:border-white/20 transition-all group">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${project.color}20` }}>
                                    <FolderOpen className="w-5 h-5" style={{ color: project.color }} />
                                </div>
                                <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-500">
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                            <h3 className="text-lg font-medium mb-1">{project.name}</h3>
                            <p className="text-sm text-muted-foreground">{taskCount} tasks active</p>
                            <div className="mt-4 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-white/20" style={{ width: '40%', backgroundColor: project.color }} />
                            </div>
                        </div>
                    )
                })}
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[425px] bg-[#111] border-white/10 text-white">
                    <DialogHeader>
                        <DialogTitle>New Project</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm text-muted-foreground">Name</label>
                            <input
                                placeholder="e.g. Q4 Marketing"
                                className="w-full bg-white/5 border border-white/10 rounded-md p-3 focus:outline-none focus:border-neon-blue transition-colors"
                                value={newProjectName}
                                onChange={(e) => setNewProjectName(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm text-muted-foreground">Color</label>
                            <div className="flex gap-2">
                                {['#3b82f6', '#22c55e', '#ef4444', '#f59e0b', '#8b5cf6', '#ec4899'].map(c => (
                                    <button
                                        key={c}
                                        onClick={() => setNewProjectColor(c)}
                                        className={`w-8 h-8 rounded-full border-2 transition-all ${newProjectColor === c ? 'border-white scale-110' : 'border-transparent hover:scale-105'}`}
                                        style={{ backgroundColor: c }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleCreate} className="bg-neon-blue hover:bg-neon-blue/80 text-white">Create</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
