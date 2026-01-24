import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Button } from '@/components/ui/button';
import { Plus, Tag, Trash2, FolderOpen } from 'lucide-react';
// We reused the Dialog component
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import TaskCanvas from '@/components/ui/TaskCanvas';

export default function LibraryView() {
    const { projects, addProject, tasks, updateTask } = useData();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedProject, setSelectedProject] = useState(null); // For viewing project details
    const [viewingTask, setViewingTask] = useState(null); // For canvas view
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
                        <div
                            key={project.id}
                            onClick={() => setSelectedProject(project)}
                            className="p-6 rounded-xl border border-white/10 bg-[#111] hover:border-white/20 transition-all group cursor-pointer hover:bg-white/[0.02]"
                        >
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

            {/* Project Details Dialog */}
            <Dialog open={!!selectedProject} onOpenChange={(open) => !open && setSelectedProject(null)}>
                <DialogContent className="sm:max-w-[600px] bg-[#111] border-white/10 text-white">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full" style={{ background: selectedProject?.color }} />
                            {selectedProject?.name}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="py-4">
                        <h4 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">Active Tasks</h4>
                        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                            {selectedProject && tasks.filter(t => t.projectId === selectedProject.id).length === 0 && (
                                <p className="text-sm text-muted-foreground italic">No active tasks in this project.</p>
                            )}
                            {selectedProject && tasks.filter(t => t.projectId === selectedProject.id).map(task => (
                                <div
                                    key={task.id}
                                    className="p-3 bg-white/5 rounded-lg border border-white/5 flex items-center justify-between cursor-pointer hover:bg-white/10"
                                    onClick={() => setViewingTask(task)}
                                >
                                    <span className={task.status === 'done' ? "line-through text-muted-foreground" : ""}>{task.title}</span>
                                    {task.scheduledStart && (
                                        <span className="text-xs text-muted-foreground bg-white/5 px-2 py-1 rounded">
                                            {new Date(task.scheduledStart).toLocaleDateString()}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setSelectedProject(null)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Task Canvas Overlay */}
            {viewingTask && (
                <TaskCanvas
                    task={viewingTask}
                    onClose={() => setViewingTask(null)}
                    onSave={(updatedTask) => updateTask(updatedTask.id, updatedTask)}
                />
            )}
        </div>
    );
}
