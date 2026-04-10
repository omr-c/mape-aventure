/* =========================================================
   CONFIGURACIÓN Y ESTADOS (Mantiene tus 8 coordenadas)
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
   INICIALIZACIÓN DE MAPA "MODO CAMINATA"
   ========================================================= */

function initGoogleMap(tLat, tLng) {
    const target = { lat: tLat, lng: tLng };
    directionsService = new google.maps.DirectionsService();
    
    // Configuración estética de los puntos (Dots)
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
            strokeOpacity: 0, // Línea base invisible
            icons: [{
                icon: lineSymbol,
                offset: "0",
                repeat: "20px" // Espaciado entre puntos
            }]
        }
    });

    map = new google.maps.Map(document.getElementById("map"), {
        zoom: 20,
        center: target,
        disableDefaultUI: true,
        heading: 0,
        tilt: 45, // Inclinación tipo navegación
        mapId: '90f87356969d889c' // Opcional: ID de mapa personalizado
    });

    directionsRenderer.setMap(map);

    // Icono del objetivo (Punto de llegada)
    new google.maps.Marker({
        position: target,
        map: map,
        icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 12,
            fillColor: "#EA4335",
            fillOpacity: 1,
            strokeWeight: 3,
            strokeColor: "white"
        }
    });

    // Marcador de Usuario (Flecha de navegación)
    userMarker = new google.maps.Marker({
        position: target,
        map: map,
        zIndex: 100,
        icon: {
            path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
            scale: 8,
            fillColor: "#4285F4",
            fillOpacity: 1,
            strokeWeight: 3,
            strokeColor: "white"
        }
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
            
            // Simulación de rotación de cámara
            const step = result.routes[0].legs[0].steps[0];
            if (step) {
                // Orientamos el mapa ligeramente hacia el siguiente paso
                map.panTo({ lat: uLat, lng: uLng });
            }
        }
    });
}

function initGPS() {
    navigator.geolocation.watchPosition(pos => {
        if (state.isFinished) return;
        const { latitude, longitude, heading, accuracy } = pos.coords;
        const pt = waypoints[state.currentIndex];
        
        const userPos = new google.maps.LatLng(latitude, longitude);
        const targetPos = new google.maps.LatLng(pt.lat, pt.lng);
        const dist = google.maps.geometry.spherical.computeDistanceBetween(userPos, targetPos);

        // Actualizar marcador y rotación
        if (userMarker) {
            userMarker.setPosition(userPos);
            if (heading !== null) {
                const icon = userMarker.getIcon();
                icon.rotation = heading;
                userMarker.setIcon(icon);
                map.setHeading(heading); // Rota el mapa con ella
            }
        }

        updatePath(latitude, longitude);

        const indicator = document.getElementById('distance-indicator');
        if (indicator) {
            indicator.innerText = dist < 15 ? '¡CASI LLEGAS!' : `A ${Math.round(dist)}m de la meta`;
            indicator.className = dist < 10 ? 'hot' : 'cold';
        }

        // Radio de llegada de 5 metros
        if (dist <= 5 && !state.isNear) {
            state.isNear = true;
            if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
            render();
        }
    }, err => console.error(err), { enableHighAccuracy: true });
}

/* =========================================================
   FUNCIONES DE FLUJO (start, next, render, etc.)
   ========================================================= */
// Mantén las funciones de renderIntro, renderNavigation, checkBypass, 
// next, start y renderFinal del código anterior.

function start() { state.isIntro = false; render(); initGPS(); }
function next() { state.currentIndex++; state.isNear = false; render(); }
function openChest() { state.isFinished = true; render(); }

function renderNavigation() {
    const pt = waypoints[state.currentIndex];
    const app = document.getElementById('app-container');
    app.innerHTML = `
        <div class="travel-timeline" style="overflow-x: auto; white-space: nowrap; padding: 10px;">
            ${waypoints.map((w, i) => `<div class="step ${state.currentIndex > i || (state.currentIndex === i && state.isNear) ? 'completed' : (state.currentIndex === i ? 'active' : '')}" style="display:inline-flex; margin: 0 4px;">${i + 1}</div>`).join('')}
        </div>
        <div id="map" style="height: 380px; border-radius: 24px; margin-bottom: 12px; border: 3px solid #FFF; box-shadow: 0 8px 24px rgba(0,0,0,0.12);"></div>
        <div class="clue-card">
            ${state.isNear ? `<h2 style="color:#27AE60">¡Hito Localizado!</h2><p>Código de acceso validado.</p>` : `<p>"${pt.clue}"</p>`}
            <div id="distance-indicator" class="cold">Iniciando GPS...</div>
        </div>
        <div style="margin-top: 15px;">
            ${state.isNear ? 
                `<button class="btn" onclick="${pt.isFinal ? 'openChest()' : 'next()'}">${pt.isFinal ? 'FINALIZAR RUTA' : 'SIGUIENTE TRAMO'}</button>` : 
                `<input type="text" id="bypass-code" placeholder="Código" style="padding: 12px; border-radius: 12px; border: 1px solid #ddd; width: 50%;">
                 <button class="btn" onclick="checkBypass()" style="padding: 10px 15px;">OK</button>`
            }
        </div>
    `;
    setTimeout(() => initGoogleMap(pt.lat, pt.lng), 50);
}

function checkBypass() {
    const input = document.getElementById('bypass-code').value;
    if (input.toUpperCase() === "AVENTURA2026") {
        state.isNear = true;
        render();
    }
}

render();