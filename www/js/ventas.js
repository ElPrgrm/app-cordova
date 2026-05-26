document.addEventListener('DOMContentLoaded', function() {
    // Referencias actualizadas para coincidir con ventas.html
    const productGrid = document.getElementById('productGrid');
    const searchInput = document.getElementById('searchInput');

    // Endpoint de la API de productos (usando la misma que inventario.js)
    const API_URL = 'http://localhost/DDI/API/productos.php';

    let productosOriginales = [];

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

    // Filtro de búsqueda (Opcional, pero muy útil en ventas)
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
        console.log('Producto seleccionado:', producto);
        // Aquí iría tu lógica para sumar el producto al ticket de venta
    };

    cargarProductos();
});