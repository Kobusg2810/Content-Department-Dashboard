
let loadingProgressChart = null;
let loaderWorkloadChart = null;

/**
 * Destroy existing charts to prevent canvas reuse errors
 */
export function destroyLoadingCharts() {
    if (loadingProgressChart) {
        loadingProgressChart.destroy();
        loadingProgressChart = null;
    }
    if (loaderWorkloadChart) {
        loaderWorkloadChart.destroy();
        loaderWorkloadChart = null;
    }
}

/**
 * Create Loading Progress Donut Chart
 */
export function createLoadingProgressChart(stats, canvas) {
    if (!canvas) return null;

    const ctx = canvas.getContext('2d');

    loadingProgressChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Completed', 'In Progress', 'Review Pending', 'Not Started'],
            datasets: [{
                data: [stats.completed, stats.inProgress, stats.reviewPending, stats.notStarted],
                backgroundColor: [
                    'rgba(16, 185, 129, 0.8)', // Green
                    'rgba(245, 158, 11, 0.8)', // Orange
                    'rgba(139, 92, 246, 0.8)', // Purple
                    'rgba(148, 163, 184, 0.5)'  // Gray
                ],
                borderColor: [
                    'rgba(16, 185, 129, 1)',
                    'rgba(245, 158, 11, 1)',
                    'rgba(139, 92, 246, 1)',
                    'rgba(148, 163, 184, 1)'
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: '#e2e8f0' }
                }
            },
            cutout: '70%'
        }
    });

    return loadingProgressChart;
}

/**
 * Create Loader Workload Bar Chart
 */
export function createLoaderWorkloadChart(stats, canvas) {
    if (!canvas) return null;

    const loaders = Object.keys(stats.byLoader);
    // Sort loaders by total assigned descending
    loaders.sort((a, b) => stats.byLoader[b].total - stats.byLoader[a].total);

    // Limit to top 10 loaders
    const topLoaders = loaders.slice(0, 10);
    const assignedData = topLoaders.map(l => stats.byLoader[l].total);
    const completedData = topLoaders.map(l => stats.byLoader[l].completed);

    const ctx = canvas.getContext('2d');

    loaderWorkloadChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: topLoaders,
            datasets: [
                {
                    label: 'Assigned',
                    data: assignedData,
                    backgroundColor: 'rgba(56, 189, 248, 0.6)', // Blue
                    borderColor: 'rgba(56, 189, 248, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Completed',
                    data: completedData,
                    backgroundColor: 'rgba(16, 185, 129, 0.8)', // Green
                    borderColor: 'rgba(16, 185, 129, 1)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    ticks: { color: '#94a3b8' }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#94a3b8' }
                }
            },
            plugins: {
                legend: {
                    labels: { color: '#e2e8f0' }
                }
            }
        }
    });

    return loaderWorkloadChart;
}
