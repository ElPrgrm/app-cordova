
(function () {
    const API_SEND_URL = 'https://elrjtd.online/DDI/API/firebase/sendNotification.php';
    const API_UPDATE_TOKEN_URL = 'https://elrjtd.online/DDI/API/firebase/update_token.php';

    const FirebaseEvents = Object.freeze({
        MESSAGERECEIVED: "MESSAGERECEIVED",
        TOKENUPDATED: "TOKENUPDATED",
        ERROR: "ERROR"
    });

    let activePageListener = null;

    function emitirA_Pagina(event, message) {
        if (activePageListener && typeof activePageListener === 'function') {
            activePageListener(event, message);
        } else {
            console.log(`FirebaseCore: Evento [${event}] recibido, pero la página actual no tiene un listener activo.`);
        }
    }

    function inicializarPlugin() {
        if (!window.FirebasexMessaging) {
            setTimeout(inicializarPlugin, 3000);
            return;
        }

        window.FirebasexMessaging.hasPermission((granted) => {
            if (!granted) {
                window.FirebasexMessaging.grantPermission(
                    () => configurarListenersNativos(),
                    () => emitirA_Pagina(FirebaseEvents.ERROR, "Sin permisos otorgados")
                );
                return;
            }
            configurarListenersNativos();
        });
    }

    function configurarListenersNativos() {
        window.FirebasexMessaging.onMessageReceived((message) => {
            emitirA_Pagina(FirebaseEvents.MESSAGERECEIVED, message);
        });

        window.FirebasexMessaging.onTokenRefresh((token) => {
            sincronizarTokenConServidor(token);
        }, () => emitirA_Pagina(FirebaseEvents.ERROR, "Error al refrescar token"));

        window.FirebasexMessaging.getToken((token) => {
            sincronizarTokenConServidor(token);
        }, () => emitirA_Pagina(FirebaseEvents.ERROR, "Error al obtener token inicial"));
    }

    async function sincronizarTokenConServidor(token) {
        const UUID = localStorage.getItem("UUID");
        if (!UUID) return;

        try {
            const response = await fetch(API_UPDATE_TOKEN_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ UUID:UUID, token: token })
            });
            const res = await response.json();
            if (res.status === 200 && res.success) {
                emitirA_Pagina(FirebaseEvents.TOKENUPDATED, "token actualizado");
            }
        } catch (e) {
            emitirA_Pagina(FirebaseEvents.ERROR, "Error de red al actualizar token");
        }
    }

    window.AppFirebase = {
        Events: FirebaseEvents,

        setListener: function (listener) {
            activePageListener = listener;
            console.log("FirebaseCore: Nuevo listener asignado por la página actual.");
        },

        /* manda la notificación a los dispositivos validos
        * @param {string} title - el titulo de la notificación
        * @param {string} body - texto dentro de la notificación
        * @param {array} [data = undefined] - un array de datos para enviar(clave y valor deben ser string)
        * @param {string} [reasonkey = notify] - palabra clave para que el remitente sepa que hacer con ella
        * @returns { async} la espera de respuesta.
         */
        sendNotification: async function (title, body, additionalData = {}, reasonKey = "notify") {
            const UUID = localStorage.getItem("UUID");
            if (!UUID) return "sin sesión encontrada";

            additionalData.reasonKey = reasonKey;

            try {
                const response = await fetch(API_SEND_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ UUID, title, body, data: additionalData })
                });
                return response.ok;
            } catch (error) {
                return false;
            }
        }
    };

    inicializarPlugin();

})();