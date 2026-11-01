import { apiRequest } from "../core/api.js";
import { formatDate, formatCurrency, escapeHTML } from "../core/storage.js";

const STATUSES = ["Solicitada","Em análise","Autorizada","Agendada","Realizada","Faturada","Parcialmente recebida","Recebida","Cancelada","Negada"];
let surgeries = [];
let procedures = [];

export async function renderSurgeries(root) {
  root.innerHTML = `
    <div class="page-heading"><div><div class="eyebrow">ACOMPANHAMENTO ASSISTENCIAL</div><h1>Cirurgias</h1><p class="muted">Registre solicitações e acompanhe autorização, realização e valores.</p></div><button class="button button-primary" id="addSurgery">＋ Registrar cirurgia</button></div>
    <div class="notice"><strong>Ambiente de desenvolvimento.</strong> Utilize somente registros fictícios; não cadastre nomes, documentos ou dados clínicos identificáveis de pacientes.</div>
    <section class="panel"><div class="panel-heading"><div><h2>Registros de cirurgias</h2><p class="muted" id="surgeryCount">Carregando...</p></div><input class="search-input" id="surgerySearch" placeholder="Buscar procedimento ou hospital..." /></div><div id="surgeryList"><div class="empty-state">Carregando cirurgias...</div></div></section>
    <dialog class="modal modal-wide" id="surgeryDialog"><form id="surgeryForm"><div class="modal-heading"><div><div class="eyebrow" id="surgeryEyebrow">NOVO REGISTRO</div><h2 id="surgeryDialogTitle">Registrar cirurgia</h2></div><button type="button" class="icon-button" id="closeSurgery" aria-label="Fechar">×</button></div>
      <div class="form-row"><label>Identificador fictício / código interno<input name="patientRef" maxlength="80" placeholder="Ex.: TESTE-001 (não usar nome real)" /></label><label>Procedimento<select name="procedureId" required><option value="">Carregando procedimentos...</option></select></label></div>
      <div class="form-row"><label>Especialidade<select name="specialty" required><option>Coluna</option><option>Crânio</option><option>Nervos periféricos</option><option>Outros</option></select></label><label>Hospital / unidade<input name="hospital" maxlength="160" placeholder="Hospital" /></label></div>
      <div class="form-row"><label>Origem<select name="payer"><option>Convênio</option><option>SUS</option><option>Particular</option></select></label><label>Status<select name="status">${STATUSES.map(status => `<option>${status}</option>`).join("")}</select></label></div>
      <div class="form-row"><label>Data da solicitação<input type="date" name="requestDate" /></label><label>Data da cirurgia<input type="date" name="date" /></label></div>
      <div class="section-divider">CONTROLE FINANCEIRO</div>
      <div class="form-row"><label>Valor previsto / faturado (R$)<input type="number" name="expectedRevenue" min="0" step="0.01" value="0" required /></label><label>Valor recebido (R$)<input type="number" name="received" min="0" step="0.01" value="0" required /></label></div>
      <label>Observações<textarea name="notes" rows="2" maxlength="5000" placeholder="Informações administrativas sem dados clínicos identificáveis"></textarea></label>
      <div class="modal-actions"><button type="button" class="button button-secondary" id="cancelSurgery">Cancelar</button><button class="button button-primary" type="submit">Salvar registro</button></div>
    </form></dialog>`;

  const dialog = root.querySelector("#surgeryDialog");
  const form = root.querySelector("#surgeryForm");
  root.querySelector("#addSurgery").addEventListener("click", () => openCreateDialog(root));
  root.querySelector("#closeSurgery").addEventListener("click", () => dialog.close());
  root.querySelector("#cancelSurgery").addEventListener("click", () => dialog.close());

  form.addEventListener("submit", async event => {
    event.preventDefault();
    const submit = form.querySelector('[type="submit"]');
    const data = Object.fromEntries(new FormData(form));
    const selectedProcedure = procedures.find(item => item.id === data.procedureId);
    if (!selectedProcedure) {
      window.showToast("Selecione um procedimento cadastrado.");
      return;
    }
    const payload = {
      ...data,
      procedureId: selectedProcedure.id,
      procedure: selectedProcedure.name,
      expectedRevenue: Number(data.expectedRevenue),
      received: Number(data.received)
    };
    const editingId = dialog.dataset.editId;
    submit.disabled = true;
    submit.textContent = editingId ? "Salvando alterações..." : "Salvando...";
    try {
      if (editingId) {
        await apiRequest(`/surgeries/${encodeURIComponent(editingId)}`, { method: "PATCH", body: payload });
      } else {
        await apiRequest("/surgeries", { method: "POST", body: payload });
      }
      dialog.close();
      window.showToast(editingId ? "Cirurgia atualizada." : "Cirurgia registrada no banco de dados.");
      await loadSurgeries(root);
    } catch (error) {
      window.showToast(error.message);
    } finally {
      submit.disabled = false;
      submit.textContent = "Salvar registro";
    }
  });

  root.querySelector("#surgerySearch").addEventListener("input", event => renderList(root, event.target.value));
  await loadFormProcedures(root);
  await loadSurgeries(root);
}

