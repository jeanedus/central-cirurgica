import { renderDashboard } from "./modules/dashboard.js";
import { renderProcedures } from "./modules/procedures.js";
import { renderSurgeries } from "./modules/surgeries.js";
import { apiRequest, clearAccessToken, getAccessToken } from "./core/api.js";
import { renderAuthScreen } from "./modules/auth-screen.js";

const root = document.querySelector("#appContent");
const shell = document.querySelector("#appShell");
const authRoot = document.querySelector("#authScreen");
const titles = { dashboard: "Visão geral", procedures: "Procedimentos", surgeries: "Cirurgias" };
let currentView = "dashboard";
let currentUser = null;

window.showToast = message => {
  const toast = document.querySelector("#toast");
  toast.textContent = message;
  toast.classList.add("visible");
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => toast.classList.remove("visible"), 2600);
};

function navigate(view) {
  currentView = view;
  document.querySelectorAll("[data-view]").forEach(button => button.classList.toggle("active", button.dataset.view === view));
  document.querySelector("#breadcrumbCurrent").textContent = titles[view] || "Visão geral";
  if (view === "procedures") renderProcedures(root);
  else if (view === "surgeries") renderSurgeries(root);
  else renderDashboard(root);
  document.querySelector("#sidebar").classList.remove("sidebar-open");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function showApplication(user) {
  currentUser = user;
  authRoot.hidden = true;
  shell.hidden = false;
  const displayName = user.displayName || user.email;
  document.querySelector("#sessionUser").textContent = displayName;
  document.querySelector("#sessionAvatar").textContent = displayName.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join("").toUpperCase();
  navigate(currentView);
}

function showLogin() {
  shell.hidden = true;
  authRoot.hidden = false;
  clearAccessToken();
  renderAuthScreen(authRoot, result => {
    const user = result.user;
    showApplication(user);
    window.showToast("Acesso realizado com sucesso.");
  });
}

document.querySelectorAll("[data-view]").forEach(button => button.addEventListener("click", () => navigate(button.dataset.view)));
document.querySelector("#mobileMenu").addEventListener("click", () => document.querySelector("#sidebar").classList.toggle("sidebar-open"));
document.querySelector("#logoutButton").addEventListener("click", () => {
  currentUser = null;
  showLogin();
});

root.addEventListener("click", event => {
  const action = event.target.closest("[data-action]")?.dataset.action;
  if (action === "go-surgeries" || action === "new-surgery") {
    navigate("surgeries");
    if (action === "new-surgery") setTimeout(() => root.querySelector("#addSurgery")?.click(), 0);
  }
  if (action === "new-procedure") {
    navigate("procedures");
    setTimeout(() => root.querySelector("#addProcedure")?.click(), 0);
  }
});

async function initialize() {
  const token = getAccessToken();
  if (!token) {
    showLogin();
    return;
  }
  try {
    const result = await apiRequest("/auth/me");
    showApplication(result.user);
  } catch {
    showLogin();
  }
}

initialize();
