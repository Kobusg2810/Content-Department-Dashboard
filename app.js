import { fetchQCTOData, calculateStats, exportToCSV, downloadCSV, fetchAllModuleDetails } from './data.js';
import { renderStats, renderTable, filterQualifications } from './components.js';
import { createCompletionChart, createStageChart, destroyChart } from './charts.js';
import { fetchMoodleTickets, calculateMoodleStats, exportMoodleToCSV } from './moodle-data.js';
import { renderMoodleStats, renderMoodleTable, filterMoodleTickets, parseCustomDate } from './moodle-components.js';
import { createMoodleStatusChart, createMoodlePriorityChart } from './moodle-charts.js';
import { renderCourseDashboard } from './course-components.js';
import { renderLoadingDashboard } from './loading-components.js';
import { renderClientProjectsDashboard } from './client-projects-components.js';

// Global state
let qualificationsData = [];
let moodleTicketsData = [];
let currentFilter = '';
let currentTab = 'qcto';
let charts = {
    completion: null,
    stage: null,
    moodleStatus: null,
    moodlePriority: null
};

// Your Google Sheet URLs
const QCTO_SHEET_URL = 'https://docs.google.com/spreadsheets/d/14pEQHY3stCEzrDry8bnIosh1SLNAarYHZFuH1-XlNX4/edit?gid=1203721967#gid=1203721967';
const MOODLE_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1c0qwzK2ajMp5LsnGkZQmh-APUKfjewJ15IQ7kw9LdK0/edit?gid=0#gid=0';
const MOODLE_SHEET_GID = null; // No GID - export default/first sheet only

/**
 * Initialize the application
 */
async function init() {
    console.log('🚀 Initializing SpecCon Department Dashboard...');

    // Set up event listeners
    setupEventListeners();

    // Load initial data for both sections
    await loadData();

    // Update last updated timestamp
    updateTimestamp();

    console.log('✅ Dashboard initialized successfully!');

    // Start background sync for accurate stats
    startBackgroundSync();
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
    // Tab navigation
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.dataset.tab;
            switchTab(tabName);
        });
    });

    // Refresh button
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', async () => {
            refreshBtn.classList.add('loading');
            await loadData();
            refreshBtn.classList.remove('loading');
        });
    }

    // Search input for QCTO
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            currentFilter = e.target.value;
            if (currentTab === 'qcto') {
                renderQCTODashboard();
            }
        });
    }

    // Search input for Moodle
    const moodleSearchInput = document.getElementById('moodleSearchInput');
    if (moodleSearchInput) {
        moodleSearchInput.addEventListener('input', (e) => {
            currentFilter = e.target.value;
            if (currentTab === 'moodle') {
                renderMoodleDashboard();
            }
        });
    }

    // Export button for QCTO
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            exportQCTOData();
        });
    }

    // Export button for Moodle
    const moodleExportBtn = document.getElementById('moodleExportBtn');
    if (moodleExportBtn) {
        moodleExportBtn.addEventListener('click', () => {
            exportMoodleData();
        });
    }
}

/**
 * Switch between tabs
 * @param {string} tabName - Name of the tab to switch to
 */
function switchTab(tabName) {
    currentTab = tabName;
    currentFilter = ''; // Reset filter when switching tabs

    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.toggle('active', content.id === `${tabName}-tab`);
    });

    // Clear search inputs
    const qctoSearch = document.getElementById('searchInput');
    const moodleSearch = document.getElementById('moodleSearchInput');
    if (qctoSearch) qctoSearch.value = '';
    if (moodleSearch) moodleSearch.value = '';

    // Render appropriate dashboard
    if (tabName === 'qcto') {
        renderQCTODashboard();
    } else if (tabName === 'moodle') {
        renderMoodleDashboard();
    } else if (tabName === 'course') {
        renderCourseDashboard();
    } else if (tabName === 'loading') {
        renderLoadingDashboard();
    } else if (tabName === 'client-projects') {
        renderClientProjectsDashboard();
    }
}

/**
 * Load data from Google Sheets or sample data
 */
async function loadData() {
    try {
        console.log('📊 Loading data...');

        // Load QCTO data
        const newQualificationsData = await fetchQCTOData(QCTO_SHEET_URL);

        // Preserve module details from existing data if available
        // This prevents the 5-minute refresh from wiping out our background-synced details
        if (qualificationsData && qualificationsData.length > 0) {
            newQualificationsData.forEach(newQual => {
                const existingQual = qualificationsData.find(q => q.qualificationName === newQual.qualificationName);
                if (existingQual && existingQual.moduleDetails && existingQual.moduleDetails.length > 0) {
                    newQual.moduleDetails = existingQual.moduleDetails;
                }
            });
        }

        qualificationsData = newQualificationsData;
        console.log(`✅ Loaded ${qualificationsData.length} qualifications`);

        // Load Moodle tickets data
        moodleTicketsData = await fetchMoodleTickets(MOODLE_SHEET_URL, MOODLE_SHEET_GID);

        // Sort by date descending (newest first), then by ticket number descending
        moodleTicketsData.sort((a, b) => {
            const dateA = parseCustomDate(a.date);
            const dateB = parseCustomDate(b.date);

            // If dates are valid and different, sort by date
            if (dateA.getTime() !== dateB.getTime() && !isNaN(dateA) && !isNaN(dateB)) {
                return dateB - dateA;
            }

            // If dates are same or invalid, fallback to Ticket Number descending
            // Extract number from string (e.g. "MT-202" -> 202)
            const numA = parseInt(a.ticketNo.replace(/\D/g, '')) || 0;
            const numB = parseInt(b.ticketNo.replace(/\D/g, '')) || 0;

            return numB - numA;
        });

        console.log(`✅ Loaded ${moodleTicketsData.length} Moodle tickets`);

        // Render current dashboard
        if (currentTab === 'qcto') {
            renderQCTODashboard();
        } else if (currentTab === 'moodle') {
            renderMoodleDashboard();
        } else if (currentTab === 'course') {
            renderCourseDashboard();
        } else if (currentTab === 'loading') {
            renderLoadingDashboard();
        } else if (currentTab === 'client-projects') {
            renderClientProjectsDashboard();
        }

        // If this was a re-load (e.g. auto-refresh), we might need to restart sync for any NEW items
        // But startBackgroundSync is smart enough to skip items that already have details
        if (qualificationsData.some(q => !q.moduleDetails || q.moduleDetails.length === 0)) {
            startBackgroundSync();
        }
    } catch (error) {
        console.error('❌ Error loading data:', error);
        showNotification('Failed to load data. Using sample data.', 'error');
    }
}

