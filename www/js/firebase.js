let listenerNotification = (message) =>{
    console.log("firebaseLogs default listener",message);
    
};


/*
 * funcion principal para recibir notificaciones
 * @param {(message)=>{}} el listener que recibira la notificación
 */
function setNotificationListener(listener){
    listenerNotification = listener;
}
/* Calcula el precio total de un producto aplicando impuestos y un descuento opcional.
 * @param {string} title - el titulo de la notificación
 * @param {string} body - texto dentro de la notificación
 * @param {array} [data = undefined] - un array de datos para enviar
 * @returns {number} El precio final neto redondeado a dos decimales.
 */
function sendNotification(title,body,data = undefined){
    

}

function onListener(message){
    if(listenerNotification != undefined && listenerNotification != null ){
        listenerNotification(onmessage);
    }
    else{
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

