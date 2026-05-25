document.addEventListener('DOMContentLoaded', function () {
    const tableBody = document.getElementById('inventory-body');
    const totalCount = document.getElementById('total-count');
    const updatedAt = document.getElementById('updated-at');
    const storageKey = 'tiendaProductos';
    let productosActuales = [];

    if (!tableBody || !totalCount) {
        return;
    }

    function guardarProductos(productos) {
        localStorage.setItem(storageKey, JSON.stringify(productos));
    }

    function obtenerProductosAlmacenados() {
        const datos = localStorage.getItem(storageKey);
        return datos ? JSON.parse(datos) : null;
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
            tableBody.innerHTML = '<tr><td colspan="4">No hay productos disponibles.</td></tr>';
            return;
        }

        const fragment = document.createDocumentFragment();
        productos.forEach(producto => {
            const tr = document.createElement('tr');
            tr.dataset.id = producto.id;
            tr.innerHTML = `
                <td>${producto.nombre}</td>
                <td>${producto.cantidad}</td>
                <td>${formatearPrecio(producto.precio)}</td>
                <td>
                    <button class="action-btn edit-btn" data-id="${producto.id}">Editar</button>
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

    function cancelarEdicion() {
        renderizarTabla(productosActuales);
    }

    tableBody.addEventListener('click', function (event) {
        const target = event.target;
        const id = Number(target.dataset.id);

        if (target.matches('.edit-btn')) {
            iniciarEdicion(id);
            return;
        }

        if (target.matches('.save-btn')) {
            guardarEdicion(id);
            return;
        }

        if (target.matches('.cancel-btn')) {
            cancelarEdicion();
            return;
        }
    });

    function cargarProductos() {
        const almacenados = obtenerProductosAlmacenados();
        if (almacenados && Array.isArray(almacenados) && almacenados.length > 0) {
            productosActuales = almacenados;
            renderizarTabla(productosActuales);
            return;
        }

        fetch('productos.json')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Error al cargar productos.json');
                }
                return response.json();
            })
            .then(data => {
                productosActuales = data.productos || [];
                guardarProductos(productosActuales);
                renderizarTabla(productosActuales);
            })
            .catch(error => {
                console.error(error);
                tableBody.innerHTML = '<tr><td colspan="4">Error al cargar los productos.</td></tr>';
            });
    }

    cargarProductos();
});
