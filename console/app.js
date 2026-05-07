const views = ["ops"];

const byId = (id) => document.getElementById(id);

const renderJson = (id, payload) => {
  byId(id).textContent = JSON.stringify(payload, null, 2);
};

const setError = (message) => {
  byId("ops-error").textContent = message || "";
};

const apiGet = async (url) => {
  const response = await fetch(url, { method: "GET" });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error || "request_failed");
  }
  return data;
};

const apiPost = async (url, body) => {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error || "request_failed");
  }
  return data;
};

const runJob = async (name) => {
  setError("");
  try {
    const response = await apiPost("/api/ops/run", { name });
    renderJson("ops-result", response.job);
  } catch (err) {
    setError(err.message || "request_failed");
  }
};

const renderJobs = (jobs) => {
  const container = byId("ops-jobs");
  container.innerHTML = "";
  jobs.forEach((job) => {
    const row = document.createElement("div");
    row.className = "job-row";
    const label = document.createElement("div");
    label.textContent = job.label;
    const button = document.createElement("button");
    button.className = "run-job";
    button.textContent = "Run";
    button.addEventListener("click", () => runJob(job.name));
    row.append(label, button);
    container.append(row);
  });
};

const loadOpsView = async () => {
  setError("");
  renderJson("ops-result", {});
  try {
    const response = await apiGet("/api/ops/jobs");
    renderJobs(Array.isArray(response.jobs) ? response.jobs : []);
  } catch (err) {
    setError(err.message || "request_failed");
  }
};

const setActiveView = async (targetView) => {
  views.forEach((view) => {
    const section = byId(`view-${view}`);
    const nav = document.querySelector(`.nav-item[data-view="${view}"]`);
    const isActive = view === targetView;
    section.classList.toggle("active", isActive);
    nav.classList.toggle("active", isActive);
  });
  if (targetView === "ops") {
    await loadOpsView();
  }
};

const initialize = async () => {
  const navItems = Array.from(document.querySelectorAll(".nav-item[data-view]"));
  navItems.forEach((item) => {
    item.addEventListener("click", async () => {
      await setActiveView(item.dataset.view);
    });
  });
  await setActiveView("ops");
};

initialize();
