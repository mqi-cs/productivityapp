import React, { useState } from 'react';
import { libraryData } from '@/lib/data';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { CheckSquare, Clock } from 'lucide-react';

export default function LibraryView() {
    const [selectedProject, setSelectedProject] = useState(null);

    return (
        <div className="p-10 h-full overflow-y-auto">
            <header className="mb-10">
                <h1 className="text-4xl font-light text-white mb-2">Project Library</h1>
                <p className="text-muted-foreground">Select a volume to open its journal.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {libraryData.map(book => (
                    <div
                        key={book.id}
                        onClick={() => setSelectedProject(book)}
                        className={cn(
                            "group relative aspect-[3/4] rounded-r-xl rounded-l-sm bg-card border border-white/5 cursor-pointer transition-all hover:scale-105 hover:border-neon-purple/50",
                            book.urgency === 'high' && book.importance === 'high' ? "shadow-[0_0_20px_rgba(255,0,212,0.1)]" : ""
                        )}
                    >
                        {/* Spine Effect */}
                        <div className="absolute left-0 top-0 bottom-0 w-3 bg-gradient-to-r from-white/10 to-transparent rounded-l-sm" />

                        <div className="p-6 h-full flex flex-col">
                            <span className="text-xs font-mono text-neon-cyan mb-auto block">{book.mastery}</span>

                            <h3 className="text-2xl font-serif text-white/90 break-words group-hover:text-neon-purple transition-colors">
                                {book.title}
                            </h3>

                            <div className="mt-4 h-1 w-10 bg-white/20 group-hover:bg-neon-blue transition-colors" />
                        </div>
                    </div>
                ))}
            </div>

            <Dialog open={!!selectedProject} onOpenChange={(open) => !open && setSelectedProject(null)}>
                <DialogContent className="max-w-2xl bg-card/95 backdrop-blur-xl border-white/10 text-foreground">
                    {selectedProject && (
                        <>
                            <DialogHeader>
                                <DialogTitle className="text-3xl font-light">{selectedProject.title}</DialogTitle>
                                <DialogDescription className="text-lg">{selectedProject.description}</DialogDescription>
                            </DialogHeader>

                            <div className="py-6 space-y-8">
                                {/* Intentions */}
                                <div>
                                    <h4 className="text-sm uppercase tracking-widest text-muted-foreground mb-4">Active Intentions</h4>
                                    <div className="space-y-2">
                                        {selectedProject.intentions.length > 0 ? selectedProject.intentions.map((intent, i) => (
                                            <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                                                <CheckSquare className={cn("w-5 h-5", intent.done ? "text-neon-green" : "text-muted-foreground")} />
                                                <span className={cn(intent.done && "line-through text-muted-foreground")}>{intent.text}</span>
                                            </div>
                                        )) : <p className="text-muted-foreground italic">No active intentions.</p>}
                                    </div>
                                </div>

                                {/* History / Journal */}
                                <div>
                                    <h4 className="text-sm uppercase tracking-widest text-muted-foreground mb-4">Recent Logs</h4>
                                    <div className="space-y-4">
                                        {selectedProject.journal.map((entry, i) => (
                                            <div key={i} className="border-l-2 border-neon-blue/30 pl-4 py-1">
                                                <div className="text-xs text-neon-cyan mb-1">{entry.date}</div>
                                                <p className="text-sm text-foreground/80">{entry.text}</p>
                                            </div>
                                        ))}
                                        {selectedProject.history.map((h, i) => (
                                            <div key={`h-${i}`} className="flex justify-between text-sm text-muted-foreground border-b border-white/5 py-2">
                                                <span>{h.date} Session</span>
                                                <div className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    <span>{h.duration}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
