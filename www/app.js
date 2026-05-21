let secuenciaJuego = [];
let secuenciaJugador = [];
let puntuacion = 0;
let recordAbsoluto = 0;
let jugando = false;
let esperandoEntrada = false;

let timerIntervalo;
let tiempoLimite = 4000; // Tiempo inicial base: 4 segundos
let tiempoRestante = 0;

// Inicializar el contexto de audio web de forma segura
let audioCtx = null;

const currentScoreDisplay = document.getElementById('current-score');
const highScoreDisplay = document.getElementById('high-score');
const statusDisplay = document.getElementById('game-status');
const timerBar = document.getElementById('timer-bar');
const btnStart = document.getElementById('btn-start');

// Cargar el récord guardado al iniciar
document.addEventListener('DOMContentLoaded', () => {
    const recordGuardado = localStorage.getItem('colorvani_record');
    if (recordGuardado) {
        recordAbsoluto = parseInt(recordGuardado);
        highScoreDisplay.innerText = recordAbsoluto;
    }
});

// Función de sonido
function reproducirTono(frecuencia, tipo, duracion) {
    try {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        
        const oscilador = audioCtx.createOscillator();
        const nodoGanancia = audioCtx.createGain();
        
        oscilador.type = tipo; 
        oscilador.frequency.setValueAtTime(frecuencia, audioCtx.currentTime);
        
        nodoGanancia.gain.setValueAtTime(0.15, audioCtx.currentTime);
        nodoGanancia.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duracion);
        
        oscilador.connect(nodoGanancia);
        nodoGanancia.connect(audioCtx.destination);
        
        oscilador.start();
        oscilador.stop(audioCtx.currentTime + duracion);
    } catch (e) {
        console.log("Audio no soportado: ", e);
    }
}

function sonidoBotonColor(id) {
    const frecuencias = [261.63, 293.66, 329.63, 392.00]; 
    reproducirTono(frecuencias[id], 'triangle', 0.25);
}

function sonidoTicTac() {
    reproducirTono(800, 'square', 0.03);
}

function sonidoGameOver() {
    try {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, audioCtx.currentTime);
        osc.frequency.linearRampToValueAtTime(40, audioCtx.currentTime + 0.6);
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.0001, audioCtx.currentTime + 0.6);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.6);
    } catch(e){}
}

function iniciarJuego() {
    if (jugando) return;
    
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    jugando = true;
    puntuacion = 0;
    secuenciaJuego = [];
    tiempoLimite = 4000; // Reseteamos el tiempo inicial
    currentScoreDisplay.innerText = puntuacion;
    btnStart.style.display = 'none';
    
    reproducirTono(523.25, 'sine', 0.1);
    setTimeout(() => reproducirTono(659.25, 'sine', 0.1), 100);
    setTimeout(() => reproducirTono(783.99, 'sine', 0.3), 200);
    
    setTimeout(proximaRonda, 800);
}

function proximaRonda() {
    secuenciaJugador = [];
    esperandoEntrada = false;
    statusDisplay.innerText = "¡Atento a la secuencia!";
    statusDisplay.style.color = "#fbbf24";
    
    secuenciaJuego.push(Math.floor(Math.random() * 4));
    
    // --- NUEVO: Aumento DRÁSTICO de dificultad por punto ---
    // El tiempo para responder se reduce agresivamente en cada ronda.
    if (tiempoLimite > 1000) {
        // Primeras rondas: baja rápido (4s -> 3.5s -> 3s -> 2.5s -> 2s...)
        tiempoLimite -= 500; 
    } else if (tiempoLimite > 600) {
        // Intermedias: baja un poco más lento pero es letal (2s -> 1.7s -> 1.4s...)
        tiempoLimite -= 300;  
    } else if (tiempoLimite > 200) {
        // Límite extremo de velocidad: baja muy poco pero es casi instantáneo
        tiempoLimite -= 50;  
    }
    // tiempoLimite nunca bajará de 150ms para mantenerlo jugable por robots.

    mostrarSecuencia();
}

