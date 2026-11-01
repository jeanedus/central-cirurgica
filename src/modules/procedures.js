import { apiRequest } from "../core/api.js";
import { escapeHTML } from "../core/storage.js";

let procedures = [];
let procedureCodes = [];

export async function renderProcedures(root) {
  root.innerHTML = `
    <div class="page-heading"><div><div class="eyebrow">BIBLIOTECA CIRÚRGICA</div><h1>Procedimentos e códigos</h1><p class="muted">Organize procedimentos e mantenha um catálogo próprio de códigos TUSS e SIGTAP.</p></div><button class="button button-primary" id="addProcedure">＋ Novo procedimento</button></div>
    <section class="panel">
      <div class="panel-heading"><div><h2>Biblioteca de procedimentos</h2><p class="muted" id="procedureCount">Carregando...</p></div><input class="search-input" id="procedureSearch" placeholder="Buscar procedimento..." /></div>
      <div id="procedureList"><div class="empty-state">Carregando procedimentos...</div></div>
    </section>
    <section class="panel" style="margin-top:18px">
      <div class="panel-heading"><div><h2>Catálogo de códigos</h2><p class="muted" id="codeCount">Carregando códigos...</p></div><button class="button button-primary" id="addCode">＋ Cadastrar código</button></div>
      <div class="panel-heading">
        <input class="search-input" id="codeSearch" placeholder="Buscar por código ou descrição..." />
        <select class="inline-status" id="codeSystemFilter" aria-label="Filtrar tabela"><option value="">TUSS e SIGTAP</option><option value="TUSS">TUSS</option><option value="SIGTAP">SIGTAP</option></select>
      </div>
      <div id="codeList"><div class="empty-state">Carregando códigos...</div></div>
      <div id="sigtapCatalogPanel" hidden style="margin-top:20px;border-top:1px solid var(--line);padding-top:18px">
        <div class="panel-heading"><div><h2>Catálogo oficial SIGTAP</h2><p class="muted" id="sigtapVersion">Verificando versão disponível...</p></div><button class="button button-secondary button-small" id="refreshSigtap">Atualizar</button></div>
        <div class="panel-heading"><input class="search-input" id="sigtapSearch" placeholder="Buscar código ou descrição SIGTAP..." /></div>
        <div id="sigtapList"><div class="empty-state">Carregando catálogo...</div></div>
        <div class="panel-heading" style="margin-top:12px"><span class="muted" id="sigtapPageInfo"></span><div><button class="button button-secondary button-small" id="sigtapPrev">Anterior</button> <button class="button button-secondary button-small" id="sigtapNext">Próxima</button></div></div>
      </div>
      <p class="muted">O catálogo oficial versionado é separado dos códigos cadastrados manualmente pela organização.</p>
    </section>
    <dialog class="modal modal-wide" id="procedureDialog"><form id="procedureForm"><div class="modal-heading"><div><div class="eyebrow">NOVO CADASTRO</div><h2>Cadastrar procedimento</h2></div><button type="button" class="icon-button" id="closeProcedure" aria-label="Fechar">×</button></div>
      <label>Nome do procedimento<input name="name" required maxlength="160" placeholder="Ex.: Artrodese lombar posterior" /></label>
      <div class="form-row"><label>Especialidade<select name="specialty" required><option value="Coluna">Coluna</option><option value="Crânio">Crânio</option><option value="Nervos periféricos">Nervos periféricos</option><option value="Outros">Outros</option></select></label><label>Grupo / técnica<input name="technique" maxlength="500" placeholder="Ex.: Instrumentada, minimamente invasiva" /></label></div>
      <label>Observações<textarea name="notes" rows="3" maxlength="5000" placeholder="Notas internas sobre o procedimento"></textarea></label>
      <div class="modal-actions"><button type="button" class="button button-secondary" id="cancelProcedure">Cancelar</button><button class="button button-primary" type="submit">Salvar procedimento</button></div>
    </form></dialog>
    <dialog class="modal modal-wide" id="codeDialog"><form id="codeForm">
      <div class="modal-heading"><div><div class="eyebrow" id="codeEyebrow">CATÁLOGO DE CÓDIGOS</div><h2 id="codeDialogTitle">Cadastrar código</h2></div><button type="button" class="icon-button" id="closeCode" aria-label="Fechar">×</button></div>
      <div class="form-row"><label>Tabela<select name="system" required><option value="TUSS">TUSS</option><option value="SIGTAP">SIGTAP</option></select></label><label>Código<input name="code" required maxlength="40" placeholder="Código oficial" /></label></div>
      <label>Descrição oficial<input name="description" required maxlength="500" placeholder="Descrição conforme a tabela" /></label>
      <label>Vincular a procedimento (opcional)<select name="procedureId"><option value="">Sem vínculo</option></select></label>
      <div class="form-row"><label>Situação<select name="active"><option value="true">Ativo</option><option value="false">Inativo</option></select></label><label>Observações internas<input name="notes" maxlength="3000" placeholder="Ex.: regra de cobrança, observação de uso" /></label></div>
      <div class="modal-actions"><button type="button" class="button button-secondary" id="cancelCode">Cancelar</button><button class="button button-primary" type="submit">Salvar código</button></div>
    </form></dialog>`;

  const procedureDialog = root.querySelector("#procedureDialog");
  const codeDialog = root.querySelector("#codeDialog");
  root.querySelector("#addProcedure").addEventListener("click", () => procedureDialog.showModal());
  root.querySelector("#closeProcedure").addEventListener("click", () => procedureDialog.close());
  root.querySelector("#cancelProcedure").addEventListener("click", () => procedureDialog.close());
  root.querySelector("#addCode").addEventListener("click", () => openCodeDialog(root));
  root.querySelector("#closeCode").addEventListener("click", () => codeDialog.close());
  root.querySelector("#cancelCode").addEventListener("click", () => codeDialog.close());

  root.querySelector("#procedureForm").addEventListener("submit", async event => {
    event.preventDefault();
    const form = event.currentTarget;
    const submit = form.querySelector('[type="submit"]');
    const data = Object.fromEntries(new FormData(form));
    submit.disabled = true;
    submit.textContent = "Salvando...";
    try {
      await apiRequest("/procedures", { method: "POST", body: data });
      procedureDialog.close();
      form.reset();
      window.showToast("Procedimento cadastrado.");
      await loadProcedures(root);
    } catch (error) {
      window.showToast(error.message);
    } finally {
      submit.disabled = false;
      submit.textContent = "Salvar procedimento";
    }
  });

  root.querySelector("#codeForm").addEventListener("submit", async event => {
    event.preventDefault();
    const form = event.currentTarget;
    const submit = form.querySelector('[type="submit"]');
    const data = Object.fromEntries(new FormData(form));
    const payload = {
      ...data,
      procedureId: data.procedureId || null,
      active: data.active === "true"
    };
    const editingId = codeDialog.dataset.editId;
    submit.disabled = true;
    submit.textContent = "Salvando...";
    try {
      if (editingId) await apiRequest(`/procedure-codes/${encodeURIComponent(editingId)}`, { method: "PATCH", body: payload });
      else await apiRequest("/procedure-codes", { method: "POST", body: payload });
      codeDialog.close();
      form.reset();
      window.showToast(editingId ? "Código atualizado." : "Código cadastrado.");
      await loadCodes(root);
    } catch (error) {
      window.showToast(error.message);
    } finally {
      submit.disabled = false;
      submit.textContent = "Salvar código";
    }
  });

  root.querySelector("#procedureSearch").addEventListener("input", event => renderProcedureList(root, event.target.value));
  root.querySelector("#codeSearch").addEventListener("input", () => renderCodeList(root));
  root.querySelector("#codeSystemFilter").addEventListener("change", async () => {
    renderCodeList(root);
    const panel = root.querySelector("#sigtapCatalogPanel");
    const showCatalog = root.querySelector("#codeSystemFilter").value === "SIGTAP";
    panel.hidden = !showCatalog;
    if (showCatalog) await loadSigtapCatalog(root, 1);
  });
  root.querySelector("#sigtapSearch").addEventListener("input", () => loadSigtapCatalog(root, 1));
  root.querySelector("#refreshSigtap").addEventListener("click", () => loadSigtapCatalog(root, 1));
  root.querySelector("#sigtapPrev").addEventListener("click", () => loadSigtapCatalog(root, Math.max(1, Number(root.querySelector("#sigtapList").dataset.page || 1) - 1)));
  root.querySelector("#sigtapNext").addEventListener("click", () => loadSigtapCatalog(root, Number(root.querySelector("#sigtapList").dataset.page || 1) + 1));

  await loadProcedures(root);
  await loadCodes(root);
}

