
/**
 * Create Course Category Distribution Donut Chart
 */
export function createCourseCategoryChart(stats, canvas) {
    const ctx = canvas.getContext('2d');

    // Data setup
    const categories = Object.keys(stats.byCategory);
    const data = Object.values(stats.byCategory);

    // Determine colors based on category names
    const getColor = (cat) => {
        const c = cat.toLowerCase();
        if (c.includes('client')) return 'rgba(6, 182, 212, 0.8)'; // Cyan
        if (c.includes('tap')) return 'rgba(139, 92, 246, 0.8)';   // Purple
        if (c.includes('qcto')) return 'rgba(59, 130, 246, 0.8)';  // Blue
        if (c.includes('legacy')) return 'rgba(148, 163, 184, 0.8)'; // Gray
        return 'rgba(236, 72, 153, 0.8)'; // Pink default
    };

    const bgColors = categories.map(getColor);
    const borderColors = bgColors.map(c => c.replace('0.8', '1'));

    return new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: categories,
            datasets: [{
                data: data,
                backgroundColor: bgColors,
                borderColor: borderColors,
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#cbd5e1',
                        font: { family: 'Inter', size: 12 },
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    titleColor: '#f1f5f9',
                    bodyColor: '#cbd5e1',
                    callbacks: {
                        label: function (context) {
                            const value = context.parsed;
                            const total = stats.total;
                            const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                            return `${context.label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            },
            cutout: '65%'
        }
    });
}

/**
 * Create Client Breakdown Bar Chart
 */
export function createClientBreakdownChart(stats, canvas) {
    const ctx = canvas.getContext('2d');

    // Sort clients by count
    const sortedClients = Object.entries(stats.byClient)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 7); // Top 7 clients

    const labels = sortedClients.map(e => e[0]);
    const data = sortedClients.map(e => e[1]);

    // Generate colors
    const colors = [
        'rgba(59, 130, 246, 0.8)',   // Blue
        'rgba(16, 185, 129, 0.8)',   // Green
        'rgba(245, 158, 11, 0.8)',   // Orange
        'rgba(239, 68, 68, 0.8)',    // Red
        'rgba(139, 92, 246, 0.8)',   // Purple
        'rgba(236, 72, 153, 0.8)',   // Pink
        'rgba(6, 182, 212, 0.8)'     // Cyan
    ];

    return new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Active Courses',
                data: data,
                backgroundColor: colors.slice(0, labels.length),
                borderRadius: 4,
                borderSkipped: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y', // Horizontal bars
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    titleColor: '#f1f5f9',
                    bodyColor: '#cbd5e1'
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    grid: { color: 'rgba(148, 163, 184, 0.1)' },
                    ticks: { color: '#94a3b8' }
                },
                y: {
                    grid: { display: false },
                    ticks: { color: '#cbd5e1', font: { weight: '600' } }
                }
            }
        }
    });
}
