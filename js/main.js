// ═══════════════════════════════════════════════════════════════════════
// TechStore Analytics - Lógica Principal
// ═══════════════════════════════════════════════════════════════════════

let currentPeriod = '6m';
let compareMode = false;
let comparePeriod1 = '6m';
let comparePeriod2 = '12m';
let chartInstances = {};
let categoryFilter = null;

const fmt = {
    currency: (v) => new Intl.NumberFormat('pt-BR', {style: 'currency', currency: 'BRL'}).format(v),
    number: (v) => new Intl.NumberFormat('pt-BR').format(v)
};

// ═══════════════════════════════════════════════════════════════════════
// FUNÇÕES DE FILTRO
// ═══════════════════════════════════════════════════════════════════════

function getFilteredData(period) {
    const evolucao = data.evolucao;
    if (period === '6m') return evolucao.slice(-6);
    if (period === '12m') return evolucao.slice(-12);
    return evolucao;
}

function calculateKPIs(filtered) {
    const receita = filtered.reduce((sum, d) => sum + d.receita, 0);
    const lucro = filtered.reduce((sum, d) => sum + d.lucro, 0);
    return { receita, lucro, margem: (lucro / receita * 100) };
}

function updateKPIs(period) {
    const filtered = getFilteredData(period);
    const kpis = calculateKPIs(filtered);

    document.getElementById('kpi-revenue').textContent = fmt.currency(kpis.receita);
    document.getElementById('kpi-profit').textContent = fmt.currency(kpis.lucro);
    document.getElementById('kpi-margin').textContent = kpis.margem.toFixed(1) + '%';
    document.getElementById('kpi-periods').textContent = filtered.length;

    const inicio = filtered[0].periodo;
    const fim = filtered[filtered.length - 1].periodo;
    document.getElementById('periodInfo').textContent = `Dashboard executivo | ${inicio} - ${fim} | ${filtered.length} meses`;
}

function destroyCharts() {
    Object.values(chartInstances).forEach(c => c?.destroy());
    chartInstances = {};
}

function filterPeriod(period, btn) {
    document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentPeriod = period;
    compareMode = false;
    document.querySelectorAll('.kpi-comparison').forEach(el => el.textContent = '');
    updateKPIs(period);
    destroyCharts();
    initCharts();
}

function applyCategoryFilter(category) {
    categoryFilter = category;
    document.getElementById('filterBadge').style.display = 'flex';
    document.getElementById('filterName').textContent = `📁 ${category}`;
    destroyCharts();
    initCharts();
}

function clearCategoryFilter() {
    categoryFilter = null;
    document.getElementById('filterBadge').style.display = 'none';
    destroyCharts();
    initCharts();
}

// ═══════════════════════════════════════════════════════════════════════
// MODAIS
// ═══════════════════════════════════════════════════════════════════════

function openCompareModal() {
    document.getElementById('compareModal').classList.add('active');
}

