
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

  // Cores por peça (opcional). Por omissão todas têm as 6 cores.
  // Exemplo: chapeu1: ["azul", "branco"]
  const PRODUCT_COLORS = {
  };

  // Nomes por peça (opcional). Exemplo: camisa1: "Camisa Street"
  const PRODUCT_NAMES = {
  };

  // Peças em destaque na página Início
  const FEATURED_IDS = ["camisa1", "calsa1", "chapeu1", "camisola1"];

  const COLOR_INTERVAL = 3000; // troca de cor dos cartões (ms)
  const HERO_INTERVAL = 5000;  // troca dos fundos do Início (ms)
  const PRODUCTS_PER_CATEGORY = 4;

  /* ======================================================
     2. DADOS
     Imagens: imagens/<peça>-<cor>.png ou .jpg  (ex.: imagens/chapeu1-azul.jpg)
     ====================================================== */
  const CART_KEY = "freestyle_drewp_sacola_v3";
  const MAX_QTY = 99;
  const DEFAULT_STATUS = "Disponibilidade sob confirmação";

  const COLORS = [
    { id: "azul", name: "Azul", hex: "#1f5cff" },
    { id: "branco", name: "Branco", hex: "#ffffff" },
    { id: "cinza", name: "Cinza", hex: "#9aa0ad" },
    { id: "preto", name: "Preto", hex: "#0a0a0f" },
    { id: "rosa", name: "Rosa", hex: "#ff5fa2" },
    { id: "vermelho", name: "Vermelho", hex: "#e11d2e" }
  ];
  const COLOR_BY_ID = {};
  COLORS.forEach(c => { COLOR_BY_ID[c.id] = c; });

  const SIZES_FULL = ["S", "M", "L", "XL", "XXL"];
  const SIZES_ONE = ["Único"];

  const CATEGORIES = [
    { id: "camisa", name: "Camisas", singular: "Camisa", code: "CAM", sizes: SIZES_FULL, tagline: "Expressa o teu estilo." },
    { id: "calsa", name: "Calças", singular: "Calça", code: "CAL", sizes: SIZES_FULL, tagline: "Conforto e personalidade." },
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
  /* Fotos das peças: aceita jpg, png, jpeg e webp (tenta pela ordem) */
  const IMAGE_EXTENSIONS = ["jpg", "png", "jpeg", "webp"];
  const extIndex = {};
  const imageFor = (p, colorId) => "imagens/" + p.id + "-" + colorId + "." +
    IMAGE_EXTENSIONS[extIndex[p.id + "-" + colorId] || 0];
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

  /* Procura a foto de uma cor em png, jpg, jpeg e webp */
  function probeColor(p, colorId) {
    const key = p.id + "-" + colorId;
    let i = extIndex[key] || 0;
    function tryNext() {
      if (i >= IMAGE_EXTENSIONS.length) return Promise.resolve(false);
      extIndex[key] = i;
      return loadImage(imageFor(p, colorId)).then(ok => {
        if (ok) return true;
        i += 1;
        return tryNext();
      });
    }
    return tryNext();
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

    probeColor(p, colorId).then(ok => {
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
    if (img.dataset.color) {
      const key = p.id + "-" + img.dataset.color;
      const nextExt = (extIndex[key] || 0) + 1;
      if (nextExt < IMAGE_EXTENSIONS.length) {
        extIndex[key] = nextExt;
        img.src = imageFor(p, img.dataset.color);
        return;
      }
      p.missing[img.dataset.color] = true;
    }
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
      return '<li class="bag-