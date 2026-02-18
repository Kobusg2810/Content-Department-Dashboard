import { calculateCompletion, fetchModuleDetails } from './data.js';
import { getQualificationGID } from './qualification-gids.js';

// Cache for calculated completion percentages to persist across auto-refreshes
const completionCache = {};

/**
 * Render statistics cards
 * @param {Object} stats - Statistics object from calculateStats
 * @param {HTMLElement} container - Container element for stats
 */
export function renderStats(stats, container) {
    container.innerHTML = `
        <div class="stat-card">
            <div class="stat-header">
                <div class="stat-icon primary">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                    </svg>
                </div>
            </div>
            <div class="stat-value">${stats.total}</div>
            <div class="stat-label">Total Qualifications</div>
        </div>

        <div class="stat-card">
            <div class="stat-header">
                <div class="stat-icon success">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                        <polyline points="22 4 12 14.01 9 11.01"/>
                    </svg>
                </div>
            </div>
            <div class="stat-value">${stats.completed}</div>
            <div class="stat-label">Completed</div>
            <div class="stat-progress">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${stats.completionPercentage}%"></div>
                </div>
                <div class="progress-label">
                    <span>Progress</span>
                    <span>${stats.completionPercentage}%</span>
                </div>
            </div>
        </div>

        <div class="stat-card">
            <div class="stat-header">
                <div class="stat-icon warning">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <polyline points="12 6 12 12 16 14"/>
                    </svg>
                </div>
            </div>
            <div class="stat-value">${stats.inProgress}</div>
            <div class="stat-label">In Progress</div>
        </div>

        <div class="stat-card">
            <div class="stat-header">
                <div class="stat-icon accent">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                        <line x1="9" y1="9" x2="15" y2="9"/>
                        <line x1="9" y1="15" x2="15" y2="15"/>
                    </svg>
                </div>
            </div>
            <div class="stat-value">${stats.notStarted}</div>
            <div class="stat-label">Not Started</div>
        </div>
    `;
}

/**
 * Render data table
 * @param {Array} qualifications - Array of qualification objects
 * @param {HTMLElement} container - Container element for table
 */
export function renderTable(qualifications, container) {
    let tableHTML = `
        <table class="data-table">
            <thead>
                <tr>
                    <th style="width: 40px;"></th>
                    <th data-sort="qualificationName">Qualification Name</th>
                    <th data-sort="qualificationID">ID</th>
                    <th data-sort="modules">Modules</th>
                    <th>IAC</th>
                    <th>AAC</th>
                    <th>Moodle</th>
                    <th>LG Checked</th>
                    <th>Activities</th>
                    <th>Reviewed</th>
                    <th>Matrix</th>
                    <th data-sort="completion">Progress</th>
                </tr>
            </thead>
            <tbody>
    `;

    qualifications.forEach((qual, index) => {
        // Use cached completion if available (more accurate), otherwise use summary data
        let completion = calculateCompletion(qual);
        if (completionCache[qual.qualificationName] !== undefined) {
            completion = completionCache[qual.qualificationName];
        }

        const gid = getQualificationGID(qual.qualificationName);
        const hasGID = !!gid;
        const expandIcon = hasGID ? '►' : '';

        tableHTML += `
            <tr class="qual-row ${hasGID ? 'expandable' : ''}" data-qual-index="${index}">
                <td class="expand-cell">${expandIcon}</td>
                <td><strong>${qual.qualificationName}</strong></td>
                <td>${qual.qualificationID}</td>
                <td>${qual.modules}</td>
                <td>${renderStatusBadge(qual.iacAligned)}</td>
                <td>${renderStatusBadge(qual.aacAligned)}</td>
                <td>${renderStatusBadge(qual.loadedOnMoodle)}</td>
                <td>${renderStatusBadge(qual.learnerGuideChecked)}</td>
                <td>${renderStatusBadge(qual.courseActivitiesCreated)}</td>
                <td>${renderStatusBadge(qual.contentReviewed)}</td>
                <td>${renderStatusBadge(qual.alignmentMatrixCorrected)}</td>
                <td>
                    <div class="progress-cell">
                        <div class="progress-mini">
                            <div class="progress-mini-fill" style="width: ${completion}%"></div>
                        </div>
                        <span class="progress-text">${completion}%</span>
                    </div>
                </td>
            </tr>
        `;

        // Add placeholder for module details (will be loaded on demand)
        if (hasGID) {
            tableHTML += `
                <tr class="module-details-row" data-qual-index="${index}" style="display: none;">
                    <td colspan="12">
                        <div class="module-details-container">
                            <h4>Loading module details...</h4>
                        </div>
                    </td>
                </tr>
            `;
        }
    });

    tableHTML += `
            </tbody>
        </table>
    `;

    container.innerHTML = tableHTML;

    // Add expand/collapse functionality
    addExpandListeners(container, qualifications);

    // Add sort functionality
    addSortListeners(container, qualifications);
}

