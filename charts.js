/**
 * Create completion donut chart
 * @param {Object} stats - Statistics object
 * @param {HTMLCanvasElement} canvas - Canvas element
 * @returns {Chart} Chart.js instance
 */
export function createCompletionChart(stats, canvas) {
    const ctx = canvas.getContext('2d');

    return new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Completed', 'In Progress', 'Not Started'],
            datasets: [{
                data: [stats.completed, stats.inProgress, stats.notStarted],
                backgroundColor: [
                    'rgba(16, 185, 129, 0.8)',
                    'rgba(245, 158, 11, 0.8)',
                    'rgba(148, 163, 184, 0.8)'
                ],
                borderColor: [
                    'rgba(16, 185, 129, 1)',
                    'rgba(245, 158, 11, 1)',
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
 * Create stage completion bar chart
 * @param {Object} stageStats - Stage statistics object
 * @param {number} total - Total number of qualifications
 * @param {HTMLCanvasElement} canvas - Canvas element
 * @returns {Chart} Chart.js instance
 */
export function createStageChart(stageStats, total, canvas) {
    const ctx = canvas.getContext('2d');

    const stages = [
        { label: 'IAC Aligned', value: stageStats.iacAligned },
        { label: 'AAC Aligned', value: stageStats.aacAligned },
        { label: 'Loaded on Moodle', value: stageStats.loadedOnMoodle },
        { label: 'LG Checked', value: stageStats.learnerGuideChecked },
        { label: 'Activities Created', value: stageStats.courseActivitiesCreated },
        { label: 'Content Reviewed', value: stageStats.contentReviewed },
        { label: 'Matrix Corrected', value: stageStats.alignmentMatrixCorrected }
    ];

    const percentages = stages.map(stage =>
        total > 0 ? Math.round((stage.value / total) * 100) : 0
    );

    return new Chart(ctx, {
        type: 'bar',
        data: {
            labels: stages.map(s => s.label),
            datasets: [{
                label: 'Completion Rate',
                data: percentages,
                backgroundColor: 'rgba(99, 102, 241, 0.8)',
                borderColor: 'rgba(99, 102, 241, 1)',
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
                            const stageIndex = context.dataIndex;
                            const completed = stages[stageIndex].value;
                            return `${completed} of ${total} (${context.parsed.x}%)`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        callback: function (value) {
                            return value + '%';
                        },
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

/**
 * Destroy chart instances to prevent memory leaks
 * @param {Chart} chart - Chart.js instance
 */
export function destroyChart(chart) {
    if (chart) {
        chart.destroy();
    }
}
