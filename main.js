/* =========================================================
   CONFIGURACIÓN DE HITOS
   ========================================================= */
const waypoints = [
    { 
        id: 1, 
        lat: 19.251102613683297, 
        lng: -98.22911261075458, 
        clue: "Primer hito detectado. Sigue la guía de puntos azules.", 
        successMessage: "¡Excelente! Has llegado al primer punto de control." 
    },
    { 
        id: 2, 
        lat: 19.251060831932246, 
        lng: -98.22923331016183, 
        clue: "La señal se mueve. Continúa por la ruta marcada.", 
        successMessage: "Punto de control superado. El objetivo final está cerca." 
    },
    { 
        id: 3, 
        lat: 19.25098613119978, 
        lng: -98.22952701204791, 
        clue: "Objetivo final a la vista. No te detengas hasta llegar a la meta.", 
        successMessage: "¡SISTEMA COMPLETADO: DESTINO ALCANZADO!", 
        isFinal: true 
    }
];

let state = { currentIndex: 0, isIntro: true, isNear: false, isFinished: false };
let map, userMarker, directionsService, directionsRenderer;

const app = document.getElementById('app-container');

/* =========================================================
   SISTEMA DE RENDERIZADO
   ========================================================= */

function render() {
    app.innerHTML = '';
    if (state.isIntro) renderIntro();
    else if (state.isFinished) renderFinal();
    else renderNavigation();
}

function renderIntro() {
    app.innerHTML = `
        <h1 style="margin-top:20px;">Navegación Activa</h1>
        <p>El sistema te guiará paso a paso mediante coordenadas satelitales.</p>
        <div id="lottie-box" style="height:250px;"></div>
        <button class="btn" onclick="start()">Iniciar Seguimiento</button>
    `;
    setTimeout(() => loadAnim('https://lottie.host/7e604f14-9492-49f9-9f79-e3623f990928/S0W9z8Cg0r.json'), 100);
}

function renderNavigation() {
    const pt = waypoints[state.currentIndex];
    app.innerHTML = `
        <div class="travel-timeline">
            <div class="timeline-line"></div>
            ${[1, 2, 3].map(num => `
                <div class="step ${state.currentIndex + 1 > num || (state.currentIndex + 1 == num && state.isNear) ? 'completed' : (state.currentIndex + 1 == num ? 'active' : '')}">
                    ${num}
                </div>
            `).join('')}
        </div>
        <div id="map" style="height: 350px; border-radius: 20px; margin-bottom: 15px; box-shadow: inset 0 0 10px rgba(0,0,0,0.1);"></div>
        ${state.isNear ? `
            <h1 style="color:var(--success-color)">¡Llegaste!</h1>
            <div class="clue-card" style="border-left-color: var(--success-color);"><p>${pt.successMessage}</p></div>
            <button class="btn" onclick="${pt.isFinal ? 'openChest()' : 'next()'}">
                ${pt.isFinal ? 'REVELAR SECRETO' : 'SIGUIENTE RUTA'}
            </button>
        ` : `
            <div class="clue-card">
                <p style="font-size: 0.9rem; font-style: italic; color: var(--text-secondary);">"${pt.clue}"</p>
                <div id="distance-indicator" class="cold">Calculando trayectoria...</div>
            </div>
        `}
    `;
    setTimeout(() => initGoogleMap(pt.lat, pt.lng), 50);
}

/* =========================================================
   LÓGICA DE MAPAS (UBER/PUNTOS STYLE)
   ========================================================= */

function initGoogleMap(tLat, tLng) {
    const target = { lat: tLat, lng: tLng };
    directionsService = new google.maps.DirectionsService();
    
    // Configuración de "Puntitos" de navegación peatonal
    const lineSymbol = { path: google.maps.SymbolPath.CIRCLE, fillOpacity: 1, scale: 3 };
    
    directionsRenderer = new google.maps.DirectionsRenderer({
        suppressMarkers: true,
        polylineOptions: {
            strokeColor: "#4285F4",
            strokeOpacity: 0, // Hacemos la línea invisible para mostrar solo los puntos
            icons: [{ icon: lineSymbol, offset: "0", repeat: "15px" }]
        }
    });

    map = new google.maps.Map(document.getElementById("map"), {
        zoom: 19,
        center: target,
        disableDefaultUI: true,
        gestureHandling: "greedy",
        styles: [{ "featureType": "poi", "stylers": [{ "visibility": "off" }] }]
    });

    directionsRenderer.setMap(map);

    // Marcador de Destino (Hito)
    new google.maps.Marker({
        position: target,
        map: map,
        icon: { path: google.maps.SymbolPath.CIRCLE, scale: 12, fillColor: "#EA4335", fillOpacity: 1, strokeWeight: 3, strokeColor: "white" }
    });

    // Marcador de Usuario (Flecha GPS)
    userMarker = new google.maps.Marker({
        position: target,
        map: map,
        icon: { path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW, scale: 7, fillColor: "#4285F4", fillOpacity: 1, strokeWeight: 2, strokeColor: "white" }
    });
}

function updateNavigation(uLat, uLng) {
    const pt = waypoints[state.currentIndex];
    const request = {
        origin: { lat: uLat, lng: uLng },
        destination: { lat: pt.lat, lng: pt.lng },
        travelMode: google.maps.TravelMode.WALKING
    };

    directionsService.route(request, (result, status) => {
        if (status === google.maps.DirectionsStatus.OK) {
            directionsRenderer.setDirections(result);
            // Auto-ajuste de cámara para ver ambos puntos
            const bounds = result.routes[0].bounds;
            map.fitBounds(bounds, 50); 
        }
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
            }
        }

        updateNavigation(latitude, longitude);

        const indicator = document.getElementById('distance-indicator');
        if (indicator) {
            indicator.className = dist < 15 ? 'hot' : (dist < 40 ? 'warm' : 'cold');
            indicator.innerText = dist < 15 ? '¡DESTINO ALCANZADO!' : `A ${Math.round(dist)} metros de la meta`;
        }

        if (dist <= 10 && !state.isNear) {
            state.isNear = true;
            if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
            render();
        }
    }, null, { enableHighAccuracy: true });
}

/* =========================================================
   FINALES Y AUXILIARES
   ========================================================= */

function renderFinal() {
    app.innerHTML = `
        <div style="padding-top:20px;">
            <h1>¡Expedición Completada!</h1>
            <div id="lottie-box" style="height:300px;"></div>
            <div class="final-card" id="chest-message" style="display:none;">
                <h2 style="color:var(--gold);">El Secreto ha sido Revelado</h2>
                <p style="margin:15px 0;">Felicidades, has seguido la ruta con éxito. Tu recompensa te espera.</p>
            </div>
        </div>
    `;
    loadAnim('https://lottie.host/9e5352c7-0f89-4972-88f6-a9f9392f6645/6B2m7aYl1r.json');
    setTimeout(() => { document.getElementById('chest-message').style.display = 'block'; }, 2200);
}

function loadAnim(url) {
    const container = document.getElementById('lottie-box');
    if (!container) return;
    container.innerHTML = '';
    lottie.loadAnimation({ container, renderer: 'svg', loop: true, autoplay: true, path: url });
}

function start() { state.isIntro = false; render(); initGPS(); }
function next() { state.currentIndex++; state.isNear = false; render(); }
function openChest() { state.isFinished = true; render(); }

render();