/**
 * Add expand/collapse listeners to qualification rows with on-demand module loading
 * @param {HTMLElement} tableContainer - Table container element
 * @param {Array} qualifications - Original qualifications array
 */
function addExpandListeners(tableContainer, qualifications) {
    const expandableRows = tableContainer.querySelectorAll('.qual-row.expandable');

    expandableRows.forEach(row => {
        row.addEventListener('click', async (e) => {
            // Don't expand if clicking on a link or button
            if (e.target.tagName === 'A' || e.target.tagName === 'BUTTON') return;

            const qualIndex = row.dataset.qualIndex;
            const qualName = qualifications[qualIndex].qualificationName;
            const gid = getQualificationGID(qualName);
            const detailRow = tableContainer.querySelector(`.module-details-row[data-qual-index="${qualIndex}"]`);
            const expandCell = row.querySelector('.expand-cell');

            if (!detailRow) return;

            const isExpanded = detailRow.style.display !== 'none';

            if (isExpanded) {
                // Collapse
                detailRow.style.display = 'none';
                expandCell.textContent = '►';
                row.classList.remove('expanded');
            } else {
                // Expand
                detailRow.style.display = 'table-row';
                expandCell.textContent = '▼';
                row.classList.add('expanded');

                // Check if modules have been loaded (if content still shows "Loading")
                const container = detailRow.querySelector('.module-details-container');
                if (container.textContent.includes('Loading') && gid) {
                    // Show loading state
                    container.innerHTML = '<h4>📥 Loading module details...</h4>';

                    // Fetch module details
                    console.log(`📥 Fetching modules for ${qualName} (GID: ${gid})`);
                    const modules = await fetchModuleDetails(qualName, gid);

                    // Render module details
                    if (modules.length > 0) {
                        container.innerHTML = renderModuleDetailsHTML(qualName, modules);

                        // Recalculate completion percentage based on actual module data
                        // This fixes discrepancy where summary sheet might say 100% but modules are incomplete
                        const newCompletion = calculateModuleCompletion(modules);

                        // Cache the correct percentage so it persists across auto-refreshes
                        completionCache[qualName] = newCompletion;

                        // Update parent row progress
                        const progressFill = row.querySelector('.progress-mini-fill');
                        const progressText = row.querySelector('.progress-text');

                        if (progressFill && progressText) {
                            // Animate the change
                            progressFill.style.transition = 'width 0.5s ease-in-out';
                            progressFill.style.width = `${newCompletion}%`;
                            progressText.textContent = `${newCompletion}%`;

                            // Optional: Update color based on completion
                            if (newCompletion === 100) {
                                progressFill.style.backgroundColor = 'var(--success-color)';
                            } else {
                                progressFill.style.backgroundColor = 'var(--primary-color)';
                            }
                        }
                    } else {
                        container.innerHTML = '<h4>⚠️ No module data found for this qualification</h4>';
                    }
                } else if (!gid) {
                    container.innerHTML = '<h4>⚠️ GID mapping not found for this qualification. Please add it to qualification-gids.js</h4>';
                }
            }
        });

        // Add hover effect
        row.style.cursor = 'pointer';
    });
}

/**
 * Calculate completion percentage from array of modules
 * Counts all 7 boolean fields for each module
 * @param {Array} modules - Array of module objects
 * @returns {number} Completion percentage (0-100)
 */
