/******************************************************************************
*						SERVIDOR WEB (port 8080)
******************************************************************************/

var http = require('http');
var url = require('url');
var fs = require('fs');

function header(resposta, codi, cType) {
	resposta.setHeader('Access-Control-Allow-Origin', '*');
	resposta.setHeader('Access-Control-Allow-Methods', 'GET');
	if (cType) resposta.writeHead(codi, {'Content-Type': cType});
	else resposta.writeHead(codi);
}

function enviarArxiu(resposta, dades, filename, cType, err) {
	if (err) {
		header(resposta, 400, 'text/html');
		resposta.end("<p style='text-align:center;font-size:1.2rem;font-weight:bold;color:red'>Error al l legir l'arxiu</p>");
		return;
	}

	header(resposta, 200, cType);
	resposta.write(dades);
	resposta.end();
}

function onRequest(peticio, resposta) {
	var cosPeticio = "";

	peticio.on('error', function(err) {
		console.error(err);
	}).on('data', function(dades) {
		cosPeticio += dades;
	}).on('end', function() {
		resposta.on('error', function(err) {
			console.error(err);
		});

		if (peticio.method == 'GET') {
			var q = url.parse(peticio.url, true);
			var filename = "." + q.pathname;

			if (filename == "./") filename += "index.html";
			if (fs.existsSync(filename)) {
				fs.readFile(filename, function(err, dades) {
					enviarArxiu(resposta, dades, filename, undefined, err);
				});
			}
			else {
				header(resposta, 404, 'text/html');
				resposta.end("<p style='text-align:center;font-size:1.2rem;font-weight:bold;color:red'>404 Not Found</p>");
			}
		}
	});
}

var server = http.createServer();
server.on('request', onRequest);
server.listen(8080);	



/******************************************************************************
*					SERVIDOR WEB SOCKETS (port 8180)
******************************************************************************/

// Factor d'escala
const ESCALA	 = 4;

// Nombre de pedres en la zona de joc
const MAXPED	 = 8;

// Increment del desplaçament horitzontal i vertical 
const INCHV		 = ESCALA;

// Mida del jugador i pedra
const MIDAJ		 = (4 * ESCALA);
const MIDAP		 = (2 * ESCALA);

// Mida de l'àrea de joc i piràmide
const MINH		 = (40 * MIDAJ);
const MAXH		 = (2 * MINH);
const MINV		 = (30 * MIDAJ);
const MAXV		 = (2 * MINV);

// Mínim i màxim nombre de files de la piràmide
const NFPMIN	 = 4;
const NFPMAX	 = 8;

// Mida dels bloc per construir les piràmides
const PH		 = (4 * ESCALA);
const PV		 = (3 * ESCALA);

// Mida de les zones per construir les piràmides
const PHMAX		 = (PH * NFPMAX);
const PVMAX		 = (PV * NFPMAX);



// Temps en ms entre cada moviment
const TEMPS		 = 100;



var config = {
	width:  MINH,
	height: MINV,
	pisos:  NFPMIN,
	pedres: (NFPMIN + 1) * NFPMIN / 2
};



/*************************************************
* EN AQUEST APARTAT POTS AFEGIR O MODIFICAR CODI *
*************************************************/

///////////////////////////////////////////////////////////
// ALUMNE: 
///////////////////////////////////////////////////////////

/********** Servidor WebSockets **********/

// Carregar el mòdul per WebSockets
let WebSocket;
try {
	WebSocket = require('ws');
} catch (e) {
	console.error("Error: Cannot find module 'ws'. Please install it by running 'npm install ws'.");
	process.exit(1);
}

// Crear servidor WebSocket
const wss = new WebSocket.Server({ port: 8180 });

// Añadir variables globales al inicio de la sección modificable
let admin = null;
let jugadors = new Map();
let pedres = [];
let punts = [0, 0];
let jocEnMarxa = false;

/********** Gestors dels principals esdeveniments **********/
// 'ws' és la connexió (socket) del client
// 'm' és el missatge que ha enviat el client

// Esdeveniment: ha arribat un missatge d'un client
// Ha de processar els possibles missatges:
//	- crear administrador
//	- crear jugador
//	- configurar el joc (mida de la zona de joc i pisos de la piràmide)
//	- engegar el joc
//	- aturar el joc
//	- agafar (o deixar) una pedra
//	- modificar la direcció
function processar(ws, missatge) {
    try {
        const m = JSON.parse(missatge);
        
        switch(m.type) {
            case 'admin':
                crearAdmin(ws, m);
                break;
            case 'jugador':
                crearJugador(ws, m);
                break;
            case 'config':
                configurar(ws, m);
                break;
            case 'start':
                start(ws, m);
                break;
            case 'stop':
                stop(ws, m);
                break;
            case 'agafar':
                agafar(ws, m);
                break;
            case 'direccio':
                direccio(ws, m);
                break;
            default:
                ws.send(JSON.stringify({type: 'error', message: 'Tipus de missatge desconegut'}));
        }
    } catch(e) {
        console.error('Error processant missatge:', e);
    }
}