function mostrarSecuencia() {
    let i = 0;
    // Acelerar la muestra de la secuencia conforme sube la puntuación
    let velocidadMuestra = Math.max(150, 550 - (puntuacion * 30));

    const intervalo = setInterval(() => {
        iluminarBoton(secuenciaJuego[i]);
        i++;
        if (i >= secuenciaJuego.length) {
            clearInterval(intervalo);
            setTimeout(() => {
                statusDisplay.innerText = "¡TU TURNO! ¡RÁPIDO!";
                statusDisplay.style.color = "#34d399";
                esperandoEntrada = true;
                iniciarTemporizadorPresion(); // <-- NUEVO: Temporizador de Muerte Súbita
            }, 300);
        }
    }, velocidadMuestra); 
}

function iluminarBoton(id) {
    const boton = document.getElementById(`btn-${id}`);
    boton.classList.add('active');
    sonidoBotonColor(id); 
    // Duración del parpadeo más corta a mayor puntuación
    let duracionParpadeo = Math.max(100, 250 - (puntuacion * 15));
    setTimeout(() => {
        boton.classList.remove('active');
    }, duracionParpadeo);
}

// --- NUEVO: Temporizador de Muerte Súbita por Rapidez ---
function iniciarTemporizadorPresion() {
    clearInterval(timerIntervalo);
    tiempoRestante = 100; // Porcentaje
    timerBar.style.width = '100%';
    timerBar.style.backgroundColor = '#34d399';

    // Calculamos el paso del temporizador según el límite de tiempo de la ronda actual
    const paso = tiempoLimite / 100;
    let contadorTics = 0;

    timerIntervalo = setInterval(() => {
        if (!esperandoEntrada) {
            clearInterval(timerIntervalo);
            return;
        }

        tiempoRestante--;
        timerBar.style.width = `${tiempoRestante}%`;

        // Feedback sonoro de presión
        contadorTics++;
        // El tic-tac suena más rápido a medida que queda menos tiempo y la ronda es más difícil
        let frecuenciaTics = Math.max(1, 4 - Math.floor(puntuacion / 3));
        if (tiempoRestante < 40 && contadorTics % frecuenciaTics === 0) {
            sonidoTicTac();
        }

        // Feedback visual de peligro extremo
        if (tiempoRestante < 35) {
            timerBar.style.backgroundColor = '#dc2626';
            // Solo actualizamos el estado si no estamos ya mostrando peligro
            if(statusDisplay.innerText !== "¡MUERTE INMINENTE!") {
                statusDisplay.innerText = "¡MUERTE INMINENTE!";
                statusDisplay.style.color = "#dc2626";
            }
        }

        if (tiempoRestante <= 0) {
            clearInterval(timerIntervalo);
            gameOver("¡DEMASIADO LENTO!"); // <-- NUEVO MOTIVO: Muerte por rapidez
        }
    }, paso);
}

function pressionarBoton(id) {
    if (!esperandoEntrada) return;
    
    iluminarBoton(id);
    secuenciaJugador.push(id);
    
    const indiceActual = secuenciaJugador.length - 1;
    if (secuenciaJugador[indiceActual] !== secuenciaJuego[indiceActual]) {
        gameOver("¡Color incorrecto!");
        return;
    }
    
    if (secuenciaJugador.length === secuenciaJuego.length) {
        clearInterval(timerIntervalo); // Detener el temporizador de presión
        puntuacion++;
        currentScoreDisplay.innerText = puntuacion;
        
        // Verificar y guardar nuevo récord
        if (puntuacion > recordAbsoluto) {
            recordAbsoluto = puntuacion;
            highScoreDisplay.innerText = recordAbsoluto;
            localStorage.setItem('colorvani_record', recordAbsoluto); // Guarda permanentemente
        }
        
        // Pausa breve antes de la siguiente ronda acelerada
        setTimeout(proximaRonda, 400);
    }
}

function gameOver(motivo) {
    clearInterval(timerIntervalo);
    esperandoEntrada = false;
    jugando = false;
    timerBar.style.width = '0%';
    
    sonidoGameOver(); 
    
    statusDisplay.innerText = `${motivo} GAME OVER`;
    statusDisplay.style.color = "#ef4444";
    
    btnStart.innerText = "REINTENTAR DESAFÍO";
    btnStart.style.display = 'inline-block';
}
