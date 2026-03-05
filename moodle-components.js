// Filtering state for Moodle dashboard
let currentMoodleFilter = null;
let currentMoodleTickets = [];

/**
 * Render Moodle statistics cards
 * @param {Object} stats - Statistics object from calculateMoodleStats
 * @param {HTMLElement} container - Container element for stats
 * @param {Array} tickets - Full tickets array for filtering
 */
export function renderMoodleStats(stats, container, tickets) {
    // Store tickets for filtering
    if (tickets) currentMoodleTickets = tickets;

    const cardStyle = 'cursor: pointer; transition: all 0.2s; pointer-events: auto;';
    container.innerHTML = `
        <div class="stat-card">
            <div class="stat-header">
                <div class="stat-icon primary">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                        <line x1="12" y1="18" x2="12" y2="12"/>
                        <line x1="9" y1="15" x2="15" y2="15"/>
                    </svg>
                </div>
            </div>
            <div class="stat-value">${stats.total}</div>
            <div class="stat-label">Total Tickets</div>
        </div>

        <div class="stat-card" style="${cardStyle}" data-status="resolved">
            <div class="stat-header">
                <div class="stat-icon success">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                        <polyline points="22 4 12 14.01 9 11.01"/>
                    </svg>
                </div>
            </div>
            <div class="stat-value">${stats.resolved}</div>
            <div class="stat-label">Resolved</div>
            <div class="stat-progress">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0}%"></div>
                </div>
                <div class="progress-label">
                    <span>Resolution Rate</span>
                    <span>${stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0}%</span>
                </div>
            </div>
        </div>

        <div class="stat-card" style="${cardStyle}" data-status="active">
            <div class="stat-header">
                <div class="stat-icon warning">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <polyline points="12 6 12 12 16 14"/>
                    </svg>
                </div>
            </div>
            <div class="stat-value">${stats.active}</div>
            <div class="stat-label">Active Tickets</div>
            <div class="stat-progress">
                <div class="progress-label">
                    <span style="font-size: 0.875rem; color: #94a3b8;">Open: ${stats.open} | In Progress: ${stats.inProgress}</span>
                </div>
            </div>
        </div>

        <div class="stat-card">
            <div class="stat-header">
                <div class="stat-icon accent">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="8" x2="12" y2="12"/>
                        <line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                </div>
            </div>
            <div class="stat-value">${stats.avgResolutionDays}</div>
            <div class="stat-label">Avg. Resolution Time (days)</div>
        </div>
    `;

    // Event Delegation for click-to-filter
    container.addEventListener('click', (e) => {
        const card = e.target.closest('.stat-card[data-status]');
        if (card) {
            const status = card.dataset.status;
            filterMoodleTableByStatus(status);
        }
    });
}

/**
 * Filter the Moodle ticket table by status
 * @param {string} status - Status to filter by ('resolved', 'active')
 */
function filterMoodleTableByStatus(status) {
    currentMoodleFilter = currentMoodleFilter === status ? null : status; // Toggle

    // Update visual selection
    updateMoodleCardSelection();

    if (!currentMoodleFilter) {
        // Reset to full list
        renderMoodleTable(currentMoodleTickets, document.getElementById('moodleTableWrapper'));
        return;
    }

    const filtered = currentMoodleTickets.filter(t => {
        const s = t.status.toLowerCase();
        if (status === 'resolved') {
            return s === 'completed' || s === 'resolved' || s.includes('complete') || s.includes('closed');
        }
        if (status === 'active') {
            // Active = everything that is NOT resolved
            return !(s === 'completed' || s === 'resolved' || s.includes('complete') || s.includes('closed'));
        }
        return true;
    });

    renderMoodleTable(filtered, document.getElementById('moodleTableWrapper'));
}

/**
 * Update visual selection of Moodle stat cards
 */
function updateMoodleCardSelection() {
    const container = document.getElementById('moodleStatsGrid');
    if (!container) return;

    const cards = container.querySelectorAll('.stat-card');
    cards.forEach(card => {
        const statusAttr = card.dataset.status;
        const isActive = statusAttr && statusAttr === currentMoodleFilter;

        if (isActive) {
            card.style.border = '2px solid var(--accent-500)';
            card.style.background = 'var(--bg-card-active)';
        } else {
            card.style.border = '1px solid var(--border-color)';
            card.style.background = 'var(--bg-card)';
        }
    });
}