async function loadProcedures(root) {
  try {
    const result = await apiRequest("/procedures");
    procedures = result.procedures || [];
    renderProcedureList(root, root.querySelector("#procedureSearch")?.value || "");
    const select = root.querySelector('[name="procedureId"]');
    if (select) {
      select.innerHTML = '<option value="">Sem vínculo</option>' +
        procedures.map(item => `<option value="${escapeHTML(item.id)}">${escapeHTML(item.name)} — ${escapeHTML(item.specialty)}</option>`).join("");
    }
  } catch (error) {
    root.querySelector("#procedureList").innerHTML = `<div class="empty-state"><strong>Não foi possível carregar a biblioteca</strong><p>${escapeHTML(error.message)}</p></div>`;
    root.querySelector("#procedureCount").textContent = "Erro ao carregar";
  }
}

async function loadCodes(root) {
  const list = root.querySelector("#codeList");
  if (!list) return;
  list.innerHTML = '<div class="empty-state">Carregando códigos...</div>';
  try {
    const result = await apiRequest("/procedure-codes");
    procedureCodes = result.codes || [];
    renderCodeList(root);
  } catch (error) {
    list.innerHTML = `<div class="empty-state"><strong>Não foi possível carregar os códigos</strong><p>${escapeHTML(error.message)}</p></div>`;
    root.querySelector("#codeCount").textContent = "Erro ao carregar";
  }
}

