const API_SEND_URL = 'https://elrjtd.online/DDI/API/firebase/sendNotification.php';

let listenerNotification = (message) => {
    console.log("firebaseLogs default listener", message);

};


/*
 * funcion principal para recibir notificaciones
 * @param {(message)=>{}} el listener que recibira la notificación
 */
function setNotificationListener(listener) {
    
    listenerNotification = listener;
    console.log("firebaseLogs new listener setted",listenerNotification);
}
/* Calcula el precio total de un producto aplicando impuestos y un descuento opcional.
 * @param {string} title - el titulo de la notificación
 * @param {string} body - texto dentro de la notificación
 * @param {array} [data = undefined] - un array de datos para enviar
 * @returns {number} El precio final neto redondeado a dos decimales.
 */
async function sendNotification(title, body, data = undefined) {
    const UUID = "as_as_as";//localStorage.getItem("UUID");

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

function onListener(message) {
    console.log("firebaseLogs try call listener ");
    console.log("firebaseLogs listener is setted?  ",listenerNotification != undefined && listenerNotification != null? true:false);
    
    if (listenerNotification != undefined && listenerNotification != null) {
        listenerNotification(message);
    }
    else {
        console.log("firebaseLogs no se encontro un listener");

    }

}

function fbListeners() {
    decoradorObtenerFBToken()

    window.FirebasexMessaging.onTokenRefresh(function (token) {
        localStorage.setItem("helloFBToken", token)
        console.log("firebaseLogs token", token);

        console.log("firebaseLogs token actualizado");
    }, function (error) {
        // Error al refrescar el Firebase Token
    })

    window.FirebasexMessaging.onMessageReceived(function (message) {
        console.log("firebaseLogs Message type: " + message.messageType);
        console.log("firebaseLogs Message body: " + message.body);
        console.log("firebaseLogs Message title: " + message.title);
        console.log("firebaseLogs Message data: " + message.data);
        let mensaje = (message.body || "Sin mensaje")

        onListener(message);

        fbOnPushNotification(mensaje)
    })


}
function obtenerFBToken() {
    window.FirebasexMessaging.getToken(function (token) {
        if (token) {
            console.log("firebaseLogs Firebase Token", token)
            localStorage.setItem("helloFBToken", token)
            console.log("firebaseLogs token recibido");

            return
        }
    }, function (error) {
        // Error al obtener Firebase Token
    })
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
    alert(mensaje)
}

esperarFirebasePlugin()