function calculateModuleCompletion(modules) {
    if (!modules || modules.length === 0) return 0;

    let totalChecks = 0;
    let completedChecks = 0;

    modules.forEach(mod => {
        // Count total possible checks (7 per module)
        totalChecks += 7;

        // Count completed checks
        if (mod.iacAligned) completedChecks++;
        if (mod.aacAligned) completedChecks++;
        if (mod.loadedOnMoodle) completedChecks++;
        if (mod.learnerGuideChecked) completedChecks++;
        if (mod.courseActivitiesCreated) completedChecks++;
        if (mod.contentReviewed) completedChecks++;
        if (mod.alignmentMatrixCorrected) completedChecks++;
    });

    if (totalChecks === 0) return 0;

    return Math.round((completedChecks / totalChecks) * 100);
}

/**
 * Render status badge
 * @param {boolean} status - Status value
 * @returns {string} HTML for status badge
 */
function renderStatusBadge(status) {
    const badgeClass = status ? 'complete' : 'incomplete';
    const label = status ? '✓' : '—';
    return `<span class="status-badge ${badgeClass}">
        <span class="status-dot"></span>${label}
    </span>`;
}

/**
 * Add sort listeners to table headers
 * @param {HTMLElement} tableContainer - Table container element
 * @param {Array} qualifications - Original qualifications array
 */
function addSortListeners(tableContainer, qualifications) {
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
            const sortedData = [...qualifications].sort((a, b) => {
                let aVal, bVal;

                if (sortField === 'completion') {
                    aVal = calculateCompletion(a);
                    bVal = calculateCompletion(b);
                } else {
                    aVal = a[sortField];
                    bVal = b[sortField];
                }

                if (aVal < bVal) return currentSort.ascending ? -1 : 1;
                if (aVal > bVal) return currentSort.ascending ? 1 : -1;
                return 0;
            });

            // Re-render table with sorted data
            renderTable(sortedData, tableContainer);
        });
    });
}

/**
 * Filter qualifications based on search query
 * @param {Array} qualifications - Array of qualification objects
 * @param {string} query - Search query
 * @returns {Array} Filtered qualifications
 */
export function filterQualifications(qualifications, query) {
    if (!query || query.trim() === '') {
        return qualifications;
    }

    const lowerQuery = query.toLowerCase();

    return qualifications.filter(qual => {
        return (
            qual.qualificationName.toLowerCase().includes(lowerQuery) ||
            qual.qualificationID.toLowerCase().includes(lowerQuery) ||
            qual.modules.toLowerCase().includes(lowerQuery)
        );
    });
}

/**
 * Render module details HTML for expanded qualification row
 * @param {string} qualName - Qualification name
 * @param {Array} modules - Array of module objects
 * @returns {string} HTML string for module details
 */
function renderModuleDetailsHTML(qualName, modules) {
    let html = `
        <h4>Knowledge Modules for ${qualName}</h4>
        <table class="module-details-table">
            <thead>
                <tr>
                    <th>Module</th>
                    <th>IAC</th>
                    <th>AAC</th>
                    <th>Moodle</th>
                    <th>LG Checked</th>
                    <th>Activities</th>
                    <th>Reviewed</th>
                    <th>Matrix</th>
                </tr>
            </thead>
            <tbody>
    `;

    modules.forEach(module => {
        html += `
            <tr>
                <td><strong>${module.name}</strong></td>
                <td>${renderStatusBadge(module.iacAligned)}</td>
                <td>${renderStatusBadge(module.aacAligned)}</td>
                <td>${renderStatusBadge(module.loadedOnMoodle)}</td>
                <td>${renderStatusBadge(module.learnerGuideChecked)}</td>
                <td>${renderStatusBadge(module.courseActivitiesCreated)}</td>
                <td>${renderStatusBadge(module.contentReviewed)}</td>
                <td>${renderStatusBadge(module.alignmentMatrixCorrected)}</td>
            </tr>
        `;
    });

    html += `
            </tbody>
        </table>
    `;

    return html;
}
