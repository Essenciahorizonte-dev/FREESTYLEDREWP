
/* =========================================================
   FREESTYLE DREWP
   JAVASCRIPT PRINCIPAL
   Desenvolvido por Essência Horizonte
========================================================= */


/* ================= 1. CONFIGURAÇÕES ================= */

// ATENÇÃO: substituir pelo número real do vendedor.
// Formato: código do país + número, sem +, espaços ou traços.
const WHATSAPP_NUMBER = "258XXXXXXXXX";

const CART_KEY = "freestyle_drewp_cart";

const CURRENCY = "MT";


// Recuperar a sacola desta sessão.
let cart = [];

try {
    cart = JSON.parse(sessionStorage.getItem(CART_KEY)) || [];
    if (!Array.isArray(cart)) cart = [];
} catch (error) {
    cart = [];
}


// Guardar alterações na sacola.
function saveCart() {
    sessionStorage.setItem(CART_KEY, JSON.stringify(cart));
}


// Formatar preços.
function formatPrice(value) {
    return Number(value || 0).toLocaleString("pt-PT") + " " + CURRENCY;
}


// Converter valores para números.
function numberValue(value) {
    const number = Number(value);
    return Number.isFinite(number) && number >= 0 ? number : 0;
}


/* ================= 2. MENU MOBILE ================= */

const menuToggle = document.querySelector(".menu-toggle");
const navigation = document.querySelector(".navigation");

if (menuToggle && navigation) {

    menuToggle.addEventListener("click", function () {

        navigation.classList.toggle("active");

        const expanded = navigation.classList.contains("active");

        menuToggle.setAttribute("aria-expanded", expanded);

    });

    navigation.querySelectorAll("a").forEach(link => {

        link.addEventListener("click", () => {
            navigation.classList.remove("active");
            menuToggle.setAttribute("aria-expanded", "false");
        });

    });

    document.addEventListener("click", function (event) {

        if (
            !navigation.contains(event.target) &&
            !menuToggle.contains(event.target)
        ) {
            navigation.classList.remove("active");
            menuToggle.setAttribute("aria-expanded", "false");
        }

    });

}


/* ================= 3. IDENTIFICAR PRODUTOS ================= */

function getProductData(button) {

    const card = button.closest(".product-card");

    if (!card) return null;

    const name =
        card.dataset.product ||
        card.querySelector("h3")?.textContent.trim() ||
        "Produto FREESTYLE";

    const category =
        card.dataset.category ||
        "Produto";

    const price =
        numberValue(card.dataset.price);

    const imageElement =
        card.querySelector("img");

    const image =
        card.dataset.image ||
        imageElement?.getAttribute("src") ||
        "";

    const sizeElement =
        card.querySelector(".product-size");

    const colorElement =
        card.querySelector(".product-color");

    const quantityElement =
        card.querySelector(".product-quantity");

    const size =
        sizeElement?.value || "Não especificado";

    const color =
        colorElement?.value || "Não especificada";

    const quantity =
        Math.max(1, Math.floor(numberValue(quantityElement?.value || 1)));

    const slug =
        card.dataset.slug ||
        name.toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "");

    return {
        id: slug,
        name,
        category,
        price,
        image,
        size,
        color,
        quantity,
        url: createProductUrl(slug)
    };

}


// Criar endereço individual do produto.
function createProductUrl(slug) {

    const url = new URL("catalogo.html", window.location.href);

    url.searchParams.set("produto", slug);

    url.hash = slug;

    return url.href;

}


/* ================= 4. ADICIONAR À SACOLA ================= */

