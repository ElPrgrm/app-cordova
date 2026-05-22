const categories = [
    { key: 'todos', label: 'Todos' },
    { key: 'pastelitos', label: 'Pastelitos Dulces' },
    { key: 'galletas-saladas', label: 'Galletas Saladas' },
    { key: 'galletas-dulces', label: 'Galletas Dulces' },
    { key: 'botanas', label: 'Botanas' },
];

const products = [
    { id: 1, name: 'Twinky Fresa', price: 12.0, category: 'galletas-dulces', emoji: '🍓' },
    { id: 2, name: 'Papas Sabritas', price: 11.0, category: 'botanas', emoji: '🍟' },
    { id: 3, name: 'Cacahuates Japoneses', price: 8.0, category: 'botanas', emoji: '🥜' },
    { id: 4, name: 'Polvorones', price: 15.0, category: 'galletas-dulces', emoji: '🍪' },
    { id: 5, name: 'Gansito', price: 12.0, category: 'galletas-dulces', emoji: '🧁' },
    { id: 6, name: 'Chocoroles', price: 12.0, category: 'galletas-dulces', emoji: '🍫' },
    { id: 7, name: 'Monedero Teal', price: 18.0, category: 'pastelitos', emoji: '👜' },
    { id: 8, name: 'Sandalias Franjas AZ', price: 30.0, category: 'pastelitos', emoji: '👡' },
];

let selectedCategory = 'todos';
let searchTerm = '';
let cart = [
    { productId: 1, quantity: 2 },
    { productId: 4, quantity: 1 },
    { productId: 3, quantity: 2 },
];

const salesHistory = [{
        id: 101,
        date: '2026-05-14',
        total: 128.5,
        items: [
            { name: 'Twinky Fresa', qty: 2, price: 12.0 },
            { name: 'Gansito', qty: 3, price: 12.0 },
            { name: 'Papas Sabritas', qty: 1, price: 11.5 },
        ],
    },
    {
        id: 102,
        date: '2026-05-15',
        total: 84.0,
        items: [
            { name: 'Polvorones', qty: 2, price: 15.0 },
            { name: 'Chocoroles', qty: 2, price: 12.0 },
            { name: 'Cacahuates Japoneses', qty: 1, price: 8.0 },
        ],
    },
    {
        id: 103,
        date: '2026-05-17',
        total: 56.0,
        items: [
            { name: 'Monedero Teal', qty: 1, price: 18.0 },
            { name: 'Twinky Fresa', qty: 2, price: 12.0 },
            { name: 'Gansito', qty: 2, price: 12.0 },
        ],
    },
    {
        id: 104,
        date: '2026-05-19',
        total: 30.0,
        items: [
            { name: 'Sandalias Franjas AZ', qty: 1, price: 30.0 },
        ],
    },
    {
        id: 105,
        date: '2026-05-20',
        total: 42.0,
        items: [
            { name: 'Papas Sabritas', qty: 2, price: 11.0 },
            { name: 'Chocoroles', qty: 2, price: 12.0 },
        ],
    },
    {
        id: 106,
        date: '2026-05-21',
        total: 78.0,
        items: [
            { name: 'Polvorones', qty: 3, price: 15.0 },
            { name: 'Twinky Fresa', qty: 1, price: 12.0 },
            { name: 'Gansito', qty: 1, price: 12.0 },
        ],
    },
    {
        id: 107,
        date: '2026-05-22',
        total: 50.0,
        items: [
            { name: 'Monedero Teal', qty: 1, price: 18.0 },
            { name: 'Cacahuates Japoneses', qty: 2, price: 8.0 },
            { name: 'Chocoroles', qty: 1, price: 12.0 },
        ],
    },
];

const $categories = document.querySelector('.categories');
const $productGrid = document.querySelector('.product-grid');
const $itemList = document.querySelector('.item-list');
const $searchInput = document.querySelector('.search-box input');
const $subtotal = document.querySelector('.totals .line span:last-child');
const $discount = document.querySelector('.totals .line:nth-child(2) span:last-child');
const $payButton = document.querySelector('.btn-primary-action');
const $historyButton = document.getElementById('historyButton');
const $paymentPreview = document.getElementById('paymentPreview');
const $historyPreview = document.getElementById('historyPreview');
const $previewItems = document.querySelector('.preview-items');
const $previewSubtotal = document.getElementById('previewSubtotal');
const $previewDiscount = document.getElementById('previewDiscount');
const $previewTotal = document.getElementById('previewTotal');
const $previewClose = document.getElementById('previewClose');
const $previewCancel = document.getElementById('previewCancel');
const $previewConfirm = document.getElementById('previewConfirm');
const $historyItems = document.querySelector('.history-items');
const $historyCount = document.getElementById('historyCount');
const $historyTotal = document.getElementById('historyTotal');
const $historyClose = document.getElementById('historyClose');

function formatMoney(value) {
    return `$${value.toFixed(2)}`;
}

function getProductById(productId) {
    return products.find((item) => item.id === productId);
}

function renderCategories() {
    $categories.innerHTML = categories
        .map((category) => {
            const activeClass = category.key === selectedCategory ? 'active' : '';
            return `<span class="chip ${activeClass}" data-category="${category.key}">${category.label}</span>`;
        })
        .join('');

    $categories.querySelectorAll('.chip').forEach((chip) => {
        chip.addEventListener('click', () => {
            selectedCategory = chip.dataset.category;
            renderCategories();
            renderProducts();
        });
    });
}

