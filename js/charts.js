// ═══════════════════════════════════════════════════════════════════════
// TechStore Analytics - Gráficos
// ═══════════════════════════════════════════════════════════════════════

const chartOpts = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: { 
            display: true, 
            position: 'bottom', 
            labels: {
                color: '#80CBC4', 
                padding: 16, 
                font: {size: 11, weight: '500'},
                boxPadding: 8
            } 
        },
        tooltip: { 
            backgroundColor: 'rgba(10, 14, 39, 0.95)', 
            borderColor: 'rgba(29, 233, 182, 0.3)', 
            borderWidth: 1, 
            titleColor: '#E8F5E9', 
            bodyColor: '#B2DFDB', 
            padding: 12, 
            cornerRadius: 6,
            titleFont: {weight: 'bold'},
            bodyFont: {size: 12}
        }
    },
    scales: {
        y: { 
            grid: {color: 'rgba(29, 233, 182, 0.05)'}, 
            ticks: {color: '#80CBC4', font: {size: 11}}
        },
        x: { 
            grid: {display: false}, 
            ticks: {color: '#80CBC4', font: {size: 11}}
        }
    }
};

function formatMonthYear(periodo) {
    const [year, month] = periodo.split('-');
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return monthNames[parseInt(month) - 1] + "/" + year.substring(2);
}

