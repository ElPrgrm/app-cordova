document.addEventListener('DOMContentLoaded', function () {
    const tableBody = document.getElementById('inventory-body');
    const totalCount = document.getElementById('total-count');
    const updatedAt = document.getElementById('updated-at');
    const inventorySearchInput = document.getElementById('inventorySearchInput');

    let productosOriginales = [];
    // Evitar enviar múltiples notificaciones por el mismo producto en la misma sesión
    const lowNotifiedIds = new Set();

    if (!tableBody || !totalCount) {
        return;
    }

    // Endpoint relativo a la API
    const API_URL = 'https://elrjtd.online/DDI/API/productos.php';

    function formatearPrecio(valor) {
        return `$${Number(valor).toFixed(2)}`;
    }

    function actualizarFecha() {
        if (!updatedAt) return;
        const ahora = new Date();
        updatedAt.textContent = ahora.toLocaleDateString('es-MX', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
    }

    function renderizarTabla(productos) {
        totalCount.textContent = productos.length;
        tableBody.innerHTML = '';

        if (productos.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6">No hay productos disponibles.</td></tr>';
            return;
        }

        const fragment = document.createDocumentFragment();
        productos.forEach(producto => {
            const tr = document.createElement('tr');
            tr.dataset.id = producto.id;
            tr.innerHTML = `
                <td>${producto.id || '-'}</td>
                <td>${producto.nombre || '-'}</td>
                <td>${producto.descripcion || '-'}</td>
                <td>${producto.cantidad || 0}</td>
                <td>${formatearPrecio(producto.precio || 0)}</td>
                <td>
                    <a href="form.html?id=${producto.id}&modeEdit=${producto.id}" class="action-btn edit-btn">Editar</a>
                    <br>
                </td>
            `;
            fragment.appendChild(tr);
        });

        tableBody.appendChild(fragment);
        actualizarFecha();
    }

    // Manejar clic en botón eliminar (delegación)
    tableBody.addEventListener('click', function (e) {
        const btn = e.target.closest('.delete-btn');
        if (!btn) return;

        const id = btn.getAttribute('data-id');
        if (!id) return;

        if (!confirm('¿Eliminar este producto? Esta acción no se puede deshacer.')) return;

        // Buscar la fila correspondiente
        const tr = btn.closest('tr');
        eliminarProducto(id, tr);
    });

    function eliminarProducto(id, tr) {
        const url = `${API_URL}?id=${encodeURIComponent(id)}`;

        fetch(url, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        })
            .then(response => {
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                return response.json();
            })
            .then(json => {
                if (json.success) {
                    // Remover la fila y actualizar contador
                    if (tr && tr.parentNode) tr.parentNode.removeChild(tr);
                    const nuevoTotal = Math.max(0, Number(totalCount.textContent || 0) - 1);
                    totalCount.textContent = nuevoTotal;
                    actualizarFecha();
                } else {
                    throw new Error(json.error || 'No se pudo eliminar el producto');
                }
            })
            .catch(err => {
                console.error('Error eliminando producto:', err);
                alert('No se pudo eliminar el producto: ' + (err.message || err));
            });
    }

    function connectToFirebase() {
        if (!window.AppFirebase || !window.AppFirebase.setListener) {
            console.warn('Firebase no está disponible en esta página de inventario.');
            return;
        }

        window.AppFirebase.setListener((event, message) => {
            switch (event) {
                case window.AppFirebase.Events.MESSAGERECEIVED:
                    console.log('Notificación recibida en inventario:', message);
                    break;
                case window.AppFirebase.Events.TOKENUPDATED:
                    console.log('Token de Firebase actualizado en inventario:', message);
                    break;
                case window.AppFirebase.Events.ERROR:
                    console.warn('Error de Firebase en inventario:', message);
                    break;
                default:
                    console.log('Evento Firebase desconocido en inventario:', event, message);
            }
        });
    }

    function notificarInventarioBajo(producto) {
        if (!window.AppFirebase || typeof window.AppFirebase.sendNotification !== 'function') {
            console.warn('AppFirebase.sendNotification no está disponible.');
            return;
        }

        const cantidad = Number(producto.cantidad || 0);
        const title = `Inventario bajo: ${producto.nombre || ('ID ' + producto.id)}`;
        const body = `Quedan ${cantidad} unidad(es) de ${producto.nombre || ('ID ' + producto.id)}.`;


        window.AppFirebase.sendNotification(title, body, 'low_stock')
            .then(resultado => {
                if (!resultado) {
                    console.warn('No se pudo enviar la notificación de inventario.');
                }
            })
            .catch(err => {
                console.warn('Error enviando notificación de inventario:', err);
            });
    }

    function cargarProductos() {
        tableBody.innerHTML = '<tr><td colspan="6">Cargando productos...</td></tr>';
        
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
                    renderizarTabla(productosOriginales);
                } else {
                    throw new Error('Formato de respuesta inválido desde la API');
                }
            })
            .catch(error => {
                console.error('Error cargando productos:', error);
                tableBody.innerHTML = `<tr><td colspan="6">Error: ${error.message}</td></tr>`;
            });
    }

    if (inventorySearchInput) {
        inventorySearchInput.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            const filtrados = productosOriginales.filter(p =>
                (p.nombre && p.nombre.toLowerCase().includes(term)) ||
                (p.descripcion && p.descripcion.toLowerCase().includes(term)) ||
                (p.id && String(p.id).includes(term))
            );
            renderizarTabla(filtrados);
            // Revisar productos filtrados y enviar notificación si la cantidad es menor a 3
            filtrados.forEach(producto => {
                const cantidad = Number(producto.cantidad || 0);
                const id = producto.id;
                if (cantidad < 3 && id != null && !lowNotifiedIds.has(id)) {
                    notificarInventarioBajo(producto);
                    lowNotifiedIds.add(id);
                }
            });
        });
    }

    connectToFirebase();
    // Cargar productos al iniciar
    cargarProductos();
});
