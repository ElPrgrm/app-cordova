// URL de mi túnel de Cloudflare apuntando a PHP
const URL_BACKEND = 'https://dictionaries-measurement-powers-lisa.trycloudflare.com/guardar_escaneo.php';

// Array local para mostrar los escaneos en pantalla
let registrosEscaneados = [];

// Array local para pintar la tabla del inventario
let inventarioTabla = [];

// Evita que se inicialice dos veces
let moduloInicializado = false;

// En Cordova, lo que use hardware nativo debe esperar a este evento
document.addEventListener('deviceready', inicializarModuloEscaner, false);

// Fallback para pruebas en navegador
document.addEventListener('DOMContentLoaded', function () {
    if (!window.cordova) {
        inicializarModuloEscaner();
    }
});

function inicializarModuloEscaner() {
    if (moduloInicializado) return;
    moduloInicializado = true;

    const btnEscaner = document.getElementById('btn-disparar-escaner');
    const btnGuardar = document.getElementById('btn-guardar-codigo');
    const inputCodigo = document.getElementById('input-codigo-manual');

    if (btnEscaner) {
        btnEscaner.addEventListener('click', abrirCamaraScanner);
    }

    if (btnGuardar && inputCodigo) {
        btnGuardar.addEventListener('click', function () {
            const codigo = inputCodigo.value.trim();

            if (codigo === '') {
                mostrarMensaje('Ingresa un código válido.');
                return;
            }

            procesarCodigoEscaneado(codigo);
            inputCodigo.value = '';
        });
    }

    actualizarListaDOM();
    actualizarTablaDOM();
}

// ==========================================
// 1. FUNCIÓN: ABRIR LA CÁMARA
// ==========================================

function abrirCamaraScanner() {
    // Si estás probando en navegador, no existe el plugin
    if (!window.cordova || !cordova.plugins || !cordova.plugins.barcodeScanner) {
        const codigoManual = prompt('Plugin no disponible. Ingresa un código para probar:');

        if (codigoManual && codigoManual.trim() !== '') {
            procesarCodigoEscaneado(codigoManual.trim());
        }

        return;
    }

    cordova.plugins.barcodeScanner.scan(
        function (resultado) {
            if (!resultado.cancelled) {
                procesarCodigoEscaneado(resultado.text);
            } else {
                console.log('El usuario canceló el escaneo.');
            }
        },
        function (error) {
            alert('Error al intentar escanear: ' + error);
        },
        {
            preferFrontCamera: false,
            showFlipCameraButton: true,
            showTorchButton: true,
            torchOn: false,
            prompt: 'Centra el código de barras en el recuadro',
            resultDisplayDuration: 500,
            formats: 'EAN_13,EAN_8,UPC_A,UPC_E,QR_CODE,CODE_128',
            disableAnimations: true,
            disableSuccessBeep: false
        }
    );
}

// ==========================================
// 2. PROCESAMIENTO DEL CÓDIGO
// ==========================================

function procesarCodigoEscaneado(codigo) {
    codigo = codigo.trim();

    if (codigo === '') {
        mostrarMensaje('Código vacío o inválido.');
        return;
    }

    const fechaHora = new Date().toLocaleString();

    // Mostrar en historial local
    registrosEscaneados.unshift({
        codigo: codigo,
        fecha: fechaHora
    });

    actualizarListaDOM();

    // Consultar/guardar en backend
    enviarBackendPHP(codigo);
}

// ==========================================
// 3. ACTUALIZAR HISTORIAL DE ESCANEOS
// ==========================================

function actualizarListaDOM() {
    const lista = document.getElementById('lista-codigos');

    if (!lista) return;

    lista.innerHTML = '';

    if (registrosEscaneados.length === 0) {
        const li = document.createElement('li');
        li.textContent = 'No hay códigos escaneados todavía.';
        lista.appendChild(li);
        return;
    }

    registrosEscaneados.forEach(function (registro) {
        const li = document.createElement('li');
        li.textContent = `[${registro.fecha}] Cód: ${registro.codigo}`;
        lista.appendChild(li);
    });
}

// ==========================================
// 4. CONEXIÓN FETCH A PHP / MYSQL
// ==========================================

