const API_BASE_URL = 'http://127.0.0.1/DDI/API/productos.php';
let formInitialized = false;
let currentProductId = null;


document.addEventListener('deviceready', function() {
    // 1. Referencias a HTML
    const barkoderView = document.getElementById('barkoderView');
    const startScanBtn = document.getElementById('startScanBtn');
    const stopScanBtn = document.getElementById('stopScanBtn');
    const inputFormulario = document.getElementById("input-codigo-manual");
    
    // Referencias al contenedor de resultados visuales (opcional)
    const resultContainer = document.getElementById('resultContainer');
    const resultText = document.getElementById('resultText');
    const resultType = document.getElementById('resultType');
    const resultImage = document.getElementById('resultImage');
    
    let isScanning = false;

    if (startScanBtn) startScanBtn.disabled = false;

    // 2. Configurar códigos permitidos
    const setActiveBarcodeTypes = async () => {
        try {
            await window.Barkoder.setBarcodeTypeEnabled(BarcodeType.code128, true);
            await window.Barkoder.setBarcodeTypeEnabled(BarcodeType.code39, true);
            await window.Barkoder.setBarcodeTypeEnabled(BarcodeType.ean13, true);
        } catch (error) {
            console.error('Error config tipos:', error);
        }
    };

    // 3. Ajustes de camaara
    const setBarkoderSettings = async () => {
        try {
            window.Barkoder.setRegionOfInterestVisible(true);
            window.Barkoder.setRegionOfInterest(5, 5, 90, 90);
            
            //  terminer la sesión de escaner  interna al encontrar el código
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

    // 4. Función de reinicio de interfaz
    const resetUI = () => {
        if (startScanBtn) startScanBtn.disabled = false;
        if (stopScanBtn) stopScanBtn.disabled = true;
        if (barkoderView) barkoderView.style.display = "none"; // Oculta el recuadro negro/rojo
    };

   
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

            window.Barkoder.startScanning(
                (resultado) => {
                    console.log("OBJETO ESCANEADO ", JSON.stringify(resultado));

                    // Extracción garantizada basada en tu respuesta de consola
                    let numeroDetectado = "";
                    if (resultado && resultado.decoderResults && resultado.decoderResults.length > 0) {
                        numeroDetectado = resultado.decoderResults[0].textualData;
                    } else {
                        numeroDetectado = resultado.textualData || resultado.text || "";
                    }

                    console.log("NÚMERO EXTRAÍDO:", numeroDetectado);

                    // Escribimos en el formulario de inmediato
                    if (inputFormulario) {
                        inputFormulario.value = numeroDetectado;
                    }

                    // Actualizamos la miniatura visual inferior (opcional)
                    if (resultado && resultado.decoderResults && resultado.decoderResults.length > 0) {
                        if (resultText) {
                            resultText.textContent = numeroDetectado;
                            resultText.href = numeroDetectado;
                        }
                        if (resultType) resultType.textContent = resultado.decoderResults[0].barcodeTypeName;
                    }

                    // FORZAR CIERRE AUTOMÁTICO DE LA CÁMARA TRAS LA DETECCIÓN
                    window.Barkoder.stopScanning(
                        () => {
                            isScanning = false;
                            resetUI(); // Oculta la vista HTML y reestablece botones
                        },
                        (error) => {
                            console.error('Error al forzar cierre automático:', error);
                            isScanning = false;
                            resetUI();
                        }
                    );
                },
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

    // 6. Detención manual 
    const stopScanning = () => {
        window.Barkoder.stopScanning(
            () => {
                isScanning = false;
                resetUI();
            },
            (error) => console.error('Error al detener manualmente:', error)
        );
    };

    // 7. Asignar eventos a los botones
    if (startScanBtn) startScanBtn.addEventListener('click', startScanning);
    if (stopScanBtn) stopScanBtn.addEventListener('click', stopScanning);

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    const btnGuardar = document.getElementById('btnGuardar');

    if (btnGuardar) {
        btnGuardar.addEventListener('click', () => {
            const codigoAGuardar = inputFormulario.value;

            if (!codigoAGuardar || codigoAGuardar === 'undefined') {
                alert("Primero debes escanear un código válido.");
                return;
            }

            // IMPORTANTE: Cambia '192.168.X.X' por la dirección IP real de tu computadora en tu red Wi-Fi
            const urlServidor = 'http://192.168.1.14/PuntoVenta/www/api/procesar_codigo.php';

            // Preparamos los datos para enviarlos por POST
            const formData = new URLSearchParams();
            formData.append('codigo', codigoAGuardar);

            fetch(urlServidor, {
                method: 'POST',
                body: formData
            })
            .then(respuesta => respuesta.json())
            .then(datos => {
                if (datos.status === 'existe') {
                    // El producto existía y se sumó 1 a la base de datos
                    alert("¡Producto actualizado! Nueva cantidad: " + datos.nueva_cantidad);
                    inputFormulario.value = ""; // Limpiamos el input
                } else if (datos.status === 'nuevo') {
                    // El producto no existe, redirigimos a form.html pasando el código por la URL
                    window.location.href = `form.html?codigo=${codigoAGuardar}`;
                } else if (datos.error) {
                    alert("Error en el servidor: " + datos.error);
                }
            })
            .catch(error => {
                console.error('Error en la petición Fetch:', error);
                alert("No se pudo conectar con el servidor. Revisa tu conexión y la IP.");
            });
        });
    }

}, false);