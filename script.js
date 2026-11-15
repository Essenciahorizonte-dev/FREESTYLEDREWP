/* ==========================================================
   FREESTYLE DREWP - script.js (partilhado: Início, Catálogo, Contacto)
   Cores com troca automática, filtros, pesquisa, sacola e WhatsApp
   ========================================================== */
(() => {
  "use strict";

  /* ======================================================
     1. CONFIGURAÇÃO (edita aqui)
     ====================================================== */
  const CONFIG = {
    // Número oficial de WhatsApp, só dígitos, com indicativo (258 = Moçambique)
    whatsapp: "258861697479",
    // Telefone para chamadas. Exemplo: "258841234567". Vazio = "A configurar"
    phone: "",
    // Instagram: @utilizador ou endereço completo. Vazio = "A configurar"
    instagram: "",
    // Facebook: nome da página ou endereço completo. Vazio = "A configurar"
    facebook: "",
    // Localização em texto. Exemplo: "Maputo". Vazio = "A configurar"
    location: "",
    // Moeda mostrada nos preços
    currency: "MT"
  };

  // Preços reais por peça. Vazio = "Preço sob consulta". Exemplo: camisa1: 1500
  const PRICES = {
  };

  // Disponibilidade por peça (opcional). Exemplo: chapeu2: "Esgotado"
  const AVAILABILITY = {
  };

  // Cores por peça (opcional). Por omissão todas têm as 5 cores.
  // Exemplo: chapeu1: ["azul", "branco"]
  const PRODUCT_COLORS = {
  };

  // Nomes por peça (opcional). Exemplo: camisa1: "Camisa Street"
  const PRODUCT_NAMES = {
  };

  // Peças em destaque na página Início
  const FEATURED_IDS = ["camisa1", "calcao1", "chapeu1", "camisola1"];

  const COLOR_INTERVAL = 3000; // troca de cor dos cartões (ms)
  const HERO_INTERVAL = 5000;  // troca dos fundos do Início (ms)
  const PRODUCTS_PER_CATEGORY = 4;

  /* ======================================================
     2. DADOS
     Imagens: imagens/<peça>-<cor>.png  (ex.: imagens/chapeu1-azul.png)
     ====================================================== */
  const CART_KEY = "freestyle_drewp_sacola_v3";
  const MAX_QTY = 99;
  const DEFAULT_STATUS = "Disponibilidade sob confirmação";

  const COLORS = [
    { id: "azul", name: "Azul", hex: "#1f5cff" },
    { id: "branco", name: "Branco", hex: "#ffffff" },
    { id: "cinza", name: "Cinza", hex: "#9aa0ad" },
    { id: "preto", name: "Preto", hex: "#0a0a0f" },
    { id: "rosa", name: "Rosa", hex: "#ff5fa2" }
  ];
  const COLOR_BY_ID = {};
  COLORS.forEach(c => { COLOR_BY_ID[c.id] = c; });

  const SIZES_FULL = ["S", "M", "L", "XL", "XXL"];
  const SIZES_ONE = ["Único"];

  const CATEGORIES = [
    { id: "camisa", name: "Camisas", singular: "Camisa", code: "CAM", sizes: SIZES_FULL, tagline: "Expressa o teu estilo." },
    { id: "calcao", name: "Calções", singular: "Calção", code: "CAL", sizes: SIZES_FULL, tagline: "Conforto e personalidade." },
    { id: "chapeu", name: "Chapéus", singular: "Chapéu", code: "CHA", sizes: SIZES_ONE, tagline: "O detalhe que completa o visual." },
    { id: "sacola", name: "Sacolas", singular: "Sacola", code: "SAC", sizes: SIZES_ONE, tagline: "Leva o teu estilo contigo." },
    { id: "camisola", name: "Camisolas", singular: "Camisola", code: "CMS", sizes: SIZES_FULL, tagline: "Conforto para todos os dias." }
  ];

  const PRODUCTS = [];
  let orderCounter = 0;

  CATEGORIES.forEach(cat => {
    for (let i = 1; i <= PRODUCTS_PER_CATEGORY; i++) {
      orderCounter += 1;
      const id = cat.id + i;
      const num = String(i).padStart(2, "0");
      const name = PRODUCT_NAMES[id] || (cat.singular + " " + num);
      const colors = (PRODUCT_COLORS[id] || COLORS.map(c => c.id)).filter(c => COLOR_BY_ID[c]);
      PRODUCTS.push({
        id: id,
        categoryId: cat.id,
        categoryName: cat.name,
        name: name,
        code: "FD-" + cat.code + "-" + num,
        description: name + " da colecção FREESTYLE DREWP. " + cat.tagline +
          " Escolhe a cor e o tamanho e confirma preço e disponibilidade pelo WhatsApp.",
        sizes: cat.sizes,
        colors: colors,
        missing: {},
        order: orderCounter,
        price: typeof PRICES[id] === "number" ? PRICES[id] : null,
        status: AVAILABILITY[id] || ""
      });
    }
  });

  const BY_ID = {};
  PRODUCTS.forEach(p => { BY_ID[p.id] = p; });
  const HAS_PRICES = PRODUCTS.some(p => p.price !== null);

  const PLACEHOLDER = "data:image/svg+xml;utf8," + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500">' +
    '<rect width="400" height="500" fill="#eceef2"/>' +
    '<text x="200" y="255" text-anchor="middle" font-family="Arial,sans-serif" font-size="18" ' +
    'letter-spacing="3" fill="#7a8194">FREESTYLE DREWP</text></svg>'
  );

  /* ======================================================
     3. UTILITÁRIOS
     ====================================================== */
  const $ = id => document.getElementById(id);

  const esc = value => String(value).replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));

  const norm = value => String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  const digits = value => String(value || "").replace(/\D/g, "");
  const isValidNumber = value => /^\d{9,15}$/.test(value);

  const formatPrice = n => n.toLocaleString("pt-PT") + " " + CONFIG.currency;
  const priceText = p => (p.price !== null ? formatPrice(p.price) : "Preço sob consulta");
  const statusText = p => p.status || DEFAULT_STATUS;
  const isSoldOut = p => norm(p.status) === "esgotado";
  const imageFor = (p, colorId) => "imagens/" + p.id + "-" + colorId + ".png";
  const availableColors = p => p.colors.filter(c => !p.missing[c]);

  function formatPhone(n) {
    if (/^258\d{9}$/.test(n)) {
      return "+258 " + n.slice(3, 5) + " " + n.slice(5, 8) + " " + n.slice(8);
    }
    return "+" + n;
  }

  const imgCache = {};
  function loadImage(src) {
    if (!imgCache[src]) {
      imgCache[src] = new Promise(resolve => {
        const img = new Image();
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = src;
      });
    }
    return imgCache[src];
  }

  /* ======================================================
     4. ELEMENTOS E ESTADO
     ====================================================== */
  const els = {
    header: $("siteHeader"),
    menuToggle: $("menuToggle"),
    mainNav: $("mainNav"),
    bagButton: $("bagButton"),
    filters: $("categoryFilters"),
    searchInput: $("searchInput"),
    searchClear: $("searchClear"),
    sortSelect: $("sortSelect"),
    resultCount: $("resultCount"),
    productGrid: $("productGrid"),
    featuredGrid: $("featuredGrid"),
    emptyState: $("emptyState"),
    resetFilters: $("resetFilters"),
    overlay: $("overlay"),
    modal: $("productModal"),
    modalClose: $("modalClose"),
    modalImage: $("modalImage"),
    modalCategory: $("modalCategory"),
    modalName: $("modalName"),
    modalId: $("modalId"),
    modalDescription: $("modalDescription"),
    modalPrice: $("modalPrice"),
    modalStock: $("modalStock"),
    modalColors: $("modalColors"),
    modalColorName: $("modalColorName"),
    modalSize: $("modalSize"),
    modalQty: $("modalQty"),
    modalQtyMinus: $("modalQtyMinus"),
    modalQtyPlus: $("modalQtyPlus"),
    modalAdd: $("modalAdd"),
    drawer: $("bagDrawer"),
    bagClose: $("bagClose"),
    bagEmpty: $("bagEmpty"),
    bagItems: $("bagItems"),
    bagSummaryCount: $("bagSummaryCount"),
    bagTotal: $("bagTotal"),
    bagCheckout: $("bagCheckout"),
    bagContinue: $("bagContinue"),
    bagClear: $("bagClear"),
    toasts: $("toastContainer"),
    contactForm: $("contactForm")
  };

  const state = {
    category: "todas",
    search: "",
    sort: "todos",
    cart: [],
    modalProduct: null,
    modalQty: 1,
    lastFocus: null
  };

  const cardState = {};         // por peça: { color, locked }
  const visibleIds = new Set(); // cartões visíveis no ecrã
  let heroRefresh = null;

  function getState(id) {
    if (!cardState[id]) {
      cardState[id] = { color: availableColors(BY_ID[id])[0] || "", locked: false };
    }
    return cardState[id];
  }

  /* ======================================================
     5. NOTIFICAÇÕES
     ====================================================== */
  function toast(message, type) {
    if (!els.toasts) return;
    const el = document.createElement("div");
    el.className = "toast" + (type === "warning" ? " is-warning" : "");
    el.setAttribute("role", "status");
    el.textContent = message;
    els.toasts.appendChild(el);

    while (els.toasts.children.length > 3) {
      els.toasts.removeChild(els.toasts.firstChild);
    }

    requestAnimationFrame(() => {
      requestAnimationFrame(() => el.classList.add("is-visible"));
    });
    setTimeout(() => {
      el.classList.remove("is-visible");
      setTimeout(() => { if (el.parentNode) el.parentNode.removeChild(el); }, 350);
    }, 2800);
  }

  /* ======================================================
     6. CORES: BOLINHAS, TROCA MANUAL E AUTOMÁTICA
     ====================================================== */
  function dotsHTML(p) {
    const st = getState(p.id);
    return availableColors(p).map(cid => {
      const c = COLOR_BY_ID[cid];
      const active = cid === st.color;
      return '<button type="button" class="color-dot' + (active ? ' is-active' : '') + '" ' +
        'style="--dot:' + c.hex + '" data-action="pick-color" data-id="' + p.id + '" data-color="' + cid + '" ' +
        'aria-label="Cor ' + esc(c.name) + '" aria-pressed="' + active + '"></button>';
    }).join("");
  }

  function colorLabel(p) {
    const st = getState(p.id);
    return st.color ? "Cor: " + COLOR_BY_ID[st.color].name : "Imagens em breve";
  }

  function refreshCard(id) {
    const p = BY_ID[id];
    const st = getState(id);
    if (st.color && p.missing[st.color]) st.color = availableColors(p)[0] || "";

    const dots = dotsHTML(p);
    const label = colorLabel(p);

    document.querySelectorAll('.product-card[data-id="' + id + '"]').forEach(card => {
      const picker = card.querySelector(".color-picker");
      const name = card.querySelector(".color-name");
      if (picker) picker.innerHTML = dots;
      if (name) name.textContent = label;
    });

    if (state.modalProduct && state.modalProduct.id === id) {
      if (els.modalColors) els.modalColors.innerHTML = dots;
      if (els.modalColorName) els.modalColorName.textContent = label;
    }
  }

  function swapImages(id, colorId) {
    const p = BY_ID[id];
    const src = imageFor(p, colorId);
    const alt = p.name + " - " + COLOR_BY_ID[colorId].name + " - " + p.categoryName + " FREESTYLE DREWP";

    document.querySelectorAll('.product-card[data-id="' + id + '"] .product-img').forEach(img => {
      img.classList.add("is-fading");
      setTimeout(() => {
        delete img.dataset.fallback;
        img.dataset.color = colorId;
        img.alt = alt;
        img.src = src;
        img.classList.remove("is-fading");
      }, 220);
    });

    if (state.modalProduct && state.modalProduct.id === id && els.modalImage) {
      delete els.modalImage.dataset.fallback;
      els.modalImage.src = src;
      els.modalImage.alt = alt;
    }
  }

  function showColor(id, colorId, manual) {
    const p = BY_ID[id];
    if (!p || !COLOR_BY_ID[colorId]) return;
    const st = getState(id);

    loadImage(imageFor(p, colorId)).then(ok => {
      if (!ok) {
        p.missing[colorId] = true;
        refreshCard(id);
        if (manual) toast("A imagem desta cor ainda não está disponível.", "warning");
        return;
      }
      st.color = colorId;
      swapImages(id, colorId);
      refreshCard(id);
    });
  }

  function pickColor(id, colorId) {
    getState(id).locked = true; /* a escolha da pessoa pára a troca automática */
    showColor(id, colorId, true);
  }

  function colorTick() {
    if (document.hidden) return;
    Array.from(visibleIds).forEach((id, i) => {
      const p = BY_ID[id];
      const st = cardState[id];
      if (!p || !st || st.locked) return;
      const list = availableColors(p);
      if (list.length < 2) return;
      const next = list[(list.indexOf(st.color) + 1) % list.length];
      setTimeout(() => {
        if (!cardState[id].locked) showColor(id, next, false);
      }, i * 160);
    });
  }

  let cardObserver = null;
  function observeCards() {
    visibleIds.clear();
    const cards = document.querySelectorAll(".product-card");
    if (!("IntersectionObserver" in window)) {
      cards.forEach(c => visibleIds.add(c.dataset.id));
      return;
    }
    if (!cardObserver) {
      cardObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          const id = entry.target.dataset.id;
          if (entry.isIntersecting) visibleIds.add(id);
          else visibleIds.delete(id);
        });
      }, { rootMargin: "100px" });
    } else {
      cardObserver.disconnect();
    }
    cards.forEach(c => cardObserver.observe(c));
  }

  function handleProductImgError(img) {
    const p = BY_ID[img.dataset.pid];
    if (!p) {
      img.dataset.fallback = "1";
      img.src = PLACEHOLDER;
      return;
    }
    if (img.dataset.color) p.missing[img.dataset.color] = true;
    const st = getState(p.id);
    const next = availableColors(p)[0];
    if (next) {
      st.color = next;
      img.dataset.color = next;
      img.src = imageFor(p, next);
    } else {
      st.color = "";
      img.dataset.fallback = "1";
      img.src = PLACEHOLDER;
    }
    refreshCard(p.id);
  }

  /* ======================================================
     7. FUNDO DO INÍCIO (3 imagens que se trocam sozinhas)
     ====================================================== */
  function setupHero() {
    const slides = Array.prototype.slice.call(document.querySelectorAll(".hero-slide"));
    if (slides.length === 0) return;

    const dotsBox = $("heroDots");
    let current = 0;
    let timer = null;

    const usable = () => slides.map((s, i) => i).filter(i => !slides[i].classList.contains("is-missing"));

    function show(index) {
      current = index;
      slides.forEach((s, i) => s.classList.toggle("is-active", i === index));
      if (dotsBox) {
        Array.prototype.forEach.call(dotsBox.children, (d, i) => {
          d.classList.toggle("is-active", i === index);
          d.setAttribute("aria-current", i === index ? "true" : "false");
        });
      }
    }

    function next() {
      const list = usable();
      if (list.length === 0) return;
      const pos = list.indexOf(current);
      show(list[(pos + 1) % list.length]);
    }

    function restart() {
      clearInterval(timer);
      timer = setInterval(() => { if (!document.hidden) next(); }, HERO_INTERVAL);
    }

    if (dotsBox) {
      dotsBox.innerHTML = slides.map((s, i) =>
        '<button type="button" class="hero-dot" data-index="' + i + '" aria-label="Mostrar imagem ' + (i + 1) + '"></button>'
      ).join("");
      dotsBox.addEventListener("click", event => {
        const btn = event.target.closest("[data-index]");
        if (!btn) return;
        show(Number(btn.dataset.index));
        restart();
      });
    }

    heroRefresh = () => {
      if (slides[current].classList.contains("is-missing")) next();
    };

    const first = usable()[0];
    show(first === undefined ? 0 : first);
    restart();
  }

  /* ======================================================
     8. SACOLA (dados)
     ====================================================== */
  function loadCart() {
    try {
      const raw = JSON.parse(sessionStorage.getItem(CART_KEY) || "[]");
      if (!Array.isArray(raw)) return [];
      return raw
        .filter(it => it && BY_ID[it.id] && COLOR_BY_ID[it.color] && typeof it.size === "string")
        .map(it => ({
          id: it.id,
          color: it.color,
          size: it.size,
          qty: Math.min(MAX_QTY, Math.max(1, parseInt(it.qty, 10) || 1))
        }));
    } catch (error) {
      return [];
    }
  }

  function persistCart() {
    try {
      sessionStorage.setItem(CART_KEY, JSON.stringify(state.cart));
    } catch (error) {
      /* sem sessionStorage: a sacola continua a funcionar em memória */
    }
  }

  function cartTotals() {
    let count = 0;
    let sum = 0;
    let priced = 0;
    state.cart.forEach(it => {
      const p = BY_ID[it.id];
      count += it.qty;
      if (p && p.price !== null) {
        sum += p.price * it.qty;
        priced += 1;
      }
    });
    return { count: count, sum: sum, priced: priced, lines: state.cart.length };
  }

  function totalText(t) {
    if (t.lines === 0 || t.priced === 0) return "Preço sob consulta";
    if (t.priced === t.lines) return formatPrice(t.sum);
    return formatPrice(t.sum) + " + itens a confirmar";
  }

  function updateBadges(bump) {
    const el = $("bagCount");
    if (!el) return;
    el.textContent = String(cartTotals().count);
    if (bump) {
      el.classList.remove("bump");
      void el.offsetWidth;
      el.classList.add("bump");
    }
  }

  function addToCart(id, color, size, qty) {
    const existing = state.cart.find(it => it.id === id && it.color === color && it.size === size);
    if (existing) {
      existing.qty = Math.min(MAX_QTY, existing.qty + qty);
    } else {
      state.cart.push({ id: id, color: color, size: size, qty: Math.min(MAX_QTY, qty) });
    }
    persistCart();
    renderBag();
    updateBadges(true);
  }

  function changeQty(index, delta) {
    const item = state.cart[index];
    if (!item) return;
    const next = item.qty + delta;
    if (next < 1) {
      removeFromCart(index);
      return;
    }
    item.qty = Math.min(MAX_QTY, next);
    persistCart();
    renderBag();
    updateBadges(false);
  }

  function removeFromCart(index) {
    if (!state.cart[index]) return;
    state.cart.splice(index, 1);
    persistCart();
    renderBag();
    updateBadges(false);
    toast("Produto removido.");
  }

  function clearCart() {
    if (state.cart.length === 0) {
      toast("A sacola já está vazia.", "warning");
      return;
    }
    state.cart = [];
    persistCart();
    renderBag();
    updateBadges(false);
    toast("Sacola esvaziada.");
  }

  /* ======================================================
     9. SACOLA (interface)
     ====================================================== */
  function renderBag() {
    if (!els.bagItems) return;
    const t = cartTotals();

    if (els.bagEmpty) els.bagEmpty.hidden = state.cart.length > 0;
    if (els.bagSummaryCount) els.bagSummaryCount.textContent = String(t.count);
    if (els.bagTotal) els.bagTotal.textContent = totalText(t);

    els.bagItems.innerHTML = state.cart.map((it, index) => {
      const p = BY_ID[it.id];
      const c = COLOR_BY_ID[it.color];
      const line = p.price !== null
        ? formatPrice(p.price) + " x " + it.qty + " = " + formatPrice(p.price * it.qty)
        : "Preço sob consulta";
      return '<li class="bag-item">' +
        '<img src="' + esc(imageFor(p, it.color)) + '" alt="' + esc(p.name) + ' ' + esc(c.name) + ' FREESTYLE DREWP" loading="lazy">' +
        '<div class="bag-item-info">' +
          '<strong>' + esc(p.name) + '</strong>' +
          '<small>' + esc(p.categoryName) + ' · Ref. ' + esc(p.code) + '</small>' +
          '<small>Cor: ' + esc(c.name) + ' · Tamanho: ' + esc(it.size) + '</small>' +
          '<span class="bag-item-price">' + esc(line) + '</span>' +
          '<div class="bag-item-controls">' +
            '<div class="qty" role="group" aria-label="Quantidade de ' + esc(p.name) + '">' +
              '<button type="button" data-action="bag-dec" data-index="' + index + '" aria-label="Diminuir quantidade">&minus;</button>' +
              '<span>' + it.qty + '</span>' +
              '<button type="button" data-action="bag-inc" data-index="' + index + '" aria-label="Aumentar quantidade">+</button>' +
            '</div>' +
            '<button type="button" class="bag-remove" data-action="bag-remove" data-index="' + index + '">Retirar</button>' +
          '</div>' +
        '</div>' +
      '</li>';
    }).join("");
  }

  function syncLayers() {
    const modalOpen = !!els.modal && !els.modal.hidden;
    const bagOpen = !!els.drawer && els.drawer.classList.contains("is-open");
    if (els.overlay) els.overlay.hidden = !(modalOpen || bagOpen);
    document.body.classList.toggle("no-scroll", modalOpen || bagOpen);
  }

  function openBag() {
    if (!els.drawer) return;
    closeMenu();
    state.lastFocus = document.activeElement;
    els.drawer.classList.add("is-open");
    els.drawer.setAttribute("aria-hidden", "false");
    if (els.bagButton) els.bagButton.setAttribute("aria-expanded", "true");
    syncLayers();
    if (els.bagClose) setTimeout(() => els.bagClose.focus(), 60);
  }

  function closeBag() {
    if (!els.drawer) return;
    els.drawer.classList.remove("is-open");
    els.drawer.setAttribute("aria-hidden", "true");
    if (els.bagButton) els.bagButton.setAttribute("aria-expanded", "false");
    syncLayers();
    if (location.hash === "#sacola" && window.history && history.replaceState) {
      history.replaceState(null, "", location.pathname + location.search);
    }
    if (state.lastFocus && typeof state.lastFocus.focus === "function") {
      state.lastFocus.focus();
    }
  }

  /* ======================================================
     10. JANELA DE DETALHES
     ====================================================== */
  function openModal(id, fromQuickAdd) {
    const p = BY_ID[id];
    if (!p || !els.modal) return;

    const st = getState(id);
    st.locked = true;

    state.modalProduct = p;
    state.modalQty = 1;
    state.lastFocus = document.activeElement;

    delete els.modalImage.dataset.fallback;
    els.modalImage.src = st.color ? imageFor(p, st.color) : PLACEHOLDER;
    els.modalImage.alt = p.name + " - " + p.categoryName + " FREESTYLE DREWP";
    els.modalCategory.textContent = p.categoryName.toUpperCase();
    els.modalName.textContent = p.name;
    els.modalId.textContent = "Ref. " + p.code;
    els.modalDescription.textContent = p.description;
    els.modalPrice.textContent = priceText(p);
    els.modalStock.textContent = statusText(p);
    if (els.modalColors) els.modalColors.innerHTML = dotsHTML(p);
    if (els.modalColorName) els.modalColorName.textContent = colorLabel(p);

    els.modalSize.innerHTML = '<option value="">Escolher tamanho</option>' +
      p.sizes.map(s => '<option value="' + esc(s) + '">' + esc(s) + '</option>').join("");
    if (p.sizes.length === 1) els.modalSize.value = p.sizes[0];
    els.modalSize.classList.remove("is-invalid");

    els.modalQty.textContent = "1";
    els.modalAdd.disabled = isSoldOut(p);
    els.modalAdd.textContent = isSoldOut(p) ? "Esgotado" : "Adicionar à sacola";

    els.modal.hidden = false;
    syncLayers();

    const box = els.modal.querySelector(".modal-box");
    if (box) box.scrollTop = 0;
    setTimeout(() => els.modalClose.focus(), 60);

    if (fromQuickAdd && !isSoldOut(p)) {
      toast("Escolhe a cor e o tamanho para adicionar à sacola.");
    }
  }

  function closeModal() {
    if (!els.modal || els.modal.hidden) return;
    els.modal.hidden = true;
    state.modalProduct = null;
    syncLayers();
    if (state.lastFocus && typeof state.lastFocus.focus === "function") {
      state.lastFocus.focus();
    }
  }

  function setModalQty(value) {
    state.modalQty = Math.min(MAX_QTY, Math.max(1, value));
    els.modalQty.textContent = String(state.modalQty);
  }

  function modalAddToBag() {
    const p = state.modalProduct;
    if (!p) return;
    if (isSoldOut(p)) {
      toast("Este produto está esgotado.", "warning");
      return;
    }
    const color = getState(p.id).color;
    const size = els.modalSize.value;
    els.modalSize.classList.toggle("is-invalid", !size);

    if (!color) {
      toast("Ainda não há imagens desta peça.", "warning");
      return;
    }
    if (!size) {
      toast("Escolhe o tamanho antes de adicionar.", "warning");
      els.modalSize.focus();
      return;
    }

    addToCart(p.id, color, size, state.modalQty);
    closeModal();
    toast("Produto adicionado à sacola.");
  }

  function quickAdd(id) {
    const p = BY_ID[id];
    if (!p) return;
    if (isSoldOut(p)) {
      toast("Este produto está esgotado.", "warning");
      return;
    }
    const st = getState(id);
    st.locked = true;
    if (p.sizes.length === 1 && st.color) {
      addToCart(id, st.color, p.sizes[0], 1);
      toast("Produto adicionado à sacola.");
    } else {
      openModal(id, true);
    }
  }

  /* ======================================================
     11. CATÁLOGO: CARTÕES, FILTROS, PESQUISA, ORDENAÇÃO
     ====================================================== */
  function cardHTML(p, variant) {
    const st = getState(p.id);
    const soldOut = isSoldOut(p);
    const src = st.color ? imageFor(p, st.color) : PLACEHOLDER;
    const alt = p.name + (st.color ? " - " + COLOR_BY_ID[st.color].name : "") + " - " + p.categoryName + " FREESTYLE DREWP";
    const img = '<img class="product-img" src="' + esc(src) + '" alt="' + esc(alt) + '" ' +
      'data-pid="' + p.id + '" data-color="' + esc(st.color) + '" loading="lazy" decoding="async">';
    const link = "catalogo.html?categoria=" + p.categoryId + "#product-" + p.id;

    const media = variant === "link"
      ? '<a class="product-media" href="' + link + '" aria-label="Ver ' + esc(p.name) + ' no catálogo">' + img + '</a>'
      : '<button type="button" class="product-media" data-action="details" data-id="' + p.id + '" aria-label="Ver detalhes de ' + esc(p.name) + '">' + img + '</button>';

    const actions = variant === "link"
      ? '<div class="card-actions single"><a class="btn btn-primary btn-sm" href="' + link + '">Ver no catálogo</a></div>'
      : '<div class="card-actions">' +
          '<button type="button" class="btn btn-outline btn-sm" data-action="details" data-id="' + p.id + '">Ver detalhes</button>' +
          '<button type="button" class="btn btn-primary btn-sm" data-action="quick-add" data-id="' + p.id + '"' + (soldOut ? ' disabled' : '') + '>' +
            (soldOut ? 'Esgotado' : 'Adicionar à sacola') + '</button>' +
        '</div>';

    return '<article class="product-card" id="product-' + p.id + '" data-id="' + p.id + '">' +
      media +
      '<div class="product-body">' +
        '<span class="product-category">' + esc(p.categoryName.toUpperCase()) + '</span>' +
        '<h3 class="product-name">' + esc(p.name) + '</h3>' +
        '<p class="product-code">Ref. ' + esc(p.code) + '</p>' +
        '<p class="product-price">' + esc(priceText(p)) + '</p>' +
        '<p class="product-stock">' + esc(statusText(p)) + '</p>' +
        '<div class="color-picker" role="group" aria-label="Cores de ' + esc(p.name) + '">' + dotsHTML(p) + '</div>' +
        '<p class="color-name" aria-live="polite">' + esc(colorLabel(p)) + '</p>' +
        actions +
      '</div>' +
    '</article>';
  }

  function getVisibleProducts() {
    const tokens = norm(state.search.trim()).split(/\s+/).filter(Boolean);

    const list = PRODUCTS.filter(p => {
      if (state.category !== "todas" && p.categoryId !== state.category) return false;
      if (tokens.length === 0) return true;
      const hay = norm(p.name + " " + p.categoryName + " " + p.categoryId + " " + p.code);
      return tokens.every(t => hay.indexOf(t) !== -1);
    }).slice();

    switch (state.sort) {
      case "recentes":
        list.sort((a, b) => b.order - a.order);
        break;
      case "alfabetica":
        list.sort((a, b) => a.name.localeCompare(b.name, "pt", { numeric: true }));
        break;
      case "preco-asc":
      case "preco-desc": {
        const dir = state.sort === "preco-asc" ? 1 : -1;
        list.sort((a, b) => {
          if (a.price === null && b.price === null) return a.order - b.order;
          if (a.price === null) return 1;
          if (b.price === null) return -1;
          return (a.price - b.price) * dir;
        });
        break;
      }
      default:
        break;
    }
    return list;
  }

  function renderProducts() {
    if (!els.productGrid) return;
    const list = getVisibleProducts();

    els.productGrid.innerHTML = list.map(p => cardHTML(p, "modal")).join("");
    els.productGrid.hidden = list.length === 0;
    if (els.emptyState) els.emptyState.hidden = list.length > 0;

    if (els.resultCount) {
      els.resultCount.textContent = list.length === 0
        ? "Nenhum produto encontrado."
        : "A mostrar " + list.length + " de " + PRODUCTS.length + " peças";
    }
    if (els.searchClear) els.searchClear.hidden = state.search === "";
    observeCards();
  }

  function renderFeatured() {
    if (!els.featuredGrid) return;
    els.featuredGrid.innerHTML = FEATURED_IDS
      .filter(id => BY_ID[id])
      .map(id => cardHTML(BY_ID[id], "link"))
      .join("");
    observeCards();
  }

  function renderFilterButtons() {
    if (!els.filters) return;
    els.filters.querySelectorAll(".filter-btn").forEach(btn => {
      const active = btn.dataset.category === state.category;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-pressed", String(active));
    });
  }

  function isValidCategory(id) {
    return id === "todas" || CATEGORIES.some(c => c.id === id);
  }

  function setCategory(id, resetSearch) {
    if (!isValidCategory(id)) id = "todas";
    state.category = id;
    if (resetSearch) {
      state.search = "";
      if (els.searchInput) els.searchInput.value = "";
    }
    renderFilterButtons();
    renderProducts();
  }

  function setupSort() {
    if (!els.sortSelect || HAS_PRICES) return;
    Array.prototype.forEach.call(els.sortSelect.options, opt => {
      if (opt.value === "preco-asc" || opt.value === "preco-desc") {
        opt.disabled = true;
        opt.textContent += " (preços em breve)";
      }
    });
  }

  function highlightFromHash() {
    const m = /^#product-([a-z0-9]+)$/.exec(location.hash);
    if (!m) return;
    const card = $("product-" + m[1]);
    if (!card) return;
    setTimeout(() => {
      card.scrollIntoView({ behavior: "smooth", block: "center" });
      if (card.animate) {
        card.animate([
          { boxShadow: "0 0 0 0 rgba(31,92,255,0)" },
          { boxShadow: "0 0 0 5px rgba(31,92,255,1)" },
          { boxShadow: "0 0 0 0 rgba(31,92,255,0)" }
        ], { duration: 1600, easing: "ease-out" });
      }
    }, 250);
  }

  /* ======================================================
     12. WHATSAPP
     ====================================================== */
  function whatsappReady() {
    return isValidNumber(digits(CONFIG.whatsapp));
  }

  function openWhatsApp(message) {
    if (!whatsappReady()) {
      toast("Contacto ainda não configurado. Define o número de WhatsApp no script.js.", "warning");
      return;
    }
    const url = "https://wa.me/" + digits(CONFIG.whatsapp) + "?text=" + encodeURIComponent(message);
    const win = window.open(url, "_blank");
    if (win) {
      win.opener = null;
    } else {
      window.location.href = url;
    }
  }

  function buildOrderMessage() {
    const t = cartTotals();
    const lines = state.cart.map((it, i) => {
      const p = BY_ID[it.id];
      let text = (i + 1) + ". " + p.name + " (Ref. " + p.code + ")\n" +
        "   Categoria: " + p.categoryName + "\n" +
        "   Cor: " + COLOR_BY_ID[it.color].name + " | Tamanho: " + it.size + "\n" +
        "   Quantidade: " + it.qty;
      if (p.price !== null) {
        text += "\n   Preço unitário: " + formatPrice(p.price) +
          "\n   Subtotal: " + formatPrice(p.price * it.qty);
      } else {
        text += "\n   Preço: sob consulta";
      }
      return text;
    });

    let totalLine;
    if (t.priced === t.lines) {
      totalLine = "Total: " + formatPrice(t.sum);
    } else if (t.priced === 0) {
      totalLine = "Total: a confirmar (preços sob consulta)";
    } else {
      totalLine = "Total parcial: " + formatPrice(t.sum) + " (restantes itens a confirmar)";
    }

    return "Olá, FREESTYLE DREWP!\n\n" +
      "Quero fazer a seguinte encomenda:\n\n" +
      lines.join("\n\n") + "\n\n" +
      "Total de artigos: " + t.count + "\n" +
      totalLine + "\n\n" +
      "Pretendo confirmar a encomenda, a disponibilidade e as condições de pagamento e entrega. Obrigado!";
  }

  function checkout() {
    if (state.cart.length === 0) {
      toast("A tua sacola está vazia. Adiciona pelo menos um produto.", "warning");
      return;
    }
    openWhatsApp(buildOrderMessage());
  }

  /* ======================================================
     13. CONTACTOS
     ====================================================== */
  function setLink(anchor, textEl, href, text) {
    if (!anchor) return;
    if (href) {
      anchor.setAttribute("href", href);
      anchor.removeAttribute("data-pending");
      anchor.classList.remove("is-pending");
      if (textEl) textEl.textContent = text;
    } else {
      anchor.setAttribute("href", "#");
      anchor.setAttribute("data-pending", "1");
      anchor.classList.add("is-pending");
      if (textEl) textEl.textContent = "A configurar";
    }
  }

  function setupContacts() {
    const wa = digits(CONFIG.whatsapp);
    const waOk = isValidNumber(wa);
    const phone = digits(CONFIG.phone);
    const phoneOk = isValidNumber(phone);

    const ig = String(CONFIG.instagram || "").trim();
    const fb = String(CONFIG.facebook || "").trim();
    const loc = String(CONFIG.location || "").trim();
    const isUrl = v => /^https?:\/\//i.test(v);

    const igUrl = ig ? (isUrl(ig) ? ig : "https://instagram.com/" + ig.replace(/^@/, "")) : "";
    const igText = ig ? (isUrl(ig) ? "Instagram" : "@" + ig.replace(/^@/, "")) : "";
    const fbUrl = fb ? (isUrl(fb) ? fb : "https://facebook.com/" + fb) : "";
    const fbText = fb ? (isUrl(fb) ? "Facebook" : fb) : "";
    const waUrl = waOk ? "https://wa.me/" + wa : "";

    setLink($("contactWhatsapp"), $("contactWhatsappText"), waUrl, waOk ? formatPhone(wa) : "");
    setLink($("contactPhone"), $("contactPhoneText"), phoneOk ? "tel:+" + phone : "", phoneOk ? formatPhone(phone) : "");
    setLink($("contactInstagram"), $("contactInstagramText"), igUrl, igText);
    setLink($("contactFacebook"), $("contactFacebookText"), fbUrl, fbText);
    setLink($("footerWhatsapp"), null, waUrl, "");
    setLink($("footerInstagram"), null, igUrl, "");
    setLink($("footerFacebook"), null, fbUrl, "");

    const locCard = $("contactLocation");
    const locText = $("contactLocationText");
    if (locCard && locText) {
      locText.textContent = loc || "A configurar";
      locCard.classList.toggle("is-pending", !loc);
    }

    /* Botões "Falar pelo WhatsApp" (qualquer página): atributo data-whatsapp */
    document.querySelectorAll("[data-whatsapp]").forEach(link => {
      if (waOk) {
        const msg = link.getAttribute("data-message") || "Olá, FREESTYLE DREWP! Gostaria de saber mais sobre a vossa colecção.";
        link.setAttribute("href", waUrl + "?text=" + encodeURIComponent(msg));
        link.setAttribute("target", "_blank");
        link.setAttribute("rel", "noopener");
        link.removeAttribute("data-pending");
      } else {
        link.setAttribute("href", "#");
        link.setAttribute("data-pending", "1");
      }
    });
  }

  function setupContactForm() {
    if (!els.contactForm) return;
    els.contactForm.addEventListener("submit", event => {
      event.preventDefault();
      const name = ($("formName") ? $("formName").value : "").trim();
      const subject = $("formSubject") ? $("formSubject").value : "";
      const message = ($("formMessage") ? $("formMessage").value : "").trim();

      if (!name) {
        toast("Escreve o teu nome.", "warning");
        if ($("formName")) $("formName").focus();
        return;
      }
      if (!message) {
        toast("Escreve a tua mensagem.", "warning");
        if ($("formMessage")) $("formMessage").focus();
        return;
      }

      openWhatsApp(
        "Olá, FREESTYLE DREWP!\n" +
        "O meu nome é " + name + ".\n" +
        (subject ? "Assunto: " + subject + "\n" : "") +
        "\n" + message
      );
    });
  }

  /* ======================================================
     14. MENU, CABEÇALHO E NAVEGAÇÃO ACTIVA
     ====================================================== */
  function setMenu(open) {
    if (!els.mainNav || !els.menuToggle) return;
    els.mainNav.classList.toggle("is-open", open);
    els.menuToggle.classList.toggle("is-open", open);
    els.menuToggle.setAttribute("aria-expanded", String(open));
    els.menuToggle.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
  }

  function closeMenu() {
    setMenu(false);
  }

  function setupMenu() {
    if (!els.mainNav || !els.menuToggle) return;

    els.menuToggle.addEventListener("click", () => {
      setMenu(!els.mainNav.classList.contains("is-open"));
    });
    els.mainNav.querySelectorAll("a").forEach(link => {
      link.addEventListener("click", closeMenu);
    });
    document.addEventListener("click", event => {
      if (!els.mainNav.classList.contains("is-open")) return;
      if (els.mainNav.contains(event.target) || els.menuToggle.contains(event.target)) return;
      closeMenu();
    });
    window.addEventListener("resize", () => {
      if (window.innerWidth > 900) closeMenu();
    });

    const page = document.body.dataset.page;
    els.mainNav.querySelectorAll("a[data-page-link]").forEach(a => {
      const active = a.dataset.pageLink === page;
      a.classList.toggle("is-active", active);
      if (active) a.setAttribute("aria-current", "page");
    });
  }

  function setupHeaderEffects() {
    if (!els.header) return;
    const onScroll = () => els.header.classList.toggle("is-scrolled", window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ======================================================
     15. FOCO DENTRO DAS JANELAS (acessibilidade)
     ====================================================== */
  function trapFocus(event) {
    if (event.key !== "Tab") return;
    let container = null;
    if (els.modal && !els.modal.hidden) container = els.modal;
    else if (els.drawer && els.drawer.classList.contains("is-open")) container = els.drawer;
    if (!container) return;

    const items = Array.prototype.filter.call(
      container.querySelectorAll("button:not([disabled]), select, input, a[href]"),
      el => el.getClientRects().length > 0
    );
    if (items.length === 0) return;

    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  /* ======================================================
     16. EVENTOS
     ====================================================== */
  function onDocumentClick(event) {
    const target = event.target;

    /* Contactos ainda não configurados */
    const pending = target.closest("a[data-pending]");
    if (pending) {
      event.preventDefault();
      toast("Contacto ainda não configurado.", "warning");
      return;
    }

    /* Links de categoria: no catálogo filtram sem recarregar */
    const go = target.closest("[data-go-category]");
    if (go && els.productGrid) {
      event.preventDefault();
      closeMenu();
      setCategory(go.dataset.goCategory, true);
      const catalog = $("catalogo");
      if (catalog) catalog.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    /* Botões de filtro */
    const filterBtn = target.closest(".filter-btn");
    if (filterBtn && els.filters && els.filters.contains(filterBtn)) {
      setCategory(filterBtn.dataset.category, false);
      return;
    }

    const actionEl = target.closest("[data-action]");
    if (!actionEl) return;
    const action = actionEl.dataset.action;
    const id = actionEl.dataset.id;
    const index = Number(actionEl.dataset.index);

    switch (action) {
      case "details":
        openModal(id, false);
        break;
      case "quick-add":
        quickAdd(id);
        break;
      case "pick-color":
        pickColor(id, actionEl.dataset.color);
        break;
      case "bag-inc":
        changeQty(index, 1);
        break;
      case "bag-dec":
        changeQty(index, -1);
        break;
      case "bag-remove":
        removeFromCart(index);
        break;
      default:
        break;
    }
  }

  function onImageError(event) {
    const img = event.target;
    if (!img || img.tagName !== "IMG") return;

    if (img.classList.contains("brand-logo")) {
      img.hidden = true;
      return;
    }
    if (img.classList.contains("hero-slide")) {
      img.classList.add("is-missing");
      if (heroRefresh) heroRefresh();
      return;
    }
    if (img.classList.contains("product-img") && img.dataset.pid && !img.dataset.fallback) {
      handleProductImgError(img);
      return;
    }
    if (!img.dataset.fallback) {
      img.dataset.fallback = "1";
      img.src = PLACEHOLDER;
    }
  }

  /* Imagens que já falharam antes de o script arrancar */
  function sweepBrokenImages() {
    document.querySelectorAll("img").forEach(img => {
      if (img.complete && img.naturalWidth === 0 && !img.dataset.fallback && img.getAttribute("src")) {
        onImageError({ target: img });
      }
    });
  }

  function bindEvents() {
    document.addEventListener("click", onDocumentClick);
    document.addEventListener("keydown", trapFocus);
    document.addEventListener("error", onImageError, true);

    document.addEventListener("keydown", event => {
      if (event.key !== "Escape") return;
      if (els.modal && !els.modal.hidden) closeModal();
      else if (els.drawer && els.drawer.classList.contains("is-open")) closeBag();
      else closeMenu();
    });

    /* Pesquisa */
    if (els.searchInput) {
      els.searchInput.addEventListener("input", () => {
        state.search = els.searchInput.value;
        renderProducts();
      });
    }
    if (els.searchClear) {
      els.searchClear.addEventListener("click", () => {
        state.search = "";
        els.searchInput.value = "";
        renderProducts();
        els.searchInput.focus();
      });
    }
    if (els.resetFilters) {
      els.resetFilters.addEventListener("click", () => {
        state.search = "";
        if (els.searchInput) els.searchInput.value = "";
        renderProducts();
        toast("Pesquisa limpa.");
      });
    }

    /* Ordenação */
    if (els.sortSelect) {
      els.sortSelect.addEventListener("change", () => {
        const value = els.sortSelect.value;
        if ((value === "preco-asc" || value === "preco-desc") && !HAS_PRICES) {
          toast("Os preços ainda não estão definidos.", "warning");
          els.sortSelect.value = "todos";
          state.sort = "todos";
        } else {
          state.sort = value;
        }
        renderProducts();
      });
    }

    /* Janela de detalhes */
    if (els.modalClose) els.modalClose.addEventListener("click", closeModal);
    if (els.modal) {
      els.modal.addEventListener("click", event => {
        if (event.target === els.modal) closeModal();
      });
    }
    if (els.modalQtyMinus) els.modalQtyMinus.addEventListener("click", () => setModalQty(state.modalQty - 1));
    if (els.modalQtyPlus) els.modalQtyPlus.addEventListener("click", () => setModalQty(state.modalQty + 1));
    if (els.modalAdd) els.modalAdd.addEventListener("click", modalAddToBag);
    if (els.modalSize) els.modalSize.addEventListener("change", () => els.modalSize.classList.remove("is-invalid"));

    /* Sacola */
    if (els.bagButton) els.bagButton.addEventListener("click", openBag);
    if (els.bagClose) els.bagClose.addEventListener("click", closeBag);
    if (els.bagContinue) {
      els.bagContinue.addEventListener("click", () => {
        closeBag();
        if (document.body.dataset.page === "catalogo") {
          const catalog = $("catalogo");
          if (catalog) catalog.scrollIntoView({ behavior: "smooth", block: "start" });
        } else {
          window.location.href = "catalogo.html";
        }
      });
    }
    if (els.bagClear) els.bagClear.addEventListener("click", clearCart);
    if (els.bagCheckout) els.bagCheckout.addEventListener("click", checkout);

    if (els.overlay) {
      els.overlay.addEventListener("click", () => {
        if (els.modal && !els.modal.hidden) closeModal();
        if (els.drawer && els.drawer.classList.contains("is-open")) closeBag();
      });
    }

    window.addEventListener("hashchange", () => {
      if (location.hash === "#sacola") openBag();
      else highlightFromHash();
    });
  }

  /* ======================================================
     17. ARRANQUE
     ====================================================== */
  function init() {
    state.cart = loadCart();

    const year = $("currentYear");
    if (year) year.textContent = String(new Date().getFullYear());

    setupMenu();
    setupHeaderEffects();
    setupContacts();
    setupContactForm();
    bindEvents();
    sweepBrokenImages();
    updateBadges(false);
    renderBag();
    setupHero();

    if (els.productGrid) {
      const wanted = new URLSearchParams(window.location.search).get("categoria");
      if (wanted && isValidCategory(wanted)) state.category = wanted;
      setupSort();
      renderFilterButtons();
      renderProducts();
      highlightFromHash();
    }
    renderFeatured();

    setInterval(colorTick, COLOR_INTERVAL);

    if (location.hash === "#sacola") openBag();
  }

  init();
})();
