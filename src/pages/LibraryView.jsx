import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Button } from '@/components/ui/button';
import { Plus, Tag, Trash2, FolderOpen } from 'lucide-react';
// We reused the Dialog component
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import TaskMenu from '@/components/ui/TaskMenu';
import TaskCanvas from '@/components/ui/TaskCanvas';

export default function LibraryView() {
    const { projects, addProject, deleteProject, tasks, updateTask, addTask } = useData();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedProject, setSelectedProject] = useState(null); // For viewing project details
    const [viewingTask, setViewingTask] = useState(null); // For canvas view
    const [newProjectName, setNewProjectName] = useState('');
    const [newProjectColor, setNewProjectColor] = useState('#3b82f6');
    const [quickTaskTitle, setQuickTaskTitle] = useState('');

    const handleMoveTask = async (task, direction, currentList) => {
        const index = currentList.findIndex(t => t.id === task.id);
        if (index === -1) return;

        const otherIndex = direction === 'up' ? index - 1 : index + 1;
        if (otherIndex < 0 || otherIndex >= currentList.length) return;

        const otherTask = currentList[otherIndex];

        // Swap positions
        // We use index-based priority if position is missing
        const pos1 = task.canvasData?.position ?? index * 1000;
        const pos2 = otherTask.canvasData?.position ?? otherIndex * 1000;

        // Effective Swap: We give task the otherTask's position and vice versa
        // But to avoid collisions if they were generated, let's just re-normalize the whole list or swap strictly
        // Simple swap:
        await updateTask(task.id, { canvasData: { ...task.canvasData, position: pos2 } });
        await updateTask(otherTask.id, { canvasData: { ...otherTask.canvasData, position: pos1 } });
    };


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
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-500"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (confirm(`Are you sure you want to delete "${project.name}"?`)) {
                                            deleteProject(project.id);
                                            if (selectedProject?.id === project.id) setSelectedProject(null);
                                        }
                                    }}
                                >
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
            <Dialog open={!!selectedProject} onOpenChange={(open) => {
                if (!open) {
                    setSelectedProject(null);
                    setQuickTaskTitle('');
                }
            }}>
                <DialogContent className="sm:max-w-[600px] bg-[#111] border-white/10 text-white">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full" style={{ background: selectedProject?.color }} />
                            {selectedProject?.name}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="py-4 space-y-6">
                        {/* Quick Add */}
                        <div className="flex gap-2">
                            <input
                                placeholder="Add to backlog..."
                                className="flex-1 bg-white/5 border border-white/10 rounded-md p-2 focus:outline-none focus:border-neon-blue transition-colors text-sm"
                                value={quickTaskTitle}
                                onChange={(e) => setQuickTaskTitle(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && quickTaskTitle.trim()) {
                                        addTask(quickTaskTitle, selectedProject.id, 60, null, null, 'medium', 'medium', []);
                                        setQuickTaskTitle('');
                                    }
                                }}
                            />
                            <Button size="sm" onClick={() => {
                                if (quickTaskTitle.trim()) {
                                    addTask(quickTaskTitle, selectedProject.id, 60, null, null, 'medium', 'medium', []);
                                    setQuickTaskTitle('');
                                }
                            }} className="bg-white/5 hover:bg-white/10 text-white"><Plus className="w-4 h-4" /></Button>
                        </div>

                        {/* Split Lists */}
                        {(() => {
                            if (!selectedProject) return null;
                            const projectTasks = tasks.filter(t => t.projectId === selectedProject.id);
                            const backlog = projectTasks.filter(t => !t.scheduledStart);
                            const scheduled = projectTasks.filter(t => t.scheduledStart);

                            return (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[400px]">
                                    {/* Backlog Column */}
                                    <div className="flex flex-col">
                                        <h4 className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider flex items-center justify-between">
                                            Backlog <span className="text-[10px] bg-white/10 px-1.5 rounded-full">{backlog.length}</span>
                                        </h4>
                                        <div className="flex-1 overflow-y-auto pr-2 space-y-2 bg-[#0c0c0c]/50 rounded-lg p-2 border border-white/5">
                                            {backlog.length === 0 && <p className="text-xs text-muted-foreground italic text-center py-4">Empty backlog</p>}
                                            {backlog.length === 0 && <p className="text-xs text-muted-foreground italic text-center py-4">Empty backlog</p>}
                                            {(() => {
                                                // Sort backlog by position
                                                const sortedBacklog = [...backlog].sort((a, b) => (a.canvasData?.position || 0) - (b.canvasData?.position || 0));

                                                return sortedBacklog.map(task => (
                                                    <div
                                                        key={task.id}
                                                        className={`p-2 bg-white/5 rounded border cursor-pointer hover:bg-white/10 group flex items-center justify-between gap-2 ${task.canvasData?.customStatus ? '' : 'border-white/5'}`}
                                                        style={task.canvasData?.customStatus ? { borderColor: task.canvasData.customStatus, borderLeftWidth: '3px' } : {}}
                                                        onClick={() => setViewingTask(task)}
                                                    >
                                                        <span className={`text-sm truncate flex-1 ${task.status === 'done' ? "line-through text-muted-foreground" : ""}`}>{task.title}</span>

                                                        <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
                                                            <TaskMenu
                                                                task={task}
                                                                projects={projects}
                                                                onMoveUp={() => handleMoveTask(task, 'up', sortedBacklog)}
                                                                onMoveDown={() => handleMoveTask(task, 'down', sortedBacklog)}
                                                                onMoveProject={(newProjectId) => updateTask(task.id, { projectId: newProjectId })}
                                                                onSetStatus={(status) => updateTask(task.id, { canvasData: { ...task.canvasData, customStatus: status } })}
                                                            />
                                                        </div>
                                                    </div>
                                                ))
                                            })()}
                                        </div>
                                    </div>

                                    {/* Scheduled Column */}
                                    <div className="flex flex-col">
                                        <h4 className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider flex items-center justify-between">
                                            Scheduled <span className="text-[10px] bg-white/10 px-1.5 rounded-full">{scheduled.length}</span>
                                        </h4>
                                        <div className="flex-1 overflow-y-auto pr-2 space-y-2 bg-[#0c0c0c]/50 rounded-lg p-2 border border-white/5">
                                            {scheduled.length === 0 && <p className="text-xs text-muted-foreground italic text-center py-4">No scheduled tasks</p>}
                                            {scheduled.map(task => (
                                                <div
                                                    key={task.id}
                                                    className="p-2 bg-white/5 rounded border border-white/5 cursor-pointer hover:bg-white/10 group"
                                                    onClick={() => setViewingTask(task)}
                                                >
                                                    <div className={`text-sm ${task.status === 'done' ? "line-through text-muted-foreground" : ""}`}>{task.title}</div>
                                                    <div className="mt-1 flex items-center gap-2">
                                                        <span className="text-[10px] text-neon-blue bg-neon-blue/10 px-1.5 py-0.5 rounded">
                                                            {new Date(task.scheduledStart).toLocaleDateString()}
                                                        </span>
                                                        {task.scheduledStart.includes('T') && (
                                                            <span className="text-[10px] text-muted-foreground">
                                                                {new Date(task.scheduledStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )
                        })()}
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
