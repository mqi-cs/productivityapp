export const libraryData = [
    {
        id: 'book1', title: 'Project Phoenix', mastery: '42h',
        description: 'Refactoring core legacy engine.',
        urgency: 'high', importance: 'high',
        history: [
            { date: 'Oct 23', duration: '4h 20m' },
            { date: 'Oct 21', duration: '6h 15m' },
            { date: 'Oct 18', duration: '3h 45m' }
        ],
        intentions: [
            { text: 'Complete migration of Auth', done: true },
            { text: 'Unit tests for User Service', done: false },
            { text: 'Documentation update', done: false }
        ],
        journal: [{ date: 'Today, 10:42 AM', text: 'Migrated auth service successfully. Encountered some latency issues but resolved with caching.' }]
    },
    {
        id: 'book2', title: 'Design System', mastery: '18h',
        description: 'Unified UI language and tokens.',
        urgency: 'low', importance: 'high',
        history: [{ date: 'Oct 22', duration: '3h' }],
        intentions: [
            { text: 'Finalize color palette', done: true },
            { text: 'Create button components', done: true },
            { text: 'Typography scale review', done: false }
        ],
        journal: []
    },
    {
        id: 'book3', title: 'API Gateway', mastery: '8h',
        description: 'Entry point for client requests.',
        urgency: 'high', importance: 'high',
        history: [],
        intentions: [
            { text: 'Setup rate limiting', done: false }
        ],
        journal: []
    },
    {
        id: 'book4', title: 'Mobile App', mastery: '126h',
        description: 'React Native client implementation.',
        urgency: 'high', importance: 'low',
        history: [],
        intentions: [],
        journal: []
    }
];