function openCreateDialog(root) {
  const dialog = root.querySelector("#surgeryDialog");
  const form = root.querySelector("#surgeryForm");
  form.reset();
  dialog.dataset.editId = "";
  root.querySelector("#surgeryEyebrow").textContent = "NOVO REGISTRO";
  root.querySelector("#surgeryDialogTitle").textContent = "Registrar cirurgia";
  form.querySelector('[type="submit"]').textContent = "Salvar registro";
  dialog.showModal();
}

function openEditDialog(root, surgeryId) {
  const item = surgeries.find(entry => entry.id === surgeryId);
  if (!item) return;
  const dialog = root.querySelector("#surgeryDialog");
  const form = root.querySelector("#surgeryForm");
  form.reset();
  dialog.dataset.editId = item.id;
  root.querySelector("#surgeryEyebrow").textContent = "EDITAR REGISTRO";
  root.querySelector("#surgeryDialogTitle").textContent = "Editar cirurgia";
  form.elements.patientRef.value = item.patientRef || "";
  form.elements.procedureId.value = item.procedureId || "";
  form.elements.specialty.value = item.specialty || "Coluna";
  form.elements.hospital.value = item.hospital || "";
  form.elements.payer.value = item.payer || "Convênio";
  form.elements.status.value = item.status || "Solicitada";
  form.elements.requestDate.value = item.requestDate || "";
  form.elements.date.value = item.date || "";
  form.elements.expectedRevenue.value = Number(item.expectedRevenue || 0);
  form.elements.received.value = Number(item.received || 0);
  form.elements.notes.value = item.notes || "";
  form.querySelector('[type="submit"]').textContent = "Salvar alterações";
  dialog.showModal();
}

async function loadFormProcedures(root) {
  const select = root.querySelector('[name="procedureId"]');
  try {
    const result = await apiRequest("/procedures");
    procedures = result.procedures || [];
    select.innerHTML = '<option value="">Selecione...</option>' +
      procedures.map(item => `<option value="${escapeHTML(item.id)}">${escapeHTML(item.name)}</option>`).join("");
    if (!procedures.length) {
      select.innerHTML = '<option value="">Cadastre um procedimento primeiro</option>';
      root.querySelector("#addSurgery").disabled = true;
    }
  } catch (error) {
    select.innerHTML = '<option value="">Não foi possível carregar</option>';
    window.showToast(error.message);
  }
}

async function loadSurgeries(root) {
  const list = root.querySelector("#surgeryList");
  if (!list) return;
  list.innerHTML = '<div class="empty-state">Carregando cirurgias...</div>';
  try {
    const result = await apiRequest("/surgeries");
    surgeries = result.surgeries || [];
    renderList(root, root.querySelector("#surgerySearch")?.value || "");
  } catch (error) {
    list.innerHTML = `<div class="empty-state"><strong>Não foi possível carregar as cirurgias</strong><p>${escapeHTML(error.message)}</p></div>`;
    root.querySelector("#surgeryCount").textContent = "Erro ao carregar";
  }
}