// Esdeveniment: un client  ha tancat la connexió
// Tenir en compte si és un jugador
//	per comptar els que té cada equip
function tancar(ws) {
    if (ws === admin) {
        admin = null;
    }
    
    if (jugadors.has(ws)) {
        const jugador = jugadors.get(ws);
        jugadors.delete(ws);
    }
}



/********** Funcions auxiliars (es criden des de processar() 
*********** per gestionar els diferents missatges **********/

// Esdeveniment: crear usuari administrador
//	- si ja existeix un administrador
//		tancar la connexió indicant el motiu
//	- crear l'administrador i enviar-li la configuració actual:
//		mida de la zona de joc i pisos de la piràmide
function crearAdmin(ws, m) {
    if (admin) {
        ws.send(JSON.stringify({
            type: 'error',
            message: 'Ja existeix un administrador'
        }));
        ws.close();
        return;
    }
    
    admin = ws;
    ws.send(JSON.stringify({
        type: 'config',
        width: config.width,
        height: config.height,
        pisos: config.pisos
    }));
}

// Esdeveniment: crear jugador
//	- si el joc està en marxa
//		tancar la connexió indicant el motiu
//	- crear el jugador assignant-li un identificador
//		que ha de ser diferent per cada jugador
//	- se li ha d'assignar un equip (0 o 1):
//		s'ha d'intentar que el nombre de jugadors
//		de cada equip sigui el més semblant possible
//	- s'ha de situar el jugador en la zona de joc
//		sense que se solapi amb qualsevol altre
//	- enviar-li el seu identificador i la configuració actual:
//		mida de la zona de joc i pisos de la piràmide
function crearJugador(ws, m) {
    if (jocEnMarxa) {
        ws.send(JSON.stringify({
            type: 'error',
            message: 'El joc ja està en marxa'
        }));
        ws.close();
        return;
    }

    const id = Date.now(); // Identificador único
    const equip = calcularEquip();
    const posicio = calcularPosicioInicial(equip);
    
    const jugador = {
        id: id,
        equip: equip,
        x: posicio.x,
        y: posicio.y,
        direccio: { x: 0, y: 0 },
        pedra: null
    };
    
    jugadors.set(ws, jugador);
    
    ws.send(JSON.stringify({
        type: 'init',
        id: id,
        equip: equip,
        config: config
    }));
}

// Función auxiliar para calcular el equipo
function calcularEquip() {
    let equip0 = 0, equip1 = 0;
    jugadors.forEach(j => {
        if (j.equip === 0) equip0++;
        else equip1++;
    });
    return equip0 <= equip1 ? 0 : 1;
}

// Función auxiliar para calcular posición inicial
function calcularPosicioInicial(equip) {
    const x = equip === 0 ? MIDAJ * 2 : config.width - MIDAJ * 2;
    const y = MIDAJ * 2;
    return { x, y };
}

// Esborrar pedres (es crida des de configurar())
// Situar els jugadors en el costat dret o esquerre
//	segons l'equip, a intervals regulars
// Posar els punts dels dos equips a 0
function reiniciar() {
    // Clear stones
    pedres = [];
    
    // Reset points
    punts = [0, 0];
    
    // Reposition players
    let equip0Height = MIDAJ * 2;
    let equip1Height = MIDAJ * 2;
    
    jugadors.forEach((jugador, ws) => {
        jugador.pedra = null;
        jugador.y = jugador.equip === 0 ? equip0Height : equip1Height;
        jugador.x = jugador.equip === 0 ? MIDAJ * 2 : config.width - MIDAJ * 2;
        
        if (jugador.equip === 0) equip0Height += MIDAJ * 3;
        else equip1Height += MIDAJ * 3;
    });
}

// Esdeveniment: configurar
//	- si l'usuari no és l'administrador
//		tancar la connexió indicant el motiu
//	- si el joc està en marxa
//		tancar la connexió indicant el motiu
//	- comprovar que la configuració passada sigui correcta:
//		mides i número de pisos
//	- calcular el número de pedres en funció dels pisos:
//		config.pedres = (config.pisos + 1) * config.pisos / 2;
//	- cridar la funció reiniciar
//	- enviar la configuració a tothom
function configurar(ws, m) {
    if (ws !== admin) {
        ws.send(JSON.stringify({
            type: 'error',
            message: 'No ets l\'administrador'
        }));
        ws.close();
        return;
    }
    
    if (jocEnMarxa) {
        ws.send(JSON.stringify({
            type: 'error',
            message: 'El joc està en marxa'
        }));
        ws.close();
        return;
    }
    
    // Validate configuration
    if (m.width < MINH || m.width > MAXH || 
        m.height < MINV || m.height > MAXV ||
        m.pisos < NFPMIN || m.pisos > NFPMAX) {
        ws.send(JSON.stringify({
            type: 'error',
            message: 'Configuració incorrecta'
        }));
        return;
    }
    
    // Update configuration
    config.width = m.width;
    config.height = m.height;
    config.pisos = m.pisos;
    config.pedres = (config.pisos + 1) * config.pisos / 2;
    
    reiniciar();
    
    // Broadcast new configuration
    const configMsg = JSON.stringify({
        type: 'config',
        width: config.width,
        height: config.height,
        pisos: config.pisos
    });
    
    wss.clients.forEach(client => client.send(configMsg));
}

