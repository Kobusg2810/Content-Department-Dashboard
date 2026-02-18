/**
 * Create Moodle status distribution donut chart
 * @param {Object} stats - Moodle statistics object
 * @param {HTMLCanvasElement} canvas - Canvas element
 * @returns {Chart} Chart.js instance
 */
export function createMoodleStatusChart(stats, canvas) {
    const ctx = canvas.getContext('2d');

    return new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Resolved', 'In Progress', 'Open', 'Escalated'],
            datasets: [{
                data: [stats.resolved, stats.inProgress, stats.open, stats.escalated],
                backgroundColor: [
                    'rgba(16, 185, 129, 0.8)', // Green
                    'rgba(245, 158, 11, 0.8)', // Orange
                    'rgba(239, 68, 68, 0.8)',  // Red
                    'rgba(139, 92, 246, 0.8)'  // Purple
                ],
                borderColor: [
                    'rgba(16, 185, 129, 1)',
                    'rgba(245, 158, 11, 1)',
                    'rgba(239, 68, 68, 1)',
                    'rgba(139, 92, 246, 1)'
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
                    labels: {
                        color: '#cbd5e1',
                        font: {
                            family: 'Inter',
                            size: 13,
                            weight: '600'
                        },
                        padding: 15,
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    titleColor: '#f1f5f9',
                    bodyColor: '#cbd5e1',
                    borderColor: 'rgba(99, 102, 241, 0.5)',
                    borderWidth: 1,
                    padding: 12,
                    titleFont: {
                        family: 'Inter',
                        size: 14,
                        weight: '700'
                    },
                    bodyFont: {
                        family: 'Inter',
                        size: 13
                    },
                    displayColors: true,
                    callbacks: {
                        label: function (context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const total = stats.total;
                            const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            },
            cutout: '65%',
            animation: {
                animateRotate: true,
                animateScale: true,
                duration: 1000,
                easing: 'easeInOutQuart'
            }
        }
    });
}

/**
 * Create Moodle error type distribution bar chart
 * @param {Object} stats - Moodle statistics object
 * @param {HTMLCanvasElement} canvas - Canvas element
 * @returns {Chart} Chart.js instance
 */
export function createMoodlePriorityChart(stats, canvas) {
    const ctx = canvas.getContext('2d');

    // Convert errorTypes object to array and sort by count
    const errorTypeArray = Object.entries(stats.errorTypes || {})
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 7); // Show top 7 error types

    if (errorTypeArray.length === 0) {
        // No data, show empty chart
        errorTypeArray.push({ type: 'No Data', count: 0 });
    }

    const colors = [
        'rgba(239, 68, 68, 0.8)',
        'rgba(245, 158, 11, 0.8)',
        'rgba(59, 130, 246, 0.8)',
        'rgba(16, 185, 129, 0.8)',
        'rgba(139, 92, 246, 0.8)',
        'rgba(236, 72, 153, 0.8)',
        'rgba(6, 182, 212, 0.8)'
    ];

    return new Chart(ctx, {
        type: 'bar',
        data: {
            labels: errorTypeArray.map(e => e.type),
            datasets: [{
                label: 'Number of Tickets',
                data: errorTypeArray.map(e => e.count),
                backgroundColor: colors.slice(0, errorTypeArray.length),
                borderColor: colors.slice(0, errorTypeArray.length).map(c => c.replace('0.8', '1')),
                borderWidth: 2,
                borderRadius: 6,
                borderSkipped: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y',
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    titleColor: '#f1f5f9',
                    bodyColor: '#cbd5e1',
                    borderColor: 'rgba(99, 102, 241, 0.5)',
                    borderWidth: 1,
                    padding: 12,
                    titleFont: {
                        family: 'Inter',
                        size: 14,
                        weight: '700'
                    },
                    bodyFont: {
                        family: 'Inter',
                        size: 13
                    },
                    callbacks: {
                        label: function (context) {
                            const value = context.parsed.x;
                            const total = stats.total;
                            const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                            return `${value} tickets (${percentage}%)`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1,
                        color: '#94a3b8',
                        font: {
                            family: 'Inter',
                            size: 12
                        }
                    },
                    grid: {
                        color: 'rgba(148, 163, 184, 0.1)',
                        drawBorder: false
                    }
                },
                y: {
                    ticks: {
                        color: '#cbd5e1',
                        font: {
                            family: 'Inter',
                            size: 12,
                            weight: '600'
                        }
                    },
                    grid: {
                        display: false,
                        drawBorder: false
                    }
                }
            },
            animation: {
                duration: 1000,
                easing: 'easeInOutQuart'
            }
        }
    });
}