function renderProducts() {
    const filteredProducts = products.filter((product) => {
        const matchesCategory = selectedCategory === 'todos' || product.category === selectedCategory;
        const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    $productGrid.innerHTML = filteredProducts
        .map(
            (product) => `
            <div class="product-card" data-product-id="${product.id}">
                <div class="product-icon">${product.emoji}</div>
                <div class="product-info">
                    <strong>${product.name}</strong>
                    <span>${formatMoney(product.price)}</span>
                </div>
            </div>
        `
        )
        .join('');

    $productGrid.querySelectorAll('.product-card').forEach((card) => {
        card.addEventListener('click', () => {
            const productId = Number(card.dataset.productId);
            addToCart(productId);
        });
    });
}

function getCartDetails() {
    return cart.map((entry) => {
        const product = getProductById(entry.productId);
        return {
            ...entry,
            product,
            total: product.price * entry.quantity,
        };
    });
}

function removeFromCart(productId) {
    cart = cart.filter((item) => item.productId !== productId);
    renderCart();
    updateTotals();
}

function renderCart() {
    const details = getCartDetails();

    if (details.length === 0) {
        $itemList.innerHTML = '<p class="text-muted text-center mt-4">Carrito vacío</p>';
        return;
    }

    $itemList.innerHTML = details
        .map(
            (entry) => `
            <article class="item-card" data-product-id="${entry.product.id}">
                <div class="d-flex justify-content-between align-items-start gap-3">
                    <div>
                        <div class="text-uppercase text-slate-500" style="font-size:0.75rem; letter-spacing:0.12em;">${entry.quantity} pz</div>
                        <strong>${entry.product.name}</strong>
                        <div class="item-meta">
                            <span>Desc 10% @ $0.00</span>
                            <span>1.0 pz @ ${formatMoney(entry.product.price)}</span>
                        </div>
                    </div>
                    <div class="text-right" style="font-weight:700; color:#111827;">${formatMoney(entry.total)}</div>
                </div>
            </article>
        `
        )
        .join('');

    $itemList.querySelectorAll('.item-card').forEach((card) => {
        card.addEventListener('dblclick', () => {
            const productId = Number(card.dataset.productId);
            removeFromCart(productId);
        });
    });
}

function renderPreview() {
    const details = getCartDetails();
    if (details.length === 0) {
        $previewItems.innerHTML = '<p class="text-center text-muted mb-0">No hay productos en el ticket.</p>';
    } else {
        $previewItems.innerHTML = details
            .map(
                (entry) => `
            <div class="preview-item">
                <div>
                    <strong>${entry.product.name}</strong>
                    <div class="text-muted" style="font-size:0.82rem;">${entry.quantity} pz · ${formatMoney(entry.product.price)} c/u</div>
                </div>
                <strong>${formatMoney(entry.total)}</strong>
            </div>
        `
            )
            .join('');
    }

    const subtotalValue = details.reduce((sum, item) => sum + item.total, 0);
    const discountValue = subtotalValue * 0.05;
    const totalValue = subtotalValue - discountValue;

    $previewSubtotal.textContent = formatMoney(subtotalValue);
    $previewDiscount.textContent = formatMoney(discountValue);
    $previewTotal.textContent = formatMoney(totalValue);
}

function renderHistory() {
    $historyItems.innerHTML = salesHistory
        .map(
            (sale) => `
            <div class="preview-item">
                <div>
                    <strong>Venta #${sale.id}</strong>
                    <div class="text-muted" style="font-size:0.82rem;">${sale.date} · ${sale.items.length} productos</div>
                </div>
                <strong>${formatMoney(sale.total)}</strong>
            </div>
        `
        )
        .join('');

    const totalSales = salesHistory.length;
    const totalAmount = salesHistory.reduce((sum, sale) => sum + sale.total, 0);

    $historyCount.textContent = totalSales;
    $historyTotal.textContent = formatMoney(totalAmount);
}

function openPreview() {
    renderPreview();
    $paymentPreview.classList.remove('d-none');
}

function closePreview() {
    $paymentPreview.classList.add('d-none');
}

function openHistory() {
    renderHistory();
    $historyPreview.classList.remove('d-none');
}

function closeHistory() {
    $historyPreview.classList.add('d-none');
}

function confirmPayment() {
    cart = [];
    renderCart();
    updateTotals();
    closePreview();
    alert('Pago confirmado.');
}

function updateTotals() {
    const details = getCartDetails();
    const subtotalValue = details.reduce((sum, item) => sum + item.total, 0);
    const discountValue = subtotalValue * 0.05;
    const totalValue = subtotalValue - discountValue;

    $subtotal.textContent = formatMoney(subtotalValue);
    $discount.textContent = formatMoney(discountValue);
    $payButton.textContent = `Pagar ${formatMoney(totalValue)}`;
}

function addToCart(productId) {
    const existing = cart.find((item) => item.productId === productId);
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({ productId, quantity: 1 });
    }
    renderCart();
    updateTotals();
}

function initialize() {
    renderCategories();
    renderProducts();
    renderCart();
    updateTotals();

    $searchInput.addEventListener('input', (event) => {
        searchTerm = event.target.value;
        renderProducts();
    });

    $payButton.addEventListener('click', () => {
        openPreview();
    });

    $previewClose.addEventListener('click', closePreview);
    $previewCancel.addEventListener('click', closePreview);
    $previewConfirm.addEventListener('click', confirmPayment);
    $historyButton.addEventListener('click', openHistory);
    $historyClose.addEventListener('click', closeHistory);
}

initialize();