
import { fetchLoadingData } from './loading-data.js';
import { createLoaderWorkloadChart, createLoadingProgressChart } from './loading-charts.js';

let currentLoadingData = [];

/**
 * Render the Course Loading Dashboard
 */
export async function renderLoadingDashboard() {
    const dashboard = document.getElementById('loading-dashboard-content');

    dashboard.innerHTML = `
        <div class="stats-grid" id="loading-stats-grid">
            <!-- Stats will be injected here -->
            <div class="stat-card skeleton"></div>
            <div class="stat-card skeleton"></div>
            <div class="stat-card skeleton"></div>
            <div class="stat-card skeleton"></div>
        </div>

        <div class="charts-container">
            <div class="chart-card">
                <h3>Loading Progress</h3>
                <div class="chart-wrapper">
                    <canvas id="loadingProgressChart"></canvas>
                </div>
            </div>
            <div class="chart-card">
                <h3>Loader Workload</h3>
                <div class="chart-wrapper">
                    <canvas id="loaderWorkloadChart"></canvas>
                </div>
            </div>
        </div>

        <div class="data-section">
            <div class="section-header">
                <h3>Moodle Loading Checklist</h3>
                <div class="search-box">
                    <input type="text" id="loadingSearch" placeholder="Search courses, loaders, or status...">
                    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                    </svg>
                </div>
            </div>
            <div class="table-container">
                <table class="data-table" id="loadingTable">
                    <thead>
                        <tr>
                            <th>Course Name</th>
                            <th>Loaded By</th>
                            <th>Status</th>
                            <th>Media</th>
                            <th>Structure</th>
                            <th>Exam</th>
                            <th>Units</th>
                            <th>Videos</th>
                        </tr>
                    </thead>
                    <tbody id="loadingTableBody">
                        <!-- Rows will be injected here -->
                    </tbody>
                </table>
            </div>
        </div>
    `;

    // Fetch Data
    const data = await fetchLoadingData();
    currentLoadingData = data.courses;

    // Render Components
    renderLoadingStats(data.stats);
    renderLoadingTable(data.courses);

    // Render Charts
    setTimeout(() => {
        const progressCanvas = document.getElementById('loadingProgressChart');
        const workloadCanvas = document.getElementById('loaderWorkloadChart');

        if (progressCanvas && workloadCanvas) {
            createLoadingProgressChart(data.stats, progressCanvas);
            createLoaderWorkloadChart(data.stats, workloadCanvas);
        }
    }, 100);

    // Setup Search
    document.getElementById('loadingSearch').addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const filtered = currentLoadingData.filter(c =>
            c.courseName.toLowerCase().includes(term) ||
            c.loadedBy.toLowerCase().includes(term) ||
            c.personDev3.toLowerCase().includes(term) ||
            c.status.toLowerCase().includes(term)
        );
        renderLoadingTable(filtered);
    });
}


// Filtering state
let currentStatusFilter = null;

export function filterLoadingTableByStatus(status) {
    currentStatusFilter = currentStatusFilter === status ? null : status; // Toggle filter

    // Update visual selection of cards
    updateCardSelection();

    if (!currentStatusFilter) {
        // Reset to full list
        renderLoadingTable(currentLoadingData);
        return;
    }

    const filtered = currentLoadingData.filter(c => {
        const s = c.status ? c.status.toLowerCase() : 'not started';
        return s === status.toLowerCase();
    });

    renderLoadingTable(filtered);
}

function updateCardSelection() {
    const container = document.getElementById('loading-stats-grid');
    if (!container) return;

    const cards = container.querySelectorAll('.stat-card');
    cards.forEach(card => {
        // Simple heuristic to find which card corresponds to which status based on text content
        // This relies on the card H3 text matching what we look for
        const titleEl = card.querySelector('h3');
        if (!titleEl) return;

        const title = titleEl.innerText.toLowerCase();

        let isActive = false;
        if (title.includes('fully loaded') && currentStatusFilter === 'completed') isActive = true;
        if (title.includes('in progress') && currentStatusFilter === 'in progress') isActive = true;
        if (title.includes('review pending') && currentStatusFilter === 'review pending') isActive = true;

        if (isActive) {
            card.style.border = '2px solid var(--accent-500)';
            card.style.background = 'var(--bg-card-active)'; // Assuming variable or dark highlight
        } else {
            card.style.border = '1px solid var(--border-color)';
            card.style.background = 'var(--bg-card)';
        }
    });
}

