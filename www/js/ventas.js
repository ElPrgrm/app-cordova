document.addEventListener('DOMContentLoaded', function() {
    // Referencias actualizadas para coincidir con ventas.html
    const productGrid = document.getElementById('productGrid');
    const searchInput = document.getElementById('searchInput');
    const ticketBody = document.getElementById('itemList');
    const totalVenta = document.getElementById('cartSubtotal');

    // Endpoint de la API de productos 
    const API_URL = 'http://localhost/DDI/API/productos.php';

    let productosOriginales = [];
    let carrito = [];

    function formatearPrecio(valor) {
        return `$${Number(valor).toFixed(2)}`;
    }

    function renderizarProductos(productos) {
        if (!productGrid) return;

        productGrid.innerHTML = '';

        if (productos.length === 0) {
            productGrid.innerHTML = '<div class="col-12 text-center p-5 text-muted">No se encontraron productos.</div>';
            return;
        }

        productos.forEach(producto => {
            const card = document.createElement('div');
            card.className = 'product-card card shadow-sm h-100';
            card.innerHTML = `
                <div class="card-body d-flex flex-column justify-content-between p-3">
                    <div>
                        <h6 class="fw-bold mb-1">${producto.nombre || '-'}</h6>
                        <p class="small text-muted mb-2">${producto.descripcion || ''}</p>
                    </div>
                    <div class="d-flex justify-content-between align-items-center mt-auto">
                        <span class="fs-5 fw-bold text-primary">${formatearPrecio(producto.precio || 0)}</span>
                        <button class="btn btn-sm btn-primary rounded-circle" 
                                onclick="agregarAlCarrito(${JSON.stringify(producto).replace(/"/g, '&quot;')})">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                </div>
            `;
            productGrid.appendChild(card);
        });
    }

    function actualizarTicket() {
        if (!ticketBody || !totalVenta) return;

        ticketBody.innerHTML = '';
        let total = 0;

        if (carrito.length === 0) {
            ticketBody.innerHTML = '<div class="text-center text-muted p-4">El ticket está vacío</div>';
            totalVenta.textContent = formatearPrecio(0);
            // También actualiza el total mobile
            const mobileTotalSpan = document.getElementById('mobileTotalSpan');
            if (mobileTotalSpan) mobileTotalSpan.textContent = formatearPrecio(0);
            const payButton = document.getElementById('payButtonMobileStyle');
            if (payButton) payButton.innerHTML = `<i class="fas fa-credit-card me-2"></i> Pagar ${formatearPrecio(0)}`;
            return;
        }

        carrito.forEach((item, index) => {
            const subtotal = Number(item.precio) * item.cantidad_carrito;
            total += subtotal;

            const itemTicket = document.createElement('div');
            itemTicket.className = 'd-flex justify-content-between align-items-center mb-3 border-bottom pb-2';
            itemTicket.innerHTML = `
                <div style="flex-grow: 1;">
                    <div class="fw-bold text-truncate" style="max-width: 150px;">${item.nombre}</div>
                    <small class="text-muted">${item.cantidad_carrito} x ${formatearPrecio(item.precio)}</small>
                </div>
                <div class="text-end me-3">
                    <span class="fw-bold">${formatearPrecio(subtotal)}</span>
                </div>
                <button class="btn btn-sm text-danger border-0 p-1" onclick="eliminarDelCarrito(${index})">
                    <i class="fas fa-trash-alt"></i>
                </button>
            `;
            ticketBody.appendChild(itemTicket);
        });

        // Actualizar todos los lugares donde se muestra el total
        totalVenta.textContent = formatearPrecio(total);

        // Actualizar badge mobile
        const mobileTotalSpan = document.getElementById('mobileTotalSpan');
        if (mobileTotalSpan) mobileTotalSpan.textContent = formatearPrecio(total);

        // Actualizar botón de pago
        const payButton = document.getElementById('payButtonMobileStyle');
        if (payButton) payButton.innerHTML = `<i class="fas fa-credit-card me-2"></i> Pagar ${formatearPrecio(total)}`;
    }

    function cargarProductos() {
        if (productGrid) {
            productGrid.innerHTML = '<div class="col-12 text-center p-5">Cargando catálogo...</div>';
        }

        fetch(API_URL)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Error HTTP ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                if (data.success && Array.isArray(data.data)) {
                    productosOriginales = data.data;
                    renderizarProductos(productosOriginales);
                } else {
                    throw new Error('Formato de respuesta inválido');
                }
            })
            .catch(error => {
                console.error('Error cargando catálogo para ventas:', error);
                if (productGrid) {
                    productGrid.innerHTML = `<div class="col-12 alert alert-danger">Error: ${error.message}</div>`;
                }
            });
    }

    // Filtro de búsqueda 
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            const filtrados = productosOriginales.filter(p =>
                (p.nombre && p.nombre.toLowerCase().includes(term)) ||
                (p.codigo && p.codigo.toLowerCase().includes(term))
            );
            renderizarProductos(filtrados);
        });
    }

    // Exponer función global para el botón de la tabla
    window.agregarAlCarrito = function(producto) {
        // Buscar si el producto ya está en el ticket
        const itemEnCarrito = carrito.find(p => p.id === producto.id);

        if (itemEnCarrito) {
            itemEnCarrito.cantidad_carrito += 1;
        } else {
            // Agregamos el producto con una nueva propiedad de cantidad para el ticket
            carrito.push({
                ...producto,
                cantidad_carrito: 1
            });
        }

        actualizarTicket();
    };

    // Función para quitar productos del ticket
    window.eliminarDelCarrito = function(index) {
        carrito.splice(index, 1);
        actualizarTicket();
    };

    // === FUNCIONALIDAD DE PAGO Y MODAL ===

    // Referencias a elementos del modal de pago
    const payButton = document.getElementById('payButtonMobileStyle');
    const paymentModal = document.getElementById('paymentPreview');
    const previewItemsList = document.getElementById('previewItemsList');
    const previewSubtotal = document.getElementById('previewSubtotal');
    const previewTotalAmount = document.getElementById('previewTotalAmount');
    const previewCloseBtn = document.getElementById('previewCloseBtn');
    const previewCancelBtn = document.getElementById('previewCancelBtn');
    const previewConfirmBtn = document.getElementById('previewConfirmBtn');

    // Función para mostrar el modal de pago
    function mostrarModalPago() {
        if (!paymentModal || carrito.length === 0) return;

        // Limpiar y llenar el preview de items
        previewItemsList.innerHTML = '';
        let subtotal = 0;

        carrito.forEach(item => {
            const subtotalItem = Number(item.precio) * item.cantidad_carrito;
            subtotal += subtotalItem;

            const itemElement = document.createElement('div');
            itemElement.className = 'd-flex justify-content-between mb-2 pb-2 border-bottom';
            itemElement.innerHTML = `
                <div>
                    <strong>${item.nombre}</strong>
                    <small class="d-block text-muted">${item.cantidad_carrito} x ${formatearPrecio(item.precio)}</small>
                </div>
                <span class="fw-bold">${formatearPrecio(subtotalItem)}</span>
            `;
            previewItemsList.appendChild(itemElement);
        });

        // Actualizar totales en el modal
        previewSubtotal.textContent = formatearPrecio(subtotal);
        previewTotalAmount.textContent = formatearPrecio(subtotal);

        // Mostrar modal
        paymentModal.classList.remove('d-none');
    }

    // Función para cerrar el modal
    function cerrarModalPago() {
        if (paymentModal) {
            paymentModal.classList.add('d-none');
        }
    }

    // Función para procesar el pago (confirmar compra)
    async function procesarPago() {
        if (carrito.length === 0) {
            alert('No hay productos en el carrito');
            return;
        }

        // Calcular total
        const total = carrito.reduce((sum, item) => sum + (Number(item.precio) * item.cantidad_carrito), 0);

        // Preparar datos para la venta
        const ventaData = {
            fecha: new Date().toISOString(),
            total: total,
            items: carrito.map(item => ({
                id_producto: item.id,
                nombre: item.nombre,
                cantidad: item.cantidad_carrito,
                precio_unitario: item.precio,
                subtotal: Number(item.precio) * item.cantidad_carrito
            }))
        };

        try {
            // Aquí envías los datos a tu API de ventas
            // const response = await fetch('http://localhost/DDI/API/ventas.php', {
            //     method: 'POST',
            //     headers: {
            //         'Content-Type': 'application/json',
            //     },
            //     body: JSON.stringify(ventaData)
            // });

            // Simulación de guardado (comenta esta parte cuando tengas la API real)
            console.log('Venta procesada:', ventaData);

            // Mostrar alerta de éxito
            alert(`¡Venta completada con éxito!\nTotal: ${formatearPrecio(total)}`);

            // Vaciar carrito
            carrito = [];
            actualizarTicket();

            // Cerrar modal
            cerrarModalPago();

        } catch (error) {
            console.error('Error al procesar el pago:', error);
            alert('Error al procesar el pago. Intenta nuevamente.');
        }
    }

    // Event listeners para el modal de pago
    if (payButton) {
        payButton.addEventListener('click', () => {
            if (carrito.length > 0) {
                mostrarModalPago();
            } else {
                alert('El carrito está vacío. Agrega productos primero.');
            }
        });
    }

    if (previewCloseBtn) {
        previewCloseBtn.addEventListener('click', cerrarModalPago);
    }

    if (previewCancelBtn) {
        previewCancelBtn.addEventListener('click', cerrarModalPago);
    }

    if (previewConfirmBtn) {
        previewConfirmBtn.addEventListener('click', procesarPago);
    }

    // Cerrar modal haciendo clic fuera
    if (paymentModal) {
        paymentModal.addEventListener('click', (e) => {
            if (e.target === paymentModal) {
                cerrarModalPago();
            }
        });
    }

    // Tecla ESC para cerrar modal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && paymentModal && !paymentModal.classList.contains('d-none')) {
            cerrarModalPago();
        }
    });

    // Cargar productos al iniciar
    cargarProductos();
});