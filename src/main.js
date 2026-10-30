import { renderDashboard } from "./modules/dashboard.js";
import { renderProcedures } from "./modules/procedures.js";
import { renderSurgeries } from "./modules/surgeries.js";

const root = document.querySelector("#appContent");
const titles = { dashboard: "Visão geral", procedures: "Procedimentos", surgeries: "Cirurgias" };
let currentView = "dashboard";

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

document.querySelectorAll("[data-view]").forEach(button => button.addEventListener("click", () => navigate(button.dataset.view)));
document.querySelector("#mobileMenu").addEventListener("click", () => document.querySelector("#sidebar").classList.toggle("sidebar-open"));
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

navigate(currentView);