function renderList(root, searchTerm = "") {
  const term = searchTerm.toLocaleLowerCase("pt-BR");
  const filtered = surgeries.filter(item =>
    [item.procedure, item.hospital, item.patientRef, item.payer].join(" ").toLocaleLowerCase("pt-BR").includes(term)
  );
  root.querySelector("#surgeryCount").textContent = `${surgeries.length} registro(s)`;
  root.querySelector("#surgeryList").innerHTML = listMarkup(filtered);
  bindActions(root);
  bindStatusChange(root);
}

function listMarkup(items) {
  if (!items.length) return `<div class="empty-state"><div class="empty-icon">✚</div><strong>Nenhuma cirurgia registrada</strong><p>Use o botão “Registrar cirurgia” para criar o primeiro registro de demonstração.</p></div>`;
  return `<div class="table-wrap"><table><thead><tr><th>Procedimento</th><th>Hospital / origem</th><th>Data</th><th>Status</th><th>Recebido</th><th>Ações</th></tr></thead><tbody>${items.map(item => `<tr><td><strong>${escapeHTML(item.procedure)}</strong><small>${escapeHTML(item.patientRef || "Sem identificador")} · ${escapeHTML(item.specialty)}</small></td><td>${escapeHTML(item.hospital || "—")}<small>${escapeHTML(item.payer)}</small></td><td>${formatDate(item.date || item.requestDate)}</td><td><select class="inline-status" data-status-id="${escapeHTML(item.id)}" aria-label="Alterar status">${STATUSES.map(status => `<option ${status === item.status ? "selected" : ""}>${status}</option>`).join("")}</select></td><td>${formatCurrency(item.received)}</td><td><button class="text-button" data-edit-id="${escapeHTML(item.id)}">Editar</button> <button class="text-button danger" data-delete-id="${escapeHTML(item.id)}">Excluir</button></td></tr>`).join("")}</tbody></table></div>`;
}

function bindActions(root) {
  root.querySelectorAll("[data-edit-id]").forEach(button => button.addEventListener("click", () => openEditDialog(root, button.dataset.editId)));
  root.querySelectorAll("[data-delete-id]").forEach(button => button.addEventListener("click", async () => {
    const item = surgeries.find(entry => entry.id === button.dataset.deleteId);
    if (!item) return;
    const confirmed = window.confirm(`Excluir o registro "${item.procedure}"? Essa ação não poderá ser desfeita.`);
    if (!confirmed) return;
    button.disabled = true;
    try {
      await apiRequest(`/surgeries/${encodeURIComponent(item.id)}`, { method: "DELETE" });
      window.showToast("Cirurgia excluída.");
      await loadSurgeries(root);
    } catch (error) {
      button.disabled = false;
      window.showToast(error.message);
    }
  }));
}

function bindStatusChange(root) {
  root.querySelectorAll("[data-status-id]").forEach(select => select.addEventListener("change", async () => {
    const surgeryId = select.dataset.statusId;
    const previous = surgeries.find(item => item.id === surgeryId)?.status;
    select.disabled = true;
    try {
      await apiRequest(`/surgeries/${encodeURIComponent(surgeryId)}/status`, {
        method: "PATCH",
        body: { status: select.value }
      });
      const item = surgeries.find(entry => entry.id === surgeryId);
      if (item) {
        item.status = select.value;
        if (select.value === "Recebida") item.received = Number(item.expectedRevenue) || 0;
      }
      window.showToast("Status atualizado no banco de dados.");
      renderList(root, root.querySelector("#surgerySearch")?.value || "");
    } catch (error) {
      if (previous) select.value = previous;
      window.showToast(error.message);
      select.disabled = false;
    }
  }));
}
