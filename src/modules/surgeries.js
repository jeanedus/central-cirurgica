import { apiRequest } from "../core/api.js";
import { formatDate, formatCurrency, escapeHTML } from "../core/storage.js";
import { getSpineCodingSuggestions } from "../data/spine-coding-rules.js";

const STATUSES = ["Solicitada","Em análise","Autorizada","Agendada","Realizada","Faturada","Parcialmente recebida","Recebida","Cancelada","Negada"];
let surgeries = [];
let procedures = [];

export async function renderSurgeries(root) {
  root.innerHTML = `
    <div class="page-heading"><div><div class="eyebrow">ACOMPANHAMENTO ASSISTENCIAL</div><h1>Cirurgias</h1><p class="muted">Registre solicitações e acompanhe autorização, realização e valores.</p></div><button class="button button-primary" id="addSurgery">＋ Registrar cirurgia</button></div>
    <div class="notice"><strong>Ambiente de desenvolvimento.</strong> Utilize somente registros fictícios; não cadastre nomes, documentos ou dados clínicos identificáveis de pacientes.</div>
    <section class="panel"><div class="panel-heading"><div><h2>Registros de cirurgias</h2><p class="muted" id="surgeryCount">Carregando...</p></div><input class="search-input" id="surgerySearch" placeholder="Buscar procedimento ou hospital..." /></div><div id="surgeryList"><div class="empty-state">Carregando cirurgias...</div></div></section>
    <dialog class="modal modal-wide" id="surgeryDialog"><form id="surgeryForm"><div class="modal-heading"><div><div class="eyebrow" id="surgeryEyebrow">NOVO REGISTRO</div><h2 id="surgeryDialogTitle">Registrar cirurgia</h2></div><button type="button" class="icon-button" id="closeSurgery" aria-label="Fechar">×</button></div>
      <div class="form-row"><label>Identificador fictício / código interno<input name="patientRef" maxlength="80" placeholder="Ex.: TESTE-001 (não usar nome real)" /></label><label>Vincular à biblioteca (opcional)<select name="procedureId"><option value="">Gerar a partir dos dados do pedido</option></select></label></div>
      <div class="form-row"><label>Especialidade<select name="specialty" required><option>Coluna</option><option>Crânio</option><option>Nervos periféricos</option><option>Outros</option></select></label><label>Hospital / unidade<input name="hospital" maxlength="160" placeholder="Hospital" /></label></div>
      <div class="form-row"><label>Origem<select name="payer"><option>Convênio</option><option>SUS</option><option>Particular</option></select></label><label>Status<select name="status">${STATUSES.map(status => `<option>${status}</option>`).join("")}</select></label></div>
      <div class="form-row"><label>Data da solicitação<input type="date" name="requestDate" /></label><label>Data da cirurgia<input type="date" name="date" /></label></div>
      <div class="section-divider">CARACTERÍSTICAS DO PEDIDO CIRÚRGICO</div>
      <div class="form-row">
        <label>Tipo de cirurgia<select name="operationType"><option value="Coluna">Coluna</option></select></label>
        <label>Subtipo<select name="subtype" id="requestSubtype"><option>Artrodese</option><option>Discectomia</option><option>Descompressão</option><option>Artroplastia</option><option>Vertebroplastia / cifoplastia</option><option>Cirurgia endoscópica</option><option>Revisão de artrodese</option><option>Outro</option></select></label>
      </div>
      <div class="form-row">
        <label>Região<select name="region"><option value="Lombar">Lombar</option><option value="Cervical">Cervical</option><option value="Torácica">Torácica</option><option value="Toracolombar">Toracolombar</option><option value="Sacral">Sacral</option><option value="Multissegmentar">Multissegmentar</option></select></label>
        <label>Via de acesso / técnica<select name="approach" id="requestApproach"><option value="Posterior">Posterior</option><option value="Anterior">Anterior</option><option value="Lateral">Lateral</option><option value="Anterior e posterior">Anterior e posterior</option><option value="Endoscópica">Endoscópica</option><option value="Percutânea">Percutânea</option><option value="Outra / não definida">Outra / não definida</option></select></label>
      </div>
      <div class="form-row">
        <label>Níveis / segmentos<input name="levels" placeholder="Ex.: L4-L5; L5-S1" maxlength="160" /></label>
        <label>Lateralidade<select name="laterality"><option value="Não se aplica">Não se aplica</option><option value="Direita">Direita</option><option value="Esquerda">Esquerda</option><option value="Bilateral">Bilateral</option></select></label>
      </div>
      <details class="panel" style="margin:10px 0;padding:12px">
        <summary><strong>Contagens para revisão de multiplicidade</strong></summary>
        <p class="muted">Preencha apenas quando conhecido. O sistema registra as contagens, mas não calcula nem presume quantidades de cobrança.</p>
        <div class="form-row">
          <label>Segmentos abordados<input type="number" name="countSegments" min="0" max="100" step="1" placeholder="Não informado" /></label>
          <label>Corpos vertebrais ressecados<input type="number" name="countCorpectomies" min="0" max="20" step="1" placeholder="Não informado" /></label>
        </div>
        <div class="form-row">
          <label>Articulações facetárias tratadas<input type="number" name="countFacetJoints" min="0" max="100" step="1" placeholder="Não informado" /></label>
          <label>Forames tratados<input type="number" name="countForamina" min="0" max="100" step="1" placeholder="Não informado" /></label>
        </div>
        <div class="form-row">
          <label>Unidades topográficas<input type="number" name="countTopographicUnits" min="0" max="100" step="1" placeholder="Não informado" /></label>
          <label>Horas/frações de radioscopia<input type="number" name="countFluoroscopyUnits" min="0" max="100" step="1" placeholder="Não informado" /></label>
        </div>
        <label>Músculos infiltrados<input type="number" name="countMuscles" min="0" max="100" step="1" placeholder="Não informado" /></label>
      </details>
      <label>Diagnóstico / indicação<input name="diagnosis" maxlength="300" placeholder="Ex.: hérnia discal, estenose, espondilolistese..." /></label>
      <div class="form-row">
        <label>É revisão cirúrgica?<select name="revision"><option value="Não">Não</option><option value="Sim">Sim</option></select></label>
        <label>Descompressão associada?<select name="decompression"><option value="Sim">Sim</option><option value="Não">Não</option></select></label>
      </div>
      <label>Justificativa clínica / observações para o pedido<textarea name="clinicalJustification" rows="3" maxlength="4000" placeholder="Descreva sintomas, correlação clínico-radiológica, tratamentos prévios e motivo da indicação. Não inclua identificadores pessoais neste ambiente de desenvolvimento."></textarea></label>
      <section class="panel" style="margin:12px 0;padding:14px">
        <div class="panel-heading"><div><strong>Códigos candidatos</strong><p class="muted">Busca textual no SIGTAP importado. Selecione somente os códigos que você confirmar.</p></div><button type="button" class="button button-secondary button-small" id="suggestCodes">Buscar sugestões</button></div>
        <div id="suggestedCodeList" class="muted">Escolha o subtipo e clique em “Buscar sugestões”.</div>
      </section>
      <section class="panel" style="margin:12px 0;padding:14px">
        <div class="panel-heading"><div><strong>Materiais / OPME sugeridos</strong><p class="muted">Sugestões iniciais editáveis; confirme indicação e quantidade para cada caso.</p></div><button type="button" class="button button-secondary button-small" id="generateMaterials">Gerar sugestões</button></div>
        <div id="suggestedMaterialsList" class="muted">Clique em “Gerar sugestões” para montar a lista inicial.</div>
      </section>
      <div class="section-divider">CONTROLE FINANCEIRO</div>
      <div class="form-row"><label>Valor previsto / faturado (R$)<input type="number" name="expectedRevenue" min="0" step="0.01" value="0" required /></label><label>Valor recebido (R$)<input type="number" name="received" min="0" step="0.01" value="0" required /></label></div>
      <label>Observações<textarea name="notes" rows="2" maxlength="5000" placeholder="Informações administrativas sem dados clínicos identificáveis"></textarea></label>
      <div class="modal-actions"><button type="button" class="button button-secondary" id="cancelSurgery">Cancelar</button><button type="button" class="button button-secondary" id="previewRequest">Pré-visualizar ficha</button><button class="button button-primary" type="submit">Salvar pedido</button></div>
    </form></dialog>
    <dialog class="modal modal-wide" id="requestPreviewDialog">
      <div class="modal-heading"><div><div class="eyebrow">PRÉ-VISUALIZAÇÃO</div><h2>Ficha do pedido cirúrgico</h2></div><button type="button" class="icon-button" id="closeRequestPreview" aria-label="Fechar">×</button></div>
      <div id="requestPreviewContent"></div>
      <div class="modal-actions"><button type="button" class="button button-secondary" id="closeRequestPreviewBottom">Voltar</button><button type="button" class="button button-primary" id="printRequest">Imprimir / salvar PDF</button></div>
    </dialog>
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
  const requestPreviewDialog = root.querySelector("#requestPreviewDialog");
  root.querySelector("#previewRequest").addEventListener("click", () => previewSurgicalRequest(root));
  root.querySelector("#closeRequestPreview").addEventListener("click", () => requestPreviewDialog.close());
  root.querySelector("#closeRequestPreviewBottom").addEventListener("click", () => requestPreviewDialog.close());
  root.querySelector("#printRequest").addEventListener("click", () => printSurgicalRequest(root));
  root.querySelector("#closeMaterials").addEventListener("click", () => materialsDialog.close());
  root.querySelector("#addMaterial").addEventListener("click", () => openMaterialForm(root));
  root.querySelector("#closeMaterialForm").addEventListener("click", () => materialFormDialog.close());
  root.querySelector("#cancelMaterial").addEventListener("click", () => materialFormDialog.close());
  root.querySelector("#suggestCodes").addEventListener("click", () => loadRequestCodeSuggestions(root));
  root.querySelector("#generateMaterials").addEventListener("click", () => renderRequestMaterialSuggestions(root));
  root.querySelector("#requestSubtype").addEventListener("change", () => renderRequestMaterialSuggestions(root));
  root.querySelector("#requestApproach").addEventListener("change", () => renderRequestMaterialSuggestions(root));

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
    const generatedProcedureName = [data.subtype, data.region, data.levels].filter(Boolean).join(" — ").slice(0, 200);
    const payload = {
      ...data,
      procedureId: selectedProcedure?.id || null,
      procedure: selectedProcedure?.name || generatedProcedureName || "Cirurgia de coluna",
      expectedRevenue: Number(data.expectedRevenue),
      received: Number(data.received),
      requestDetails: {
        operationType: data.operationType,
        subtype: data.subtype,
        region: data.region,
        approach: data.approach,
        levels: data.levels.split(/[;,]/).map(value => value.trim()).filter(Boolean),
        multiplicityCounts: Object.fromEntries([
          "countSegments", "countCorpectomies", "countFacetJoints", "countForamina",
          "countTopographicUnits", "countFluoroscopyUnits", "countMuscles"
        ].map(key => [key, data[key] === "" ? null : Number(data[key])])),
        laterality: data.laterality,
        diagnosis: data.diagnosis,
        revision: data.revision === "Sim",
        decompression: data.decompression === "Sim",
        clinicalJustification: data.clinicalJustification
      },
      suggestedCodes: [...form.querySelectorAll("[data-request-code]:checked")].map(input => JSON.parse(input.value)),
      suggestedMaterials: [...form.querySelectorAll("[data-request-material]:checked")].map(input => ({
        category: input.dataset.category,
        description: input.dataset.description,
        quantity: Number(form.querySelector(`[data-material-quantity="${input.dataset.materialKey}"]`)?.value || 1),
        notes: input.dataset.notes || "Sugestão do modelo; revisar antes do envio."
      }))
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
  const details = item.requestDetails || {};
  for (const key of ["operationType","subtype","region","approach","laterality","diagnosis","clinicalJustification"]) {
    if (details[key] && form.elements[key]) form.elements[key].value = details[key];
  }
  if (form.elements.levels) form.elements.levels.value = Array.isArray(details.levels) ? details.levels.join("; ") : "";
  const counts = details.multiplicityCounts || {};
  for (const key of ["countSegments", "countCorpectomies", "countFacetJoints", "countForamina", "countTopographicUnits", "countFluoroscopyUnits", "countMuscles"]) {
    if (form.elements[key]) form.elements[key].value = counts[key] ?? "";
  }
  if (form.elements.revision) form.elements.revision.value = details.revision ? "Sim" : "Não";
  if (form.elements.decompression) form.elements.decompression.value = details.decompression ? "Sim" : "Não";
  renderSavedRequestCodes(root, item.suggestedCodes || []);
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
      select.innerHTML = '<option value="">Gerar a partir dos dados do pedido</option>';
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
  return `<div class="table-wrap"><table><thead><tr><th>Procedimento</th><th>Hospital / origem</th><th>Data</th><th>Status</th><th>Recebido</th><th>Ações</th></tr></thead><tbody>${items.map(item => `<tr><td><strong>${escapeHTML(item.procedure)}</strong><small>${escapeHTML(item.patientRef || "Sem identificador")} · ${escapeHTML(item.specialty)}${item.requestDetails?.subtype ? " · " + escapeHTML(item.requestDetails.subtype) : ""}${item.requestDetails?.levels?.length ? " · " + escapeHTML(item.requestDetails.levels.join(", ")) : ""}</small></td><td>${escapeHTML(item.hospital || "—")}<small>${escapeHTML(item.payer)}</small></td><td>${formatDate(item.date || item.requestDate)}</td><td><select class="inline-status" data-status-id="${escapeHTML(item.id)}" aria-label="Alterar status">${STATUSES.map(status => `<option ${status === item.status ? "selected" : ""}>${status}</option>`).join("")}</select></td><td>${formatCurrency(item.received)}</td><td><button class="text-button" data-materials-id="${escapeHTML(item.id)}">OPME</button> <button class="text-button" data-edit-id="${escapeHTML(item.id)}">Editar</button> <button class="text-button danger" data-delete-id="${escapeHTML(item.id)}">Excluir</button></td></tr>`).join("")}</tbody></table></div>`;
}

function bindActions(root) {
  root.querySelectorAll("[data-materials-id]").forEach(button => button.addEventListener("click", () => openMaterialsDialog(root, button.dataset.materialsId)));
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

function previewSurgicalRequest(root) {
  const form = root.querySelector("#surgeryForm");
  const data = Object.fromEntries(new FormData(form));
  const codes = [...form.querySelectorAll("[data-request-code]:checked")].map(input => {
    try { return JSON.parse(input.value); } catch { return null; }
  }).filter(Boolean);
  const materials = [...form.querySelectorAll("[data-request-material]:checked")].map(input => ({
    category: input.dataset.category,
    description: input.dataset.description,
    quantity: Number(form.querySelector(`[data-material-quantity="${input.dataset.materialKey}"]`)?.value || 1),
    notes: input.dataset.notes || ""
  }));
  const multiplicityLabels = {
    countSegments: "Segmentos abordados",
    countCorpectomies: "Corpos vertebrais ressecados",
    countFacetJoints: "Articulações facetárias tratadas",
    countForamina: "Forames tratados",
    countTopographicUnits: "Unidades topográficas",
    countFluoroscopyUnits: "Horas/frações de radioscopia",
    countMuscles: "Músculos infiltrados"
  };
  const multiplicityRows = Object.entries(multiplicityLabels)
    .filter(([key]) => data[key] !== "")
    .map(([key, label]) => ({ label, value: data[key] }));
  const content = root.querySelector("#requestPreviewContent");
  content.innerHTML = `
    <div class="panel" style="padding:18px">
      <h2>Solicitação cirúrgica — ${escapeHTML(data.subtype || "Coluna")}</h2>
      <p><strong>Procedimento cadastrado:</strong> ${escapeHTML(procedures.find(item => item.id === data.procedureId)?.name || [data.subtype, data.region, data.levels].filter(Boolean).join(" — ") || "Não informado")}</p>
      <p><strong>Região / níveis:</strong> ${escapeHTML(data.region)} · ${escapeHTML(data.levels || "Não informado")}</p>
      <p><strong>Via / técnica:</strong> ${escapeHTML(data.approach)} · <strong>Lateralidade:</strong> ${escapeHTML(data.laterality)}</p>
      <p><strong>Diagnóstico:</strong> ${escapeHTML(data.diagnosis || "Não informado")}</p>
      <p><strong>Revisão:</strong> ${escapeHTML(data.revision)} · <strong>Descompressão associada:</strong> ${escapeHTML(data.decompression)}</p>
      <h3>Contagens informadas para revisão de multiplicidade</h3>
      ${multiplicityRows.length ? `<ul>${multiplicityRows.map(item => `<li>${escapeHTML(item.label)}: ${escapeHTML(item.value)}</li>`).join("")}</ul>` : "<p>Nenhuma contagem informada.</p>"}
      <p><small>As contagens são dados de apoio à conferência; não geram quantidades de códigos automaticamente.</small></p>
      <p><strong>Justificativa clínica:</strong><br>${escapeHTML(data.clinicalJustification || "Não informada")}</p>
      <h3>Códigos selecionados — confirmar antes do envio</h3>
      ${codes.length ? `<ul>${codes.map(item => `<li><strong>${escapeHTML(item.role || item.system)} — ${escapeHTML(item.code)}</strong> — ${escapeHTML(item.description)}${item.condition ? `<br><small>${escapeHTML(item.condition)}</small>` : ""}${item.reference ? `<br><small>${escapeHTML(item.reference)} · ${escapeHTML(item.source || "")}</small>` : ""}</li>`).join("")}</ul>` : "<p>Nenhum código selecionado.</p>"}
      <h3>Materiais / OPME sugeridos — revisar indicação e quantidades</h3>
      ${materials.length ? `<ul>${materials.map(item => `<li>${escapeHTML(item.category)} — ${escapeHTML(item.description)} — quantidade: ${item.quantity}<br><small>${escapeHTML(item.notes)}</small></li>`).join("")}</ul>` : "<p>Nenhum material selecionado.</p>"}
      <hr><p><strong>Hospital:</strong> ${escapeHTML(data.hospital || "Não informado")} · <strong>Origem:</strong> ${escapeHTML(data.payer || "Não informada")}</p>
      <p><small>Documento gerado como rascunho para revisão médica. Códigos, materiais, quantidades, cobertura e compatibilidades não são validados automaticamente.</small></p>
    </div>`;
  root.querySelector("#requestPreviewDialog").showModal();
}

function printSurgicalRequest(root) {
  const content = root.querySelector("#requestPreviewContent").innerHTML;
  const printWindow = window.open("", "_blank", "width=900,height=700");
  if (!printWindow) {
    window.showToast("Permita a abertura de janelas para imprimir a ficha.");
    return;
  }
  printWindow.document.write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Ficha do pedido cirúrgico</title><style>body{font:14px Arial,sans-serif;color:#222;margin:32px;line-height:1.5}h2{font-size:22px}h3{margin-top:24px;border-bottom:1px solid #ccc;padding-bottom:6px}p{margin:8px 0}li{margin:7px 0}small{color:#555}@media print{body{margin:15mm}}</style></head><body>${content}<script>window.onload=()=>window.print()<\/script></body></html>`);
  printWindow.document.close();
}

