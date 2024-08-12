class GameEntity {
    constructor() {}
}

class Timer extends GameEntity {
    constructor() {
        super();
        this.startTime = null;
        this.timerInterval = null;
    }

    start() {
        this.startTime = new Date();
        this.timerInterval = setInterval(this.update.bind(this), 1000);
    }

    update() {
        const currentTime = new Date();
        const elapsedTime = new Date(currentTime - this.startTime);

        const hours = String(elapsedTime.getUTCHours()).padStart(2, '0');
        const minutes = String(elapsedTime.getUTCMinutes()).padStart(2, '0');
        const seconds = String(elapsedTime.getUTCSeconds()).padStart(2, '0');

        document.getElementById('time').textContent = `${hours}:${minutes}:${seconds}`;
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
        this.victories = 0;
        this.defeats = 0;
        this.moveSpeed = 200; // Velocidad predeterminada
    }

    setMoveSpeed(speed) {
        this.moveSpeed = speed;
    }

    recordVictory() {
        this.victories++;
        document.getElementById('victories').textContent = this.victories.toString();
    }

    recordDefeat() {
        this.defeats++;
        document.getElementById('defeats').textContent = this.defeats.toString();
    }
}

class MoveHistory extends GameEntity {
    constructor() {
        super();
        this.historyStack = [];
        this.moveCount = 1;
        this.moveHistoryElement = document.getElementById('move-history');
    }

    recordMove(move) {
        const formattedMove = this.moveCount % 2 === 1 ? `${Math.ceil(this.moveCount / 2)}. ${move}` : `${move} -`;
        this.historyStack.push(formattedMove);
        this.moveHistoryElement.textContent += formattedMove + ' ';
        this.moveHistoryElement.scrollTop = this.moveHistoryElement.scrollHeight;
        this.moveCount++;
    }

    reset() {
        this.historyStack = [];
        this.moveCount = 1;
        this.moveHistoryElement.textContent = '';
    }
}

class ChessBoardManager extends GameEntity {
    constructor(JugadorBlanco, JugadorNegro) {
        super();
        this.game = new Chess();
        this.JugadorBlanco = JugadorBlanco;
        this.JugadorNegro = JugadorNegro;
        this.board = null;
        this.timer = new Timer();
        this.moveHistory = new MoveHistory();
        this.userColor = 'w';

        this.initializeBoard();
        this.setupEventListeners();
    }

    initializeBoard() {
        const boardConfig = {
            showNotation: true,
            draggable: true,
            position: 'start',
            onDragStart: this.onDragStart.bind(this),
            onDrop: this.onDrop.bind(this),
            onSnapEnd: this.onSnapEnd.bind(this),
            moveSpeed: this.JugadorBlanco.moveSpeed,
            snapBackSpeed: this.JugadorBlanco.moveSpeed,
            snapSpeed: this.JugadorBlanco.moveSpeed,
        };
        this.board = Chessboard('board', boardConfig);
    }

    setupEventListeners() {
        document.querySelector('.PlayAgain').addEventListener('click', this.resetGame.bind(this));
        document.querySelector('.flip-board').addEventListener('click', this.flipBoard.bind(this));
        document.getElementById('whiteSpeedInput').addEventListener('input', (event) => {
            this.JugadorBlanco.setMoveSpeed(parseInt(event.target.value, 10));
            this.updateBoardSpeed();
        });
        document.getElementById('blackSpeedInput').addEventListener('input', (event) => {
            this.JugadorNegro.setMoveSpeed(parseInt(event.target.value, 10));
        });
    }

    onDragStart(source, piece) {
        return !this.game.game_over() && piece.search(this.userColor) === 0;
    }

    onDrop(source, target) {
        const move = this.game.move({
            from: source,
            to: target,
            promotion: 'q', // Siempre promover a reina
        });

        if (move === null) return 'snapback';

        this.board.position(this.game.fen(), true);

        if (!this.timer.startTime) {
            this.timer.start();
        }

        this.moveHistory.recordMove(move.san);

        if (this.game.in_checkmate()) {
            this.JugadorNegro.recordDefeat();
            alert("JAQUE MATE! ¡TÚ PIERDES!");
            this.timer.stop();
        }
    }

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
        this.userColor = 'w';
        this.timer.reset();
    }

    flipBoard() {
        this.board.flip();
        this.userColor = this.userColor === 'w' ? 'b' : 'w';
    }
}

// Instanciación de los jugadores
const JugadorBlanco = new Jugador('w');
const JugadorNegro = new Jugador('b');

// Instanciación del gestor del tablero
const chessManager = new ChessBoardManager(JugadorBlanco, JugadorNegro);
