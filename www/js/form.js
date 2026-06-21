const API_BASE_URL = 'https://elrjtd.online/DDI/API/productos.php';
let formInitialized = false;
let currentProductId = null;

window.addEventListener('DOMContentLoaded', init);
document.addEventListener('deviceready', init);

function init() {
    initForm();
    document.addEventListener('backbutton', onBackButton, false);
    document.getElementById("buttons_alert").addEventListener("click", () => {
        hideMessage();
    })


    connectToFirebase();
}

function connectToFirebase() {
    window.AppFirebase.setListener((event, message) => {

        // Evaluamos qué evento llegó usando el Enum global
        switch (event) {
            case window.AppFirebase.Events.MESSAGERECEIVED:
               showMessage(msg.data_1)
                break;

            case window.AppFirebase.Events.TOKENUPDATED:
                console.log("Token refrescado con éxito:", message);
                break;

            case window.AppFirebase.Events.ERROR:
                alert("Error en Firebase: " + message);
                break;
        }
    });

   
  
}
function onBackButton(event) {
    // Evita el comportamiento por defecto (que suele ser cerrar la app de golpe)
    event.preventDefault();
    window.location.href = 'ventas.html';
}

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

    const codeInput = document.getElementById('codeqr');

    // Capturamos los parámetros que traen el ID consigo
    const modeAddId = getQueryParam('modeAdd');   // Trae el código escaneado para un producto nuevo
    const modeEditId = getQueryParam('modeEdit'); // Trae el ID del producto existente a editar

    // CASO 1: Modo Añadir Producto (Viene con el ID/Código escaneado)
    const vlvr = document.getElementById('vlvr');
    let redirectRef = 'ventas.html';
    if (codeInput && modeAddId) {
        codeRestore = localStorage.getItem('codeqr');
        codeInput.value = modeAddId;
        if (codeRestore && codeRestore == modeAddId) {
            restoreValues();
        }
        redirectRef = 'escaner.html?modeEdit=' + modeAddId;
        setCodeReadOnly(true);
        setFormMode('Agregar producto');
    }

    // CASO 2: Modo Editar Producto (El parámetro modeEdit trae directamente el ID)
    if (modeEditId) {
        codeRestore = localStorage.getItem('codeqr');
        codeInput.value = modeEditId;
        console.log("verifying codeqr");
        if (codeRestore && codeRestore == modeEditId) {
            showMessage('desea recuperar los ultimos cambios?', false, () => {
                restoreValues();
                hideMessage();
            }, "aceptar")
            //restoreValues();
        }
        redirectRef = 'inventario.html'
        currentProductId = modeEditId; // Asignamos el ID globalmente
        await loadProductForEdit(modeEditId);
    }
    vlvr.addEventListener('click', () => {

        backupValues();

        window.location.href = redirectRef;

    });
}
function backupValues() {
    localStorage.setItem('codeqr', document.getElementById('codeqr').value);
    localStorage.setItem('name', document.getElementById('name').value);
    localStorage.setItem('description', document.getElementById('description').value);
    localStorage.setItem('price', document.getElementById('price').value);
    localStorage.setItem('quantity', document.getElementById('quantity').value);


}
function restoreValues() {
    document.getElementById('codeqr').value = localStorage.getItem('codeqr') ?? '';
    setCodeReadOnly(true);
    document.getElementById('name').value = localStorage.getItem('name') ?? '';
    document.getElementById('description').value = localStorage.getItem('description') ?? '';
    document.getElementById('price').value = localStorage.getItem('price') ?? '';
    document.getElementById('quantity').value = localStorage.getItem('quantity') ?? '';

}
async function onFormSubmit(event) {
    event.preventDefault();
    const submitButton = document.getElementById('submitButton');
    if (submitButton && submitButton.disabled) return; // Evitar envíos dobles

    const producto = getFormData();
    if (!producto) {
        showMessage('Por favor completa todos los campos correctamente.', true);
        return;
    }

    // Mostrar estado y desactivar botón
    const originalText = submitButton ? submitButton.textContent : 'Guardar';
    if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = currentProductId ? 'Actualizando...' : 'Guardando...';
    }

    try {
        const result = currentProductId
            ? await updateProducto(currentProductId, producto)
            : await createProducto(producto);

        if (result && result.success) {
            const message = currentProductId
                ? 'Producto actualizado correctamente.'
                : `Producto guardado correctamente con ID: ${result.id || producto.id}`;

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
    } finally {
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = originalText;
        }
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

// Simplificado: Eliminado el parámetro redundante isCode ya que 'identifier' es el id directo extraído de modeEdit
async function loadProductForEdit(identifier) {
    // La API siempre consulta mediante la clave URL '?id='
    const response = await fetch(`${API_BASE_URL}?id=${encodeURIComponent(identifier)}`);

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

    // Aseguramos que el id de control sea el devuelto por la base de datos
    currentProductId = result.data.id;
    fillForm(result.data);
    setFormMode('Actualizar producto');
}

function fillForm(producto) {
    document.getElementById('codeqr').value = producto.id ?? '';
    setCodeReadOnly(true);
    document.getElementById('name').value = producto.nombre ?? '';
    document.getElementById('description').value = producto.descripcion ?? '';
    document.getElementById('price').value = producto.precio ?? '';
    document.getElementById('quantity').value = producto.cantidad ?? '';
}

function setCodeReadOnly(isReadOnly) {
    const codeInput = document.getElementById('codeqr');
    if (!codeInput) {
        return;
    }
    codeInput.readOnly = isReadOnly;
    codeInput.setAttribute('aria-readonly', isReadOnly ? 'true' : 'false');
    if (isReadOnly) {
        codeInput.classList.add('readonly-field');
    } else {
        codeInput.classList.remove('readonly-field');
    }
}

function setFormMode(label) {
    const submitButton = document.getElementById('submitButton') || document.querySelector('#product-form button[type="submit"]');
    if (submitButton) {
        submitButton.textContent = label;
        submitButton.disabled = false;
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
        id: codeqr,
        nombre,
        descripcion,
        precio,
        cantidad,
    };
}

function showMessage(text, isError = false, action = null, textAction) {


    const cntnrAlert = document.getElementById('formMessage');
    if (!cntnrAlert) {
        alert(text);
        return;
    }
    const mssg = document.getElementById('messageAlert');
    mssg.textContent = text;

    cntnrAlert.classList.remove('d-none');
    cntnrAlert.classList.add('d-block');
    btns = document.getElementById('buttons_alert');
    btn = document.getElementById('action_alert');
    if (action && typeof action === 'function') {

        btn.textContent = textAction;
        btns.classList.remove('d-none');
        btns.classList.add('d-block');
        btn.addEventListener('click', () => {

            action();
        });
    }
    cntnrAlert.style.backgroundColor = isError ? '#fee2e2' : '#eff6ff';
    cntnrAlert.style.color = isError ? '#b91c1c' : '#1d4ed8';
    setTimeout(() => {
        cntnrAlert.classList.remove('d-bock');
        cntnrAlert.classList.add('d-none');
        btns.classList.remove('d-bock');
        btns.classList.add('d-none');
        // cntnrAlert.classList.remove('visible');
    }, 4800);
}

function hideMessage() {
    const cntnrAlert = document.getElementById('formMessage');
    const btns = document.getElementById('buttons_alert');
    cntnrAlert.classList.remove('d-bock');
    cntnrAlert.classList.add('d-none');
    btns.classList.remove('d-bock');
    btns.classList.add('d-none');
}