// Esdeveniment: engegar
//	- si l'usuari no és l'administrador
//		tancar la connexió indicant el motiu
//	- si el joc està en marxa
//		enviar missatge informatiu
//	- cridar la funció reiniciar, canviar l'estat del joc
//		i enviar-li missatge informatiu
function start(ws, m) {
    if (ws !== admin) {
        ws.send(JSON.stringify({
            type: 'error',
            message: 'No ets l\'administrador'
        }));
        ws.close();
        return;
    }
    
    if (jocEnMarxa) {
        ws.send(JSON.stringify({
            type: 'message',
            text: 'El joc ja està en marxa'
        }));
        return;
    }
    
    reiniciar();
    jocEnMarxa = true;
    
    wss.clients.forEach(client => {
        client.send(JSON.stringify({
            type: 'start'
        }));
    });
}

// Esdeveniment: aturar
//	- si l'usuari no és l'administrador
//		tancar la connexió indicant el motiu
//	- si el joc està aturat
//		enviar missatge informatiu
//	- canviar l'estat del joc
//		i enviar-li missatge informatiu
function stop(ws, m) {
    if (ws !== admin) {
        ws.send(JSON.stringify({
            type: 'error',
            message: 'No ets l\'administrador'
        }));
        ws.close();
        return;
    }
    
    if (!jocEnMarxa) {
        ws.send(JSON.stringify({
            type: 'message',
            text: 'El joc ja està aturat'
        }));
        return;
    }
    
    jocEnMarxa = false;
    
    wss.clients.forEach(client => {
        client.send(JSON.stringify({
            type: 'stop'
        }));
    });
}

// Esdeveniment: agafar / deixar
// Si el joc no està en marxa, no fer res
// Si el jugador no porta pedra:
//	- si està tocant (o a sobre) d'una pedra, agafar-la
// Si el jugador porta una pedra:
//	- si està fora de les zones de construcció, deixar la pedra
//	- si està en una zona de construcció que no és del seu equip, no deixar la pedra
//	- si està en la zeva zona de construcció, eliminar la pedra i afegir un punt al seu equip
//		si ja s'han posat totes les pedres, aturar el joc
function agafar(ws, m) {
    if (!jocEnMarxa) return;
    
    const jugador = jugadors.get(ws);
    if (!jugador) return;
    
    if (!jugador.pedra) {
        // Try to pick up a stone
        const pedraIndex = pedres.findIndex(pedra => 
            Math.abs(pedra.x - jugador.x) < MIDAJ + MIDAP &&
            Math.abs(pedra.y - jugador.y) < MIDAJ + MIDAP
        );
        
        if (pedraIndex >= 0) {
            jugador.pedra = pedres[pedraIndex];
            pedres.splice(pedraIndex, 1);
        }
    } else {
        // Check if player is in construction zone
        const inLeftZone = jugador.x < PHMAX;
        const inRightZone = jugador.x > config.width - PHMAX;
        
        if (!inLeftZone && !inRightZone) {
            // Drop stone outside construction zones
            pedres.push({...jugador.pedra});
            jugador.pedra = null;
        } else if ((inLeftZone && jugador.equip === 0) || 
                   (inRightZone && jugador.equip === 1)) {
            // Add point and remove stone
            punts[jugador.equip]++;
            jugador.pedra = null;
            
            // Check if game should end
            if (punts[0] + punts[1] >= config.pedres) {
                stop(admin, {});
            }
        }
    }
}

// Esdeveniment: direcció
//	Actualitzar la direcció del jugador
function direccio(ws, m) {
    const jugador = jugadors.get(ws);
    if (jugador) {
        jugador.direccio = m.direccio;
    }
}



/********** Temporitzador del joc **********/

// Cridar la funció mou() a intervals regulars (cada TEMPS mil·lisegons)
setInterval(mou, TEMPS);

