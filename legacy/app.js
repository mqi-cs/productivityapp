// Zen Command Center Logic

document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initClock();
    initDashboardInteractions();
    initTaskLibrary();
    initLensDrawer();
    initHomeHub(); // New Home Hub Logic
    initDailyRitual(); // Daily Ritual Features
});

// --- NAVIGATION & VIEWS ---
function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const slideLabels = document.querySelectorAll('.slide-label');
    const sliderThumb = document.querySelector('.slider-thumb');

    // View Sections
    const views = {
        'daily': document.getElementById('view-daily'),
        'library': document.getElementById('view-library'),
        // 'macro': document.getElementById('view-macro') // If exists
    };

    // Mapping: Index -> Key
    const indexToKey = ['daily', 'library', 'macro'];

    // 1. Sidebar Interactions
    navItems.forEach((item, index) => {
        item.addEventListener('click', () => {
            switchView(index);
        });
    });

    // 2. Breadcrumb Interactions
    slideLabels.forEach(label => {
        label.addEventListener('click', () => {
            const index = parseInt(label.dataset.index);
            switchView(index);
        });
    });

    // Core Switch Logic
    window.switchView = (index) => {
        // Update Sidebar
        navItems.forEach(n => n.classList.remove('active'));
        if (navItems[index]) navItems[index].classList.add('active');

        // Update Slider Thumb
        // Width of track approx 320px. Thumb approx 100px.
        // Positions: 0 -> 4px, 1 -> 110px, 2 -> 216px (approx)
        // Better: calc based on percentage or fixed steps
        // Actually, let's use percentage or transform
        // thumb width is ~98px. 4px padding.
        // 0: 4px
        // 1: 110px
        // 2: 216px
        const offsets = ['4px', '110px', '216px'];
        if (sliderThumb) sliderThumb.style.transform = `translateX(${offsets[index] || '0px'})`;

        // Update Labels (Active State)
        slideLabels.forEach(l => l.classList.remove('active'));
        if (slideLabels[index]) slideLabels[index].classList.add('active');

        // Update Views
        // Hide all
        Object.values(views).forEach(v => {
            if (v) {
                v.style.display = 'none';
                v.style.opacity = '0';
                v.classList.remove('active');
            }
        });

        // Show Target
        const key = indexToKey[index];
        const targetView = views[key];
        if (targetView) {
            targetView.style.display = 'flex';
            // Slight delay for opacity to trigger transition
            setTimeout(() => {
                targetView.style.opacity = '1';
                targetView.classList.add('active');
            }, 50);
        } else if (key === 'macro') {
            // Handle Macro View (e.g., redirect or show placeholder)
            // For now, let's just log it or maybe redirect if it was a separate page
            window.location.href = 'macro-view.html';
        }
    };
}

// --- DRAWER: Lens ---
function initLensDrawer() {
    const toggleBtn = document.getElementById('lensToggleBtn');
    const drawer = document.getElementById('lensDrawer');

    if (toggleBtn && drawer) {
        toggleBtn.addEventListener('click', () => {
            drawer.classList.toggle('open');
        });
    }

    // Initialize the Priority Logic inside
    initPriorityLens();
}

// --- DASHBOARD: Clock ---
function initClock() {
    const dateEl = document.getElementById('currentDate');
    const now = new Date();
    const options = { month: 'long', day: 'numeric', weekday: 'long' };
    if (dateEl) {
        dateEl.textContent = now.toLocaleDateString('en-US', options);
    }
}

// --- DASHBOARD: Focus Module Interactions ---
function initDashboardInteractions() {
    // Min Pills (Dock)
    const pills = document.querySelectorAll('.min-pill');
    const statusEl = document.querySelector('.focus-status');

    pills.forEach(pill => {
        pill.addEventListener('click', () => {
            pills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');

            // Visual Update
            const type = pill.dataset.type;
            if (statusEl) statusEl.textContent = `${type} Focus`;
        });
    });
}

