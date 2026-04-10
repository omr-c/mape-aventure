/* =========================================================
   1. CONFIGURACION
   ========================================================= */
const waypoints = [
    { id: 1, lat: 19.25093570220489, lng: -98.22879059918756, clue: "Sigue los puntos azules para iniciar.", isFinal: false },
    { id: 2, lat: 19.24596032923307, lng: -98.23556108398105, clue: "¡Casi llegas al tesoro!", isFinal: true }
];

let state = { currentIndex: 0, isIntro: true, isNear: false, travelMode: 'WALKING' };
let map, userMarker, directionsRenderer, directionsService;
let lastUserPos = null;

/* =========================================================
   2. UI Y RENDER
   ========================================================= */
function render() {
    const app = document.getElementById('app-container');
    if (state.isIntro) {
        app.innerHTML = `
            <div class="intro-screen">
                <h1>Mape Aventure</h1>
                <div id="lottie-box"></div>
                <button class="btn" onclick="startAdventure()">INICIAR RUTA</button>
            </div>
        `;
        // Enlace de Lottie corregido (Navegacion)
        loadAnim('https://assets9.lottiefiles.com/packages/lf20_96bovdur.json'); 
    } else {
        const pt = waypoints[state.currentIndex];
        app.innerHTML = `
            <div class="nav-header">
                <div class="mode-btn ${state.travelMode==='WALKING'?'active':''}" onclick="changeMode('WALKING')">🚶 <span id="time-walk">--</span></div>
                <div class="mode-btn ${state.travelMode==='DRIVING'?'active':''}" onclick="changeMode('DRIVING')">🚗 <span id="time-drive">--</span></div>
            </div>
            <div id="map"></div>
            <div class="info-card">
                <p id="dist-txt">Localizando...</p>
                <p class="clue">"${pt.clue}"</p>
                ${state.isNear ? `<button class="btn btn-arrival" onclick="nextStep()">¡LLEGUE!</button>` : ''}
            </div>
        `;
        initMap();
    }
}

/* =========================================================
   3. LOGICA DE MAPA Y GPS
   ========================================================= */
function initMap() {
    if (map) return; // Evita recrear el mapa y perder fluidez

    const pt = waypoints[state.currentIndex];
    map = new google.maps.Map(document.getElementById("map"), {
        zoom: 17,
        center: { lat: pt.lat, lng: pt.lng },
        disableDefaultUI: true,
        styles: [ { "featureType": "poi", "stylers": [{ "visibility": "off" }] } ] // Mapa limpio
    });

    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer({
        map: map,
        suppressMarkers: true,
        polylineOptions: { strokeColor: "#4285F4", strokeWeight: 6 }
    });

    startTracking();
}

function startTracking() {
    navigator.geolocation.watchPosition(pos => {
        lastUserPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        
        if (!userMarker) {
            userMarker = new google.maps.Marker({
                position: lastUserPos,
                map: map,
                icon: {
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: 8,
                    fillColor: "#4285F4",
                    fillOpacity: 1,
                    strokeColor: "white",
                    strokeWeight: 2
                }
            });
        } else {
            userMarker.setPosition(lastUserPos);
        }

        updateRoute();
        checkProximity();
    }, null, { enableHighAccuracy: true });
}

function updateRoute() {
    if (!lastUserPos || !directionsService) return;
    const pt = waypoints[state.currentIndex];

    directionsService.route({
        origin: lastUserPos,
        destination: { lat: pt.lat, lng: pt.lng },
        travelMode: google.maps.TravelMode[state.travelMode]
    }, (res, status) => {
        if (status === "OK") {
            directionsRenderer.setDirections(res);
            const leg = res.routes[0].legs[0];
            document.getElementById('dist-txt').innerText = `${leg.distance.text} - ${leg.duration.text}`;
            
            // Actualizar tiempos en cabecera
            if (state.travelMode === 'WALKING') document.getElementById('time-walk').innerText = leg.duration.text;
            else document.getElementById('time-drive').innerText = leg.duration.text;
        }
    });
}

function checkProximity() {
    const pt = waypoints[state.currentIndex];
    const distance = google.maps.geometry.spherical.computeDistanceBetween(
        new google.maps.LatLng(lastUserPos.lat, lastUserPos.lng),
        new google.maps.LatLng(pt.lat, pt.lng)
    );

    if (distance < 15 && !state.isNear) {
        state.isNear = true;
        render();
    }
}

/* =========================================================
   4. ACCIONES
   ========================================================= */
function startAdventure() { state.isIntro = false; render(); }

function nextStep() {
    if (state.currentIndex < waypoints.length - 1) {
        state.currentIndex++;
        state.isNear = false;
        render();
    } else {
        alert("¡Has completado la ruta!");
    }
}

function changeMode(m) {
    state.travelMode = m;
    updateRoute();
}

function loadAnim(path) {
    lottie.loadAnimation({
        container: document.getElementById('lottie-box'),
        renderer: 'svg',
        loop: true,
        autoplay: true,
        path: path
    });
}

document.addEventListener('DOMContentLoaded', render);