import { readCollection, writeCollection, createId, formatDate, formatCurrency, escapeHTML } from "../core/storage.js";

const STATUSES = ["Solicitada","Em análise","Autorizada","Agendada","Realizada","Faturada","Parcialmente recebida","Recebida","Cancelada","Negada"];

export function renderSurgeries(root) {
  const items = readCollection("surgeries");
  const procedures = readCollection("procedures");
  root.innerHTML = `
    <div class="page-heading"><div><div class="eyebrow">ACOMPANHAMENTO ASSISTENCIAL</div><h1>Cirurgias</h1><p class="muted">Registre solicitações e acompanhe autorização, realização e valores.</p></div><button class="button button-primary" id="addSurgery">＋ Registrar cirurgia</button></div>
    <div class="notice"><strong>Dados fictícios apenas.</strong> Este protótipo salva informações no armazenamento local do navegador e não possui autenticação ou proteção clínica. Não cadastre pacientes reais.</div>
    <section class="panel"><div class="panel-heading"><div><h2>Registros de cirurgias</h2><p class="muted">${items.length} registro(s)</p></div><input class="search-input" id="surgerySearch" placeholder="Buscar procedimento ou hospital..." /></div><div id="surgeryList">${listMarkup(items)}</div></section>
    <dialog class="modal modal-wide" id="surgeryDialog"><form id="surgeryForm" method="dialog"><div class="modal-heading"><div><div class="eyebrow">NOVO REGISTRO</div><h2>Registrar cirurgia</h2></div><button type="button" class="icon-button" id="closeSurgery" aria-label="Fechar">×</button></div>
      <div class="form-row"><label>Identificador fictício / código interno<input name="patientRef" placeholder="Ex.: TESTE-001 (não usar nome real)" /></label><label>Procedimento<select name="procedure" required><option value="">Selecione...</option>${procedures.map(item => `<option value="${escapeHTML(item.name)}">${escapeHTML(item.name)}</option>`).join("")}<option value="Outro procedimento">Outro procedimento / não cadastrado</option></select></label></div>
      <div class="form-row"><label>Especialidade<select name="specialty"><option>Coluna</option><option>Crânio</option><option>Nervos periféricos</option><option>Outros</option></select></label><label>Hospital / unidade<input name="hospital" placeholder="Hospital" /></label></div>
      <div class="form-row"><label>Origem<select name="payer"><option>Convênio</option><option>SUS</option><option>Particular</option></select></label><label>Status<select name="status">${STATUSES.map(status => `<option>${status}</option>`).join("")}</select></label></div>
      <div class="form-row"><label>Data da solicitação<input type="date" name="requestDate" /></label><label>Data da cirurgia<input type="date" name="date" /></label></div>
      <div class="section-divider">CONTROLE FINANCEIRO INICIAL</div>
      <div class="form-row"><label>Valor previsto / faturado (R$)<input type="number" name="expectedRevenue" min="0" step="0.01" value="0" /></label><label>Valor recebido (R$)<input type="number" name="received" min="0" step="0.01" value="0" /></label></div>
      <label>Observações<textarea name="notes" rows="2" placeholder="Informações administrativas sem dados clínicos identificáveis"></textarea></label>
      <div class="modal-actions"><button type="button" class="button button-secondary" id="cancelSurgery">Cancelar</button><button class="button button-primary" type="submit">Salvar registro</button></div>
    </form></dialog>`;

  const dialog = root.querySelector("#surgeryDialog");
  root.querySelector("#addSurgery").addEventListener("click", () => dialog.showModal());
  root.querySelector("#closeSurgery").addEventListener("click", () => dialog.close());
  root.querySelector("#cancelSurgery").addEventListener("click", () => dialog.close());
  root.querySelector("#surgeryForm").addEventListener("submit", event => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    const current = readCollection("surgeries");
    current.push({ id: createId(), ...data, expectedRevenue: Number(data.expectedRevenue), received: Number(data.received), createdAt: new Date().toISOString() });
    writeCollection("surgeries", current);
    dialog.close();
    renderSurgeries(root);
    window.showToast("Registro de cirurgia salvo.");
  });
  root.querySelector("#surgerySearch").addEventListener("input", event => {
    const term = event.target.value.toLocaleLowerCase("pt-BR");
    const filtered = readCollection("surgeries").filter(item => [item.procedure,item.hospital,item.patientRef,item.payer].join(" ").toLocaleLowerCase("pt-BR").includes(term));
    root.querySelector("#surgeryList").innerHTML = listMarkup(filtered);
    bindStatusChange(root);
  });
  bindStatusChange(root);
}

function listMarkup(items) {
  if (!items.length) return `<div class="empty-state"><div class="empty-icon">✚</div><strong>Nenhuma cirurgia registrada</strong><p>Use o botão “Registrar cirurgia” para criar o primeiro registro de demonstração.</p></div>`;
  return `<div class="table-wrap"><table><thead><tr><th>Procedimento</th><th>Hospital / origem</th><th>Data</th><th>Status</th><th>Recebido</th></tr></thead><tbody>${items.map(item => `<tr><td><strong>${escapeHTML(item.procedure)}</strong><small>${escapeHTML(item.patientRef || "Sem identificador")} · ${escapeHTML(item.specialty)}</small></td><td>${escapeHTML(item.hospital || "—")}<small>${escapeHTML(item.payer)}</small></td><td>${formatDate(item.date || item.requestDate)}</td><td><select class="inline-status" data-status-id="${item.id}" aria-label="Alterar status">${STATUSES.map(status => `<option ${status === item.status ? "selected" : ""}>${status}</option>`).join("")}</select></td><td>${formatCurrency(item.received)}</td></tr>`).join("")}</tbody></table></div>`;
}

function bindStatusChange(root) {
  root.querySelectorAll("[data-status-id]").forEach(select => select.addEventListener("change", () => {
    const items = readCollection("surgeries");
    const item = items.find(entry => entry.id === select.dataset.statusId);
    if (item) { item.status = select.value; writeCollection("surgeries", items); window.showToast("Status atualizado."); }
  }));
}