document.addEventListener("click", function (event) {

    const button = event.target.closest(".add-to-cart");

    if (!button) return;

    const product = getProductData(button);

    if (!product) return;

    if (product.price <= 0) {

        alert("Este produto ainda não tem preço definido.");

        return;
    }

    if (
        !product.size ||
        product.size === "Não especificado"
    ) {

        alert("Por favor, selecione o tamanho.");

        return;
    }

    if (
        !product.color ||
        product.color === "Não especificada"
    ) {

        alert("Por favor, selecione a cor.");

        return;
    }

    const existingProduct = cart.find(item =>
        item.id === product.id &&
        item.size === product.size &&
        item.color === product.color
    );

    if (existingProduct) {

        existingProduct.quantity += product.quantity;

    } else {

        cart.push(product);

    }

    saveCart();

    renderCart();

    button.textContent = "ADICIONADO ✓";

    button.disabled = true;

    setTimeout(() => {

        button.textContent = "ADICIONAR À SACOLA";

        button.disabled = false;

    }, 1200);

});


/* ================= 5. CALCULAR TOTAL ================= */

function calculateSubtotal() {

    return cart.reduce((total, item) => {

        return total + (item.price * item.quantity);

    }, 0);

}


function calculateQuantity() {

    return cart.reduce((total, item) => {

        return total + item.quantity;

    }, 0);

}


/* ================= 6. ATUALIZAR CONTADORES ================= */

function updateCartCounters() {

    const count = calculateQuantity();

    document.querySelectorAll(".cart-count").forEach(element => {

        element.textContent = count;

    });

    document.querySelectorAll("[data-cart-count]").forEach(element => {

        element.textContent = count;

    });

}


/* ================= 7. MOSTRAR SACOLA ================= */

function renderCart() {

    updateCartCounters();

    const cartItems = document.querySelector("#cartItems");

    const subtotalElement = document.querySelector("#cartSubtotal");

    const totalElement = document.querySelector("#cartTotal");

    const emptyCart = document.querySelector("#emptyCart");

    const cartSummary = document.querySelector("#cartSummary");

    const subtotal = calculateSubtotal();

    if (subtotalElement) {

        subtotalElement.textContent = formatPrice(subtotal);

    }

    if (totalElement) {

        totalElement.textContent = formatPrice(subtotal);

    }

    if (!cartItems) return;

    if (cart.length === 0) {

        cartItems.innerHTML = "";

        if (emptyCart) emptyCart.style.display = "block";

        if (cartSummary) cartSummary.style.display = "none";

        return;

    }

    if (emptyCart) emptyCart.style.display = "none";

    if (cartSummary) cartSummary.style.display = "block";

    cartItems.innerHTML = cart.map((item, index) => `

        <article class="cart-item">

            <img
                src="${escapeHTML(item.image)}"
                alt="${escapeHTML(item.name)}"
                onerror="this.style.visibility='hidden'"
            >

            <div class="cart-item-info">

                <h4>${escapeHTML(item.name)}</h4>

                <p>Categoria: ${escapeHTML(item.category)}</p>

                <p>Tamanho: ${escapeHTML(item.size)}</p>

                <p>Cor: ${escapeHTML(item.color)}</p>

                <p>Quantidade: ${item.quantity}</p>

                <strong>${formatPrice(item.price * item.quantity)}</strong>

                <br>

                <button
                    class="remove-item"
                    data-remove-item="${index}"
                    type="button"
                >
                    Remover
                </button>

            </div>

        </article>

    `).join("");

}


// Evitar inserção de HTML nos dados apresentados.
function escapeHTML(value) {

    return String(value ?? "").replace(/[&<>"']/g, character => ({

        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"

    })[character]);

}


/* ================= 8. REMOVER PRODUTOS ================= */

document.addEventListener("click", function (event) {

    const button = event.target.closest("[data-remove-item]");

    if (!button) return;

    const index = Number(button.dataset.removeItem);

    if (!Number.isInteger(index) || index < 0 || index >= cart.length) {
        return;
    }

    cart.splice(index, 1);

    saveCart();

    renderCart();

});


/* ================= 9. ESVAZIAR SACOLA ================= */

