/* =========================================================
   CONFIGURACIÓN DE LA EXPEDICIÓN (8 HITOS)
   ========================================================= */
const waypoints = [
    { id: 1, lat: 19.25093570220489, lng: -98.22879059918756, clue: "Inicia la travesía. Sigue los puntos hacia el primer objetivo.", msg: "¡Hito 1 alcanzado! Calibración completa." },
    { id: 2, lat: 19.250227164890724, lng: -98.23089117004224, clue: "Mantén el rumbo constante. La señal se fortalece.", msg: "¡Hito 2 superado! Vas por buen camino." },
    { id: 3, lat: 19.25001526411276, lng: -98.2318769067168, clue: "Gira según indique la brújula. El mapa se actualiza.", msg: "¡Hito 3 listo! Mitad de la primera fase lograda." },
    { id: 4, lat: 19.249452293671308, lng: -98.23317987648423, clue: "Caminando hacia el horizonte. No te detengas.", msg: "¡Hito 4 alcanzado! Estás a mitad de la aventura." },
    { id: 5, lat: 19.248717500429724, lng: -98.23344407080332, clue: "La ruta se vuelve más interesante. Sigue la línea azul.", msg: "¡Hito 5 superado! El destino final emite señal." },
    { id: 6, lat: 19.247203364468916, lng: -98.23363003688227, clue: "Punto de control cercano. Estás cerca de la zona final.", msg: "¡Hito 6 listo! Solo quedan un par de pasos." },
    { id: 7, lat: 19.247314918451373, lng: -98.23523361620059, clue: "Casi allí. La recompensa está a la vuelta de la esquina.", msg: "¡Hito 7 alcanzado! ¡ÚLTIMO ESFUERZO!" },
    { id: 8, lat: 19.24596032923307, lng: -98.23556108398105, clue: "DESTINO FINAL DETECTADO. Camina hasta el centro de la marca.", msg: "¡SISTEMA COMPLETADO! HAS LLEGADO.", isFinal: true }
];

const MASTER_CODE = "AVENTURA2026"; // Código para saltar etapas manualmente
const ARRIVAL_RADIUS = 5; // Precisión de 5 metros

let state = { currentIndex: 0, isIntro: true, isNear: false, isFinished: false };
let map, userMarker, directionsService, directionsRenderer;

const app = document.getElementById('app-container');

/* =========================================================
   SISTEMA DE INTERFAZ
   ========================================================= */

function render() {
    app.innerHTML = '';
    if (state.isIntro) renderIntro();
    else if (state.isFinished) renderFinal();
    else renderNavigation();
}

function renderIntro() {
    app.innerHTML = `
        <h1 style="margin-top:20px;">Expedición de 8 Etapas</h1>
        <p>Navegación de alta precisión activada (5m).</p>
        <div id="lottie-box" style="height:200px;"></div>
        <button class="btn" onclick="start()">Iniciar Radar</button>
    `;
    setTimeout(() => loadAnim('https://lottie.host/7e604f14-9492-49f9-9f79-e3623f990928/S0W9z8Cg0r.json'), 100);
}

function renderNavigation() {
    const pt = waypoints[state.currentIndex];
    app.innerHTML = `
        <div class="travel-timeline" style="font-size: 0.6rem; overflow-x: auto; white-space: nowrap; padding: 10px;">
            ${waypoints.map((w, i) => `
                <div class="step ${state.currentIndex > i ? 'completed' : (state.currentIndex === i && state.isNear ? 'completed' : (state.currentIndex === i ? 'active' : ''))}" style="display:inline-flex; margin: 0 5px;">
                    ${i + 1}
                </div>
            `).join('')}
        </div>
        
        <div id="map" style="height: 320px; border-radius: 20px; margin-bottom: 10px; border: 2px solid #EEE;"></div>
        
        <div class="clue-card">
            ${state.isNear ? `<h2 style="color:var(--success-color)">¡Punto Encontrado!</h2><p>${pt.msg}</p>` : `<p>"${pt.clue}"</p>`}
            <div id="distance-indicator" class="${state.isNear ? 'hot' : 'cold'}">Calculando...</div>
        </div>

        <div style="margin-top: 10px;">
            ${state.isNear ? 
                `<button class="btn" onclick="${pt.isFinal ? 'openChest()' : 'next()'}">${pt.isFinal ? 'ABRIR TESORO' : 'SIGUIENTE PUNTO'}</button>` : 
                `<input type="text" id="bypass-code" placeholder="Código de salto" style="padding: 10px; border-radius: 10px; border: 1px solid #ccc; width: 60%;">
                 <button onclick="checkBypass()" style="padding: 10px; border-radius: 10px; background: #eee; border:none;">OK</button>`
            }
        </div>
    `;
    setTimeout(() => initGoogleMap(pt.lat, pt.lng), 50);
}

