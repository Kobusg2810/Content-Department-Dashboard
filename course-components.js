import { fetchCourseData } from './course-data.js';
import { createCourseCategoryChart, createClientBreakdownChart } from './course-charts.js';

let currentCourseData = [];
let currentCourseFilter = null;

/**
 * Render the Course Development Dashboard
 */
export async function renderCourseDashboard() {
    const dashboard = document.getElementById('dashboard-content');

    dashboard.innerHTML = `
        <div class="stats-grid" id="course-stats-grid">
            <!-- Stats will be injected here -->
            <div class="stat-card skeleton"></div>
            <div class="stat-card skeleton"></div>
            <div class="stat-card skeleton"></div>
        </div>

        <div class="charts-container">
            <div class="chart-card">
                <h3>Category Distribution</h3>
                <div class="chart-wrapper">
                    <canvas id="courseCategoryChart"></canvas>
                </div>
            </div>
            <div class="chart-card">
                <h3>Start Date Activity</h3>
                <div class="chart-wrapper">
                    <canvas id="courseClientChart"></canvas>
                </div>
            </div>
        </div>

        <div class="data-section">
            <div class="section-header">
                <h3>Course Development List</h3>
                <div class="search-box">
                    <input type="text" id="courseSearch" placeholder="Search courses, clients, or status...">
                    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                    </svg>
                </div>
            </div>
            <div class="table-container">
                <table class="data-table" id="courseTable">
                    <thead>
                        <tr>
                            <th>Course Name</th>
                            <th>Category</th>
                            <th>Client</th>
                            <th>Contact</th>
                            <th>Status</th>
                            <th>Started</th>
                            <th>Due Date</th>
                            <th>Completed</th>
                        </tr>
                    </thead>
                    <tbody id="courseTableBody">
                        <!-- Rows will be injected here -->
                    </tbody>
                </table>
            </div>
        </div>
    `;

    // Fetch Data
    const data = await fetchCourseData();
    currentCourseData = data.courses;

    // Render Components
    renderCourseStats(data.stats);
    renderCourseTable(data.courses);

    // Render Charts
    setTimeout(() => {
        const catCanvas = document.getElementById('courseCategoryChart');
        const clientCanvas = document.getElementById('courseClientChart');

        if (catCanvas && clientCanvas) {
            createCourseCategoryChart(data.stats, catCanvas);
            createClientBreakdownChart(data.stats, clientCanvas);
        }
    }, 100);

    // Setup Search
    document.getElementById('courseSearch').addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const filtered = currentCourseData.filter(c =>
            c.courseName.toLowerCase().includes(term) ||
            c.clientName.toLowerCase().includes(term) ||
            c.status.toLowerCase().includes(term)
        );
        renderCourseTable(filtered);
    });
}

function renderCourseStats(stats) {
    const container = document.getElementById('course-stats-grid');
    if (!container) return;

    // Calculate completion rate
    const rate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

    const cardStyle = 'cursor: pointer; transition: all 0.2s; pointer-events: auto;';

    container.innerHTML = `
        <div class="stat-card" style="${cardStyle}" data-status="reviewed">
            <div class="stat-icon" style="background: rgba(139, 92, 246, 0.1); color: #8b5cf6;">
                <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
            </div>
            <div class="stat-content">
                <h3>Reviewed</h3>
                <p class="stat-value">${stats.reviewed}</p>
                <div class="stat-trend" style="color: #c4b5fd">
                    <span>${stats.total} Total Items</span>
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
                 <div class="stat-trend">
                    <span style="color: #fbbf24">${stats.notStarted} Not Started</span>
                </div>
            </div>
        </div>

        <div class="stat-card" style="${cardStyle}" data-status="completed">
            <div class="stat-icon" style="background: rgba(16, 185, 129, 0.1); color: #34d399;">
                <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
            </div>
            <div class="stat-content">
                <h3>Completed</h3>
                <p class="stat-value">${stats.completed}</p>
                <div class="stat-trend">
                    <span style="color: #34d399">Fully Done</span>
                </div>
            </div>
        </div>
    `;

    // Event Delegation for click-to-filter
    container.addEventListener('click', (e) => {
        const card = e.target.closest('.stat-card[data-status]');
        if (card) {
            const status = card.dataset.status;
            filterCourseTableByStatus(status);
        }
    });
}

/**
 * Filter the Content Dev table by status
 * @param {string} status - Status to filter by
 */
function filterCourseTableByStatus(status) {
    currentCourseFilter = currentCourseFilter === status ? null : status; // Toggle

    // Update visual selection
    updateCourseCardSelection();

    if (!currentCourseFilter) {
        // Reset to full list
        renderCourseTable(currentCourseData);
        return;
    }

    const filtered = currentCourseData.filter(c => {
        const s = c.status.toLowerCase();
        if (status === 'completed') return s === 'completed';
        if (status === 'in progress') return s === 'in progress' || s === 'not started';
        if (status === 'reviewed') return s === 'reviewed';
        return true;
    });

    renderCourseTable(filtered);
}

/**
 * Update visual selection of Content Dev stat cards
 */
function updateCourseCardSelection() {
    const container = document.getElementById('course-stats-grid');
    if (!container) return;

    const cards = container.querySelectorAll('.stat-card');
    cards.forEach(card => {
        const statusAttr = card.dataset.status;
        const isActive = statusAttr && statusAttr === currentCourseFilter;

        if (isActive) {
            card.style.border = '2px solid var(--accent-500)';
            card.style.background = 'var(--bg-card-active)';
        } else {
            card.style.border = '1px solid var(--border-color)';
            card.style.background = 'var(--bg-card)';
        }
    });
}

function renderCourseTable(courses) {
    const tbody = document.getElementById('courseTableBody');
    if (!tbody) return;

    if (courses.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding: 2rem;">No courses found</td></tr>';
        return;
    }

    // Helper to format date
    const formatDate = (dateObj) => {
        if (!dateObj || isNaN(dateObj)) return '-';
        return dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    tbody.innerHTML = courses.map(course => `
        <tr>
            <td style="font-weight: 500; color: #f8fafc;">${course.courseName}</td>
            <td><span class="category-badge">${course.category}</span></td>
            <td>${course.clientName}</td>
            <td>${course.contactPerson}</td>
            <td>${getStatusBadge(course.status)}</td>
            <td>${formatDate(course.jsStartDate)}</td>
            <td style="${course.isOverdue ? 'color: #f87171; font-weight: bold;' : ''}">${formatDate(course.jsDueDate)}</td>
            <td>${formatDate(course.jsCompleteDate)}</td>
        </tr>
    `).join('');
}

function getStatusBadge(status) {
    let className = 'status-default';
    const s = status.toLowerCase();

    if (s === 'completed') className = 'status-resolved';
    else if (s === 'in progress') className = 'status-progress';
    else if (s === 'reviewed') className = 'status-escalated'; // Purple
    else if (s === 'not started') className = 'status-pending';
    else if (s.includes('pending')) className = 'status-pending'; // Maybe yellow?

    return `<span class="status-badge ${className}">${status}</span>`;
}
