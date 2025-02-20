"use strict";

let connexio;
let id;
let enJoc = false;

// Función para manejar los mensajes del servidor
function handleServerMessage(event) {
    const missatge = JSON.parse(event.data);

    switch (missatge.type) {
        case 'connectat':
            id = missatge.id;
            break;
        case 'configurar':
            document.getElementById("pisos").value = missatge.config.pisos;
            configurar(missatge.config);
            console.log("Nueva configuración recibida:", config);
            break;
        case 'engegar':
            enJoc = true;
            console.log("Joc engegat");
            break;
        case 'aturar':
            enJoc = false;
            console.log("Joc aturat");
            break;
        case 'missatge':
            console.log(missatge.text);
            break;
    }
}

// Función para enviar la dirección del jugador al servidor
function direccio(ev) {
    let accio = null;

    switch (ev.key) {
        case 'a': case 'ArrowLeft':
            accio = 'left';
            break;
        case 'd': case 'ArrowRight':
            accio = 'right';
            break;
        case 'w': case 'ArrowUp':
            accio = 'up';
            break;
        case 's': case 'ArrowDown':
            accio = 'down';
            break;
        case ' ': case 'Enter':
            accio = 'toggle_stone';
            break;
    }

    if (accio) {
        connexio.send(JSON.stringify({
            type: 'action',
            id: id,
            action: accio
        }));
    }
}

// Inicializar la conexión WebSocket y manejar mensajes
function init() {
    connexio = new WebSocket('ws://localhost:8180');

    connexio.onopen = function () {
        connexio.send(JSON.stringify({ type: 'new_player' }));
    };

    connexio.onmessage = handleServerMessage;

    connexio.onclose = function () {
        alert('Connexió tancada');
        window.location.href = 'index.html';
    };

    connexio.onerror = function () {
        alert('Error de connexió');
        window.location.href = 'index.html';
    };

    window.addEventListener('keydown', direccio);
}

window.onload = init;