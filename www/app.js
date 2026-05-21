let secuenciaJuego = [];
let secuenciaJugador = [];
let puntuacion = 0;
let recordAbsoluto = 0;
let jugando = false;
let esperandoEntrada = false;

let timerIntervalo;
let tiempoLimite = 4000; 
let tiempoRestante = 0;

// Inicializar el contexto de audio web de forma segura
let audioCtx = null;

const currentScoreDisplay = document.getElementById('current-score');
const highScoreDisplay = document.getElementById('high-score');
const statusDisplay = document.getElementById('game-status');
const timerBar = document.getElementById('timer-bar');
const btnStart = document.getElementById('btn-start');

// Cargar el récord guardado en el celular al iniciar
document.addEventListener('DOMContentLoaded', () => {
    const recordGuardado = localStorage.getItem('colorpanic_record');
    if (recordGuardado) {
        recordAbsoluto = parseInt(recordGuardado);
        highScoreDisplay.innerText = recordAbsoluto;
    }
});

// Función para generar sonidos retro sin archivos .mp3 externos
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
        console.log("Audio no soportado aún: ", e);
    }
}

// Sonidos específicos para las teclas de colores
function sonidoBotonColor(id) {
    const frecuencias = [261.63, 293.66, 329.63, 392.00]; 
    reproducirTono(frecuencias[id], 'triangle', 0.25);
}

// Sonido rápido de tic-tac para meter presión
function sonidoTicTac() {
    reproducirTono(800, 'square', 0.03);
}

// Sonido descendente y raspado de derrota
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
    tiempoLimite = 4000; 
    currentScoreDisplay.innerText = puntuacion;
    btnStart.style.display = 'none';
    
    // Tono de inicio
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
    
    if (tiempoLimite > 900) {
        tiempoLimite -= 250; 
    } else if (tiempoLimite > 500) {
        tiempoLimite -= 40;  
    }

    mostrarSecuencia();
}

function mostrarSecuencia() {
    let i = 0;
    const intervalo = setInterval(() => {
        iluminarBoton(secuenciaJuego[i]);
        i++;
        if (i >= secuenciaJuego.length) {
            clearInterval(intervalo);
            setTimeout(() => {
                statusDisplay.innerText = "¡TU TURNO! ¡RÁPIDO!";
                statusDisplay.style.color = "#34d399";
                esperandoEntrada = true;
                iniciarTemporizador();
            }, 500);
        }
    }, 550); 
}

function iluminarBoton(id) {
    const boton = document.getElementById(`btn-${id}`);
    boton.classList.add('active');
    sonidoBotonColor(id); 
    setTimeout(() => {
        boton.classList.remove('active');
    }, 250);
}

function iniciarTemporizador() {
    clearInterval(timerIntervalo);
    tiempoRestante = 100;
    timerBar.style.width = '100%';
    timerBar.style.backgroundColor = '#34d399';

    const paso = tiempoLimite / 100;
    let contadorTics = 0;

    timerIntervalo = setInterval(() => {
        if (!esperandoEntrada) {
            clearInterval(timerIntervalo);
            return;
        }

        tiempoRestante--;
        timerBar.style.width = `${tiempoRestante}%`;

        contadorTics++;
        if (tiempoRestante < 40 && contadorTics % 4 === 0) {
            sonidoTicTac();
        }

        if (tiempoRestante < 35) {
            timerBar.style.backgroundColor = '#dc2626';
            statusDisplay.innerText = "¡TIEMPO LÍMITE CASI EXPIRADO!";
            statusDisplay.style.color = "#dc2626";
        }

        if (tiempoRestante <= 0) {
            clearInterval(timerIntervalo);
            gameOver("¡Se te acabó el tiempo!");
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
        clearInterval(timerIntervalo);
        puntuacion++;
        currentScoreDisplay.innerText = puntuacion;
        
        if (puntuacion > recordAbsoluto) {
            recordAbsoluto = puntuacion;
            highScoreDisplay.innerText = recordAbsoluto;
            localStorage.setItem('colorpanic_record', recordAbsoluto);
        }
        
        setTimeout(proximaRonda, 600);
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
    
    btnStart.innerText = "INTENTAR DE NUEVO";
    btnStart.style.display = 'inline-block';
}