import { apiRequest } from "../core/api.js";
import { escapeHTML } from "../core/storage.js";

let procedures = [];

export async function renderProcedures(root) {
  root.innerHTML = `
    <div class="page-heading"><div><div class="eyebrow">BIBLIOTECA CIRÚRGICA</div><h1>Procedimentos</h1><p class="muted">Cadastre e organize os procedimentos que serão reutilizados nos demais módulos.</p></div><button class="button button-primary" id="addProcedure">＋ Novo procedimento</button></div>
    <section class="panel">
      <div class="panel-heading"><div><h2>Biblioteca de procedimentos</h2><p class="muted" id="procedureCount">Carregando...</p></div><input class="search-input" id="procedureSearch" placeholder="Buscar procedimento..." /></div>
      <div id="procedureList"><div class="empty-state">Carregando procedimentos...</div></div>
    </section>
    <dialog class="modal" id="procedureDialog"><form id="procedureForm"><div class="modal-heading"><div><div class="eyebrow">NOVO CADASTRO</div><h2>Cadastrar procedimento</h2></div><button type="button" class="icon-button" id="closeProcedure" aria-label="Fechar">×</button></div>
      <label>Nome do procedimento<input name="name" required maxlength="160" placeholder="Ex.: Artrodese lombar posterior" /></label>
      <div class="form-row"><label>Especialidade<select name="specialty" required><option value="Coluna">Coluna</option><option value="Crânio">Crânio</option><option value="Nervos periféricos">Nervos periféricos</option><option value="Outros">Outros</option></select></label><label>Grupo / técnica<input name="technique" maxlength="500" placeholder="Ex.: Instrumentada, minimamente invasiva" /></label></div>
      <label>Observações<textarea name="notes" rows="3" maxlength="5000" placeholder="Notas internas sobre o procedimento"></textarea></label>
      <div class="modal-actions"><button type="button" class="button button-secondary" id="cancelProcedure">Cancelar</button><button class="button button-primary" type="submit">Salvar procedimento</button></div>
    </form></dialog>`;

  const dialog = root.querySelector("#procedureDialog");
  root.querySelector("#addProcedure").addEventListener("click", () => dialog.showModal());
  root.querySelector("#closeProcedure").addEventListener("click", () => dialog.close());
  root.querySelector("#cancelProcedure").addEventListener("click", () => dialog.close());

  root.querySelector("#procedureForm").addEventListener("submit", async event => {
    event.preventDefault();
    const form = event.currentTarget;
    const submit = form.querySelector('[type="submit"]');
    const data = Object.fromEntries(new FormData(form));
    submit.disabled = true;
    submit.textContent = "Salvando...";
    try {
      await apiRequest("/procedures", { method: "POST", body: data });
      dialog.close();
      window.showToast("Procedimento cadastrado no banco de dados.");
      await loadProcedures(root);
    } catch (error) {
      window.showToast(error.message);
    } finally {
      submit.disabled = false;
      submit.textContent = "Salvar procedimento";
    }
  });

  root.querySelector("#procedureSearch").addEventListener("input", event => {
    renderList(root, event.target.value);
  });

  await loadProcedures(root);
}

async function loadProcedures(root) {
  const list = root.querySelector("#procedureList");
  if (!list) return;
  list.innerHTML = '<div class="empty-state">Carregando procedimentos...</div>';
  try {
    const result = await apiRequest("/procedures");
    procedures = result.procedures || [];
    renderList(root, root.querySelector("#procedureSearch")?.value || "");
  } catch (error) {
    list.innerHTML = `<div class="empty-state"><strong>Não foi possível carregar a biblioteca</strong><p>${escapeHTML(error.message)}</p></div>`;
    root.querySelector("#procedureCount").textContent = "Erro ao carregar";
  }
}

function renderList(root, searchTerm = "") {
  const term = searchTerm.toLocaleLowerCase("pt-BR");
  const filtered = procedures.filter(item =>
    [item.name, item.specialty, item.technique || ""].join(" ").toLocaleLowerCase("pt-BR").includes(term)
  );
  root.querySelector("#procedureCount").textContent = `${procedures.length} cadastro(s)`;
  root.querySelector("#procedureList").innerHTML = listMarkup(filtered);
  bindDelete(root);
}

function listMarkup(items) {
  if (!items.length) return `<div class="empty-state"><div class="empty-icon">▤</div><strong>Sua biblioteca está vazia</strong><p>Adicione os procedimentos mais frequentes para reutilizá-los nas solicitações e registros.</p></div>`;
  return `<div class="table-wrap"><table><thead><tr><th>Procedimento</th><th>Especialidade</th><th>Técnica / grupo</th><th></th></tr></thead><tbody>${items.map(item => `<tr><td><strong>${escapeHTML(item.name)}</strong></td><td>${escapeHTML(item.specialty)}</td><td>${escapeHTML(item.technique || "—")}</td><td><button class="text-button danger" data-delete-procedure="${escapeHTML(item.id)}">Excluir</button></td></tr>`).join("")}</tbody></table></div>`;
}

function bindDelete(root) {
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
