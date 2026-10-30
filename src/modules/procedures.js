import { readCollection, writeCollection, createId, escapeHTML } from "../core/storage.js";

export function renderProcedures(root) {
  const items = readCollection("procedures");
  root.innerHTML = `
    <div class="page-heading"><div><div class="eyebrow">BIBLIOTECA CIRÚRGICA</div><h1>Procedimentos</h1><p class="muted">Cadastre e organize os procedimentos que serão reutilizados nos demais módulos.</p></div><button class="button button-primary" id="addProcedure">＋ Novo procedimento</button></div>
    <section class="panel">
      <div class="panel-heading"><div><h2>Biblioteca de procedimentos</h2><p class="muted">${items.length} cadastro(s)</p></div><input class="search-input" id="procedureSearch" placeholder="Buscar procedimento..." /></div>
      <div id="procedureList">${listMarkup(items)}</div>
    </section>
    <dialog class="modal" id="procedureDialog"><form id="procedureForm" method="dialog"><div class="modal-heading"><div><div class="eyebrow">NOVO CADASTRO</div><h2>Cadastrar procedimento</h2></div><button type="button" class="icon-button" id="closeProcedure" aria-label="Fechar">×</button></div>
      <label>Nome do procedimento<input name="name" required maxlength="120" placeholder="Ex.: Artrodese lombar posterior" /></label>
      <div class="form-row"><label>Especialidade<select name="specialty" required><option value="Coluna">Coluna</option><option value="Crânio">Crânio</option><option value="Nervos periféricos">Nervos periféricos</option><option value="Outros">Outros</option></select></label><label>Grupo / técnica<input name="technique" placeholder="Ex.: Instrumentada, minimamente invasiva" /></label></div>
      <label>Observações<textarea name="notes" rows="3" placeholder="Notas internas sobre o procedimento"></textarea></label>
      <div class="modal-actions"><button type="button" class="button button-secondary" id="cancelProcedure">Cancelar</button><button class="button button-primary" type="submit">Salvar procedimento</button></div>
    </form></dialog>`;

  const dialog = root.querySelector("#procedureDialog");
  root.querySelector("#addProcedure").addEventListener("click", () => dialog.showModal());
  root.querySelector("#closeProcedure").addEventListener("click", () => dialog.close());
  root.querySelector("#cancelProcedure").addEventListener("click", () => dialog.close());
  root.querySelector("#procedureForm").addEventListener("submit", event => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    const current = readCollection("procedures");
    current.push({ id: createId(), ...data, createdAt: new Date().toISOString() });
    writeCollection("procedures", current);
    dialog.close();
    renderProcedures(root);
    window.showToast("Procedimento cadastrado.");
  });
  root.querySelector("#procedureSearch").addEventListener("input", event => {
    const term = event.target.value.toLocaleLowerCase("pt-BR");
    const filtered = readCollection("procedures").filter(item => [item.name,item.specialty,item.technique].join(" ").toLocaleLowerCase("pt-BR").includes(term));
    root.querySelector("#procedureList").innerHTML = listMarkup(filtered);
    bindDelete(root);
  });
  bindDelete(root);
}

function listMarkup(items) {
  if (!items.length) return `<div class="empty-state"><div class="empty-icon">▤</div><strong>Sua biblioteca está vazia</strong><p>Adicione os procedimentos mais frequentes para reutilizá-los nas solicitações e registros.</p></div>`;
  return `<div class="table-wrap"><table><thead><tr><th>Procedimento</th><th>Especialidade</th><th>Técnica / grupo</th><th></th></tr></thead><tbody>${items.map(item => `<tr><td><strong>${escapeHTML(item.name)}</strong></td><td>${escapeHTML(item.specialty)}</td><td>${escapeHTML(item.technique || "—")}</td><td><button class="text-button danger" data-delete-procedure="${item.id}">Excluir</button></td></tr>`).join("")}</tbody></table></div>`;
}

function bindDelete(root) {
  root.querySelectorAll("[data-delete-procedure]").forEach(button => button.addEventListener("click", () => {
    if (!confirm("Excluir este procedimento da biblioteca?")) return;
    writeCollection("procedures", readCollection("procedures").filter(item => item.id !== button.dataset.deleteProcedure));
    renderProcedures(root);
    window.showToast("Procedimento excluído.");
  }));
}