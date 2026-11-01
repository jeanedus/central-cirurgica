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
    </form></dialog>
    <dialog class="modal modal-wide" id="materialsDialog">
      <div class="modal-heading"><div><div class="eyebrow">MATERIAIS DA CIRURGIA</div><h2 id="materialsTitle">OPME e materiais</h2><p class="muted" id="materialsSubtitle"></p></div><button type="button" class="icon-button" id="closeMaterials" aria-label="Fechar">×</button></div>
      <div class="panel-heading"><div><strong id="materialsTotal">Total: R$ 0,00</strong><p class="muted">Valores estimados com base na quantidade e no preço unitário.</p></div><button type="button" class="button button-primary" id="addMaterial">＋ Adicionar material</button></div>
      <div id="materialsList"><div class="empty-state">Carregando materiais...</div></div>
    </dialog>
    <dialog class="modal modal-wide" id="materialFormDialog">
      <form id="materialForm">
        <div class="modal-heading"><div><div class="eyebrow" id="materialEyebrow">NOVO ITEM</div><h2 id="materialFormTitle">Adicionar material</h2></div><button type="button" class="icon-button" id="closeMaterialForm" aria-label="Fechar">×</button></div>
        <div class="form-row"><label>Categoria<select name="category"><option>OPME</option><option>Implante</option><option>Instrumental</option><option>Descartável</option><option>Outro</option></select></label><label>Descrição do material<input name="description" required maxlength="240" placeholder="Ex.: Parafuso pedicular poliaxial" /></label></div>
        <div class="form-row"><label>Fabricante<input name="manufacturer" maxlength="160" /></label><label>Fornecedor / distribuidor<input name="supplier" maxlength="160" /></label></div>
        <div class="form-row"><label>Código / referência<input name="referenceCode" maxlength="120" /></label><label>Status de autorização<select name="authorizationStatus"><option>Pendente</option><option>Autorizado</option><option>Parcialmente autorizado</option><option>Negado</option></select></label></div>
        <div class="form-row"><label>Quantidade<input name="quantity" type="number" min="1" step="1" value="1" required /></label><label>Valor unitário (R$)<input name="unitPrice" type="number" min="0" step="0.01" value="0" required /></label></div>
        <label>Observações<textarea name="notes" rows="2" maxlength="3000"></textarea></label>
        <div class="modal-actions"><button type="button" class="button button-secondary" id="cancelMaterial">Cancelar</button><button class="button button-primary" type="submit">Salvar material</button></div>
      </form>
    </dialog>`;

  const dialog = root.querySelector("#surgeryDialog");
  const materialsDialog = root.querySelector("#materialsDialog");
  const materialFormDialog = root.querySelector("#materialFormDialog");
  const form = root.querySelector("#surgeryForm");
  root.querySelector("#addSurgery").addEventListener("click", () => openCreateDialog(root));
  root.querySelector("#closeSurgery").addEventListener("click", () => dialog.close());
  root.querySelector("#cancelSurgery").addEventListener("click", () => dialog.close());
  root.querySelector("#closeMaterials").addEventListener("click", () => materialsDialog.close());
  root.querySelector("#addMaterial").addEventListener("click", () => openMaterialForm(root));
  root.querySelector("#closeMaterialForm").addEventListener("click", () => materialFormDialog.close());
  root.querySelector("#cancelMaterial").addEventListener("click", () => materialFormDialog.close());

  root.querySelector("#materialForm").addEventListener("submit", async event => {
    event.preventDefault();
    const materialForm = event.currentTarget;
    const submit = materialForm.querySelector('[type="submit"]');
    const data = Object.fromEntries(new FormData(materialForm));
    const payload = { ...data, quantity: Number(data.quantity), unitPrice: Number(data.unitPrice) };
    const editingId = materialFormDialog.dataset.editId;
    submit.disabled = true;
    submit.textContent = "Salvando...";
    try {
      const activeSurgeryId = materialsDialog.dataset.surgeryId;
      if (!activeSurgeryId) throw new Error("Selecione uma cirurgia antes de cadastrar materiais.");
      const base = `/surgeries/${encodeURIComponent(activeSurgeryId)}/materials`;
      if (editingId) await apiRequest(`${base}/${encodeURIComponent(editingId)}`, { method: "PATCH", body: payload });
      else await apiRequest(base, { method: "POST", body: payload });
      materialFormDialog.close();
      window.showToast(editingId ? "Material atualizado." : "Material adicionado.");
      await loadMaterials(root);
    } catch (error) {
      window.showToast(error.message);
    } finally {
      submit.disabled = false;
      submit.textContent = "Salvar material";
    }
  });

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
  return `<div class="table-wrap"><table><thead><tr><th>Procedimento</th><th>Hospital / origem</th><th>Data</th><th>Status</th><th>Recebido</th><th>Ações</th></tr></thead><tbody>${items.map(item => `<tr><td><strong>${escapeHTML(item.procedure)}</strong><small>${escapeHTML(item.patientRef || "Sem identificador")} · ${escapeHTML(item.specialty)}</small></td><td>${escapeHTML(item.hospital || "—")}<small>${escapeHTML(item.payer)}</small></td><td>${formatDate(item.date || item.requestDate)}</td><td><select class="inline-status" data-status-id="${escapeHTML(item.id)}" aria-label="Alterar status">${STATUSES.map(status => `<option ${status === item.status ? "selected" : ""}>${status}</option>`).join("")}</select></td><td>${formatCurrency(item.received)}</td><td><button class="text-button" data-materials-id="${escapeHTML(item.id)}">OPME</button> <button class="text-button" data-edit-id="${escapeHTML(item.id)}">Editar</button> <button class="text-button danger" data-delete-id="${escapeHTML(item.id)}">Excluir</button></td></tr>`).join("")}</tbody></table></div>`;
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


let surgeryMaterials = [];

async function openMaterialsDialog(root, surgeryId) {
  const surgery = surgeries.find(item => item.id === surgeryId);
  if (!surgery) return;
  root.querySelector("#materialsDialog").dataset.surgeryId = surgeryId;
  root.querySelector("#materialsTitle").textContent = "OPME e materiais";
  root.querySelector("#materialsSubtitle").textContent = surgery.procedure + " · " + (surgery.hospital || "Hospital não informado");
  root.querySelector("#materialsDialog").showModal();
  await loadMaterials(root);
}

async function loadMaterials(root) {
  const dialog = root.querySelector("#materialsDialog");
  const surgeryId = dialog.dataset.surgeryId;
  if (!surgeryId) return;
  const list = root.querySelector("#materialsList");
  list.innerHTML = '<div class="empty-state">Carregando materiais...</div>';
  try {
    const result = await apiRequest(`/surgeries/${encodeURIComponent(surgeryId)}/materials`);
    surgeryMaterials = result.materials || [];
    renderMaterialsList(root);
  } catch (error) {
    list.innerHTML = `<div class="empty-state">${escapeHTML(error.message)}</div>`;
  }
}

function renderMaterialsList(root) {
  const list = root.querySelector("#materialsList");
  const total = surgeryMaterials.reduce((sum, item) => sum + Number(item.totalPrice || 0), 0);
  root.querySelector("#materialsTotal").textContent = "Total: " + formatCurrency(total);
  if (!surgeryMaterials.length) {
    list.innerHTML = '<div class="empty-state"><div class="empty-icon">＋</div><strong>Nenhum material cadastrado</strong><p>Adicione OPME, implantes e outros materiais utilizados ou solicitados nesta cirurgia.</p></div>';
    return;
  }
  list.innerHTML = `<div class="table-wrap"><table><thead><tr><th>Material</th><th>Qtd.</th><th>Unitário</th><th>Total</th><th>Autorização</th><th>Ações</th></tr></thead><tbody>${surgeryMaterials.map(item => `<tr><td><strong>${escapeHTML(item.description)}</strong><small>${escapeHTML(item.category)} · ${escapeHTML(item.manufacturer || "Fabricante não informado")} · Ref.: ${escapeHTML(item.referenceCode || "—")}</small></td><td>${Number(item.quantity)}</td><td>${formatCurrency(item.unitPrice)}</td><td><strong>${formatCurrency(item.totalPrice)}</strong></td><td><span class="status-badge">${escapeHTML(item.authorizationStatus)}</span></td><td><button class="text-button" data-edit-material="${escapeHTML(item.id)}">Editar</button> <button class="text-button danger" data-delete-material="${escapeHTML(item.id)}">Excluir</button></td></tr>`).join("")}</tbody></table></div>`;
  list.querySelectorAll("[data-edit-material]").forEach(button => button.addEventListener("click", () => openMaterialForm(root, button.dataset.editMaterial)));
  list.querySelectorAll("[data-delete-material]").forEach(button => button.addEventListener("click", async () => {
    const item = surgeryMaterials.find(entry => entry.id === button.dataset.deleteMaterial);
    if (!item || !window.confirm(`Excluir o material "${item.description}"?`)) return;
    button.disabled = true;
    try {
      await apiRequest(`/surgeries/${encodeURIComponent(root.querySelector("#materialsDialog").dataset.surgeryId)}/materials/${encodeURIComponent(item.id)}`, { method: "DELETE" });
      window.showToast("Material excluído.");
      await loadMaterials(root);
    } catch (error) {
      button.disabled = false;
      window.showToast(error.message);
    }
  }));
}

function openMaterialForm(root, materialId = "") {
  const dialog = root.querySelector("#materialFormDialog");
  const form = root.querySelector("#materialForm");
  form.reset();
  dialog.dataset.editId = materialId;
  const item = surgeryMaterials.find(entry => entry.id === materialId);
  root.querySelector("#materialEyebrow").textContent = item ? "EDITAR ITEM" : "NOVO ITEM";
  root.querySelector("#materialFormTitle").textContent = item ? "Editar material" : "Adicionar material";
  if (item) {
    form.elements.category.value = item.category || "OPME";
    form.elements.description.value = item.description || "";
    form.elements.manufacturer.value = item.manufacturer || "";
    form.elements.supplier.value = item.supplier || "";
    form.elements.referenceCode.value = item.referenceCode || "";
    form.elements.authorizationStatus.value = item.authorizationStatus || "Pendente";
    form.elements.quantity.value = item.quantity || 1;
    form.elements.unitPrice.value = Number(item.unitPrice || 0);
    form.elements.notes.value = item.notes || "";
  }
  form.querySelector('[type="submit"]').textContent = item ? "Salvar alterações" : "Salvar material";
  dialog.showModal();
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
