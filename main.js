// 1. Configuración de puntos (Tus coordenadas de prueba)
const waypoints = [
    {
        id: 1,
        title: "Base Central",
        lat: 19.251102613683297, 
        lng: -98.22911261075458, 
        clue: "Estás en el centro de mando. Camina hacia la esquina para iniciar.",
        unlockCode: "BASE",
        successMessage: "¡GPS Calibrado! Has salido de la base.",
        isFinal: false
    },
    {
        id: 2,
        title: "La Esquina",
        lat: 19.251060831932246, 
        lng: -98.22923331016183,
        clue: "Busca el punto donde la ruta cambia. La esquina te espera.",
        unlockCode: "ESQUINA",
        successMessage: "Posición confirmada en el hito alpha.",
        isFinal: false
    },
    {
        id: 3,
        title: "Zona de Avistamiento",
        lat: 19.25098613119978, 
        lng: -98.22952701204791,
        clue: "Avanza hacia el horizonte. El tesoro de prueba está cerca.",
        unlockCode: "PRUEBA",
        successMessage: "¡ENTRENAMIENTO COMPLETADO!",
        isFinal: true
    }
];

const config = { radius: 10 };

// 2. Estado de la App
let state = {
    currentIndex: 0,
    isIntro: true,
    isNear: false
};

const app = document.getElementById('app-container');

// 3. Funciones de Renderizado
function render() {
    app.innerHTML = '';
    
    if (state.isIntro) {
        app.innerHTML = `
            <h1>Expedición</h1>
            <p>Sigue las pistas para encontrar el tesoro.</p>
            <div id="lottie-box" class="lottie-container"></div>
            <button class="btn" onclick="start()">Iniciar</button>
        `;
        loadAnim('https://assets3.lottiefiles.com/packages/lf20_m64pyl9b.json');
        return;
    }

    const pt = waypoints[state.currentIndex];

    if (state.isNear) {
        app.innerHTML = `
            <h1 style="color:var(--success-color)">¡Hito Logrado!</h1>
            <div id="lottie-box" class="lottie-container"></div>
            <p>${pt.successMessage}</p>
            <button class="btn" onclick="${pt.isFinal ? 'finish()' : 'next()'}">Continuar</button>
        `;
        loadAnim('https://assets8.lottiefiles.com/packages/lf20_j46b8w98.json');
    } else {
        app.innerHTML = `
            <h2>Pista #${pt.id}</h2>
            <div class="clue-card">
                <p>"${pt.clue}"</p>
                <div id="distance-indicator" class="cold">Localizando...</div>
            </div>
            <div id="lottie-box" class="lottie-container"></div>
        `;
        loadAnim('https://assets10.lottiefiles.com/packages/lf20_6w9ofw6o.json');
    }
}

function loadAnim(url) {
    lottie.loadAnimation({
        container: document.getElementById('lottie-box'),
        renderer: 'svg',
        loop: true,
        autoplay: true,
        path: url
    });
}

function start() { state.isIntro = false; render(); initGPS(); }
function next() { state.currentIndex++; state.isNear = false; render(); }
function finish() { alert("¡Entrenamiento completado!"); location.reload(); }

function initGPS() {
    navigator.geolocation.watchPosition(pos => {
        const pt = waypoints[state.currentIndex];
        const dist = getDist(pos.coords.latitude, pos.coords.longitude, pt.lat, pt.lng);
        
        document.getElementById('debug-info').innerText = `Dist: ${dist.toFixed(1)}m | Acc: ${pos.coords.accuracy.toFixed(1)}m`;

        const indicator = document.getElementById('distance-indicator');
        if (indicator) {
            if (dist < 15) { indicator.className = 'hot'; indicator.innerText = '¡Aquí es!'; }
            else if (dist < 40) { indicator.className = 'warm'; indicator.innerText = 'Cerca...'; }
            else { indicator.className = 'cold'; indicator.innerText = 'Sigue buscando'; }
        }

        if (dist <= config.radius && !state.isNear) {
            state.isNear = true;
            render();
        }
    }, err => console.error(err), { enableHighAccuracy: true });
}

function getDist(lat1, lon1, lat2, lon2) {
    const R = 6371e3;
    const dLat = (lat2-lat1) * Math.PI/180;
    const dLon = (lon2-lon1) * Math.PI/180;
    const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// Arrancar
render();
