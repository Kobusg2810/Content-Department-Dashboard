
// client-projects-components.js

import { fetchClientProjectsData } from './client-projects-data.js';
import { updateClientProjectsCharts } from './client-projects-charts.js';

export async function renderClientProjectsDashboard() {
    const dashboard = document.getElementById('client-projects-content');

    dashboard.innerHTML = `
        <div class="stats-grid" id="client-projects-stats">
            <!-- Stats inserted here -->
        </div>

        <div class="charts-section">
            <div class="chart-card">
                <div class="card-header">
                     <h3>Projects by Platform</h3>
                </div>
                <div class="chart-container">
                    <canvas id="platformChart"></canvas>
                </div>
            </div>
            <div class="chart-card">
                 <div class="card-header">
                    <h3>Projects by Owner</h3>
                </div>
                <div class="chart-container">
                    <canvas id="ownerChart"></canvas>
                </div>
            </div>
        </div>

        <div class="table-card">
            <div class="card-header">
                <h3>Project Details</h3>
                <div class="table-actions">
                    <input type="text" id="projectSearch" placeholder="Search projects..." class="search-input">
                </div>
            </div>
            <div class="table-wrapper">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Project Name</th>
                            <th>Client</th>
                            <th>Owner</th>
                            <th>Platform</th>
                            <th>Videos</th>
                            <th>Length</th>
                            <th>Finalised</th>
                            <th>Moodle</th>
                            <th>SharePoint</th>
                        </tr>
                    </thead>
                    <tbody id="projectsTableBody">
                        <tr><td colspan="9" class="loading-cell">Loading projects...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;

    // Fetch and Render Data
    const data = await fetchClientProjectsData();
    renderProjectStats(data.stats);
    renderProjectsTable(data.projects);

    // Initialize Charts
    updateClientProjectsCharts(data.stats);

    // Setup Search
    document.getElementById('projectSearch').addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const filtered = data.projects.filter(p =>
            p.name.toLowerCase().includes(term) ||
            p.client.toLowerCase().includes(term) ||
            p.owner.toLowerCase().includes(term)
        );
        renderProjectsTable(filtered);
    });
}

function renderProjectStats(stats) {
    const container = document.getElementById('client-projects-stats');
    if (!stats || !container) return;

    container.innerHTML = `
        <div class="stat-card">
            <div class="stat-icon" style="background: rgba(59, 130, 246, 0.1); color: #3b82f6;">
                <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                </svg>
            </div>
            <div class="stat-content">
                <h3>Total Projects</h3>
                <p class="stat-value">${stats.totalProjects || 0}</p>
            </div>
        </div>

        <div class="stat-card">
            <div class="stat-icon" style="background: rgba(16, 185, 129, 0.1); color: #10b981;">
                <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
            </div>
            <div class="stat-content">
                <h3>Finalised</h3>
                <p class="stat-value">${stats.finalised || 0}</p>
                <div class="stat-trend">
                   <span>${Math.round((stats.finalised / stats.totalProjects) * 100) || 0}% completion</span>
                </div>
            </div>
        </div>

        <div class="stat-card">
            <div class="stat-icon" style="background: rgba(245, 158, 11, 0.1); color: #f59e0b;">
                <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                </svg>
            </div>
            <div class="stat-content">
                <h3>Total Videos</h3>
                <p class="stat-value">${stats.totalVideos || 0}</p>
            </div>
        </div>
    `;
}

function renderProjectsTable(projects) {
    const tbody = document.getElementById('projectsTableBody');
    if (!tbody) return;

    if (projects.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" class="text-center p-4">No projects found.</td></tr>`;
        return;
    }

    tbody.innerHTML = projects.map(p => `
        <tr>
            <td class="font-medium">${p.name}</td>
            <td>${p.client}</td>
            <td>
                <span class="badge ${getOwnerBadgeClass(p.owner)}">${p.owner}</span>
            </td>
            <td>${p.platform}</td>
            <td>${p.totalVideos}</td>
            <td>${p.length || '-'}</td>
            <td class="text-center">
                ${getStatusIcon(p.finalised)}
            </td>
            <td class="text-center">
                ${getStatusIcon(p.moodle)}
            </td>
            <td class="text-center">
                ${p.sharepoint ?
            `<a href="${p.link}" target="_blank" title="Open Link" style="color: inherit; text-decoration: none;">${getStatusIcon(true)}</a>` :
            getStatusIcon(false)
        }
            </td>
        </tr>
    `).join('');
}

function getStatusIcon(isDone) {
    return isDone ?
        `<svg style="width: 16px; height: 16px;" class="text-green-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>` :
        `<svg style="width: 16px; height: 16px;" class="text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>`;
}

function getOwnerBadgeClass(owner) {
    // Simple hashing for consistent colors
    const colors = ['bg-blue-100 text-blue-800', 'bg-green-100 text-green-800', 'bg-purple-100 text-purple-800', 'bg-yellow-100 text-yellow-800'];
    const index = owner.length % colors.length;
    return colors[index];
}
