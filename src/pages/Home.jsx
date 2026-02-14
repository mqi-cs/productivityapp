import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Book, Clock, ArrowRight, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Home() {
    const navigate = useNavigate();

    return (
        <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background">
            {/* Dynamic Background */}
            <div className="absolute inset-0">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-neon-purple/20 rounded-full blur-[128px]" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-neon-blue/20 rounded-full blur-[128px]" />
            </div>

            <div className="relative z-10 flex flex-col items-center gap-12 max-w-4xl p-6 text-center">

                <header className="space-y-4">
                    <h1 className="text-6xl font-light tracking-tighter text-white">
                        ZEN <span className="text-neon-cyan font-semibold">OBSIDIAN</span>
                    </h1>
                    <p className="text-muted-foreground text-lg tracking-widest uppercase">
                        Command Center // Global Mastery: <span className="text-white">42h</span>
                    </p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl text-left">
                    <PortalCard
                        title="Flow"
                        subtitle="Calendar & Tasks"
                        icon={Calendar}
                        className="hover:border-neon-cyan/50"
                        glowColor="rgba(168, 237, 234, 0.4)"
                        onClick={() => navigate('/dashboard')}
                    />
                    <PortalCard
                        title="Daily Log"
                        subtitle="Time Tracking"
                        icon={Clock}
                        className="hover:border-neon-purple/50"
                        glowColor="rgba(189, 0, 255, 0.4)"
                        onClick={() => navigate('/daily')}
                    />
                    <PortalCard
                        title="Projects"
                        subtitle="Library & Tags"
                        icon={Book}
                        className="hover:border-neon-pink/50"
                        glowColor="rgba(255, 0, 212, 0.4)"
                        onClick={() => navigate('/library')}
                    />
                    <PortalCard
                        title="Personal Space"
                        subtitle="To-Do, Storage, Quotes"
                        icon={Globe}
                        className="hover:border-neon-blue/50"
                        glowColor="rgba(0, 210, 255, 0.4)"
                        onClick={() => navigate('/personal')}
                    />
                </div>

            </div>
        </div>
    );
}

function PortalCard({ title, subtitle, icon: Icon, onClick, className, glowColor }) {
    return (
        <div
            onClick={onClick}
            className={cn(
                "group relative w-full h-64 p-8 glass-panel rounded-2xl cursor-pointer transition-all duration-500 hover:-translate-y-2 flex flex-col items-center justify-center gap-4 border border-white/5",
                className
            )}
            style={{
                '--glow-color': glowColor
            }}
        >
            <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-[radial-gradient(circle_at_center,_var(--glow-color),_transparent_70%)]" />

            <div className="relative z-10 p-4 rounded-full bg-white/5 group-hover:bg-white/10 transition-colors">
                <Icon className="w-8 h-8 text-white/80 group-hover:text-white" />
            </div>
            <h2 className="relative z-10 text-xl font-light text-white tracking-widest uppercase">{title}</h2>
            <p className="relative z-10 text-xs text-muted-foreground uppercase tracking-widest">{subtitle}</p>
            <div className="relative z-10 mt-auto opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                <ArrowRight className="w-5 h-5 text-white/50" />
            </div>
        </div>
    )
}
