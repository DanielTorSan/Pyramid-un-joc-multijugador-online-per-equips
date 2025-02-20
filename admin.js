"use strict";

let ws = null;

/*************************************************
* EN AQUEST APARTAT POTS AFEGIR O MODIFICAR CODI *
*************************************************/

///////////////////////////////////////////////////////////
// ALUMNE: 
///////////////////////////////////////////////////////////

// Gestor d'esdeveniment del botó 'Configurar'
// Enviar missatge 'config' amb les dades per configurar el servidor
function setConfig() {
    if (!ws) return;
    
    const width = parseInt(document.getElementById('width').value);
    const height = parseInt(document.getElementById('height').value);
    const pisos = parseInt(document.getElementById('pisos').value);
    
    ws.send(JSON.stringify({
        type: 'config',
        width: width,
        height: height,
        pisos: pisos
    }));
}

// Gestor d'esdeveniment del botó 'Engegar/Aturar'
// Enviar missatge 'start' o 'stop' al servidor
function startStop() {
    if (!ws) return;
    
    const button = document.getElementById('startStop');
    const type = button.textContent === 'Engegar' ? 'start' : 'stop';
    
    ws.send(JSON.stringify({ type: type }));
}

// Establir la connexió amb el servidor en el port 8180
//	S'ha poder accedir utilitzant localhost o una adreça IP local
// Gestionar esdeveniments de la connexió
//	- a l'establir la connexió (open): enviar missatge al servidor indicant que s'ha d'afegir l'administrador
//	- si es tanca la connexió (close): informar amb alert() i tornar a la pàgina principal (index.html)
//	- en cas d'error: mostrar l'error amb alert() i tornar a la pàgina principal (index.html)
//	- quan arriba un missatge (tipus de missatge):
//		- configurar: cridar la funció configurar() passant-li les dades de configuració
//			i actualitzar els valors dels inputs 'width', 'height' i 'pisos'
//		- dibuixar: cridar la funció dibuixar() passant-li les dades per dibuixar jugadors, pedres i piràmides (punts)
//		- engegar: canviar el text del botó 'Engegar' per 'Aturar'
//		- aturar: canviar el text del botó 'Aturar' per 'Engegar'
//		- missatge: mostrar el missatge per consola
// Afegir gestors d'esdeveniments pels botons 'Configurar' i 'Engegar/Aturar'
function init() {
    // Establish WebSocket connection
    ws = new WebSocket('ws://localhost:8180');
    
    // Connection opened - send admin registration
    ws.onopen = () => {
        console.log('WebSocket connection established');
        ws.send(JSON.stringify({ type: 'admin' }));
    };
    
    // Connection closed
    ws.onclose = () => {
        alert('Connexió tancada');
        window.location.href = 'index.html';
    };
    
    // Connection error
    ws.onerror = (error) => {
        alert('Error: ' + error.message);
        window.location.href = 'index.html';
    };
    
    // Message received
    ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        console.log('Admin received:', message);
        
        switch(message.type) {
            case 'config':
                // Update game configuration
                configurar(message);
                // Update form inputs
                document.getElementById('width').value = message.width;
                document.getElementById('height').value = message.height;
                document.getElementById('pisos').value = message.pisos;
                break;
                
            case 'dibuixar':
                // Ensure data is in correct format before drawing
                const gameState = {
                    jugadors: Array.isArray(message.jugadors) ? message.jugadors : [],
                    pedres: message.pedres || [],
                    punts: message.punts || [0, 0]
                };
                dibuixar(gameState.jugadors, gameState.pedres, gameState.punts);
                break;
                
            case 'start':
                document.getElementById('startStop').textContent = 'Aturar';
                break;
                
            case 'stop':
                document.getElementById('startStop').textContent = 'Engegar';
                break;
                
            case 'message':
                console.log('Server message:', message.text);
                break;
                
            default:
                console.log('Unknown message type:', message.type);
        }
    };
    
    // Add event listeners for buttons
    document.getElementById('config').addEventListener('click', setConfig);
    document.getElementById('startStop').addEventListener('click', startStop);
}

/***********************************************
* FINAL DE L'APARTAT ON POTS FER MODIFICACIONS *
***********************************************/

window.onload = init;

