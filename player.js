"use strict";

let ws = null;

/*************************************************
* EN AQUEST APARTAT POTS AFEGIR O MODIFICAR CODI *
*************************************************/

///////////////////////////////////////////////////////////
// ALUMNE: 
///////////////////////////////////////////////////////////

// Gestor de l'esdeveniment per les tecles
// Ha d'enviar el missatge corresponent al servidor
//	per informar de les accions del jugador
// Tecles ASDW i fletxes per indicar la direcció
//	esquerra, avall, dreta i amunt (respectivament)
// Tecles Espai i Intro per agafar/deixar una pedra
function direccio(ev) {
    if (!ws) return;

    let direction = { x: 0, y: 0 };
    let type = 'direccio';

    switch(ev.key) {
        // Left movement
        case 'a':
        case 'A':
        case 'ArrowLeft':
            direction.x = -1;
            break;

        // Right movement
        case 'd':
        case 'D':
        case 'ArrowRight':
            direction.x = 1;
            break;

        // Up movement
        case 'w':
        case 'W':
        case 'ArrowUp':
            direction.y = -1;
            break;

        // Down movement
        case 's':
        case 'S':
        case 'ArrowDown':
            direction.y = 1;
            break;

        // Pick up/drop stone
        case ' ':
        case 'Enter':
            type = 'agafar';
            direction = null;
            break;

        default:
            return;
    }

    ws.send(JSON.stringify({
        type: type,
        direccio: direction
    }));
}

// Establir la connexió amb el servidor en el port 8180
//	S'ha poder accedir utilitzant localhost o una adreça IP local
// Crear els gestors dels esdeveniments de la connexió:
//	- a l'establir la connexió (open): enviar missatge al servidor indicant que s'ha d'afegir un jugador
//	- si es tanca la connexió (close): informar amb alert() i tornar a la pàgina principal (index.html)
//	- en cas d'error: mostrar l'error amb alert() i tornar a la pàgina principal (index.html)
//	- quan arriba un missatge (tipus de missatge):
//		- connectat: agafar l'identificador i guardar-lo a la variable 'id'
//		- configurar: cridar la funció configurar() passant-li les dades de configuració
//			i actualitzar el valor de l'input 'pisos'
//		- dibuixar: cridar la funció dibuixar() passant-li les dades per dibuixar jugadors, pedres i piràmides (punts)
//		- missatge: mostrar el missatge per consola
// Afegir el gestor d'esdeveniments per les tecles
function init() {
    // Establish WebSocket connection
    ws = new WebSocket('ws://localhost:8180');

    // Connection event handlers
    ws.onopen = () => {
        console.log('WebSocket connection established');
        ws.send(JSON.stringify({ type: 'jugador' }));
    };

    ws.onclose = () => {
        alert('Connexió tancada');
        window.location.href = 'index.html';
    };

    ws.onerror = (error) => {
        alert('Error: ' + error.message);
        window.location.href = 'index.html';
    };

    ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        console.log('Player received:', message); // Add logging

        switch(message.type) {
            case 'init':
                id = message.id;
                configurar(message.config);
                document.getElementById('pisos').value = message.config.pisos;
                break;

            case 'config':
                configurar(message);
                document.getElementById('pisos').value = message.pisos;
                break;
            case 'dibuixar':
                const gameState = {
                    jugadors: Array.isArray(message.jugadors) ? message.jugadors : [],
                    pedres: message.pedres || [],
                    punts: message.punts || [0, 0]
                };
                dibuixar(gameState.jugadors, gameState.pedres, gameState.punts);
                break;

            case 'message':
                console.log('Missatge del servidor:', message.text);
                break;

            default:
                console.log('Unknown message type:', message.type);
        }
    };

    // Add keyboard event listener
    document.addEventListener('keydown', direccio);
}

/***********************************************
* FINAL DE L'APARTAT ON POTS FER MODIFICACIONS *
***********************************************/

window.onload = init;

