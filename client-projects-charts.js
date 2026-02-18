
// client-projects-charts.js

let platformChart = null;
let ownerChart = null;

export function updateClientProjectsCharts(stats) {
    createPlatformChart(stats);
    createOwnerChart(stats);
}

function createPlatformChart(stats) {
    const ctx = document.getElementById('platformChart');
    if (!ctx) return;

    if (platformChart) {
        platformChart.destroy();
    }

    const platforms = Object.keys(stats.byPlatform);
    const counts = Object.values(stats.byPlatform);

    // Dynamic Colors
    const colors = [
        '#3b82f6', // blue
        '#10b981', // green
        '#f59e0b', // yellow
        '#ef4444', // red
        '#8b5cf6', // purple
        '#ec4899'  // pink
    ];

    platformChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: platforms,
            datasets: [{
                data: counts,
                backgroundColor: colors.slice(0, platforms.length),
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: { color: '#94a3b8' }
                }
            }
        }
    });
}

function createOwnerChart(stats) {
    const ctx = document.getElementById('ownerChart');
    if (!ctx) return;

    if (ownerChart) {
        ownerChart.destroy();
    }

    const owners = Object.keys(stats.byOwner);
    const counts = Object.values(stats.byOwner);

    ownerChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: owners,
            datasets: [{
                label: 'Projects',
                data: counts,
                backgroundColor: '#3b82f6',
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: '#334155' },
                    ticks: { color: '#94a3b8' }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#94a3b8' }
                }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}
