el js de firebase  siempre debera estar antes del codigo js de su modulo.

Ejemplo: 
     <script src="js/firebase-core.js"></script>D
     <script src="js/form.js"></script>


en su js, una vez se inicializo el dom, se podran conectar a firebase.

```javascript   
    window.addEventListener('DOMContentLoaded', conectarAFirebase);
    document.addEventListener('deviceready', conectarAFirebase);
```

# Eventos
para escuchar los eventos de firebase usar el siguiente fragmento de codigo:
           
```javascript
        window.AppFirebase.setListener((event, message) => {

        switch (event) {
            case window.AppFirebase.Events.MESSAGERECEIVED:
               showMessage(msg.data_1)
                break;

            case window.AppFirebase.Events.TOKENUPDATED:
                console.log("Token refrescado con éxito:", message);
                break;

            case window.AppFirebase.Events.ERROR:
                alert("Error en Firebase: " + message);
                break;
        }
    });
```
# Interactuar con notificaciones

al recibir el evento "MESSAGERECEIVED" el parametro message viene conformado por:
```javascript
message.title
message.body
message.reasonKey - razon por la que enviarón la notificación(sirve para saber si ignorar o no la misma)
message.nombre_dato(el nombre de los datos variara segun como lo mande cada modulo )
message.nombre_dato_n(la cantidad de datos recibidos puede no tener limite)
```

# Enviar notificación

finalmente, para enviar una notificación:

```javascript
    * @param {string} title - el titulo de la notificación
    * @param {string} body - texto dentro de la notificación
    * @param {array} [data = undefined] - un array de datos para enviar(clave y valor deben ser string)
    * @param {string} [reasonKey="notify"] - Razón o palabra clave por la que se hace esto
    * @returns {Promise<boolean>} Devuelve si la petición fue exitosa
    */
    window.AppFirebase.sendNotification(" titulo de muestra","descripcion de notificacion",{"dato_1":"su contenido","dato_n":"su contenido"},"producto agregado")
```
SI NO SE LE PASARA DATA, PASAR COMO PARAMETRO UN ARRAY VACIO ->  {}
donde el primer parametro sera el titulo de la notificación.
el segundo sera para la descripcion,
el tercero un array de datos OPCIONALES si se considera que deben pasar algo con lo que otros usuarios interactuen,
y el cuarto es una palabra clave para saber porque se mando la notificación.

