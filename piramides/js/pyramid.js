"use strict";

// Namespace per crear objectes SVG
const svgNS = "http://www.w3.org/2000/svg";

// Palmera
const palmtree = '<path style="stroke:#000;stroke-width:.46;fill:#800000" d="m3.1-72.3 5.8 3.4-4.2 5.3-4.2-2.4z"/>' +
    '<path style="stroke:#000;stroke-width:.55;fill:#800000" d="m-1.1-66.7 7.3 3.3-4.4 6.9-5.3-2.5z"/>' +
    '<path style="stroke:#000;stroke-width:.64;fill:#800000" d="m-5-60 8.8 3.2-4.4 8.4-6.4-2.4z"/>' +
    '<path style="stroke:#000;stroke-width:.73;fill:#800000" d="m-8.9-51.2 10.3 2.8-4.2 9.9-7.5-2z"/>' +
    '<path style="stroke:#000;stroke-width:.82;fill:#800000" d="m-12.6-40.6 11.8 2.1-3.7 11.5-8.5-1.5z"/>' +
    '<path style="stroke:#000;stroke-width:.91;fill:#800000" d="m-14.9-28.6 13.2 1.2-3 13.1-9.5-.8z"/>' +
    '<path style="stroke:#000;fill:#800000" d="m-16.2-15.4h14.5l-2 14.6h-10.5z"/>' +
    '<path style="stroke:#000;stroke-width:.6;fill:#008000" d="m8.1-78.2 2.7-4 .4-4.4 1.2 2.9 2-.2v-1.9l2.1 2 3 .7.4-3.4.9-.1 2 4.4.2 2.2 1.8-2.7-.9-4-3.1-3.3-3.2-1.6h-3.2l-3.2.9-3.2 3.3-1.2 3.7z"/>' +
    '<path style="stroke:#000;stroke-width:.6;fill:#008000" d="m5.1-66.7 3.8-3.8 4-5.3.8 5 3.4-1.1 3.6 1.3 1.2-3.4.9 3.7 2.9.2 2.2 2.5 1.4-4.8 1.8 6.6 3.7 3.6.1-7.7-2.3-5-5.2-3.5-5.7-2.1-6.6-.7-5.2.8-4.7 4.5-1.3 4.8z"/>' +
    '<path style="stroke:#000;stroke-width:.6;fill:#008000" d="m5.3-74 3.2-3.5-1-6.5-1-3.5-1.9-.3-1.9-1.8 3.3.4-.2-2.5-4-.8 1.7-.9-5.6-1.5-8.3.2-4.2 2.2-3.2 3.8 7-1.1 4.9-2.2-.9 2 4.8-1.3-3.7 3.3 2.3 2.5 4.3.4-2.7 1.8z"/>' +
    '<path style="stroke:#000;stroke-width:.6;fill:#008000" d="m5.2-75.2-4.3-5.7-8.2-4.5-9-1.6-8.2.6-5.9 2.7-2.9 4.5-1.5 7.4 4.8-2.4 3.8-4.9-1.2 5 7.1-3.5v-2.7l3.5-1.7-.9 5.1 4.5.8 2.3-2.8 2 3.2 8.6 2.1 5 5.5z"/>' +
    '<path style="stroke:#000;stroke-width:.6;fill:#008000" d="m5-66.7-5.8-1.8-3.1-4 .7 3.2-2.1 1.2-1.3-1.7-1 2.2-2.4 3.4-2.4-2.9-1.1.5.4 4.1.3 3-3.2-2.4-.9-3.1 1.1-4.5 2.2-3.3 3.2-2 3.8-1.2 5.3.9 3.7 2.4z"/>' +
    '<path style="stroke:#000;stroke-width:.6;fill:#008000" d="m4-67.1 3.8-.5 2.5 3.2 6.3-.8-4.8 3.9.7 1.9 5.3-.9-3.6 3 1.3 4 4.2-.2-3.4 2.2.8 1 4.4-1-.2.8-4.7 2.9-.1.9 2 .4 1.2-.8-.2.9-3.5 2.1-1.8 4.4 5.6-2.7 4.9-3.9 1.8-4.2.7-5.8-2.6-5.8-2.8-3.7-5.7-2.9-8.8-1.8-2.3 1.4z"/>';

