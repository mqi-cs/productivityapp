import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const DataContext = createContext();

export const useData = () => useContext(DataContext);

// Initial Defaults (Fallbacks / First-time setup)
const DEFAULT_PROJECTS = [
    { name: 'Work', color: '#3b82f6' },    // Blue
    { name: 'Personal', color: '#22c55e' }, // Green
    { name: 'Deep Work', color: '#8b5cf6' }, // Violet
    { name: 'Admin', color: '#f59e0b' },    // Amber
    { name: 'Urgent', color: '#ef4444' },    // Red
];

export function DataProvider({ children }) {
    const [user, setUser] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [projects, setProjects] = useState([]);
    const [history, setHistory] = useState({});
    const [loading, setLoading] = useState(true);
    const [externalEvents, setExternalEvents] = useState([]);

    // 1. Auth & Initial Load
    useEffect(() => {
        // Check active session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            if (session?.user) fetchData(session.user.id);
            else setTasks([]); // Clear data on logout
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            if (session?.user) fetchData(session.user.id);
            else {
                setTasks([]);
                setProjects([]);
                setHistory({});
                setExternalEvents([]);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const fetchData = async (userId) => {
        setLoading(true);
        try {
            // Projects
            let { data: projectsData, error: projectsError } = await supabase
                .from('projects')
                .select('*');

            if (projectsError) throw projectsError;

            // Seed default projects if empty
            if (!projectsData || projectsData.length === 0) {
                const { data: newProjects, error: seedError } = await supabase
                    .from('projects')
                    .insert(DEFAULT_PROJECTS.map(p => ({ ...p, user_id: userId })))
                    .select();

                if (seedError) console.error("Error seeding projects:", seedError);
                if (newProjects) projectsData = newProjects;
            }
            setProjects(projectsData || []);

            // Tasks
            const { data: tasksData, error: tasksError } = await supabase
                .from('tasks')
                .select('*');
            if (tasksError) throw tasksError;

            // Fix: ensure canvasData is an object not generic JSON string if SB returns string
            const safeTasks = tasksData?.map(t => ({
                ...t,
                // Supabase JSONB comes back as object usually, but just in case
                canvasData: typeof t.canvas_data === 'string' ? JSON.parse(t.canvas_data) : t.canvas_data || { nodes: [], edges: [] },
                scheduledStart: t.scheduled_start, // Map DB snake_case to app camelCase
                projectId: t.project_id,
                description: t.description,
                location: t.location
            })) || [];

            setTasks(safeTasks);

            // History
            const { data: historyData, error: historyError } = await supabase
                .from('task_history')
                .select('*');
            if (historyError) throw historyError;

            const historyMap = {};
            historyData?.forEach(h => {
                const date = h.completion_date; // YYYY-MM-DD
                if (!historyMap[date]) historyMap[date] = [];
                historyMap[date].push(h.task_id);
            });
            setHistory(historyMap);

            // Fetch External Calendars
            fetchExternalCalendars(userId);

        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchExternalCalendars = async (userId) => {
        // 1. Get Sources
        const { data: sources } = await supabase.from('calendar_sources').select('*').eq('enabled', true);
        if (!sources || sources.length === 0) {
            setExternalEvents([]);
            return;
        }

        // 2. Fetch & Parse Each
        const allEvents = [];

        let ICAL;
        try {
            ICAL = (await import('ical.js')).default;
        } catch (e) {
            console.error("ical.js not installed", e);
            return;
        }

        for (const source of sources) {
            try {
                // Helper to fetch with timeout (Increased to 20s)
                const fetchWithTimeout = (url, ms = 20000) => {
                    const controller = new AbortController();
                    const id = setTimeout(() => controller.abort(), ms);
                    return fetch(url, { signal: controller.signal }).then(r => {
                        clearTimeout(id);
                        return r;
                    });
                };

                let text = '';
                try {
                    // 1. Try Direct
                    // console.log(`[Calendar] Fetching ${source.url} directly...`);
                    const response = await fetchWithTimeout(source.url);
                    if (!response.ok) throw new Error("Network response was not ok");
                    text = await response.text();
                    // console.log(`[Calendar] Direct fetch success. Length: ${text.length}`);
                } catch (directError) {
                    console.warn(`[Calendar] Direct fetch failed, trying Proxy 1 (AllOrigins)...`);

                    try {
                        // 2. Try Proxy 1 (AllOrigins)
                        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(source.url)}`;
                        const response = await fetchWithTimeout(proxyUrl);
                        if (!response.ok) throw new Error("Proxy 1 response was not ok");
                        text = await response.text();
                        console.log(`[Calendar] Proxy 1 success.`);
                    } catch (proxy1Error) {
                        console.warn(`[Calendar] Proxy 1 failed, trying Proxy 2 (CorsProxy.io)...`);

                        // 3. Try Proxy 2 (CorsProxy.io)
                        // Note: This proxy is often faster/more reliable for simple gets
                        const proxyUrl2 = `https://corsproxy.io/?${encodeURIComponent(source.url)}`;
                        const response = await fetchWithTimeout(proxyUrl2);
                        if (!response.ok) throw new Error("Proxy 2 response was not ok");
                        text = await response.text();
                        console.log(`[Calendar] Proxy 2 success.`);
                    }
                }

                const jcalData = ICAL.parse(text);
                const comp = new ICAL.Component(jcalData);
                const vevents = comp.getAllSubcomponents("vevent");
                console.log(`[Calendar] Found ${vevents.length} events in ${source.name}`);

                vevents.forEach(event => {
                    const evt = new ICAL.Event(event);
                    const startDate = evt.startDate.toJSDate();
                    const endDate = evt.endDate.toJSDate();

                    if (allEvents.length < 5) console.log(`[Calendar] Sample event: ${evt.summary} at ${startDate.toISOString()}`);

                    allEvents.push({
                        id: `ext-${source.id}-${evt.uid}`,
                        title: evt.summary,
                        description: evt.description,
                        location: evt.location,
                        scheduledStart: startDate.toISOString(),
                        duration: (endDate - startDate) / (1000 * 60), // minutes
                        projectId: null, // No project
                        isExternal: true,
                        sourceName: source.name,
                        sourceColor: source.color,
                        allDay: evt.startDate.isDate,
                        status: 'todo',
                        readOnly: true
                    });
                });

            } catch (err) {
                console.error(`Failed to fetch calendar ${source.name}`, err);
            }
        }
        setExternalEvents(allEvents);
    };

    // -- Actions --

    const addTask = async (title, projectId, duration = 60, scheduledStart = null, recurrence = null, urgency = 'medium', importance = 'medium', labels = [], description = '', location = '') => {
        console.log("addTask called with:", { title, projectId, description, location });

        if (!user) {
            console.error("addTask failed: No user logged in");
            return;
        }

        const optimisticId = Math.random().toString(36).substr(2, 9);
        const newTask = {
            id: optimisticId, // Temporary ID
            title,
            description,
            location,
            duration,
            project_id: projectId || projects[0]?.id,
            scheduled_start: scheduledStart ? scheduledStart.toISOString() : null,
            recurrence,
            urgency,
            importance,
            labels,
            canvas_data: { nodes: [], edges: [] },
            user_id: user.id
        };

        // Optimistic Update (Immediate Feedback)
        const optimisticTask = {
            ...newTask,
            canvasData: newTask.canvas_data,
            scheduledStart: newTask.scheduled_start,
            projectId: newTask.project_id
        };
        setTasks(prev => [...prev, optimisticTask]);

        // Server Sync (Exclude ID, let DB generate UUID)
        const { id, ...taskForDb } = newTask;

        const { data, error } = await supabase
            .from('tasks')
            .insert(taskForDb)
            .select()
            .single();

        if (error) {
            console.error("Error adding task to DB:", error);
            // alert(`Error adding task: ${error.message}. Did you run the SQL migration?`); // Removed alert, just log
            // Rollback optimistic update
            setTasks(prev => prev.filter(t => t.id !== optimisticId));
            return;
        }

        if (data) {
            // Replace optimistic task with real one
            const realTask = {
                ...data,
                canvasData: data.canvas_data,
                scheduledStart: data.scheduled_start,
                projectId: data.project_id,
                description: data.description,
                location: data.location
            };
            setTasks(prev => prev.map(t => t.id === optimisticId ? realTask : t));
        }
    };

    const updateTask = async (id, updates) => {
        if (!user) return;

        // Optimistic Update
        setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));

        // Prepare DB updates (camelCase -> snake_case)
        const dbUpdates = {};
        if (updates.title !== undefined) dbUpdates.title = updates.title;
        if (updates.description !== undefined) dbUpdates.description = updates.description;
        if (updates.location !== undefined) dbUpdates.location = updates.location;
        if (updates.duration !== undefined) dbUpdates.duration = updates.duration;
        if (updates.projectId !== undefined) dbUpdates.project_id = updates.projectId;
        if (updates.scheduledStart !== undefined) dbUpdates.scheduled_start = updates.scheduledStart;
        if (updates.recurrence !== undefined) dbUpdates.recurrence = updates.recurrence;
        if (updates.urgency !== undefined) dbUpdates.urgency = updates.urgency;
        if (updates.importance !== undefined) dbUpdates.importance = updates.importance;
        if (updates.labels !== undefined) dbUpdates.labels = updates.labels;
        if (updates.canvasData !== undefined) dbUpdates.canvas_data = updates.canvasData;

        const { error } = await supabase
            .from('tasks')
            .update(dbUpdates)
            .eq('id', id);

        if (error) {
            console.error("Error updating task:", error);
            // Revert? For now, we assume success.
        }
    };

    const addProject = async (name, color) => {
        if (!user) return;

        const { data, error } = await supabase
            .from('projects')
            .insert({ name, color, user_id: user.id })
            .select()
            .single();

        if (error) {
            console.error("Error adding project:", error);
            return;
        }

        if (data) {
            setProjects(prev => [...prev, data]);
        }
    };

    const deleteProject = async (id) => {
        if (!user) return;

        // Optimistic
        setProjects(prev => prev.filter(p => p.id !== id));

        const { error } = await supabase
            .from('projects')
            .delete()
            .eq('id', id);

        if (error) {
            console.error("Error deleting project:", error);
            // Revert would go here (fetchData)
        }
    };

    const scheduleTask = (taskId, date, hour) => {
        const startDate = new Date(date);
        startDate.setHours(hour, 0, 0, 0);

        updateTask(taskId, {
            scheduledStart: startDate.toISOString(),
        });
    };

    const unscheduleTask = (taskId) => {
        updateTask(taskId, { scheduledStart: null, recurrence: null });
    };

    const toggleTaskStatus = async (taskId, dateStr) => {
        if (!user) return;

        // Prevent toggling external events
        if (taskId.startsWith('ext-')) return;

        const dateKey = dateStr || new Date().toISOString().split('T')[0];

        // Optimistic
        const wasCompleted = history[dateKey]?.includes(taskId);

        setHistory(prev => {
            const dayCompletions = prev[dateKey] || [];
            let newDay;
            if (wasCompleted) {
                newDay = dayCompletions.filter(id => id !== taskId);
            } else {
                newDay = [...dayCompletions, taskId];
            }
            return { ...prev, [dateKey]: newDay };
        });

        // DB Update
        if (wasCompleted) {
            // Delete
            const { error } = await supabase
                .from('task_history')
                .delete()
                .match({ task_id: taskId, completion_date: dateKey });
            if (error) console.error("Error undoing completion:", error);
        } else {
            // Insert
            const { error } = await supabase
                .from('task_history')
                .insert({ task_id: taskId, completion_date: dateKey, user_id: user.id });
            if (error) console.error("Error marking complete:", error);
        }
    };

    // -- Queries --

    const isTaskCompleted = (taskId, dateStr) => {
        // Fallback to today if no dateStr provided (for inbox items)
        const key = dateStr || new Date().toISOString().split('T')[0];
        return history[key]?.includes(taskId) || false;
    };

    // Morgen-style Sidebar Queries
    const todayStr = new Date().toISOString().split('T')[0];

    const overdueTasks = useMemo(() => tasks.filter(t => {
        if (!t.scheduledStart) return false;
        const taskDate = t.scheduledStart.split('T')[0];
        // If it's before today AND not completed in history on that date
        return taskDate < todayStr && !isTaskCompleted(t.id, taskDate);
    }), [tasks, history, todayStr]);

    const dueTodayTasks = useMemo(() => tasks.filter(t => {
        if (!t.scheduledStart) return false;
        return t.scheduledStart.startsWith(todayStr);
    }), [tasks, todayStr]);

    const inboxTasks = useMemo(() => tasks.filter(t => !t.scheduledStart && !t.recurrence), [tasks]);

    // For Calendar: Group by Date, including Recurrence Projection
    const getTasksByDate = (dateStr) => {
        // 1. App Tasks
        const internal = tasks.filter(t => {
            // 1. Exact Scheduled Date
            if (t.scheduledStart && t.scheduledStart.startsWith(dateStr)) return true;
            // 2. Daily Recurrence
            if (t.recurrence === 'daily' && t.scheduledStart) return true;
            return false;
        }).map(t => {
            const completed = isTaskCompleted(t.id, dateStr);

            // Project correct start time depending on recurrence
            let effectiveStart = t.scheduledStart;
            if (t.recurrence === 'daily' && !t.scheduledStart.startsWith(dateStr)) {
                const timePart = t.scheduledStart.split('T')[1];
                effectiveStart = `${dateStr}T${timePart}`;
            }

            return {
                ...t,
                scheduledStart: effectiveStart,
                status: completed ? 'done' : 'todo'
            };
        });

        // 2. External Events
        const external = externalEvents.filter(e => {
            return e.scheduledStart.startsWith(dateStr); // For now, basic date match.
            // Note: recurrence expansion for ical is complex. ical.js has helpers, but for now we assume expanded events or single events.
            // If the ICS has recurrences, 'ical.js' component expansion handles some, but we really need an iterator.
            // For this MVP, we just match start dates of flattened events.
        });

        return [...internal, ...external];
    };

    return (
        <DataContext.Provider value={{
            user,
            loading,
            tasks, projects, history,
            addTask, updateTask, addProject, deleteProject, scheduleTask, unscheduleTask, toggleTaskStatus,
            inboxTasks, overdueTasks, dueTodayTasks, getTasksByDate, isTaskCompleted
        }}>
            {children}
        </DataContext.Provider>
    );
}
