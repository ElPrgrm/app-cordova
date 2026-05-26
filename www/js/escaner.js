// ===============================
// CONFIG
// ===============================

const API_BASE_URL = 'https://elrjtd.online/DDI/API/productos.php';

let formInitialized = false;
let currentProductId = null;

// ===============================
// DEVICEREADY
// ===============================

document.addEventListener('deviceready', function () {

    // =====================================
    // REFERENCIAS HTML
    // =====================================

    const barkoderView = document.getElementById('barkoderView');
    const startScanBtn = document.getElementById('startScanBtn');
    const stopScanBtn = document.getElementById('stopScanBtn');
    const inputFormulario = document.getElementById("input-codigo-manual");

    const resultContainer = document.getElementById('resultContainer');
    const resultText = document.getElementById('resultText');
    const resultType = document.getElementById('resultType');
    const resultImage = document.getElementById('resultImage');

    const btnGuardar = document.getElementById('btnGuardar');

    let isScanning = false;

    if (startScanBtn) {
        startScanBtn.disabled = false;
    }

    // =====================================
    // TIPOS DE CÓDIGO
    // =====================================

    const setActiveBarcodeTypes = async () => {

        try {

            await window.Barkoder.setBarcodeTypeEnabled(
                BarcodeType.code128,
                true
            );

            await window.Barkoder.setBarcodeTypeEnabled(
                BarcodeType.code39,
                true
            );

            await window.Barkoder.setBarcodeTypeEnabled(
                BarcodeType.ean13,
                true
            );

        } catch (error) {

            console.error('Error tipos barcode:', error);
        }
    };

    // =====================================
    // AJUSTES CÁMARA
    // =====================================

    const setBarkoderSettings = async () => {

        try {

            window.Barkoder.setRegionOfInterestVisible(true);

            window.Barkoder.setRegionOfInterest(
                5,
                5,
                90,
                90
            );

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

    // =====================================
    // RESET UI
    // =====================================

    const resetUI = () => {

        if (startScanBtn) {
            startScanBtn.disabled = false;
        }

        if (stopScanBtn) {
            stopScanBtn.disabled = true;
        }

        if (barkoderView) {
            barkoderView.style.display = "none";
        }
    };

    // =====================================
    // INICIAR ESCANEO
    // =====================================

    const startScanning = async () => {

        if (!barkoderView) {
            return;
        }

        isScanning = true;

        if (startScanBtn) {
            startScanBtn.disabled = true;
        }

        if (stopScanBtn) {
            stopScanBtn.disabled = false;
        }

        if (resultContainer) {
            resultContainer.style.display = 'none';
        }

        barkoderView.style.display = "block";

        try {

            const boundingRect =
                barkoderView.getBoundingClientRect();

            // =====================================
            // LICENCIA
            // =====================================

            window.Barkoder.registerWithLicenseKey(
                'PEmBIohr9EZXgCkySoetbwP4gvOfMcGzgxKPL2X6uqNsDDG12C05PmP2q67Lt2_Y5iOIrFsiVzsSGyKh3hYo_-RLArbX9066mPschvXbvHY9UPWiiPmtO-5q5JQy_gHuLKVUyinD5KzFexj_2uVscKgyISui-cMvixwuoKPY5oLOvzIyq8GZfNwENVA-S6C753Cp8An4X-vYPhp8dn7kQuk0dL4VFiIGpKC6pHCF1TL5mo0QDuB6WBsvMeYSoUTFHQ6xCCGqKCK8svx6nYTEK-JdkhS3ni1CyJLwt84Ox-4KE9qyM41V6fvR6jLSGLq9'
            );

            // =====================================
            // INICIALIZAR
            // =====================================

            await new Promise((resolve, reject) => {

                window.Barkoder.initialize(

                    Math.round(boundingRect.width),
                    Math.round(boundingRect.height),
                    Math.round(boundingRect.x),
                    Math.round(boundingRect.y),

                    () => resolve(),

                    (error) =>
                        reject('Init error: ' + error)
                );
            });

            await setBarkoderSettings();

            await setActiveBarcodeTypes();

            // =====================================
            // ESCANEAR
            // =====================================

            window.Barkoder.startScanning(

                // SUCCESS
                (resultado) => {

                    console.log(
                        "OBJETO ESCANEADO",
                        JSON.stringify(resultado)
                    );

                    let numeroDetectado = "";

                    if (
                        resultado &&
                        resultado.decoderResults &&
                        resultado.decoderResults.length > 0
                    ) {

                        numeroDetectado =
                            resultado.decoderResults[0]
                            .textualData;

                    } else {

                        numeroDetectado =
                            resultado.textualData ||
                            resultado.text ||
                            "";
                    }

                    console.log(
                        "NÚMERO EXTRAÍDO:",
                        numeroDetectado
                    );

                    // =====================================
                    // ESCRIBIR EN INPUT
                    // =====================================

                    if (inputFormulario) {

                        inputFormulario.value =
                            numeroDetectado;
                    }

                    // =====================================
                    // RESULTADOS VISUALES
                    // =====================================

                    if (
                        resultado &&
                        resultado.decoderResults &&
                        resultado.decoderResults.length > 0
                    ) {

                        if (resultText) {

                            resultText.textContent =
                                numeroDetectado;

                            resultText.href =
                                numeroDetectado;
                        }

                        if (resultType) {

                            resultType.textContent =
                                resultado.decoderResults[0]
                                .barcodeTypeName;
                        }
                    }

                    // =====================================
                    // DETENER ESCANEO
                    // =====================================

                    window.Barkoder.stopScanning(

                        () => {

                            isScanning = false;

                            resetUI();
                        },

                        (error) => {

                            console.error(
                                'Error cierre:',
                                error
                            );

                            isScanning = false;

                            resetUI();
                        }
                    );
                },

                // ERROR
                (error) => {

                    console.error(
                        'Error escaneo:',
                        error
                    );

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

    // =====================================
    // DETENER ESCANEO
    // =====================================

    const stopScanning = () => {

        window.Barkoder.stopScanning(

            () => {

                isScanning = false;

                resetUI();
            },

            (error) => {

                console.error(
                    'Error detener:',
                    error
                );
            }
        );
    };

    // =====================================
    // EVENTOS BOTONES ESCANEO
    // =====================================

    if (startScanBtn) {

        startScanBtn.addEventListener(
            'click',
            startScanning
        );
    }

    if (stopScanBtn) {

        stopScanBtn.addEventListener(
            'click',
            stopScanning
        );
    }

    // =====================================
    // GUARDAR PRODUCTO
    // =====================================

    if (btnGuardar) {

        btnGuardar.addEventListener(
            'click',

            async () => {

                const codigoAGuardar =
                    inputFormulario.value.trim();

                // =========================
                // VALIDACIÓN
                // =========================

                if (
                    !codigoAGuardar ||
                    codigoAGuardar === 'undefined'
                ) {

                    alert(
                        "Primero debes escanear un código válido."
                    );

                    return;
                }

                try {

                    // =========================
                    // FORM DATA
                    // =========================

                    const formData =
                        new URLSearchParams();

                    // IMPORTANTE:
                    // Tu API espera "codigo"
                    formData.append(
                        'codigo',
                        codigoAGuardar
                    );

                    // =========================
                    // FETCH
                    // =========================

                    const respuesta =
                        await fetch(
                            API_BASE_URL,
                            {

                                method: 'POST',

                                headers: {
                                    'Content-Type':
                                        'application/x-www-form-urlencoded'
                                },

                                body: formData
                            }
                        );

                    const datos =
                        await respuesta.json();

                    console.log(
                        "Respuesta API:",
                        datos
                    );

                    // =========================
                    // PRODUCTO EXISTENTE
                    // =========================

                    if (
                        datos.status === 'existe'
                    ) {

                        alert(
                            "Producto actualizado correctamente\n\n" +
                            "Nueva cantidad: " +
                            datos.nueva_cantidad
                        );

                        inputFormulario.value = "";

                        return;
                    }

                    // =========================
                    // PRODUCTO NUEVO
                    // =========================

                    if (
                        datos.status === 'nuevo'
                    ) {

                        alert(
                            "Producto no registrado.\n" +
                            "Se abrirá el formulario."
                        );

                        // IMPORTANTE:
                        // Tu form.js usa modeAdd
                        window.location.href =
                            `form.html?modeAdd=${encodeURIComponent(codigoAGuardar)}`;

                        return;
                    }

                    // =========================
                    // ERROR SERVIDOR
                    // =========================

                    if (datos.error) {

                        alert(
                            "Error:\n" +
                            datos.error
                        );

                        return;
                    }

                    // =========================
                    // RESPUESTA RARA
                    // =========================

                    console.warn(
                        "Respuesta inesperada:",
                        datos
                    );

                    alert(
                        "Respuesta inesperada del servidor."
                    );

                } catch (error) {

                    console.error(
                        "Error Fetch:",
                        error
                    );

                    alert(
                        "No se pudo conectar con el servidor.\n\n" +
                        "Verifica:\n" +
                        "- Que el hosting esté activo\n" +
                        "- Que tengas internet\n" +
                        "- Que la API responda correctamente"
                    );
                }
            }
        );
    }

}, false);