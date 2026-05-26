document.addEventListener('DOMContentLoaded', function () {
    const tableBody = document.getElementById('inventory-body');
    const totalCount = document.getElementById('total-count');
    const updatedAt = document.getElementById('updated-at');
    let productosActuales = [];

    if (!tableBody || !totalCount) {
        return;
    }

    function getApiUrl() {
        const currentPath = window.location.pathname;
        const wwwIndex = currentPath.indexOf('/www/');
        if (wwwIndex !== -1) {
            const basePath = currentPath.substring(0, wwwIndex + 5);
            return basePath + '/api/productos.php';
        }
        const basePath = currentPath.substring(0, currentPath.lastIndexOf('/'));
        return basePath + '/api/productos.php';
    }

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
                <td>${producto.codigo}</td>
                <td>${producto.nombre}</td>
                <td>${producto.descripcion}</td>
                <td>${producto.cantidad}</td>
                <td>${formatearPrecio(producto.precio)}</td>
                <td>
                    <a href="form.html?id=${producto.id}" class="action-btn edit-btn">Editar</a>
                </td>
            `;
            fragment.appendChild(tr);
        });

        tableBody.appendChild(fragment);
        actualizarFecha();
    }

    function iniciarEdicion(id) {
        const producto = productosActuales.find(item => item.id === id);
        if (!producto) return;

        const row = tableBody.querySelector(`tr[data-id="${id}"]`);
        if (!row) return;

        row.innerHTML = `
            <td><input class="edit-input" type="text" value="${producto.nombre}" /></td>
            <td><input class="edit-input" type="number" min="0" step="1" value="${producto.cantidad}" /></td>
            <td><input class="edit-input" type="number" min="0" step="0.01" value="${producto.precio}" /></td>
            <td>
                <button class="action-btn save-btn" data-id="${producto.id}">Guardar</button>
                <button class="action-btn cancel-btn" data-id="${producto.id}">Cancelar</button>
            </td>
        `;
    }

    function guardarEdicion(id) {
        const row = tableBody.querySelector(`tr[data-id="${id}"]`);
        if (!row) return;

        const inputs = row.querySelectorAll('input');
        const nombre = inputs[0].value.trim();
        const cantidad = parseInt(inputs[1].value, 10);
        const precio = parseFloat(inputs[2].value);

        if (!nombre || Number.isNaN(cantidad) || Number.isNaN(precio) || cantidad < 0 || precio < 0) {
            alert('Por favor, ingresa un nombre válido, cantidad y precio mayor o igual a cero.');
            return;
        }

        productosActuales = productosActuales.map(producto => {
            if (producto.id === id) {
                return {
                    ...producto,
                    nombre,
                    cantidad,
                    precio
                };
            }
            return producto;
        });

        guardarProductos(productosActuales);
        renderizarTabla(productosActuales);
    }

    tableBody.addEventListener('click', function (event) {
        // Los enlaces de editar ahora redirigen al formulario automáticamente
    });

    function cargarProductos() {
        tableBody.innerHTML = '<tr><td colspan="6">Cargando productos...</td></tr>';
        const apiUrl = getApiUrl();
        
        fetch(apiUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Error al cargar productos del servidor');
                }
                return response.json();
            })
            .then(data => {
                if (data.success && Array.isArray(data.data)) {
                    productosActuales = data.data;
                    renderizarTabla(productosActuales);
                } else {
                    throw new Error('Formato de respuesta inválido');
                }
            })
            .catch(error => {
                console.error(error);
                tableBody.innerHTML = '<tr><td colspan="6">Error al cargar los productos.</td></tr>';
            });
    }

    cargarProductos();
});
