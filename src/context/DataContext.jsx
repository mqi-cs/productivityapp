import React, { createContext, useContext, useState, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid'; // We might need a real UUID generator, using simple random for now if lib not avail

const DataContext = createContext();

export const useData = () => useContext(DataContext);

// Initial Projects (Morgen-style)
const INITIAL_PROJECTS = [
    { id: 'p1', name: 'Work', color: '#3b82f6' },    // Blue
    { id: 'p2', name: 'Personal', color: '#22c55e' }, // Green
    { id: 'p3', name: 'Deep Work', color: '#8b5cf6' }, // Violet
    { id: 'p4', name: 'Admin', color: '#f59e0b' },    // Amber
    { id: 'p5', name: 'Urgent', color: '#ef4444' },    // Red
];

// Initial State (Clean slate for user flow preservation, minimal examples)
const INITIAL_TASKS = [
    { id: 't1', title: 'Welcome to Zen Obsidian', duration: 60, projectId: 'p1', scheduledStart: new Date().toISOString(), recurrence: null, canvasData: { nodes: [], edges: [] } },
];

// Initial History (Completed Tasks: { 'YYYY-MM-DD': ['taskId1'] })
const INITIAL_HISTORY = {};

export function DataProvider({ children }) {
    const [tasks, setTasks] = useState(INITIAL_TASKS);
    const [projects, setProjects] = useState(INITIAL_PROJECTS);
    const [history, setHistory] = useState(INITIAL_HISTORY);

    // -- Actions --

    const addTask = (title, projectId, duration = 60, scheduledStart = null, recurrence = null) => {
        const newTask = {
            id: Math.random().toString(36).substr(2, 9),
            title,
            duration,
            projectId: projectId || projects[0]?.id, // Default to first project
            projectId: projectId || projects[0]?.id, // Default to first project
            scheduledStart: scheduledStart ? scheduledStart.toISOString() : null,
            recurrence,
            canvasData: { nodes: [], edges: [] }
        };
        setTasks(prev => [...prev, newTask]);
    };

    const updateTask = (id, updates) => {
        setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    };

    const addProject = (name, color) => {
        const newProject = {
            id: Math.random().toString(36).substr(2, 9),
            name,
            color
        };
        setProjects(prev => [...prev, newProject]);
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

    const toggleTaskStatus = (taskId, dateStr) => {
        const dateKey = dateStr || new Date().toISOString().split('T')[0];

        setHistory(prev => {
            const dayCompletions = prev[dateKey] || [];
            const isCompleted = dayCompletions.includes(taskId);

            let newDay;
            if (isCompleted) {
                newDay = dayCompletions.filter(id => id !== taskId);
            } else {
                newDay = [...dayCompletions, taskId];
            }

            return { ...prev, [dateKey]: newDay };
        });
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
        return tasks.filter(t => {
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
    };

    return (
        <DataContext.Provider value={{
            tasks, projects, history,
            addTask, updateTask, addProject, scheduleTask, unscheduleTask, toggleTaskStatus,
            inboxTasks, overdueTasks, dueTodayTasks, getTasksByDate, isTaskCompleted
        }}>
            {children}
        </DataContext.Provider>
    );
}
