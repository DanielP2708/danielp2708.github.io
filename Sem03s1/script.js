var juego = new Phaser.Game(370, 900, Phaser.CANVAS, 'bloque_juego');

var fondoJuego;
var personaje;
var teclaDerecha;
var teclaIzquierda;
var enemigos;
var nivel = 1;

var balas;
var tiempoBala = 0;
var botonDisparo;
var sonidoDisparo;
var sonidoExplosion;
var musicaFondo;

// Estado de inicio
var estadoInicio = {
    preload: function () {
        juego.load.image('fondo', 'imagenes/img1.png');
        juego.load.audio('musica', 'sonidos/musica.mp3');
    },
    create: function () {
        fondoJuego = juego.add.tileSprite(0, 0, 370, 900, 'fondo');

        var nombre = juego.add.text(juego.world.centerX, 300, 'Daniel Purizaca', {
            font: '32px Arial',
            fill: '#ffffff'
        });
        nombre.anchor.setTo(0.5);

        var boton = juego.add.text(juego.world.centerX, 500, 'Iniciar Juego', {
            font: '28px Arial',
            fill: '#ff0000',
            backgroundColor: '#ffffff',
            padding: 10
        });
        boton.anchor.setTo(0.5);
        boton.inputEnabled = true;
        boton.input.useHandCursor = true;
        boton.events.onInputDown.add(this.iniciarJuego, this);

        musicaFondo = juego.add.audio('musica');
        musicaFondo.loop = true;
        musicaFondo.play();
    },
    iniciarJuego: function () {
        musicaFondo.stop();
        juego.state.start('principal');
    }
};

var estadoPrincipal = {
    preload: function () {
        juego.load.image('fondo', 'imagenes/img1.png');
        juego.load.spritesheet('personaje', 'imagenes/spritesheet1.png', 256, 256);
        juego.load.spritesheet('enemigo', 'imagenes/enemigo1.png', 416, 416);
        juego.load.image('laser', 'imagenes/laser.png');
        juego.load.audio('disparo', 'sonidos/disparo.mp3');
        juego.load.audio('explosion', 'sonidos/explosion.mp3');
    },
    create: function () {
        fondoJuego = juego.add.tileSprite(0, 0, 370, 900, 'fondo');
        personaje = juego.add.sprite(90, 650, 'personaje');
        personaje.animations.add('movimiento', [0, 1, 2, 3, 4], 10, true);

        botonDisparo = juego.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
        balas = juego.add.group();
        balas.enableBody = true;
        balas.physicsBodyType = Phaser.Physics.ARCADE;
        balas.createMultiple(20, 'laser');
        balas.setAll('anchor.x', -2);
        balas.setAll('anchor.y', 1);
        balas.setAll('outOfBoundsKill', true);
        balas.setAll('checkWorldBounds', true);

        enemigos = juego.add.group();
        enemigos.enableBody = true;
        enemigos.physicsBodyType = Phaser.Physics.ARCADE;
        this.crearEnemigos();

        teclaDerecha = juego.input.keyboard.addKey(Phaser.Keyboard.RIGHT);
        teclaIzquierda = juego.input.keyboard.addKey(Phaser.Keyboard.LEFT);

        sonidoDisparo = juego.add.audio('disparo');
        sonidoExplosion = juego.add.audio('explosion');
    },
    update: function () {
        if (teclaDerecha.isDown) {
            personaje.x += 2;
            personaje.animations.play('movimiento');
        } else if (teclaIzquierda.isDown) {
            personaje.x -= 2;
            personaje.animations.play('movimiento');
        }

        var bala;
        if (botonDisparo.isDown) {
            if (juego.time.now > tiempoBala) {
                bala = balas.getFirstExists(false);
                if (bala) {
                    bala.reset(personaje.x + 92, personaje.y + 100);
                    bala.body.velocity.y = -300;
                    tiempoBala = juego.time.now + 200;
                    sonidoDisparo.play();
                }
            }
        }
        juego.physics.arcade.overlap(balas, enemigos, this.colision, null, this);
    },
    colision: function (bala, enemigo) {
        bala.kill();
        enemigo.kill();
        sonidoExplosion.play();

        if (enemigos.countLiving() == 0) {
            if (nivel == 1) {
                nivel = 2;
                this.crearEnemigos();
            } else if (nivel == 2) {
                juego.add.text(juego.world.centerX, juego.world.centerY, '¡Felicitaciones, Daniel Purizaca', {
                    font: '30px Arial',
                    fill: '#00FF00',
                    align: 'center'
                }).anchor.setTo(0.5);
            }
        }
    },
    crearEnemigos: function () {
        enemigos.removeAll(true);
        var filas = (nivel == 1) ? 3 : 5;
        var columnas = (nivel == 1) ? 3 : 5;
        for (var y = 0; y < filas; y++) {
            for (var x = 0; x < columnas; x++) {
                var enemig = enemigos.create(x * 48, y * 48, 'enemigo');
                enemig.anchor.setTo(0.5);
                enemig.scale.setTo(0.2);
            }
        }
        enemigos.x = 60;
        enemigos.y = 200;

        var animacion = juego.add.tween(enemigos).to(
            { x: 200 },
            1000, Phaser.Easing.Linear.None, true, 0, 100, true
        );
    }
};

juego.state.add('inicio', estadoInicio);
juego.state.add('principal', estadoPrincipal);
juego.state.start('inicio');
