/* =========================================================
   CONFIGURACIÓN DE LA EXCURSIÓN
   ========================================================= */
const waypoints = [
    {
        id: 1,
        lat: 19.251102613683297, 
        lng: -98.22911261075458, 
        clue: "El punto de partida. Camina hacia la esquina para calibrar la brújula del destino.",
        successMessage: "¡Primera etapa superada! El viaje apenas comienza.",
    },
    {
        id: 2,
        lat: 19.251060831932246, 
        lng: -98.22923331016183,
        clue: "Busca el cambio de rumbo en la esquina. Sigue tu instinto.",
        successMessage: "Posición confirmada. El tesoro está emitiendo señal cerca de aquí.",
    },
    {
        id: 3,
        lat: 19.25098613119978, 
        lng: -98.22952701204791,
        clue: "Avanza hacia el horizonte final. Estás a pasos de descubrir el secreto.",
        successMessage: "¡Has llegado al destino final de la excursión!",
        isFinal: true
    }
];

const config = { radius: 10 };

let state = {
    currentIndex: 0,
    isIntro: true,
    isNear: false,
    isFinished: false
};

const app = document.getElementById('app-container');

/* =========================================================
   SISTEMA DE RENDERIZADO
   ========================================================= */

function render() {
    app.innerHTML = '';

    // Pantalla de Inicio
    if (state.isIntro) {
        app.innerHTML = `
            <h1 style="margin-top:20px;">Expedición Personal</h1>
            <p>Sigue los hitos en el mapa para completar la excursión.</p>
            <div id="lottie-box" class="lottie-container"></div>
            <button class="btn" onclick="start()">Iniciar Viaje</button>
        `;
        setTimeout(() => loadAnim('https://lottie.host/7e604f14-9492-49f9-9f79-e3623f990928/S0W9z8Cg0r.json'), 100);
        return;
    }

    // Pantalla Final (Cofre)
    if (state.isFinished) {
        renderFinal();
        return;
    }

    // Interfaz de Navegación con Timeline
    renderNavigation();
}

function renderNavigation() {
    const pt = waypoints[state.currentIndex];
    
    // Inyectar Timeline
    app.innerHTML = `
        <div class="travel-timeline">
            <div class="timeline-line"></div>
            <div class="step ${state.currentIndex >= 0 ? (state.currentIndex > 0 || state.isNear ? 'completed' : 'active') : ''}">1</div>
            <div class="step ${state.currentIndex >= 1 ? (state.currentIndex > 1 || (state.currentIndex == 1 && state.isNear) ? 'completed' : 'active') : ''}">2</div>
            <div class="step ${state.currentIndex >= 2 ? (state.isNear ? 'completed' : 'active') : ''}">3</div>
        </div>
    `;

    if (state.isNear) {
        app.innerHTML += `
            <h1 style="color:var(--success-color)">¡Punto Alcanzado!</h1>
            <div id="lottie-box" class="lottie-container"></div>
            <div class="clue-card" style="border-left-color: var(--success-color);">
                <p style="font-weight:600;">${pt.successMessage}</p>
            </div>
            <button class="btn" onclick="${pt.isFinal ? 'openChest()' : 'next()'}">
                ${pt.isFinal ? 'ABRIR COFRE' : 'SIGUIENTE ETAPA'}
            </button>
        `;
        setTimeout(() => loadAnim('https://lottie.host/4e650083-057d-419b-986c-0d33e08f5999/b1D0pZqfM9.json'), 100);
    } else {
        app.innerHTML += `
            <h1>Etapa ${pt.id}</h1>
            <div class="clue-card">
                <p>"${pt.clue}"</p>
                <div id="distance-indicator" class="cold">Calculando ruta...</div>
            </div>
            <div id="lottie-box" class="lottie-container"></div>
        `;
        setTimeout(() => loadAnim('https://lottie.host/276709f1-3444-4861-9c63-45f8f5533777/mR3mUvA9X2.json'), 100);
    }
}

function renderFinal() {
    app.innerHTML = `
        <div style="padding-top:20px;">
            <h1>¡Misión Cumplida!</h1>
            <div id="lottie-box" class="lottie-container" style="height:300px;"></div>
            <div class="final-card" id="chest-message" style="display:none;">
                <h2 style="color:var(--gold); margin-bottom:15px;">Para mi exploradora favorita</h2>
                <p>Aquí irá el mensaje que desees y el croquis que planeas añadir.</p>
                <div id="croquis-container" style="margin-top:15px;"></div>
            </div>
        </div>
    `;
    // Animación de cofre abriéndose
    loadAnim('https://lottie.host/9e5352c7-0f89-4972-88f6-a9f9392f6645/6B2m7aYl1r.json');
    
    setTimeout(() => {
        document.getElementById('chest-message').style.display = 'block';
        if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
    }, 2200);
}

/* =========================================================
   LÓGICA FUNCIONAL
   ========================================================= */

function loadAnim(url) {
    const container = document.getElementById('lottie-box');
    if (!container) return;
    container.innerHTML = '';
    lottie.loadAnimation({
        container: container,
        renderer: 'svg',
        loop: true,
        autoplay: true,
        path: url
    });
}

function start() { state.isIntro = false; render(); initGPS(); }
function next() { state.currentIndex++; state.isNear = false; render(); }
function openChest() { state.isFinished = true; render(); }

function initGPS() {
    navigator.geolocation.watchPosition(pos => {
        if (state.isFinished) return;
        const pt = waypoints[state.currentIndex];
        const dist = getDist(pos.coords.latitude, pos.coords.longitude, pt.lat, pt.lng);
        
        const debug = document.getElementById('debug-info');
        if(debug) debug.innerText = `D: ${dist.toFixed(1)}m | P: ${pos.coords.accuracy.toFixed(0)}m`;

        const indicator = document.getElementById('distance-indicator');
        if (indicator) {
            if (dist < 15) { indicator.className = 'hot'; indicator.innerText = '¡ESTÁS LLEGANDO!'; }
            else if (dist < 40) { indicator.className = 'warm'; indicator.innerText = 'La señal aumenta...'; }
            else { indicator.className = 'cold'; indicator.innerText = 'Buscando hito...'; }
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