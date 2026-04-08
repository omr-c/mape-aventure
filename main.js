/* =========================================================
   CONFIGURACIÓN DE PISTAS (COORDENADAS DE PRUEBA)
   ========================================================= */
const waypoints = [
    {
        id: 1,
        title: "Punto de Partida",
        lat: 19.251102613683297, 
        lng: -98.22911261075458, 
        clue: "Donde todo comienza. Camina hacia la esquina para calibrar los sensores.",
        successMessage: "¡Excelente! El sistema GPS está sincronizado.",
        isFinal: false
    },
    {
        id: 2,
        title: "Hito de Control",
        lat: 19.251060831932246, 
        lng: -98.22923331016183,
        clue: "Sigue el camino hasta la esquina. El mapa se está revelando.",
        successMessage: "Posición confirmada. Estás cerca del objetivo final.",
        isFinal: false
    },
    {
        id: 3,
        title: "Zona del Tesoro",
        lat: 19.25098613119978, 
        lng: -98.22952701204791,
        clue: "Avanza hacia el horizonte. El último secreto te espera allí.",
        successMessage: "¡PRUEBA DE EXPEDICIÓN SUPERADA!",
        isFinal: true
    }
];

const config = { radius: 10 }; // Metros de tolerancia

/* =========================================================
   ESTADO Y LÓGICA DE LA APP
   ========================================================= */
let state = {
    currentIndex: 0,
    isIntro: true,
    isNear: false
};

const app = document.getElementById('app-container');

function render() {
    app.innerHTML = '';
    
    if (state.isIntro) {
        app.innerHTML = `
            <h1>Expedición</h1>
            <p>Sigue las pistas y descubre lo que el destino tiene guardado.</p>
            <div id="lottie-box" class="lottie-container"></div>
            <button class="btn" onclick="start()">Iniciar Expedición</button>
        `;
        setTimeout(() => loadAnim('https://lottie.host/7e604f14-9492-49f9-9f79-e3623f990928/S0W9z8Cg0r.json'), 100);
        return;
    }

    const pt = waypoints[state.currentIndex];

    if (state.isNear) {
        app.innerHTML = `
            <h1 style="color:var(--success-color)">¡Punto Encontrado!</h1>
            <div id="lottie-box" class="lottie-container"></div>
            <div class="clue-card" style="border-left-color: var(--success-color);">
                <p style="font-weight:600; color:var(--success-color)">${pt.successMessage}</p>
            </div>
            <button class="btn" onclick="${pt.isFinal ? 'finish()' : 'next()'}">
                ${pt.isFinal ? 'REVELAR DESTINO' : 'SIGUIENTE PISTA'}
            </button>
        `;
        setTimeout(() => loadAnim('https://lottie.host/4e650083-057d-419b-986c-0d33e08f5999/b1D0pZqfM9.json'), 100);
    } else {
        app.innerHTML = `
            <h2>Pista #${pt.id}</h2>
            <div class="clue-card">
                <p>"${pt.clue}"</p>
                <div id="distance-indicator" class="cold">Localizando...</div>
            </div>
            <div id="lottie-box" class="lottie-container"></div>
        `;
        setTimeout(() => loadAnim('https://lottie.host/276709f1-3444-4861-9c63-45f8f5533777/mR3mUvA9X2.json'), 100);
    }
}

function loadAnim(url) {
    const container = document.getElementById('lottie-box');
    if (!container) return;
    container.innerHTML = ''; // Limpiar

    try {
        lottie.loadAnimation({
            container: container,
            renderer: 'svg',
            loop: true,
            autoplay: true,
            path: url
        }).addEventListener('data_failed', () => {
            container.innerHTML = '<span style="font-size:4rem;">📍</span>';
        });
    } catch (e) {
        container.innerHTML = '<span style="font-size:4rem;">📍</span>';
    }
}

function start() { state.isIntro = false; render(); initGPS(); }
function next() { state.currentIndex++; state.isNear = false; render(); }
function finish() { alert("¡Misión cumplida!"); location.reload(); }

function initGPS() {
    navigator.geolocation.watchPosition(pos => {
        const pt = waypoints[state.currentIndex];
        const dist = getDist(pos.coords.latitude, pos.coords.longitude, pt.lat, pt.lng);
        
        const debug = document.getElementById('debug-info');
        if(debug) debug.innerText = `D: ${dist.toFixed(1)}m | Precisión: ${pos.coords.accuracy.toFixed(0)}m`;

        const indicator = document.getElementById('distance-indicator');
        if (indicator) {
            if (dist < 15) { indicator.className = 'hot'; indicator.innerText = '¡ESTÁS MUY CERCA!'; }
            else if (dist < 40) { indicator.className = 'warm'; indicator.innerText = 'Te estás acercando...'; }
            else { indicator.className = 'cold'; indicator.innerText = 'Sigue la pista...'; }
        }

        if (dist <= config.radius && !state.isNear) {
            state.isNear = true;
            if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
            render();
        }
    }, null, { enableHighAccuracy: true });
}

function getDist(lat1, lon1, lat2, lon2) {
    const R = 6371e3;
    const dLat = (lat2-lat1) * Math.PI/180;
    const dLon = (lon2-lon1) * Math.PI/180;
    const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

render();
