import React, { useRef, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { ZoomIn, ZoomOut, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Config & Colors
const CONFIG = {
    totalWeeks: 52,
    daysPerWeek: 7,
    colors: {
        phoenix: '#ff6464', // Red
        deep: '#6464ff',    // Blue
        health: '#64ff96',  // Green
        neutral: 'rgba(255, 255, 255, 0.1)'
    }
};

// Generate Mock Data once
const generateData = () => {
    const data = [];
    for (let w = 0; w < CONFIG.totalWeeks; w++) {
        for (let d = 0; d < CONFIG.daysPerWeek; d++) {
            const rnd = Math.random();
            let type = 'neutral';
            let val = Math.random() * 5;

            if (rnd > 0.7) type = 'phoenix';
            else if (rnd > 0.5) type = 'deep';
            else if (rnd > 0.3) type = 'health';

            data.push({
                week: w,
                day: d,
                type,
                value: val,
                isImportant: val > 3.5,
                // Random position offset for organic feel
                offsetX: Math.random() * 4 - 2,
                offsetY: Math.random() * 4 - 2
            });
        }
    }
    return data;
};

const yearData = generateData();

export default function MacroView() {
    const [zoom, setZoom] = useState(0); // 0.0 to 1.0
    const [filter, setFilter] = useState('all');
    const containerRef = useRef(null);

    // Zoom Handling
    const handleWheel = (e) => {
        // Prevent default only if we want to capture all scroll logic
        // But often better to let user scroll if zoom is maxed? 
        // Here we want pure zoom experience for the map.
        const delta = e.deltaY * 0.001;
        setZoom(prev => Math.max(0, Math.min(1, prev + delta)));
    };

    // Derived Visual States
    // Year Layer: visible at 0, fades out by 1
    // Week Layer: fades in from 0.4 to 1
    const yearScale = 1 + (zoom * 6);
    const yearOpacity = Math.max(0, 1 - (zoom * 1.5));

    // Normalize zoom 0.4 -> 1.0 to a 0 -> 1 range for week layer
    const weekProgress = Math.max(0, Math.min(1, (zoom - 0.4) * 1.66));
    const weekScale = 0.2 + (weekProgress * 0.8);
    const weekOpacity = weekProgress;
    const weekPointerEvents = weekProgress > 0.8 ? 'all' : 'none';

    return (
        <div
            ref={containerRef}
            className="w-full h-full relative overflow-hidden bg-background perspective-[1000px]"
            onWheel={handleWheel}
        >
            {/* HUD Controls */}
            <div className="absolute top-6 right-6 z-50 flex flex-col gap-4">
                <div className="glass-panel p-2 rounded-lg flex flex-col gap-2">
                    <Button size="icon" variant="ghost" onClick={() => setZoom(prev => Math.min(1, prev + 0.1))}><ZoomIn className="w-4 h-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => setZoom(prev => Math.max(0, prev - 0.1))}><ZoomOut className="w-4 h-4" /></Button>
                </div>

                <div className="glass-panel p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2 text-xs uppercase tracking-widest text-muted-foreground">
                        <Filter className="w-3 h-3" /> Lens
                    </div>
                    <div className="space-y-2">
                        {['all', 'phoenix', 'deep', 'health'].map(f => (
                            <div
                                key={f}
                                onClick={() => setFilter(f)}
                                className={cn(
                                    "cursor-pointer text-sm capitalize hover:text-white transition-colors",
                                    filter === f ? "text-neon-cyan font-semibold" : "text-muted-foreground"
                                )}
                            >
                                {f}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Usage Hint */}
            <div className="absolute bottom-10 left-10 z-40 text-muted-foreground text-xs uppercase tracking-widest pointer-events-none">
                Scroll to Zoom • Pan to Navigate
            </div>

            {/* World Container */}
            <div className="absolute top-1/2 left-1/2 w-full h-full -translate-x-1/2 -translate-y-1/2 transform-style-3d transition-transform duration-100 ease-linear">

                {/* Year Layer */}
                <div
                    className="absolute top-1/2 left-1/2 w-[1400px] h-[400px] -translate-x-1/2 -translate-y-1/2 grid grid-cols-[repeat(52,1fr)] grid-rows-[repeat(7,1fr)] gap-[6px] p-5 pointer-events-none transition-all duration-100 ease-linear origin-center"
                    style={{
                        transform: `translate(-50%, -50%) scale(${yearScale})`,
                        opacity: yearOpacity
                    }}
                >
                    {yearData.map((d, i) => {
                        // Filter Logic
                        const isVisible = filter === 'all' || d.type === filter;
                        return (
                            <div
                                key={i}
                                className={cn("rounded-full relative transition-all duration-500")}
                                style={{
                                    transform: `translate(${d.offsetX}px, ${d.offsetY}px) scale(${isVisible ? 1 : 0.5})`,
                                    backgroundColor: 'rgba(255,255,255,0.05)'
                                }}
                            >
                                {/* Glow Dot */}
                                <div
                                    className="absolute inset-[2px] rounded-full blur-[4px] transition-all duration-300"
                                    style={{
                                        backgroundColor: d.type !== 'neutral' ? CONFIG.colors[d.type] : 'transparent',
                                        opacity: isVisible ? 0.6 : 0.1
                                    }}
                                />
                            </div>
                        )
                    })}
                </div>

                {/* Week Layer (Crystallized View) - Mocking a specific week coming into focus */}
                <div
                    className="absolute top-1/2 left-1/2 w-[90vw] max-w-6xl h-[70vh] -translate-x-1/2 -translate-y-1/2 transition-all duration-100 ease-linear origin-center flex gap-5"
                    style={{
                        transform: `translate(-50%, -50%) scale(${weekScale})`,
                        opacity: weekOpacity,
                        pointerEvents: weekPointerEvents
                    }}
                >
                    <div className="flex-1 grid grid-cols-7 bg-card/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 gap-px">
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => (
                            <div key={day} className="flex flex-col border-r last:border-r-0 border-white/5 p-4 relative">
                                <span className="text-center text-xs uppercase tracking-widest text-muted-foreground mb-4">{day}</span>
                                <div className="space-y-2">
                                    {/* Fake tasks for the week view */}
                                    {[1, 2, 3].map(t => (
                                        <div key={t} className="bg-white/5 p-2 rounded text-[0.65rem] text-muted-foreground border-l-2 border-neon-blue truncate">
                                            Deep Work Block
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}
