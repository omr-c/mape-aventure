/* =========================================================
   1. CONFIGURACIÓN Y HITOS
   ========================================================= */
const waypoints = [
    { id: 1, lat: 19.25093570220489, lng: -98.22879059918756, clue: "Inicia la travesía. Sigue los puntos hacia el primer objetivo.", msg: "¡Hito 1 alcanzado!" },
    { id: 2, lat: 19.250227164890724, lng: -98.23089117004224, clue: "Mantén el rumbo constante. La señal se fortalece.", msg: "¡Hito 2 superado!" },
    { id: 3, lat: 19.25001526411276, lng: -98.2318769067168, clue: "Gira según indique la brújula.", msg: "¡Hito 3 listo!" },
    { id: 4, lat: 19.249452293671308, lng: -98.23317987648423, clue: "Caminando hacia el horizonte.", msg: "¡Hito 4 alcanzado!" },
    { id: 5, lat: 19.248717500429724, lng: -98.23344407080332, clue: "Sigue la línea de puntos azules.", msg: "¡Hito 5 superado!" },
    { id: 6, lat: 19.247203364468916, lng: -98.23363003688227, clue: "Punto de control cercano.", msg: "¡Hito 6 listo!" },
    { id: 7, lat: 19.247314918451373, lng: -98.23523361620059, clue: "Casi allí. La recompensa está cerca.", msg: "¡Hito 7 alcanzado!" },
    { id: 8, lat: 19.24596032923307, lng: -98.23556108398105, clue: "DESTINO FINAL DETECTADO.", msg: "¡SISTEMA COMPLETADO!", isFinal: true }
];

let state = { currentIndex: 0, isIntro: true, isNear: false, isFinished: false };
let map, userMarker, directionsService, directionsRenderer;

/* =========================================================
   2. FUNCIONES DE INTERFAZ (RENDERERS)
   ========================================================= */

function render() {
    const app = document.getElementById('app-container');
    if (!app) return;
    app.innerHTML = '';

    if (state.isIntro) {
        app.innerHTML = `
            <h1 style="margin-top:20px;">Expedición Activa</h1>
            <p>Navegación por coordenadas satelitales lista.</p>
            <div id="lottie-box" style="height:250px;"></div>
            <button class="btn" onclick="start()">Iniciar Seguimiento</button>
        `;
        setTimeout(() => loadAnim('https://lottie.host/7e604f14-9492-49f9-9f79-e3623f990928/S0W9z8Cg0r.json'), 100);
    } else if (state.isFinished) {
        app.innerHTML = `
            <div style="padding-top:20px;">
                <h1>¡Misión Cumplida!</h1>
                <div id="lottie-box" style="height:300px;"></div>
                <div class="final-card" id="chest-message" style="display:none;">
                    <h2 style="color:#D4AF37;">El Tesoro de la Excursión</h2>
                    <p>¡Felicidades! Has demostrado ser una gran exploradora.</p>
                </div>
            </div>
        `;
        loadAnim('https://lottie.host/9e5352c7-0f89-4972-88f6-a9f9392f6645/6B2m7aYl1r.json');
        setTimeout(() => { document.getElementById('chest-message').style.display = 'block'; }, 2200);
    } else {
        const pt = waypoints[state.currentIndex];
        app.innerHTML = `
            <div class="travel-timeline" style="overflow-x: auto; white-space: nowrap; padding: 10px;">
                ${waypoints.map((w, i) => `<div class="step ${state.currentIndex > i || (state.currentIndex === i && state.isNear) ? 'completed' : (state.currentIndex === i ? 'active' : '')}" style="display:inline-flex; margin: 0 4px;">${i + 1}</div>`).join('')}
            </div>
            <div id="map" style="height: 380px; border-radius: 24px; margin-bottom: 12px; border: 3px solid #FFF; box-shadow: 0 8px 24px rgba(0,0,0,0.12);"></div>
            <div class="clue-card">
                ${state.isNear ? `<h2 style="color:#27AE60">¡Hito Localizado!</h2><p>${pt.msg}</p>` : `<p>"${pt.clue}"</p>`}
                <div id="distance-indicator" class="cold">Iniciando GPS...</div>
            </div>
            <div style="margin-top: 15px;">
                ${state.isNear ? 
                    `<button class="btn" onclick="${pt.isFinal ? 'openChest()' : 'next()'}">${pt.isFinal ? 'REVELAR FINAL' : 'SIGUIENTE TRAMO'}</button>` : 
                    `<input type="text" id="bypass-code" placeholder="Código" style="padding: 12px; border-radius: 12px; border: 1px solid #ddd; width: 50%;">
                     <button class="btn" onclick="checkBypass()" style="padding: 10px 15px; background:#4285F4; color:white; border:none; border-radius:10px;">OK</button>`
                }
            </div>
        `;
        setTimeout(() => initGoogleMap(pt.lat, pt.lng), 50);
    }
}

