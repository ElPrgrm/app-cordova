const API_BASE_URL = 'http://localhost/DDI/API/productos.php';
let formInitialized = false;
let currentProductId = null;

window.addEventListener('DOMContentLoaded', initForm);
window.addEventListener('deviceready', initForm);

async function initForm() {
    if (formInitialized) {
        return;
    }

    const form = document.getElementById('product-form');
    if (!form) {
        return;
    }

    formInitialized = true;
    form.addEventListener('submit', onFormSubmit);

    const id = getQueryParam('id');
    if (id) {
        currentProductId = id;
        await loadProductForEdit(id);
    }
}

async function onFormSubmit(event) {
    event.preventDefault();

    const producto = getFormData();
    if (!producto) {
        showMessage('Por favor completa todos los campos correctamente.', true);
        return;
    }

    try {
        const result = currentProductId
            ? await updateProducto(currentProductId, producto)
            : await createProducto(producto);

        if (result && result.success) {
            const message = currentProductId
                ? 'Producto actualizado correctamente.'
                : `Producto guardado correctamente con ID: ${result.id}`;

            showMessage(message);
            if (!currentProductId) {
                document.getElementById('product-form').reset();
            }
        } else {
            showMessage(result.error || 'No se pudo guardar el producto.', true);
        }
    } catch (error) {
        console.error('Error en la petición al servidor:', error);
        showMessage('No se pudo guardar el producto. Revisa la consola.', true);
    }
}

async function createProducto(productoData) {
    const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(productoData)
    });

    if (!response.ok) {
        const errorBody = await tryParseJson(response);
        return { success: false, error: errorBody?.error || `Error HTTP ${response.status}` };
    }

    return response.json();
}

async function updateProducto(id, productoData) {
    const response = await fetch(`${API_BASE_URL}?id=${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'

            
        },
        body: JSON.stringify(productoData)
    });

    if (!response.ok) {
        const errorBody = await tryParseJson(response);
        return { success: false, error: errorBody?.error || `Error HTTP ${response.status}` };
    }

    return response.json();
}

async function loadProductForEdit(id) {
    const response = await fetch(`${API_BASE_URL}?id=${encodeURIComponent(id)}`);

    if (!response.ok) {
        const errorBody = await tryParseJson(response);
        showMessage(errorBody?.error || `No se encontró el producto (HTTP ${response.status}).`, true);
        return;
    }

    const result = await response.json();
    if (!result.success || !result.data) {
        showMessage(result.error || 'No se pudo cargar el producto para edición.', true);
        return;
    }

    fillForm(result.data);
    setFormMode('Actualizar producto');
}

function fillForm(producto) {
    document.getElementById('codeqr').value = producto.codigo ?? '';
    document.getElementById('name').value = producto.nombre ?? '';
    document.getElementById('description').value = producto.descripcion ?? '';
    document.getElementById('price').value = producto.precio ?? '';
    document.getElementById('quantity').value = producto.cantidad ?? '';
}

function setFormMode(label) {
    const submitButton = document.querySelector('#product-form button[type="submit"]');
    if (submitButton) {
        submitButton.textContent = label;
    }
}

function getQueryParam(name) {
    const params = new URLSearchParams(window.location.search);
    const value = params.get(name);
    return value ? value.trim() : null;
}

async function tryParseJson(response) {
    try {
        return await response.json();
    } catch {
        return null;
    }
}

function getFormData() {
    const codeqr = document.getElementById('codeqr')?.value.trim();
    const nombre = document.getElementById('name')?.value.trim();
    const descripcion = document.getElementById('description')?.value.trim();
    const precioValue = document.getElementById('price')?.value.trim();
    const cantidadValue = document.getElementById('quantity')?.value.trim();

    const precio = parseFloat(precioValue);
    const cantidad = parseInt(cantidadValue, 10);

    if (!codeqr || !nombre || !descripcion || isNaN(precio) || isNaN(cantidad)) {
        return null;
    }

    return {
        codigo: codeqr,
        nombre,
        descripcion,
        precio,
        cantidad,
    };
}






function showMessage(text, isError = false) {
    const messageElement = document.getElementById('formMessage');
    if (!messageElement) {
        alert(text);
        return;
    }
    messageElement.textContent = text;
    messageElement.classList.add('visible');
    messageElement.style.backgroundColor = isError ? '#fee2e2' : '#eff6ff';
    messageElement.style.color = isError ? '#b91c1c' : '#1d4ed8';
    setTimeout(() => {
        messageElement.classList.remove('visible');
    }, 4800);
}