// Factor d'escala
const ESCALA = 4;

// Mida del jugador i pedra
const MIDAJ = (4 * ESCALA);
const MIDAP = (2 * ESCALA);

// Mida de l'àrea de joc i piràmide
const PH = (4 * ESCALA);
const PV = (3 * ESCALA);
const NFPMAX = 8;
const PHMAX = (PH * NFPMAX);
const PVMAX = (PV * NFPMAX);

// Colors dels grups, del jugador i de les pedres
const COLOR_PYRA = ["#fff0f0", "#f0fff0"];
const COLOR_GRP = ["#ff0000", "#00ff00"];
const COLOR_PLY = ["#800000", "#008000"];
const COLOR_STN = "#a0a000";
const COLOR_BLOCK = ["#a0a000", "#a0a000"];

var config = {};
var enJoc = false;
var id = undefined; // Add this line

// Crear i configurar un rectangle SVG
function rectangleSVG(x, y, width, height, color) {
    var r = document.createElementNS(svgNS, "rect");

    r.setAttributeNS(null, 'x', x);
    r.setAttributeNS(null, 'y', y);
    r.setAttributeNS(null, 'width', width);
    r.setAttributeNS(null, 'height', height);
    r.setAttributeNS(null, 'fill', color);

    return r;
}

// Afegir la zona per construir la piràmide d'un equip
function dibuixarZonaPiramide(x, y, team) {
    var svg = document.querySelector("svg");
    var pyramid = svg.getElementById("pyramid");
    var g = document.createElementNS(svgNS, "g");

    g.setAttributeNS(null, 'id', "T" + team);
    g.setAttributeNS(null, 'transform', "translate(" + x + "," + y + ")");
    g.appendChild(rectangleSVG(0, 0, PHMAX, PVMAX, COLOR_PYRA[team]));

    pyramid.appendChild(g);
}

// Dibuixar la palmera per l'equip guanyador
function palmera(team) {
    var svg = document.querySelector("svg");
    var pyramid = svg.getElementById("T" + team);
    var g = document.createElementNS(svgNS, "g");
    g.setAttributeNS(null, 'transform', 'translate(' + (PHMAX / 2 + config.pisos * 3) + ' ' + (PVMAX - ((NFPMAX - config.pisos) * PV / 2)) + ') scale(' + (config.pisos / NFPMAX) + ')');
    g.innerHTML = palmtree;
    pyramid.appendChild(g);
}

// Dibuixa els blocs de la piràmide d'un equip
function dibuixarPiramide(team, points) {
    var svg = document.querySelector("svg");
    var pyramid = svg.getElementById("T" + team);
    while (pyramid.firstElementChild.nextElementSibling) {
        pyramid.removeChild(pyramid.firstElementChild.nextElementSibling);
    }

    var np = 0;
    while (np < points) {
        var x = (np % config.pisos) * PH;
        var y = PVMAX - (Math.floor(np / config.pisos) + 1) * PV;
        pyramid.appendChild(rectangleSVG(x, y, PH, PV, COLOR_BLOCK[team]));
        np++;
    }
}

function dibuixar(jugadors = [], pedres = [], punts = [0, 0]) {
    var r, c, svg = document.querySelector("svg");

    // Validate parameters
    jugadors = Array.isArray(jugadors) ? jugadors : [];
    pedres = Array.isArray(pedres) ? pedres : [];
    punts = Array.isArray(punts) && punts.length >= 2 ? punts : [0, 0];

    // Eliminar i redibuixar els jugadors
    var ply = svg.getElementById("players");

    while (ply.firstChild) ply.removeChild(ply.firstChild);

    for(var j of jugadors) {
        // Use COLOR_GRP by default if id is undefined
        c = (typeof id !== 'undefined' && id === j.id) ? COLOR_PLY[j.team] : COLOR_GRP[j.team];
        ply.appendChild(rectangleSVG(j.x, j.y, MIDAJ, MIDAJ, c));
    }

    // Eliminar i redibuixar les pedretes
    var stn = svg.getElementById("stones");

    while (stn.firstChild) stn.removeChild(stn.firstChild);

    for(var p of pedres) {
        stn.appendChild(rectangleSVG(p.x, p.y, MIDAP, MIDAP, COLOR_STN));
    }

    // Dibuixar les piràmides de cada equip
    dibuixarPiramide(0, punts[0]);
    dibuixarPiramide(1, punts[1]);
}