/**
 * Render Moodle tickets table
 * @param {Array} tickets - Array of ticket objects
 * @param {HTMLElement} container - Container element for table
 */
export function renderMoodleTable(tickets, container) {
    let tableHTML = `
        <table class="data-table">
            <thead>
                <tr>
                    <th data-sort="ticketNo">Ticket #</th>
                    <th data-sort="date">Date</th>
                    <th data-sort="contactPerson">Contact Person</th>
                    <th data-sort="assignedTo">Assigned To</th>
                    <th data-sort="errorType">Error Type</th>
                    <th data-sort="status">Status</th>
                    <th>Ticket Detail</th>
                    <th>Date Started</th>
                    <th>Date Completed</th>
                </tr>
            </thead>
            <tbody>
    `;

    tickets.forEach(ticket => {
        const statusBadge = getStatusBadge(ticket.status);

        tableHTML += `
            <tr>
                <td><strong>${ticket.ticketNo}</strong></td>
                <td>${formatDate(ticket.date)}</td>
                <td>${ticket.contactPerson}</td>
                <td>${ticket.assignedTo}</td>
                <td>${getErrorTypeBadge(ticket.errorType)}</td>
                <td>${statusBadge}</td>
                <td><span class="description-text" title="${ticket.ticketDetail}">${ticket.ticketDetail}</span></td>
                <td>${formatDate(ticket.dateStarted)}</td>
                <td>${formatDate(ticket.dateCompleted)}</td>
            </tr>
        `;
    });

    tableHTML += `
            </tbody>
        </table>
    `;

    container.innerHTML = tableHTML;

    // Add sort functionality
    addMoodleSortListeners(container, tickets);
}

/**
 * Get color-coded badge for error type
 * @param {string} type - Error type
 * @returns {string} HTML for error badge
 */
function getErrorTypeBadge(type) {
    if (!type) return '<span class="error-badge" style="background-color: rgba(148, 163, 184, 0.1); color: #cbd5e1;">Uncategorized</span>';

    // Define colors matching the chart
    const colors = {
        'Moodle Error': { bg: 'rgba(239, 68, 68, 0.15)', text: '#fca5a5' },      // Red
        'User Access': { bg: 'rgba(245, 158, 11, 0.15)', text: '#fcd34d' },       // Orange
        'Course Content': { bg: 'rgba(59, 130, 246, 0.15)', text: '#93c5fd' },    // Blue
        'Enrolment': { bg: 'rgba(16, 185, 129, 0.15)', text: '#6ee7b7' },         // Green
        'Assessment': { bg: 'rgba(139, 92, 246, 0.15)', text: '#c4b5fd' },        // Purple
        'Report': { bg: 'rgba(236, 72, 153, 0.15)', text: '#f9a8d4' },            // Pink
        'Other': { bg: 'rgba(148, 163, 184, 0.15)', text: '#cbd5e1' }             // Grey
    };

    // Default hash-based color for unknown types to ensure consistency
    const defaultColors = [
        { bg: 'rgba(6, 182, 212, 0.15)', text: '#67e8f9' }, // Cyan
        { bg: 'rgba(168, 85, 247, 0.15)', text: '#d8b4fe' }, // Violet
        { bg: 'rgba(234, 179, 8, 0.15)', text: '#fde047' }   // Yellow
    ];

    let style = colors[type];

    if (!style) {
        // Simple hash to pick a consistent random color
        let hash = 0;
        for (let i = 0; i < type.length; i++) {
            hash = type.charCodeAt(i) + ((hash << 5) - hash);
        }
        const index = Math.abs(hash) % defaultColors.length;
        style = defaultColors[index];
    }

    return `<span class="error-badge" style="
        background-color: ${style.bg}; 
        color: ${style.text};
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 0.75rem;
        font-weight: 500;
        display: inline-block;
        white-space: nowrap;
    ">${type}</span>`;
}

/**
 * Get status badge HTML
 * @param {string} status - Status value
 * @returns {string} HTML for status badge
 */
