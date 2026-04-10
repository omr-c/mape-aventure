/* =========================================================
   1. CONFIGURACION DE HITOS
   ========================================================= */
const waypoints = [
    { id: 1, lat: 19.25093570220489, lng: -98.22879059918756, clue: "Inicia la travesia. Los puntos te guiaran.", isFinal: false },
    { id: 2, lat: 19.24596032923307, lng: -98.23556108398105, clue: "¡DESTINO FINAL DETECTADO!", isFinal: true }
];

let state = { 
    currentIndex: 0, 
    isIntro: true, 
    isNear: false, 
    isFinished: false,
    travelMode: 'WALKING' 
};

let map, userMarker, directionsService, directionsRenderer;
let lastUserPos = null;

/* =========================================================
   2. INTERFAZ DE USUARIO (UI)
   ========================================================= */

function render() {
    const app = document.getElementById('app-container');
    if (!app) return;
    app.innerHTML = '';

    if (state.isIntro) {
        app.innerHTML = `
            <div style="padding: 20px;">
                <h1>Sistemas de Navegacion</h1>
                <p>Calculando trazabilidad de rutas...</p>
                <div id="lottie-box" style="height:250px;"></div>
                <button class="btn" onclick="start()">Iniciar Expedicion</button>
            </div>
        `;
        setTimeout(() => loadAnim('https://lottie.host/7e604f14-9492-49f9-9f79-e3623f990928/S0W9z8Cg0r.json'), 100);
    } else if (state.isFinished) {
        app.innerHTML = `<h1>¡Mision Cumplida!</h1><div id="lottie-box" style="height:300px;"></div>`;
        loadAnim('https://lottie.host/9e5352c7-0f89-4972-88f6-a9f9392f6645/6B2m7aYl1r.json');
    } else {
        const pt = waypoints[state.currentIndex];
        app.innerHTML = `
            <div class="transport-selector" style="background: white; padding: 10px; border-radius: 20px; display: flex; justify-content: space-around; box-shadow: 0 4px 12px rgba(0,0,0,0.1); margin: 10px; position: absolute; top: 10px; left: 0; right: 0; z-index: 10;">
                <div onclick="setMode('DRIVING')" style="cursor:pointer; text-align:center; flex:1; padding: 8px; border-radius:15px; background: ${state.travelMode === 'DRIVING' ? '#E8F0FE' : 'transparent'};">
                    <span style="font-size:20px;">🚗</span>
                    <div id="time-driving" style="font-size:11px; font-weight:bold; color:#1967D2;">-- min</div>
                </div>
                <div onclick="setMode('WALKING')" style="cursor:pointer; text-align:center; flex:1; padding: 8px; border-radius:15px; background: ${state.travelMode === 'WALKING' ? '#E8F0FE' : 'transparent'};">
                    <span style="font-size:20px;">🚶</span>
                    <div id="time-walking" style="font-size:11px; font-weight:bold; color:#1967D2;">-- min</div>
                </div>
            </div>

            <div id="map" style="height: 100vh; width: 100%;"></div>

            <div class="clue-card" style="position: absolute; bottom: 30px; left: 10px; right: 10px; background: white; padding: 15px; border-radius: 20px; box-shadow: 0 -4px 12px rgba(0,0,0,0.1); z-index: 10;">
                <p id="distance-info" style="font-weight: bold; color: #1a73e8;">Buscando GPS...</p>
                <p style="font-style: italic; color: #666; font-size: 0.85em; margin-top: 5px;">"${pt.clue}"</p>
                ${state.isNear ? `<button class="btn" style="width:100%; margin: 10px 0 0 0;" onclick="${pt.isFinal ? 'openChest()' : 'next()'}">HE LLEGADO</button>` : ''}
            </div>
        `;
        setTimeout(() => initGoogleMap(pt.lat, pt.lng), 50);
    }
}

/* =========================================================
   3. LOGICA DE MAPAS (MODERNA)
   ========================================================= */

async function initGoogleMap(tLat, tLng) {
    // Importamos las librerias modernas (Estandar 2026)
    const { Map } = await google.maps.importLibrary("maps");
    const { AdvancedMarkerElement, PinElement } = await google.maps.importLibrary("marker");

    const targetPos = { lat: tLat, lng: tLng };
    directionsService = new google.maps.DirectionsService();
    
    directionsRenderer = new google.maps.DirectionsRenderer({
        suppressMarkers: true,
        polylineOptions: { 
            strokeColor: '#4285F4', 
            strokeWeight: 7, 
            strokeOpacity: 0.7 
        }
    });

    map = new Map(document.getElementById("map"), {
        zoom: 16,
        center: targetPos,
        mapId: "DEMO_MAP_ID", // Necesario para Advanced Markers
        disableDefaultUI: true
    });

    directionsRenderer.setMap(map);

    // Marcador de Destino (Pin Rojo Moderno)
    const pinDestino = new PinElement({ background: "#EA4335", glyphColor: "white", scale: 1.1 });
    new AdvancedMarkerElement({ map, position: targetPos, content: pinDestino.element });

    if (lastUserPos) updatePath();
}

function setMode(mode) {
    state.travelMode = mode;
    render();
}

function updatePath() {
    if (!lastUserPos || !directionsService) return;
    const pt = waypoints[state.currentIndex];

    const request = {
        origin: lastUserPos,
        destination: { lat: pt.lat, lng: pt.lng },
        travelMode: google.maps.TravelMode[state.travelMode]
    };

    directionsService.route(request, (result, status) => {
        if (status === 'OK') {
            directionsRenderer.setDirections(result);
            
            // EFECTO GOOGLE MAPS: Ajusta la camara para ver toda la ruta
            map.fitBounds(result.routes[0].bounds, 80); // 80 es el padding en pixeles

            const leg = result.routes[0].legs[0];
            const id = state.travelMode === 'DRIVING' ? 'time-driving' : 'time-walking';
            
            const timeUI = document.getElementById(id);
            if (timeUI) timeUI.innerText = leg.duration.text;
            
            document.getElementById('distance-info').innerHTML = `Llegada estimada: <strong>${leg.duration.text}</strong> (${leg.distance.text})`;
        } else {
            console.error("Error en Directions:", status);
        }
    });
}

function initGPS() {
    navigator.geolocation.watchPosition(pos => {
        const { latitude, longitude } = pos.coords;
        lastUserPos = { lat: latitude, lng: longitude };
        
        // Actualizar marcador de usuario
        if (map) {
            if (!userMarker) {
                userMarker = new google.maps.marker.AdvancedMarkerElement({
                    map,
                    position: lastUserPos,
                    title: "Tu posicion"
                });
            } else {
                userMarker.position = lastUserPos;
            }
            updatePath();
        }

        // Deteccion de llegada (10 metros)
        const pt = waypoints[state.currentIndex];
        const dist = google.maps.geometry.spherical.computeDistanceBetween(
            new google.maps.LatLng(latitude, longitude),
            new google.maps.LatLng(pt.lat, pt.lng)
        );

        if (dist <= 10 && !state.isNear) {
            state.isNear = true;
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

function loadAnim(url) {
    const container = document.getElementById('lottie-box');
    if (container) lottie.loadAnimation({ container, renderer: 'svg', loop: true, autoplay: true, path: url });
}

document.addEventListener('DOMContentLoaded', () => render());