// --- TASK LIBRARY: Data & Interactions (Retained) ---
const libraryData = [
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
        journal: [{ date: 'Today, 10:42 AM', text: 'Migrated auth service successfully. Encountered some latency issues but resolved with caching.', images: 0 }]
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

function initTaskLibrary() {
    const bookshelf = document.getElementById('bookshelf');

    if (bookshelf) {
        bookshelf.innerHTML = '';
        libraryData.forEach(book => {
            const bookEl = document.createElement('div');
            bookEl.className = 'book-card';
            bookEl.dataset.id = book.id;
            bookEl.dataset.urgency = book.urgency;
            bookEl.dataset.importance = book.importance;

            bookEl.innerHTML = `
                <span class="book-mastery">${book.mastery}</span>
                <span class="book-spine-title">${book.title}</span>
            `;

            bookEl.addEventListener('click', () => openJournal(book));
            bookshelf.appendChild(bookEl);
        });
    }

    // Modal Logic
    const closeBtn = document.querySelector('.close-journal');
    if (closeBtn) closeBtn.addEventListener('click', closeJournal);

    const overlay = document.querySelector('.journal-overlay');
    if (overlay) {
        overlay.addEventListener('click', (e) => {
            if (e.target.classList.contains('journal-overlay')) closeJournal();
        });
    }
}

function initPriorityLens() {
    const viewToggle = document.getElementById('viewToggle');
    const zenFilterBtn = document.getElementById('zenFilterBtn');

    const urgencyLabel = document.querySelector('.urgency-label');
    const importanceLabel = document.querySelector('.importance-label');

    if (!viewToggle || !zenFilterBtn) return;

    // Default
    urgencyLabel.classList.add('active');
    updateVisuals('urgency', false);

    viewToggle.addEventListener('change', (e) => {
        const isImportance = e.target.checked;
        const mode = isImportance ? 'importance' : 'urgency';

        if (isImportance) {
            importanceLabel.classList.add('active');
            urgencyLabel.classList.remove('active');
        } else {
            urgencyLabel.classList.add('active');
            importanceLabel.classList.remove('active');
        }

        updateVisuals(mode, zenFilterBtn.classList.contains('active'));
    });

    zenFilterBtn.addEventListener('click', () => {
        zenFilterBtn.classList.toggle('active');
        const isImportance = viewToggle.checked;
        const mode = isImportance ? 'importance' : 'urgency';
        updateVisuals(mode, zenFilterBtn.classList.contains('active'));
    });
}

function updateVisuals(mode, zenActive) {
    const books = document.querySelectorAll('.book-card');
    books.forEach(book => {
        const urgency = book.dataset.urgency;
        const importance = book.dataset.importance;

        // Reset
        book.classList.remove('gravity-pulse', 'gravity-shift-up', 'gravity-dim');

        // Logic for Visual Gravity
        if (mode === 'urgency') {
            if (urgency === 'high') {
                book.classList.add('gravity-pulse');
            } else {
                book.classList.add('gravity-dim'); // Focus on urgent
            }
        } else if (mode === 'importance') {
            if (importance === 'high') {
                book.classList.add('gravity-shift-up');
            } else {
                // Regular state for others
            }
        }

        // Zen Filter: strictly blur everything not matching criteria? 
        // Or overlay logic. Let's make Zen Filter highlight High Importance + High Urgency only (The "Do Now" quadrant)
        if (zenActive) {
            book.classList.remove('gravity-pulse', 'gravity-shift-up'); // Override
            if (urgency === 'high' && importance === 'high') {
                book.classList.add('gravity-shift-up'); // Highlight
                book.style.filter = 'none';
                book.style.opacity = '1';
            } else {
                book.classList.add('gravity-dim');
            }
        } else {
            // Restore opacity if not dim
            if (!book.classList.contains('gravity-dim')) {
                book.style.filter = '';
                book.style.opacity = '';
            }
        }
    });
}

function openJournal(bookData) {
    const overlay = document.querySelector('.journal-overlay');

    // Meta Fields
    const title = document.getElementById('journalTitle');
    const subtitle = document.getElementById('journalSubtitle');
    const hours = document.getElementById('journalHours');

    // Sections
    const checkoutHistory = document.getElementById('checkoutHistory');
    const intentionsList = document.getElementById('intentionsList');
    const timeline = document.getElementById('journalTimeline');

    if (!overlay) return;

    // 1. Populate Meta
    title.textContent = bookData.title;
    subtitle.textContent = bookData.description;
    hours.textContent = `${bookData.mastery} Invested`;

    // 2. Populate Checkout History
    checkoutHistory.innerHTML = '';
    if (bookData.history && bookData.history.length > 0) {
        bookData.history.forEach(item => {
            const li = document.createElement('li');
            li.innerHTML = `<span>${item.date}</span> <span>${item.duration}</span>`;
            checkoutHistory.appendChild(li);
        });
    } else {
        checkoutHistory.innerHTML = '<li style="justify-content:center">No history yet.</li>';
    }

    // 3. Populate Intentions
    intentionsList.innerHTML = '';
    if (bookData.intentions && bookData.intentions.length > 0) {
        bookData.intentions.forEach(intent => {
            const div = document.createElement('div');
            div.className = `intention-item ${intent.done ? 'completed' : ''}`;
            div.innerHTML = `
                <div class="intention-checkbox">
                    ${intent.done ? '✔' : ''}
                </div>
                <span>${intent.text}</span>
            `;
            // Simple toggle logic (visual only for now)
            div.addEventListener('click', () => {
                intent.done = !intent.done;
                div.classList.toggle('completed');
                div.querySelector('.intention-checkbox').innerHTML = intent.done ? '✔' : '';
            });
            intentionsList.appendChild(div);
        });
    } else {
        intentionsList.innerHTML = '<div style="color:var(--text-muted); font-size:0.8rem;">No intentions set for this week.</div>';
    }

    // 4. Populate Journal Timeline
    timeline.innerHTML = '';
    if (bookData.journal.length === 0) {
        timeline.innerHTML = '<div style="color:var(--text-secondary); text-align:center; padding:20px;">No entries. Log your work above.</div>';
    } else {
        bookData.journal.forEach(entry => {
            const div = document.createElement('div');
            div.className = 'timeline-entry';
            div.innerHTML = `
                <div class="timeline-dot"></div>
                <div class="entry-date">${entry.date}</div>
                <div class="entry-content">${entry.text}</div>
            `;
            timeline.appendChild(div);
        });
    }

    overlay.classList.add('active');
}

function closeJournal() {
    const overlay = document.querySelector('.journal-overlay');
    if (overlay) overlay.classList.remove('active');
}

// --- HOME HUB LOGIC ---
function initHomeHub() {
    const hubContainer = document.getElementById('home-hub');
    const workspaceWrapper = document.getElementById('app-workspace');
    const portals = document.querySelectorAll('.hub-portal');
    const backToHubBtn = document.getElementById('backToHub');

    // 1. Calculate Global Mastery
    const masteryCountEl = document.getElementById('globalMasteryCount');
    if (masteryCountEl && typeof libraryData !== 'undefined') {
        let totalHours = 0;
        libraryData.forEach(book => {
            // Parse "42h", "4h 20m" etc. Simplified parsing for "Xh"
            const match = book.mastery.match(/(\d+)h/);
            if (match) {
                totalHours += parseInt(match[1]);
            }
        });
        masteryCountEl.textContent = `${totalHours}h`;
    }

    // 2. Portal Navigation
    portals.forEach(portal => {
        portal.addEventListener('click', () => {
            const target = portal.dataset.target;

            // Special case for Macro Map if it's external, otherwise treat as view
            if (target === 'macro') {
                // If we want to stay in SPA mode but go to external:
                window.location.href = 'macro-view.html';
                return;
            }

            // Transition
            if (hubContainer) hubContainer.classList.add('hidden');

            setTimeout(() => {
                if (workspaceWrapper) {
                    workspaceWrapper.style.display = 'block'; // Make sure it's in flow
                    // small delay for opacity transition to work if display:none was used
                    requestAnimationFrame(() => {
                        workspaceWrapper.classList.add('active');
                    });
                }

                // Switch internal view
                if (target === 'daily') window.switchView(0);
                if (target === 'library') window.switchView(1);

            }, 600); // Wait for hub exit anim
        });
    });

    // 3. Back to Hub
    if (backToHubBtn) {
        backToHubBtn.addEventListener('click', () => {
            if (workspaceWrapper) workspaceWrapper.classList.remove('active');

            setTimeout(() => {
                if (hubContainer) hubContainer.classList.remove('hidden');
                if (workspaceWrapper) workspaceWrapper.style.display = 'none';
            }, 500);
        });
    }
}

/* --- DAILY RITUAL INTERACTIONS --- */
function initDailyRitual() {
    // 1. Label Tray Toggle
    const trayHandle = document.getElementById('trayHandle');
    const labelTray = document.getElementById('labelTray');

    if (trayHandle && labelTray) {
        trayHandle.addEventListener('click', () => {
            labelTray.classList.toggle('expanded');
        });
    }

    // 2. Zen Mode Toggle
    const zenToggle = document.getElementById('zenModeToggle');
    if (zenToggle) {
        zenToggle.addEventListener('click', () => {
            document.body.classList.toggle('zen-active');
        });
    }

    // 3. Screen Time Mirror Animation (Simple Mock)
    const digitalFill = document.querySelector('.fill-digital');
    const manualFill = document.querySelector('.fill-manual');

    // Simulate 'loading' the live data
    if (digitalFill && manualFill) {
        digitalFill.style.height = '0%';
        manualFill.style.height = '0%';

        setTimeout(() => {
            digitalFill.style.height = '70%'; // Mock value
            manualFill.style.height = '45%';  // Mock value
        }, 300);
    }
}
