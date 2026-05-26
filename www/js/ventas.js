// CONFIGURACIÓN
const API_BASE_URL = 'http://localhost/DDI/API/productos.php';
const API_VENTAS_URL = 'http://localhost/DDI/API/ventas.php';

// DATOS
const categories = [
    { key: 'todos', label: 'Todos', icon: 'fa-grid' },
];

let products = [];
let selectedCategory = 'todos';
let searchTerm = '';
let cart = [];
let salesHistory = [];
let nextTicketNumber = 1;

// Helpers
const formatMoney = (val) => `$${val.toFixed(2)}`;
const getProductById = (id) => products.find(p => p.id === id);

// Cargar productos desde la API
function parseJsonResponse(response) {
    return response.text().then(text => {
        try {
            return JSON.parse(text);
        } catch (error) {
            const preview = text.trim().slice(0, 300).replace(/\s+/g, ' ');
            throw new Error(`Respuesta no JSON de la API: ${preview}`);
        }
    });
}

async function loadProductsFromAPI() {
    try {
        const response = await fetch(API_BASE_URL);
        if (!response.ok) {
            throw new Error(`Error HTTP ${response.status}`);
        }
        const result = await parseJsonResponse(response);
        if (result.success && Array.isArray(result.data)) {
            products = result.data.map(p => ({
                id: p.id,
                name: p.nombre,
                price: parseFloat(p.precio),
                description: p.descripcion,
                cantidad: p.cantidad,
                codigo: p.codigo,
                category: 'todos'
            }));
            return true;
        } else {
            throw new Error('Respuesta inválida de la API');
        }
    } catch (error) {
        console.error('Error cargando productos:', error);
        showNotification(`Error al cargar productos: ${error.message}`, 'error');
        return false;
    }
}

function getCartDetails() {
    return cart.map(item => {
        const prod = getProductById(item.productId);
        return {...item, product: prod, total: prod.price * item.quantity };
    });
}

function computeTotals() {
    const details = getCartDetails();
    const subtotal = details.reduce((acc, i) => acc + i.total, 0);
    const total = subtotal;
    return { subtotal, total };
}

function updateUI() {
    const details = getCartDetails();
    const { subtotal, total } = computeTotals();

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
                <i class="fas fa-box" style="font-size: 2.2rem; color: #10b981;"></i>
            </div>
            <div class="product-info">
                <strong>${p.name}</strong>
                <span>${formatMoney(p.price)}</span>
                <div class="small text-muted" style="font-size: 0.7rem; margin-top: 0.25rem;">${p.codigo}</div>
            </div>
        </div>
    `).join('');

    document.querySelectorAll('.product-card').forEach(card => {
        card.addEventListener('click', () => addToCart(Number(card.dataset.pid)));
    });
}

function renderPreviewModal() {
    const details = getCartDetails();
    const { subtotal, total } = computeTotals();
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

async function confirmPayment() {
    if (cart.length === 0) return;

    const details = getCartDetails();
    const items = details.map(d => ({
        producto_id: d.product.id,
        cantidad: d.quantity,
        precio_unitario: d.product.price,
        subtotal: d.total
    }));

    try {
        const response = await fetch(API_VENTAS_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items })
        });

        if (!response.ok) {
            throw new Error(`Error HTTP ${response.status}`);
        }

        const result = await parseJsonResponse(response);
        if (result.success) {
            const { subtotal, total } = computeTotals();
            salesHistory.unshift({
                id: result.venta_id,
                date: new Date().toLocaleDateString('es-ES'),
                items: details,
                total: total
            });

            nextTicketNumber = result.venta_id + 1;
            updateTicketDisplay();
            cart = [];
            updateUI();
            closePaymentPreview();
            showNotification(`Pago completado. Ticket #${String(result.venta_id).padStart(9, '0')}`, 'success');
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('Error guardando venta:', error);
        showNotification(`Error al guardar la venta: ${error.message}`, 'error');
    }
}

function renderHistoryModal() {
    const listDiv = document.getElementById('historyList');
    if (salesHistory.length === 0) {
        listDiv.innerHTML = '<div class="text-muted text-center py-4"><i class="fas fa-inbox fa-2x mb-2 d-block"></i>Sin ventas registradas</div>';
    } else {
        listDiv.innerHTML = salesHistory.map(sale => `
            <div class="preview-item">
                <div>
                    <strong><i class="fas fa-receipt"></i> Venta #${sale.id}</strong>
                    <div class="small text-muted"><i class="far fa-calendar-alt"></i> ${sale.date} · ${sale.items.length} articulos</div>
                </div>
                <strong class="text-success">${formatMoney(sale.total)}</strong>
            </div>
        `).join('');
    }

    const totalSales = salesHistory.length;
    const totalAmount = salesHistory.reduce((acc, s) => acc + s.total, 0);
    document.getElementById('historyCountSpan').innerHTML = totalSales;
    document.getElementById('historyTotalSpan').innerHTML = formatMoney(totalAmount);
}

async function loadSalesHistory() {
    try {
        const response = await fetch(API_VENTAS_URL);
        if (!response.ok) {
            throw new Error(`Error HTTP ${response.status}`);
        }
        const result = await parseJsonResponse(response);
        if (result.success && Array.isArray(result.data)) {
            salesHistory = result.data.map(v => ({
                id: v.id,
                date: new Date(v.fecha).toLocaleDateString('es-ES'),
                items: v.detalles,
                total: v.total
            }));

            // Calcular el siguiente número de ticket
            const maxId = salesHistory.length > 0 ? Math.max(...salesHistory.map(s => s.id)) : 0;
            nextTicketNumber = maxId + 1;
            updateTicketDisplay();
        } else {
            console.warn('Respuesta invalida del historial de ventas');
        }
    } catch (error) {
        console.error('Error cargando historial de ventas:', error);
    }
}

function updateTicketDisplay() {
    const ticketSpan = document.getElementById('currentTicketNumber');
    if (ticketSpan) {
        ticketSpan.innerText = `Ticket #${String(nextTicketNumber).padStart(9, '0')}`;
    }
}

function openHistory() {
    renderHistoryModal();
    document.getElementById('historyPreview').classList.remove('d-none');
}

function closeHistory() {
    document.getElementById('historyPreview').classList.add('d-none');
}

// Inicialización
function ensureHttpServerMode() {
    if (isHttpProtocol) return true;

    const grid = document.getElementById('productGrid');
    if (grid) {
        grid.innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-exclamation-triangle fa-3x mb-3 d-block text-danger"></i>
                <p>Esta página debe abrirse desde un servidor HTTP/PHP.</p>
                <p>Usa <strong>http://localhost:8000/ventas.html</strong> en lugar de abrir el archivo directamente.</p>
            </div>
        `;
    }

    showNotification('Abre esta página desde un servidor HTTP/PHP. Usa http://localhost:8000/ventas.html', 'error');
    return false;
}

async function init() {
    if (!ensureHttpServerMode()) {
        return;
    }

    // Mostrar indicador de carga
    const grid = document.getElementById('productGrid');
    grid.innerHTML = '<div class="text-center py-5"><i class="fas fa-spinner fa-spin fa-3x mb-3 d-block text-muted"></i><p>Cargando productos...</p></div>';

    // Cargar productos y historial de ventas desde la API
    const [loaded] = await Promise.all([
        loadProductsFromAPI(),
        loadSalesHistory()
    ]);

    if (!loaded || products.length === 0) {
        grid.innerHTML = '<div class="text-center py-5"><i class="fas fa-exclamation-triangle fa-3x mb-3 d-block text-danger"></i><p>No hay productos disponibles</p></div>';
        return;
    }

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