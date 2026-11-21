/* ==========================================================
   FREESTYLE DREWP - script.js  (usado pelas 3 páginas)
   ==========================================================

   GUIA RÁPIDO (isto só se vê aqui no código; os clientes não vêem)
   ----------------------------------------------------------

   O QUE ESTE FICHEIRO FAZ
   1. Define as peças e as cores (secção 2).
   2. Descobre SOZINHO que peças têm fotografias e mostra só essas
      (bloco "Fotografias"). Peça sem fotos = não aparece, sem mexer no HTML.
   3. Catálogo: filtros, pesquisa, ordenação, detalhes, cores e sacola.
   4. Início: troca os 3 fundos, troca as Novidades e preenche
      "Encontra o teu estilo" com fotos FIXAS (não mudam).
   5. Sacola e encomenda pelo WhatsApp.

   COMO MOSTRAR UMA PEÇA NOVA
   Envia as fotos para a pasta imagens/ com este nome:
        <peça>-<cor>.jpg      ex.: camisa1-branco.jpg   polo3-rosa.jpg
   Peças:  camisa1 a camisa5 | polo1 a polo5 | calsa1 a calsa4
           chapeu1 a chapeu4 | sacola1 a sacola4 | camisola1 a camisola4
   Cores:  branco, preto, azul, rosa, vermelho, castanho, cinza
   Basta UMA cor para a peça aparecer. As cores sem foto ficam escondidas.
   Também aceita .png, .jpeg e .webp (procurados em segundo plano nas cores
   branco, preto e azul), mas .jpg é o recomendado e o mais rápido.
   A ordem das peças é sempre a definida na secção 2 (a 1.ª com fotos
   fica em 1.º lugar; quando adicionares outra, entra na posição certa).

   ONDE EDITAR (secção 1 - CONFIGURAÇÃO)
   - CONFIG.whatsapp / phone / instagram / facebook / location
   - PRICE_BY_TYPE (preço por tipo de peça: camisa, polo, calsa, chapeu, sacola, camisola)
   - PRICES (preço de uma peça específica) - AVAILABILITY ("Esgotado", etc.)
   - PRODUCT_NAMES (nomes)       - PRODUCT_COLORS (limitar cores de uma peça)
   - COLOR_INTERVAL / HERO_INTERVAL / SHOWCASE_INTERVAL (velocidade das trocas)

   POR QUE ESTE SITE É RÁPIDO
   - Confirma as fotos com pedidos leves (HEAD): não descarrega imagens.
   - Guarda no telemóvel do cliente quais as peças com fotos (localStorage):
     da 2.ª visita em diante o catálogo aparece no mesmo instante.
   - Só carrega as fotos que estão no ecrã (loading="lazy").
   - A troca automática de cores só começa 4 segundos depois de a lista estar pronta.
   DICA IMPORTANTE: comprime as fotos (cerca de 800 x 1000 px e menos de 200 KB).
   Fotos pesadas são a maior causa de lentidão.

   SE ALGO FALHAR: abre a consola do navegador (F12). Cada passo do arranque
   está isolado (função safe), por isso um erro não pára o resto do site.
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

  /* PREÇO POR TIPO DE PEÇA (em MT). Vale para todas as peças desse tipo.
     Para mudar o preço de um tipo inteiro, muda só o número aqui.
       camisa = Camisas (Camisa 01 a 05)   polo = Polos (Polo 01 a 05)
       calsa  = Calças                     chapeu = Chapéus
       sacola = Sacolas                    camisola = Camisolas */
  const PRICE_BY_TYPE = {
    camisa: 800,
    polo: 1000,
    calsa: 1200,
    chapeu: 450,
    sacola: 450,
    camisola: 1200
  };

  /* PREÇO DE UMA PEÇA ESPECÍFICA (tem prioridade sobre o preço por tipo).
     Exemplo: camisa3: 900   (a Camisa 03 passa a custar 900 MT). Vazio = usa PRICE_BY_TYPE. */
  const PRICES = {
  };

  // Disponibilidade por peça (opcional). Exemplo: chapeu2: "Esgotado"
  const AVAILABILITY = {
  };

  // Cores por peça (opcional). Por omissão todas têm as 7 cores.
  // Exemplo: chapeu1: ["azul", "branco"]
  const PRODUCT_COLORS = {
  };

  // Nomes por peça (opcional). Exemplo: camisa1: "Camisa Street"
  const PRODUCT_NAMES = {
  };

  const COLOR_INTERVAL = 3000; // troca de cor dos cartões (ms)
  const HERO_INTERVAL = 5000;  // troca dos fundos do Início (ms)
  const SHOWCASE_INTERVAL = 4000; // troca das Novidades no Início (ms)
  const PRODUCTS_PER_CATEGORY = 4; // camisas: 5 camisas + 5 polos (ver abaixo)

  /* ======================================================
     2. DADOS
     Imagens: imagens/<peça>-<cor>.png ou .jpg  (ex.: imagens/chapeu1-azul.jpg)
     ====================================================== */
  const CART_KEY = "freestyle_drewp_sacola_v3";
  const MAX_QTY = 99;
  const DEFAULT_STATUS = "Disponibilidade sob confirmação";

  /* As 3 primeiras cores aparecem em destaque nas bolinhas;
     as restantes aparecem ao deslizar. A ordem aqui é a ordem das bolinhas. */
  const COLORS = [
    { id: "branco", name: "Branco", hex: "#ffffff" },
    { id: "preto", name: "Preto", hex: "#0a0a0f" },
    { id: "azul", name: "Azul", hex: "#1f5cff" },
    { id: "rosa", name: "Rosa", hex: "#ff5fa2" },
    { id: "vermelho", name: "Vermelho", hex: "#e11d2e" },
    { id: "castanho", name: "Castanho", hex: "#7a4b2a" },
    { id: "cinza", name: "Cinza", hex: "#9aa0ad" }
  ];
  const COLOR_BY_ID = {};
  COLORS.forEach(c => { COLOR_BY_ID[c.id] = c; });

  const SIZES_FULL = ["S", "M", "L", "XL", "XXL"];
  const SIZES_ONE = ["Único"];

  const CATEGORIES = [
    {
      id: "camisa", name: "Camisas", singular: "Camisa", code: "CAM", sizes: SIZES_FULL, tagline: "Expressa o teu estilo.",
      /* 10 peças: 5 camisas normais (camisa1 a camisa5) + 5 polos (polo1 a polo5) */
      lines: [
        { prefix: "camisa", singular: "Camisa", code: "CAM", count: 5 },
        { prefix: "polo", singular: "Polo", code: "POL", count: 5 }
      ]
    },
    { id: "calsa", name: "Calças", singular: "Calça", code: "CAL", sizes: SIZES_FULL, tagline: "Conforto e personalidade." },
    { id: "chapeu", name: "Chapéus", singular: "Chapéu", code: "CHA", sizes: SIZES_ONE, tagline: "O detalhe que completa o visual." },
    { id: "sacola", name: "Sacolas", singular: "Sacola", code: "SAC", sizes: SIZES_ONE, tagline: "Leva o teu estilo contigo." },
    { id: "camisola", name: "Camisolas", singular: "Camisola", code: "CMS", sizes: SIZES_FULL, tagline: "Conforto para todos os dias." }
  ];

  const PRODUCTS = [];
  let orderCounter = 0;

  CATEGORIES.forEach(cat => {
    const lines = cat.lines || [
      { prefix: cat.id, singular: cat.singular, code: cat.code, count: PRODUCTS_PER_CATEGORY }
    ];
    lines.forEach(line => {
      for (let i = 1; i <= line.count; i++) {
        orderCounter += 1;
        const id = line.prefix + i;
        const num = String(i).padStart(2, "0");
        const name = PRODUCT_NAMES[id] || (line.singular + " " + num);
        const colors = (PRODUCT_COLORS[id] || COLORS.map(c => c.id)).filter(c => COLOR_BY_ID[c]);
        PRODUCTS.push({
          id: id,
          categoryId: cat.id,
          categoryName: cat.name,
          name: name,
          code: "FD-" + line.code + "-" + num,
          description: name + " da colecção FREESTYLE DREWP. " + cat.tagline +
            " Escolhe a cor e o tamanho e confirma preço e disponibilidade pelo WhatsApp.",
          sizes: cat.sizes,
          colors: colors,
          missing: {},
          order: orderCounter,
          price: typeof PRICES[id] === "number" ? PRICES[id]
            : (typeof PRICE_BY_TYPE[line.prefix] === "number" ? PRICE_BY_TYPE[line.prefix] : null),
          status: AVAILABILITY[id] || ""
        });
      }
    });
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

  /* Mostra o preço com espaço nos milhares: 1200 vira "1 200 MT" */
  const formatPrice = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, "\u00a0") + " " + CONFIG.currency;
  const priceText = p => (p.price !== null ? formatPrice(p.price) : "Preço sob consulta");
  const statusText = p => p.status || DEFAULT_STATUS;
  const isSoldOut = p => norm(p.status) === "esgotado";
  /* Fotos das peças: aceita jpg, png, jpeg e webp (tenta pela ordem) */
  const IMAGE_EXTENSIONS = ["jpg", "png", "jpeg", "webp"];
  const extIndex = {};
  const imageUrl = (p, colorId, extIdx) => "imagens/" + p.id + "-" + colorId + "." + IMAGE_EXTENSIONS[extIdx];
  const imageFor = (p, colorId) => imageUrl(p, colorId, extIndex[p.id + "-" + colorId] || 0);
  const availableColors = p => p.colors.filter(c => !p.missing[c]);

  /* Formata o número para mostrar (ex.: 258861697479 vira +258 86 169 7479). */
  function formatPhone(n) {
    if (/^258\d{9}$/.test(n)) {
      return "+258 " + n.slice(3, 5) + " " + n.slice(5, 8) + " " + n.slice(8);
    }
    return "+" + n;
  }

  const imgCache = {};
  /* Pré-carrega uma imagem e diz se existe (para trocar de cor sem mostrar imagens partidas). Guarda o resultado para não repetir. */
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

  /* ---- Fotografias: deteção rápida e memória local ----
     Só aparecem as peças que têm fotografias reais. A verificação usa pedidos
     leves (HEAD: só o cabeçalho do ficheiro, sem descarregar a imagem). */
  const PHOTO_CACHE_KEY = "fd_fotos_v1";
  const DEEP_SCAN_TTL = 3 * 60 * 1000; // procura de png/jpeg/webp: no máximo de 3 em 3 minutos
  const existsCache = {};
  const photoCache = { found: {}, deep: {} };

  /* Pergunta ao servidor "este ficheiro existe?" com um pedido HEAD (leve: só o cabeçalho).
     Assim sabemos que fotos existem sem as descarregar. O resultado fica guardado
     (existsCache) para não repetir o pedido na mesma visita. */
  function urlExists(url) {
    if (!existsCache[url]) {
      existsCache[url] = new Promise(resolve => {
        if (typeof fetch !== "function") {
          loadImage(url).then(resolve);
          return;
        }
        fetch(url, { method: "HEAD", cache: "no-cache" })
          .then(res => {
            if (res.status === 405 || res.status === 501) return loadImage(url).then(resolve);
            const type = res.headers && res.headers.get ? res.headers.get("content-type") : "";
            return resolve(res.ok && (!type || /^image\//i.test(type)));
          })
          .catch(() => loadImage(url).then(resolve)); /* ex.: aberto como ficheiro local */
      });
    }
    return existsCache[url];
  }

  /* Corre uma tarefa para cada item, com no máximo "limit" ao mesmo tempo. */
  function mapLimit(items, limit, fn) {
    let index = 0;
    function worker() {
      if (index >= items.length) return Promise.resolve();
      return fn(items[index++]).then(worker);
    }
    const workers = [];
    for (let k = 0; k < Math.min(limit, items.length); k++) workers.push(worker());
    return Promise.all(workers);
  }

  const photoSignature = () => PRODUCTS.map(p => p.photo ? p.id + ":" + availableColors(p).join(",") : "").join("|");

  /* Regista as cores com fotografia de uma peça (found = [{ c: cor, e: extensão }]) */
  function applyFound(p, found) {
    if (!found.length) {
      p.photo = null;
      p.colors.forEach(c => { p.missing[c] = true; });
      return;
    }
    const sorted = found.slice().sort((a, b) => p.colors.indexOf(a.c) - p.colors.indexOf(b.c));
    p.colors.forEach(c => { p.missing[c] = !sorted.some(f => f.c === c); });
    sorted.forEach(f => { extIndex[p.id + "-" + f.c] = f.e; });
    p.photo = { color: sorted[0].c, ext: sorted[0].e };
    const st = getState(p.id);
    if (!st.color || p.missing[st.color]) st.color = p.photo.color;
  }

  /* Guarda no telemóvel do cliente (localStorage) que peças e cores têm fotos. É isto que faz o catálogo aparecer no mesmo instante a partir da 2.ª visita. */
  function savePhotoCache() {
    try {
      const found = {};
      PRODUCTS.forEach(p => {
        if (!p.photo) return;
        const o = {};
        p.colors.forEach(c => { if (!p.missing[c]) o[c] = extIndex[p.id + "-" + c] || 0; });
        found[p.id] = o;
      });
      photoCache.found = found;
      localStorage.setItem(PHOTO_CACHE_KEY, JSON.stringify({ v: 1, found: found, deep: photoCache.deep }));
    } catch (error) {
      /* sem localStorage: funciona na mesma, só não mostra à primeira */
    }
  }

  /* Devolve true se havia memória com peças: nesse caso o catálogo aparece logo */
  function loadPhotoCache() {
    try {
      const raw = JSON.parse(localStorage.getItem(PHOTO_CACHE_KEY) || "null");
      if (!raw || raw.v !== 1 || !raw.found) return false;
      photoCache.found = raw.found;
      photoCache.deep = raw.deep || {};
      let any = false;
      Object.keys(raw.found).forEach(id => {
        const p = BY_ID[id];
        if (!p) return;
        const list = Object.keys(raw.found[id])
          .filter(c => COLOR_BY_ID[c])
          .map(c => ({ c: c, e: Math.min(IMAGE_EXTENSIONS.length - 1, Number(raw.found[id][c]) || 0) }));
        if (list.length) {
          applyFound(p, list);
          any = true;
        }
      });
      return any;
    } catch (error) {
      return false;
    }
  }

  /* Confirma que cores da peça têm fotografia (.jpg em todas as cores + as já conhecidas) */
  /* Confirma, para UMA peça, que cores têm foto: testa .jpg em todas as cores
     (+ outros formatos já conhecidos). Quem decide se a peça aparece é p.photo:
     com foto = aparece; sem foto = oculta (ver getVisibleProducts). */
  function verifyProduct(p) {
    const known = photoCache.found[p.id] || {};
    const tests = p.colors.map(c => ({ c: c, e: 0 }));
    p.colors.forEach(c => { if (known[c] > 0) tests.push({ c: c, e: known[c] }); });
    return Promise.all(tests.map(t => urlExists(imageUrl(p, t.c, t.e)).then(ok => ok ? t : null))).then(list => {
      const best = {};
      list.filter(Boolean).forEach(t => {
        if (best[t.c] === undefined || t.e < best[t.c]) best[t.c] = t.e;
      });
      applyFound(p, Object.keys(best).map(c => ({ c: c, e: best[c] })));
    });
  }

  /* Em segundo plano (3 s depois de o catálogo estar à vista): para as peças que ainda
     NÃO aparecem, procura fotografias noutros formatos (png, jpeg, webp) nas cores
     branco, preto e azul. O .jpg é o formato recomendado e o mais rápido. */
  function deepScan(p) {
    const last = photoCache.deep[p.id];
    if (p.photo || (last && Date.now() - last < DEEP_SCAN_TTL)) return Promise.resolve(false);

    const tests = [];
    p.colors.slice(0, 3).forEach(c => {
      tests.push({ c: c, e: 1 }); /* png */
      tests.push({ c: c, e: 2 }); /* jpeg */
      tests.push({ c: c, e: 3 }); /* webp */
    });
    return Promise.all(tests.map(t => urlExists(imageUrl(p, t.c, t.e)).then(ok => ok ? t : null))).then(list => {
      photoCache.deep[p.id] = Date.now();
      const extra = {};
      list.filter(Boolean).forEach(t => {
        if (extra[t.c] === undefined || t.e < extra[t.c]) extra[t.c] = t.e;
      });
      const extraColors = Object.keys(extra);
      if (!extraColors.length) return false;
      const merged = p.colors
        .filter(c => !p.missing[c])
        .map(c => ({ c: c, e: extIndex[p.id + "-" + c] || 0 }))
        .concat(extraColors.map(c => ({ c: c, e: extra[c] })));
      applyFound(p, merged);
      return true;
    });
  }

  /* Arranque: mostra logo o que está na memória e confirma em segundo plano.
     onChange() é chamada sempre que a lista de peças disponíveis muda. */
  function startPhotos(onChange) {
    const hadCache = loadPhotoCache();
    let ready = false;
    const markReady = () => { ready = true; catalogReady = true; if (!readyAt) readyAt = Date.now(); };

    if (hadCache) {
      markReady();
      onChange();
    }
    const before = photoSignature();

    /* primeira visita: não espera mais de 2,5 s */
    setTimeout(() => {
      if (ready) return;
      markReady();
      onChange();
    }, 2500);

    mapLimit(PRODUCTS, PRODUCTS.length, verifyProduct).then(() => {
      savePhotoCache();
      const afterVerify = photoSignature();
      const first = !ready;
      markReady();
      if (first || afterVerify !== before) onChange();

      return new Promise(resolve => setTimeout(resolve, 3000))
        .then(() => mapLimit(PRODUCTS, 3, deepScan))
        .then(() => {
          savePhotoCache();
          if (photoSignature() !== afterVerify) onChange();
        });
    });
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
  const sliderRefreshers = [];
  const shownCards = {};        // cartões já mostrados (a animação de entrada só corre uma vez)
  let catalogReady = false;
  let readyAt = 0;              // hora em que a lista ficou pronta (a troca de cores só começa 4 s depois)     // true quando já se sabe que peças têm fotografias

  /* Estado de UMA peça no ecrã: a cor mostrada agora e se está "travada" (o cliente escolheu ou deslizou as cores = pára a troca automática). */
  function getState(id) {
    if (!cardState[id]) {
      const p = BY_ID[id];
      cardState[id] = { color: (p.photo && p.photo.color) || availableColors(p)[0] || "", locked: false };
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

  /* Texto "Cor: Azul" que aparece por baixo das bolinhas. */
  function colorLabel(p) {
    const st = getState(p.id);
    return st.color ? "Cor: " + COLOR_BY_ID[st.color].name : "Imagens em breve";
  }

  /* Diz se as bolinhas já desenhadas são as mesmas cores disponíveis (evita refazê-las sem necessidade). */
  function samePicker(picker, list) {
    const dots = picker.querySelectorAll(".color-dot");
    if (dots.length !== list.length) return false;
    for (let i = 0; i < list.length; i++) {
      if (dots[i].dataset.color !== list[i]) return false;
    }
    return true;
  }

  /* Actualiza as bolinhas sem as refazer (assim a posição do deslize não se perde) */
  function syncPicker(picker, p) {
    const st = getState(p.id);
    const list = availableColors(p);
    if (!samePicker(picker, list)) {
      picker.innerHTML = dotsHTML(p);
    } else {
      picker.querySelectorAll(".color-dot").forEach(d => {
        const active = d.dataset.color === st.color;
        d.classList.toggle("is-active", active);
        d.setAttribute("aria-pressed", String(active));
      });
    }
    const slider = picker.closest ? picker.closest(".color-slider") : null;
    if (slider) slider.dataset.many = String(list.length > 3);
  }

  /* Na troca automática, desliza as bolinhas para mostrar a cor activa */
  function revealActive(picker) {
    if (!picker || !picker.scrollTo) return;
    const dots = Array.prototype.slice.call(picker.querySelectorAll(".color-dot"));
    const index = dots.findIndex(d => d.classList.contains("is-active"));
    if (index < 0 || !dots[0]) return;
    const slot = dots[0].offsetWidth || 38;
    picker.scrollTo({ left: Math.floor(index / 3) * 3 * slot, behavior: "smooth" });
  }

  /* Actualiza as bolinhas e o texto da cor de uma peça (nos cartões e na janela de detalhes). */
  function refreshCard(id, reveal) {
    const p = BY_ID[id];
    const st = getState(id);
    if (st.color && p.missing[st.color]) st.color = availableColors(p)[0] || "";
    const label = colorLabel(p);

    document.querySelectorAll('.product-card[data-id="' + id + '"]').forEach(card => {
      const picker = card.querySelector(".color-picker");
      const name = card.querySelector(".color-name");
      if (picker) {
        syncPicker(picker, p);
        if (reveal) revealActive(picker);
      }
      if (name) name.textContent = label;
    });

    if (state.modalProduct && state.modalProduct.id === id) {
      if (els.modalColors) syncPicker(els.modalColors, p);
      if (els.modalColorName) els.modalColorName.textContent = label;
    }
  }

  /* Troca a foto de uma peça com um pequeno desvanecer (nos cartões e na janela de detalhes). */
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

  /* Mostra uma cor: primeiro confirma que a foto existe e só depois troca (nunca aparece imagem partida). */
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
      refreshCard(id, !manual);
    });
  }

  /* O cliente tocou numa bolinha: mostra essa cor e pára a troca automática dessa peça. */
  function pickColor(id, colorId) {
    getState(id).locked = true; /* a escolha da pessoa pára a troca automática */
    showColor(id, colorId, true);
  }

  /* Troca automática de cor dos cartões do CATÁLOGO (de COLOR_INTERVAL em COLOR_INTERVAL ms).
     Só mexe nos cartões visíveis no ecrã e que o cliente ainda não "travou"
     (ao escolher uma cor ou deslizar as bolinhas, essa peça pára de trocar).
     NÃO afecta "Encontra o teu estilo" do Início: essas fotos são fixas. */
  function colorTick() {
    if (document.hidden) return;
    if (!catalogReady || Date.now() - readyAt < 4000) return; /* deixa as fotos iniciais carregarem primeiro */
    Array.from(visibleIds).slice(0, 4).forEach((id, i) => {
      const p = BY_ID[id];
      const st = cardState[id];
      if (!p || !st || st.locked) return;
      const card = document.getElementById("product-" + id);
      const shown = card && card.querySelector ? card.querySelector(".product-img") : null;
      if (shown && shown.complete === false) return; /* foto actual ainda a carregar: não pede mais nada */
      const list = availableColors(p);
      if (list.length < 2) return;
      const next = list[(list.indexOf(st.color) + 1) % list.length];
      setTimeout(() => {
        if (!cardState[id].locked) showColor(id, next, false);
      }, i * 160);
    });
  }

  let cardObserver = null;
  /* Regista que cartões estão visíveis no ecrã (só esses trocam de cor sozinhos: menos tráfego e mais rapidez). */
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

  /* Rede de segurança: se a foto de um cartão falhar mesmo assim, tenta outro formato ou cor em vez de mostrar imagem partida. */
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
  /* Slider automático e robusto: só mostra imagens realmente carregadas
     e volta a incluir sozinho as que chegarem mais tarde. */
  function createSlider(selector, dotsId, interval) {
    const slides = Array.prototype.slice.call(document.querySelectorAll(selector));
    if (slides.length === 0) return;

    const dotsBox = $(dotsId);
    let current = 0;
    let timer = null;

    const isLoaded = s => s.complete && s.naturalWidth > 0;
    const loadedList = () => slides.map((s, i) => i).filter(i => {
      if (isLoaded(slides[i])) {
        slides[i].classList.remove("is-missing");
        return true;
      }
      return false;
    });

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
      const list = loadedList();
      if (list.length === 0) return;
      const pos = list.indexOf(current);
      show(list[(pos + 1) % list.length]);
    }

    function restart() {
      clearInterval(timer);
      timer = setInterval(() => { if (!document.hidden) next(); }, interval);
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

    sliderRefreshers.push(() => {
      if (!isLoaded(slides[current])) next();
    });

    const first = loadedList()[0];
    show(first === undefined ? 0 : first);
    restart();
  }

  /* ======================================================
     8. SACOLA (dados)
     ====================================================== */
  /* SACOLA: fica guardada na sessão do navegador (sessionStorage), por isso
     mantém-se ao mudar de página e desaparece quando o cliente fecha o separador. */
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

  /* Grava a sacola na sessão do navegador. */
  function persistCart() {
    try {
      sessionStorage.setItem(CART_KEY, JSON.stringify(state.cart));
    } catch (error) {
      /* sem sessionStorage: a sacola continua a funcionar em memória */
    }
  }

  /* Calcula o número de artigos, o total e quantas linhas têm preço. */
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

  /* Texto do total da sacola (usa os preços; sem preço mostra "Preço sob consulta"). */
  function totalText(t) {
    if (t.lines === 0 || t.priced === 0) return "Preço sob consulta";
    if (t.priced === t.lines) return formatPrice(t.sum);
    return formatPrice(t.sum) + " + itens a confirmar";
  }

  /* Actualiza o número de artigos no ícone da sacola do cabeçalho (em todas as páginas). */
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

  /* Junta uma peça à sacola (a mesma peça com a mesma cor e tamanho soma a quantidade). */
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

  /* Aumenta ou diminui a quantidade de uma linha da sacola (abaixo de 1 retira a peça). */
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

  /* Retira uma linha da sacola. */
  function removeFromCart(index) {
    if (!state.cart[index]) return;
    state.cart.splice(index, 1);
    persistCart();
    renderBag();
    updateBadges(false);
    toast("Produto removido.");
  }

  /* Esvazia a sacola toda. */
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

  /* Mostra/esconde o fundo escuro e bloqueia a rolagem enquanto a janela de detalhes ou a sacola estão abertas. */
  function syncLayers() {
    const modalOpen = !!els.modal && !els.modal.hidden;
    const bagOpen = !!els.drawer && els.drawer.classList.contains("is-open");
    if (els.overlay) els.overlay.hidden = !(modalOpen || bagOpen);
    document.body.classList.toggle("no-scroll", modalOpen || bagOpen);
  }

  /* Abre a gaveta da sacola. */
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

  /* Fecha a gaveta da sacola. */
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

  /* Fecha a janela de detalhes da peça. */
  function closeModal() {
    if (!els.modal || els.modal.hidden) return;
    els.modal.hidden = true;
    state.modalProduct = null;
    syncLayers();
    if (state.lastFocus && typeof state.lastFocus.focus === "function") {
      state.lastFocus.focus();
    }
  }

  /* Muda a quantidade (1 a 99) na janela de detalhes. */
  function setModalQty(value) {
    state.modalQty = Math.min(MAX_QTY, Math.max(1, value));
    els.modalQty.textContent = String(state.modalQty);
  }

  /* Botão "Adicionar à sacola" da janela de detalhes: valida tamanho e cor e adiciona. */
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

  /* Botão "Adicionar à sacola" do cartão: peças de tamanho único entram logo; as outras abrem a janela para escolher o tamanho. */
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
  function sliderHTML(p) {
    const many = availableColors(p).length > 3;
    return '<div class="color-slider" data-many="' + many + '" data-id="' + p.id + '">' +
      '<button type="button" class="color-nav" data-action="colors-prev" data-id="' + p.id + '" aria-label="Ver cores anteriores">&lsaquo;</button>' +
      '<div class="color-picker" role="group" aria-label="Cores de ' + esc(p.name) + '">' + dotsHTML(p) + '</div>' +
      '<button type="button" class="color-nav" data-action="colors-next" data-id="' + p.id + '" aria-label="Ver mais cores">&rsaquo;</button>' +
    '</div>';
  }

  /* HTML de UM cartão de produto. A foto inicial é a da primeira cor com fotografia. */
  function cardHTML(p, isNew) {
    const st = getState(p.id);
    const soldOut = isSoldOut(p);
    const src = st.color ? imageFor(p, st.color) : PLACEHOLDER;
    const alt = p.name + (st.color ? " - " + COLOR_BY_ID[st.color].name : "") + " - " + p.categoryName + " FREESTYLE DREWP";
    const img = '<img class="product-img" src="' + esc(src) + '" alt="' + esc(alt) + '" ' +
      'data-pid="' + p.id + '" data-color="' + esc(st.color) + '" loading="lazy" decoding="async">';

    const media = '<button type="button" class="product-media" data-action="details" data-id="' + p.id + '" aria-label="Ver detalhes de ' + esc(p.name) + '">' + img + '</button>';

    const actions = '<div class="card-actions">' +
        '<button type="button" class="btn btn-outline btn-sm" data-action="details" data-id="' + p.id + '">Ver detalhes</button>' +
        '<button type="button" class="btn btn-primary btn-sm" data-action="quick-add" data-id="' + p.id + '"' + (soldOut ? ' disabled' : '') + '>' +
          (soldOut ? 'Esgotado' : 'Adicionar à sacola') + '</button>' +
      '</div>';

    return '<article class="product-card' + (isNew ? ' is-new' : '') + '" id="product-' + p.id + '" data-id="' + p.id + '">' +
      media +
      '<div class="product-body">' +
        '<span class="product-category">' + esc(p.categoryName.toUpperCase()) + '</span>' +
        '<h3 class="product-name">' + esc(p.name) + '</h3>' +
        '<p class="product-code">Ref. ' + esc(p.code) + '</p>' +
        '<p class="product-price">' + esc(priceText(p)) + '</p>' +
        '<p class="product-stock">' + esc(statusText(p)) + '</p>' +
        sliderHTML(p) +
        '<p class="color-name" aria-live="polite">' + esc(colorLabel(p)) + '</p>' +
        actions +
      '</div>' +
    '</article>';
  }

  /* Lista final de peças a mostrar: só as que têm foto (p.photo), na ordem original,
     depois aplica categoria, pesquisa e ordenação. É aqui que as peças sem fotos
     deixam de existir para o cliente (sem cartões vazios nem buracos). */
  function getVisibleProducts() {
    const tokens = norm(state.search.trim()).split(/\s+/).filter(Boolean);

    const list = PRODUCTS.filter(p => {
      if (!p.photo) return false; /* sem fotografias: oculta */
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

  const availableCount = () => PRODUCTS.filter(p => p.photo).length;

  /* Desenha os cartões no catálogo. Não deixa espaços vazios: só desenha as peças
     com foto, e a grelha (CSS) reorganiza-se sozinha. */
  function renderProducts() {
    if (!els.productGrid) return;

    if (!catalogReady) {
      els.productGrid.innerHTML = "";
      els.productGrid.hidden = true;
      if (els.emptyState) els.emptyState.hidden = true;
      if (els.resultCount) els.resultCount.textContent = "A carregar peças…";
      return;
    }

    const total = availableCount();
    if (els.searchClear) els.searchClear.hidden = state.search === "";

    if (total === 0) {
      els.productGrid.innerHTML = "";
      els.productGrid.hidden = true;
      if (els.emptyState) els.emptyState.hidden = true;
      if (els.resultCount) els.resultCount.textContent = "As novas peças estão a chegar. Volta em breve!";
      return;
    }

    const list = getVisibleProducts();

    els.productGrid.innerHTML = list.map(p => {
      const html = cardHTML(p, !shownCards[p.id]);
      shownCards[p.id] = true;
      return html;
    }).join("");
    els.productGrid.hidden = list.length === 0;
    if (els.emptyState) els.emptyState.hidden = list.length > 0;

    if (els.resultCount) {
      els.resultCount.textContent = list.length === 0
        ? "Nenhum produto encontrado."
        : "A mostrar " + list.length + " de " + total + " peças";
    }
    observeCards();
  }

  /* Marca visualmente o botão da categoria activa. */
  function renderFilterButtons() {
    if (!els.filters) return;
    els.filters.querySelectorAll(".filter-btn").forEach(btn => {
      const active = btn.dataset.category === state.category;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-pressed", String(active));
    });
  }

  /* Confirma que o nome da categoria existe. */
  function isValidCategory(id) {
    return id === "todas" || CATEGORIES.some(c => c.id === id);
  }

  /* Muda de categoria (filtra sem recarregar a página). */
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

  /* Esconde filtros, cartões e ligações de categorias que ainda não têm peças com fotografias */
  function setCategoryLinksHidden(catId, hidden) {
    document.querySelectorAll('[data-category="' + catId + '"], [data-go-category="' + catId + '"]').forEach(el => {
      const target = (el.closest && el.closest(".category-tile, li")) || el;
      target.hidden = hidden;
    });
  }

  /* Esconde filtros e ligações das categorias sem peças com fotos e corrige a categoria activa. */
  function applyAvailability() {
    CATEGORIES.forEach(cat => {
      setCategoryLinksHidden(cat.id, !PRODUCTS.some(p => p.categoryId === cat.id && p.photo));
    });
    if (state.category !== "todas" && !PRODUCTS.some(p => p.categoryId === state.category && p.photo)) {
      state.category = "todas";
    }
    renderFilterButtons();
  }

  /* Volta a desenhar o catálogo (usado quando a lista de peças com fotos muda). */
  function refreshCatalog() {
    applyAvailability();
    renderProducts();
  }

  /* Catálogo: mostra logo (memória) e actualiza quando houver peças novas */
  function startCatalog() {
    let hashDone = false;
    renderProducts(); /* mostra "A carregar peças…" até saber o que existe */
    startPhotos(() => {
      refreshCatalog();
      if (!hashDone && catalogReady) {
        hashDone = true;
        highlightFromHash();
      }
    });
  }

  /* "Encontra o teu estilo" (Início): cada cartão mostra a primeira peça disponível
     da categoria, com a fotografia FIXA (não usa a troca automática do catálogo). */
  function updateCategoryTiles() {
    const tiles = Array.prototype.slice.call(document.querySelectorAll(".category-tile[data-category]"));
    tiles.forEach(tile => {
      const catId = tile.dataset.category;
      const first = PRODUCTS.find(p => p.categoryId === catId && p.photo);
      if (!first) {
        setCategoryLinksHidden(catId, true); /* categoria sem peças com fotografias */
        return;
      }
      setCategoryLinksHidden(catId, false);
      const img = tile.querySelector("img");
      const src = imageFor(first, first.photo.color);
      if (img && img.getAttribute("src") !== src) {
        img.alt = first.name + " - " + first.categoryName + " FREESTYLE DREWP";
        img.src = src;
      }
    });
  }

  /* Início: arranca a detecção de fotos para preencher "Encontra o teu estilo". */
  function setupCategoryTiles() {
    if (document.querySelectorAll(".category-tile[data-category]").length === 0) return;
    startPhotos(updateCategoryTiles);
  }

  /* Ordenação: desactiva "menor/maior preço" se nenhuma peça tiver preço definido. */
  function setupSort() {
    if (!els.sortSelect || HAS_PRICES) return;
    Array.prototype.forEach.call(els.sortSelect.options, opt => {
      if (opt.value === "preco-asc" || opt.value === "preco-desc") {
        opt.disabled = true;
        opt.textContent += " (preços em breve)";
      }
    });
  }

  /* Se o link trouxer #product-xxx, desliza até essa peça e destaca-a. */
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

  /* Abre o WhatsApp com a mensagem pronta. Usa CONFIG.whatsapp (secção 1). */
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

  /* Monta o texto da encomenda para o WhatsApp (peças, cores, tamanhos, quantidades, preços e total). */
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

  /* Botão "Finalizar encomenda": valida a sacola e abre o WhatsApp. */
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

  /* Preenche os contactos (WhatsApp, telefone, redes) a partir de CONFIG.
     Contactos vazios aparecem como "A configurar" e avisam o cliente ao clicar. */
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

  /* Formulário do Contacto: valida os campos e abre o WhatsApp com a mensagem. */
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

  /* Fecha o menu do telemóvel. */
  function closeMenu() {
    setMenu(false);
  }

  /* Menu do telemóvel (hambúrguer) e destaque da página actual no menu. */
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

  /* Sombra no cabeçalho quando a página desce. */
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
  /* Todos os cliques do site passam por aqui (data-action nos botões do HTML/JS):
     details, quick-add, pick-color, colors-prev/next, bag-inc/dec/remove. */
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
      case "colors-prev":
      case "colors-next": {
        const slider = actionEl.closest(".color-slider");
        const picker = slider ? slider.querySelector(".color-picker") : null;
        if (picker && picker.scrollBy) {
          const first = picker.querySelector(".color-dot");
          const slot = (first && first.offsetWidth) || 38;
          picker.scrollBy({ left: (action === "colors-next" ? 1 : -1) * slot * 3, behavior: "smooth" });
        }
        getState(id).locked = true; /* quem desliza as cores pára a troca automática */
        break;
      }
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

  /* Se uma imagem não existir (ex.: fundo1.png), tenta .jpg, .jpeg, .webp,
     maiúsculas (Fundo1, JPG) e a pasta "Imagens" antes de desistir */
  function nextAlternativeSource(img) {
    if (!img._heroList) {
      const src = img.getAttribute("src") || "";
      const m = /^(.*?)([^\/]+)\.[A-Za-z0-9]+$/.exec(src);
      if (!m) return "";
      const dir = m[1];
      const file = m[2];
      const dirs = [dir, dir.replace(/imagens\//, "Imagens/")];
      const files = [file, file.charAt(0).toUpperCase() + file.slice(1)];
      const exts = ["png", "jpg", "jpeg", "webp", "PNG", "JPG"];
      const list = [];
      dirs.forEach(d => files.forEach(f => exts.forEach(e => list.push(d + f + "." + e))));
      img._heroList = list.filter(s => s !== src);
    }
    return img._heroList.shift() || "";
  }

  /* Trata de qualquer imagem que falhe: logótipo (esconde), fundos e novidades (tenta outro formato), peças (outra extensão) e restantes (espaço reservado). */
  function onImageError(event) {
    const img = event.target;
    if (!img || img.tagName !== "IMG") return;

    if (img.classList.contains("brand-logo")) {
      const alt = nextAlternativeSource(img);
      if (alt) {
        img.src = alt;
      } else {
        img.hidden = true;
      }
      return;
    }
    if (img.classList.contains("hero-slide") || img.classList.contains("showcase-slide")) {
      const alternative = nextAlternativeSource(img);
      if (alternative) {
        img.src = alternative;
        return;
      }
      img.classList.add("is-missing");
      sliderRefreshers.forEach(fn => fn());
      return;
    }
    if (img.classList.contains("product-img") && img.dataset.pid && !img.dataset.fallback) {
      handleProductImgError(img);
      return;
    }
    if (!img.dataset.fallback) {
      const alt = nextAlternativeSource(img);
      if (alt) {
        img.src = alt;
        return;
      }
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

  /* Liga todos os botões e campos (pesquisa, ordenação, janelas, sacola, menu) aos seus comportamentos. */
  function bindEvents() {
    document.addEventListener("click", onDocumentClick);
    document.addEventListener("keydown", trapFocus);
    document.addEventListener("error", onImageError, true);

    /* Se a pessoa começa a deslizar as cores de uma peça, pára a troca automática dessa peça */
    document.addEventListener("touchstart", event => {
      const slider = event.target && event.target.closest ? event.target.closest(".color-slider") : null;
      if (slider && slider.dataset.id && BY_ID[slider.dataset.id]) getState(slider.dataset.id).locked = true;
    }, { passive: true });

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
  /* Cada passo corre isolado: se um falhar, os outros continuam a funcionar */
  function safe(fn) {
    try {
      fn();
    } catch (error) {
      if (window.console && console.error) console.error("FREESTYLE DREWP:", error);
    }
  }

  /* ARRANQUE: cada passo está dentro de safe(), por isso se um falhar os outros continuam.
     Ordem: carrega a sacola > menu/cabeçalho > contactos > eventos > sliders do Início >
     catálogo (se a página tiver grelha) > "Encontra o teu estilo" (se existir). */
  function init() {
    safe(() => { state.cart = loadCart(); });
    safe(() => {
      const year = $("currentYear");
      if (year) year.textContent = String(new Date().getFullYear());
    });

    safe(setupMenu);
    safe(setupHeaderEffects);
    safe(setupContacts);
    safe(setupContactForm);
    safe(bindEvents);
    safe(() => createSlider(".hero-slide", "heroDots", HERO_INTERVAL));
    safe(() => createSlider(".showcase-slide", "showcaseDots", SHOWCASE_INTERVAL));
    safe(sweepBrokenImages);
    safe(() => updateBadges(false));
    safe(renderBag);

    safe(() => {
      if (!els.productGrid) return;
      const wanted = new URLSearchParams(window.location.search).get("categoria");
      if (wanted && isValidCategory(wanted)) state.category = wanted;
      setupSort();
      renderFilterButtons();
      startCatalog();
    });
    safe(setupCategoryTiles);

    setInterval(colorTick, COLOR_INTERVAL);

    safe(() => { if (location.hash === "#sacola") openBag(); });
  }

  init();
})();
