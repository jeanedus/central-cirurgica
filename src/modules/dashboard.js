import { readCollection, formatCurrency, formatDate, escapeHTML } from "../core/storage.js";

export function renderDashboard(root) {
  const surgeries = readCollection("surgeries");
  const procedures = readCollection("procedures");
  const count = status => surgeries.filter(item => item.status === status).length;
  const received = surgeries.reduce((sum, item) => sum + (Number(item.received) || 0), 0);
  const pending = surgeries.reduce((sum, item) => sum + Math.max(0, (Number(item.expectedRevenue) || 0) - (Number(item.received) || 0)), 0);
  const recent = [...surgeries].sort((a,b) => (b.createdAt || "").localeCompare(a.createdAt || "")).slice(0,5);

  root.innerHTML = `
    <div class="page-heading"><div><div class="eyebrow">PAINEL DE CONTROLE</div><h1>Visão geral</h1><p class="muted">Acompanhe sua produção cirúrgica e os cadastros do sistema.</p></div><span class="date-chip">${formatDate(new Date().toISOString().slice(0,10))}</span></div>
    <div class="notice"><strong>Versão de demonstração.</strong> Os dados ficam somente neste navegador. Não insira dados reais ou identificáveis de pacientes.</div>
    <div class="stats-grid">
      <article class="stat-card"><span class="stat-label">Cirurgias cadastradas</span><strong>${surgeries.length}</strong><span class="stat-foot">Todos os registros</span></article>
      <article class="stat-card"><span class="stat-label">Solicitadas</span><strong>${count("Solicitada")}</strong><span class="stat-foot">Aguardando andamento</span></article>
      <article class="stat-card"><span class="stat-label">Realizadas</span><strong>${count("Realizada")}</strong><span class="stat-foot">Procedimentos concluídos</span></article>
      <article class="stat-card"><span class="stat-label">Recebido (registros)</span><strong>${formatCurrency(received)}</strong><span class="stat-foot">Valores informados manualmente</span></article>
    </div>
    <div class="dashboard-grid">
      <section class="panel"><div class="panel-heading"><div><h2>Cirurgias recentes</h2><p class="muted">Últimos registros adicionados</p></div><button class="button button-secondary button-small" data-action="go-surgeries">Ver todas</button></div>
        ${recent.length ? `<div class="table-wrap"><table><thead><tr><th>Procedimento</th><th>Data</th><th>Status</th></tr></thead><tbody>${recent.map(item => `<tr><td><strong>${escapeHTML(item.procedure)}</strong><small>${escapeHTML(item.hospital || "Hospital não informado")}</small></td><td>${formatDate(item.date)}</td><td><span class="status-badge">${escapeHTML(item.status)}</span></td></tr>`).join("")}</tbody></table></div>` : `<div class="empty-state"><div class="empty-icon">✚</div><strong>Nenhuma cirurgia cadastrada</strong><p>Comece registrando uma cirurgia para alimentar seu painel.</p><button class="button button-primary" data-action="new-surgery">Cadastrar cirurgia</button></div>`}
      </section>
      <section class="panel quick-panel"><h2>Acesso rápido</h2><p class="muted">Cadastros essenciais da primeira versão.</p><button class="quick-link" data-action="new-surgery"><span class="quick-icon">＋</span><span><strong>Registrar cirurgia</strong><small>Adicionar solicitação ou procedimento</small></span><b>→</b></button><button class="quick-link" data-action="new-procedure"><span class="quick-icon">▤</span><span><strong>Cadastrar procedimento</strong><small>Montar sua biblioteca cirúrgica</small></span><b>→</b></button><div class="mini-summary"><span>Procedimentos na biblioteca</span><strong>${procedures.length}</strong></div><div class="mini-summary"><span>Valores previstos a receber*</span><strong>${formatCurrency(pending)}</strong></div><small class="muted">*Indicador demonstrativo baseado nos valores preenchidos.</small></section>
    </div>`;
}