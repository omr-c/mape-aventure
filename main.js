const waypoints = [
    { id: 1, lat: 19.251102613683297, lng: -98.22911261075458, clue: "El inicio de la excursión. Camina hacia la esquina para orientarte.", successMessage: "¡Señal GPS fija! Vamos por buen camino." },
    { id: 2, lat: 19.251060831932246, lng: -98.22923331016183, clue: "Sigue el camino hasta la esquina. El mapa revela un nuevo secreto.", successMessage: "¡Excelente! Estás siguiendo el rastro correctamente." },
    { id: 3, lat: 19.25098613119978, lng: -98.22952701204791, clue: "Llega al destino final. El tesoro está justo frente a ti.", successMessage: "¡HAS LLEGADO AL DESTINO FINAL!", isFinal: true }
];

let state = { currentIndex: 0, isIntro: true, isNear: false, isFinished: false };
let map, userMarker, targetMarker;

const app = document.getElementById('app-container');

function render() {
    app.innerHTML = '';
    if (state.isIntro) renderIntro();
    else if (state.isFinished) renderFinal();
    else renderNavigation();
}

function renderIntro() {
    app.innerHTML = `
        <h1>Expedición Pro</h1>
        <p>Utilizando tecnología satelital para guiarte al tesoro.</p>
        <div id="lottie-box" style="height:250px;"></div>
        <button class="btn" onclick="start()">Activar Radar</button>
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
        <div id="map" style="height: 300px; border-radius: 15px; margin-bottom: 15px;"></div>
        ${state.isNear ? `
            <h1 style="color:var(--success-color)">¡Punto Localizado!</h1>
            <div class="clue-card" style="border-left-color: var(--success-color);"><p>${pt.successMessage}</p></div>
            <button class="btn" onclick="${pt.isFinal ? 'openChest()' : 'next()'}">${pt.isFinal ? 'REVELAR TESORO' : 'PRÓXIMO HITO'}</button>
        ` : `
            <h1>Etapa ${pt.id}</h1>
            <div class="clue-card"><p>"${pt.clue}"</p><div id="distance-indicator" class="cold">Rastreando...</div></div>
        `}
    `;
    setTimeout(() => initGoogleMap(pt.lat, pt.lng), 50);
}

function initGoogleMap(tLat, tLng) {
    const center = { lat: tLat, lng: tLng };
    map = new google.maps.Map(document.getElementById("map"), {
        zoom: 18,
        center: center,
        disableDefaultUI: true,
        styles: [ { "featureType": "poi", "stylers": [ { "visibility": "off" } ] } ] // Limpia el mapa de iconos extra
    });

    targetMarker = new google.maps.Marker({
        position: center,
        map: map,
        icon: { url: "http://maps.google.com/mapfiles/ms/icons/red-pushpin.png" }
    });

    userMarker = new google.maps.Marker({
        position: center,
        map: map,
        icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 7,
            fillColor: "#4285F4",
            fillOpacity: 1,
            strokeWeight: 2,
            strokeColor: "white",
        }
    });
}

function initGPS() {
    navigator.geolocation.watchPosition(pos => {
        if (state.isFinished) return;
        const { latitude, longitude } = pos.coords;
        const pt = waypoints[state.currentIndex];
        const userPos = new google.maps.LatLng(latitude, longitude);
        const targetPos = new google.maps.LatLng(pt.lat, pt.lng);
        
        const dist = google.maps.geometry.spherical.computeDistanceBetween(userPos, targetPos);

        if (userMarker) userMarker.setPosition(userPos);
        
        // Auto-centrado suave
        if (map && dist > 20) {
            const bounds = new google.maps.LatLngBounds();
            bounds.extend(userPos);
            bounds.extend(targetPos);
            map.panTo(userPos);
        }

        const indicator = document.getElementById('distance-indicator');
        if (indicator) {
            indicator.className = dist < 15 ? 'hot' : (dist < 40 ? 'warm' : 'cold');
            indicator.innerText = dist < 15 ? '¡OBJETIVO A LA VISTA!' : (dist < 40 ? 'Te acercas...' : 'Sigue la ruta...');
        }

        if (dist <= 10 && !state.isNear) {
            state.isNear = true;
            render();
        }
    }, null, { enableHighAccuracy: true });
}

// ... Mantén tus funciones de loadAnim, renderFinal, start, etc. del código anterior ...

function start() { state.isIntro = false; render(); initGPS(); }
function next() { state.currentIndex++; state.isNear = false; render(); }
function openChest() { state.isFinished = true; render(); }

function loadAnim(url) {
    const container = document.getElementById('lottie-box');
    if (!container) return;
    container.innerHTML = '';
    lottie.loadAnimation({ container, renderer: 'svg', loop: true, autoplay: true, path: url });
}

function renderFinal() {
    app.innerHTML = `
        <div style="padding-top:20px;">
            <h1>¡Misión Cumplida!</h1>
            <div id="lottie-box" style="height:300px;"></div>
            <div class="final-card" id="chest-message" style="display:none;">
                <h2 style="color:var(--gold);">El Tesoro de la Excursión</h2>
                <p>¡Felicidades! Has demostrado ser una gran exploradora.</p>
                <div id="croquis-container"></div>
            </div>
        </div>
    `;
    loadAnim('https://lottie.host/9e5352c7-0f89-4972-88f6-a9f9392f6645/6B2m7aYl1r.json');
    setTimeout(() => { document.getElementById('chest-message').style.display = 'block'; }, 2300);
}

render();