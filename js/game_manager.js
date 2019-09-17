import Stopwatch from "./stopwatch.js";
import RandomPieceGenerator from "./random_piece_generator.js";
import Grid from "./grid.js";
import AI from "./ai.js";
export default function GameManager() {
    const gridCanvas = document.getElementById("grid-canvas");
    const nextCanvas = document.getElementById("next-canvas");
    const scoreContainer = document.getElementById("score-container");
    const gridContext = gridCanvas.getContext("2d");
    const nextContext = nextCanvas.getContext("2d");
    let State;
    (function (State) {
        State[State["intro"] = 0] = "intro";
        State[State["choosing"] = 1] = "choosing";
        State[State["dropping"] = 2] = "dropping";
        State[State["endOfGame"] = 3] = "endOfGame";
    })(State || (State = {}));
    var grid;
    var rpg;
    var ai = new AI(0.510066, 0.760666, 0.35663, 0.184483);
    var workingPieces;
    var workingPiece = null;
    var score = 0;
    let state = State.intro;
    function startPlaying() {
        document.body.classList.remove("intro");
        grid = new Grid(22, 10);
        rpg = new RandomPieceGenerator();
        workingPieces = [null, rpg.nextPiece()];
        workingPiece = null;
        score = 0;
        updateScoreContainer();
        startTurn();
    }
    // Sound
    function play(sound) {
        const ae = document.getElementById(sound);
        if (ae) {
            ae.play();
        }
    }
    // Graphics
    function intToRGBHexString(v) {
        return ("rgb(" +
            ((v >> 16) & 0xff) +
            "," +
            ((v >> 8) & 0xff) +
            "," +
            (v & 0xff) +
            ")");
    }
    function redrawGridCanvas(workingPieceVerticalOffset = 0) {
        gridContext.save();
        // Clear
        gridContext.fillStyle = "#000000";
        gridContext.fillRect(0, 0, gridCanvas.width, gridCanvas.height);
        // Scale
        const scale = Math.min(gridCanvas.height / 400, gridCanvas.width / 200);
        gridContext.scale(scale, scale);
        // Draw grid lines
        gridContext.strokeStyle = "#808080";
        for (r = 0; r < grid.rows; r++) {
            gridContext.beginPath();
            gridContext.moveTo(0, 20 * r);
            gridContext.lineTo(400, 20 * r);
            gridContext.stroke();
        }
        for (c = 0; c < grid.columns; c++) {
            gridContext.beginPath();
            gridContext.moveTo(20 * c, 0);
            gridContext.lineTo(20 * c, 400);
            gridContext.stroke();
        }
        // Draw grid
        for (var r = 2; r < grid.rows; r++) {
            for (var c = 0; c < grid.columns; c++) {
                if (grid.cells[r][c] != 0) {
                    gridContext.fillStyle = intToRGBHexString(grid.cells[r][c]);
                    gridContext.fillRect(20 * c, 20 * (r - 2), 20, 20);
                    gridContext.strokeStyle = "#808080";
                    gridContext.strokeRect(20 * c, 20 * (r - 2), 20, 20);
                }
            }
        }
        // Draw working piece
        for (var r = 0; r < workingPiece.dimension; r++) {
            for (var c = 0; c < workingPiece.dimension; c++) {
                if (workingPiece.cells[r][c] != 0) {
                    gridContext.fillStyle = intToRGBHexString(workingPiece.cells[r][c]);
                    gridContext.fillRect(20 * (c + workingPiece.column), 20 * (r + workingPiece.row - 2) + workingPieceVerticalOffset, 20, 20);
                    gridContext.strokeStyle = "#ffffff";
                    gridContext.strokeRect(20 * (c + workingPiece.column), 20 * (r + workingPiece.row - 2) + workingPieceVerticalOffset, 20, 20);
                }
            }
        }
        gridContext.restore();
    }
    function redrawNextCanvas() {
        nextContext.save();
        nextContext.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
        // Clear
        gridContext.fillStyle = "#000000";
        gridContext.fillRect(0, 0, gridCanvas.width, gridCanvas.height);
        var next = workingPieces[1];
        var xOffset = next.dimension == 2
            ? 20
            : next.dimension == 3
                ? 10
                : next.dimension == 4
                    ? 0
                    : null;
        var yOffset = next.dimension == 2
            ? 20
            : next.dimension == 3
                ? 20
                : next.dimension == 4
                    ? 10
                    : null;
        for (var r = 0; r < next.dimension; r++) {
            for (var c = 0; c < next.dimension; c++) {
                if (next.cells[r][c] != 0) {
                    nextContext.fillStyle = intToRGBHexString(next.cells[r][c]);
                    nextContext.fillRect(xOffset + 20 * c, yOffset + 20 * r, 20, 20);
                    nextContext.strokeStyle = "#FFFFFF";
                    nextContext.strokeRect(xOffset + 20 * c, yOffset + 20 * r, 20, 20);
                }
            }
        }
        nextContext.restore();
    }
    function updateScoreContainer() {
        scoreContainer.innerHTML = score.toString();
    }
    // Drop animation
    var workingPieceDropAnimationStopwatch = null;
    function startWorkingPieceDropAnimation(callback = function () { }) {
        // Calculate animation height
        let animationHeight = 0;
        let _workingPiece = workingPiece.clone();
        while (_workingPiece.moveDown(grid)) {
            animationHeight++;
        }
        var stopwatch = new Stopwatch(function (elapsed) {
            if (elapsed >= animationHeight * 20) {
                stopwatch.stop();
                redrawGridCanvas(20 * animationHeight);
                callback();
                return;
            }
            redrawGridCanvas((20 * elapsed) / 20);
        });
        workingPieceDropAnimationStopwatch = stopwatch;
    }
    function showWorkingPiece() {
        redrawGridCanvas(40); // draw on the 2nd row
        state = State.choosing;
    }
    // Process start of turn
    var choices = [];
    var choicesIndex = 0;
    function nextChoice() {
        switch (state) {
            case State.dropping:
                return;
            case State.intro:
            case State.endOfGame:
                startPlaying();
                return;
            case State.choosing:
                play("selectionSound");
                choicesIndex = (choicesIndex + 1) % choices.length;
                workingPiece = choices[choicesIndex];
                showWorkingPiece();
        }
    }
    function startTurn() {
        // Shift working pieces
        for (var i = 0; i < workingPieces.length - 1; i++) {
            workingPieces[i] = workingPieces[i + 1];
        }
        workingPieces[workingPieces.length - 1] = rpg.nextPiece();
        workingPiece = workingPieces[0];
        // Refresh Graphics
        redrawGridCanvas();
        redrawNextCanvas();
        choices = ai.choices(grid, workingPieces);
        choicesIndex = Math.random() >= 0.5 ? 0 : 1;
        workingPiece = choices[choicesIndex];
        showWorkingPiece();
    }
    function finishTurn() {
        switch (state) {
            case State.intro:
            case State.endOfGame:
                startPlaying();
                return;
            case State.dropping:
                return;
            case State.choosing:
                state = State.dropping;
                startWorkingPieceDropAnimation(function () {
                    while (workingPiece.moveDown(grid))
                        ; // Drop working piece
                    if (!endTurn()) {
                        gameOver();
                        return;
                    }
                    startTurn();
                });
                break;
        }
    }
    // Process end of turn
    function endTurn() {
        // Add working piece
        grid.addPiece(workingPiece);
        // Clear lines
        const cleared = grid.clearLines();
        if (cleared) {
            play("clearSound");
        }
        else {
            play("fallSound");
        }
        score += 10 ** cleared;
        // Refresh graphics
        redrawGridCanvas();
        updateScoreContainer();
        return !grid.exceeded();
    }
    function gameOver() {
        play("gameoverSound");
        state = State.endOfGame;
        gridContext.save();
        gridContext.translate(180, 400);
        gridContext.rotate(Math.PI / 4);
        gridContext.scale(10, 10);
        gridContext.fillStyle = "#ff0000";
        gridContext.textAlign = "center";
        gridContext.fillText("Game Over", 0, 0);
        gridContext.strokeStyle = "#ffffff";
        gridContext.lineWidth = 0.1;
        gridContext.strokeText("Game Over", 0, 0);
        gridContext.restore();
    }
    document.addEventListener("keydown", e => {
        // ignore key repeats
        if (e.repeat)
            return;
        if (e.key == "ArrowRight" || e.key == " ") {
            nextChoice();
        }
        else if (e.key == "ArrowLeft" || e.key == "Enter") {
            finishTurn();
        }
        else if (e.key == "q") {
            gameOver();
        }
    });
    document.getElementById("drop").addEventListener("click", finishTurn);
    document.getElementById("next").addEventListener("click", nextChoice);
}
