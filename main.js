/* =========================================================
   1. CONFIGURACIÓN Y HITOS
   ========================================================= */
const waypoints = [
    { id: 1, lat: 19.25093570220489, lng: -98.22879059918756, clue: "Inicia la travesía. Sigue los puntos.", msg: "¡Hito 1 alcanzado!" },
    { id: 2, lat: 19.24596032923307, lng: -98.23556108398105, clue: "DESTINO FINAL.", msg: "¡SISTEMA COMPLETADO!", isFinal: true }
];

let state = { currentIndex: 0, isIntro: true, isNear: false, travelMode: 'WALKING' };
let map, userMarker, directionsService, directionsRenderer;
let lastUserPos = null;

/* =========================================================
   2. FUNCIONES DE INTERFAZ
   ========================================================= */

function render() {
    const app = document.getElementById('app-container');
    if (!app) return;
    app.innerHTML = `
        <div class="transport-selector" style="background: white; padding: 10px; border-radius: 20px; display: flex; justify-content: space-around; box-shadow: 0 4px 12px rgba(0,0,0,0.1); margin: 10px;">
            <div onclick="setMode('DRIVING')" style="cursor:pointer; text-align:center; flex:1; padding: 8px; border-radius:15px; background: ${state.travelMode === 'DRIVING' ? '#E8F0FE' : 'transparent'};">
                <span style="font-size:20px;">🚗</span>
                <div id="time-driving" style="font-size:11px; font-weight:bold; color:#1967D2;">-- min</div>
            </div>
            <div onclick="setMode('WALKING')" style="cursor:pointer; text-align:center; flex:1; padding: 8px; border-radius:15px; background: ${state.travelMode === 'WALKING' ? '#E8F0FE' : 'transparent'};">
                <span style="font-size:20px;">🚶</span>
                <div id="time-walking" style="font-size:11px; font-weight:bold; color:#1967D2;">-- min</div>
            </div>
        </div>
        <div id="map" style="height: 500px; width: 100%; border-radius: 20px;"></div>
        <div class="clue-card" style="margin: 10px; padding: 15px; background: white; border-radius: 15px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <p id="distance-info">Obteniendo ubicación...</p>
        </div>
    `;
    initGoogleMap();
}

/* =========================================================
   3. LÓGICA DE MAPAS (REPLICANDO GOOGLE MAPS)
   ========================================================= */

function initGoogleMap() {
    directionsService = new google.maps.DirectionsService();
    
    // Estilo de puntos como en image_d48c9d.png
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
        zoom: 15,
        center: { lat: waypoints[0].lat, lng: waypoints[0].lng },
        gestureHandling: 'greedy',
        disableDefaultUI: false,
        streetViewControl: true, // Activa el "Pegman" para Street View (image_d50b49)
        mapTypeControl: true,
        tilt: 45
    });

    directionsRenderer.setMap(map);
    startTracking();
}

function startTracking() {
    navigator.geolocation.watchPosition(pos => {
        const { latitude, longitude } = pos.coords;
        lastUserPos = { lat: latitude, lng: longitude };
        
        if (!userMarker) {
            userMarker = new google.maps.Marker({
                position: lastUserPos,
                map: map,
                icon: { path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW, scale: 6, fillColor: "#4285F4", fillOpacity: 1, strokeWeight: 2, strokeColor: "white" }
            });
        } else {
            userMarker.setPosition(lastUserPos);
        }

        updateRoute();
    }, null, { enableHighAccuracy: true });
}

function updateRoute() {
    if (!lastUserPos) return;

    const pt = waypoints[state.currentIndex];
    const request = {
        origin: lastUserPos,
        destination: { lat: pt.lat, lng: pt.lng },
        travelMode: google.maps.TravelMode[state.travelMode]
    };

    directionsService.route(request, (result, status) => {
        if (status === 'OK') {
            directionsRenderer.setDirections(result);
            
            // Ajustar el mapa para que se vea TODA la ruta (Previsualización)
            const bounds = result.routes[0].bounds;
            map.fitBounds(bounds);

            const leg = result.routes[0].legs[0];
            const id = state.travelMode === 'DRIVING' ? 'time-driving' : 'time-walking';
            document.getElementById(id).innerText = leg.duration.text;
            document.getElementById('distance-info').innerHTML = `Hacia hito ${state.currentIndex + 1}: <strong>${leg.duration.text}</strong> (${leg.distance.text})`;
        }
    });
}

function setMode(mode) {
    state.travelMode = mode;
    render();
}

document.addEventListener('DOMContentLoaded', () => render());