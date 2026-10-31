import { apiRequest, setAccessToken } from "../core/api.js";

export function renderAuthScreen(root, onAuthenticated) {
  let mode = "login";

  function render(message = "") {
    const registering = mode === "register";
    root.innerHTML = `
      <div class="auth-card">
        <div class="auth-brand"><span class="brand-mark">CC</span><div><strong>Central</strong><small>Cirúrgica</small></div></div>
        <div class="auth-eyebrow">GESTÃO CIRÚRGICA INTELIGENTE</div>
        <h1>${registering ? "Crie sua conta" : "Bem-vindo de volta"}</h1>
        <p class="auth-subtitle">${registering ? "Cadastre seu acesso e crie o espaço da sua clínica." : "Entre para acessar seu ambiente de gestão."}</p>
        ${message ? `<div class="auth-error" role="alert">${message}</div>` : ""}
        <form id="authForm" class="auth-form">
          ${registering ? `
            <label>Nome da clínica ou organização<input name="name" autocomplete="organization" required minlength="2" maxlength="160" placeholder="Ex.: Clínica de Coluna"></label>
            <label>Seu nome<input name="displayName" autocomplete="name" required minlength="2" maxlength="120" placeholder="Nome completo"></label>
          ` : ""}
          <label>E-mail<input name="email" type="email" autocomplete="email" required maxlength="254" placeholder="seu@email.com"></label>
          <label>Senha<input name="password" type="password" autocomplete="${registering ? "new-password" : "current-password"}" required minlength="${registering ? "12" : "1"}" maxlength="72" placeholder="${registering ? "Mínimo de 12 caracteres" : "Sua senha"}"></label>
          ${registering ? '<p class="auth-hint">Use pelo menos 12 caracteres. Sua senha será armazenada com hash criptográfico.</p>' : ""}
          <button class="button button-primary auth-submit" type="submit">${registering ? "Criar conta" : "Entrar"}</button>
        </form>
        <p class="auth-switch">${registering ? "Já tem uma conta?" : "Ainda não tem acesso?"}
          <button type="button" id="authToggle">${registering ? "Fazer login" : "Criar conta"}</button>
        </p>
        <p class="auth-footnote">Ambiente inicial de desenvolvimento. Não utilize dados reais de pacientes.</p>
      </div>`;

    root.querySelector("#authToggle").addEventListener("click", () => {
      mode = registering ? "login" : "register";
      render();
    });

    root.querySelector("#authForm").addEventListener("submit", async event => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      const submit = root.querySelector(".auth-submit");
      submit.disabled = true;
      submit.textContent = registering ? "Criando conta..." : "Entrando...";
      const payload = Object.fromEntries(form.entries());

      try {
        const result = await apiRequest(registering ? "/auth/register" : "/auth/login", {
          method: "POST",
          body: payload,
          token: null
        });
        setAccessToken(result.accessToken);
        onAuthenticated(result);
      } catch (error) {
        render(error.message);
      }
    });
  }

  render();
}
