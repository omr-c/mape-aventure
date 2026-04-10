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
let previousPosition = null;

/* =========================================================
   2. FUNCIONES DE INTERFAZ (RENDERERS)
   ========================================================= */

function render() {
    const app = document.getElementById('app-container');
    if (!app) return;
    app.innerHTML = '';

    if (state.isIntro) {
        app.innerHTML = `
            <h1 style="margin-top:20px;">Sistemas de Navegación</h1>
            <p>Modo Caminata optimizado para la expedición.</p>
            <div id="lottie-box" style="height:250px;"></div>
            <button class="btn" onclick="start()">Iniciar Navegación</button>
        `;
        setTimeout(() => loadAnim('https://lottie.host/7e604f14-9492-49f9-9f79-e3623f990928/S0W9z8Cg0r.json'), 100);
    } else if (state.isFinished) {
        app.innerHTML = `
            <div style="padding-top:20px;">
                <h1>¡Misión Cumplida!</h1>
                <div id="lottie-box" style="height:300px;"></div>
                <div class="final-card" id="chest-message" style="display:none;">
                    <h2 style="color:#D4AF37;">Localización Finalizada</h2>
                    <p>Has navegado con éxito a través de todos los puntos.</p>
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
            
            <div style="position: relative;">
                <div id="map" style="height: 480px; border-radius: 24px; margin-bottom: 12px; border: 3px solid #FFF; box-shadow: 0 8px 24px rgba(0,0,0,0.12);"></div>
                
                <div class="transport-bar" style="position: absolute; top: 10px; left: 50%; transform: translateX(-50%); background: white; padding: 10px 20px; border-radius: 30px; display: flex; align-items: center; box-shadow: 0 4px 15px rgba(0,0,0,0.2); z-index: 1000; width: 85%; justify-content: center;">
                    <div style="background: #E1F5FE; border-radius: 20px; padding: 5px 15px; display: flex; flex-direction: column; align-items: center;">
                        <span style="font-size: 20px;">🚶</span>
                        <span id="walking-time" style="font-size: 12px; font-weight: bold; color: #01579B;">-- min</span>
                    </div>
                </div>
            </div>

            <div class="clue-card">
                ${state.isNear ? `<h2 style="color:#27AE60">¡Hito Localizado!</h2><p>${pt.msg}</p>` : `<p>"${pt.clue}"</p>`}
                <div id="distance-indicator" class="cold">Calculando ruta...</div>
            </div>
            
            <div style="margin-top: 15px;">
                ${state.isNear ? 
                    `<button class="btn" onclick="${pt.isFinal ? 'openChest()' : 'next()'}">${pt.isFinal ? 'FINALIZAR' : 'SIGUIENTE HITO'}</button>` : 
                    `<input type="text" id="bypass-code" placeholder="Código Maestro" style="padding: 12px; border-radius: 12px; border: 1px solid #ddd; width: 50%;">
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
            strokeColor: '#4285F4',
            strokeOpacity: 0.5,
            strokeWeight: 6,
            icons: [{ icon: lineSymbol, offset: '0', repeat: '20px' }]
        }
    });

    map = new google.maps.Map(document.getElementById("map"), {
        zoom: 18,
        center: target,
        gestureHandling: 'greedy', 
        disableDefaultUI: false,
        mapTypeControl: true,
        mapTypeControlOptions: { position: google.maps.ControlPosition.TOP_LEFT },
        zoomControl: true,
        tilt: 45
    });

    directionsRenderer.setMap(map);

    // Marcadores
    new google.maps.Marker({
        position: target, map: map,
        icon: { path: google.maps.SymbolPath.CIRCLE, scale: 10, fillColor: "#EA4335", fillOpacity: 1, strokeWeight: 2, strokeColor: "white" }
    });

    userMarker = new google.maps.Marker({
        position: target, map: map, zIndex: 100,
        icon: { path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW, scale: 7, fillColor: "#4285F4", fillOpacity: 1, strokeWeight: 2, strokeColor: "white" }
    });
}

function updatePath(uLat, uLng) {
    const pt = waypoints[state.currentIndex];
    const request = {
        origin: { lat: uLat, lng: uLng },
        destination: { lat: pt.lat, lng: pt.lng },
        travelMode: google.maps.TravelMode.WALKING 
    };

    directionsService.route(request, (result, status) => {
        if (status === 'OK') {
            directionsRenderer.setDirections(result);
            const leg = result.routes[0].legs[0];
            
            // ACTUALIZAR BARRA DE TRANSPORTE
            const timeSpan = document.getElementById('walking-time');
            if (timeSpan) timeSpan.innerText = leg.duration.text;

            const indicator = document.getElementById('distance-indicator');
            if (indicator) {
                indicator.innerHTML = `Destino a <strong>${leg.distance.text}</strong>`;
            }
        }
    });
}

function initGPS() {
    navigator.geolocation.watchPosition(pos => {
        if (state.isFinished) return;
        const { latitude, longitude, heading } = pos.coords;
        const pt = waypoints[state.currentIndex];
        const userPos = new google.maps.LatLng(latitude, longitude);
        const dist = google.maps.geometry.spherical.computeDistanceBetween(userPos, new google.maps.LatLng(pt.lat, pt.lng));

        if (!previousPosition) {
            userMarker.setPosition(userPos);
            map.setCenter(userPos);
            updatePath(latitude, longitude); 
            previousPosition = userPos;
        } else {
            userMarker.setPosition(userPos);
            updatePath(latitude, longitude);
            previousPosition = userPos;
        }

        if (dist <= 6 && !state.isNear) {
            state.isNear = true;
            if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
            render();
        }
    }, null, { enableHighAccuracy: true });
}

/* =========================================================
   4. CONTROL DE FLUJO
   ========================================================= */
function start() { state.isIntro = false; render(); initGPS(); }
function next() { state.currentIndex++; state.isNear = false; render(); }
function openChest() { state.isFinished = true; render(); }
function checkBypass() {
    const input = document.getElementById('bypass-code').value;
    if (input.toUpperCase() === "AVENTURA2026") { state.isNear = true; render(); }
}
function loadAnim(url) {
    const container = document.getElementById('lottie-box');
    if (!container) return;
    container.innerHTML = '';
    lottie.loadAnimation({ container, renderer: 'svg', loop: true, autoplay: true, path: url });
}

document.addEventListener('DOMContentLoaded', () => { render(); });