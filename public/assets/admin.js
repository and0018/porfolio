(() => {
  "use strict";

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  const state = {
    settings: {},
    works: [],
    categories: {},
    services: [],
    usingDefaultPassword: false,
    demoCount: 0,
    storage: {},
    tab: "overview",
    search: "",
    status: "all",
    editingId: null,
    coverFile: null,
    existingCover: "",
    removeCover: false,
    coverObjectUrl: "",
    aboutPhotoFile: null,
    removeAboutPhoto: false,
  };

  const elements = {
    tabs: $$(".side-link[data-tab]"),
    panels: $$(".tab-panel"),
    pageTitle: $("#pageTitle"),
    saveState: $("#saveState"),
    sideCount: $("#sideCount"),
    passwordNotice: $("#passwordNotice"),
    storageNotice: $("#storageNotice"),
    storageNoticeText: $("#storageNoticeText"),
    demoNotice: $("#demoNotice"),
    demoCount: $("#demoCount"),
    stats: $("#stats"),
    recentList: $("#recentList"),
    workTable: $("#workTable"),
    searchWorks: $("#searchWorks"),
    filterStatus: $("#filterStatus"),
    settingsForm: $("#settingsForm"),
    servicesEditor: $("#servicesEditor"),
    addService: $("#addService"),
    aboutPhotoInput: $("#aboutPhotoInput"),
    aboutPhotoPreview: $("#aboutPhotoPreview"),
    aboutPhotoImg: $("#aboutPhotoImg"),
    aboutPhotoEmpty: $("#aboutPhotoEmpty"),
    clearAboutPhoto: $("#clearAboutPhoto"),
    saveSettingsBtn: $("#saveSettingsBtn"),
    drawer: $("#workDrawer"),
    drawerPanel: $(".drawer-panel", $("#workDrawer")),
    drawerTitle: $("#drawerTitle"),
    workForm: $("#workForm"),
    workTitle: $("#workTitle"),
    workCategory: $("#workCategory"),
    workYear: $("#workYear"),
    workDescription: $("#workDescription"),
    workClient: $("#workClient"),
    workTiktok: $("#workTiktok"),
    workMedia: $("#workMedia"),
    workExternal: $("#workExternal"),
    workInstagram: $("#workInstagram"),
    workPublished: $("#workPublished"),
    workFeatured: $("#workFeatured"),
    descCount: $("#descCount"),
    coverDrop: $("#coverDrop"),
    coverInput: $("#coverInput"),
    coverEmpty: $("#coverEmpty"),
    coverPreview: $("#coverPreview"),
    coverPreviewImg: $("#coverPreviewImg"),
    coverHint: $("#coverHint"),
    saveWorkBtn: $("#saveWorkBtn"),
    confirm: $("#confirm"),
    confirmCard: $(".confirm-card", $("#confirm")),
    confirmTitle: $("#confirmTitle"),
    confirmText: $("#confirmText"),
    confirmOk: $("#confirmOk"),
    confirmCancel: $("#confirmCancel"),
    toast: $("#toast"),
  };

  let confirmResolve = null;
  let toastTimer = null;
  let savedTimer = null;

  /* ---------------------------------------------------------------------- */
  /*  Base                                                                  */
  /* ---------------------------------------------------------------------- */

  async function api(url, options = {}) {
    const request = { ...options };
    request.headers = new Headers(options.headers || {});

    if (request.method && request.method.toUpperCase() !== "GET") {
      request.headers.set("x-admin-request", "1");
    }

    if (request.body && !(request.body instanceof FormData)) {
      if (typeof request.body !== "string") request.body = JSON.stringify(request.body);
      request.headers.set("Content-Type", "application/json");
    }

    const response = await fetch(url, request);

    if (response.status === 401) {
      window.location.href = "/admin";
      throw new Error("Sessão expirada.");
    }

    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Não foi possível concluir a ação.");
    return data;
  }

  function toast(message, isError = false) {
    if (!elements.toast) return;
    elements.toast.textContent = message;
    elements.toast.classList.toggle("error", Boolean(isError));
    elements.toast.classList.add("show");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => elements.toast.classList.remove("show"), 3400);
  }

  function markSaved(label = "Alterações salvas ✓") {
    if (!elements.saveState) return;
    elements.saveState.textContent = label;
    window.clearTimeout(savedTimer);
    savedTimer = window.setTimeout(() => {
      elements.saveState.textContent = "";
    }, 4500);
  }

  function categoryLabel(key) {
    return state.categories[key] || "Projeto";
  }

  function formatDate(value) {
    if (!value) return "";
    try {
      return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(new Date(value));
    } catch {
      return "";
    }
  }

  function confirmDialog({ title, text, okLabel = "Confirmar", danger = true }) {
    return new Promise((resolve) => {
      if (!elements.confirm) return resolve(false);
      elements.confirmTitle.textContent = title;
      elements.confirmText.textContent = text;
      elements.confirmOk.textContent = okLabel;
      elements.confirmOk.className = danger ? "btn-danger" : "btn-primary";
      elements.confirm.hidden = false;
      confirmResolve = resolve;
      window.requestAnimationFrame(() => elements.confirmCard?.focus({ preventScroll: true }));
    });
  }

  function resolveConfirm(value) {
    if (!elements.confirm) return;
    elements.confirm.hidden = true;
    if (!confirmResolve) return;
    const resolve = confirmResolve;
    confirmResolve = null;
    resolve(value);
  }

  /* ---------------------------------------------------------------------- */
  /*  Carga e renderização                                                  */
  /* ---------------------------------------------------------------------- */

  async function loadData({ renderSettings = false } = {}) {
    const data = await api("/api/admin/data");

    state.settings = data.settings || {};
    state.works = Array.isArray(data.works) ? data.works : [];
    state.categories = data.categories || {};
    state.usingDefaultPassword = Boolean(data.usingDefaultPassword);
    state.demoCount = Number(data.demoCount) || 0;
    state.storage = data.storage || {};
    state.services = Array.isArray(state.settings.services)
      ? state.settings.services.map((service) => ({ ...service }))
      : [];

    renderNotices();
    renderStats();
    renderRecent();
    renderWorks();
    buildCategoryOptions();

    if (elements.sideCount) elements.sideCount.textContent = String(state.works.length);
    if (renderSettings) renderSettingsForm();
  }

  function renderNotices() {
    if (elements.passwordNotice) elements.passwordNotice.hidden = !state.usingDefaultPassword;

    if (elements.storageNotice) {
      const warning = String(state.storage.warning || "").trim();
      elements.storageNotice.hidden = !warning;
      if (elements.storageNoticeText) elements.storageNoticeText.textContent = warning;
    }

    if (elements.demoNotice) elements.demoNotice.hidden = state.demoCount === 0;
    if (elements.demoCount) elements.demoCount.textContent = String(state.demoCount);
  }

  function renderStats() {
    if (!elements.stats) return;
    const published = state.works.filter((work) => work.published).length;
    const drafts = state.works.length - published;
    const videos = state.works.filter((work) => work.category === "video").length;
    const categories = new Set(state.works.map((work) => work.category)).size;

    const stats = [
      ["Projetos", state.works.length],
      ["Publicados", published],
      ["Vídeos", videos],
      ["Rascunhos", drafts],
    ];

    elements.stats.textContent = "";
    for (const [label, value] of stats) {
      const card = document.createElement("div");
      card.className = "stat";
      const valueElement = document.createElement("div");
      valueElement.className = "stat-value";
      valueElement.textContent = String(value).padStart(2, "0");
      const labelElement = document.createElement("div");
      labelElement.className = "stat-label";
      labelElement.textContent = label;
      card.append(valueElement, labelElement);
      elements.stats.append(card);
    }

    if (categories === 0 && elements.sideCount) elements.sideCount.textContent = "0";
  }

  function buildThumb(work) {
    const thumb = document.createElement("div");
    thumb.className = "recent-thumb";
    if (work.cover) {
      const image = document.createElement("img");
      image.src = work.cover;
      image.alt = "";
      image.loading = "lazy";
      image.addEventListener("error", () => {
        image.hidden = true;
        thumb.textContent = state.settings.monogram || "VA";
      });
      thumb.append(image);
    } else {
      thumb.textContent = state.settings.monogram || "VA";
    }
    return thumb;
  }

  function renderRecent() {
    if (!elements.recentList) return;
    elements.recentList.textContent = "";

    const recent = [...state.works]
      .sort((a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")))
      .slice(0, 4);

    if (!recent.length) {
      const empty = document.createElement("div");
      empty.className = "table-empty";
      const strong = document.createElement("strong");
      strong.textContent = "Sua vitrine está vazia.";
      const text = document.createElement("p");
      text.textContent = "Crie o primeiro projeto para começar.";
      const button = document.createElement("button");
      button.type = "button";
      button.className = "btn-primary btn-sm";
      button.textContent = "+ Criar projeto";
      button.addEventListener("click", () => openWorkDrawer());
      empty.append(strong, text, button);
      elements.recentList.append(empty);
      return;
    }

    for (const work of recent) {
      const row = document.createElement("button");
      row.type = "button";
      row.className = "recent-row";

      const thumb = buildThumb(work);
      thumb.className = "recent-thumb";

      const main = document.createElement("div");
      main.className = "recent-main";
      const title = document.createElement("div");
      title.className = "recent-title";
      title.textContent = work.title;
      const sub = document.createElement("div");
      sub.className = "recent-sub";
      sub.textContent = [categoryLabel(work.category), work.published ? "Publicado" : "Rascunho", formatDate(work.updatedAt)]
        .filter(Boolean)
        .join(", ");
      main.append(title, sub);

      const status = document.createElement("span");
      status.className = `status-pill ${work.published ? "published" : "draft"}`;
      status.textContent = work.published ? "Publicado" : "Rascunho";

      row.append(thumb, main, status);
      row.addEventListener("click", () => openWorkDrawer(work));
      elements.recentList.append(row);
    }
  }

  function filteredWorks() {
    const search = state.search.trim().toLowerCase();
    return state.works.filter((work) => {
      if (state.status === "published" && !work.published) return false;
      if (state.status === "draft" && work.published) return false;
      if (!search) return true;
      const haystack = [work.title, work.client, work.year, categoryLabel(work.category)]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(search);
    });
  }

  function renderWorks() {
    if (!elements.workTable) return;
    elements.workTable.textContent = "";

    if (!state.works.length) {
      const empty = document.createElement("div");
      empty.className = "table-empty";
      const strong = document.createElement("strong");
      strong.textContent = "Nenhum projeto ainda.";
      const text = document.createElement("p");
      text.textContent = "Adicione um vídeo, uma arte ou um projeto para montar sua vitrine.";
      const button = document.createElement("button");
      button.type = "button";
      button.className = "btn-primary";
      button.textContent = "+ Criar primeiro projeto";
      button.addEventListener("click", () => openWorkDrawer());
      empty.append(strong, text, button);
      elements.workTable.append(empty);
      return;
    }

    const works = filteredWorks();

    if (!works.length) {
      const empty = document.createElement("div");
      empty.className = "table-empty";
      const strong = document.createElement("strong");
      strong.textContent = "Nada encontrado.";
      const text = document.createElement("p");
      text.textContent = "Tente outro termo ou ajuste o filtro de status.";
      empty.append(strong, text);
      elements.workTable.append(empty);
      return;
    }

    for (const work of works) {
      const row = document.createElement("div");
      row.className = "work-row";

      const thumb = buildThumb(work);
      thumb.className = "work-thumb";

      const main = document.createElement("div");
      main.className = "work-main";
      const title = document.createElement("div");
      title.className = "work-title";
      title.textContent = work.title;
      if (work.demo) {
        const demoTag = document.createElement("span");
        demoTag.className = "demo-tag";
        demoTag.textContent = "exemplo";
        title.append(demoTag);
      }
      const sub = document.createElement("div");
      sub.className = "work-sub";
      sub.textContent = [work.client, work.year, formatDate(work.updatedAt)].filter(Boolean).join(", ") || "Sem detalhes";
      main.append(title, sub);

      const category = document.createElement("span");
      category.className = "badge-cat";
      category.textContent = categoryLabel(work.category);

      const status = document.createElement("button");
      status.type = "button";
      status.className = `status-pill ${work.published ? "published" : "draft"}`;
      status.title = work.published ? "Clique para despublicar" : "Clique para publicar";
      const statusText = document.createElement("span");
      statusText.textContent = work.published ? "Publicado" : "Rascunho";
      status.append(statusText);
      status.addEventListener("click", async () => {
        try {
          await api(`/api/admin/works/${work.id}/status`, {
            method: "POST",
            body: { published: !work.published },
          });
          await loadData();
          toast(work.published ? "Projeto despublicado." : "Projeto publicado.");
        } catch (error) {
          toast(error.message, true);
        }
      });

      const actions = document.createElement("div");
      actions.className = "row-actions";

      const up = iconAction("↑", "Mover para cima", () => moveWork(work, -1));
      const down = iconAction("↓", "Mover para baixo", () => moveWork(work, 1));
      const edit = iconAction("✎", "Editar projeto", () => openWorkDrawer(work));
      const remove = iconAction("✕", "Excluir projeto", () => deleteWork(work), true);

      const divider = document.createElement("span");
      divider.className = "row-divider";

      actions.append(up, down, divider, edit, remove);
      row.append(thumb, main, category, status, actions);
      elements.workTable.append(row);
    }
  }

  function iconAction(label, title, handler, danger = false) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `icon-btn${danger ? " danger" : ""}`;
    button.title = title;
    button.setAttribute("aria-label", title);
    button.textContent = label;
    button.addEventListener("click", handler);
    return button;
  }

  async function moveWork(work, direction) {
    const index = state.works.findIndex((item) => item.id === work.id);
    const target = index + direction;
    if (index === -1 || target < 0 || target >= state.works.length) return;

    const ids = state.works.map((item) => item.id);
    [ids[index], ids[target]] = [ids[target], ids[index]];

    try {
      await api("/api/admin/works/reorder", { method: "POST", body: { ids } });
      await loadData();
      toast("Ordem atualizada.");
    } catch (error) {
      toast(error.message, true);
    }
  }

  async function deleteWork(work) {
    const confirmed = await confirmDialog({
      title: "Excluir projeto?",
      text: `“${work.title}” será removido da vitrine e não pode ser recuperado. A imagem de capa também será apagada.`,
      okLabel: "Excluir",
    });
    if (!confirmed) return;

    try {
      await api(`/api/admin/works/${work.id}`, { method: "DELETE" });
      await loadData();
      toast("Projeto excluído.");
    } catch (error) {
      toast(error.message, true);
    }
  }

  /* ---------------------------------------------------------------------- */
  /*  Abas                                                                  */
  /* ---------------------------------------------------------------------- */

  const tabMeta = {
    overview: { title: "Visão geral" },
    projects: { title: "Projetos" },
    settings: { title: "Configurações" },
  };

  function setTab(name) {
    const tab = tabMeta[name] ? name : "overview";
    state.tab = tab;

    elements.tabs.forEach((button) => {
      const active = button.dataset.tab === tab;
      button.classList.toggle("active", active);
      if (active) button.setAttribute("aria-current", "page");
      else button.removeAttribute("aria-current");
    });

    elements.panels.forEach((panel) => {
      panel.hidden = panel.id !== `tab-${tab}`;
    });

    if (elements.pageTitle) elements.pageTitle.textContent = tabMeta[tab].title;

    history.replaceState(null, "", `#${tab}`);
  }

  /* ---------------------------------------------------------------------- */
  /*  Configurações                                                         */
  /* ---------------------------------------------------------------------- */

  function renderSettingsForm() {
    const form = elements.settingsForm;
    if (!form) return;

    $$("input[name], textarea[name], select[name]", form).forEach((field) => {
      const key = field.name;
      if (!(key in state.settings)) return;
      field.value = state.settings[key] ?? "";
    });

    state.aboutPhotoFile = null;
    state.removeAboutPhoto = false;
    if (elements.aboutPhotoInput) elements.aboutPhotoInput.value = "";
    renderAboutPhoto(state.settings.aboutPhoto || "");
    renderServicesEditor();
  }

  function renderAboutPhoto(source) {
    if (!elements.aboutPhotoImg || !elements.aboutPhotoEmpty) return;
    if (source) {
      elements.aboutPhotoImg.src = source;
      elements.aboutPhotoImg.hidden = false;
      elements.aboutPhotoEmpty.hidden = true;
    } else {
      elements.aboutPhotoImg.removeAttribute("src");
      elements.aboutPhotoImg.hidden = true;
      elements.aboutPhotoEmpty.hidden = false;
    }
  }

  function renderServicesEditor() {
    const editor = elements.servicesEditor;
    if (!editor) return;
    editor.textContent = "";

    state.services.forEach((service, index) => {
      const row = document.createElement("div");
      row.className = "service-edit";

      const title = document.createElement("input");
      title.type = "text";
      title.value = service.title || "";
      title.placeholder = "Nome do serviço";
      title.maxLength = 70;
      title.setAttribute("aria-label", `Nome do serviço ${index + 1}`);
      title.addEventListener("input", () => {
        state.services[index].title = title.value;
      });

      const description = document.createElement("textarea");
      description.value = service.description || "";
      description.placeholder = "Descrição curta do que você entrega";
      description.maxLength = 260;
      description.rows = 2;
      description.setAttribute("aria-label", `Descrição do serviço ${index + 1}`);
      description.addEventListener("input", () => {
        state.services[index].description = description.value;
      });

      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "icon-btn danger";
      remove.textContent = "✕";
      remove.title = "Remover serviço";
      remove.setAttribute("aria-label", "Remover serviço");
      remove.addEventListener("click", () => {
        state.services.splice(index, 1);
        renderServicesEditor();
      });

      row.append(title, description, remove);
      editor.append(row);
    });
  }

  function setupSettingsEvents() {
    elements.addService?.addEventListener("click", () => {
      if (state.services.length >= 6) {
        toast("O limite é de 6 serviços.", true);
        return;
      }
      state.services.push({ title: "", description: "" });
      renderServicesEditor();
      const inputs = $$(".service-edit input", elements.servicesEditor);
      inputs[inputs.length - 1]?.focus();
    });

    elements.aboutPhotoInput?.addEventListener("change", () => {
      const file = elements.aboutPhotoInput.files?.[0];
      if (!file) return;
      if (!validateImage(file)) {
        elements.aboutPhotoInput.value = "";
        return;
      }
      state.aboutPhotoFile = file;
      state.removeAboutPhoto = false;
      renderAboutPhoto(URL.createObjectURL(file));
    });

    elements.clearAboutPhoto?.addEventListener("click", () => {
      state.aboutPhotoFile = null;
      state.removeAboutPhoto = true;
      if (elements.aboutPhotoInput) elements.aboutPhotoInput.value = "";
      renderAboutPhoto("");
    });

    elements.settingsForm?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const button = elements.saveSettingsBtn;
      if (!button) return;

      button.disabled = true;
      button.textContent = "Salvando…";

      try {
        const formData = new FormData();
        $$("input[name], textarea[name]", elements.settingsForm).forEach((field) => {
          if (field.type === "file") return;
          formData.append(field.name, field.value);
        });

        const services = state.services
          .map((service) => ({
            title: String(service.title || "").trim(),
            description: String(service.description || "").trim(),
          }))
          .filter((service) => service.title);
        formData.append("services", JSON.stringify(services));

        if (state.aboutPhotoFile) {
          formData.append("aboutPhoto", await compressImage(state.aboutPhotoFile));
        }
        if (state.removeAboutPhoto) formData.append("removeAboutPhoto", "true");

        const data = await api("/api/admin/settings", { method: "PUT", body: formData });
        state.settings = data.settings || state.settings;
        state.services = Array.isArray(state.settings.services)
          ? state.settings.services.map((service) => ({ ...service }))
          : state.services;

        renderSettingsForm();
        markSaved("Configurações salvas ✓");
        toast("Configurações salvas. O site já está atualizado.");
      } catch (error) {
        toast(error.message, true);
      } finally {
        button.disabled = false;
        button.textContent = "Salvar alterações";
      }
    });
  }

  /* ---------------------------------------------------------------------- */
  /*  Editor de projeto                                                     */
  /* ---------------------------------------------------------------------- */

  function validateImage(file) {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"];
    if (!allowed.includes(file.type)) {
      toast("Formato não aceito. Use JPG, PNG, WEBP, AVIF ou GIF.", true);
      return false;
    }
    if (file.size > 12 * 1024 * 1024) {
      toast("A imagem passa de 12 MB. Reduza o arquivo e tente novamente.", true);
      return false;
    }
    return true;
  }

  async function compressImage(file, max = 1800) {
    if (!file) return file;
    if (!file.type.startsWith("image/") || file.type === "image/gif") return file;

    try {
      const bitmap = await createImageBitmap(file);
      const needsResize = Math.max(bitmap.width, bitmap.height) > max;
      const needsWeight = file.size > 1.3 * 1024 * 1024;

      if (!needsResize && !needsWeight) {
        bitmap.close?.();
        return file;
      }

      const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      const context = canvas.getContext("2d");
      context.imageSmoothingQuality = "high";
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      bitmap.close?.();

      const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/webp", 0.86));
      if (!blob) return file;

      const name = `${(file.name || "imagem").replace(/\.[^.]+$/, "") || "imagem"}.webp`;
      return new File([blob], name, { type: "image/webp" });
    } catch {
      return file;
    }
  }

  function buildCategoryOptions() {
    const select = elements.workCategory;
    if (!select) return;
    select.textContent = "";
    for (const [key, label] of Object.entries(state.categories)) {
      const option = document.createElement("option");
      option.value = key;
      option.textContent = label;
      select.append(option);
    }
  }

  function revokeCoverUrl() {
    if (!state.coverObjectUrl) return;
    URL.revokeObjectURL(state.coverObjectUrl);
    state.coverObjectUrl = "";
  }

  function setCoverPreview(source) {
    if (!elements.coverPreview || !elements.coverPreviewImg || !elements.coverEmpty) return;

    // Clear the image reference before any revoke so the browser never
    // requests a blob URL that no longer exists.
    elements.coverPreviewImg.removeAttribute("src");

    if (source) {
      elements.coverPreviewImg.src = source;
      elements.coverPreview.hidden = false;
      elements.coverEmpty.hidden = true;
    } else {
      elements.coverPreview.hidden = true;
      elements.coverEmpty.hidden = false;
    }
  }

  function openWorkDrawer(work = null) {
    if (!elements.drawer || !elements.workForm) return;

    state.editingId = work?.id || null;
    state.coverFile = null;
    state.existingCover = work?.cover || "";
    state.removeCover = false;

    elements.workForm.reset();
    elements.drawerTitle.textContent = work ? "Atualizar trabalho" : "Adicionar à vitrine";
    elements.saveWorkBtn.textContent = work ? "Salvar alterações" : "Salvar projeto";

    elements.workTitle.value = work?.title || "";
    elements.workCategory.value = work?.category || "video";
    elements.workYear.value = work?.year || String(new Date().getFullYear());
    elements.workDescription.value = work?.description || "";
    elements.workClient.value = work?.client || "";
    elements.workTiktok.value = work?.tiktokUrl || "";
    elements.workMedia.value = work?.mediaUrl || "";
    elements.workExternal.value = work?.externalUrl || "";
    elements.workInstagram.value = work?.instagramUrl || "";
    elements.workPublished.checked = work ? Boolean(work.published) : true;
    elements.workFeatured.checked = work ? Boolean(work.featured) : false;
    elements.descCount.textContent = `${elements.workDescription.value.length} / 2200`;
    elements.coverInput.value = "";
    revokeCoverUrl();

    setCoverPreview(work?.cover || "");

    elements.drawer.hidden = false;
    document.body.classList.add("locked");
    void elements.drawer.offsetHeight;
    elements.drawer.classList.add("open");
    elements.workTitle.focus({ preventScroll: true });
  }

  function closeWorkDrawer() {
    if (!elements.drawer) return;
    elements.drawer.classList.remove("open");
    document.body.classList.remove("locked");
    window.setTimeout(() => {
      if (!elements.drawer.classList.contains("open")) {
        elements.drawer.hidden = true;
        setCoverPreview("");
        revokeCoverUrl();
      }
    }, 400);
  }

  function setupDrawerEvents() {
    $$("#newWorkBtn, #newWorkBtn2, #quickNew").forEach((button) => {
      button.addEventListener("click", () => openWorkDrawer());
    });

    $("#closeDrawer")?.addEventListener("click", closeWorkDrawer);
    $("#cancelWork")?.addEventListener("click", closeWorkDrawer);
    $$("[data-close-drawer]").forEach((element) => element.addEventListener("click", closeWorkDrawer));

    elements.workDescription?.addEventListener("input", () => {
      elements.descCount.textContent = `${elements.workDescription.value.length} / 2200`;
    });

    elements.coverDrop?.addEventListener("click", (event) => {
      if (event.target.closest(".dz-actions")) return;
      elements.coverInput?.click();
    });

    elements.coverDrop?.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        elements.coverInput?.click();
      }
    });

    $("#changeCover")?.addEventListener("click", (event) => {
      event.stopPropagation();
      elements.coverInput?.click();
    });

    $("#removeCover")?.addEventListener("click", (event) => {
      event.stopPropagation();
      state.coverFile = null;
      state.removeCover = Boolean(state.existingCover);
      elements.coverInput.value = "";
      setCoverPreview("");
      revokeCoverUrl();
    });

    elements.coverInput?.addEventListener("change", () => {
      const file = elements.coverInput.files?.[0];
      if (!file) return;
      if (!validateImage(file)) {
        elements.coverInput.value = "";
        return;
      }
      state.coverFile = file;
      state.removeCover = false;
      revokeCoverUrl();
      state.coverObjectUrl = URL.createObjectURL(file);
      setCoverPreview(state.coverObjectUrl);
    });

    ["dragenter", "dragover"].forEach((eventName) => {
      elements.coverDrop?.addEventListener(eventName, (event) => {
        event.preventDefault();
        elements.coverDrop.classList.add("dragover");
      });
    });

    ["dragleave", "drop"].forEach((eventName) => {
      elements.coverDrop?.addEventListener(eventName, (event) => {
        event.preventDefault();
        elements.coverDrop.classList.remove("dragover");
      });
    });

    elements.coverDrop?.addEventListener("drop", (event) => {
      const file = event.dataTransfer?.files?.[0];
      if (!file || !validateImage(file)) return;
      state.coverFile = file;
      state.removeCover = false;
      revokeCoverUrl();
      state.coverObjectUrl = URL.createObjectURL(file);
      setCoverPreview(state.coverObjectUrl);
    });

    elements.workForm?.addEventListener("submit", async (event) => {
      event.preventDefault();

      const title = elements.workTitle.value.trim();
      if (!title) {
        toast("Dê um nome ao projeto.", true);
        elements.workTitle.focus();
        return;
      }

      const button = elements.saveWorkBtn;
      button.disabled = true;
      button.textContent = "Salvando…";

      try {
        const cover = state.coverFile ? await compressImage(state.coverFile) : null;
        if (cover && cover.size > 12 * 1024 * 1024) {
          throw new Error("A capa ficou maior que 12 MB. Tente outra imagem.");
        }

        const formData = new FormData();
        formData.append("title", title);
        formData.append("category", elements.workCategory.value);
        formData.append("year", elements.workYear.value.trim());
        formData.append("description", elements.workDescription.value.trim());
        formData.append("client", elements.workClient.value.trim());
        formData.append("tiktokUrl", elements.workTiktok.value.trim());
        formData.append("mediaUrl", elements.workMedia.value.trim());
        formData.append("externalUrl", elements.workExternal.value.trim());
        formData.append("instagramUrl", elements.workInstagram.value.trim());
        formData.append("published", elements.workPublished.checked ? "true" : "false");
        formData.append("featured", elements.workFeatured.checked ? "true" : "false");

        if (cover) formData.append("cover", cover);
        if (state.removeCover) formData.append("removeCover", "true");

        const editing = Boolean(state.editingId);
        await api(editing ? `/api/admin/works/${state.editingId}` : "/api/admin/works", {
          method: editing ? "PUT" : "POST",
          body: formData,
        });

        closeWorkDrawer();
        await loadData();
        markSaved(editing ? "Projeto atualizado ✓" : "Projeto criado ✓");
        toast(
          editing
            ? "Projeto atualizado."
            : elements.workPublished.checked
              ? "Projeto publicado na vitrine."
              : "Rascunho salvo."
        );
      } catch (error) {
        toast(error.message, true);
      } finally {
        button.disabled = false;
        button.textContent = state.editingId ? "Salvar alterações" : "Salvar projeto";
      }
    });

    elements.confirmOk?.addEventListener("click", () => resolveConfirm(true));
    elements.confirmCancel?.addEventListener("click", () => resolveConfirm(false));
    $(".confirm-backdrop", elements.confirm)?.addEventListener("click", () => resolveConfirm(false));
  }

  /* ---------------------------------------------------------------------- */
  /*  Eventos gerais                                                        */
  /* ---------------------------------------------------------------------- */

  function setupGeneralEvents() {
    elements.tabs.forEach((button) => {
      button.addEventListener("click", () => setTab(button.dataset.tab));
    });

    $$("[data-goto]").forEach((button) => {
      button.addEventListener("click", () => setTab(button.dataset.goto));
    });

    elements.searchWorks?.addEventListener("input", () => {
      state.search = elements.searchWorks.value;
      renderWorks();
    });

    elements.filterStatus?.addEventListener("change", () => {
      state.status = elements.filterStatus.value;
      renderWorks();
    });

    $("#logoutBtn")?.addEventListener("click", async () => {
      try {
        await api("/api/admin/logout", { method: "POST" });
      } catch {
        /* mesmo que falhe, volta para o site */
      }
      window.location.href = "/";
    });

    $("#clearDemoBtn")?.addEventListener("click", async () => {
      const confirmed = await confirmDialog({
        title: "Remover projetos de exemplo?",
        text: "Os projetos marcados como exemplo serão apagados, junto com as capas geradas. Essa ação não pode ser desfeita.",
        okLabel: "Remover exemplos",
      });
      if (!confirmed) return;

      try {
        const data = await api("/api/admin/works/clear-demo", { method: "POST" });
        await loadData();
        toast(`${data.removed || 0} projeto(s) de exemplo removido(s).`);
      } catch (error) {
        toast(error.message, true);
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;
      if (!elements.confirm?.hidden) {
        resolveConfirm(false);
        return;
      }
      if (elements.drawer && !elements.drawer.hidden) closeWorkDrawer();
    });
  }

  /* ---------------------------------------------------------------------- */
  /*  Inicialização                                                         */
  /* ---------------------------------------------------------------------- */

  async function init() {
    setupGeneralEvents();
    setupDrawerEvents();
    setupSettingsEvents();

    try {
      await loadData({ renderSettings: true });
    } catch (error) {
      toast(error.message, true);
      return;
    }

    const hash = location.hash.replace("#", "");
    setTab(tabMeta[hash] ? hash : "overview");
  }

  init();
})();
