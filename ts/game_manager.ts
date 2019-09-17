import Stopwatch from "./stopwatch.js";
import RandomPieceGenerator from "./random_piece_generator.js";
import Grid from "./grid.js";
import Piece from "./piece.js";
import AI from "./ai.js";

export default function GameManager() {
  const gridCanvas = <HTMLCanvasElement>document.getElementById("grid-canvas");
  const nextCanvas = <HTMLCanvasElement>document.getElementById("next-canvas");
  const scoreContainer = document.getElementById("score-container");
  const gridContext = gridCanvas.getContext("2d");
  const nextContext = nextCanvas.getContext("2d");

  var grid = new Grid(22, 10);
  var rpg = new RandomPieceGenerator();
  var ai = new AI(0.510066, 0.760666, 0.35663, 0.184483);
  var workingPieces = [null, rpg.nextPiece()];
  var workingPiece: Piece = null;
  var score = 0;
  let keyboardEnabled = false;

  // Graphics
  function intToRGBHexString(v: number) {
    return (
      "rgb(" +
      ((v >> 16) & 0xff) +
      "," +
      ((v >> 8) & 0xff) +
      "," +
      (v & 0xff) +
      ")"
    );
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
          gridContext.fillRect(
            20 * (c + workingPiece.column),
            20 * (r + workingPiece.row - 2) + workingPieceVerticalOffset,
            20,
            20
          );
          gridContext.strokeStyle = "#000000";
          gridContext.strokeRect(
            20 * (c + workingPiece.column),
            20 * (r + workingPiece.row - 2) + workingPieceVerticalOffset,
            20,
            20
          );
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
    var xOffset =
      next.dimension == 2
        ? 20
        : next.dimension == 3
        ? 10
        : next.dimension == 4
        ? 0
        : null;
    var yOffset =
      next.dimension == 2
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
  var workingPieceDropAnimationStopwatch: Stopwatch = null;

  function startWorkingPieceDropAnimation(callback = function() {}) {
    // Calculate animation height
    let animationHeight = 0;
    let _workingPiece = workingPiece.clone();
    while (_workingPiece.moveDown(grid)) {
      animationHeight++;
    }

    var stopwatch = new Stopwatch(function(elapsed) {
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
    keyboardEnabled = true;
  }

  // Process start of turn
  var choices: Piece[] = [];
  var choicesIndex = 0;

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
    keyboardEnabled = false;
    startWorkingPieceDropAnimation(function() {
      while (workingPiece.moveDown(grid)); // Drop working piece
      if (!endTurn()) {
        alert("Game Over!");
        return;
      }
      startTurn();
    });
  }

  // Process end of turn
  function endTurn() {
    // Add working piece
    grid.addPiece(workingPiece);

    // Clear lines
    score += grid.clearLines();

    // Refresh graphics
    redrawGridCanvas();
    updateScoreContainer();

    return !grid.exceeded();
  }

  startTurn();

  document.addEventListener("keydown", e => {
    if (e.repeat) return;
    if (!keyboardEnabled) return;
    if (e.key == "ArrowRight") {
      choicesIndex = (choicesIndex + 1) % choices.length;
      workingPiece = choices[choicesIndex];
      showWorkingPiece();
    } else if (e.key == "ArrowLeft") {
      finishTurn();
    }
  });
}
