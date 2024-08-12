class GameEntity {
    constructor() {}
}

class Timer extends GameEntity {
    constructor() {
        super(); // Llama al constructor de GameEntity
        this.startTime = null;
        this.timerInterval = null;
    }

    start() {
        this.startTime = new Date();
        this.timerInterval = setInterval(this.update.bind(this), 1000); //asegura que el método update se ejecute 
    }

    update() {
        const currentTime = new Date();
        const elapsedTime = new Date(currentTime - this.startTime); //Esto se hace para poder formatear el tiempo transcurrido 
                                                                    //en horas, minutos y segundos.
        
        //Este método obtiene las horas en formato UTC.
        const hours = String(elapsedTime.getUTCHours()).padStart(2, '0');     //Convierte el número a un dato String
        const minutes = String(elapsedTime.getUTCMinutes()).padStart(2, '0');
        const seconds = String(elapsedTime.getUTCSeconds()).padStart(2, '0'); //padStart es un método de js que añade 0 al inicio cuando 
                                                                              //la longitud sea menor a 2

        document.getElementById('time').textContent = `${hours}:${minutes}:${seconds}`;
        //Accede al elemento HTML con el id ('time') y usa una plantilla de cadena para combinar las horas, minutos y segundos en el formato hh:mm:ss.
    }

    stop() {
        clearInterval(this.timerInterval);
    }

    reset() {
        this.stop();
        document.getElementById('time').textContent = '00:00:00';
    }
}

class Jugador extends GameEntity {
    constructor(color) {
        super();
        this.color = color;
        this.victorias = 0;
        this.derrotas = 0;
        this.moveSpeed = 200; // Velocidad predeterminada
    }

    setMoveSpeed(speed) {
        this.moveSpeed = speed;
    }

    recordVictory() {
        this.victorias++;
        document.getElementById('victorias').textContent = this.victorias.toString();
    }

    recordDefeat() {
        this.derrotas++;
        document.getElementById('derrotas').textContent = this.derrotas.toString();
    }
}

class MoveHistory extends GameEntity {
    constructor() {
        super();
        this.historyStack = []; //Almacena el historial de movs en un
        this.moveCount = 1;
        this.moveHistoryElement = document.getElementById('move-history'); //Será utilizado para mostrar el historial de movimientos.
    }

    recordMove(move) {
        //Comprueba si moveCount es par o impar
        const formattedMove = this.moveCount % 2 === 1 ? `${Math.ceil(this.moveCount / 2)}. ${move}` : `${move} -`;
        this.historyStack.push(formattedMove);
        this.moveHistoryElement.textContent += formattedMove + ' ';
        //Ajusta el desplazamiento vertical de moveHistoryElement para asegurarse de que siempre se vea el último movimiento agregado.
        //scrollTop establece la posición de desplazamiento, y scrollHeight es la altura total del contenido del elemento.
        this.moveHistoryElement.scrollTop = this.moveHistoryElement.scrollHeight;
        this.moveCount++;
    }

    reset() {
        this.historyStack = [];
        this.moveCount = 1;
        this.moveHistoryElement.textContent = '';
    }
}

//Algoritmo principal
class ChessBoardManager extends GameEntity {
    constructor(JugadorBlanco, JugadorNegro) {
        super();
        this.game = new Chess();
        this.JugadorBlanco = JugadorBlanco;
        this.JugadorNegro = JugadorNegro;
        this.board = null;
        this.timer = new Timer();
        this.moveHistory = new MoveHistory();
        this.userColor = 'b';

        this.initializeBoard();
        this.setupEventListeners();
    }

