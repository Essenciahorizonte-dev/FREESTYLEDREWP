/* ==========================================================
   FREESTYLE DREWP - script.js
   Catálogo, pesquisa, ordenação, detalhes, sacola e WhatsApp
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

  // Preços reais por produto. Enquanto estiver vazio, aparece "Preço sob consulta".
  // Exemplo: camisas1: 1500, calcoes3: 900
  const PRICES = {
  };

  // Disponibilidade por produto (opcional).
  // Exemplos: camisas1: "Disponível", camisas2: "Esgotado", camisas3: "Sob encomenda"
  const AVAILABILITY = {
  };

  /* ======================================================
     2. DADOS DOS PRODUTOS (6 categorias x 6 produtos = 36)
     ====================================================== */
  const CART_KEY = "freestyle_drewp_sacola_v2";
  const MAX_QTY = 99;
  const DEFAULT_STATUS = "Disponibilidade sob confirmação";

  const COLORS = ["Preto", "Branco", "Outra"];
  const SIZES_FULL = ["S", "M", "L", "XL", "XXL"];
  const SIZES_ONE = ["Único"];

  const CATEGORIES = [
    { id: "camisas", name: "Camisas", singular: "Camisa", img: "camisa", code: "CAM", sizes: SIZES_FULL, tagline: "Expressa o teu estilo." },
    { id: "calcoes", name: "Calções", singular: "Calção", img: "calcao", code: "CAL", sizes: SIZES_FULL, tagline: "Conforto e personalidade." },
    { id: "chapeus", name: "Chapéus", singular: "Chapéu", img: "chapeu", code: "CHA", sizes: SIZES_ONE, tagline: "O detalhe que completa o visual." },
    { id: "conjuntos", name: "Conjuntos", singular: "Conjunto", img: "conjunto", code: "CON", sizes: SIZES_FULL, tagline: "Combinações que fazem a diferença." },
    { id: "sacolas", name: "Sacolas", singular: "Sacola", img: "sacola", code: "SAC", sizes: SIZES_ONE, tagline: "Leva o teu estilo contigo." },
    { id: "camisolas", name: "Camisolas", singular: "Camisola", img: "camisola", code: "CMS", sizes: SIZES_FULL, tagline: "Conforto para todos os dias." }
  ];

  const PRODUCTS = [];
  let orderCounter = 0;

  CATEGORIES.forEach(cat => {
    for (let i = 1; i <= 6; i++) {
      orderCounter += 1;
      const num = String(i).padStart(2, "0");
      const id = cat.id + i;
      const name = cat.singular + " " + num;
      PRODUCTS.push({
        id: id,
        categoryId: cat.id,
        categoryName: cat.name,
        name: name,
        code: "FD-" + cat.code + "-" + num,
        image: "imagens/" + cat.img + i + ".png",
        description: name + " da colecção FREESTYLE DREWP. " + cat.tagline +
          " Escolhe o tamanho e a cor e confirma preço e disponibilidade pelo WhatsApp.",
        sizes: cat.sizes,
        colors: COLORS,
        order: orderCounter,
        price: typeof PRICES[id] === "number" ? PRICES[id] : null,
        status: AVAILABILITY[id] || "",
        isNew: i === 6,
        isFeatured: i === 1,
        isReco: i === 3
      });
    }
  });

  const BY_ID = {};
  PRODUCTS.forEach(p => { BY_ID[p.id] = p; });

  const HAS_PRICES = PRODUCTS.some(p => p.price !== null);

  const PLACEHOLDER = "data:image/svg+xml;utf8," + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500">' +
    '<rect width="400" height="500" fill="#ececea"/>' +
    '<text x="200" y="255" text-anchor="middle" font-family="Arial,sans-serif" font-size="18" ' +
    'letter-spacing="3" fill="#8a8a87">FREESTYLE DREWP</text></svg>'
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

  function formatPhone(n) {
    if (/^258\d{9}$/.test(n)) {
      return "+258 " + n.slice(3, 5) + " " + n.slice(5, 8) + " " + n.slice(8);
    }
    return "+" + n;
  }

  /* ======================================================
     4. ELEMENTOS
     ====================================================== */
  const els = {
    header: $("siteHeader"),
    menuToggle: $("menuToggle") || $("menu-toggle"),
    mainNav: $("mainNav") || $("navigation"),
    bagButton: $("bagButton"),
    filters: $("categoryFilters"),
    searchInput: $("searchInput"),
    searchClear: $("searchClear"),
    sortSelect: $("sortSelect"),
    resultCount: $("resultCount"),
    productGrid: $("productGrid"),
    emptyState: $("emptyState"),
    resetFilters: $("resetFilters"),
    newGrid: $("newGrid"),
    featuredGrid: $("featuredGrid"),
    recoGrid: $("recoGrid"),
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
    modalSize: $("modalSize"),
    modalColor: $("modalColor"),
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
    contactWhatsappButton: $("contactWhatsappButton")
  };

  /* ======================================================
     5. ESTADO
     ====================================================== */
  const state = {
    category: "todas",
    search: "",
    sort: "todos",
    cart: [],
    modalProduct: null,
    modalQty: 1,
    lastFocus: null
  };

  /* ======================================================
     6. NOTIFICAÇÕES
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
     7. SACOLA (dados)
     ====================================================== */
  function loadCart() {
    try {
      const raw = JSON.parse(sessionStorage.getItem(CART_KEY) || "[]");
      if (!Array.isArray(raw)) return [];
      return raw
        .filter(it => it && BY_ID[it.id] && typeof it.size === "string" && typeof it.color === "string")
        .map(it => ({
          id: it.id,
          size: it.size,
          color: it.color,
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
      /* sessionStorage indisponível: a sacola continua a funcionar em memória */
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
    const count = cartTotals().count;
    ["bagCount", "cart-count", "floating-cart-count"].forEach(id => {
      const el = $(id);
      if (!el) return;
      el.textContent = String(count);
      if (bump) {
        el.classList.remove("bump");
        void el.offsetWidth;
        el.classList.add("bump");
      }
    });
  }

  function addToCart(id, size, color, qty) {
    const existing = state.cart.find(it => it.id === id && it.size === size && it.color === color);
    if (existing) {
      existing.qty = Math.min(MAX_QTY, existing.qty + qty);
    } else {
      state.cart.push({ id: id, size: size, color: color, qty: Math.min(MAX_QTY, qty) });
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
     8. SACOLA (interface)
     ====================================================== */
  function renderBag() {
    if (!els.bagItems) return;
    const t = cartTotals();

    if (els.bagEmpty) els.bagEmpty.hidden = state.cart.length > 0;
    if (els.bagSummaryCount) els.bagSummaryCount.textContent = String(t.count);
    if (els.bagTotal) els.bagTotal.textContent = totalText(t);

    els.bagItems.innerHTML = state.cart.map((it, index) => {
      const p = BY_ID[it.id];
      const line = p.price !== null
        ? formatPrice(p.price) + " x " + it.qty + " = " + formatPrice(p.price * it.qty)
        : "Preço sob consulta";
      return '<li class="bag-item">' +
        '<img src="' + esc(p.image) + '" alt="' + esc(p.name) + ' FREESTYLE DREWP" loading="lazy">' +
        '<div class="bag-item-info">' +
          '<strong>' + esc(p.name) + '</strong>' +
          '<small>' + esc(p.categoryName) + ' · Ref. ' + esc(p.code) + '</small>' +
          '<small>Tamanho: ' + esc(it.size) + ' · Cor: ' + esc(it.color) + '</small>' +
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

  /* ======================================================
     9. CAMADAS (janela, sacola, sobreposição)
     ====================================================== */
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

  function openModal(id, fromQuickAdd) {
    const p = BY_ID[id];
    if (!p || !els.modal) return;

    state.modalProduct = p;
    state.modalQty = 1;
    state.lastFocus = document.activeElement;

    delete els.modalImage.dataset.fallback;
    els.modalImage.src = p.image;
    els.modalImage.alt = p.name + " - " + p.categoryName + " FREESTYLE DREWP";
    els.modalCategory.textContent = p.categoryName.toUpperCase();
    els.modalName.textContent = p.name;
    els.modalId.textContent = "Ref. " + p.code;
    els.modalDescription.textContent = p.description;
    els.modalPrice.textContent = priceText(p);
    els.modalStock.textContent = statusText(p);

    els.modalSize.innerHTML = '<option value="">Escolher tamanho</option>' +
      p.sizes.map(s => '<option value="' + esc(s) + '">' + esc(s) + '</option>').join("");
    els.modalColor.innerHTML = '<option value="">Escolher cor</option>' +
      p.colors.map(c => '<option value="' + esc(c) + '">' + esc(c) + '</option>').join("");
    if (p.sizes.length === 1) els.modalSize.value = p.sizes[0];
    els.modalSize.classList.remove("is-invalid");
    els.modalColor.classList.remove("is-invalid");

    els.modalQty.textContent = "1";
    els.modalAdd.disabled = isSoldOut(p);
    els.modalAdd.textContent = isSoldOut(p) ? "Esgotado" : "Adicionar à sacola";

    els.modal.hidden = false;
    syncLayers();

    const box = els.modal.querySelector(".modal-box");
    if (box) box.scrollTop = 0;
    setTimeout(() => els.modalClose.focus(), 60);

    if (fromQuickAdd && !isSoldOut(p)) {
      toast("Escolhe o tamanho e a cor para adicionar à sacola.");
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
    const size = els.modalSize.value;
    const color = els.modalColor.value;
    els.modalSize.classList.toggle("is-invalid", !size);
    els.modalColor.classList.toggle("is-invalid", !color);

    if (!size) {
      toast("Escolhe o tamanho antes de adicionar.", "warning");
      els.modalSize.focus();
      return;
    }
    if (!color) {
      toast("Escolhe a cor antes de adicionar.", "warning");
      els.modalColor.focus();
      return;
    }

    addToCart(p.id, size, color, state.modalQty);
    closeModal();
    toast("Produto adicionado à sacola.");
  }

  /* ======================================================
     10. CATÁLOGO: FILTROS, PESQUISA, ORDENAÇÃO
     ====================================================== */
  function getVisibleProducts() {
    const tokens = norm(state.search.trim()).split(/\s+/).filter(Boolean);

    let list = PRODUCTS.filter(p => {
      if (state.category !== "todas" && p.categoryId !== state.category) return false;
      if (tokens.length === 0) return true;
      const hay = norm(p.name + " " + p.categoryName + " " + p.categoryId + " " + p.code);
      return tokens.every(t => hay.indexOf(t) !== -1);
    });

    list = list.slice();

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

  function cardHTML(p) {
    const soldOut = isSoldOut(p);
    return '<article class="product-card" id="product-' + p.id + '" data-id="' + p.id + '">' +
      '<button type="button" class="product-media" data-action="details" data-id="' + p.id + '" aria-label="Ver detalhes de ' + esc(p.name) + '">' +
        '<img src="' + esc(p.image) + '" alt="' + esc(p.name) + ' - ' + esc(p.categoryName) + ' FREESTYLE DREWP" loading="lazy" decoding="async">' +
        (p.isNew ? '<span class="badge">Novo</span>' : '') +
      '</button>' +
      '<div class="product-body">' +
        '<span class="product-category">' + esc(p.categoryName.toUpperCase()) + '</span>' +
        '<h3 class="product-name">' + esc(p.name) + '</h3>' +
        '<p class="product-code">Ref. ' + esc(p.code) + '</p>' +
        '<p class="product-price">' + esc(priceText(p)) + '</p>' +
        '<p class="product-stock">' + esc(statusText(p)) + '</p>' +
        '<div class="card-actions">' +
          '<button type="button" class="btn btn-outline-dark btn-sm" data-action="details" data-id="' + p.id + '">Ver detalhes</button>' +
          '<button type="button" class="btn btn-dark btn-sm" data-action="quick-add" data-id="' + p.id + '"' + (soldOut ? ' disabled' : '') + '>' +
            (soldOut ? 'Esgotado' : 'Adicionar à sacola') + '</button>' +
        '</div>' +
      '</div>' +
    '</article>';
  }

  function renderProducts() {
    if (!els.productGrid) return;
    const list = getVisibleProducts();

    els.productGrid.innerHTML = list.map(cardHTML).join("");
    els.productGrid.hidden = list.length === 0;
    if (els.emptyState) els.emptyState.hidden = list.length > 0;

    if (els.resultCount) {
      els.resultCount.textContent = list.length === 0
        ? "Nenhum produto encontrado."
        : "A mostrar " + list.length + " de " + PRODUCTS.length + " peças";
    }
    if (els.searchClear) els.searchClear.hidde