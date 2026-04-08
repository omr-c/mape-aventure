/* =========================================================
   CONFIGURACIÓN DE PISTAS: ENTRENAMIENTO LOCAL
   ========================================================= */
const waypoints = [
    {
        id: 1,
        title: "Base Central",
        lat: 19.251102613683297, 
        lng: -98.22911261075458, 
        clue: "Estás en el centro de mando. Camina hacia la esquina para iniciar la expedición.",
        unlockCode: "BASE",
        successMessage: "¡GPS Calibrado! Has salido de la base con éxito.",
        isFinal: false
    },
    {
        id: 2,
        title: "La Esquina",
        lat: 19.251060831932246, 
        lng: -98.22923331016183,
        clue: "Busca el punto donde la ruta cambia de dirección. La esquina te espera.",
        unlockCode: "ESQUINA",
        successMessage: "Posición confirmada en el hito Alpha. El terreno se vuelve interesante.",
        isFinal: false
    },
    {
        id: 3,
        title: "Zona de Avistamiento",
        lat: 19.25098613119978, 
        lng: -98.22952701204791,
        clue: "Avanza hacia el horizonte. El tesoro de prueba está muy cerca.",
        unlockCode: "PRUEBA",
        successMessage: "¡ENTRENAMIENTO COMPLETADO CON ÉXITO!",
        isFinal: true
    }
];

const config = { 
    radius: 10 // Metros de tolerancia para el desbloqueo
};

/* =========================================================
   ESTADO GLOBAL DE LA APP
   ========================================================= */
let state = {
    currentIndex: 0,
    isIntro: true,
    isNear: false,
    watchId: null
};

const app = document.getElementById('app-container');

/* =========================================================
   MOTOR DE RENDERIZADO (UI)
   ========================================================= */
function render() {
    // Limpieza total del contenedor antes de redibujar
    app.innerHTML = '';
    
    if (state.isIntro) {
        app.innerHTML = `
            <h1>Expedición</h1>
            <p style="margin-bottom:20px;">Sigue las pistas, calibra tu instinto y encuentra el tesoro oculto.</p>
            <div id="lottie-box" class="lottie-container"></div>
            <button class="btn" onclick="start()">Iniciar Expedición</button>
        `;
        // Delay técnico para asegurar que el DOM existe antes de cargar la animación
        setTimeout(() => loadAnim('https://assets3.lottiefiles.com/packages/lf20_m64pyl9b.json'), 150);
        return;
    }

    const pt = waypoints[state.currentIndex];

    if (state.isNear) {
        // PANTALLA DE ÉXITO (HITO LOGRADO)
        app.innerHTML = `
            <h1 style="color:var(--success-color)">¡Hito Logrado!</h1>
            <div id="lottie-box" class="lottie-container"></div>
            <div class="clue-card" style="border-left-color: var(--success-color); margin-bottom:20px;">
                <p style="font-weight:600;">${pt.successMessage}</p>
            </div>
            <button class="btn" onclick="${pt.isFinal ? 'finish()' : 'next()'}">
                ${pt.isFinal ? 'REVELAR FINAL' : 'SIGUIENTE PISTA'}
            </button>
        `;
        setTimeout(() => loadAnim('https://assets8.lottiefiles.com/packages/lf20_j46b8w98.json'), 150);
    } else {
        // PANTALLA DE BÚSQUEDA ACTIVADA
        app.innerHTML = `
            <h2>Hito #${pt.id}: ${pt.title}</h2>
            <div class="clue-card">
                <p class="clue-text">"${pt.clue}"</p>
                <div id="distance-indicator" class="cold">Localizando señal...</div>
            </div>
            <div id="lottie-box" class="lottie-container" style="height:150px;"></div>
            <div id="backdoor-panel">
                <button id="btn-emergency" onclick="showBackdoor()">¿Problemas con el GPS?</button>
                <div id="emergency-area" style="display:none; margin-top:15px;">
                    <input type="text" id="unlock-code" placeholder="CÓDIGO DE HITO">
                    <button class="btn" style="padding:8px 15px; font-size:0.8rem;" onclick="checkCode()">Validar</button>
                </div>
            </div>
        `;
        setTimeout(() => loadAnim('https://assets10.lottiefiles.com/packages/lf20_6w9ofw6o.json'), 150);
    }
}

/* =========================================================
   UTILIDADES Y LÓGICA
   ========================================================= */

function loadAnim(url) {
    const container = document.getElementById('lottie-box');
    if (!container) return;

    try {
        lottie.loadAnimation({
            container: container,
            renderer: 'svg',
            loop: true,
            autoplay: true,
            path: url
        });
    } catch (e) {
        console.error("Lottie detectó un error al cargar:", e);
    }
}

function start() {
    state.isIntro = false;
    render();
    initGPS();
}

function next() {
    state.currentIndex++;
    state.isNear = false;
    render();
}

function finish() {
    // Aquí es donde luego pondremos la lógica de la declaración final
    alert("¡Felicidades! Has completado el entrenamiento de la expedición.");
    location.reload(); 
}

function initGPS() {
    if (!navigator.geolocation) {
        alert("Tu dispositivo no admite navegación GPS.");
        return;
    }

    state.watchId = navigator.geolocation.watchPosition(pos => {
        const pt = waypoints[state.currentIndex];
        const dist = getDist(pos.coords.latitude, pos.coords.longitude, pt.lat, pt.lng);
        
        // Actualización del Debug Info (Esquina inferior izquierda)
        const debug = document.getElementById('debug-info');
        if(debug) {
            debug.innerText = `D: ${dist.toFixed(1)}m | Precisión: ${pos.coords.accuracy.toFixed(1)}m`;
        }

        const indicator = document.getElementById('distance-indicator');
        if (indicator) {
            if (dist < 15) {
                indicator.className = 'hot';
                indicator.innerText = '¡Estás en el punto exacto!';
            } else if (dist < 40) {
                indicator.className = 'warm';
                indicator.innerText = 'Te estás acercando...';
            } else {
                indicator.className = 'cold';
                indicator.innerText = 'Sigue el camino...';
            }
        }

        // Validación de proximidad
        if (dist <= config.radius && !state.isNear) {
            state.isNear = true;
            if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
            render();
        }
    }, err => {
        console.warn("Error GPS:", err.message);
    }, { 
        enableHighAccuracy: true, 
        maximumAge: 0, 
        timeout: 10000 
    });
}

// Fórmula de Haversine para distancia entre dos puntos
function getDist(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Radio de la Tierra en metros
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// Control del Backdoor (Acceso manual)
function showBackdoor() {
    const area = document.getElementById('emergency-area');
    if(area) area.style.display = 'block';
}

function checkCode() {
    const input = document.getElementById('unlock-code').value.toUpperCase().trim();
    if (input === waypoints[state.currentIndex].unlockCode) {
        state.isNear = true;
        render();
    } else {
        alert("Código de expedición incorrecto.");
    }
}

// Inicio de la aplicación
render();