/* =========================================================
   3. LÓGICA DE MAPAS Y GPS
   ========================================================= */

function initGoogleMap(tLat, tLng) {
    const target = { lat: tLat, lng: tLng };
    directionsService = new google.maps.DirectionsService();
    
    const lineSymbol = {
        path: google.maps.SymbolPath.CIRCLE,
        fillOpacity: 1,
        scale: 4,
        fillColor: '#4285F4',
        strokeColor: '#FFFFFF',
        strokeWeight: 2
    };

    directionsRenderer = new google.maps.DirectionsRenderer({
        suppressMarkers: true,
        polylineOptions: {
            strokeColor: "#4285F4",
            strokeOpacity: 0,
            icons: [{ icon: lineSymbol, offset: "0", repeat: "20px" }]
        }
    });

    map = new google.maps.Map(document.getElementById("map"), {
        zoom: 20,
        center: target,
        disableDefaultUI: true,
        tilt: 45
    });

    directionsRenderer.setMap(map);

    // Marcador Objetivo
    new google.maps.Marker({
        position: target,
        map: map,
        icon: { path: google.maps.SymbolPath.CIRCLE, scale: 10, fillColor: "#EA4335", fillOpacity: 1, strokeWeight: 2, strokeColor: "white" }
    });

    // Marcador Usuario
    userMarker = new google.maps.Marker({
        position: target,
        map: map,
        icon: { path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW, scale: 7, fillColor: "#4285F4", fillOpacity: 1, strokeWeight: 2, strokeColor: "white" }
    });
}

function initGPS() {
    navigator.geolocation.watchPosition(pos => {
        if (state.isFinished) return;
        const { latitude, longitude, heading } = pos.coords;
        const pt = waypoints[state.currentIndex];
        
        const userPos = new google.maps.LatLng(latitude, longitude);
        const targetPos = new google.maps.LatLng(pt.lat, pt.lng);
        const dist = google.maps.geometry.spherical.computeDistanceBetween(userPos, targetPos);

        if (userMarker) {
            userMarker.setPosition(userPos);
            if (heading !== null) {
                const icon = userMarker.getIcon();
                icon.rotation = heading;
                userMarker.setIcon(icon);
                map.setHeading(heading);
            }
        }

        const request = {
            origin: userPos,
            destination: targetPos,
            travelMode: google.maps.TravelMode.WALKING
        };

        directionsService.route(request, (result, status) => {
            if (status === 'OK') directionsRenderer.setDirections(result);
        });

        const indicator = document.getElementById('distance-indicator');
        if (indicator) {
            indicator.innerText = dist < 15 ? '¡ESTÁS MUY CERCA!' : `A ${Math.round(dist)}m de la meta`;
        }

        if (dist <= 5 && !state.isNear) {
            state.isNear = true;
            if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
            render();
        }
    }, null, { enableHighAccuracy: true });
}

/* =========================================================
   4. CONTROL DE FLUJO Y AUXILIARES
   ========================================================= */

function start() { state.isIntro = false; render(); initGPS(); }
function next() { state.currentIndex++; state.isNear = false; render(); }
function openChest() { state.isFinished = true; render(); }

function checkBypass() {
    const input = document.getElementById('bypass-code').value;
    if (input.toUpperCase() === "AVENTURA2026") {
        state.isNear = true;
        render();
    }
}

function loadAnim(url) {
    const container = document.getElementById('lottie-box');
    if (!container) return;
    container.innerHTML = '';
    lottie.loadAnimation({ container, renderer: 'svg', loop: true, autoplay: true, path: url });
}

// ARRANQUE INICIAL
document.addEventListener('DOMContentLoaded', () => {
    render();
});