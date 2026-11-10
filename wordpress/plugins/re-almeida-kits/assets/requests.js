(() => {
  const panel = document.querySelector(".rak-operations");
  if (!panel) return;
  const feedback = panel.querySelector("#rak-feedback");
  const dialog = panel.querySelector("#rak-detail");
  const content = dialog.querySelector("[data-content]");
  let activeRow;
  let busy = false;

  async function request(action, row, values = {}) {
    const body = new window.URLSearchParams({
      action: "rak_operations_" + action,
      _ajax_nonce: panel.dataset.nonce,
      request: row.dataset.request,
      line: row.dataset.line,
      version: row.dataset.version,
      ...values,
    });
    const response = await window.fetch(panel.dataset.ajax, {
      method: "POST",
      credentials: "same-origin",
      body,
    });
    const result = await response.json().catch(() => null);
    if (!response.ok || !result?.success) {
      throw new Error(typeof result?.data === "string" ? result.data : "Operação indisponível. Confira sua sessão e recarregue.");
    }
    return result.data;
  }

  function updateVersion(row, version) {
    for (const current of panel.querySelectorAll("tr[data-request]")) {
      if (current.dataset.request === row.dataset.request) current.dataset.version = version;
    }
  }

  async function save(row, values) {
    const result = await request("save", row, values);
    updateVersion(row, result.version);
    row.querySelector('[name="documentStatus"]').value = result.documentStatus;
    row.querySelector('[name="pickupStatus"]').value = result.pickupStatus;
  }

  async function detail(row) {
    const result = await request("detail", row);
    content.innerHTML = result.html;
  }

  async function run(work, report = feedback) {
    if (busy) return;
    busy = true;
    panel.setAttribute("aria-busy", "true");
    report.textContent = "Processando…";
    try {
      report.textContent = await work();
    } catch (error) {
      report.textContent = error.message;
    } finally {
      busy = false;
      panel.removeAttribute("aria-busy");
    }
  }

  function selected() {
    return [...panel.querySelectorAll('[name="selected[]"]:checked')].map((box) => box.closest("tr"));
  }

  panel.querySelector("#rak-select-all")?.addEventListener("change", (event) => {
    for (const box of panel.querySelectorAll('[name="selected[]"]')) box.checked = event.target.checked;
  });
  panel.querySelector("#rak-export")?.addEventListener("submit", (event) => {
    if (event.submitter?.value === "all" || selected().length) return;
    event.preventDefault();
    feedback.textContent = "Selecione pelo menos um participante.";
  });
  panel.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    if (button.hasAttribute("data-close")) {
      dialog.close();
      return;
    }
    const row = button.closest("tr");
    if (button.hasAttribute("data-save")) {
      void run(async () => {
        await save(row, Object.fromEntries(["bib", "documentStatus", "pickupStatus"].map((name) => [name, row.querySelector('[name="' + name + '"]').value])));
        return "Alterações salvas.";
      });
    }
    if (button.hasAttribute("data-detail")) {
      void run(async () => {
        activeRow = row;
        await detail(row);
        dialog.showModal();
        return "";
      });
    }
    if (button.dataset.batch) {
      const rows = selected();
      if (!rows.length) {
        feedback.textContent = "Selecione pelo menos um participante.";
        return;
      }
      if (!window.confirm("Aplicar a alteração a " + rows.length + " participantes selecionados?")) return;
      void run(async () => {
        const failures = [];
        for (const current of rows) {
          try {
            await save(current, { mode: button.dataset.batch, pickupStatus: panel.querySelector('[name="batchPickup"]').value });
          } catch (error) {
            failures.push(current.querySelector("strong").textContent + " — " + error.message);
          }
        }
        return (rows.length - failures.length) + " atualizados. " + failures.join(" · ");
      });
    }
  });

  dialog.addEventListener("submit", (event) => {
    if (!event.target.matches("[data-review]")) return;
    event.preventDefault();
    const values = Object.fromEntries(new window.FormData(event.target, event.submitter));
    const status = document.createElement("p");
    status.setAttribute("role", "status");
    event.target.append(status);
    void run(async () => {
      await save(activeRow, { ...values, mode: "review" });
      await detail(activeRow);
      const confirmation = document.createElement("p");
      confirmation.setAttribute("role", "status");
      confirmation.textContent = "Análise registrada.";
      content.prepend(confirmation);
      return "";
    }, status);
  });
})();
