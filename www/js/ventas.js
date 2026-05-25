// DATOS
const categories = [
    { key: 'todos', label: 'Todos', icon: 'fa-grid' },
    { key: 'pastelitos', label: 'Pastelitos Dulces', icon: 'fa-cake' },
    { key: 'galletas-saladas', label: 'Galletas Saladas', icon: 'fa-cookie-bite' },
    { key: 'galletas-dulces', label: 'Galletas Dulces', icon: 'fa-candy-cane' },
    { key: 'botanas', label: 'Botanas', icon: 'fa-bowl-food' },
];

const products = [
    { id: 1, name: 'Twinky Fresa', price: 12.0, category: 'galletas-dulces', emoji: '🍓', image: 'https://via.placeholder.com/80/FF6B6B/white?text=🍓' },
    { id: 2, name: 'Papas Sabritas', price: 11.0, category: 'botanas', emoji: '🍟', image: 'https://via.placeholder.com/80/FFD93D/white?text=🍟' },
    { id: 3, name: 'Cacahuates Japoneses', price: 8.0, category: 'botanas', emoji: '🥜', image: 'https://via.placeholder.com/80/FFB347/white?text=🥜' },
    { id: 4, name: 'Polvorones', price: 15.0, category: 'galletas-dulces', emoji: '🍪', image: 'https://via.placeholder.com/80/D4A5A5/white?text=🍪' },
    { id: 5, name: 'Gansito', price: 12.0, category: 'galletas-dulces', emoji: '🧁', image: 'https://via.placeholder.com/80/C9E4C5/white?text=🧁' },
    { id: 6, name: 'Chocoroles', price: 12.0, category: 'galletas-dulces', emoji: '🍫', image: 'https://via.placeholder.com/80/8B5A2B/white?text=🍫' },
    { id: 7, name: 'Monedero Teal', price: 18.0, category: 'pastelitos', emoji: '👜', image: 'https://via.placeholder.com/80/FFB6C1/white?text=👜' },
    { id: 8, name: 'Sandalias Franjas', price: 30.0, category: 'pastelitos', emoji: '👡', image: 'https://via.placeholder.com/80/87CEEB/white?text=👡' },
];

let selectedCategory = 'todos';
let searchTerm = '';
let cart = [
    { productId: 1, quantity: 2 },
    { productId: 4, quantity: 1 },
    { productId: 3, quantity: 2 },
];

const salesHistory = [
    { id: 101, date: '2026-05-14', total: 128.5, items: [{ name: 'Twinky Fresa', qty: 2, price: 12.0 }, { name: 'Gansito', qty: 3, price: 12.0 }, { name: 'Papas Sabritas', qty: 1, price: 11.5 }] },
    { id: 102, date: '2026-05-15', total: 84.0, items: [{ name: 'Polvorones', qty: 2, price: 15.0 }, { name: 'Chocoroles', qty: 2, price: 12.0 }, { name: 'Cacahuates Japoneses', qty: 1, price: 8.0 }] },
    { id: 103, date: '2026-05-17', total: 56.0, items: [{ name: 'Monedero Teal', qty: 1, price: 18.0 }, { name: 'Twinky Fresa', qty: 2, price: 12.0 }] },
    { id: 104, date: '2026-05-19', total: 30.0, items: [{ name: 'Sandalias Franjas', qty: 1, price: 30.0 }] },
    { id: 105, date: '2026-05-20', total: 42.0, items: [{ name: 'Papas Sabritas', qty: 2, price: 11.0 }, { name: 'Chocoroles', qty: 2, price: 12.0 }] },
    { id: 106, date: '2026-05-21', total: 78.0, items: [{ name: 'Polvorones', qty: 3, price: 15.0 }, { name: 'Twinky Fresa', qty: 1, price: 12.0 }] },
    { id: 107, date: '2026-05-22', total: 50.0, items: [{ name: 'Monedero Teal', qty: 1, price: 18.0 }, { name: 'Cacahuates Japoneses', qty: 2, price: 8.0 }] }
];

// Helpers
const formatMoney = (val) => `$${val.toFixed(2)}`;
const getProductById = (id) => products.find(p => p.id === id);

