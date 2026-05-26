document.addEventListener('DOMContentLoaded', function () {
    const tableBody = document.getElementById('inventory-body');
    const totalCount = document.getElementById('total-count');
    const updatedAt = document.getElementById('updated-at');

    if (!tableBody || !totalCount) {
        return;
    }

    // Endpoint relativo a la API
    const API_URL = 'http://localhost/DDI/API/productos.php';

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
                    <a href="form.html?id=${producto.id}" class="action-btn edit-btn">Editar</a>
                </td>
            `;
            fragment.appendChild(tr);
        });

        tableBody.appendChild(fragment);
        actualizarFecha();
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
                       console.error('er');
                    renderizarTabla(data.data);
                } else {
                    throw new Error('Formato de respuesta inválido desde la API');
                }
            })
            .catch(error => {
                console.error('Error cargando productos:', error);
                tableBody.innerHTML = `<tr><td colspan="6">Error: ${error.message}</td></tr>`;
            });
    }

    // Cargar productos al iniciar
    cargarProductos();
});