/* =========================================================
   LÓGICA DE NAVEGACIÓN
   ========================================================= */

function initGoogleMap(tLat, tLng) {
    const target = { lat: tLat, lng: tLng };
    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer({
        suppressMarkers: true,
        polylineOptions: { strokeColor: "#4285F4", strokeOpacity: 0, icons: [{ icon: { path: google.maps.SymbolPath.CIRCLE, scale: 3, fillOpacity: 1 }, offset: "0", repeat: "15px" }] }
    });

    map = new google.maps.Map(document.getElementById("map"), {
        zoom: 19, center: target, disableDefaultUI: true,
        styles: [{ "featureType": "poi", "stylers": [{ "visibility": "off" }] }]
    });

    directionsRenderer.setMap(map);
    new google.maps.Marker({ position: target, map: map, icon: { path: google.maps.SymbolPath.CIRCLE, scale: 10, fillColor: "#EA4335", fillOpacity: 1, strokeWeight: 2, strokeColor: "white" } });
    userMarker = new google.maps.Marker({ position: target, map: map, icon: { path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW, scale: 6, fillColor: "#4285F4", fillOpacity: 1, strokeWeight: 2, strokeColor: "white" } });
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
            }
        }

        const request = { origin: userPos, destination: targetPos, travelMode: google.maps.TravelMode.WALKING };
        directionsService.route(request, (res, stat) => { if (stat === 'OK') directionsRenderer.setDirections(res); });

        const indicator = document.getElementById('distance-indicator');
        if (indicator) indicator.innerText = dist < 15 ? '¡ESTÁS MUY CERCA!' : `A ${Math.round(dist)} metros`;

        if (dist <= ARRIVAL_RADIUS && !state.isNear) {
            state.isNear = true;
            if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
            render();
        }
    }, null, { enableHighAccuracy: true });
}

/* =========================================================
   CONTROLES Y BYPASS
   ========================================================= */

function checkBypass() {
    const input = document.getElementById('bypass-code').value;
    if (input.toUpperCase() === MASTER_CODE) {
        state.isNear = true;
        render();
    } else {
        alert("Código incorrecto");
    }
}

function start() { state.isIntro = false; render(); initGPS(); }
function next() { state.currentIndex++; state.isNear = false; render(); }
function openChest() { state.isFinished = true; render(); }

function renderFinal() {
    app.innerHTML = `
        <div style="padding-top:20px;">
            <h1>¡Expedición Exitosa!</h1>
            <div id="lottie-box" style="height:250px;"></div>
            <div class="final-card" id="chest-message" style="display:none;">
                <h2 style="color:var(--gold);">Tesoro Localizado</h2>
                <p>Has superado los 8 hitos con éxito. Tu recompensa te espera aquí.</p>
            </div>
        </div>
    `;
    loadAnim('https://lottie.host/9e5352c7-0f89-4972-88f6-a9f9392f6645/6B2m7aYl1r.json');
    setTimeout(() => { document.getElementById('chest-message').style.display = 'block'; }, 2000);
}

function loadAnim(url) {
    const container = document.getElementById('lottie-box');
    if (container) {
        container.innerHTML = '';
        lottie.loadAnimation({ container, renderer: 'svg', loop: true, autoplay: true, path: url });
    }
}

render();