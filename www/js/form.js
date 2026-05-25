const PRODUCTOS_FILE = 'productos.json';
const STORAGE_KEY = 'productosBackup';
let formInitialized = false;

window.addEventListener('DOMContentLoaded', initForm);
window.addEventListener('deviceready', initForm);

function initForm() {
    if (formInitialized) {
        return;
    }
    const form = document.getElementById('product-form');
    if (!form) {
        return;
    }
    formInitialized = true;
    form.addEventListener('submit', onFormSubmit);
}

async function onFormSubmit(event) {
    event.preventDefault();

    const producto = getFormData();
    if (!producto) {
        showMessage('Por favor completa todos los campos correctamente.', true);
        return;
    }

    try {
        const productos = await loadProductos();
        producto.id = getNextId(productos);
        productos.push(producto);
        await saveProductos({ productos });
        showMessage('Producto guardado correctamente.');
        document.getElementById('product-form').reset();
    } catch (error) {
        console.error('Error guardando producto:', error);
        showMessage('No se pudo guardar el producto. Revisa la consola.', true);
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

function getNextId(productos) {
    const maxId = productos.reduce((max, item) => {
        const id = Number(item.id) || 0;
        return id > max ? id : max;
    }, 0);
    return maxId + 1;
}

function isCordovaFileAvailable() {
    return (
        typeof window.cordova !== 'undefined' &&
        typeof window.resolveLocalFileSystemURL === 'function' &&
        window.cordova.file
    );
}

async function loadProductos() {
    if (isCordovaFileAvailable()) {
        return loadProductosFromCordovaFile();
    }
    return loadProductosFromStorage();
}

async function saveProductos(data) {
    if (isCordovaFileAvailable()) {
        return saveProductosToCordovaFile(data);
    }
    return saveProductosToStorage(data);
}

async function loadProductosFromStorage() {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
        try {
            const parsed = JSON.parse(stored);
            return Array.isArray(parsed.productos) ? parsed.productos : [];
        } catch (error) {
            console.warn('Error parseando backup local:', error);
        }
    }

    const response = await fetch(PRODUCTOS_FILE, { cache: 'no-store' });
    if (!response.ok) {
        throw new Error('No se pudo leer productos.json');
    }
    const json = await response.json();
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(json));
    return Array.isArray(json.productos) ? json.productos : [];
}

function saveProductosToStorage(data) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return Promise.resolve();
}

function loadProductosFromCordovaFile() {
    return new Promise((resolve, reject) => {
        window.resolveLocalFileSystemURL(
            window.cordova.file.dataDirectory,
            (directoryEntry) => {
                directoryEntry.getFile(
                    PRODUCTOS_FILE,
                    { create: true },
                    (fileEntry) => {
                        fileEntry.file(
                            (file) => {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                    if (!reader.result) {
                                        resolve([]);
                                        return;
                                    }
                                    try {
                                        const json = JSON.parse(reader.result);
                                        resolve(Array.isArray(json.productos) ? json.productos : []);
                                    } catch (error) {
                                        reject(error);
                                    }
                                };
                                reader.onerror = reject;
                                reader.readAsText(file);
                            },
                            reject
                        );
                    },
                    reject
                );
            },
            reject
        );
    });
}

function saveProductosToCordovaFile(data) {
    return new Promise((resolve, reject) => {
        window.resolveLocalFileSystemURL(
            window.cordova.file.dataDirectory,
            (directoryEntry) => {
                directoryEntry.getFile(
                    PRODUCTOS_FILE,
                    { create: true },
                    (fileEntry) => {
                        fileEntry.createWriter(
                            (writer) => {
                                const blob = new Blob([JSON.stringify(data, null, 2)], {
                                    type: 'application/json',
                                });
                                writer.onerror = reject;
                                writer.onwriteend = () => {
                                    writer.onwriteend = resolve;
                                    writer.write(blob);
                                };
                                writer.truncate(0);
                            },
                            reject
                        );
                    },
                    reject
                );
            },
            reject
        );
    });
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