function enviarBackendPHP(codigoDeBarras) {
    mostrarMensaje('Consultando código en la base de datos...');

    const datos = new FormData();
    datos.append('codigo', codigoDeBarras);

    fetch(URL_BACKEND, {
        method: 'POST',
        body: datos
    })
        .then(function (respuesta) {
            return respuesta.json();
        })
        .then(function (resultado) {
            console.log('Respuesta del backend:', resultado);

            /*
                Tu PHP debería responder algo parecido a esto si existe:

                {
                    "status": "success",
                    "existe": true,
                    "mensaje": "Producto actualizado",
                    "producto": {
                        "codigo": "7501234567890",
                        "producto": "Coca Cola",
                        "descripcion": "Refresco 600ml",
                        "cantidad": 4
                    }
                }

                Y algo así si NO existe:

                {
                    "status": "not_found",
                    "existe": false,
                    "mensaje": "El producto no existe"
                }
            */

            if (resultado.status === 'success' && resultado.existe === true) {
                mostrarMensaje('Producto encontrado. Se sumó 1 unidad más.');

                if (resultado.producto) {
                    insertarOActualizarProductoEnTabla(resultado.producto);
                }

                return;
            }

            if (resultado.status === 'not_found' || resultado.existe === false) {
                preguntarSiDeseaAgregar(codigoDeBarras);
                return;
            }

            if (resultado.status === 'error') {
                mostrarMensaje('Error desde PHP: ' + resultado.mensaje);
                return;
            }

            mostrarMensaje('Respuesta no reconocida del servidor.');
        })
        .catch(function (error) {
            console.error('Error de conexión con el túnel o servidor:', error);
            mostrarMensaje('No se pudo conectar con el servidor.');
        });
}


// 5. SI EL CÓDIGO NO EXISTE


function preguntarSiDeseaAgregar(codigo) {
    const confirmar = confirm(
        'Este código no existe en la base de datos. ¿Deseas agregarlo?'
    );

    if (confirmar) {
        abrirFormularioRegistro(codigo);
    } else {
        mostrarMensaje('El producto no fue agregado.');
    }
}

function abrirFormularioRegistro(codigo) {
    window.location.href = 'formhtml?codigo=' + encodeURIComponent(codigo);
}

// 6. TABLA DINÁMICA DE INVENTARIO


function insertarOActualizarProductoEnTabla(productoBackend) {
    const productoNormalizado = {
        codigo: productoBackend.codigo || '',
        producto: productoBackend.producto || productoBackend.nombre || 'Sin nombre',
        descripcion: productoBackend.descripcion || 'Sin descripción',
        cantidad: Number(productoBackend.cantidad) || 1
    };

    const productoExistente = inventarioTabla.find(function (item) {
        return item.codigo === productoNormalizado.codigo;
    });

    if (productoExistente) {
        productoExistente.producto = productoNormalizado.producto;
        productoExistente.descripcion = productoNormalizado.descripcion;
        productoExistente.cantidad = productoNormalizado.cantidad;
    } else {
        inventarioTabla.push(productoNormalizado);
    }

    actualizarTablaDOM();
}

function actualizarTablaDOM() {
    const tabla = document.getElementById('tabla-inventario');

    if (!tabla) return;

    tabla.innerHTML = '';

    if (inventarioTabla.length === 0) {
        const fila = document.createElement('tr');

        const celda = document.createElement('td');
        celda.colSpan = 4;
        celda.textContent = 'No hay productos registrados en esta sesión.';

        fila.appendChild(celda);
        tabla.appendChild(fila);

        return;
    }

    inventarioTabla.forEach(function (producto) {
        const fila = document.createElement('tr');

        const celdaCodigo = document.createElement('td');
        celdaCodigo.textContent = producto.codigo;

        const celdaProducto = document.createElement('td');
        celdaProducto.textContent = producto.producto;

        const celdaDescripcion = document.createElement('td');
        celdaDescripcion.textContent = producto.descripcion;

        const celdaCantidad = document.createElement('td');
        celdaCantidad.textContent = producto.cantidad;

        fila.appendChild(celdaCodigo);
        fila.appendChild(celdaProducto);
        fila.appendChild(celdaDescripcion);
        fila.appendChild(celdaCantidad);

        tabla.appendChild(fila);
    });
}


// 7. MENSAJES EN PANTALLA


function mostrarMensaje(texto) {
    const mensaje = document.getElementById('mensaje-sistema');

    if (mensaje) {
        mensaje.textContent = texto;
    } else {
        console.log(texto);
    }
}