function getCartDetails() {
    return cart.map(item => {
        const prod = getProductById(item.productId);
        return {...item, product: prod, total: prod.price * item.quantity };
    });
}

function computeTotals() {
    const details = getCartDetails();
    const subtotal = details.reduce((acc, i) => acc + i.total, 0);
    const discount = subtotal * 0.05;
    const total = subtotal - discount;
    return { subtotal, discount, total };
}

function updateUI() {
    const details = getCartDetails();
    const { subtotal, discount, total } = computeTotals();

    const container = document.getElementById('itemList');
    if (!details.length) {
        container.innerHTML = '<div class="text-muted text-center py-4"><i class="fas fa-shopping-cart fa-2x mb-2 d-block"></i>Carrito vacío</div>';
    } else {
        container.innerHTML = details.map(entry => `
            <article class="item-card" data-pid="${entry.product.id}">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <strong><i class="fas fa-box"></i> ${entry.product.name}</strong>
                        <div class="item-meta">
                            <span><i class="fas fa-times-circle"></i> ${entry.quantity} pz</span>
                            <span><i class="fas fa-tag"></i> ${formatMoney(entry.product.price)} c/u</span>
                        </div>
                    </div>
                    <div class="fw-bold text-success">${formatMoney(entry.total)}</div>
                </div>
            </article>
        `).join('');

        document.querySelectorAll('.item-card').forEach(card => {
            card.addEventListener('dblclick', () => {
                const pid = Number(card.dataset.pid);
                cart = cart.filter(i => i.productId !== pid);
                updateUI();
                showNotification('Producto eliminado', 'error');
            });
        });
    }

    document.getElementById('cartSubtotal').innerHTML = formatMoney(subtotal);
    document.getElementById('cartDiscount').innerHTML = formatMoney(discount);
    const payBtn = document.querySelector('.btn-primary-action');
    if (payBtn) payBtn.innerHTML = `<i class="fas fa-credit-card me-2"></i>Pagar ${formatMoney(total)}`;
    const mobileBadge = document.getElementById('mobileTotalSpan');
    if (mobileBadge) mobileBadge.innerText = formatMoney(total);
}

function addToCart(productId) {
    const exist = cart.find(i => i.productId === productId);
    if (exist) exist.quantity += 1;
    else cart.push({ productId, quantity: 1 });
    updateUI();
    showNotification('Producto agregado al carrito', 'success');
}

function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : 'times-circle'}"></i> ${message}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#10b981' : '#ef4444'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 0.5rem;
        z-index: 10000;
        animation: slideInRight 0.3s ease;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}

function renderCategories() {
    const catsDiv = document.getElementById('categoriesContainer');
    catsDiv.innerHTML = categories.map(cat => `
        <span class="chip ${selectedCategory === cat.key ? 'active' : ''}" data-cat="${cat.key}">
            <i class="fas ${cat.icon}"></i> ${cat.label}
        </span>
    `).join('');

    document.querySelectorAll('.chip').forEach(chip => {
        chip.addEventListener('click', () => {
            selectedCategory = chip.dataset.cat;
            renderCategories();
            renderProducts();
        });
    });
}

function renderProducts() {
    const filtered = products.filter(p => {
        const matchCat = selectedCategory === 'todos' || p.category === selectedCategory;
        const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
        return matchCat && matchSearch;
    });

    const grid = document.getElementById('productGrid');
    if (filtered.length === 0) {
        grid.innerHTML = '<div class="text-center py-5"><i class="fas fa-search fa-3x mb-3 d-block text-muted"></i><p>No se encontraron productos</p></div>';
        return;
    }

    grid.innerHTML = filtered.map(p => `
        <div class="product-card" data-pid="${p.id}">
            <div class="product-icon">
                <img src="${p.image}" alt="${p.name}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 1.5rem;">
            </div>
            <div class="product-info">
                <strong>${p.name}</strong>
                <span>${formatMoney(p.price)}</span>
            </div>
        </div>
    `).join('');

    document.querySelectorAll('.product-card').forEach(card => {
        card.addEventListener('click', () => addToCart(Number(card.dataset.pid)));
    });
}

