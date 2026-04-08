/* =========================================================
   ESTRUCTURA DE DATOS
   ========================================================= */
const waypoints = [
    { id: 1, lat: 19.251102613683297, lng: -98.22911261075458, clue: "El inicio de la excursión. Camina hacia la esquina para orientarte.", successMessage: "¡GPS Sincronizado! Primera etapa completada." },
    { id: 2, lat: 19.251060831932246, lng: -98.22923331016183, clue: "Sigue el camino hasta la esquina. El mapa revela un nuevo secreto.", successMessage: "¡Excelente! Estás siguiendo el rastro correctamente." },
    { id: 3, lat: 19.25098613119978, lng: -98.22952701204791, clue: "Llega al destino final. El tesoro está justo frente a ti.", successMessage: "¡HAS LLEGADO AL DESTINO FINAL!", isFinal: true }
];

const config = { radius: 10 };
let state = { currentIndex: 0, isIntro: true, isNear: false, isFinished: false };
let map, userMarker, userCircle, targetMarker;

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
        <p>Acompaña la brújula y descubre el destino final de esta aventura.</p>
        <div id="lottie-box" style="height:250px;"></div>
        <button class="btn" onclick="start()">Comenzar Excursión</button>
    `;
    setTimeout(() => loadAnim('https://lottie.host/7e604f14-9492-49f9-9f79-e3623f990928/S0W9z8Cg0r.json'), 100);
}

function renderNavigation() {
    const pt = waypoints[state.currentIndex];
    app.innerHTML = `
        <div class="travel-timeline">
            <div class="timeline-line"></div>
            ${[1,2,3].map(num => `<div class="step ${state.currentIndex+1 > num || (state.currentIndex+1==num && state.isNear) ? 'completed' : (state.currentIndex+1==num ? 'active' : '')}">${num}</div>`).join('')}
        </div>
        <div id="map"></div>
        ${state.isNear ? `
            <h1 style="color:var(--success-color)">¡Hito Logrado!</h1>
            <div id="lottie-box" style="height:150px;"></div>
            <div class="clue-card" style="border-left-color: var(--success-color);"><p>${pt.successMessage}</p></div>
            <button class="btn" onclick="${pt.isFinal ? 'openChest()' : 'next()'}">${pt.isFinal ? 'ABRIR COFRE' : 'SIGUIENTE ETAPA'}</button>
        ` : `
            <h1>Etapa ${pt.id}</h1>
            <div class="clue-card">
                <p>"${pt.clue}"</p>
                <div id="distance-indicator" class="cold">Localizando señal...</div>
            </div>
            <div id="lottie-box" style="height:150px;"></div>
        `}
    `;
    
    setTimeout(() => {
        initMap(pt.lat, pt.lng);
        loadAnim(state.isNear ? 'https://lottie.host/4e650083-057d-419b-986c-0d33e08f5999/b1D0pZqfM9.json' : 'https://lottie.host/276709f1-3444-4861-9c63-45f8f5533777/mR3mUvA9X2.json');
    }, 50);
}

function renderFinal() {
    app.innerHTML = `
        <div style="padding-top:20px;">
            <h1>¡Destino Alcanzado!</h1>
            <div id="lottie-box" style="height:300px;"></div>
            <div class="final-card" id="chest-message" style="display:none;">
                <h2 style="color:var(--gold);">El Tesoro de la Excursión</h2>
                <p style="margin: 15px 0;">¡Felicidades por completar el viaje! Aquí puedes poner tu mensaje especial.</p>
                <div id="croquis-container"></div>
            </div>
        </div>
    `;
    loadAnim('https://lottie.host/9e5352c7-0f89-4972-88f6-a9f9392f6645/6B2m7aYl1r.json');
    setTimeout(() => { document.getElementById('chest-message').style.display = 'block'; }, 2300);
}

/* =========================================================
   LÓGICA DE MAPA Y GPS
   ========================================================= */

function initMap(tLat, tLng) {
    if (map) map.remove();
    map = L.map('map', { zoomControl: false }).setView([tLat, tLng], 17);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
    targetMarker = L.marker([tLat, tLng]).addTo(map).bindPopup("Tu destino").openPopup();
}

function initGPS() {
    navigator.geolocation.watchPosition(pos => {
        if (state.isFinished) return;
        const { latitude, longitude, accuracy } = pos.coords;
        const pt = waypoints[state.currentIndex];
        const dist = getDist(latitude, longitude, pt.lat, pt.lng);

        if (map) {
            if (userMarker) map.removeLayer(userMarker);
            if (userCircle) map.removeLayer(userCircle);
            userMarker = L.circleMarker([latitude, longitude], { color: '#3498db', radius: 8, fillOpacity: 1 }).addTo(map);
            userCircle = L.circle([latitude, longitude], { radius: accuracy, weight: 1 }).addTo(map);
        }

        const indicator = document.getElementById('distance-indicator');
        if (indicator) {
            indicator.className = dist < 15 ? 'hot' : (dist < 40 ? 'warm' : 'cold');
            indicator.innerText = dist < 15 ? '¡ESTÁS AQUÍ!' : (dist < 40 ? 'Cerca...' : 'Sigue el mapa...');
        }

        if (dist <= config.radius && !state.isNear) {
            state.isNear = true;
            if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
            render();
        }
        document.getElementById('debug-info').innerText = `D: ${dist.toFixed(1)}m | P: ${accuracy.toFixed(0)}m`;
    }, null, { enableHighAccuracy: true });
}

/* =========================================================
   UTILIDADES
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

function getDist(lat1, lon1, lat2, lon2) {
    const R = 6371e3;
    const dLat = (lat2-lat1) * Math.PI/180;
    const dLon = (lon2-lon1) * Math.PI/180;
    const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

render();