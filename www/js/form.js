const API_BASE_URL = 'https://elrjtd.online/DDI/API/productos.php';
let formInitialized = false;
let currentProductId = null;

document.addEventListener('deviceready', function() {

    // REFERENCIAS HTML
    const barkoderView = document.getElementById('barkoderView');
    const startScanBtn = document.getElementById('startScanBtn');
    const stopScanBtn = document.getElementById('stopScanBtn');
    const inputFormulario = document.getElementById("input-codigo-manual");

    // RESULTADOS VISUALES
    const resultContainer = document.getElementById('resultContainer');
    const resultText = document.getElementById('resultText');
    const resultType = document.getElementById('resultType');
    const resultImage = document.getElementById('resultImage');

    let isScanning = false;

    if (startScanBtn) startScanBtn.disabled = false;

    //////////////////////////////////////////////////////////////////////
    // TIPOS DE CÓDIGOS
    //////////////////////////////////////////////////////////////////////

    const setActiveBarcodeTypes = async () => {

        try {

            await window.Barkoder.setBarcodeTypeEnabled(BarcodeType.code128, true);
            await window.Barkoder.setBarcodeTypeEnabled(BarcodeType.code39, true);
            await window.Barkoder.setBarcodeTypeEnabled(BarcodeType.ean13, true);

        } catch (error) {

            console.error('Error config tipos:', error);
        }
    };

    //////////////////////////////////////////////////////////////////////
    // SETTINGS
    //////////////////////////////////////////////////////////////////////

    const setBarkoderSettings = async () => {

        try {

            window.Barkoder.setRegionOfInterestVisible(true);

            window.Barkoder.setRegionOfInterest(5, 5, 90, 90);

            window.Barkoder.setCloseSessionOnResultEnabled(true);

            window.Barkoder.setImageResultEnabled(true);

            window.Barkoder.setBarcodeThumbnailOnResultEnabled(true);

            window.Barkoder.setBeepOnSuccessEnabled(true);

            window.Barkoder.setPinchToZoomEnabled(true);

            window.Barkoder.setZoomFactor(2.0);

        } catch (error) {

            console.error('Error settings:', error);
        }
    };

    //////////////////////////////////////////////////////////////////////
    // RESET UI
    //////////////////////////////////////////////////////////////////////

    const resetUI = () => {

        if (startScanBtn) startScanBtn.disabled = false;

        if (stopScanBtn) stopScanBtn.disabled = true;

        if (barkoderView) barkoderView.style.display = "none";
    };

    //////////////////////////////////////////////////////////////////////
    // INICIAR ESCANEO
    //////////////////////////////////////////////////////////////////////

    const startScanning = async () => {

        if (!barkoderView) return;

        isScanning = true;

        if (startScanBtn) startScanBtn.disabled = true;

        if (stopScanBtn) stopScanBtn.disabled = false;

        if (resultContainer) resultContainer.style.display = 'none';

        barkoderView.style.display = "block";

        try {

            const boundingRect = barkoderView.getBoundingClientRect();

            window.Barkoder.registerWithLicenseKey('PEmBIohr9EZXgCkySoetbwP4gvOfMcGzgxKPL2X6uqNsDDG12C05PmP2q67Lt2_Y5iOIrFsiVzsSGyKh3hYo_-RLArbX9066mPschvXbvHY9UPWiiPmtO-5q5JQy_gHuLKVUyinD5KzFexj_2uVscKgyISui-cMvixwuoKPY5oLOvzIyq8GZfNwENVA-S6C753Cp8An4X-vYPhp8dn7kQuk0dL4VFiIGpKC6pHCF1TL5mo0QDuB6WBsvMeYSoUTFHQ6xCCGqKCK8svx6nYTEK-JdkhS3ni1CyJLwt84Ox-4KE9qyM41V6fvR6jLSGLq9');

            await new Promise((resolve, reject) => {

                window.Barkoder.initialize(

                    Math.round(boundingRect.width),
                    Math.round(boundingRect.height),
                    Math.round(boundingRect.x),
                    Math.round(boundingRect.y),

                    () => resolve(),

                    (error) => reject('Init error: ' + error)
                );
            });

            await setBarkoderSettings();

            await setActiveBarcodeTypes();

            //////////////////////////////////////////////////////////////////////
            // START SCANNING
            //////////////////////////////////////////////////////////////////////

            window.Barkoder.startScanning(

                async (resultado) => {

                    console.log("OBJETO ESCANEADO ", JSON.stringify(resultado));

                    let numeroDetectado = "";

                    if (
                        resultado &&
                        resultado.decoderResults &&
                        resultado.decoderResults.length > 0
                    ) {

                        numeroDetectado =
                            resultado.decoderResults[0].textualData;

                    } else {

                        numeroDetectado =
                            resultado.textualData ||
                            resultado.text ||
                            "";
                    }

                    console.log("NÚMERO EXTRAÍDO:", numeroDetectado);

                    //////////////////////////////////////////////////////////////////////
                    // INPUT
                    //////////////////////////////////////////////////////////////////////

                    if (inputFormulario) {

                        inputFormulario.value = numeroDetectado;
                    }

                    //////////////////////////////////////////////////////////////////////
                    // RESULTADOS VISUALES
                    //////////////////////////////////////////////////////////////////////

                    if (
                        resultado &&
                        resultado.decoderResults &&
                        resultado.decoderResults.length > 0
                    ) {

                        if (resultText) {

                            resultText.textContent = numeroDetectado;

                            resultText.href = numeroDetectado;
                        }

                        if (resultType) {

                            resultType.textContent =
                                resultado.decoderResults[0].barcodeTypeName;
                        }
                    }

                    //////////////////////////////////////////////////////////////////////
                    // CONSULTAR API
                    //////////////////////////////////////////////////////////////////////

                    try {

                        const response = await fetch(
                            `${API_BASE_URL}?codigo=${numeroDetectado}`
                        );

                        const data = await response.json();

                        console.log("RESPUESTA API:", data);

                        //////////////////////////////////////////////////////////////////////
                        // EXISTE EN BD
                        //////////////////////////////////////////////////////////////////////

                        if (data.success && data.data.length > 0) {

                            const producto = data.data[0];

                            //////////////////////////////////////////////////////////////////////
                            // BUSCAR EN TABLA
                            //////////////////////////////////////////////////////////////////////

                            let filaExistente = document.querySelector(
                                `tr[data-codigo="${producto.codigo}"]`
                            );

                            //////////////////////////////////////////////////////////////////////
                            // YA EXISTÍA -> SUMAR
                            //////////////////////////////////////////////////////////////////////

                            if (filaExistente) {

                                let inputCantidad =
                                    filaExistente.querySelector(".cantidad");

                                inputCantidad.value =
                                    parseInt(inputCantidad.value) + 1;

                                const precio = parseFloat(
                                    filaExistente.querySelector(".precio").textContent
                                );

                                const subtotal =
                                    precio * parseInt(inputCantidad.value);

                                filaExistente.querySelector(".subtotal")
                                    .textContent = subtotal.toFixed(2);

                                alert(
                                    "Cantidad aumentada\n\n" +
                                    producto.nombre
                                );

                            } else {

                                //////////////////////////////////////////////////////////////////////
                                // NUEVO EN TABLA
                                //////////////////////////////////////////////////////////////////////

                                const tabla =
                                    document.getElementById("tablaProductos");

                                let fila = document.createElement("tr");

                                fila.setAttribute(
                                    "data-codigo",
                                    producto.codigo
                                );

                                fila.innerHTML = `
                                    <td>${producto.codigo}</td>

                                    <td>${producto.nombre}</td>

                                    <td class="precio">
                                        ${parseFloat(producto.precio).toFixed(2)}
                                    </td>

                                    <td>
                                        <input
                                            type="number"
                                            class="cantidad"
                                            value="1"
                                            min="1"
                                        >
                                    </td>

                                    <td class="subtotal">
                                        ${parseFloat(producto.precio).toFixed(2)}
                                    </td>
                                `;

                                tabla.appendChild(fila);

                                alert(
                                    "Producto agregado\n\n" +
                                    producto.nombre
                                );
                            }

                            //////////////////////////////////////////////////////////////////////
                            // TOTAL
                            //////////////////////////////////////////////////////////////////////

                            let total = 0;

                            document.querySelectorAll(".subtotal")
                                .forEach(sub => {

                                    total += parseFloat(sub.textContent);
                                });

                            document.getElementById("total").textContent =
                                total.toFixed(2);

                        }

                        //////////////////////////////////////////////////////////////////////
                        // NO EXISTE EN BD
                        //////////////////////////////////////////////////////////////////////

                        else {

                            alert(
                                "Producto no registrado\n\n" +
                                "Se abrirá el formulario"
                            );

                            window.location.href =
                                `form.html?codigo=${numeroDetectado}`;
                        }

                    } catch (error) {

                        console.error(error);

                        alert("Error al consultar API");
                    }

                    //////////////////////////////////////////////////////////////////////
                    // CERRAR CÁMARA
                    //////////////////////////////////////////////////////////////////////

                    window.Barkoder.stopScanning(

                        () => {

                            isScanning = false;

                            resetUI();
                        },

                        (error) => {

                            console.error(
                                'Error al forzar cierre automático:',
                                error
                            );

                            isScanning = false;

                            resetUI();
                        }
                    );
                },

                //////////////////////////////////////////////////////////////////////
                // ERROR ESCANEO
                //////////////////////////////////////////////////////////////////////

                (error) => {

                    console.error('Error al escanear:', error);

                    isScanning = false;

                    resetUI();
                }
            );

        } catch (error) {

            console.error('Error general:', error);

            isScanning = false;

            resetUI();
        }
    };

    //////////////////////////////////////////////////////////////////////
    // DETENER MANUAL
    //////////////////////////////////////////////////////////////////////

    const stopScanning = () => {

        window.Barkoder.stopScanning(

            () => {

                isScanning = false;

                resetUI();
            },

            (error) => console.error('Error al detener manualmente:', error)
        );
    };

    //////////////////////////////////////////////////////////////////////
    // EVENTOS
    //////////////////////////////////////////////////////////////////////

    if (startScanBtn)
        startScanBtn.addEventListener('click', startScanning);

    if (stopScanBtn)
        stopScanBtn.addEventListener('click', stopScanning);

}, false);