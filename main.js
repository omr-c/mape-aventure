/* --- CONFIGURACIÓN DE PISTAS: ENTRENAMIENTO LOCAL --- */
const waypoints = [
    {
        id: 1,
        title: "Punto de Partida: Base Central",
        lat: 19.251102613683297, 
        lng: -98.22911261075458, 
        clue: "Estás en el centro de mando. Camina hacia la esquina de la propiedad para iniciar la expedición.",
        unlockCode: "BASE",
        successMessage: "¡Sistema de navegación calibrado! Has salido de la base con éxito.",
        isFinal: false
    },
    {
        id: 2,
        title: "Hito Alpha: La Esquina",
        lat: 19.251060831932246, 
        lng: -98.22923331016183,
        clue: "Busca el punto donde la ruta cambia de dirección. La esquina te espera.",
        unlockCode: "ESQUINA",
        successMessage: "Posición confirmada en el Hito Alpha. El terreno se vuelve interesante.",
        isFinal: false
    },
    {
        id: 3,
        title: "Objetivo Final: Zona de Avistamiento",
        lat: 19.25098613119978, 
        lng: -98.22952701204791,
        clue: "Avanza 30 metros hacia el horizonte. El tesoro de prueba está cerca.",
        unlockCode: "PRUEBA",
        successMessage: "¡EXPEDICIÓN DE ENTRENAMIENTO COMPLETADA!",
        isFinal: true
    }
];

const config = {
    radius: 10, // Radio ajustado a 10 metros para pruebas en casa/calle
    finalMsg: "Entrenamiento finalizado. El sistema está listo para la gran aventura.",
};