function openExportModal() {
    document.getElementById('exportModal').classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

function updateComparison() {
    comparePeriod1 = document.getElementById('comparePeriod1').value;
    comparePeriod2 = document.getElementById('comparePeriod2').value;

    const filtered1 = getFilteredData(comparePeriod1);
    const filtered2 = getFilteredData(comparePeriod2);
    const kpis1 = calculateKPIs(filtered1);
    const kpis2 = calculateKPIs(filtered2);

    const receitaDiff = kpis1.receita - kpis2.receita;
    const lucroFiff = kpis1.lucro - kpis2.lucro;
    const marginDiff = kpis1.margem - kpis2.margem;

    let html = `
        <strong>Comparação:</strong><br>
        Receita: ${fmt.currency(receitaDiff)} (${((receitaDiff/kpis2.receita)*100).toFixed(1)}%)<br>
        Lucro: ${fmt.currency(lucroFiff)} (${((lucroFiff/kpis2.lucro)*100).toFixed(1)}%)<br>
        Margem: ${marginDiff.toFixed(2)}% (${marginDiff > 0 ? '+' : ''}${marginDiff.toFixed(2)}pp)
    `;
    document.getElementById('comparisonInfo').innerHTML = html;

    compareMode = true;
    compareKPIs(kpis1, kpis2);
    destroyCharts();
    initCharts();
}

function compareKPIs(kpis1, kpis2) {
    const receitaDiff = ((kpis1.receita - kpis2.receita) / kpis2.receita * 100).toFixed(1);
    const lucroDiff = ((kpis1.lucro - kpis2.lucro) / kpis2.lucro * 100).toFixed(1);
    const marginDiff = (kpis1.margem - kpis2.margem).toFixed(2);

    document.getElementById('kpi-revenue-comp').textContent = `vs período: ${receitaDiff > 0 ? '+' : ''}${receitaDiff}%`;
    document.getElementById('kpi-profit-comp').textContent = `vs período: ${lucroDiff > 0 ? '+' : ''}${lucroDiff}%`;
    document.getElementById('kpi-margin-comp').textContent = `vs período: ${marginDiff > 0 ? '+' : ''}${marginDiff}pp`;
}

// ═══════════════════════════════════════════════════════════════════════
// EXPORTAÇÃO
// ═══════════════════════════════════════════════════════════════════════

function exportReport() {
    const format = document.getElementById('exportFormat').value;
    
    if (format === 'pdf') {
        exportPDF();
    } else if (format === 'csv') {
        exportCSV();
    } else if (format === 'json') {
        exportJSON();
    }
    
    closeModal('exportModal');
}

function exportPDF() {
    const element = document.querySelector('.container');
    const opt = {
        margin: 10,
        filename: 'TechStore_Relatorio_' + new Date().toISOString().split('T')[0] + '.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
    };
    html2pdf().set(opt).from(element).save();
}

function exportCSV() {
    let csv = 'TechStore Brasil - Relatório de Vendas\n';
    csv += 'Período: ' + document.getElementById('periodInfo').textContent + '\n\n';
    csv += 'ANÁLISE MENSAL\n';
    csv += 'Período,Receita,Custo,Lucro,Margem,Crescimento\n';
    
    data.evolucao.forEach((mes, i) => {
        const anterior = i > 0 ? data.evolucao[i - 1] : null;
        const cresc = anterior ? ((mes.receita - anterior.receita) / anterior.receita * 100) : 0;
        const custo = mes.receita - mes.lucro;
        csv += `${mes.periodo},${mes.receita},${custo},${mes.lucro},${(mes.lucro/mes.receita*100).toFixed(2)}%,${cresc.toFixed(2)}%\n`;
    });

    csv += '\n\nTOP PRODUTOS\n';
    csv += 'Ranking,Produto,Quantidade,Receita\n';
    data.produtos.forEach((p, i) => {
        csv += `${i+1},${p.nome},${p.quantidade},${p.receita}\n`;
    });

    csv += '\n\nTOP VENDEDORES\n';
    csv += 'Ranking,Vendedor,Receita\n';
    data.vendedores.forEach((v, i) => {
        csv += `${i+1},${v.nome},${v.receita}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'TechStore_Relatorio_' + new Date().toISOString().split('T')[0] + '.csv';
    link.click();
}

function exportJSON() {
    const json = JSON.stringify({
        periodo: document.getElementById('periodInfo').textContent,
        data: data,
        exportDate: new Date().toISOString()
    }, null, 2);

    const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'TechStore_Dados_' + new Date().toISOString().split('T')[0] + '.json';
    link.click();
}

// ═══════════════════════════════════════════════════════════════════════
// RENDERING
// ═══════════════════════════════════════════════════════════════════════

function renderProducts() {
    document.getElementById('productsContainer').innerHTML = data.produtos.map((p, i) => {
        const rankClass = i < 3 ? `top-${i + 1}` : '';
        return `<div class="product-card"><div class="product-rank ${rankClass}">${i+1}</div><div class="product-name">${p.nome}</div><div class="product-stats"><div><div class="stat-label">Vendidas</div><div class="stat-value">${fmt.number(p.quantidade)}</div></div><div><div class="stat-label">Receita</div><div class="stat-value">${fmt.currency(p.receita)}</div></div></div></div>`;
    }).join('');
}

function renderSellers() {
    const maxRev = Math.max(...data.vendedores.map(v => v.receita));
    document.getElementById('sellersContainer').innerHTML = data.vendedores.map((v, i) => {
        const initials = v.nome.split(' ').map(n => n[0]).join('');
        const pct = (v.receita / maxRev) * 100;
        return `<div class="seller-item"><div class="seller-avatar">${initials}</div><div class="seller-info"><div class="seller-name">${v.nome}</div><div class="seller-revenue">${fmt.currency(v.receita)}</div></div><div class="seller-bar"><div class="seller-bar-fill" style="width:${pct}%"></div></div><div class="seller-rank">#${i+1}</div></div>`;
    }).join('');
}

function renderTable() {
    document.getElementById('tableBody').innerHTML = data.evolucao.map((mes, i) => {
        const anterior = i > 0 ? data.evolucao[i - 1] : null;
        const cresc = anterior ? ((mes.receita - anterior.receita) / anterior.receita * 100) : 0;
        const custo = mes.receita - mes.lucro;
        const marg = (mes.lucro / mes.receita * 100).toFixed(1);
        return `<tr><td><strong>${mes.periodo}</strong></td><td>${fmt.currency(mes.receita)}</td><td>${fmt.currency(custo)}</td><td>${fmt.currency(mes.lucro)}</td><td>${marg}%</td><td><span class="badge ${cresc>0?'':'down'}">${cresc>0?'↗':'↘'} ${Math.abs(cresc).toFixed(1)}%</span></td></tr>`;
    }).join('');
}

// ═══════════════════════════════════════════════════════════════════════
// INICIALIZAÇÃO
// ═══════════════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
    initCharts();
    renderProducts();
    renderSellers();
    renderTable();
});

window.addEventListener('click', (e) => {
    if (e.target.id === 'compareModal') closeModal('compareModal');
    if (e.target.id === 'exportModal') closeModal('exportModal');
});