function getStatusBadge(status) {
    const statusLower = status.toLowerCase();
    let badgeClass = 'status-open';

    if (statusLower === 'resolved' || statusLower === 'closed') {
        badgeClass = 'status-resolved';
    } else if (statusLower === 'in progress') {
        badgeClass = 'status-progress';
    } else if (statusLower.includes('escalated')) {
        badgeClass = 'status-escalated';
    }

    return `<span class="status-badge ${badgeClass}">
        <span class="status-dot"></span>${status}
    </span>`;
}

/**
 * Format date string with robust parsing
 * @param {string} dateStr - Date string
 * @returns {string} Formatted date
 */
function formatDate(dateStr) {
    if (!dateStr) return '—';

    try {
        const date = parseCustomDate(dateStr);
        if (isNaN(date.getTime())) return dateStr;

        return date.toLocaleDateString('en-ZA', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    } catch {
        return dateStr;
    }
}

/**
 * Robust date parser for various formats (YYYY-MM-DD, DD/MM/YYYY, etc.)
 * @param {string} dateStr - Date string to parse
 * @returns {Date} parsed Date object
 */
export function parseCustomDate(dateStr) {
    if (!dateStr) return new Date('Invalid');

    // 1. Prioritize DD/MM/YYYY or DD-MM-YYYY format (optionally with HH:mm time)
    // This is crucial because new Date('02/10/2026') is ambiguous (Oct 2nd vs Feb 10th)
    // We want to force DD/MM/YYYY interpretation for the user
    const parts = dateStr.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
    if (parts) {
        // parts[1] is day, parts[2] is month, parts[3] is year
        const day = parseInt(parts[1], 10);
        const month = parseInt(parts[2], 10) - 1; // Months are 0-indexed in JS
        const year = parseInt(parts[3], 10);

        // Return date if valid
        const date = new Date(year, month, day);
        if (date.getFullYear() === year && date.getMonth() === month && date.getDate() === day) {
            return date;
        }
    }

    // 2. Try standard constructor for other formats (ISO YYYY-MM-DD, "DD Mon YYYY")
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) return date;

    return new Date('Invalid');
}

/**
 * Add sort listeners to Moodle table headers
 * @param {HTMLElement} tableContainer - Table container element
 * @param {Array} tickets - Original tickets array
 */
function addMoodleSortListeners(tableContainer, tickets) {
    const headers = tableContainer.querySelectorAll('th[data-sort]');
    let currentSort = { field: null, ascending: true };

    headers.forEach(header => {
        header.addEventListener('click', () => {
            const sortField = header.dataset.sort;

            // Toggle sort direction if same field
            if (currentSort.field === sortField) {
                currentSort.ascending = !currentSort.ascending;
            } else {
                currentSort.field = sortField;
                currentSort.ascending = true;
            }

            // Sort data
            const sortedData = [...tickets].sort((a, b) => {
                let aVal = a[sortField];
                let bVal = b[sortField];

                // Handle dates using our robust parser
                if (sortField === 'date' || sortField === 'dateStarted' || sortField === 'dateCompleted') {
                    aVal = parseCustomDate(aVal).getTime() || 0;
                    bVal = parseCustomDate(bVal).getTime() || 0;
                }

                if (aVal < bVal) return currentSort.ascending ? -1 : 1;
                if (aVal > bVal) return currentSort.ascending ? 1 : -1;
                return 0;
            });

            // Re-render table with sorted data
            renderMoodleTable(sortedData, tableContainer);
        });
    });
}

/**
 * Filter Moodle tickets based on search query
 * @param {Array} tickets - Array of ticket objects
 * @param {string} query - Search query
 * @returns {Array} Filtered tickets
 */
export function filterMoodleTickets(tickets, query) {
    if (!query || query.trim() === '') {
        return tickets;
    }

    const lowerQuery = query.toLowerCase();

    return tickets.filter(ticket => {
        return (
            ticket.ticketNo.toLowerCase().includes(lowerQuery) ||
            ticket.contactPerson.toLowerCase().includes(lowerQuery) ||
            ticket.assignedTo.toLowerCase().includes(lowerQuery) ||
            ticket.errorType.toLowerCase().includes(lowerQuery) ||
            ticket.ticketDetail.toLowerCase().includes(lowerQuery) ||
            ticket.status.toLowerCase().includes(lowerQuery)
        );
    });
}
