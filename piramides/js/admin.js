"use strict";

// Declarar la variable 'connexio' en el ámbito global
let connexio;

// Función para inicializar la conexión WebSocket
function init() {
    // Conectar al servidor WebSocket
    connexio = new WebSocket('ws://localho:8180');

    // Cuando se abre la conexión
    connexio.onopen = function () {
        console.log("Connexió establerta amb el servidor.");
    };

    // Cuando se recibe un mensaje del servidor
    connexio.onmessage = function (event) {
        const missatge = JSON.parse(event.data);

        switch (missatge.type) {
            case 'configurar':
                console.log("Configuració rebuda:", missatge.config);
                document.getElementById("width").value = missatge.config.width;
                document.getElementById("height").value = missatge.config.height;
                document.getElementById("pisos").value = missatge.config.pisos;
                configurar(missatge.config);
                break;
            case 'engegar':
                document.getElementById('engegar').textContent = 'Aturar';
                break;
            case 'aturar':
                document.getElementById('engegar').textContent = 'Engegar';
                break;
            case 'missatge':
                console.log(missatge.text);
                break;
        }
    };

    // Cuando se cierra la conexión
    connexio.onclose = function () {
        alert('Connexió tancada');
        window.location.href = 'index.html';
    };

    // Cuando hay un error en la conexión
    connexio.onerror = function () {
        alert('Error de connexió');
        window.location.href = 'index.html';
    };

    // Asignar eventos a los botones
    document.getElementById('configurar').onclick = setConfig;
    document.getElementById('engegar').onclick = startStop;
}

// Función para enviar la configuración al servidor
function setConfig() {
    const config = {
        width: parseInt(document.getElementById('width').value),
        height: parseInt(document.getElementById('height').value),
        pisos: parseInt(document.getElementById('pisos').value)
    };

    connexio.send(JSON.stringify({
        type: 'configurar',
        config: config
    }));
}

// Función para iniciar o detener el juego
function startStop() {
    const button = document.getElementById('engegar');
    const action = button.textContent === 'Engegar' ? 'engegar' : 'aturar';

    connexio.send(JSON.stringify({
        type: action
    }));
}

// Inicializar la conexión cuando la página se carga
window.onload = init;