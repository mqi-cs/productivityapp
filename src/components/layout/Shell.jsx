import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, BarChart3, Globe, Book } from 'lucide-react';
import { cn } from '@/lib/utils';
import AnimatedBackground from './AnimatedBackground';
import { motion, AnimatePresence } from 'framer-motion';

export default function Shell() {
    const location = useLocation();
    const isHome = location.pathname === '/';

    // Home has its own background logic/layout
    if (isHome) {
        return (
            <div className="relative w-full h-screen overflow-hidden text-foreground">
                <AnimatedBackground />
                <div className="relative z-10 w-full h-full pointer-events-none [&>*]:pointer-events-auto">
                    <Outlet />
                </div>
            </div>
        )
    }

    const navItems = [
        { path: "/dashboard", icon: LayoutDashboard, label: "Flow" },
        { path: "/library", icon: Book, label: "Projects" },
        { path: "/macro", icon: BarChart3, label: "Macro" },
    ];

    return (
        <div className="relative flex h-screen w-full text-foreground overflow-hidden bg-background/50">
            <AnimatedBackground />

            {/* Sidebar - Compact Tool Rail (Morgen Style) */}
            <aside className="relative z-50 w-16 flex flex-col items-center py-6 gap-6 bg-[#0c0c0c] border-r border-white/5 shadow-2xl">
                <NavLink to="/" className="mb-2">
                    <motion.div
                        whileHover={{ rotate: 180 }}
                        transition={{ duration: 0.5 }}
                        className="w-8 h-8 rounded-lg bg-neon-blue flex items-center justify-center shadow-[0_0_15px_rgba(100,100,255,0.4)]"
                    >
                        <Globe className="w-4 h-4 text-white" />
                    </motion.div>
                </NavLink>

                <nav className="flex flex-col gap-4 w-full px-2">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) => cn(
                                "w-full aspect-square flex items-center justify-center rounded-lg transition-all duration-200 relative group",
                                isActive
                                    ? "text-white bg-white/10"
                                    : "text-muted-foreground hover:text-white hover:bg-white/5"
                            )}
                            title={item.label}
                        >
                            {({ isActive }) => (
                                <>
                                    {isActive && (
                                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4 bg-neon-cyan rounded-r-full" />
                                    )}
                                    <item.icon className="w-5 h-5 relative z-10" />
                                </>
                            )}
                        </NavLink>
                    ))}
                </nav>
            </aside>

            {/* Main Content - Animate Presence for transitions */}
            <main className="flex-1 relative z-10 flex flex-col overflow-hidden">
                <div className="flex-1 w-full h-full relative">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={location.pathname}
                            initial={{ opacity: 0, y: 10, filter: 'blur(10px)' }}
                            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                            exit={{ opacity: 0, y: -10, filter: 'blur(5px)' }}
                            transition={{ duration: 0.4, ease: "easeOut" }}
                            className="h-full"
                        >
                            <Outlet />
                        </motion.div>
                    </AnimatePresence>
                </div>
            </main>
        </div>
    );
}