document.addEventListener("click", function (event) {

    const button = event.target.closest(".clear-cart");

    if (!button) return;

    if (cart.length === 0) return;

    const confirmClear = confirm(
        "Tens a certeza que desejas esvaziar a sacola?"
    );

    if (!confirmClear) return;

    cart = [];

    saveCart();

    renderCart();

});


/* ================= 10. FINALIZAR PELO WHATSAPP ================= */

function checkoutWhatsApp() {

    if (cart.length === 0) {

        alert("A tua sacola está vazia.");

        return;

    }

    if (!/^258\d{9}$/.test(WHATSAPP_NUMBER)) {

        alert("O número de WhatsApp da loja ainda não foi configurado.");

        return;

    }

    const subtotal = calculateSubtotal();

    let message = "";

    message += "Olá FREESTYLE DREWP! 👋\n\n";

    message += "Gostaria de fazer a seguinte encomenda:\n\n";

    cart.forEach((item, index) => {

        message += `*PRODUTO ${index + 1}*\n`;

        message += `Nome: ${item.name}\n`;

        message += `Categoria: ${item.category}\n`;

        message += `Tamanho: ${item.size}\n`;

        message += `Cor: ${item.color}\n`;

        message += `Quantidade: ${item.quantity}\n`;

        message += `Preço unitário: ${formatPrice(item.price)}\n`;

        message += `Subtotal: ${formatPrice(item.price * item.quantity)}\n`;

        message += `Produto: ${item.url}\n\n`;

    });

    message += "--------------------------\n";

    message += `*TOTAL: ${formatPrice(subtotal)}*\n\n`;

    message += "Aguardo a confirmação da disponibilidade e entrega.\n\n";

    message += "Obrigado!";

    const whatsappURL =
        "https://wa.me/" +
        WHATSAPP_NUMBER +
        "?text=" +
        encodeURIComponent(message);

    // Abrir WhatsApp numa nova janela.
    window.open(whatsappURL, "_blank", "noopener,noreferrer");

    // Limpar a sacola depois de iniciar a finalização.
    cart = [];

    saveCart();

    renderCart();

}


// Associar botão de finalização.
document.addEventListener("click", function (event) {

    const button = event.target.closest(".checkout-button");

    if (!button) return;

    checkoutWhatsApp();

});


/* ================= 11. FILTROS DO CATÁLOGO ================= */

const filterButtons = document.querySelectorAll(".filter-button");

const catalogCategories = document.querySelectorAll(".catalog-category");

filterButtons.forEach(button => {

    button.addEventListener("click", function () {

        const filter = this.dataset.filter || "todos";

        filterButtons.forEach(item => {

            item.classList.remove("active");

        });

        this.classList.add("active");

        catalogCategories.forEach(category => {

            const categoryName = category.dataset.category;

            if (
                filter === "todos" ||
                filter === categoryName
            ) {

                category.style.display = "block";

            } else {

                category.style.display = "none";

            }

        });

    });

});


/* ================= 12. ABRIR PRODUTO PELO LINK ================= */

// Exemplo:
// catalogo.html?produto=camisa1#camisa1

function openProductFromUrl() {

    const params = new URLSearchParams(window.location.search);

    const productSlug = params.get("produto");

    if (!productSlug) return;

    const product = document.querySelector(
        `[data-slug="${CSS.escape(productSlug)}"]`
    );

    if (!product) return;

    const category = product.closest(".catalog-category");

    if (category) {

        category.style.display = "block";

    }

    const categoryName = category?.dataset.category;

    filterButtons.forEach(button => {

        button.classList.toggle(
            "active",
            button.dataset.filter === categoryName
        );

    });

    setTimeout(() => {

        product.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });

        product.style.outline = "2px solid #111";

        setTimeout(() => {

            product.style.outline = "none";

        }, 2500);

    }, 300);

}


/* ================= 13. INICIALIZAÇÃO ================= */

document.addEventListener("DOMContentLoaded", function () {

    renderCart();

    openProductFromUrl();

});
