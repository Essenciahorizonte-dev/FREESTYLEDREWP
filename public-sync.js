/* FREESTYLE DREWP - sincronização pública com o Supabase.
   Faz 2 pedidos leves (imagens activas + produtos), guarda a última resposta no
   navegador para abrir depressa nas visitas seguintes e avisa o script.js quando
   há dados novos. Não há verificação de ficheiros locais. */
(function () {
  "use strict";
  var C = window.FS_PUBLIC_CONFIG || {};
  var base = String(C.SUPABASE_URL || "").replace(/\/$/, "");
  var CACHE_KEY = "fd_remote_v3:" + base; /* cada projecto Supabase tem a sua própria cache */
  var CACHE_MAX_AGE = 24 * 60 * 60 * 1000; /* cache máxima de 24 horas */
  var TIMEOUT = 12000;

  var state = { images: [], products: [], byProduct: {}, assets: {}, ready: false, error: false, fromCache: false };
  var listeners = [];
  window.FS_REMOTE_STATE = state;

  function key(type, target, color) { return [type, target, color || ""].join("|"); }
  function publicUrl(path) {
    return base + "/storage/v1/object/public/" + C.BUCKET + "/" + String(path).split("/").map(encodeURIComponent).join("/");
  }

  function api(path) {
    var ctrl = typeof AbortController === "function" ? new AbortController() : null;
    var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, TIMEOUT) : null;
    return fetch(base + "/rest/v1/" + path, { headers: { apikey: C.SUPABASE_PUBLISHABLE_KEY, Accept: "application/json" }, cache: "no-store", signal: ctrl ? ctrl.signal : undefined })
      .then(function (r) {
        if (!r.ok) throw new Error("Supabase: " + r.status);
        return r.json();
      })
      .finally(function () { if (timer) clearTimeout(timer); });
  }

  function readCache() {
    try {
      var raw = JSON.parse(localStorage.getItem(CACHE_KEY) || "null");
      if (!raw || !raw.t || Date.now() - raw.t > CACHE_MAX_AGE) return null;
      if (!Array.isArray(raw.images) || !Array.isArray(raw.products)) return null;
      return raw;
    } catch (e) { return null; }
  }
  function writeCache(images, products) {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify({ t: Date.now(), images: images, products: products })); } catch (e) { /* sem localStorage: funciona na mesma */ }
  }

  function notify() {
    listeners.slice().forEach(function (fn) {
      try { fn(state); } catch (e) { if (window.console) console.error("FREESTYLE:", e); }
    });
  }

  function ingest(images, products, fromCache) {
    state.images = images || [];
    state.products = products || [];
    state.byProduct = {};
    state.assets = {};
    state.images.forEach(function (i) {
      var u = publicUrl(i.storage_path);
      if (i.image_type === "product") {
        var k = key("product", i.target_key, i.color_key);
        (state.byProduct[k] || (state.byProduct[k] = [])).push(u);
      } else {
        var a = key(i.image_type, i.target_key, null);
        if (!state.assets[a]) state.assets[a] = u; /* a 1.ª (mais recente) ganha */
      }
    });
    state.ready = true;
    state.error = false;
    state.fromCache = !!fromCache;
    applyAssets();
    notify();
  }

  function fail(err) {
    if (window.console) console.warn("FREESTYLE: não foi possível sincronizar com o Supabase.", err);
    if (state.ready) return; /* mantém os dados da cache */
    state.error = true;
    notify();
  }

  function load() {
    if (!base || !C.SUPABASE_PUBLISHABLE_KEY) { fail(new Error("Configuração em falta")); return Promise.resolve(state); }
    return Promise.all([
      api("freestyle_images?select=image_type,target_key,color_key,storage_path&is_active=eq.true&order=sort_order.asc,created_at.desc"),
      api("freestyle_products?select=id,name,category,price,description,colors,sizes,status,is_active&order=sort_order.asc")
    ]).then(function (r) {
      writeCache(r[0], r[1]);
      ingest(r[0], r[1], false);
      return state;
    }).catch(function (err) { fail(err); return state; });
  }

  /* Logótipo, ícone, fundos e novidades geridos no painel */
  function applyAssets() {
    function pick(types, targets) {
      for (var a = 0; a < types.length; a++) for (var b = 0; b < targets.length; b++) {
        var v = state.assets[key(types[a], targets[b], null)];
        if (v) return v;
      }
      return null;
    }
    var logo = pick(["brand", "general"], ["logo", "logotipo", "site-logo"]);
    if (logo) document.querySelectorAll(".brand-logo").forEach(function (i) { if (i.getAttribute("src") !== logo) i.src = logo; i.hidden = false; });
    var favicon = pick(["favicon", "brand"], ["favicon", "icon"]);
    if (favicon) { var icon = document.querySelector('link[rel="icon"]'); if (icon) icon.href = favicon; }
    document.querySelectorAll(".hero-slide").forEach(function (img, i) {
      var n = i + 1, v = pick(["hero", "background", "general"], ["hero-" + n, "destaque-" + n, "background-" + n, "fundo-" + n]);
      if (v && img.getAttribute("src") !== v) img.src = v;
    });
    document.querySelectorAll(".showcase-slide").forEach(function (img, i) {
      var n = i + 1, v = pick(["novelty", "general"], ["novelty-" + n, "novidade-" + n]);
      if (v && img.getAttribute("src") !== v) img.src = v;
    });
    var bg = pick(["background", "general"], ["page-background", "site-background", "page-hero"]);
    if (bg) {
      var safe = bg.replace(/'/g, "%27");
      document.documentElement.style.setProperty("--site-managed-background", "url('" + safe + "')");
      document.querySelectorAll(".page-hero").forEach(function (el) {
        el.style.backgroundImage = "linear-gradient(#0a0a0f99,#0a0a0f99),url('" + safe + "')";
        el.style.backgroundSize = "cover";
        el.style.backgroundPosition = "center";
      });
    }
  }

  window.FS_SYNC = {
    onSync: function (fn) {
      listeners.push(fn);
      if (state.ready || state.error) { try { fn(state); } catch (e) { /* ignora */ } }
    },
    reload: function () { state.error = false; return load(); }
  };

  /* Actualizações enviadas pelo painel noutra aba do mesmo navegador. */
  window.addEventListener("storage", function (event) {
    if (event.key === "fs_catalog_changed") load();
  });
  if ("BroadcastChannel" in window) {
    try {
      var channel = new BroadcastChannel("fs-catalog");
      channel.addEventListener("message", function (event) {
        if (event.data && event.data.type === "changed") load();
      });
    } catch (e) { /* navegador sem suporte: a actualização normal continua disponível */ }
  }

  /* 1) mostra já a cache deste projecto  2) confirma na rede */
  var cached = readCache();
  if (cached) ingest(cached.images, cached.products, true);
  load();
})();
