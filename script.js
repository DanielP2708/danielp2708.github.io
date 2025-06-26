//inicializar juego
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    backgroundColor: '#222222',
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

const game = new Phaser.Game(config);

//Creacion de valores iniciales
let monedas = [];
let sonidos = [];
let pattern = [];
let playerInput = [];
let level = 1;
let nivelTexto;
let golpesTexto;
let mostrandoPatron = false;

//Carga de archivos de imagenes y audio
function preload() {
    this.load.image('coin_red', 'assets/images/coin_red.png');
    this.load.image('coin_blue', 'assets/images/coin_blue.png');
    this.load.image('coin_green', 'assets/images/coin_green.png');

    this.load.audio('sound1', 'assets/sounds/coin1.wav');
    this.load.audio('sound2', 'assets/sounds/coin2.wav');
    this.load.audio('sound3', 'assets/sounds/coin3.wav');
}


function create() {
    //generar valores de las monedas
    const colors = ['red', 'blue', 'green'];
    const positions = [200, 400, 600];

    //para cada moneda...
    for (let i = 0; i < 3; i++) {
        //insertar nombre y valores de imagen
        const moneda = this.add.image(positions[i], 300, 'coin_' + colors[i])
        .setScale(0.5)
        .setInteractive();
        moneda.colorIndex = i;
        //Si el cursor pasa sobre la moneda, 
        //vibra y reproduce sonido
        moneda.on('pointerover', () => {
            if (!mostrandoPatron) {
                reproducirSonido(i);
                vibrar(moneda);
            }
        });
        //cuando se selecciona la moneda,
        //vibra y reproduce sonido. Además,
        //verifica el orden
        moneda.on('pointerdown', () => {
            if (!mostrandoPatron) {
                reproducirSonido(i);
                vibrar(moneda);
                playerInput.push(i);
                verificarInput();
            }
        });
        monedas.push(moneda);

        //Se inserta un sonido a cada moneda
        sonidos.push(this.sound.add('sound' + (i + 1)));

        //Valores de los textos de nivel y golpes:
        nivelTexto = this.add.text(20, 20, 'Nivel: ', {
            font: '24px Arial',
            fill: '#ffffff'
        });
        golpesTexto = this.add.text(20, 50, 'Golpes: ', {
            font: '24px Arial',
            fill: '#ffffff'
        });
    }

    iniciarNivel(this);
}

//Generación de textos y valores iniciales para cada nivel
function iniciarNivel(scene) {

    //textos de golpes y nivel
    nivelTexto.setText('Nivel: ' + level);
    golpesTexto.setText('Golpes: ' + (pattern.length + 1));

    //generación de nuevos patrones
    pattern = [];
    playerInput = [];
    mostrandoPatron = true;

    //generación del orden aleatorio
    for (let i = 0; i < level + 2; i++) {
        pattern.push(Phaser.Math.Between(0, monedas.length - 1));
    }

    reproducirPatron(scene, 0);
}

//Patron que reproduce el juego al inicio del nivel
//(incluye sonidos y mecanicas de movimiento de la moneda)
function reproducirPatron(scene, index) {
    if (index >= pattern.length) {
        mostrandoPatron = false;
        return;
    }

    const i = pattern[index];
    const moneda = monedas[i];

    //Hay un tiempo de espera entre monedas
    scene.time.delayedCall(500, () => {
        vibrar(moneda);
        reproducirSonido(i);
        scene.time.delayedCall(600, () => {
            reproducirPatron(scene, index + 1);
        });
    });
}

//funcion de dinámica de vibración de la moneda
function vibrar(moneda) {
    // Guarda posición original
    const originalX = moneda.originalX || moneda.x; 

    if (moneda.vibrando) return;

    moneda.vibrando = true;

    // Tween de vibración
    game.scene.scenes[0].tweens.add({
        //valores
        targets: moneda,
        x: originalX + 10,
        duration: 50,
        yoyo: true,
        repeat: 3,
        //al realizar las 3 repeticiones
        //se detiene
        onComplete: () => {
            moneda.x = originalX;
            moneda.vibrando = false;
        }
    });
    if (!moneda.originalX) {
        moneda.originalX = originalX;
    }
}

//reproduce sonido de la moneda segun su indice
function reproducirSonido(index) {
    sonidos[index].play();
}

//verificar el orden que el jugador selecciona las monedas
function verificarInput() {
    for (let i = 0; i < playerInput.length; i++) {

        //Sí esta mal, manda una alerta de fallo y reinicia el juego
        if (playerInput[i] !== pattern[i]) {
            alert('¡Fallaste! Intenta de nuevo.');
            level = 1;
            iniciarNivel(game.scene.scenes[0]);
            return;
        }
    }

    //Si acierta todo el patrón, pasa al siguiente nivel
    if (playerInput.length === pattern.length) {
        alert('¡Correcto! Pasas al siguiente nivel.');
        level++;
        iniciarNivel(game.scene.scenes[0]);
    }
}

//Por el momento no hay animaciones
//que se reproduzcan indefinidamente
function update() {
}