function renderProcedureList(root, searchTerm = "") {
  const term = searchTerm.toLocaleLowerCase("pt-BR");
  const filtered = procedures.filter(item =>
    [item.name, item.specialty, item.technique || ""].join(" ").toLocaleLowerCase("pt-BR").includes(term)
  );
  root.querySelector("#procedureCount").textContent = `${procedures.length} cadastro(s)`;
  root.querySelector("#procedureList").innerHTML = procedureMarkup(filtered);
  root.querySelectorAll("[data-delete-procedure]").forEach(button => button.addEventListener("click", async () => {
    if (!confirm("Excluir este procedimento da biblioteca?")) return;
    button.disabled = true;
    try {
      await apiRequest(`/procedures/${encodeURIComponent(button.dataset.deleteProcedure)}`, { method: "DELETE" });
      window.showToast("Procedimento excluído.");
      await loadProcedures(root);
    } catch (error) {
      window.showToast(error.message);
      button.disabled = false;
    }
  }));
}

function procedureMarkup(items) {
  if (!items.length) return '<div class="empty-state"><div class="empty-icon">▤</div><strong>Sua biblioteca está vazia</strong><p>Adicione os procedimentos mais frequentes para reutilizá-los nas solicitações e registros.</p></div>';
  return `<div class="table-wrap"><table><thead><tr><th>Procedimento</th><th>Especialidade</th><th>Técnica / grupo</th><th></th></tr></thead><tbody>${items.map(item => `<tr><td><strong>${escapeHTML(item.name)}</strong></td><td>${escapeHTML(item.specialty)}</td><td>${escapeHTML(item.technique || "—")}</td><td><button class="text-button danger" data-delete-procedure="${escapeHTML(item.id)}">Excluir</button></td></tr>`).join("")}</tbody></table></div>`;
}

function renderCodeList(root) {
  const search = (root.querySelector("#codeSearch")?.value || "").toLocaleLowerCase("pt-BR");
  const system = root.querySelector("#codeSystemFilter")?.value || "";
  const filtered = procedureCodes.filter(item =>
    (!system || item.system === system) &&
    [item.code, item.description, item.procedure?.name || "", item.notes || ""].join(" ").toLocaleLowerCase("pt-BR").includes(search)
  );
  root.querySelector("#codeCount").textContent = `${procedureCodes.length} código(s) cadastrado(s)`;
  const list = root.querySelector("#codeList");
  if (!filtered.length) {
    list.innerHTML = '<div class="empty-state"><div class="empty-icon">⌕</div><strong>Nenhum código encontrado</strong><p>Cadastre códigos TUSS ou SIGTAP para começar a montar sua biblioteca.</p></div>';
    return;
  }
  list.innerHTML = `<div class="table-wrap"><table><thead><tr><th>Tabela</th><th>Código</th><th>Descrição</th><th>Procedimento vinculado</th><th>Situação</th><th></th></tr></thead><tbody>${filtered.map(item => `<tr><td><span class="status-badge">${item.system}</span></td><td><strong>${escapeHTML(item.code)}</strong></td><td style="white-space:normal;min-width:220px">${escapeHTML(item.description)}</td><td>${escapeHTML(item.procedure?.name || "—")}</td><td>${item.active ? "Ativo" : "Inativo"}</td><td><button class="text-button" data-edit-code="${escapeHTML(item.id)}">Editar</button> <button class="text-button danger" data-delete-code="${escapeHTML(item.id)}">Excluir</button></td></tr>`).join("")}</tbody></table></div>`;
  root.querySelectorAll("[data-edit-code]").forEach(button => button.addEventListener("click", () => openCodeDialog(root, button.dataset.editCode)));
  root.querySelectorAll("[data-delete-code]").forEach(button => button.addEventListener("click", async () => {
    if (!confirm("Excluir este código do catálogo?")) return;
    button.disabled = true;
    try {
      await apiRequest(`/procedure-codes/${encodeURIComponent(button.dataset.deleteCode)}`, { method: "DELETE" });
      window.showToast("Código excluído.");
      await loadCodes(root);
    } catch (error) {
      window.showToast(error.message);
      button.disabled = false;
    }
  }));
}

