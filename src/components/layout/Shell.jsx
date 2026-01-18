import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Home, Calendar, Book, Activity, Globe } from 'lucide-react';
import { cn } from '@/lib/utils'; // Keep absolute import for now
import { Button } from '@/components/ui/button';

export default function Shell() {
    const location = useLocation();
    const isHome = location.pathname === '/';

    // If on Home, we might not show the sidebar, or show a different layout. 
    // Requirement: "Home Hub" is separate, but workspace has sidebar.
    // Actually, let's keep the shell for workspace routes (Daily, Library, Macro), 
    // and have Home be a separate layout or handled here.

    if (isHome) {
        return <Outlet />;
    }

    const navItems = [
        { path: '/dashboard', label: 'Daily Ritual', icon: Calendar },
        { path: '/library', label: 'Project Library', icon: Book },
        { path: '/macro', label: 'Macro Map', icon: Activity },
    ];

    return (
        <div className="flex h-screen w-full bg-background text-foreground overflow-hidden">
            {/* Sidebar */}
            <aside className="w-20 border-r border-border flex flex-col items-center py-6 gap-6 glass-panel z-50">
                <NavLink to="/" className="mb-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center">
                        <Globe className="w-5 h-5 text-white" />
                    </div>
                </NavLink>

                <nav className="flex flex-col gap-4">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) => cn(
                                "w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-300",
                                isActive
                                    ? "bg-accent text-white shadow-[0_0_15px_rgba(255,255,255,0.1)] scale-110"
                                    : "text-muted-foreground hover:text-white hover:bg-white/5"
                            )}
                            title={item.label}
                        >
                            <item.icon className="w-5 h-5" />
                        </NavLink>
                    ))}
                </nav>

                <div className="mt-auto">
                    {/* Logic for settings or bottom actions could go here */}
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 relative overflow-auto">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-background to-background pointer-events-none" />
                <Outlet />
            </main>
        </div>
    );
}
