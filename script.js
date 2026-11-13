(() => {
  "use strict";

  // COLOCA AQUI O NÚMERO REAL DA LOJA
  // Exemplo: 258841234567
  const WHATSAPP_NUMBER = "258XXXXXXXXX";

  const CART_KEY = "freestyle_drewp_cart";

  const categories = [
    {
      id: "camisas",
      name: "Camisas",
      description: "Expressa o teu estilo.",
      prefix: "Camisa"
    },
    {
      id: "calcoes",
      name: "Calções",
      description: "Conforto e personalidade.",
      prefix: "Calção"
    },
    {
      id: "chapeus",
      name: "Chapéus",
      description: "O detalhe que completa o visual.",
      prefix: "Chapéu"
    },
    {
      id: "conjuntos",
      name: "Conjuntos",
      description: "Combinações que fazem a diferença.",
      prefix: "Conjunto"
    },
    {
      id: "sacolas",
      name: "Sacolas",
      description: "Leva o teu estilo contigo.",
      prefix: "Sacola"
    },
    {
      id: "camisolas",
      name: "Camisolas",
      description: "Conforto para todos os dias.",
      prefix: "Camisola"
    }
  ];

  const container = document.getElementById("products-container");

  const $ = (selector, parent = document) =>
    parent.querySelector(selector);

  const $$ = (selector, parent = document) =>
    [...parent.querySelectorAll(selector)];

  let cart = [];

  try {
    cart = JSON.parse(sessionStorage.getItem(CART_KEY) || "[]");

    if (!Array.isArray(cart)) {
      cart = [];
    }
  } catch (error) {
    cart = [];
  }

  function createProducts() {
    if (!container) return;

    container.innerHTML = "";

    categories.forEach(category => {
      const section = document.createElement("section");

      section.className = "catalog-category";
      section.id = category.id;
      section.dataset.category = category.id;

      section.innerHTML = `
        <div class="category-heading">
          <span class="section-label">FREESTYLE DREWP COLLECTION</span>
          <h2>${category.name}</h2>
          <p>${category.description}</p>
        </div>

        <div class="products-grid"></div>
      `;

      const grid = $(".products-grid", section);

      for (let i = 1; i <= 6; i++) {
        const number = String(i).padStart(2, "0");
        const productId = `${category.id}${i}`;
        const productName = `${category.prefix} ${number}`;
        const imageNumber = i;

        const card = document.createElement("article");

        card.className = "product-card";
        card.dataset.id = productId;
        card.dataset.name = productName;
        card.dataset.category = category.name;
        card.dataset.price = "0";

        const imagePath = `imagens/${category.id === "camisas" ? "camisa" : category.id === "calcoes" ? "calcao" : category.id === "chapeus" ? "chapeu" : category.id === "conjuntos" ? "conjunto" : category.id === "sacolas" ? "sacola" : "camisola"}${imageNumber}.png`;

        card.innerHTML = `
          <div class="product-image">
            <img
              src="${imagePath}"
              alt="${productName} FREESTYLE"
              loading="lazy"
              onerror="this.style.display='none';this.parentElement.classList.add('image-missing')"
            >
          </div>

          <div class="product-info">
            <span class="product-category">${category.name.toUpperCase()}</span>

            <h3>${productName}</h3>

            <p class="product-price">Preço a definir</p>

            <label for="size-${productId}">Tamanho</label>
            <select id="size-${productId}" class="product-size">
              <option value="">Escolher tamanho</option>
              <option>Único</option>
              <option>S</option>
              <option>M</option>
              <option>L</option>
              <option>XL</option>
              <option>XXL</option>
            </select>

            <label for="color-${productId}">Cor</label>
            <select id="color-${productId}" class="product-color">
              <option value="">Escolher cor</option>
              <option>Preto</option>
              <option>Branco</option>
              <option>Outra</option>
            </select>

            <label for="qty-${productId}">Quantidade</label>
            <input
              id="qty-${productId}"
              type="number"
              class="product-quantity"
              min="1"
              max="99"
              value="1"
            >

            <button type="button" class="add-to-cart">
              Adicionar à sacola
            </button>
          </div>
        `;

        grid.appendChild(card);
      }

      container.appendChild(section);
    });
  }

  function showToast(message) {
    const toast = $("#toast");

    if (!toast) return;

    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(showToast.timer);

    showToast.timer = setTimeout(() => {
      toast.classList.remove("show");
    }, 2600);
  }

  function saveCart() {
    sessionStorage.setItem(CART_KEY, JSON.stringify(cart));
    renderCart();
  }

  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[char]);
  }

  function renderCart() {
    const count = cart.reduce(
      (total, product) => total + product.quantity,
      0
    );

    const badge = $("#cart-count");

    if (badge) {
      badge.textContent = count;
    }

    const host = $("#cart-items");
    const total = $("#cart-total");

    if (!host) return;

    if (cart.length === 0) {
      host.innerHTML = `
        <p class="empty-cart">
          A tua sacola ainda está vazia.
        </p>
      `;

      if (total) {
        total.textContent = "A confirmar";
      }

      return;
    }

    host.innerHTML = cart.map((product, index) => `
      <article class="cart-line">
        <div>
          <strong>${escapeHTML(product.name)}</strong>

          <small>
            ${escapeHTML(product.category)}
            · Tamanho: ${escapeHTML(product.size)}
            · Cor: ${escapeHTML(product.color)}
          </small>

          <small>
            Quantidade: ${product.quantity}
          </small>
        </div>

        <button
          type="button"
          class="remove-item"
          data-index="${index}"
        >
          Remover
        </button>
      </article>
    `).join("");

    if (total) {
      total.textContent = "Preço a confirmar";
    }
  }

  function filterCategory(category, scroll = true) {
    const sections = $$(".catalog-category");

    $$(".filter-button").forEach(button => {
      const active = button.dataset.filter === category;

      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });

    sections.forEach(section => {
      const show =
        category === "todas" ||
        section.dataset.category === category;

      section.hidden = !show;
    });

    if (scroll) {
      if (category === "todas") {
        $("#categorias").scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
      } else {
        const target = document.getElementById(category);

        if (target) {
          target.scrollIntoView({
            behavior: "smooth",
            block: "start"
          });
        }
      }
    }
  }

  $("#catalog-filters")?.addEventListener("click", event => {
    const button = event.target.closest("[data-filter]");

    if (!button) return;

    filterCategory(button.dataset.filter);
  });

  document.addEventListener("click", event => {
    const addButton = event.target.closest(".add-to-cart");

    if (addButton) {
      const card = addButton.closest(".product-card");

      if (!card) return;

      const size = $(".product-size", card).value;
      const color = $(".product-color", card).value;

      if (!size) {
        showToast("Escolhe o tamanho antes de adicionar.");
        $(".product-size", card).focus();
        return;
      }

      if (!color) {
        showToast("Escolhe a cor antes de adicionar.");
        $(".product-color", card).focus();
        return;
      }

      const quantity = Math.max(
        1,
        Math.min(
          99,
          parseInt($(".product-quantity", card).value, 10) || 1
        )
      );

      const product = {
        id: card.dataset.id,
        name: card.dataset.name,
        category: card.dataset.category,
        size,
        color,
        quantity
      };

      const existing = cart.find(item =>
        item.id === product.id &&
        item.size === product.size &&
        item.color === product.color
      );

      if (existing) {
        existing.quantity = Math.min(
          99,
          existing.quantity + quantity
        );
      } else {
        cart.push(product);
      }

      saveCart();

      showToast(`${product.name} adicionada à sacola.`);
      return;
    }

    const removeButton = event.target.closest(".remove-item");

    if (removeButton) {
      const index = Number(removeButton.dataset.index);

      cart.splice(index, 1);

      saveCart();

      showToast("Artigo removido da sacola.");
    }
  });

  $("#clear-cart")?.addEventListener("click", () => {
    cart = [];

    saveCart();

    showToast("Sacola esvaziada.");
  });

  $("#checkout-button")?.addEventListener("click", () => {
    if (cart.length === 0) {
      showToast("Adiciona pelo menos um produto à sacola.");
      return;
    }

    if (WHATSAPP_NUMBER.includes("X")) {
      showToast("Configura primeiro o número de WhatsApp no script.js.");
      return;
    }

    const productsMessage = cart.map(product =>
      `• ${product.name}\n` +
      `  Categoria: ${product.category}\n` +
      `  Tamanho: ${product.size}\n` +
      `  Cor: ${product.color}\n` +
      `  Quantidade: ${product.quantity}`
    ).join("\n\n");

    const message =
      `Olá, FREESTYLE DREWP!\n\n` +
      `Quero fazer esta encomenda:\n\n` +
      `${productsMessage}\n\n` +
      `Podem confirmar os preços e a disponibilidade?`;

    const whatsappURL =
      `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

    window.open(whatsappURL, "_blank");
  });

  const menu = $("#menu-toggle");
  const navigation = $("#navigation");

  menu?.addEventListener("click", () => {
    const isOpen = navigation.classList.toggle("is-open");

    menu.setAttribute("aria-expanded", String(isOpen));
  });

  navigation?.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => {
      navigation.classList.remove("is-open");
      menu?.setAttribute("aria-expanded", "false");
    });
  });

  // Inicializar catálogo e sacola
  createProducts();
  renderCart();

})();