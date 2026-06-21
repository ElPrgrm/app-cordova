const API_SEND_URL = 'https://elrjtd.online/DDI/API/firebase/sendNotification.php';
const API_UPDATE_TOKEN_URL = 'https://elrjtd.online/DDI/API/firebase/update_token.php';

const events = Object.freeze({
    MESSAGERECEIVED: "MESSAGERECEIVED",
    TOKENUPDATED: "TOKENUPDATED",
    ERROR: "ERROR"
});







let listenerNotification = (event, message) => {
    console.log("firebaseLogs default listener message:", message);
    console.log("firebaseLogs default listener event:", event);

};


/*
 * funcion principal para recibir notificaciones
 * @param {(event,message)=>{}} el listener que recibira la notificación
 */
function setNotificationListener(listener) {

    listenerNotification = listener;
    console.log("firebaseLogs new listener setted", listenerNotification);
}
/* Calcula el precio total de un producto aplicando impuestos y un descuento opcional.
 * @param {string} title - el titulo de la notificación
 * @param {string} body - texto dentro de la notificación
 * @param {array} [data = undefined] - un array de datos para enviar
 * @returns {number} El precio final neto redondeado a dos decimales.
 */
async function sendNotification(title, body, data = undefined) {
    const UUID = localStorage.getItem("UUID");//localStorage.getItem("UUID");

    if (UUID == undefined || UUID == null) {
        return "sin sesión encontrada encontrado"
    }

    let dt = {
        "UUID": UUID,
        "title": title,
        "body": body,
        "data": data
    }
    try {
        const response = await fetch(API_SEND_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dt)
        });

        if (!response.ok) {
            const errorBody = await tryParseJson(response);
            console.log(errorBody);

            return null;// { success: false, error: errorBody?.error || `Error HTTP ${response.status}` };
        }
    } catch (error) {
        console.log(error);
        return null;
    }


    //return response.json();


}

function onListener(event, message) {

    if (listenerNotification != undefined && listenerNotification != null) {
        listenerNotification(event, message);
    }
    else {
        console.log("firebaseLogs no se encontro un listener");

    }

}

function fbListeners() {
    decoradorObtenerFBToken()

    window.FirebasexMessaging.onTokenRefresh(function (token) {
        if (token) {
            updateTokenServer(token);
        }
    }, function (error) {
        // Error al obtener Firebase Token
        onListener(events.ERROR, "no se logro obtener el token")
    })

    window.FirebasexMessaging.onMessageReceived(function (message) {

        onListener(events.MESSAGERECEIVED, message);

        //fbOnPushNotification(mensaje)
    })


}
function obtenerFBToken() {
    window.FirebasexMessaging.getToken(function (token) {
        if (token) {
            updateTokenServer(token);
        }
    }, function (error) {
        // Error al obtener Firebase Token
        onListener(events.ERROR, "no se logro obtener el token")
    })
}

function updateTokenServer(token) {

    const UUID = localStorage.getItem("UUID");

    if (UUID == undefined || UUID == null) {
        console.error("sin sesión encontrada ");
        return;
    }

    fetch(API_UPDATE_TOKEN_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ "token": token })
    })
        .then(response => response.json().then(data => ({ status: response.status, data: data })))
        .then(result => {


            if (result.status === 200 && result.data.success) {
                onListener(events.TOKENUPDATED, "token actualizado")
            } else {
                onListener(events.ERROR, "no se logro actualizar el token")
            }
        })
        .catch(() => {
             onListener(events.ERROR, "el servidor no respondio correctamente")
        });
}


function decoradorObtenerFBToken() {
    window.FirebasexMessaging.hasPermission(function (granted) {
        if (!granted) {
            window.FirebasexMessaging.grantPermission(function () {
                obtenerFBToken()
            }, function (error) {
                alert(" sin permiso para firebase")
                console.log("firebaseLogs sin permiso para firebase")
                // Error al solicitar permiso
            })

            return
        }

        obtenerFBToken()
    })
}
function esperarFirebasePlugin() {
    if (window.FirebasexMessaging) {
        console.log("firebaseLogs FirebasePlugin disponible, obteniendo token...")
        fbListeners()
    } else {
        console.log("firebaseLogs FirebasePlugin aún no disponible, reintentando...")
        setTimeout(esperarFirebasePlugin, 6000)
    }
}

let fbOnPushNotification = function (mensaje) {
    //alert(mensaje)
}

esperarFirebasePlugin()

