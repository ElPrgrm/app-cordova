document.addEventListener('deviceready', function() {
    const barkoderView = document.getElementById('barkoderView');
    const startScanBtn = document.getElementById('startScanBtn');
    const stopScanBtn = document.getElementById('stopScanBtn');

    //al clikear escanear se expande el div para la camara
    startScanBtn.addEventListener("click",()=> {

        barkoderView.style.display="block";
        });
            //el terminar de escanear o detener se cierra la camara y vuelve a la normalidad
        stopScanBtn.addEventListener("click",()=> {

            barkoderView.style.display="none";

          });
    const resultContainer = document.getElementById('resultContainer');
    const resultText = document.getElementById('resultText');
    const resultType = document.getElementById('resultType');
    const resultImage = document.getElementById('resultImage');
    
    let isScanning = false;

    startScanBtn.disabled = false;
//codigos permitidos pd:se puede modificar segun la pagina
    const setActiveBarcodeTypes = async () => {
        try {
            await window.Barkoder.setBarcodeTypeEnabled(BarcodeType.code128, true);
            await window.Barkoder.setBarcodeTypeEnabled(BarcodeType.code39, true);
            // add other barcode types here
            await window.Barkoder.setBarcodeTypeEnabled(BarcodeType.ean13, true);
        } catch (error) {
            console.error('Error setting active barcode types:', error);
        }
    };

    const setBarkoderSettings = async () => {
        try {
            window.Barkoder.setRegionOfInterestVisible(true);
            window.Barkoder.setRegionOfInterest(5, 5, 90, 90);
            window.Barkoder.setCloseSessionOnResultEnabled(false);
            window.Barkoder.setImageResultEnabled(true);
            window.Barkoder.setBarcodeThumbnailOnResultEnabled(true);
            window.Barkoder.setBeepOnSuccessEnabled(true);
            window.Barkoder.setPinchToZoomEnabled(true);
            window.Barkoder.setZoomFactor(2.0);
        } catch (error) {
            console.error('Error setting Barkoder settings:', error);
        }
    };

    const startScanning = async () => {
        isScanning = true;
        startScanBtn.disabled = true;
        stopScanBtn.disabled = false;
        resultContainer.style.display = 'none';

        try {
            const boundingRect = barkoderView.getBoundingClientRect();

            window.Barkoder.registerWithLicenseKey('ADD_YOUR_LICENSE_KEY_HERE');

            await new Promise((resolve, reject) => {
                window.Barkoder.initialize(
                    Math.round(boundingRect.width),
                    Math.round(boundingRect.height),
                    Math.round(boundingRect.x),
                    Math.round(boundingRect.y),
                    () => resolve(),
                    (error) => reject('Initialization error: ' + error)
                );
            });

            await setBarkoderSettings();
            await setActiveBarcodeTypes();

            window.Barkoder.startScanning(
                (barkoderResult) => {

                    document.getElementById("input-codigo-manual").value = barkoderResult.textualData;

                    resultText.textContent = barkoderResult.textualData;
                    resultText.href = barkoderResult.textualData;
                    resultType.textContent = barkoderResult.barcodeTypeName;
                    resultImage.src = "data:image/jpeg;base64," + barkoderResult.resultThumbnailAsBase64;
                    resultContainer.style.display = 'block';
                    window.Barkoder.stopScanning();

                    barkoderView.style.display = "none";
                    isScanning = false;
                    startScanBtn.disabled = false;
                    stopScanBtn.disabled = true;
                },
                (error) => console.error('Scanning error:', error)
            );
        } catch (error) {
            alert('Error: ' + error);
            isScanning = false;
            startScanBtn.disabled = false;
            stopScanBtn.disabled = true;
        }
    };

    const stopScanning = () => {
        window.Barkoder.stopScanning(
            () => {
                isScanning = false;
                startScanBtn.disabled = false;
                stopScanBtn.disabled = true;
            },
            (error) => console.error('Stop scanning error:', error)
        );
    };

    startScanBtn.addEventListener('click', startScanning);
    stopScanBtn.addEventListener('click', stopScanning);
}, false);