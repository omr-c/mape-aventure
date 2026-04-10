/* =========================================================
   1. CONFIGURACION DE RUTA
   ========================================================= */
const waypoints = [
    { id: 1, lat: 19.25093570220489, lng: -98.22879059918756, clue: "Sigue los puntos azules para iniciar.", isFinal: false },
    { id: 2, lat: 19.24596032923307, lng: -98.23556108398105, clue: "¡Casi llegas al tesoro!", isFinal: true }
];

let state = { 
    currentIndex: 0, 
    isIntro: true, 
    isNear: false, 
    travelMode: 'WALKING' 
};

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
            <div id="map" style="width:100%; height:100%;"></div>
            <div class="info-card">
                <p id="dist-txt" style="font-weight:bold; color:#1a73e8; font-size:1.1em;">Calculando ruta...</p>
                <p class="clue">"${pt.clue}"</p>
                ${state.isNear ? `<button class="btn btn-arrival" onclick="nextStep()">¡HE LLEGADO!</button>` : ''}
            </div>
        `;
        // Esperar un breve momento para que el DOM se asiente
        setTimeout(initMapLogic, 100);
    }
}

/* =========================================================
   3. LOGICA DE NAVEGACION (CORE)
   ========================================================= */
function initMapLogic() {
    if (map) return; 

    const pt = waypoints[state.currentIndex];
    
    // Crear el mapa centrado en el objetivo inicial
    map = new google.maps.Map(document.getElementById("map"), {
        zoom: 17,
        center: { lat: pt.lat, lng: pt.lng },
        disableDefaultUI: true,
        mapId: "DEMO_MAP_ID",
        styles: [{ "featureType": "poi", "stylers": [{ "visibility": "off" }] }]
    });

    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer({
        map: map,
        suppressMarkers: true,
        polylineOptions: { strokeColor: "#4285F4", strokeWeight: 6, strokeOpacity: 0.8 }
    });

    startGPS();
}

function startGPS() {
    if (!navigator.geolocation) {
        alert("Tu navegador no soporta GPS");
        return;
    }

    navigator.geolocation.watchPosition(pos => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        lastUserPos = coords;

        // Actualizar o crear marcador de usuario (Punto azul de Google)
        if (!userMarker) {
            userMarker = new google.maps.Marker({
                position: coords,
                map: map,
                icon: {
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: 7,
                    fillColor: "#4285F4",
                    fillOpacity: 1,
                    strokeColor: "white",
                    strokeWeight: 2
                }
            });
        } else {
            userMarker.setPosition(coords);
        }

        updateRouteLayout();
        checkArrival();
    }, (err) => console.error("Error GPS:", err), { enableHighAccuracy: true });
}

function updateRouteLayout() {
    if (!lastUserPos || !directionsService) return;
    
    const target = waypoints[state.currentIndex];

    directionsService.route({
        origin: lastUserPos,
        destination: { lat: target.lat, lng: target.lng },
        travelMode: google.maps.TravelMode[state.travelMode]
    }, (result, status) => {
        if (status === "OK") {
            directionsRenderer.setDirections(result);
            const leg = result.routes[0].legs[0];
            
            // Actualizar textos
            const distTxt = document.getElementById('dist-txt');
            if (distTxt) distTxt.innerText = `${leg.distance.text} • ${leg.duration.text}`;
            
            const timeSpan = state.travelMode === 'WALKING' ? 'time-walk' : 'time-drive';
            const el = document.getElementById(timeSpan);
            if (el) el.innerText = leg.duration.text;
        }
    });
}

function checkArrival() {
    const pt = waypoints[state.currentIndex];
    const distance = google.maps.geometry.spherical.computeDistanceBetween(
        new google.maps.LatLng(lastUserPos.lat, lastUserPos.lng),
        new google.maps.LatLng(pt.lat, pt.lng)
    );

    // Si estas a menos de 20 metros
    if (distance < 20 && !state.isNear) {
        state.isNear = true;
        render(); 
    }
}

/* =========================================================
   4. CONTROLADORES
   ========================================================= */
function startAdventure() { 
    state.isIntro = false; 
    render(); 
}

function nextStep() {
    if (state.currentIndex < waypoints.length - 1) {
        state.currentIndex++;
        state.isNear = false;
        // Limpiar para forzar refresco de ruta
        if (directionsRenderer) directionsRenderer.setDirections({routes: []});
        render();
    } else {
        alert("¡Felicidades! Has llegado al final de la expedicion.");
    }
}

function changeMode(m) {
    state.travelMode = m;
    // Actualizar UI de botones sin re-renderizar todo el mapa
    document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(`btn-${m}`).classList.add('active');
    updateRouteLayout();
}

function loadAnim(url) {
    const container = document.getElementById('lottie-box');
    if (container) {
        lottie.loadAnimation({
            container: container,
            renderer: 'svg',
            loop: true,
            autoplay: true,
            path: url
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    render();
});