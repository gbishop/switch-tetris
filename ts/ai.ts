import Grid from "./grid.js";
import Piece from "./piece.js";

interface ScoredPiece {
  piece: Piece;
  score: number;
}

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
  ): ScoredPiece[] {
    let scoredPieces: ScoredPiece[] = [];
    var workingPiece = workingPieces[workingPieceIndex];

    for (var rotation = 0; rotation < 4; rotation++) {
      var piece = workingPiece.clone();
      for (var i = 0; i < rotation; i++) {
        piece.rotate(grid);
      }

      while (piece.moveLeft(grid));

      while (grid.valid(piece)) {
        var pieceSet = piece.clone();
        while (pieceSet.moveDown(grid));

        var _grid = grid.clone();
        _grid.addPiece(pieceSet);

        var score = null;
        if (workingPieceIndex == workingPieces.length - 1) {
          score =
            -this.heightWeight * _grid.aggregateHeight() +
            this.linesWeight * _grid.lines() -
            this.holesWeight * _grid.holes() -
            this.bumpinessWeight * _grid.bumpiness();
        } else {
          let r = this._best(_grid, workingPieces, workingPieceIndex + 1);
          score = (r.length && r[0].score) || -Infinity;
        }

        scoredPieces.push({ piece: piece.clone(), score });

        piece.column++;
      }
    }

    return scoredPieces.sort((a, b) => b.score - a.score);
  }

  public best(grid: Grid, workingPieces: Piece[]) {
    var b = this._best(grid, workingPieces, 0);
    return b[0].piece; // || b[0].piece;
  }
}