function renderPreviewModal() {
    const details = getCartDetails();
    const { subtotal, discount, total } = computeTotals();
    const itemsDiv = document.getElementById('previewItemsList');

    if (!details.length) {
        itemsDiv.innerHTML = '<div class="text-muted text-center py-4"><i class="fas fa-shopping-cart fa-2x mb-2 d-block"></i>Sin productos</div>';
    } else {
        itemsDiv.innerHTML = details.map(d => `
            <div class="preview-item">
                <div>
                    <strong><i class="fas fa-box"></i> ${d.product.name}</strong>
                    <div class="small text-muted">${d.quantity} × ${formatMoney(d.product.price)}</div>
                </div>
                <strong class="text-success">${formatMoney(d.total)}</strong>
            </div>
        `).join('');
    }

    document.getElementById('previewSubtotal').innerHTML = formatMoney(subtotal);
    document.getElementById('previewDiscount').innerHTML = formatMoney(discount);
    document.getElementById('previewTotalAmount').innerHTML = formatMoney(total);
}

function openPaymentPreview() {
    if (cart.length === 0) {
        showNotification('Agrega productos al carrito primero', 'error');
        return;
    }
    renderPreviewModal();
    document.getElementById('paymentPreview').classList.remove('d-none');
}

function closePaymentPreview() {
    document.getElementById('paymentPreview').classList.add('d-none');
}

function confirmPayment() {
    if (cart.length === 0) return;
    cart = [];
    updateUI();
    closePaymentPreview();
    showNotification('✅ Pago completado. ¡Ticket cerrado!', 'success');
}

function renderHistoryModal() {
    const listDiv = document.getElementById('historyList');
    listDiv.innerHTML = salesHistory.map(sale => `
        <div class="preview-item">
            <div>
                <strong><i class="fas fa-receipt"></i> Venta #${sale.id}</strong>
                <div class="small text-muted"><i class="far fa-calendar-alt"></i> ${sale.date} · ${sale.items.length} artículos</div>
            </div>
            <strong class="text-success">${formatMoney(sale.total)}</strong>
        </div>
    `).join('');

    const totalSales = salesHistory.length;
    const totalAmount = salesHistory.reduce((acc, s) => acc + s.total, 0);
    document.getElementById('historyCountSpan').innerHTML = totalSales;
    document.getElementById('historyTotalSpan').innerHTML = formatMoney(totalAmount);
}

function openHistory() {
    renderHistoryModal();
    document.getElementById('historyPreview').classList.remove('d-none');
}

function closeHistory() {
    document.getElementById('historyPreview').classList.add('d-none');
}

// Inicialización
function init() {
    renderCategories();
    renderProducts();
    updateUI();

    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', (e) => {
        searchTerm = e.target.value;
        renderProducts();
    });

    document.querySelector('.btn-primary-action').addEventListener('click', openPaymentPreview);
    document.getElementById('previewCloseBtn').addEventListener('click', closePaymentPreview);
    document.getElementById('previewCancelBtn').addEventListener('click', closePaymentPreview);
    document.getElementById('previewConfirmBtn').addEventListener('click', confirmPayment);

    const historyBtn = document.createElement('button');
    historyBtn.innerHTML = '<i class="fas fa-history me-1"></i> Historial';
    historyBtn.className = 'btn btn-outline-secondary btn-sm rounded-pill ms-2';
    historyBtn.style.cssText = 'font-size: 0.7rem; transition: all 0.3s ease;';
    historyBtn.addEventListener('mouseenter', () => historyBtn.style.transform = 'translateY(-2px)');
    historyBtn.addEventListener('mouseleave', () => historyBtn.style.transform = 'translateY(0)');
    document.querySelector('.brand').appendChild(historyBtn);
    historyBtn.addEventListener('click', openHistory);
    document.getElementById('historyCloseBtn').addEventListener('click', closeHistory);

    // Animación de entrada
    document.querySelectorAll('.product-card').forEach((card, index) => {
        card.style.animationDelay = `${index * 0.05}s`;
    });
}

// Agregar estilos de animación adicionales
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            opacity: 0;
            transform: translateX(100px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
`;
document.head.appendChild(style);

// Iniciar aplicación
init();