(() => {
  "use strict";

  const bootElement = document.getElementById("boot");
  if (!bootElement) return;

  let boot;
  try {
    boot = JSON.parse(bootElement.textContent);
  } catch (error) {
    console.error("Não foi possível carregar os dados do site.", error);
    return;
  }

  const settings = boot.settings || {};
  const categories = boot.categories || {};
  const works = Array.isArray(boot.works) ? boot.works.slice() : [];

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  const gallery = $("#gallery");
  const filters = $("#filters");
  const workCount = $("#workCount");
  const modal = $("#modal");
  const modalPanel = $(".modal-panel", modal);
  const modalMedia = $("#modalMedia");
  const modalScroll = $(".modal-scroll", modal);
  const modalTitle = $("#modalTitle");
  const modalDesc = $("#modalDesc");
  const modalMeta = $("#modalMeta");
  const modalActions = $("#modalActions");
  const modalPrev = $("#modalPrev");
  const modalNext = $("#modalNext");
  const modalIndex = $("#modalIndex");
  const header = $("#header");
  const menuToggle = $("#menuToggle");
  const mobileMenu = $("#mobile-menu");
  const waFloat = $("#waFloat");

  const categoryLabel = (key) => categories[key] || "Projeto";

  /* ---------------------------------------------------------------------- */
  /*  WhatsApp e links                                                      */
  /* ---------------------------------------------------------------------- */

  const waNumber = String(settings.whatsapp || "").replace(/\D/g, "");
  const defaultMessage =
    settings.whatsappMessage || "Oi, Vinicius! Vi seu portfólio e quero conversar sobre um projeto.";

  function whatsappUrl(message) {
    if (!waNumber) return "";
    return `https://wa.me/${waNumber}?text=${encodeURIComponent(message || defaultMessage)}`;
  }

  function hydrateWhatsapp(root = document) {
    $$("[data-wa]", root).forEach((link) => {
      const message = link.dataset.waMessage || defaultMessage;
      const url = whatsappUrl(message);
      if (!url) {
        link.removeAttribute("href");
        link.setAttribute("aria-disabled", "true");
        return;
      }
      link.href = url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
    });
  }

  function hydrateSocial(anchor, url, label) {
    if (!anchor) return false;
    if (url) {
      anchor.href = url;
      anchor.target = "_blank";
      anchor.rel = "noopener noreferrer";
      anchor.textContent = label;
      anchor.removeAttribute("aria-disabled");
      anchor.hidden = false;
      return true;
    }
    anchor.removeAttribute("href");
    anchor.removeAttribute("aria-disabled");
    anchor.hidden = true;
    return false;
  }

  /* ---------------------------------------------------------------------- */
  /*  Conteúdo fixo                                                         */
  /* ---------------------------------------------------------------------- */

  function bindSettings() {
    $$("[data-bind]").forEach((element) => {
      const key = element.dataset.bind;
      const value = settings[key];
      if (typeof value === "string" && value.trim()) {
        element.textContent = value;
      }
    });

    const aboutText = $("#aboutText");
    if (aboutText && settings.aboutText) {
      aboutText.textContent = "";
      String(settings.aboutText)
        .split(/\n{2,}/)
        .map((paragraph) => paragraph.trim())
        .filter(Boolean)
        .forEach((paragraph) => {
          const p = document.createElement("p");
          p.textContent = paragraph;
          aboutText.append(p);
        });
    }

    const servicesList = $("#servicesList");
    const services = Array.isArray(settings.services) ? settings.services : [];
    if (servicesList) {
      servicesList.textContent = "";
      services.forEach((service) => {
        const row = document.createElement("div");
        row.className = "service";

        const title = document.createElement("h3");
        title.textContent = service.title || "Serviço";

        const description = document.createElement("p");
        description.textContent = service.description || "";

        row.append(title, description);
        servicesList.append(row);
      });
    }

    const aboutPhoto = $("#aboutPhoto");
    const aboutFallback = $("#aboutPhotoFallback");
    if (aboutPhoto && settings.aboutPhoto) {
      aboutPhoto.src = settings.aboutPhoto;
      aboutPhoto.hidden = false;
      if (aboutFallback) aboutFallback.hidden = true;
      aboutPhoto.addEventListener(
        "error",
        () => {
          aboutPhoto.hidden = true;
          if (aboutFallback) aboutFallback.hidden = false;
        },
        { once: true }
      );
    }

    const footerEmail = $("#footerEmail");
    if (footerEmail) {
      if (settings.email) {
        footerEmail.href = `mailto:${settings.email}`;
        footerEmail.textContent = settings.email;
        footerEmail.hidden = false;
      } else {
        footerEmail.hidden = true;
      }
    }

    const hasTiktok = hydrateSocial($("#footerTiktok"), settings.tiktok, "TikTok");
    const hasInstagram = hydrateSocial($("#footerInstagram"), settings.instagram, "Instagram");

    const socialColumn = $("#footerSocial");
    if (socialColumn) {
      const hasSocial = hasTiktok || hasInstagram || Boolean(settings.email);
      socialColumn.hidden = !hasSocial;
      socialColumn.closest(".footer-top")?.classList.toggle("no-social", !hasSocial);
    }

    const year = new Date().getFullYear();
    $$("[data-year]").forEach((element) => {
      element.textContent = String(year);
    });

    document.title = `${settings.siteName || "Portfólio"} — ${settings.role || "Designer & Motion"}`;
  }

  /* ---------------------------------------------------------------------- */
  /*  Hero                                                                  */
  /* ---------------------------------------------------------------------- */

  function setImage(image, fallback, source, alt) {
    if (!image) return;
    if (!source) {
      image.hidden = true;
      if (fallback) fallback.hidden = false;
      return;
    }
    image.hidden = false;
    if (fallback) fallback.hidden = true;
    image.src = source;
    image.alt = alt || "";
    image.addEventListener(
      "error",
      () => {
        image.hidden = true;
        if (fallback) fallback.hidden = false;
      },
      { once: true }
    );
  }

  function renderHero() {
    const heroMain = $("#heroMain");
    const heroMini = $("#heroMini");
    if (!heroMain || !heroMini) return;

    const featured = works.find((work) => work.featured) || works[0];
    const secondary = works.find((work) => work.category === "video" && work.id !== featured?.id) ||
      works.find((work) => work.id !== featured?.id);

    if (!featured) {
      heroMain.disabled = true;
      heroMini.hidden = true;
      return;
    }

    setImage($("#heroMainImg"), $("#heroMainFallback"), featured.cover, "");
    $("#heroMainTitle").textContent = featured.title;
    $("#heroYear").textContent = featured.year || "2026";
    heroMain.addEventListener("click", () => openModal(featured.id, { push: true }));

    if (!secondary) {
      heroMini.hidden = true;
      return;
    }

    const isVideo = secondary.category === "video";

    setImage($("#heroMiniImg"), $("#heroMiniFallback"), secondary.cover, "");
    $("#heroMiniTag").textContent = categoryLabel(secondary.category);
    $("#heroMiniLabel").textContent = `${isVideo ? "Abrir vídeo em destaque" : "Abrir projeto em destaque"}: ${secondary.title}`;
    $(".hero-mini-play", heroMini).hidden = !isVideo;
    heroMini.addEventListener("click", () => openModal(secondary.id, { push: true }));
  }

  /* ---------------------------------------------------------------------- */
  /*  Vitrine                                                               */
  /* ---------------------------------------------------------------------- */

  let activeCategory = "all";
  let visibleWorks = works.slice();

  function countsByCategory() {
    const counts = {};
    for (const work of works) {
      counts[work.category] = (counts[work.category] || 0) + 1;
    }
    return counts;
  }

  function renderFilters() {
    if (!filters) return;
    filters.textContent = "";
    const counts = countsByCategory();

    const options = [{ key: "all", label: "Todos", count: works.length }];
    for (const key of Object.keys(categories)) {
      if (counts[key]) options.push({ key, label: categories[key], count: counts[key] });
    }

    for (const option of options) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "chip" + (activeCategory === option.key ? " active" : "");
      button.dataset.category = option.key;
      button.setAttribute("aria-pressed", String(activeCategory === option.key));
      button.textContent = option.label;
      button.addEventListener("click", () => {
        activeCategory = option.key;
        renderFilters();
        renderGallery();
      });
      filters.append(button);
    }
  }

  function buildCard(work) {
    const article = document.createElement("article");
    article.className = "work";
    article.dataset.cat = work.category;

    const button = document.createElement("button");
    button.type = "button";
    button.className = "work-btn";

    const accessiblePrefix = document.createElement("span");
    accessiblePrefix.className = "sr-only";
    accessiblePrefix.textContent = "Abrir projeto: ";

    const media = document.createElement("div");
    media.className = "work-media";

    const fallback = document.createElement("span");
    fallback.className = "media-fallback";
    fallback.setAttribute("aria-hidden", "true");
    const fallbackMark = document.createElement("span");
    fallbackMark.textContent = settings.monogram || "VA";
    fallback.append(fallbackMark);
    media.append(fallback);

    if (work.cover) {
      const image = document.createElement("img");
      image.src = work.cover;
      image.alt = work.title;
      image.loading = "lazy";
      image.decoding = "async";
      image.addEventListener("error", () => {
        image.hidden = true;
      });
      media.append(image);
      fallback.hidden = true;
    }

    const category = document.createElement("span");
    category.className = "work-cat";
    category.textContent = categoryLabel(work.category);
    media.append(category);

    if (work.category === "video") {
      const play = document.createElement("span");
      play.className = "work-play";
      play.setAttribute("aria-hidden", "true");
      const triangle = document.createElement("span");
      triangle.textContent = "▶";
      play.append(triangle);
      media.append(play);
    }

    const info = document.createElement("div");
    info.className = "work-info";

    const title = document.createElement("h3");
    title.className = "work-title";
    title.textContent = work.title;

    const meta = document.createElement("span");
    meta.className = "work-meta";
    meta.textContent = work.year || categoryLabel(work.category);

    info.append(title, meta);
    button.append(accessiblePrefix, media, info);
    button.addEventListener("click", () => openModal(work.id, { push: true }));
    article.append(button);
    return article;
  }

  function renderGallery() {
    if (!gallery) return;
    gallery.textContent = "";

    visibleWorks = activeCategory === "all" ? works.slice() : works.filter((work) => work.category === activeCategory);

    if (!works.length) {
      const empty = document.createElement("div");
      empty.className = "empty";
      const strong = document.createElement("strong");
      strong.textContent = "A vitrine está sendo montada.";
      const text = document.createElement("p");
      text.textContent = "Em breve, novos vídeos, artes e projetos por aqui.";
      empty.append(strong, text);
      gallery.append(empty);
      if (workCount) workCount.textContent = "0 projetos";
      return;
    }

    if (!visibleWorks.length) {
      const empty = document.createElement("div");
      empty.className = "empty";
      const strong = document.createElement("strong");
      strong.textContent = "Nada por aqui ainda.";
      const text = document.createElement("p");
      text.textContent = "Escolha outra categoria para continuar explorando.";
      empty.append(strong, text);
      gallery.append(empty);
    } else {
      visibleWorks.forEach((work) => gallery.append(buildCard(work)));
    }

    if (workCount) {
      const total = visibleWorks.length;
      workCount.textContent = `${total} ${total === 1 ? "projeto" : "projetos"}`;
    }
  }

  /* ---------------------------------------------------------------------- */
  /*  Modal                                                                 */
  /* ---------------------------------------------------------------------- */

  let currentWorkId = null;
  let modalList = [];
  let lastFocusedElement = null;
  let historyPushed = false;

  function tiktokIdFromUrl(url) {
    const match = String(url || "").match(/\/(?:video|photo)\/(\d{8,25})/);
    return match ? match[1] : "";
  }

  function fallbackMedia(work) {
    const fallback = document.createElement("div");
    fallback.className = "media-fallback";
    fallback.setAttribute("aria-hidden", "true");
    const inner = document.createElement("span");
    inner.textContent = settings.monogram || "VA";
    fallback.append(inner);
    return fallback;
  }

  function buildVideoNote(work, message, url, label) {
    const note = document.createElement("div");
    note.className = "modal-video-note";
    const text = document.createElement("p");
    text.textContent = message;
    note.append(text);
    if (url) {
      const link = document.createElement("a");
      link.href = url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = label;
      note.append(link);
    }
    return note;
  }

  function renderModalMedia(work) {
    modalMedia.textContent = "";

    if (work.category === "video") {
      const id = work.tiktokId || tiktokIdFromUrl(work.tiktokUrl);

      if (id) {
        const facade = document.createElement("button");
        facade.type = "button";
        facade.className = "modal-video-facade";
        facade.setAttribute("aria-label", `Reproduzir vídeo: ${work.title}`);

        if (work.cover) {
          const image = document.createElement("img");
          image.src = work.cover;
          image.alt = "";
          facade.append(image);
        } else {
          facade.append(fallbackMedia(work));
        }

        const play = document.createElement("span");
        play.className = "facade-play";
        play.setAttribute("aria-hidden", "true");
        play.textContent = "▶";

        const label = document.createElement("span");
        label.className = "facade-label";
        label.textContent = "Reproduzir no site";

        facade.append(play, label);
        facade.addEventListener("click", () => {
          modalMedia.textContent = "";
          const player = document.createElement("div");
          player.className = "modal-player";
          const iframe = document.createElement("iframe");
          iframe.src = `https://www.tiktok.com/embed/v2/${id}?lang=pt-BR`;
          iframe.title = `Vídeo do TikTok: ${work.title}`;
          iframe.allow = "autoplay; encrypted-media; fullscreen; picture-in-picture";
          iframe.allowFullscreen = true;
          iframe.referrerPolicy = "strict-origin-when-cross-origin";
          player.append(iframe);
          modalMedia.append(player);
        });

        modalMedia.append(facade);
        return;
      }

      if (work.cover) {
        const image = document.createElement("img");
        image.src = work.cover;
        image.alt = work.title;
        modalMedia.append(image);
      } else {
        modalMedia.append(fallbackMedia(work));
      }

      if (work.tiktokUrl) {
        modalMedia.append(
          buildVideoNote(
            work,
            "Este vídeo abre direto no TikTok.",
            work.tiktokUrl,
            "Assistir no TikTok"
          )
        );
      } else {
        modalMedia.append(buildVideoNote(work, "Vídeo em breve por aqui.", "", ""));
      }
      return;
    }

    if (work.cover) {
      const image = document.createElement("img");
      image.src = work.cover;
      image.alt = work.title;
      modalMedia.append(image);
    } else {
      modalMedia.append(fallbackMedia(work));
    }
  }

  function renderModal(work) {
    modalTitle.textContent = work.title;

    modalDesc.textContent = "";
    if (work.description) {
      String(work.description)
        .split(/\n{2,}/)
        .map((paragraph) => paragraph.trim())
        .filter(Boolean)
        .forEach((paragraph) => {
          const p = document.createElement("p");
          p.textContent = paragraph;
          modalDesc.append(p);
        });
    }

    modalMeta.textContent = "";
    const metaEntries = [
      ["Cliente", work.client],
      ["Ano", work.year],
      ["Categoria", categoryLabel(work.category)],
    ].filter(([, value]) => value);

    metaEntries.forEach(([label, value]) => {
      const wrapper = document.createElement("div");
      const dt = document.createElement("dt");
      dt.textContent = label;
      const dd = document.createElement("dd");
      dd.textContent = value;
      wrapper.append(dt, dd);
      modalMeta.append(wrapper);
    });

    modalActions.textContent = "";
    const actions = [];

    if (waNumber) {
      actions.push({
        href: whatsappUrl(`Oi, Vinicius! Vi o projeto “${work.title}” no seu portfólio e queria algo parecido.`),
        label: "Quero algo assim",
        primary: true,
        external: true,
      });
    }

    if (work.tiktokUrl) {
      actions.push({ href: work.tiktokUrl, label: "Ver no TikTok", external: true });
    }
    if (work.instagramUrl) {
      actions.push({ href: work.instagramUrl, label: "Ver no Instagram", external: true });
    }
    if (work.externalUrl && work.externalUrl !== work.tiktokUrl && work.externalUrl !== work.instagramUrl) {
      actions.push({ href: work.externalUrl, label: "Abrir projeto", external: true });
    }

    actions.forEach((action) => {
      const link = document.createElement("a");
      link.className = `btn ${action.primary ? "btn-ink" : "btn-ghost"}`;
      link.href = action.href;
      if (action.external) {
        link.target = "_blank";
        link.rel = "noopener noreferrer";
      }
      link.textContent = action.label;
      modalActions.append(link);
    });

    renderModalMedia(work);

    const list = modalList.length ? modalList : works;
    const index = list.findIndex((item) => item.id === work.id);
    modalIndex.textContent = `${index + 1} de ${list.length}`;
    modalPrev.disabled = list.length < 2;
    modalNext.disabled = list.length < 2;

    if (modalScroll) modalScroll.scrollTop = 0;
  }

  function openModal(id, options = {}) {
    const work = works.find((item) => item.id === id);
    if (!work) return;

    const list = visibleWorks.length ? visibleWorks : works;
    if (!list.some((item) => item.id === id)) {
      modalList = works;
    } else {
      modalList = list;
    }

    const alreadyOpen = !modal.hidden && modal.classList.contains("open");

    if (!alreadyOpen) {
      lastFocusedElement = document.activeElement;
      currentWorkId = id;
      renderModal(work);
      modal.hidden = false;
      document.body.classList.add("modal-open");
      requestAnimationFrame(() => {
        modal.classList.add("open");
        modalPanel.focus({ preventScroll: true });
      });
    } else {
      currentWorkId = id;
      renderModal(work);
    }

    const hash = `#trabalho/${encodeURIComponent(id)}`;

    if (options.push && !alreadyOpen) {
      history.pushState({ work: id }, "", hash);
      historyPushed = true;
    } else if (!alreadyOpen) {
      history.replaceState({ work: id }, "", hash);
      historyPushed = false;
    } else {
      history.replaceState({ work: id }, "", hash);
    }
  }

  function closeModalUi() {
    if (modal.hidden) return;
    modal.classList.remove("open");
    document.body.classList.remove("modal-open");

    const finish = () => {
      if (!modal.classList.contains("open")) {
        modal.hidden = true;
        modalMedia.textContent = "";
        currentWorkId = null;
        modalActions.textContent = "";
      }
    };
    window.setTimeout(finish, 320);

    if (lastFocusedElement && typeof lastFocusedElement.focus === "function") {
      lastFocusedElement.focus({ preventScroll: true });
    }
    lastFocusedElement = null;
  }

  function closeModal() {
    if (modal.hidden) return;

    if (historyPushed && history.state && history.state.work) {
      historyPushed = false;
      history.back();
      return;
    }

    if (location.hash.startsWith("#trabalho/")) {
      history.replaceState(null, "", location.pathname + location.search);
    }
    closeModalUi();
  }

  function stepModal(direction) {
    if (!currentWorkId || modalList.length < 2) return;
    const index = modalList.findIndex((work) => work.id === currentWorkId);
    if (index === -1) return;
    const next = (index + direction + modalList.length) % modalList.length;
    openModal(modalList[next].id, { push: false });
    modalPanel.focus({ preventScroll: true });
  }

  function handleHash() {
    const match = location.hash.match(/^#trabalho\/(.+)$/);
    if (!match) {
      closeModalUi();
      return;
    }
    let id = match[1];
    try {
      id = decodeURIComponent(id);
    } catch {
      /* mantém o valor bruto */
    }
    if (works.some((work) => work.id === id)) {
      openModal(id, { push: false });
    }
  }

  /* ---------------------------------------------------------------------- */
  /*  Menu, header e animações                                              */
  /* ---------------------------------------------------------------------- */

  function setMenu(open) {
    if (!menuToggle || !mobileMenu) return;

    if (open) {
      mobileMenu.hidden = false;
      void mobileMenu.offsetHeight;
      mobileMenu.classList.add("open");
      document.body.classList.add("menu-open");
      header.classList.add("menu-open");
    } else {
      mobileMenu.classList.remove("open");
      document.body.classList.remove("menu-open");
      header.classList.remove("menu-open");
      window.setTimeout(() => {
        if (!mobileMenu.classList.contains("open")) mobileMenu.hidden = true;
      }, 360);
    }

    menuToggle.setAttribute("aria-expanded", String(open));
    menuToggle.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
  }

  function setupMenu() {
    if (!menuToggle || !mobileMenu) return;

    menuToggle.addEventListener("click", () => {
      const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
      setMenu(!isOpen);
    });

    $$("[data-menu-link]", mobileMenu).forEach((link) => {
      link.addEventListener("click", () => setMenu(false));
    });

    window.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && menuToggle.getAttribute("aria-expanded") === "true") {
        setMenu(false);
        menuToggle.focus();
      }
    });
  }

  function setupScroll() {
    let ticking = false;

    const update = () => {
      const y = window.scrollY || document.documentElement.scrollTop;
      header.classList.toggle("scrolled", y > 16);
      if (waFloat) waFloat.classList.toggle("show", y > 620 && !document.body.classList.contains("modal-open"));
      ticking = false;
    };

    window.addEventListener(
      "scroll",
      () => {
        if (!ticking) {
          window.requestAnimationFrame(update);
          ticking = true;
        }
      },
      { passive: true }
    );

    update();
  }

  function setupModalEvents() {
    if (!modal) return;

    modal.addEventListener("click", (event) => {
      if (event.target.closest("[data-close]")) closeModal();
    });

    modalPrev?.addEventListener("click", () => stepModal(-1));
    modalNext?.addEventListener("click", () => stepModal(1));

    document.addEventListener("keydown", (event) => {
      if (modal.hidden) return;

      if (event.key === "Escape") {
        event.preventDefault();
        closeModal();
        return;
      }

      if (event.key === "ArrowRight" && document.activeElement?.tagName !== "IFRAME") {
        stepModal(1);
        return;
      }

      if (event.key === "ArrowLeft" && document.activeElement?.tagName !== "IFRAME") {
        stepModal(-1);
        return;
      }

      if (event.key === "Tab") {
        const focusable = $$(
          'a[href], button:not([disabled]), iframe, [tabindex]:not([tabindex="-1"])',
          modalPanel
        ).filter((element) => element.offsetParent !== null || element.tagName === "IFRAME");

        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    });

    window.addEventListener("popstate", handleHash);
  }

  /* ---------------------------------------------------------------------- */
  /*  Inicialização                                                         */
  /* ---------------------------------------------------------------------- */

  bindSettings();
  hydrateWhatsapp();
  renderHero();
  renderFilters();
  renderGallery();
  setupMenu();
  setupScroll();
  setupModalEvents();

  if (location.hash.startsWith("#trabalho/")) {
    window.setTimeout(handleHash, 80);
  }
})();
