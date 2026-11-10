(function () {
  "use strict";
  const node = (tag, text, className) => {
    const el = document.createElement(tag);
    if (text) el.textContent = text;
    if (className) el.className = className;
    return el;
  };
  const button = (text, callback) => {
    const el = node("button", text, "button");
    el.type = "button";
    el.addEventListener("click", callback);
    return el;
  };
  function choosePdf(onSelect) {
    const frame = wp.media({
      title: "PDF público em branco — nunca documento pessoal",
      library: { type: "application/pdf" },
      multiple: false,
    });
    frame.on("select", () =>
      onSelect(frame.state().get("selection").first().toJSON()),
    );
    frame.open();
  }
  document.querySelectorAll(".rak-model-picker").forEach((wrap) => {
    const input = wrap.querySelector("input"),
      selected = wrap.querySelector(".rak-pdf-selection");
    wrap.querySelector(".rak-choose-pdf").addEventListener("click", () =>
      choosePdf((media) => {
        input.value = media.id;
        selected.textContent = `PDF #${media.id} — ${media.filename}`;
      }),
    );
    wrap.querySelector(".rak-clear-pdf").addEventListener("click", () => {
      input.value = "0";
      selected.textContent = "Nenhum modelo selecionado";
    });
  });
  const categories = {
    "": "Outros documentos",
    personal: "Documentos pessoais",
    proof: "Comprovantes",
    authorization: "Autorizações",
  };
  function documentEditor(config, item, onSaved) {
    const dialog = node("dialog", "", "rak-library-dialog");
    const form = node("form", "", "rak-library-form");
    const title = node("h2", item.libraryId ? "Editar documento" : "Novo documento");
    const message = node("p");
    message.setAttribute("role", "status");
    dialog.setAttribute("aria-label", title.textContent);
    dialog.append(title, form);
    const field = (label, control) => {
      const wrap = node("label", label);
      wrap.append(control);
      form.append(wrap);
      return control;
    };
    const label = field("Nome do documento", node("input"));
    label.required = true;
    label.maxLength = 200;
    label.value = item.label ?? "";
    const category = field("Categoria", node("select"));
    for (const [key, name] of Object.entries(categories)) {
      const option = node("option", name);
      option.value = key;
      category.append(option);
    }
    category.value = item.category ?? "";
    const purpose = field("Finalidade", node("input"));
    purpose.value = item.purpose ?? "";
    const guidance = field("Instruções para o participante", node("textarea"));
    guidance.rows = 4;
    guidance.value = item.guidance ?? "";
    const checkbox = (text, checked) => {
      const control = node("input");
      control.type = "checkbox";
      control.checked = checked;
      field(text, control).parentElement.className = "rak-library-check";
      return control;
    };
    const active = checkbox("Disponível para novas associações", item.active !== false);
    active.disabled = item.forRace === true;
    const upload = checkbox("Exige envio de arquivo", item.requiresUpload !== false);
    const signature = checkbox("Exige assinatura", item.requiresSignature === true);
    signature.addEventListener("change", () => { if (signature.checked) upload.checked = true; });
    upload.addEventListener("change", () => { if (!upload.checked) signature.checked = false; });
    let templateId = item.templateId ?? 0;
    const model = node("p", templateId ? "Modelo PDF selecionado" : "Sem modelo PDF");
    const confirmed = checkbox("Confirmo que o modelo é público, em branco e sem dados pessoais", false);
    form.append(model, button("Selecionar ou enviar modelo PDF", () => {
      const frame = wp.media({ title: "Modelo PDF público em branco", library: { type: "application/pdf" }, multiple: false });
      dialog.close();
      frame.on("select", () => {
        const selected = frame.state().get("selection").first().toJSON();
        templateId = selected.id;
        model.textContent = selected.filename;
        confirmed.checked = false;
      });
      frame.on("close", () => dialog.showModal());
      frame.open();
    }), button("Remover modelo", () => {
      templateId = 0;
      model.textContent = "Sem modelo PDF";
    }));
    let modality, required, condition;
    if (item.forRace) {
      form.append(node("h3", "Aplicação nesta corrida"));
      const selectField = (label, values) => {
        const select = field(label, node("select"));
        for (const [key, name] of values) {
          const option = node("option", name);
          option.value = key;
          select.append(option);
        }
        return select;
      };
      modality = selectField("Modalidade", [["both", "Ambas"], ["oficial", "Kit Oficial"], ["appai", "APPAI"]]);
      required = checkbox("Obrigatório nesta corrida", true);
      condition = selectField("Condição de aplicação", [["", "Sempre nesta modalidade"], ...item.conditions.map((entry) =>
        [entry.id, entry.text.slice(0, 85) || "Condição sem texto"])]);
    }
    const save = node("button", "Salvar documento", "button button-primary");
    save.type = "submit";
    const close = () => { dialog.close(); dialog.remove(); };
    dialog.addEventListener("cancel", (event) => { event.preventDefault(); close(); });
    form.append(message, save, button("Cancelar", close));
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      save.disabled = true;
      message.textContent = "Salvando documento…";
      try {
        const body = new window.URLSearchParams({
          action: "rak_library_create", nonce: config.inlineNonce, kind: "documents",
          libraryId: String(item.libraryId ?? 0),
          item: JSON.stringify({
            label: label.value, category: category.value, purpose: purpose.value, guidance: guidance.value,
            active: active.checked, requiresUpload: upload.checked, requiresSignature: signature.checked,
            templateId, confirmPublicTemplate: confirmed.checked,
          }),
        });
        if (item.forRace) {
          body.set("raceId", String(config.raceId));
          body.set("modality", modality.value);
          body.set("required", required.checked ? "1" : "0");
          body.set("conditionId", condition.value);
        }
        const response = await window.fetch(config.ajaxUrl, { method: "POST", credentials: "same-origin", body });
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.data?.message || "Não foi possível salvar o documento.");
        close();
        onSaved(result.data);
      } catch (error) {
        message.textContent = error.message;
        save.disabled = false;
      }
    });
    document.body.append(dialog);
    dialog.showModal();
  }

  const libraryScreen = document.getElementById("rak-document-library");
  if (libraryScreen) {
    const config = JSON.parse(document.getElementById("rak-document-library-data").textContent);
    const renderLibrary = () => {
      const save = (item) => {
        const index = config.items.findIndex((candidate) => candidate.libraryId === item.libraryId);
        if (index < 0) config.items.unshift(item);
        else config.items[index] = item;
        renderLibrary();
      };
      libraryScreen.replaceChildren(button("Novo documento", () => documentEditor(config, {}, save)));
      for (const [category, title] of Object.entries(categories)) {
        const items = config.items.filter((item) => (item.category ?? "") === category);
        if (!items.length) continue;
        const group = node("section", "", "rak-library-group");
        group.append(node("h2", title));
        for (const item of items) {
          const card = node("article", "", "rak-library-card");
          card.append(node("h3", item.label), node("p", item.purpose || "Finalidade não informada"),
            node("p", [item.active ? "Ativo" : "Inativo", "v" + (item.version ?? 0), item.templateId ? "Com modelo PDF" : "Sem modelo PDF"].join(" · ")),
            button("Editar", () => documentEditor(config, item, save)));
          const uses = config.associations[item.libraryId] ?? [];
          const details = node("details");
          details.append(node("summary", uses.length ? "Corridas associadas (" + uses.length + ")" : "Sem corridas associadas"));
          for (const use of uses) {
            const entry = node("p");
            const link = node("a", use.name + " · versão " + use.version);
            if (use.url) link.href = use.url;
            entry.append(link);
            details.append(entry);
          }
          card.append(details);
          group.append(card);
        }
        libraryScreen.append(group);
      }
      if (!config.items.length) libraryScreen.append(node("p", "Nenhum documento cadastrado."));
    };
    renderLibrary();
  }
  function pickupEditor(config, onSaved) {
    const dialog = node("dialog", "", "rak-library-dialog");
    const form = node("form", "", "rak-library-form");
    dialog.setAttribute("aria-label", "Novo local de retirada");
    dialog.append(node("h2", "Novo local de retirada"), form);
    const name = node("input");
    const address = node("input");
    for (const [control, label, limit] of [[name, "Nome do local", 200], [address, "Endereço completo", 500]]) {
      control.required = true;
      control.maxLength = limit;
      const field = node("label", label);
      field.append(control);
      form.append(field);
    }
    const message = node("p");
    message.setAttribute("role", "status");
    const save = node("button", "Salvar local", "button button-primary");
    save.type = "submit";
    const close = () => { dialog.close(); dialog.remove(); };
    dialog.addEventListener("cancel", (event) => { event.preventDefault(); close(); });
    form.append(message, save, button("Cancelar", close));
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      save.disabled = true;
      try {
        const body = new window.URLSearchParams({ action: "rak_pickup_create", nonce: config.inlineNonce,
          label: name.value, address: address.value });
        const response = await window.fetch(config.ajaxUrl, { method: "POST", credentials: "same-origin", body });
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.data?.message || "Não foi possível salvar o local.");
        close();
        onSaved(result.data);
      } catch (error) {
        message.textContent = error.message;
        save.disabled = false;
      }
    });
    document.body.append(dialog);
    dialog.showModal();
  }
  const root = document.getElementById("rak-editor");
  if (!root) return;
  const config = JSON.parse(document.getElementById("rak-schema").textContent);
  const state = Array.isArray(config.data) ? {} : config.data;
  const payload = document.getElementById("rak-payload");
  const form = document.getElementById("post");
  form.noValidate = true;
  let dirty = false,
    count = 0,
    attempted = false;
  const conditionals = [],
    panels = [],
    tabs = [],
    fieldGroups = new Map();
  const navigation = node("div", "", "nav-tab-wrapper rak-tabs");
  navigation.setAttribute("role", "tablist");
  navigation.setAttribute("aria-label", "Cadastro da corrida");
  const summary = node("div", "", "rak-error-summary");
  summary.setAttribute("role", "alert");
  summary.tabIndex = -1;
  summary.hidden = true;
  root.append(navigation, summary);
  function defaults(definitions, data) {
    Object.entries(definitions).forEach(([key, f]) => {
      if (data[key] === undefined)
        data[key] =
          f.default ??
          (f.type === "checkbox"
            ? false
            : f.type === "money"
              ? null
              : ["image", "pdf"].includes(f.type)
                ? 0
                : ["rows", "lines"].includes(f.type)
                  ? []
                  : f.type === "select"
                    ? Object.keys(f.options)[0]
                    : "");
      if (f.type === "rows")
        data[key].forEach((row) => defaults(f.fields, row));
    });
  }
  config.sections.forEach((s) => defaults(s.fields, state));
  function activate(index, focus = false) {
    panels.forEach((p, i) => {
      p.hidden = i !== index;
      tabs[i].setAttribute("aria-selected", String(i === index));
      tabs[i].tabIndex = i === index ? 0 : -1;
      tabs[i].classList.toggle("nav-tab-active", i === index);
    });
    if (focus) tabs[index].focus();
  }
  const serialize = () => {
    payload.value = JSON.stringify(state);
    payload.disabled = false;
  };
  function visibility() {
    conditionals.forEach(([wrap, key]) => {
      wrap.hidden =
        !state[key] ||
        (["shirtEnabled", "numberEnabled"].includes(key) &&
          !state.appaiEnabled);
    });
  }
  function changed() {
    dirty = true;
    visibility();
    serialize();
    if (attempted) showErrors(validate(), false);
  }
  function validationTarget(key) {
    const wrap = fieldGroups.get(key);
    return (
      wrap?.querySelector("input:not([type=hidden]),select,textarea,button") ||
      document.getElementById(
        key === "duplicateReview" ? "rak-copy-reviewed" : "title",
      )
    );
  }
  function validate() {
    const errors = [];
    root.querySelectorAll("input,select,textarea").forEach((input) => {
      if (
        input.type !== "hidden" &&
        !input.closest(".rak-field[hidden]") &&
        !input.checkValidity()
      )
        errors.push({
          input,
          message: input.validationMessage || "Confira este campo.",
        });
    });
    const add = (key, message) =>
      errors.push({ input: validationTarget(key), message });
    if (!document.getElementById("title")?.value.trim())
      add("title", "Informe o nome da corrida.");
    if (!state.officialEnabled && !state.appaiEnabled)
      add("officialEnabled", "Habilite pelo menos uma modalidade.");
    if (state.appaiEnabled && !state.shirtEnabled && !state.numberEnabled)
      add("numberEnabled", "Habilite camiseta ou somente número na APPAI.");
    if (state.appaiEnabled && state.shirtEnabled && !state.sizes.length)
      add("sizes", "Informe os tamanhos disponíveis para a camiseta.");
    for (const [mode, enabled] of [
      ["oficial", state.officialEnabled],
      ["appai", state.appaiEnabled],
    ])
      if (
        enabled &&
        !state.distances.some((d) => ["both", mode].includes(d.modality))
      )
        add("distances", `Adicione uma distância para ${mode}.`);
    if (state.opensAt && state.closesAt && state.opensAt >= state.closesAt)
      add("closesAt", "O encerramento deve ocorrer após a abertura.");
    return errors;
  }
  function showErrors(errors, focus = true) {
    root
      .querySelectorAll("[aria-invalid=true]")
      .forEach((el) => el.removeAttribute("aria-invalid"));
    tabs.forEach((tab, index) => {
      const n = errors.filter(
        (e) => e.input?.closest(".rak-tab-panel") === panels[index],
      ).length;
      tab.textContent =
        config.sections[index].title + (n ? ` · ${n} pendência(s)` : "");
    });
    summary.replaceChildren();
    summary.hidden = !errors.length;
    if (!errors.length) return;
    summary.append(
      node("p", "Não foi possível salvar. Corrija as pendências nas abas:"),
    );
    errors.forEach((error) => {
      if (error.input) error.input.setAttribute("aria-invalid", "true");
      const action = button(error.message, () => focusError(error));
      summary.append(action);
    });
    if (focus) focusError(errors[0]);
  }
  function focusError(error) {
    const panel = error.input?.closest(".rak-tab-panel");
    activate(Math.max(0, panels.indexOf(panel)));
    error.input?.focus();
    error.input?.scrollIntoView({ block: "center" });
  }
  function fields(target, definitions, data, top = false) {
    Object.entries(definitions).forEach(([key, f]) => {
      const wrap = node("div", "", "rak-field");
      wrap.dataset.key = key;
      if (top) fieldGroups.set(key, wrap);
      if (f.when) conditionals.push([wrap, f.when]);
      target.append(wrap);
      if (f.type === "rows") {
        wrap.append(node("h3", f.label));
        if (f.help) wrap.append(node("p", f.help, "description"));
        const library = config.libraries?.[key];
        const list = node("div");
        function renderRows() {
          list.replaceChildren();
          data[key].forEach((row, index) => {
            const panel = node("fieldset", "", "rak-row");
            panel.append(
              node(
                "legend",
                `${index + 1}. ${row.label || (key === "conditions" ? row.text.slice(0, 60) : f.label)}`,
              ),
            );
            const description = key === "documents"
              ? [row.libraryId ? "Biblioteca · versão " + row.libraryVersion : "Exigência específica",
                  row.required ? "Obrigatório" : "Opcional", row.templateId ? "Com modelo PDF" : "Sem modelo PDF",
                  row.requiresSignature ? "Exige assinatura" : ""].filter(Boolean).join(" · ")
              : `Identificador: ${row.id}${row.version ? ` · versão da corrida ${row.version}` : ""}${row.libraryId ? ` · biblioteca #${row.libraryId}, versão ${row.libraryVersion}` : " · específico desta corrida"}`;
            panel.append(node("p", description, "description"));
            if (row.libraryId) {
              const current = library?.find(
                (item) => item.libraryId === row.libraryId,
              );
              if (current && current.version !== row.libraryVersion)
                panel.append(
                  node(
                    "p",
                    "Existe uma nova versão na biblioteca. A cópia desta corrida permanece preservada. Para atualizar, remova a associação e selecione novamente.",
                    "notice notice-info inline",
                  ),
                );
              panel.append(
                button(
                  "Desvincular: editar como específico desta corrida",
                  () => {
                    row.libraryId = 0;
                    row.libraryVersion = 0;
                    changed();
                    renderRows();
                  },
                ),
              );
            }
            const definitions = key === "documents" && row.libraryId
              ? Object.fromEntries(Object.entries(f.fields).filter(([field]) =>
                  !["purpose", "requiresUpload", "requiresSignature", "templateId"].includes(field)))
              : f.fields;
            fields(panel, definitions, row);
            if (key === "documents") {
              const old = panel.querySelector("[data-key=conditionId] input");
              if (old) {
                const condition = node("select");
                condition.id = old.id;
                const fill = () => {
                  condition.replaceChildren();
                  for (const [value, label] of [["", "Sempre nesta modalidade"], ...state.conditions.map((entry) =>
                    [entry.id, entry.text.slice(0, 85) || "Condição sem texto"])]) {
                    const option = node("option", label);
                    option.value = value;
                    condition.append(option);
                  }
                  if (row.conditionId && !Array.from(condition.options).some((option) => option.value === row.conditionId)) {
                    const missing = node("option", "Condição removida. Selecione outra.");
                    missing.value = row.conditionId;
                    condition.append(missing);
                  }
                  condition.value = row.conditionId ?? "";
                };
                fill();
                old.replaceWith(condition);
                condition.addEventListener("focus", fill);
                condition.addEventListener("change", () => { row.conditionId = condition.value; changed(); });
              }
            }

            if (key === "conditions" && row.libraryId)
              panel.querySelector("textarea").readOnly = true;
            if (key === "conditions") {
              const name = node("input");
              name.type = "text";
              name.id = `rak-library-name-${++count}`;
              name.value = row.label || "";
              name.maxLength = 200;
              const label = node("label", "Nome para salvar na biblioteca");
              label.htmlFor = name.id;
              if (!row.libraryId)
                panel.append(
                  label,
                  name,
                  button(
                    "Salvar esta configuração na biblioteca",
                    async (event) => {
                      const save = event.currentTarget;
                      save.disabled = true;
                      const notice = node("p", "Salvando…");
                      notice.setAttribute("role", "status");
                      panel.append(notice);
                      try {
                        const body = new window.URLSearchParams({
                          action: "rak_library_create",
                          nonce: config.inlineNonce,
                          kind: key,
                          item: JSON.stringify({ ...row, label: name.value }),
                        });
                        const response = await window.fetch(config.ajaxUrl, {
                          method: "POST",
                          credentials: "same-origin",
                          body,
                        });
                        const result = await response.json();
                        if (!response.ok || !result.success)
                          throw new Error(
                            result.data?.message ||
                              "Não foi possível salvar na biblioteca. Confira sua sessão.",
                          );
                        library.push(result.data);
                        row.libraryId = result.data.libraryId;
                        row.libraryVersion = result.data.version;
                        // Preserve the stable race requirement ID and per-race overrides.
                        changed();
                        renderRows();
                      } catch (error) {
                        notice.textContent = error.message;
                        notice.setAttribute("role", "alert");
                        save.disabled = false;
                      }
                    },
                  ),
                );
            }
            const controls = node("div", "", "rak-row-actions");
            const move = (offset) => {
              [data[key][index], data[key][index + offset]] = [
                data[key][index + offset],
                data[key][index],
              ];
              changed();
              renderRows();
              list.children[index + offset]?.querySelector("button")?.focus();
            };
            const up = button("↑ Mover para cima", () => move(-1));
            up.disabled = index === 0;
            const down = button("↓ Mover para baixo", () => move(1));
            down.disabled = index === data[key].length - 1;
            controls.append(
              up,
              down,
              button("Remover associação / item", () => {
                if (
                  !window.confirm(
                    "Remover desta corrida? O item da biblioteca e as demais corridas serão preservados.",
                  )
                )
                  return;
                data[key].splice(index, 1);
                changed();
                renderRows();
                add.focus();
              }),
            );
            panel.append(controls);
            list.append(panel);
          });
          visibility();
        }
        if (library) {
          const select = node("select");
          select.setAttribute(
            "aria-label",
            key === "documents"
              ? "Selecionar documento reutilizável"
              : "Selecionar condição reutilizável",
          );
          const refresh = () => {
            select.replaceChildren();
            const empty = node("option", "Selecione um item da biblioteca");
            empty.value = "";
            select.append(empty);
            library.forEach((item) => {
              const option = node("option", `${item.label} · v${item.version}`);
              option.value = String(item.libraryId);
              select.append(option);
            });
          };
          refresh();
          select.addEventListener("focus", refresh);
          wrap.append(
            select,
            button("Associar item selecionado", () => {
              const item = library.find(
                (item) => String(item.libraryId) === select.value,
              );
              if (!item) return;
              if (data[key].some((row) => row.libraryId === item.libraryId)) {
                summary.hidden = false;
                summary.textContent =
                  "Este item já está associado. Ajuste a modalidade ou obrigatoriedade na associação existente.";
                summary.focus();
                return;
              }
              const row =
                key === "pickups"
                  ? { id: item.id, label: item.label, address: item.address, modality: "both", at: "", guidance: "" }
                  : key === "documents"
                  ? {
                      id: item.id,
                      label: item.label,
                      guidance: item.guidance,
                      purpose: item.purpose,
                      requiresUpload: item.requiresUpload,
                      requiresSignature: item.requiresSignature ?? false,
                      templateId: item.templateId,
                      required: true,
                      scope: "race",
                      modality: "both",
                    }
                  : { id: item.id, text: item.text, active: true, version: 1 };
              row.libraryId = item.libraryId;
              row.libraryVersion = item.version;
              data[key].push(row);
              changed();
              renderRows();
              list.lastElementChild
                ?.querySelector("input,textarea,button")
                ?.focus();
            }),
            node(
              "p",
              "Associar copia a versão atual. Alterações futuras na biblioteca não mudam esta corrida.",
              "description",
            ),
          );
        }
        wrap.append(list);
        const addLabel = { documents: "Cadastrar documento na biblioteca", pickups: "Cadastrar local na biblioteca", kits: "Adicionar opção de kit" };
        const add = button(addLabel[key] ?? "+ Adicionar item específico", () => {
          if (key === "pickups") {
            pickupEditor(config, (location) => {
              if (!library.some((item) => item.libraryId === location.libraryId)) library.push(location);
              if (!data[key].some((row) => row.libraryId === location.libraryId)) {
                data[key].push({ id: location.id, label: location.label, address: location.address, modality: "both",
                  at: "", guidance: "", libraryId: location.libraryId, libraryVersion: location.version });
                changed();
                renderRows();
              }
              const notice = node("p", "Local salvo na biblioteca. Salve a corrida para confirmar a associação.");
              notice.setAttribute("role", "status");
              list.prepend(notice);
            });
            return;
          }
          if (key === "documents") {
            documentEditor(config, { forRace: true, conditions: state.conditions }, (item) => {
              if (item.active) library.push(item);
              data[key].push(item.association);
              changed();
              renderRows();
              const notice = node("p", item.associationSaved
                ? "Documento salvo na biblioteca e associado à corrida."
                : "Documento salvo na biblioteca. Salve a corrida para publicar a associação.");
              notice.setAttribute("role", "status");
              list.prepend(notice);
              list.lastElementChild?.querySelector("input,select,button")?.focus();
            });
            return;
          }
          const row = { id: `rak-${crypto.randomUUID().slice(0, 18)}` };
          defaults(f.fields, row);
          data[key].push(row);
          changed();
          renderRows();
          list.lastElementChild
            ?.querySelector("input,textarea,select")
            ?.focus();
        });
        renderRows();
        wrap.append(add);
        return;
      }
      const id = `rak-field-${++count}`;
      const label = node("label", f.label);
      label.htmlFor = id;
      wrap.append(label);
      if (f.type === "pdf") {
        const selected = node(
          "p",
          data[key] ? `PDF #${data[key]}` : "Nenhum modelo selecionado",
          "description",
        );
        const choose = button("Selecionar PDF público em branco", () =>
          choosePdf((media) => {
            data[key] = media.id;
            selected.textContent = `PDF #${media.id} — ${media.filename}`;
            changed();
          }),
        );
        choose.id = id;
        const confirmation = node("input");
        confirmation.type = "checkbox";
        confirmation.checked = Boolean(data.confirmPublicTemplate);
        confirmation.addEventListener("change", () => {
          data.confirmPublicTemplate = confirmation.checked;
          changed();
        });
        const confirmLabel = node(
          "label",
          "Confirmo que é um modelo público em branco, sem dados pessoais.",
        );
        confirmLabel.prepend(confirmation);
        wrap.append(
          choose,
          button("Remover PDF desta associação", () => {
            data[key] = 0;
            selected.textContent = "Nenhum modelo selecionado";
            changed();
          }),
          selected,
          confirmLabel,
          node(
            "p",
            "Para aprovar um PDF novo, marque a confirmação e salve a exigência na biblioteca. Não envie autorizações assinadas aqui.",
            "description",
          ),
        );
        return;
      }
      if (f.type === "image") {
        const preview = node("img");
        preview.alt = "Prévia da imagem da camiseta";
        preview.className = "rak-image";
        preview.hidden = !data[key];
        if (config.image) preview.src = config.image;
        const selected = node(
          "span",
          data[key] ? `Imagem #${data[key]}` : "Nenhuma imagem selecionada",
          "description",
        );
        const choose = button("Escolher imagem na biblioteca", () => {
          const frame = wp.media({
            title: "Imagem real da camiseta",
            library: { type: "image" },
            multiple: false,
          });
          frame.on("select", () => {
            const media = frame.state().get("selection").first().toJSON();
            data[key] = media.id;
            preview.src = media.sizes?.medium?.url || media.url;
            preview.hidden = false;
            selected.textContent = `Imagem #${media.id}`;
            changed();
          });
          frame.open();
        });
        choose.id = id;
        wrap.append(
          choose,
          button("Remover imagem", () => {
            data[key] = 0;
            preview.hidden = true;
            selected.textContent = "Nenhuma imagem selecionada";
            changed();
          }),
          selected,
          preview,
        );
        return;
      }
      if (f.choices) {
        const group = node("fieldset");
        group.append(node("legend", f.label));
        const choices = [...new Set([...f.choices, ...data[key]])];
        for (const size of choices) {
          const label = node("label");
          const check = node("input");
          check.type = "checkbox";
          check.checked = data[key].includes(size);
          check.addEventListener("change", () => {
            data[key] = check.checked ? [...data[key], size] : data[key].filter((value) => value !== size);
            changed();
          });
          label.append(check, node("span", f.choices.includes(size) ? size : size + " (cadastro anterior)"));
          group.append(label, document.createTextNode(" "));
        }
        wrap.append(group);
        return;
      }
      const input = node(
        ["textarea", "lines"].includes(f.type)
          ? "textarea"
          : f.type === "select"
            ? "select"
            : "input",
      );
      input.id = id;
      input.required = Boolean(f.required);
      if (f.type === "select")
        Object.entries(f.options).forEach(([value, text]) => {
          const option = node("option", text);
          option.value = value;
          input.append(option);
        });
      else if (input.tagName === "INPUT")
        input.type = f.type === "money" ? "text" : f.type;
      if (f.type === "checkbox") input.checked = data[key];
      else if (f.type === "lines") input.value = data[key].join("\n");
      else if (f.type === "money") {
        input.inputMode = "decimal";
        input.value =
          data[key] === null
            ? ""
            : (data[key] / 100).toFixed(2).replace(".", ",");
      } else
        input.value =
          f.type === "datetime-local"
            ? String(data[key]).slice(0, 16)
            : data[key];
      input.addEventListener("input", () => {
        input.setCustomValidity("");
        if (f.type === "checkbox") data[key] = input.checked;
        else if (f.type === "lines")
          data[key] = input.value
            .split(/\r?\n/)
            .map((s) => s.trim())
            .filter(Boolean);
        else if (f.type === "money") {
          const v = input.value.trim();
          if (v && !/^\d{1,6}([,.]\d{1,2})?$/.test(v))
            input.setCustomValidity(
              "Informe um valor do serviço entre 0 e 999.999,99, com até duas casas.",
            );
          data[key] =
            v === "" ? null : Math.round(Number(v.replace(",", ".")) * 100);
        } else data[key] = input.value;
        changed();
      });
      if (f.help) {
        const help = node("p", f.help, "description");
        help.id = `${id}-help`;
        wrap.append(help);
        input.setAttribute("aria-describedby", help.id);
      }
      wrap.append(input);
    });
  }
  config.sections.forEach((section, index) => {
    const tab = button(section.title, () => activate(index));
    tab.className = "nav-tab";
    tab.id = `rak-tab-${index}`;
    tab.setAttribute("role", "tab");
    tab.setAttribute("aria-controls", `rak-panel-${index}`);
    tab.addEventListener("keydown", (event) => {
      let next;
      if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
      if (event.key === "ArrowLeft")
        next = (index + tabs.length - 1) % tabs.length;
      if (event.key === "Home") next = 0;
      if (event.key === "End") next = tabs.length - 1;
      if (next !== undefined) {
        event.preventDefault();
        activate(next, true);
      }
    });
    const panel = node("section", "", "rak-tab-panel");
    panel.id = `rak-panel-${index}`;
    panel.setAttribute("role", "tabpanel");
    panel.setAttribute("aria-labelledby", tab.id);
    fields(panel, section.fields, state, true);
    tabs.push(tab);
    panels.push(panel);
    navigation.append(tab);
    root.append(panel);
  });
  const basics = document.getElementById("post-body-content");
  if (basics) panels[0].prepend(basics);
  const image = document.getElementById("postimagediv");
  if (image) panels[0].append(image);
  const copy = document.getElementById("rak-copy-reviewed");
  if (copy) panels[0].prepend(copy.closest(".notice"));
  root.addEventListener("input", () => {
    dirty = true;
  });
  activate(0);
  visibility();
  serialize();
  form.addEventListener(
    "submit",
    (event) => {
      attempted = true;
      const errors = validate();
      if (errors.length) {
        event.preventDefault();
        event.stopImmediatePropagation();
        showErrors(errors);
        return;
      }
      serialize();
      dirty = false;
    },
    true,
  );
  if (config.errorMessage) {
    const errors = (
      config.errorFields.length ? config.errorFields : ["title"]
    ).map((key) => ({
      input: validationTarget(key),
      message: config.errorMessage,
    }));
    window.requestAnimationFrame(() => showErrors(errors));
  }
  window.addEventListener("beforeunload", (event) => {
    if (dirty) {
      event.preventDefault();
      event.returnValue = "";
    }
  });
})();