async function loadSigtapCatalog(root, page = 1) {
  const list = root.querySelector("#sigtapList");
  const versionLabel = root.querySelector("#sigtapVersion");
  list.innerHTML = '<div class="empty-state">Carregando tabela SIGTAP...</div>';
  versionLabel.textContent = "Consultando catálogo versionado...";
  try {
    const status = await apiRequest("/catalogs/SIGTAP");
    if (!status.available) {
      versionLabel.textContent = "Nenhuma competência oficial importada e validada.";
      list.innerHTML = '<div class="empty-state"><div class="empty-icon">▤</div><strong>Tabela SIGTAP ainda não disponível</strong><p>A tela está conectada. Falta importar uma competência cuja origem oficial tenha sido verificada. Os códigos cadastrados manualmente continuam disponíveis na tabela acima.</p></div>';
      root.querySelector("#sigtapPageInfo").textContent = "";
      root.querySelector("#sigtapPrev").disabled = true;
      root.querySelector("#sigtapNext").disabled = true;
      return;
    }
    const search = root.querySelector("#sigtapSearch").value.trim();
    const query = new URLSearchParams({ page: String(page), pageSize: "50" });
    if (search) query.set("search", search);
    const result = await apiRequest(`/catalogs/SIGTAP/codes?${query.toString()}`);
    const version = result.version;
    versionLabel.textContent = `Competência ${version.competence || version.versionLabel} · ${Number(result.total).toLocaleString("pt-BR")} procedimento(s) encontrado(s)`;
    list.dataset.page = String(result.page || 1);
    if (!result.codes.length) {
      list.innerHTML = '<div class="empty-state"><strong>Nenhum procedimento encontrado</strong><p>Tente outro código ou termo de busca.</p></div>';
    } else {
      list.innerHTML = `<div class="table-wrap"><table><thead><tr><th>Código SIGTAP</th><th>Descrição</th><th>Situação</th></tr></thead><tbody>${result.codes.map(item => `<tr><td><strong>${escapeHTML(item.code)}</strong></td><td style="white-space:normal;min-width:260px">${escapeHTML(item.description)}</td><td>${item.active ? "Ativo" : "Inativo"}</td></tr>`).join("")}</tbody></table></div>`;
    }
    root.querySelector("#sigtapPageInfo").textContent = `Página ${result.page} de ${Math.max(1, result.pages)}`;
    root.querySelector("#sigtapPrev").disabled = result.page <= 1;
    root.querySelector("#sigtapNext").disabled = result.page >= result.pages;
  } catch (error) {
    versionLabel.textContent = "Falha ao consultar a tabela.";
    list.innerHTML = `<div class="empty-state"><strong>Não foi possível abrir a tabela SIGTAP</strong><p>${escapeHTML(error.message)}</p></div>`;
  }
}

function openCodeDialog(root, codeId = "") {
  const dialog = root.querySelector("#codeDialog");
  const form = root.querySelector("#codeForm");
  const item = procedureCodes.find(code => code.id === codeId);
  form.reset();
  dialog.dataset.editId = codeId;
  root.querySelector("#codeEyebrow").textContent = item ? "EDITAR CADASTRO" : "NOVO CADASTRO";
  root.querySelector("#codeDialogTitle").textContent = item ? "Editar código" : "Cadastrar código";
  if (item) {
    form.elements.system.value = item.system;
    form.elements.code.value = item.code;
    form.elements.description.value = item.description;
    form.elements.procedureId.value = item.procedureId || "";
    form.elements.active.value = String(item.active);
    form.elements.notes.value = item.notes || "";
  }
  dialog.showModal();
}