function requestCodeSearchTerm(subtype) {
  const terms = {
    "Artrodese": "artrodese",
    "Discectomia": "discectomia",
    "Descompressão": "descompressão",
    "Artroplastia": "artroplastia",
    "Vertebroplastia / cifoplastia": "vertebroplastia",
    "Cirurgia endoscópica": "endoscopia",
    "Revisão de artrodese": "artrodese"
  };
  return terms[subtype] || subtype;
}

function renderSavedRequestCodes(root, codes) {
  const list = root.querySelector("#suggestedCodeList");
  if (!codes.length) {
    list.textContent = "Nenhum código foi selecionado para este pedido. Clique em “Buscar sugestões” para pesquisar candidatos.";
    return;
  }
  list.innerHTML = codes.map(item => {
    const value = JSON.stringify(item).replace(/&/g, "&amp;").replace(/"/g, "&quot;");
    return `<label style="display:flex;gap:8px;align-items:flex-start;padding:8px 0;border-bottom:1px solid var(--line)"><input type="checkbox" data-request-code value="${value}" checked /><span><strong>${escapeHTML(item.code)}</strong> — ${escapeHTML(item.description)}</span></label>`;
  }).join("") + '<p class="muted">Códigos já selecionados para este pedido. Revise antes de salvar.</p>';
}

async function loadRequestCodeSuggestions(root) {
  const list = root.querySelector("#suggestedCodeList");
  const input = {
    subtype: root.querySelector("#requestSubtype").value,
    region: root.querySelector('[name="region"]').value,
    approach: root.querySelector("#requestApproach").value,
    diagnosis: root.querySelector('[name="diagnosis"]').value
  };
  const ruleSet = getSpineCodingSuggestions(input);
  if (ruleSet) {
    list.innerHTML = `
      <div class="notice"><strong>${escapeHTML(ruleSet.scenarioTitle)}</strong><br>
      <small>${escapeHTML(ruleSet.reference)} · ${escapeHTML(ruleSet.source)}</small><br>
      <small>Referência do manual. Confirme a tabela, a regra contratual e a etapa cirúrgica.</small></div>
      ${ruleSet.codes.map(item => {
        const value = JSON.stringify(item).replace(/&/g, "&amp;").replace(/"/g, "&quot;");
        const role = item.role === "principal" ? "PRINCIPAL" : item.role === "associado" ? "ASSOCIADO" : item.role === "previsto_na_tecnica" ? "PREVISTO NA TÉCNICA — CONFIRMAR" : item.role === "evento" ? "EVENTO — NÃO PRÉ-SELECIONAR" : "CONDICIONAL";
        const checked = item.role === "principal";
        const disabled = item.role === "evento" ? "disabled" : "";
        return `<label style="display:flex;gap:8px;align-items:flex-start;padding:9px 0;border-bottom:1px solid var(--line)">
          <input type="checkbox" data-request-code value="${value}" ${checked ? "checked" : ""} ${disabled} />
          <span><strong>${escapeHTML(role)} · ${escapeHTML(item.code)}</strong> — ${escapeHTML(item.description)}
          <small style="display:block;color:var(--muted)">${escapeHTML(item.condition)}</small>
          <small style="display:block;color:var(--muted)">${escapeHTML(item.reference)} · Quantidade: definir conforme unidade do código.</small></span></label>`;
      }).join("")}
      <p class="muted">Referências do manual não comprovam equivalência TUSS/SIGTAP nem cobertura. Validar tabela e contrato antes de faturar.</p>`;
    return;
  }
  list.innerHTML = '<div class="empty-state">Nenhum cenário estruturado corresponde aos dados. Busca textual disponível apenas como apoio.</div>';
  try {
    const term = requestCodeSearchTerm(input.subtype);
    const query = new URLSearchParams({ search: term, page: "1", pageSize: "20" });
    const [sigtapResult, localResult] = await Promise.all([
      apiRequest(`/catalogs/SIGTAP/codes?${query.toString()}`).catch(() => ({ codes: [], version: null })),
      apiRequest("/procedure-codes").catch(() => ({ codes: [] }))
    ]);
    const sigtap = (sigtapResult.codes || []).map(item => ({
      system: "SIGTAP", code: item.code, description: item.description,
      catalogVersion: sigtapResult.version?.versionLabel || ""
    }));
    const normalized = term.toLocaleLowerCase("pt-BR");
    const tuss = (localResult.codes || [])
      .filter(item => item.system === "TUSS" && [item.code, item.description].join(" ").toLocaleLowerCase("pt-BR").includes(normalized))
      .slice(0, 20)
      .map(item => ({ system: "TUSS", code: item.code, description: item.description, catalogVersion: "Cadastro da organização" }));
    const candidates = [...tuss, ...sigtap];
    if (!candidates.length) {
      list.innerHTML = '<div class="empty-state">Nenhum cenário estruturado ou candidato textual encontrado.</div>';
      return;
    }
    list.innerHTML = candidates.map(item => {
      const value = JSON.stringify(item).replace(/&/g, "&amp;").replace(/"/g, "&quot;");
      return `<label style="display:flex;gap:8px;align-items:flex-start;padding:8px 0;border-bottom:1px solid var(--line)"><input type="checkbox" data-request-code value="${value}" /><span><strong>${escapeHTML(item.system)} · ${escapeHTML(item.code)}</strong> — ${escapeHTML(item.description)}<small style="display:block;color:var(--muted)">${escapeHTML(item.catalogVersion)}</small></span></label>`;
    }).join("") + '<p class="muted">Busca textual exploratória; não representa regra de codificação ou cobertura.</p>';
  } catch (error) {
    list.innerHTML = `<div class="empty-state">${escapeHTML(error.message)}. Verifique se o catálogo está disponível.</div>`;
  }
}

function renderRequestMaterialSuggestions(root) {
  const subtype = root.querySelector("#requestSubtype").value;
  const approach = root.querySelector("#requestApproach").value;
  let items = [];
  if (subtype === "Artrodese" || subtype === "Revisão de artrodese") {
    if (["Posterior","Percutânea"].includes(approach)) {
      items = [
        ["OPME","Sistema de fixação posterior (parafusos e hastes)","Confirmar número de níveis, anatomia e configuração."],
        ["OPME","Enxerto ósseo / substituto ósseo","Definir tipo e quantidade conforme planejamento."]
      ];
    } else if (["Anterior","Lateral","Anterior e posterior"].includes(approach)) {
      items = [
        ["OPME","Dispositivo intersomático (cage)","Confirmar níveis, dimensões e material."],
        ["OPME","Enxerto ósseo / substituto ósseo","Definir tipo e quantidade conforme planejamento."]
      ];
      if (approach === "Anterior" || approach === "Anterior e posterior") items.push(["OPME","Sistema de placa e parafusos anterior","Avaliar necessidade conforme técnica e dispositivo escolhido."]);
      if (approach === "Anterior e posterior") items.push(["OPME","Sistema de fixação posterior (parafusos e hastes)","Confirmar configuração e níveis."]);
    } else {
      items = [
        ["OPME","Sistema de fixação / estabilização","Definir conforme via e técnica escolhidas."],
        ["OPME","Enxerto ósseo / substituto ósseo","Definir tipo e quantidade conforme planejamento."]
      ];
    }
  } else if (subtype === "Vertebroplastia / cifoplastia") {
    items = [["OPME","Cimento ósseo","Volume e apresentação conforme planejamento."],["OPME","Kit de acesso / cânulas","Compatível com técnica e níveis planejados."]];
  } else if (subtype === "Cirurgia endoscópica") {
    items = [["Instrumental","Kit / cânula de endoscopia de coluna","Confirmar disponibilidade e compatibilidade do instrumental."],["Descartável","Itens descartáveis específicos da plataforma","Conferir composição do kit utilizado."]];
  } else if (subtype === "Discectomia" || subtype === "Descompressão") {
    items = [["Descartável","Material hemostático","Selecionar conforme necessidade intraoperatória."],["Instrumental","Broca / instrumental de alta rotação","Conferir disponibilidade do instrumental reutilizável."]];
  } else if (subtype === "Artroplastia") {
    items = [["OPME","Prótese / disco artificial","Selecionar modelo, dimensões e níveis conforme indicação."]];
  } else {
    items = [["OPME","Material específico do procedimento","Descrever e ajustar conforme planejamento cirúrgico."]];
  }
  const list = root.querySelector("#suggestedMaterialsList");
  list.innerHTML = items.map((item,index) => {
    const key = `m${index}`;
    return `<div style="display:grid;grid-template-columns:auto minmax(0,1fr) 90px;gap:8px;align-items:start;padding:9px 0;border-bottom:1px solid var(--line)">
      <input type="checkbox" data-request-material data-material-key="${key}" data-category="${escapeHTML(item[0])}" data-description="${escapeHTML(item[1])}" data-notes="${escapeHTML(item[2])}" checked aria-label="Incluir material" />
      <span><strong>${escapeHTML(item[1])}</strong><small style="display:block;color:var(--muted)">${escapeHTML(item[0])} · ${escapeHTML(item[2])}</small></span>
      <label>Qtd.<input type="number" min="1" max="500" value="1" data-material-quantity="${key}" /></label>
    </div>`;
  }).join("") + '<p class="muted">Quantidades iniciais são apenas marcadores editáveis. Ajuste conforme níveis, técnica, implantes e planejamento individual.</p>';
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