/**
 * Render the QCTO dashboard
 */
function renderQCTODashboard() {
    // Filter data based on search
    const filteredData = filterQualifications(qualificationsData, currentFilter);

    // Calculate statistics
    const stats = calculateStats(filteredData);

    // Render components
    renderStats(stats, document.getElementById('statsGrid'));
    renderTable(filteredData, document.getElementById('tableWrapper'));

    // Render charts
    renderQCTOCharts(stats);
}

/**
 * Render the Moodle dashboard
 */
function renderMoodleDashboard() {
    // Filter data based on search
    const filteredData = filterMoodleTickets(moodleTicketsData, currentFilter);

    // Calculate statistics
    const stats = calculateMoodleStats(filteredData);

    // Render components
    renderMoodleStats(stats, document.getElementById('moodleStatsGrid'));
    renderMoodleTable(filteredData, document.getElementById('moodleTableWrapper'));

    // Render charts
    renderMoodleCharts(stats);
}

/**
 * Render QCTO charts
 * @param {Object} stats - Statistics object
 */
function renderQCTOCharts(stats) {
    // Destroy existing charts
    destroyChart(charts.completion);
    destroyChart(charts.stage);

    // Create new charts
    const completionCanvas = document.getElementById('completionChart');
    const stageCanvas = document.getElementById('stageChart');

    if (completionCanvas && stageCanvas) {
        charts.completion = createCompletionChart(stats, completionCanvas);
        charts.stage = createStageChart(stats.stageStats, stats.total, stageCanvas);
    }
}

/**
 * Render Moodle charts
 * @param {Object} stats - Moodle statistics object
 */
function renderMoodleCharts(stats) {
    // Destroy existing charts
    destroyChart(charts.moodleStatus);
    destroyChart(charts.moodlePriority);

    // Create new charts
    const statusCanvas = document.getElementById('moodleStatusChart');
    const priorityCanvas = document.getElementById('moodlePriorityChart');

    if (statusCanvas && priorityCanvas) {
        charts.moodleStatus = createMoodleStatusChart(stats, statusCanvas);
        charts.moodlePriority = createMoodlePriorityChart(stats, priorityCanvas);
    }
}

/**
 * Export QCTO data to CSV
 */
function exportQCTOData() {
    const filteredData = filterQualifications(qualificationsData, currentFilter);
    const csvContent = exportToCSV(filteredData);
    const filename = `qcto-qualifications-${new Date().toISOString().split('T')[0]}.csv`;
    downloadCSV(csvContent, filename);
    showNotification('QCTO data exported successfully!', 'success');
}

/**
 * Export Moodle data to CSV
 */
function exportMoodleData() {
    const filteredData = filterMoodleTickets(moodleTicketsData, currentFilter);
    const csvContent = exportMoodleToCSV(filteredData);
    const filename = `moodle-tickets-${new Date().toISOString().split('T')[0]}.csv`;
    downloadCSV(csvContent, filename);
    showNotification('Moodle data exported successfully!', 'success');
}

/**
 * Update last updated timestamp
 */
function updateTimestamp() {
    const timestampElement = document.getElementById('lastUpdated');
    if (timestampElement) {
        const now = new Date();
        const formatted = now.toLocaleString('en-ZA', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        timestampElement.textContent = formatted;
    }
}

/**
 * Show notification to user
 * @param {string} message - Notification message
 * @param {string} type - Notification type (success, error, info)
 */
function showNotification(message, type = 'info') {
    console.log(`[${type.toUpperCase()}] ${message}`);
    // TODO: Implement toast notification UI
    alert(message);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Auto-refresh every 5 minutes
setInterval(async () => {
    console.log('🔄 Auto-refreshing data...');
    await loadData();
    updateTimestamp();
}, 5 * 60 * 1000);

/**
 * Start background sync to fetch detailed module usage for accurate stats
 */
function startBackgroundSync() {
    // Only run if we have qualifications
    if (!qualificationsData || qualificationsData.length === 0) return;

    fetchAllModuleDetails(qualificationsData, (qualName, modules) => {
        // Find the qualification and update its modules
        const qual = qualificationsData.find(q => q.qualificationName === qualName);
        if (qual) {
            qual.moduleDetails = modules;

            // If we are currently on the QCTO tab, update the UI to show accurate stats
            if (currentTab === 'qcto') {
                renderQCTODashboard();
            }
        }
    });
}
