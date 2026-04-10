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
   2. UI RENDERER
   ========================================================= */
function render() {
    const app = document.getElementById('app-container');
    if (!app) return;

    if (state.isIntro) {
        app.innerHTML = `
            <div class="intro-screen">
                <h1 style="color:#1a73e8; margin-top:50px;">Mape Aventure</h1>
                <div id="lottie-box" style="height:300px;"></div>
                <button class="btn" onclick="startAdventure()">INICIAR EXPLORACION</button>
            </div>
        `;
        loadAnim('https://assets9.lottiefiles.com/packages/lf20_96bovdur.json'); 
    } else {
        const pt = waypoints[state.currentIndex];
        app.innerHTML = `
            <div class="nav-header">
                <div id="btn-WALKING" class="mode-btn ${state.travelMode==='WALKING'?'active':''}" onclick="changeMode('WALKING')">🚶 <span id="time-walk">--</span></div>
                <div id="btn-DRIVING" class="mode-btn ${state.travelMode==='DRIVING'?'active':''}" onclick="changeMode('DRIVING')">🚗 <span id="time-drive">--</span></div>
            </div>
            <div id="map"></div>
            <div class="info-card">
                <p id="dist-txt" style="font-weight:bold; color:#1a73e8; font-size:1.1em;">Buscando GPS...</p>
                <p class="clue">"${pt.clue}"</p>
                <div id="arrival-zone"></div>
            </div>
        `;
        setTimeout(initMapLogic, 100);
    }
}

/* =========================================================
   3. NAVEGACION
   ========================================================= */
function initMapLogic() {
    if (map) return;
    const pt = waypoints[state.currentIndex];
    
    map = new google.maps.Map(document.getElementById("map"), {
        zoom: 17, center: { lat: pt.lat, lng: pt.lng },
        disableDefaultUI: true, mapId: "DEMO_MAP_ID"
    });

    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer({
        map: map, suppressMarkers: true,
        polylineOptions: { strokeColor: "#4285F4", strokeWeight: 6 }
    });

    startGPS();
}

function startGPS() {
    navigator.geolocation.watchPosition(pos => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        const firstFix = !lastUserPos;
        lastUserPos = coords;

        if (!userMarker) {
            userMarker = new google.maps.Marker({
                position: coords, map: map,
                icon: { path: google.maps.SymbolPath.CIRCLE, scale: 8, fillColor: "#4285F4", fillOpacity: 1, strokeColor: "white", strokeWeight: 2 }
            });
        } else {
            userMarker.setPosition(coords);
        }

        // Si es la primera vez que detecta el GPS, forzamos la ruta inmediatamente
        if (firstFix) {
            updateRouteLayout();
        }
        
        checkArrival();
    }, (err) => {
        document.getElementById('dist-txt').innerText = "Error GPS: Activa tu ubicacion";
    }, { enableHighAccuracy: true });
}

function updateRouteLayout() {
    if (!lastUserPos || !directionsService) return;
    
    const target = waypoints[state.currentIndex];
    const mode = state.travelMode === 'WALKING' ? google.maps.TravelMode.WALKING : google.maps.TravelMode.DRIVING;

    directionsService.route({
        origin: lastUserPos,
        destination: { lat: target.lat, lng: target.lng },
        travelMode: mode
    }, (result, status) => {
        const distTxt = document.getElementById('dist-txt');
        if (status === "OK") {
            directionsRenderer.setDirections(result);
            const leg = result.routes[0].legs[0];
            distTxt.innerHTML = `Estás a <strong>${leg.distance.text}</strong>`;
            
            const timeSpan = state.travelMode === 'WALKING' ? 'time-walk' : 'time-drive';
            const el = document.getElementById(timeSpan);
            if (el) el.innerText = leg.duration.text;
        } else {
            distTxt.innerText = "Error al trazar ruta";
            console.error("Status:", status);
        }
    });
}

function checkArrival() {
    const pt = waypoints[state.currentIndex];
    const distance = google.maps.geometry.spherical.computeDistanceBetween(
        new google.maps.LatLng(lastUserPos.lat, lastUserPos.lng),
        new google.maps.LatLng(pt.lat, pt.lng)
    );

    if (distance < 20 && !state.isNear) {
        state.isNear = true;
        const zone = document.getElementById('arrival-zone');
        if (zone) zone.innerHTML = `<button class="btn btn-arrival" onclick="nextStep()" style="margin-top:10px;">¡HE LLEGADO!</button>`;
    }
}

function startAdventure() { state.isIntro = false; render(); }

function nextStep() {
    if (state.currentIndex < waypoints.length - 1) {
        state.currentIndex++;
        state.isNear = false;
        render();
    } else {
        alert("¡Mision completada!");
    }
}

function changeMode(m) {
    state.travelMode = m;
    document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(`btn-${m}`).classList.add('active');
    updateRouteLayout();
}

function loadAnim(url) {
    const container = document.getElementById('lottie-box');
    if (container) lottie.loadAnimation({ container, renderer: 'svg', loop: true, autoplay: true, path: url });
}

document.addEventListener('DOMContentLoaded', render);