    initializeBoard() {
        const boardConfig = {
            showNotation: true,
            draggable: true, //Permite que las piezas del tablero sean arrastradas (movidas) por el usuario.
            position: 'start',
            //Asocia el evento onDragStart con el método onDragStart de la clase, que se ejecutará cuando el usuario comience a arrastrar una pieza.
            onDragStart: this.onDragStart.bind(this),
            //Asocia el evento onDrop con el método onDrop de la clase, que se ejecutará cuando el usuario suelte una pieza en una casilla.
            onDrop: this.onDrop.bind(this),
            //Asocia el evento onSnapEnd con el método onSnapEnd de la clase, que se ejecutará cuando la pieza termine de moverse a la casilla objetivo.
            onSnapEnd: this.onSnapEnd.bind(this),
            moveSpeed: this.JugadorBlanco.moveSpeed, //Configura la velcidad de movs en funcion de la velocidad de JugadorBlanco
            snapBackSpeed: this.JugadorBlanco.moveSpeed, //Configura la velocidad de regreso de las piezas si se sueltan en una casilla inválida.
            snapSpeed: this.JugadorBlanco.moveSpeed, //Configura la velocidad de ajuste de las piezas cuando se sueltan en una casilla válida.
        };
        this.board = Chessboard('board', boardConfig); //Crea una instancia del tablero de ajedrez 
    }

    setupEventListeners() {
        //querySelector() en JS se utiliza para seleccionar el primer elemento del documento que coincide con un selector CSS especificado
        document.querySelector('.PlayAgain').addEventListener('click', this.resetGame.bind(this));
        document.querySelector('.flip-board').addEventListener('click', this.flipBoard.bind(this));
        document.getElementById('whiteSpeedInput').addEventListener('input', (event) => {
            //Establece la velocidad de movimiento del jugador blanco y convierte el valor de la entrada a un número entero 10.
            this.JugadorBlanco.setMoveSpeed(parseInt(event.target.value, 10));
            //target.value Obtiene el valor del elemento que disparó el evento
            this.updateBoardSpeed();
        });
        document.getElementById('blackSpeedInput').addEventListener('input', (event) => {
            this.JugadorNegro.setMoveSpeed(parseInt(event.target.value, 10));
        });
    }

    //se ejecuta cuando el usuario comienza a arrastrar una pieza.
    onDragStart(source, piece) {
        //Verifica si el juego no ha terminado .game_over() es un método que devuelve true si el juego ha terminado.
        return !this.game.game_over() && piece.search(this.userColor) === 0;
        //piece.search Verifica si la pieza que se está arrastrando pertenece al color del usuario.
    }

    //se ejecuta cuando el usuario suelta una pieza en una casilla.
    onDrop(source, target) {
        const move = this.game.move({ //Intenta realizar un movimiento en el juego, creando un objeto move que almacena la información del movimiento.
            from: source, //Define el movimiento desde la casilla source a la casilla target.
            to: target,
            promotion: 'r', // Siempre promover a reina
        });

        if (move === null) return 'snapback'; //snapback hace que la pieza vuelva a su posición original.

        this.board.position(this.game.fen(), true); //Actualiza la posición del tablero en la interfaz de usuario utilizando la notación FEN

        if (!this.timer.startTime) { //Comprueba si el temporizador no ha comenzado todavía.
            this.timer.start(); 
        }

        this.moveHistory.recordMove(move.san); //Registra el movimiento en el historial utilizando la notación SAN (Standard Algebraic Notation).

        if (this.game.in_checkmate()) {
            this.JugadorNegro.recordDefeat();
            alert("JAQUE MATE! ¡TÚ GANAS!");
            this.timer.stop();
        }
    }

    //se ejecuta cuando la pieza termina de ajustarse en la casilla destino.
    onSnapEnd() {
        this.board.position(this.game.fen());
    }

    updateBoardSpeed() {
        this.board.moveSpeed = this.JugadorBlanco.moveSpeed;
        this.board.snapBackSpeed = this.JugadorBlanco.moveSpeed;
        this.board.snapSpeed = this.JugadorBlanco.moveSpeed;
    }

    resetGame() {
        this.game.reset();
        this.board.start();
        this.moveHistory.reset();
        this.userColor = 'b';
        this.timer.reset();
    }

    flipBoard() {
        this.board.flip();
        this.userColor = this.userColor === 'b' ? 'n' : 'b';
    }
}

// Instanciación de los jugadores
const JugadorBlanco = new Jugador('b');
const JugadorNegro = new Jugador('n');

// Instanciación del gestor del tablero
const chessManager = new ChessBoardManager(JugadorBlanco, JugadorNegro);