// Esdeveniment periòdic (cada 'TEMPS' mil·lisegons):
//	- incrementar la posició de cada jugador
//		comprovant que no surt de la zona de joc
//		i que no se solapa amb cap altre jugador
//	- si el jugador porta una pedra
//		també s'ha d'actualitzar la posició de la pedra
//	- si s'està jugant i no hi ha el màxim de pedres en la zona de joc
//		afegir una pedra en una posició aleatòria
//		evitant que quedi dins de les zones de construcció de les piràmides
//	- enviar un missatge a tothom
//		amb les posicions dels jugadors, les pedres (només si el joc està en marxa)
//		i la puntuació de cada equip (un punt per cada pedra posada en la piràmide)
function mou() {
    // Update player positions
    jugadors.forEach((jugador, ws) => {
        const newX = jugador.x + (jugador.direccio.x * INCHV);
        const newY = jugador.y + (jugador.direccio.y * INCHV);
        
        // Check boundaries
        if (newX >= MIDAJ && newX <= config.width - MIDAJ) {
            jugador.x = newX;
        }
        if (newY >= MIDAJ && newY <= config.height - MIDAJ) {
            jugador.y = newY;
        }
        
        // Update stone position if player carries one
        if (jugador.pedra) {
            jugador.pedra.x = jugador.x;
            jugador.pedra.y = jugador.y;
        }
    });
    
    // Add new stone if needed
    if (jocEnMarxa && pedres.length < MAXPED) {
        const newStone = {
            x: PHMAX + Math.random() * (config.width - 2 * PHMAX),
            y: MIDAP + Math.random() * (config.height - 2 * MIDAP)
        };
        pedres.push(newStone);
    }
    
    // Broadcast game state
    const gameState = {
        type: 'dibuixar',
        jugadors: Array.from(jugadors.values()),
        pedres: jocEnMarxa ? pedres : [],
        punts: punts
    };
    
    wss.clients.forEach(client => {
        client.send(JSON.stringify(gameState));
    });
}

/***********************************************
* FINAL DE L'APARTAT ON POTS FER MODIFICACIONS *
***********************************************/

// Handle new connections
wss.on('connection', function(ws) {
    console.log('New client connected');

    // Handle client messages
    ws.on('message', function(missatge) {
        processar(ws, missatge);
    });

    // Handle client disconnection
    ws.on('close', function() {
        console.log('Client disconnected');
        tancar(ws);
    });
});

// Process incoming messages
function processar(ws, missatge) {
    try {
        const m = JSON.parse(missatge);
        
        switch(m.type) {
            case 'admin':
                crearAdmin(ws, m);
                break;
            case 'jugador':
                crearJugador(ws, m);
                break;
            case 'config':
                configurar(ws, m);
                break;
            case 'start':
                start(ws, m);
                break;
            case 'stop':
                stop(ws, m);
                break;
            case 'agafar':
                agafar(ws, m);
                break;
            case 'direccio':
                direccio(ws, m);
                break;
            default:
                ws.send(JSON.stringify({
                    type: 'error',
                    message: 'Unknown message type'
                }));
        }
    } catch(e) {
        console.error('Error processing message:', e);
    }
}

// Game loop - update positions and broadcast state
setInterval(function mou() {
    if (!jocEnMarxa) return;

    // Update player positions with collision detection
    jugadors.forEach((jugador, ws) => {
        const newX = jugador.x + (jugador.direccio.x * INCHV);
        const newY = jugador.y + (jugador.direccio.y * INCHV);
        
        // Check boundaries
        let canMoveX = newX >= MIDAJ && newX <= config.width - MIDAJ;
        let canMoveY = newY >= MIDAJ && newY <= config.height - MIDAJ;
        
        // Check player collisions
        jugadors.forEach((otherJugador, otherWs) => {
            if (ws !== otherWs) {
                const dx = Math.abs(newX - otherJugador.x);
                const dy = Math.abs(newY - otherJugador.y);
                if (dx < MIDAJ * 2 && dy < MIDAJ * 2) {
                    canMoveX = false;
                    canMoveY = false;
                }
            }
        });
        
        // Update position if movement is valid
        if (canMoveX) jugador.x = newX;
        if (canMoveY) jugador.y = newY;
        
        // Update stone position if player carries one
        if (jugador.pedra) {
            jugador.pedra.x = jugador.x;
            jugador.pedra.y = jugador.y;
        }
    });
    
    // Add new stones if needed
    if (pedres.length < MAXPED) {
        const newStone = {
            x: PHMAX + Math.random() * (config.width - 2 * PHMAX),
            y: MIDAP + Math.random() * (config.height - 2 * MIDAP)
        };
        pedres.push(newStone);
    }
    
    // Broadcast game state
    const gameState = {
        type: 'dibuixar',
        jugadors: Array.from(jugadors.values()),
        pedres: pedres,
        punts: punts
    };
    
    wss.clients.forEach(client => {
        client.send(JSON.stringify(gameState));
    });
}, TEMPS);