function initCharts() {
    const filtered = getFilteredData(compareMode ? comparePeriod1 : currentPeriod);

    // Evolution Chart
    const evoCtx = document.getElementById('chartEvolution').getContext('2d');
    chartInstances.evo = new Chart(evoCtx, {
        type: 'line',
        data: {
            labels: filtered.map(d => formatMonthYear(d.periodo)),
            datasets: [
                { 
                    label: 'Receita (R$ Milhões)', 
                    data: filtered.map(d => d.receita/1e6), 
                    borderColor: '#1DE9B6', 
                    backgroundColor: 'rgba(29, 233, 182, 0.08)', 
                    borderWidth: 3, 
                    fill: true, 
                    tension: 0.4, 
                    pointRadius: 5, 
                    pointBackgroundColor: '#1DE9B6',
                    pointBorderColor: '#00BFA4',
                    pointBorderWidth: 2,
                    pointHoverRadius: 7
                },
                { 
                    label: 'Lucro (R$ Milhões)', 
                    data: filtered.map(d => d.lucro/1e6), 
                    borderColor: '#DA70D6', 
                    backgroundColor: 'rgba(218, 112, 214, 0.08)', 
                    borderWidth: 3, 
                    fill: true, 
                    tension: 0.4, 
                    pointRadius: 5, 
                    pointBackgroundColor: '#DA70D6',
                    pointBorderColor: '#BA68C8',
                    pointBorderWidth: 2,
                    pointHoverRadius: 7
                }
            ]
        },
        options: {
            ...chartOpts,
            scales: {
                ...chartOpts.scales,
                y: {
                    ...chartOpts.scales.y,
                    ticks: {
                        ...chartOpts.scales.y.ticks,
                        callback: (v) => 'R$ ' + v.toFixed(0) + 'M'
                    }
                },
                x: {
                    ...chartOpts.scales.x,
                    ticks: {
                        ...chartOpts.scales.x.ticks,
                        maxRotation: 45,
                        minRotation: 0
                    }
                }
            }
        }
    });

    // Category Chart (Clicável)
    const catCtx = document.getElementById('chartCategory').getContext('2d');
    chartInstances.cat = new Chart(catCtx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(data.categoria),
            datasets: [{ 
                data: Object.values(data.categoria), 
                backgroundColor: ['#1DE9B6', '#DA70D6', '#40E0D0', '#FFD54F', '#FF7043', '#AB47BC'], 
                borderColor: '#0F1429', 
                borderWidth: 2,
                hoverOffset: 8
            }]
        },
        options: { 
            ...chartOpts,
            onClick: (e, activeElements) => {
                if (activeElements.length > 0) {
                    const categoria = activeElements[0].element.$context.label;
                    applyCategoryFilter(categoria);
                }
            },
            plugins: { 
                ...chartOpts.plugins, 
                tooltip: { 
                    ...chartOpts.plugins.tooltip, 
                    callbacks: { 
                        label: (ctx) => { 
                            const pct = ((ctx.parsed / Object.values(data.categoria).reduce((a,b)=>a+b)) * 100).toFixed(1); 
                            return `R$ ${(ctx.parsed/1e6).toFixed(1)}M (${pct}%)`; 
                        },
                        afterLabel: () => '👆 Clique para filtrar'
                    } 
                } 
            } 
        }
    });

    // Channel Chart
    const chanCtx = document.getElementById('chartChannel').getContext('2d');
    const sortedChan = Object.entries(data.canal).sort((a,b)=>b[1]-a[1]);
    
    chartInstances.chan = new Chart(chanCtx, {
        type: 'bar',
        data: { 
            labels: sortedChan.map(d => d[0]), 
            datasets: [{ 
                label: 'Receita por Canal (R$ Milhões)', 
                data: sortedChan.map(d => d[1]/1e6), 
                backgroundColor: ['#1DE9B6', '#DA70D6', '#40E0D0', '#FFD54F', '#FF7043', '#AB47BC'], 
                borderRadius: 6, 
                borderSkipped: false,
                borderColor: 'rgba(29, 233, 182, 0.3)',
                borderWidth: 1
            }] 
        },
        options: { 
            ...chartOpts, 
            indexAxis: 'y', 
            scales: { 
                x: { 
                    beginAtZero: true, 
                    grid: {color: 'rgba(29, 233, 182, 0.05)'}, 
                    ticks: {color: '#80CBC4', font: {size: 11}, callback: (v) => 'R$ ' + v.toFixed(0) + 'M'} 
                }, 
                y: { 
                    grid: {display: false}, 
                    ticks: {color: '#80CBC4', font: {size: 11}} 
                } 
            },
            plugins: {
                ...chartOpts.plugins,
                tooltip: {
                    ...chartOpts.plugins.tooltip,
                    callbacks: {
                        label: (ctx) => 'R$ ' + ctx.parsed.x.toFixed(1) + 'M'
                    }
                }
            }
        }
    });

    // Region Chart
    const regCtx = document.getElementById('chartRegion').getContext('2d');
    const sortedReg = Object.entries(data.regiao).sort((a,b)=>b[1]-a[1]);
    chartInstances.reg = new Chart(regCtx, {
        type: 'bar',
        data: { 
            labels: sortedReg.map(d => d[0]), 
            datasets: [{ 
                label: 'Receita por Região (R$ Milhões)', 
                data: sortedReg.map(d => d[1]/1e6), 
                backgroundColor: ['#1DE9B6', '#DA70D6', '#40E0D0', '#FFD54F', '#FF7043'], 
                borderRadius: 8, 
                borderSkipped: false, 
                barPercentage: 0.8, 
                categoryPercentage: 0.85,
                borderColor: 'rgba(29, 233, 182, 0.3)',
                borderWidth: 1
            }] 
        },
        options: { 
            responsive: true, 
            maintainAspectRatio: false, 
            indexAxis: 'y', 
            plugins: { 
                legend: { display: true, position: 'bottom', labels: {color: '#80CBC4', padding: 16, font: {size: 11, weight: '500'}} }, 
                tooltip: { backgroundColor: 'rgba(10, 14, 39, 0.95)', borderColor: 'rgba(29, 233, 182, 0.3)', borderWidth: 1, titleColor: '#E8F5E9', bodyColor: '#B2DFDB', padding: 12, cornerRadius: 6, callbacks: { label: (ctx) => 'R$ ' + ctx.parsed.x.toFixed(1) + 'M' } } 
            }, 
            scales: { 
                x: { beginAtZero: true, grid: {color: 'rgba(29, 233, 182, 0.05)'}, ticks: {color: '#80CBC4', font: {size: 11}, callback: (v) => 'R$ ' + v.toFixed(0) + 'M'} }, 
                y: { grid: {display: false}, ticks: {color: '#80CBC4', font: {size: 11}} } 
            } 
        }
    });

    // Payment Chart
    const payCtx = document.getElementById('chartPayment').getContext('2d');
    chartInstances.pay = new Chart(payCtx, {
        type: 'doughnut',
        data: { 
            labels: Object.keys(data.pagamento), 
            datasets: [{ 
                data: Object.values(data.pagamento), 
                backgroundColor: ['#1DE9B6', '#DA70D6', '#40E0D0', '#FFD54F', '#FF7043'], 
                borderColor: '#0F1429', 
                borderWidth: 2,
                hoverOffset: 8
            }] 
        },
        options: { 
            ...chartOpts, 
            plugins: { 
                ...chartOpts.plugins, 
                tooltip: { 
                    ...chartOpts.plugins.tooltip, 
                    callbacks: { 
                        label: (ctx) => { 
                            const pct = ((ctx.parsed / Object.values(data.pagamento).reduce((a,b)=>a+b)) * 100).toFixed(1); 
                            return `R$ ${(ctx.parsed/1e6).toFixed(1)}M (${pct}%)`; 
                        } 
                    } 
                } 
            } 
        }
    });

    // Margin Chart
    const marCtx = document.getElementById('chartMargin').getContext('2d');
    chartInstances.mar = new Chart(marCtx, {
        type: 'line',
        data: { 
            labels: filtered.map(d => formatMonthYear(d.periodo)),
            datasets: [{ 
                label: 'Margem de Lucro (%)', 
                data: filtered.map(d => (d.lucro/d.receita*100)), 
                borderColor: '#1DE9B6', 
                backgroundColor: 'rgba(29, 233, 182, 0.08)', 
                borderWidth: 3, 
                fill: true, 
                tension: 0.4, 
                pointRadius: 5, 
                pointBackgroundColor: '#1DE9B6',
                pointBorderColor: '#00BFA4',
                pointBorderWidth: 2,
                pointHoverRadius: 7
            }] 
        },
        options: { 
            ...chartOpts, 
            plugins: { 
                ...chartOpts.plugins, 
                legend: {display: false},
                tooltip: { 
                    ...chartOpts.plugins.tooltip, 
                    callbacks: {label: (ctx) => ctx.parsed.y.toFixed(2) + '%'} 
                } 
            },
            scales: {
                ...chartOpts.scales,
                y: {
                    ...chartOpts.scales.y,
                    ticks: {
                        ...chartOpts.scales.y.ticks,
                        callback: (v) => v.toFixed(1) + '%'
                    }
                },
                x: {
                    ...chartOpts.scales.x,
                    ticks: {
                        ...chartOpts.scales.x.ticks,
                        maxRotation: 45,
                        minRotation: 0
                    }
                }
            }
        }
    });
}
