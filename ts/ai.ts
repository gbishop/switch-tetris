import Grid from "./grid.js";
import Piece from "./piece.js";

export default class AI {
  constructor(
    public heightWeight: number,
    public linesWeight: number,
    public holesWeight: number,
    public bumpinessWeight: number
  ) {}

  public _best(
    grid: Grid,
    workingPieces: Piece[],
    workingPieceIndex: number
  ): { piece: Piece; score: number } {
    var best: Piece = null;
    var bestScore = null;
    var workingPiece = workingPieces[workingPieceIndex];

    for (var rotation = 0; rotation < 4; rotation++) {
      var _piece = workingPiece.clone();
      for (var i = 0; i < rotation; i++) {
        _piece.rotate(grid);
      }

      while (_piece.moveLeft(grid));

      while (grid.valid(_piece)) {
        var _pieceSet = _piece.clone();
        while (_pieceSet.moveDown(grid));

        var _grid = grid.clone();
        _grid.addPiece(_pieceSet);

        var score = null;
        if (workingPieceIndex == workingPieces.length - 1) {
          score =
            -this.heightWeight * _grid.aggregateHeight() +
            this.linesWeight * _grid.lines() -
            this.holesWeight * _grid.holes() -
            this.bumpinessWeight * _grid.bumpiness();
        } else {
          score = this._best(_grid, workingPieces, workingPieceIndex + 1).score;
        }

        if (score > bestScore || bestScore == null) {
          bestScore = score;
          best = _piece.clone();
        }

        _piece.column++;
      }
    }

    return { piece: best, score: bestScore };
  }

  public best(grid: Grid, workingPieces: Piece[]) {
    return this._best(grid, workingPieces, 0).piece;
  }
}