function renderLoadingStats(stats) {
    const container = document.getElementById('loading-stats-grid');
    if (!container) return;

    // Calculate completion rate
    const rate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

    // Helper for clickable style - enforcing pointer-events
    const cardStyle = 'cursor: pointer; transition: all 0.2s; pointer-events: auto;';

    container.innerHTML = `
        <div class="stat-card" style="${cardStyle}" data-status="completed">
            <div class="stat-icon" style="background: rgba(16, 185, 129, 0.1); color: #34d399;">
                <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
            </div>
            <div class="stat-content">
                <h3>Fully Loaded</h3>
                <p class="stat-value">${stats.completed}</p>
                <div class="stat-trend" style="color: #34d399">
                    <span>${rate}% Complete</span>
                </div>
            </div>
        </div>

        <div class="stat-card" style="${cardStyle}" data-status="in progress">
            <div class="stat-icon" style="background: rgba(245, 158, 11, 0.1); color: #fbbf24;">
                <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
            </div>
            <div class="stat-content">
                <h3>In Progress</h3>
                <p class="stat-value">${stats.inProgress}</p>
                <div class="stat-trend" style="color: #fbbf24">
                    <span>${stats.notStarted} Not Started</span>
                </div>
            </div>
        </div>

        <div class="stat-card" style="${cardStyle}" data-status="review pending">
            <div class="stat-icon" style="background: rgba(139, 92, 246, 0.1); color: #8b5cf6;">
                <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
            </div>
            <div class="stat-content">
                <h3>Review Pending</h3>
                <p class="stat-value">${stats.reviewPending}</p>
                 <div class="stat-trend" style="color: #c4b5fd">
                    <span>Awaiting Sign-off</span>
                </div>
            </div>
        </div>
        
        <div class="stat-card">
            <div class="stat-icon" style="background: rgba(99, 102, 241, 0.1); color: #818cf8;">
                <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                </svg>
            </div>
            <div class="stat-content">
                <h3>Target</h3>
                <p class="stat-value">${stats.total}</p>
                <div class="stat-trend">
                    <span>Total Courses</span>
                </div>
            </div>
        </div>
    `;

    // Expose function globally for onclick - REMOVED to prevent crash, using local listeners
    // window.filterLoadingTableByStatus = filterLoadingTableByStatus; 

    // Event Delegation on the container (More robust)
    console.log('🔍 Setting up event delegation on container'); // DEBUG

    container.addEventListener('click', (e) => {
        const card = e.target.closest('.stat-card[data-status]');
        if (card) {
            const status = card.dataset.status;
            console.log('🖱️ Delegated Click detected on:', status); // DEBUG
            filterLoadingTableByStatus(status);
        }
    });
}

function renderLoadingTable(courses) {
    const tbody = document.getElementById('loadingTableBody');
    if (!tbody) return;

    if (courses.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding: 2rem;">No courses found</td></tr>';
        return;
    }

    const checkIcon = `<span style="color: #10b981;">✓</span>`; // Green Check
    const crossIcon = `<span style="color: #ef4444;">✗</span>`; // Red Cross
    const pendingIcon = `<span style="color: #94a3b8;">-</span>`; // Dash

    const getIcon = (statusStr) => {
        if (!statusStr) return pendingIcon;
        const s = statusStr.toUpperCase();
        if (s === 'DONE' || s === 'TRUE' || s === 'YES') return checkIcon;
        return crossIcon;
    };

    tbody.innerHTML = courses.map(course => `
        <tr>
            <td style="font-weight: 500; color: #f8fafc;">${course.courseName}</td>
            <td>${course.loadedBy || course.personDev3 || '<span style="opacity:0.5">Unassigned</span>'}</td>
            <td>${getLoadingStatusBadge(course.status)}</td>
            <td style="text-align: center;">${getIcon(course.mediaLoaded)}</td>
            <td style="text-align: center;">${getIcon(course.structureLoaded)}</td>
            <td style="text-align: center;">${getIcon(course.examLoaded)}</td>
            <td style="text-align: center;">${course.units || '-'}</td>
            <td style="text-align: center;">${course.videos || '-'}</td>
        </tr>
    `).join('');
}

function getLoadingStatusBadge(status) {
    let className = 'status-default';
    const s = status ? status.toLowerCase() : 'not started';

    if (s === 'completed') className = 'status-resolved';
    else if (s === 'in progress') className = 'status-progress';
    else if (s === 'review pending') className = 'status-escalated';
    else if (s === 'not started') className = 'status-pending';

    return `<span class="status-badge ${className}">${status || 'Not Started'}</span>`;
}
