// Inicialización
const params = new URLSearchParams(window.location.search);
const dificultad = params.get('dificultad') || 'facil';

const configDificultad = {
  facil: { total: 10, velocidad: 0.05 },
  medio: { total: 20, velocidad: 0.1 },
  dificil: { total: 30, velocidad: 0.13 }
};

const totalNPCs = configDificultad[dificultad].total;
const velocidad = configDificultad[dificultad].velocidad;

const gameArea = document.getElementById('gameArea');
const estado = document.getElementById('estado');
const vivosSpan = document.getElementById('vivos');
const eliminadosSpan = document.getElementById('eliminados');
const injustosSpan = document.getElementById('injustos');

let npcs = [];
let luzVerde = true;
let eliminados = 0;
let injustos = 0;
let esperandoComando = false;
let juegoTerminado = false;

const sonidoDisparo = new Audio('sonidos/disparo.mp3');

function crearNPCs() {
  for (let i = 0; i < totalNPCs; i++) {
    const npc = document.createElement('div');
    npc.classList.add('npc');
    npc.style.left = `${Math.random() * 95}%`;
    npc.dataset.moviendo = 'false';
    npc.dataset.y = '0';
    npc.dataset.seMovio = 'false';
    npc.dataset.rebelde = 'false';
    gameArea.appendChild(npc);
    npcs.push(npc);
  }
  actualizarContador();
  animarNPCs();
}

function animarNPCs() {
  function mover() {
    if (juegoTerminado) return;

    npcs.forEach(npc => {
      if (npc.dataset.muerto === 'true') return;
      let y = parseFloat(npc.dataset.y);

      if (luzVerde) {
        y += velocidad;
        npc.dataset.seMovio = 'false';
        npc.dataset.moviendo = 'true';
      } else {
        if (npc.dataset.rebelde === 'true') {
          const nuevoY = y + velocidad;
          if (nuevoY !== y) {
            npc.dataset.seMovio = 'true';
            y = nuevoY;
          }
        }
        npc.dataset.moviendo = 'false';
      }

      if (y >= 480) {
        juegoTerminado = true;
        mostrarMensajeFinal();
      }

      npc.dataset.y = y;
      npc.style.top = `${y}px`;
    });

    requestAnimationFrame(mover);
  }
  mover();
}

function cambiarLuz(roja) {
  luzVerde = !roja;
  estado.innerText = roja ? '🔴 Luz Roja - ¡Detecta a los que se mueven!' : 
                            '🟢 Luz Verde - Los jugadores se mueven';
  if (!roja) {
    setTimeout(() => {
      esperarLuzRoja();
    }, 4000);
  }
}

function esperarLuzRoja() {
  estado.innerText = '🎙️ ¡Di "Luz roja"!';
  esperandoComando = true;
  reconocerVoz();
}

function reconocerVoz() {
  try {
    const RecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!RecognitionClass) {
      alert("Tu navegador no soporta reconocimiento de voz.");
      return;
    }

    const recognition = new RecognitionClass(); // NUEVA instancia cada vez
    recognition.lang = 'es-PE';
    recognition.start();

    recognition.onresult = (e) => {
      const texto = e.results[0][0].transcript.toLowerCase();
      if (texto.includes('luz roja')) {
        reproducirVoz('Luz roja');
        activarLuzRoja();
      } else {
        estado.innerText = '❌ No se reconoció "Luz roja", intenta de nuevo.';
        setTimeout(() => reconocerVoz(), 2000);
      }
    };

    recognition.onend = () => {
      if (esperandoComando && luzVerde === false) {
        setTimeout(() => reconocerVoz(), 1000);
      }
    };

  } catch (error) {
    console.error("Error al iniciar reconocimiento de voz:", error);
  }
}

function reproducirVoz(texto) {
  const synth = window.speechSynthesis;
  const utter = new SpeechSynthesisUtterance(texto);
  const voces = synth.getVoices();
  const voz = voces.find(v => v.name.includes('Male') || v.name.includes('Female')) || voces[0];
  utter.voice = voz;
  utter.lang = 'es-PE'; // Fuerza idioma español
  synth.speak(utter);
}

function activarLuzRoja() {
  cambiarLuz(true);
  // Elegir rebeldes aleatorios (10%-20% de los vivos)
  const vivos = npcs.filter(n => n.dataset.muerto !== 'true');
  const cantidadRebeldes = Math.ceil(vivos.length * (Math.random() * 0.1 + 0.1));
  const seleccionados = vivos.sort(() => Math.random() - 0.5).slice(0, cantidadRebeldes);
  seleccionados.forEach(npc => npc.dataset.rebelde = 'true');

  esperarDisparos();
}

function esperarDisparos() {
  npcs.forEach(npc => {
    npc.onclick = () => {
      if (npc.dataset.muerto !== 'true') {
        const seMovia = npc.dataset.seMovio === 'true';
        sonidoDisparo.play();

        if (seMovia) eliminados++;
        else injustos++;
        npc.style.background = seMovia ? 'red' : 'gray';
        npc.dataset.muerto = 'true';
        npc.onclick = null;
        actualizarContador();
        revisarFin();
      }
    };
  });

  setTimeout(() => {
    npcs.forEach(npc => {
      npc.dataset.seMovio = 'false';
      npc.dataset.movible = 'false';
      npc.dataset.rebelde = 'false';
      if (npc.dataset.muerto !== 'true') {
        npc.style.background = 'lime';
      }
    });
    cambiarLuz(false);
  }, 5000);
}

function actualizarContador() {
  const vivos = npcs.filter(npc => npc.dataset.muerto !== 'true').length;
  vivosSpan.innerText = `Jugadores vivos: ${vivos}`;
  eliminadosSpan.innerText = `Correctamente eliminados: ${eliminados}`;
  injustosSpan.innerText = `Eliminados injustamente: ${injustos}`;
}

function revisarFin() {
  const vivos = npcs.filter(npc => npc.dataset.muerto !== 'true').length;
  if (vivos === 0 && !juegoTerminado) {
    juegoTerminado = true;
    mostrarMensajeFinal();
  }
}

function mostrarMensajeFinal() {
  estado.innerText = '';
  gameArea.innerHTML += `
    <div id="mensajeFinal" style="position:absolute; top:50%; left:50%; 
         transform:translate(-50%, -50%); background:#000; padding:30px; 
         border-radius:10px; text-align:center; box-shadow:0 0 10px #000; z-index:10">
      <h2>El juego ha finalizado</h2>
      <p>¿Quieres volver a intentarlo?</p>
      <button onclick="location.reload()">🔁 Volver a jugar</button>
      <button onclick="location.href='dificultad.html'">📋 Elegir dificultad</button>
    </div>
  `;
}

crearNPCs();
cambiarLuz(false);