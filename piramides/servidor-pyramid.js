/******************************************************************************
*						SERVIDOR WEB (port 8080)
******************************************************************************/

var http = require('http');
var url = require('url');
var fs = require('fs');

function header(resposta, codi, cType) {
    resposta.setHeader('Access-Control-Allow-Origin', '*');
    resposta.setHeader('Access-Control-Allow-Methods', 'GET');
    if (cType) resposta.writeHead(codi, { 'Content-Type': cType });
    else resposta.writeHead(codi);
}

function enviarArxiu(resposta, dades, filename, cType, err) {
    if (err) {
        header(resposta, 400, 'text/html');
        resposta.end("<p style='text-align:center;font-size:1.2rem;font-weight:bold;color:red'>Error al llegir l'arxiu</p>");
        return;
    }

    header(resposta, 200, cType);
    resposta.write(dades);
    resposta.end();
}

function onRequest(peticio, resposta) {
    var cosPeticio = "";

    peticio.on('error', function (err) {
        console.error(err);
    }).on('data', function (dades) {
        cosPeticio += dades;
    }).on('end', function () {
        resposta.on('error', function (err) {
            console.error(err);
        });

        if (peticio.method == 'GET') {
            var q = url.parse(peticio.url, true);
            var filename = "." + q.pathname;

            if (filename == "./") filename += "index.html";
            if (fs.existsSync(filename)) {
                fs.readFile(filename, function (err, dades) {
                    enviarArxiu(resposta, dades, filename, undefined, err);
                });
            } else {
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

const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8180 });

let jugadors = {};
let pedres = [];
let enJoc = false;
let config = {
    width: 640,
    height: 480,
    pisos: 4,
    pedres: 10
};

// Cargar configuración guardada si existe
const configFile = "config.json";
if (fs.existsSync(configFile)) {
    try {
        config = JSON.parse(fs.readFileSync(configFile, "utf8"));
        console.log("Configuración cargada:", config);
    } catch (error) {
        console.error("Error al cargar la configuración:", error);
    }
}

function guardarConfiguracion() {
    fs.writeFileSync(configFile, JSON.stringify(config, null, 2));
}

// Función para enviar la configuración a todos los clientes
function enviarConfiguracio(ws = null) {
    const missatge = {
        type: 'configurar',
        config: config
    };
    if (ws) {
        ws.send(JSON.stringify(missatge));
    } else {
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(missatge));
            }
        });
    }
}

// Función para iniciar el juego
function engegarJoc() {
    enJoc = true;
    crearJugadorsInicials(); // Crear jugadores iniciales
    const missatge = {
        type: 'engegar'
    };
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(missatge));
        }
    });
}

// Función para detener el juego
function aturarJoc() {
    enJoc = false;
    jugadors = {}; // Vaciar la lista de jugadores
    const missatge = {
        type: 'aturar'
    };
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(missatge));
        }
    });
}

// Función para generar una posición aleatoria
function generarPosicioAleatoria() {
    return {
        x: Math.floor(Math.random() * 600), // Dentro del área de juego
        y: Math.floor(Math.random() * 400)
    };
}

// Función para detectar colisiones
function detectarColisio(jugador) {
    for (let id in jugadors) {
        if (id !== jugador.id) {
            const altreJugador = jugadors[id];
            if (
                jugador.x < altreJugador.x + 16 &&
                jugador.x + 16 > altreJugador.x &&
                jugador.y < altreJugador.y + 16 &&
                jugador.y + 16 > altreJugador.y
            ) {
                return true; // Hay colisión
            }
        }
    }
    return false; // No hay colisión
}

wss.on('connection', function connection(ws) {
    // Enviar la configuración actual al cliente cuando se conecta
    enviarConfiguracio(ws);

    ws.on('message', function incoming(message) {
        processar(ws, message);
    });

    ws.on('close', function () {
        tancar(ws);
    });
});

function processar(ws, missatge) {
    try {
        let data = JSON.parse(missatge);

        switch (data.type) {
            case 'new_player':
                crearJugador(ws, data);
                break;
            case 'action':
                if (jugadors[data.id]) {
                    if (data.action === 'toggle_stone') {
                        agafar(ws, data);
                    } else {
                        direccio(ws, data);
                    }
                }
                break;
            case 'configurar':
                config = data.config;
                console.log("Nueva configuración recibida:", config);
                guardarConfiguracion();
                enviarConfiguracio();
                break;
            case 'engegar':
                engegarJoc();
                console.log("Joc engegat");
                break;
            case 'aturar':
                aturarJoc();
                console.log("Joc aturat");
                break;
            default:
                console.log("Missatge no reconegut:", data);
        }
    } catch (error) {
        console.error("Error en processar el missatge:", error);
    }
}

function crearJugador(ws, m) {
    let id = Object.keys(jugadors).length + 1;
    let team = id % 2; // Asignar equipo alternando entre 0 y 1
    jugadors[id] = { id, x: 100, y: 100, direccio: "none", portaPedra: false, team, ws };
    ws.send(JSON.stringify({ type: "connectat", id }));
}

function direccio(ws, m) {
    if (jugadors[m.id]) {
        const jugador = jugadors[m.id];
        const novaX = jugador.x + (m.action === 'left' ? -5 : m.action === 'right' ? 5 : 0);
        const novaY = jugador.y + (m.action === 'up' ? -5 : m.action === 'down' ? 5 : 0);

        // Verificar límites del área de juego
        if (novaX >= 0 && novaX <= 600 - 16 && novaY >= 0 && novaY <= 400 - 16) {
            jugador.x = novaX;

            // Verificar colisiones
            if (detectarColisio(jugador)) {
                jugador.x -= (m.action === 'left' ? -5 : m.action === 'right' ? 5 : 0);
                jugador.y -= (m.action === 'up' ? -5 : m.action === 'down' ? 5 : 0);
            }
        }
    }
}

function agafar(ws, m) {
    let jugador = jugadors[m.id];

    if (!jugador || !enJoc) return;

    if (jugador.portaPedra) {
        jugador.portaPedra = false;
        pedres.push({ x: jugador.x, y: jugador.y });
    } else {
        jugador.portaPedra = true;
    }
}

function tancar(ws) {
    for (let id in jugadors) {
        if (jugadors[id].ws === ws) {
            delete jugadors[id];
            break;
        }
    }
}

function enviarActualitzacio() {
    const dades = {
        type: "dibuixar",
        jugadors: Object.values(jugadors).map(({ ws, ...rest }) => rest),
        pedres: pedres
    };

    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(dades));
        }
    });
}

function crearJugadorsInicials() {
    const numPlayers = 2;
    for (let i = 1; i <= numPlayers; i++) {
        let id = Object.keys(jugadors).length + 1;
        jugadors[id] = { id, x: generarPosicioAleatoria().x, y: generarPosicioAleatoria().y, direccio: "none", portaPedra: false, ws: null };
    }
}

setInterval(enviarActualitzacio, 100);