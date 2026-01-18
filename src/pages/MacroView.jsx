import React, { useRef, useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { ZoomIn, ZoomOut, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useData } from '@/context/DataContext';

// Helper: Mix RGB colors of completed projects
function mixColors(projectColors) {
    if (!projectColors || projectColors.length === 0) return 'rgba(255, 255, 255, 0.03)';

    let r = 0, g = 0, b = 0;

    projectColors.forEach(hex => {
        // Handle simple hex codes
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        if (result) {
            r += parseInt(result[1], 16);
            g += parseInt(result[2], 16);
            b += parseInt(result[3], 16);
        }
    });

    const count = projectColors.length;
    r = Math.round(r / count);
    g = Math.round(g / count);
    b = Math.round(b / count);

    return `rgb(${r}, ${g}, ${b})`;
}

export default function MacroView() {
    const { history, projects, tasks } = useData();
    const [zoom, setZoom] = useState(0);
    const [filter, setFilter] = useState('all');
    const containerRef = useRef(null);

    // Transform History Dict to Array of Days for the Heatmap
    const yearData = useMemo(() => {
        const data = [];
        const today = new Date();
        const daysBack = 52 * 7;

        for (let w = 0; w < 52; w++) {
            for (let d = 0; d < 7; d++) {
                const dayOffset = (w * 7) + d;
                const dateObj = new Date(today);
                dateObj.setDate(today.getDate() - (daysBack - dayOffset));
                const dateStr = dateObj.toISOString().split('T')[0];

                const completedTaskIds = history[dateStr] || [];

                // 1. Map Task IDs to Tasks
                const dayTasks = completedTaskIds.map(tid => tasks.find(t => t.id === tid)).filter(Boolean);

                // 2. Map Tasks to Projects (to get colors)
                const dayProjects = dayTasks.map(t => projects.find(p => p.id === t.projectId)).filter(Boolean);

                // Mixing Logic
                const colors = dayProjects.map(p => p.color);
                const mixedColor = mixColors(colors);
                const uniqueProjects = [...new Set(dayProjects)];

                data.push({
                    id: `${w}-${d}`,
                    week: w,
                    day: d,
                    dateStr,
                    projects: uniqueProjects,
                    color: mixedColor,
                    hasActivity: dayTasks.length > 0,
                    // Organic offsets for "liquid" look
                    offsetX: Math.sin(dayOffset * 0.5) * 2,
                    offsetY: Math.cos(dayOffset * 0.3) * 2
                });
            }
        }
        return data;
    }, [history, projects, tasks]);

    const handleWheel = (e) => {
        const delta = e.deltaY * 0.001;
        setZoom(prev => Math.max(0, Math.min(1, prev + delta)));
    };

    const yearScale = 1 + (zoom * 6);
    const yearOpacity = Math.max(0, 1 - (zoom * 1.5));

    return (
        <TooltipProvider>
            <div
                ref={containerRef}
                className="w-full h-full relative overflow-hidden perspective-[1000px]"
                onWheel={handleWheel}
            >
                {/* HUD Controls - Rounded Pills */}
                <div className="absolute top-6 right-6 z-50 flex flex-col gap-4">
                    <div className="glass-panel p-1 rounded-full flex flex-col gap-1 items-center">
                        <Button size="icon" variant="ghost" className="rounded-full w-8 h-8" onClick={() => setZoom(prev => Math.min(1, prev + 0.1))}><ZoomIn className="w-4 h-4" /></Button>
                        <Button size="icon" variant="ghost" className="rounded-full w-8 h-8" onClick={() => setZoom(prev => Math.max(0, prev - 0.1))}><ZoomOut className="w-4 h-4" /></Button>
                    </div>
                </div>

                {/* World Container */}
                <div className="absolute top-1/2 left-1/2 w-full h-full -translate-x-1/2 -translate-y-1/2 transform-style-3d bg-transparent">

                    {/* Year Layer */}
                    <div
                        className="absolute top-1/2 left-1/2 w-[1100px] h-[300px] -translate-x-1/2 -translate-y-1/2 grid grid-cols-[repeat(52,1fr)] grid-rows-[repeat(7,1fr)] gap-[5px] p-5 pointer-events-none transition-all duration-100 ease-linear origin-center"
                        style={{
                            transform: `translate(-50%, -50%) scale(${yearScale})`,
                            opacity: yearOpacity
                        }}
                    >
                        {yearData.map((d) => {
                            // Filter logic can be added here
                            return (
                                <Tooltip key={d.id} delayDuration={50}>
                                    <TooltipTrigger asChild>
                                        <div
                                            className="pointer-events-auto rounded-full relative transition-all duration-300 hover:scale-150 hover:z-50 hover:brightness-125 cursor-pointer"
                                            style={{
                                                transform: `translate(${d.offsetX}px, ${d.offsetY}px)`,
                                                backgroundColor: d.hasActivity ? d.color : 'rgba(255,255,255,0.03)',
                                                boxShadow: d.hasActivity ? `0 0 10px ${d.color}40` : 'none'
                                            }}
                                        />
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="bg-black/80 backdrop-blur-xl border border-white/10 text-white p-3 rounded-2xl shadow-xl">
                                        <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">{d.dateStr}</div>
                                        {d.hasActivity ? (
                                            <div className="space-y-1">
                                                {d.projects.map((p, idx) => (
                                                    <div key={idx} className="flex items-center gap-2 text-xs">
                                                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: p.color }} />
                                                        <span>{p.name}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="text-xs italic opacity-50">Empty</span>
                                        )}
                                    </TooltipContent>
                                </Tooltip>
                            )
                        })}
                    </div>
                </div>
            </div>
        </TooltipProvider>
    );
}
