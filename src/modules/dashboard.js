import { apiRequest } from "../core/api.js";
import { formatCurrency, formatDate, escapeHTML } from "../core/storage.js";

export async function renderDashboard(root) {
  root.innerHTML = `
    <div class="page-heading"><div><div class="eyebrow">PAINEL DE CONTROLE</div><h1>Visão geral</h1><p class="muted">Acompanhe sua produção cirúrgica e os cadastros do sistema.</p></div><span class="date-chip">${formatDate(new Date().toISOString().slice(0,10))}</span></div>
    <div class="notice"><strong>Carregando dados...</strong> Consultando os registros da sua organização.</div>
    <div class="stats-grid"><article class="stat-card"><span class="stat-label">Cirurgias cadastradas</span><strong>—</strong></article><article class="stat-card"><span class="stat-label">Solicitadas</span><strong>—</strong></article><article class="stat-card"><span class="stat-label">Realizadas</span><strong>—</strong></article><article class="stat-card"><span class="stat-label">Recebido</span><strong>—</strong></article></div>
    <div class="dashboard-grid"><section class="panel"><div class="panel-heading"><div><h2>Cirurgias recentes</h2><p class="muted">Últimos registros adicionados</p></div><button class="button button-secondary button-small" data-action="go-surgeries">Ver todas</button></div><div class="empty-state">Carregando...</div></section><section class="panel quick-panel"><h2>Acesso rápido</h2><p class="muted">Cadastros essenciais da primeira versão.</p><button class="quick-link" data-action="new-surgery"><span class="quick-icon">＋</span><span><strong>Registrar cirurgia</strong><small>Adicionar solicitação ou procedimento</small></span><b>→</b></button><button class="quick-link" data-action="new-procedure"><span class="quick-icon">▤</span><span><strong>Cadastrar procedimento</strong><small>Montar sua biblioteca cirúrgica</small></span><b>→</b></button><div class="mini-summary"><span>Procedimentos na biblioteca</span><strong>—</strong></div><div class="mini-summary"><span>Valores previstos a receber*</span><strong>—</strong></div><small class="muted">*Indicador baseado nos valores preenchidos.</small></section></div>`;

  try {
    const [surgeryResult, procedureResult] = await Promise.all([
      apiRequest("/surgeries"),
      apiRequest("/procedures")
    ]);
    const surgeries = surgeryResult.surgeries || [];
    const procedures = procedureResult.procedures || [];
    const count = status => surgeries.filter(item => item.status === status).length;
    const received = surgeries.reduce((sum, item) => {
      const amount = Number(item.received) || 0;
      const expected = Number(item.expectedRevenue) || 0;
      return sum + (item.status === "Recebida" ? Math.max(amount, expected) : amount);
    }, 0);
    const pending = surgeries.reduce((sum, item) => {
      if (["Recebida", "Cancelada", "Negada"].includes(item.status)) return sum;
      return sum + Math.max(0, (Number(item.expectedRevenue) || 0) - (Number(item.received) || 0));
    }, 0);
    const recent = [...surgeries].sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || "")).slice(0, 5);

    root.innerHTML = `
      <div class="page-heading"><div><div class="eyebrow">PAINEL DE CONTROLE</div><h1>Visão geral</h1><p class="muted">Acompanhe sua produção cirúrgica e os cadastros do sistema.</p></div><span class="date-chip">${formatDate(new Date().toISOString().slice(0,10))}</span></div>
      <div class="notice"><strong>Ambiente de desenvolvimento.</strong> Os dados são consultados no banco de dados da sua organização. Utilize somente registros fictícios.</div>
      <div class="stats-grid">
        <article class="stat-card"><span class="stat-label">Cirurgias cadastradas</span><strong>${surgeries.length}</strong><span class="stat-foot">Todos os registros</span></article>
        <article class="stat-card"><span class="stat-label">Solicitadas</span><strong>${count("Solicitada")}</strong><span class="stat-foot">Aguardando andamento</span></article>
        <article class="stat-card"><span class="stat-label">Realizadas</span><strong>${count("Realizada")}</strong><span class="stat-foot">Procedimentos concluídos</span></article>
        <article class="stat-card"><span class="stat-label">Recebido</span><strong>${formatCurrency(received)}</strong><span class="stat-foot">Valores informados manualmente</span></article>
      </div>
      <div class="dashboard-grid">
        <section class="panel"><div class="panel-heading"><div><h2>Cirurgias recentes</h2><p class="muted">Últimos registros adicionados</p></div><button class="button button-secondary button-small" data-action="go-surgeries">Ver todas</button></div>
          ${recent.length ? `<div class="table-wrap"><table><thead><tr><th>Procedimento</th><th>Data</th><th>Status</th></tr></thead><tbody>${recent.map(item => `<tr><td><strong>${escapeHTML(item.procedure)}</strong><small>${escapeHTML(item.hospital || "Hospital não informado")}</small></td><td>${formatDate(item.date || item.requestDate)}</td><td><span class="status-badge">${escapeHTML(item.status)}</span></td></tr>`).join("")}</tbody></table></div>` : `<div class="empty-state"><div class="empty-icon">✚</div><strong>Nenhuma cirurgia cadastrada</strong><p>Comece registrando uma cirurgia para alimentar seu painel.</p><button class="button button-primary" data-action="new-surgery">Cadastrar cirurgia</button></div>`}
        </section>
        <section class="panel quick-panel"><h2>Acesso rápido</h2><p class="muted">Cadastros essenciais da primeira versão.</p><button class="quick-link" data-action="new-surgery"><span class="quick-icon">＋</span><span><strong>Registrar cirurgia</strong><small>Adicionar solicitação ou procedimento</small></span><b>→</b></button><button class="quick-link" data-action="new-procedure"><span class="quick-icon">▤</span><span><strong>Cadastrar procedimento</strong><small>Montar sua biblioteca cirúrgica</small></span><b>→</b></button><div class="mini-summary"><span>Procedimentos na biblioteca</span><strong>${procedures.length}</strong></div><div class="mini-summary"><span>Valores previstos a receber*</span><strong>${formatCurrency(pending)}</strong></div><small class="muted">*Indicador baseado nos valores preenchidos.</small></section>
      </div>`;
  } catch (error) {
    root.innerHTML = `
      <div class="page-heading"><div><div class="eyebrow">PAINEL DE CONTROLE</div><h1>Visão geral</h1><p class="muted">Acompanhe sua produção cirúrgica e os cadastros do sistema.</p></div></div>
      <section class="panel"><div class="empty-state"><strong>Não foi possível atualizar a Visão Geral</strong><p>${escapeHTML(error.message)}</p><button class="button button-primary" id="retryDashboard">Tentar novamente</button></div></section>`;
    root.querySelector("#retryDashboard")?.addEventListener("click", () => renderDashboard(root));
  }
}