// Función para dibujar los jugadores en el canvas
function dibuixarJugadors(jugadors) {
    var svg = document.querySelector("svg");
    const playersGroup = svg.getElementById("players");

    // Limpiar grupo antes de redibujar
    playersGroup.innerHTML = "";

    // Dibujar jugadores
    jugadors.forEach(jugador => {
        const rect = document.createElementNS(svgNS, "rect");
        rect.setAttribute("x", jugador.x);
        rect.setAttribute("y", jugador.y);
        rect.setAttribute("width", 16); // Tamaño del jugador
        rect.setAttribute("height", 16);
        rect.setAttribute("fill", jugador.team === 0 ? "red" : "green"); // Color según el equipo
        playersGroup.appendChild(rect);
    });
}

// Función para dibujar las piedras en el canvas
function dibuixarPedres(pedres) {
    const svg = document.querySelector("svg");
    const stonesGroup = svg.getElementById("stones");

    // Limpiar grupo antes de redibujar
    stonesGroup.innerHTML = "";

    // Dibujar piedras
    pedres.forEach(pedra => {
        const rect = document.createElementNS(svgNS, "rect");
        rect.setAttribute("x", pedra.x);
        rect.setAttribute("y", pedra.y);
        rect.setAttribute("width", 8); // Tamaño de la piedra
        rect.setAttribute("height", 8);
        rect.setAttribute("fill", "yellow"); // Color de la piedra
        stonesGroup.appendChild(rect);
    });
}

// Función para manejar los mensajes del servidor
function handleServerMessage(event) {
    const missatge = JSON.parse(event.data);

    switch (missatge.type) {
        case 'connectat':
            id = missatge.id; // Set player id when received
            console.log('Connectat amb ID:', id);
            break;
        case 'configurar':
            document.getElementById("pisos").value = missatge.config.pisos;
            configurar(missatge.config);
            console.log("Nueva configuración recibida:", config);
            break;
        case 'dibuixar':
            if (enJoc) {
                dibuixar(missatge.jugadors, missatge.pedres, missatge.punts);
            }
            break;
        case 'engegar':
            enJoc = true;
            console.log('Joc en marxa');
            break;
        case 'aturar':
            enJoc = false;
            dibuixar([], [], [0, 0]); // Vaciar la lista de jugadores y piedras en la pantalla de admin
            console.log('Joc aturat');
            break;
        case 'missatge':
            console.log(missatge.text);
            break;
    }
}

// Inicializar la conexión WebSocket y manejar mensajes
function init() {
    const connexio = new WebSocket('ws://localhost:8180');

    connexio.onmessage = handleServerMessage;

    connexio.onclose = function () {
        alert('Connexió tancada');
        window.location.href = 'index.html';
    };

    connexio.onerror = function () {
        alert('Error de connexió');
        window.location.href = 'index.html';
    };
}

window.onload = init;

// Guardar i configurar les mides de la zona de joc
//	i el nombre de pisos que ha tenir cada piràmide
// Dibuixar les zones on s'han de construir les piràmides
// c.width: amplada en píxels
// c.height: alçada en píxels
// c.pisos: nombre de pisos de la piràmide
// c.pedres: nombre de pedres necessàries per contruir la piràmide:
//	(pisos + 1) * pisos / 2
function configurar(c) {
    // Guardar la configuració
    config = c;
    config.pedres = (config.pisos + 1) * config.pisos / 2;

    // Modificar la mida de la zona de joc
    var svg = document.querySelector("svg");

    svg.setAttribute("width", config.width);
    svg.setAttribute("height", config.height);
    svg.setAttribute("viewBox", "0 0 " + config.width + " " + config.height);
    
    // Dibuixar les zones on s'han de construir les piràmides
    var pyramid = svg.getElementById("pyramid");

    while (pyramid.firstChild) pyramid.removeChild(pyramid.firstChild);

    dibuixarZonaPiramide(0, 0, 0);
    dibuixarZonaPiramide(config.width - PHMAX, config.height - PVMAX, 1);
}
