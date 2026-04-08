/* =========================================================
   CONFIGURACIÓN DE LA EXCURSIÓN
   ========================================================= */
const waypoints = [
    { 
        id: 1, 
        lat: 19.251102613683297, 
        lng: -98.22911261075458, 
        clue: "El inicio de la excursión. Sigue la línea azul para calibrar tu destino.", 
        successMessage: "¡Sistema listo! La ruta se ha actualizado para el siguiente punto." 
    },
    { 
        id: 2, 
        lat: 19.251060831932246, 
        lng: -98.22923331016183, 
        clue: "Sigue el rastro por la calle. El mapa te guía hacia el secreto.", 
        successMessage: "¡Excelente avance! Estás muy cerca de completar la misión." 
    },
    { 
        id: 3, 
        lat: 19.25098613119978, 
        lng: -98.22952701204791, 
        clue: "Objetivo final detectado. Camina hasta que el indicador marque la meta.", 
        successMessage: "¡HAS LLEGADO AL DESTINO FINAL!", 
        isFinal: true 
    }
];

const config = { radius: 10 }; // Radio de llegada en metros

/* =========================================================
   ESTADO GLOBAL Y VARIABLES DE MAPA
   ========================================================= */
let state = {
    currentIndex: 0,
    isIntro: true,
    isNear: false,
    isFinished: false
};

let map, userMarker, directionsService, directionsRenderer;

const app = document.getElementById('app-container');

/* =========================================================
   MOTOR DE RENDERIZADO
   ========================================================= */

function render() {
    app.innerHTML = '';
    
    if (state.isIntro) {
        renderIntro();
    } else if (state.isFinished) {
        renderFinal();
    } else {
        renderNavigation();
    }
}

function renderIntro() {
    app.innerHTML = `
        <h1 style="margin-top:20px;">Expedición de Viaje</h1>
        <p>Sigue la ruta en tiempo real para descubrir el tesoro oculto.</p>
        <div id="lottie-box" style="height:250px;"></div>
        <button class="btn" onclick="start()">Activar Navegación</button>
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
        
        <div id="map" style="height: 300px; border-radius: 15px; margin-bottom: 15px; border: 2px solid #EEE;"></div>
        
        ${state.isNear ? `
            <h1 style="color:var(--success-color)">¡Punto Encontrado!</h1>
            <div class="clue-card" style="border-left-color: var(--success-color);">
                <p style="font-weight:600;">${pt.successMessage}</p>
            </div>
            <button class="btn" onclick="${pt.isFinal ? 'openChest()' : 'next()'}">
                ${pt.isFinal ? 'REVELAR TESORO' : 'SIGUIENTE ETAPA'}
            </button>
        ` : `
            <h1>Etapa ${pt.id}</h1>
            <div class="clue-card">
                <p>"${pt.clue}"</p>
                <div id="distance-indicator" class="cold">Calculando ruta...</div>
            </div>
        `}
    `;

    setTimeout(() => {
        initGoogleMap(pt.lat, pt.lng);
    }, 50);
}

function renderFinal() {
    app.innerHTML = `
        <div style="padding-top:20px;">
            <h1>¡Misión Cumplida!</h1>
            <div id="lottie-box" style="height:300px;"></div>
            <div class="final-card" id="chest-message" style="display:none;">
                <h2 style="color:var(--gold); margin-bottom:15px;">Para mi exploradora favorita</h2>
                <p>¡Felicidades por completar todo el recorrido! Has demostrado ser una experta en aventuras.</p>
                <div id="croquis-container" style="margin-top:15px;">
                    </div>
            </div>
        </div>
    `;
    
    loadAnim('https://lottie.host/9e5352c7-0f89-4972-88f6-a9f9392f6645/6B2m7aYl1r.json');

    setTimeout(() => {
        document.getElementById('chest-message').style.display = 'block';
        if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
    }, 2500);
}

/* =========================================================
   LÓGICA DE GOOGLE MAPS & GPS
   ========================================================= */

function initGoogleMap(tLat, tLng) {
    const target = { lat: tLat, lng: tLng };
    
    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer({
        suppressMarkers: true,
        polylineOptions: {
            strokeColor: "#3498db",
            strokeWeight: 6,
            strokeOpacity: 0.8
        }
    });

    map = new google.maps.Map(document.getElementById("map"), {
        zoom: 18,
        center: target,
        disableDefaultUI: true,
        styles: [
            { "featureType": "poi", "stylers": [{ "visibility": "off" }] },
            { "featureType": "transit", "stylers": [{ "visibility": "off" }] }
        ]
    });

    directionsRenderer.setMap(map);

    // Marcador del Objetivo (Hito)
    new google.maps.Marker({
        position: target,
        map: map,
        icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: "#e74c3c",
            fillOpacity: 1,
            strokeWeight: 2,
            strokeColor: "white",
        }
    });

    // Marcador del Usuario (Ella)
    userMarker = new google.maps.Marker({
        position: target,
        map: map,
        icon: {
            path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
            scale: 6,
            fillColor: "#4285F4",
            fillOpacity: 1,
            strokeWeight: 2,
            strokeColor: "white",
        }
    });
}

function calculateRoute(uLat, uLng, tLat, tLng) {
    const request = {
        origin: { lat: uLat, lng: uLng },
        destination: { lat: tLat, lng: tLng },
        travelMode: google.maps.TravelMode.WALKING
    };

    directionsService.route(request, (result, status) => {
        if (status === google.maps.DirectionsStatus.OK) {
            directionsRenderer.setDirections(result);
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

        // Actualizar UI del Mapa
        if (userMarker) {
            userMarker.setPosition(userPos);
            if (heading) {
                const icon = userMarker.getIcon();
                icon.rotation = heading;
                userMarker.setIcon(icon);
            }
        }

        // Trazar línea tipo Uber
        calculateRoute(latitude, longitude, pt.lat, pt.lng);

        const indicator = document.getElementById('distance-indicator');
        if (indicator) {
            indicator.className = dist < 15 ? 'hot' : (dist < 40 ? 'warm' : 'cold');
            indicator.innerText = dist < 15 ? '¡HAS LLEGADO!' : `A ${Math.round(dist)} metros`;
        }

        // Detección de llegada
        if (dist <= config.radius && !state.isNear) {
            state.isNear = true;
            if (navigator.vibrate) navigator.vibrate([150, 50, 150]);
            render();
        }

        // Debug Log
        const debug = document.getElementById('debug-info');
        if (debug) debug.innerText = `Dist: ${dist.toFixed(1)}m | Precisión: ${pos.coords.accuracy.toFixed(0)}m`;
        
    }, (err) => {
        console.error("Error GPS:", err);
    }, { enableHighAccuracy: true });
}

/* =========================================================
   UTILIDADES Y FLUJO
   ========================================================= */

function loadAnim(url) {
    const container = document.getElementById('lottie-box');
    if (!container) return;
    container.innerHTML = '';
    lottie.loadAnimation({ container, renderer: 'svg', loop: true, autoplay: true, path: url });
}

function start() { state.isIntro = false; render(); initGPS(); }
function next() { state.currentIndex++; state.isNear = false; render(); }
function openChest() { state.isFinished = true; render(); }

// Inicialización
render();