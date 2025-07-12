let audioContext, analyser, microphone, scriptProcessor;
let frecuencias = [];
let grabando = false;

function iniciarGrabacion() {
  navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;

    microphone = audioContext.createMediaStreamSource(stream);
    scriptProcessor = audioContext.createScriptProcessor(2048, 1, 1);

    microphone.connect(analyser);
    analyser.connect(scriptProcessor);
    scriptProcessor.connect(audioContext.destination);

    grabando = true;
    frecuencias = [];

    scriptProcessor.onaudioprocess = function () {
      if (!grabando) return;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyser.getByteFrequencyData(dataArray);

      // Encontrar índice de mayor energía
      let maxIndex = 0;
      for (let i = 1; i < bufferLength; i++) {
        if (dataArray[i] > dataArray[maxIndex]) {
          maxIndex = i;
        }
      }

      // Convertir índice a frecuencia
      const frecuenciaDominante = maxIndex * audioContext.sampleRate / analyser.fftSize;

      // Solo registrar si está en el rango humano típico
      if (frecuenciaDominante >= 85 && frecuenciaDominante <= 255) {
        frecuencias.push(frecuenciaDominante);
        const promedio = frecuencias.reduce((a, b) => a + b, 0) / frecuencias.length;
        document.getElementById("frecuencia").innerText = `Frecuencia media: ${promedio.toFixed(2)} Hz`;
      }
    };

    reconocerVoz();
  });
}

function reconocerVoz() {
  const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.lang = 'es-PE';
  recognition.start();

  recognition.onresult = function (e) {
    grabando = false;

    const texto = e.results[0][0].transcript;
    document.getElementById("resultado").innerText = `Mensaje: "${texto}"`;

    let frecuenciaMedia = 0;
    if (frecuencias.length > 0) {
      frecuenciaMedia = frecuencias.reduce((a, b) => a + b, 0) / frecuencias.length;
    }

    document.getElementById("frecuencia").innerText = 
    `Frecuencia media: ${frecuenciaMedia.toFixed(2)} Hz`;

    const genero = frecuenciaMedia > 160 ? "Femenino" : "Masculino";
    document.getElementById("genero").innerText = `Género detectado: ${genero}`;

    const synth = window.speechSynthesis;
    const utter = new SpeechSynthesisUtterance(texto);
    utter.lang = 'es-PE';
    const voces = synth.getVoices();

    utter.voice = voces.find(v =>
      genero === "Femenino" ? v.name.includes("Female") : v.name.includes("Male")
    ) || voces[0];

    synth.speak(utter);
  };
}