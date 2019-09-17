export default class AI {
    constructor(heightWeight, linesWeight, holesWeight, bumpinessWeight) {
        this.heightWeight = heightWeight;
        this.linesWeight = linesWeight;
        this.holesWeight = holesWeight;
        this.bumpinessWeight = bumpinessWeight;
    }
    _best(grid, workingPieces, workingPieceIndex) {
        let scoredPieces = [];
        var workingPiece = workingPieces[workingPieceIndex];
        for (var rotation = 0; rotation < workingPiece.rotations; rotation++) {
            var piece = workingPiece.clone();
            for (var i = 0; i < rotation; i++) {
                piece.rotate(grid);
            }
            while (piece.moveLeft(grid))
                ;
            while (grid.valid(piece)) {
                var pieceSet = piece.clone();
                while (pieceSet.moveDown(grid))
                    ;
                var _grid = grid.clone();
                _grid.addPiece(pieceSet);
                var score = null;
                if (workingPieceIndex == workingPieces.length - 1) {
                    score =
                        -this.heightWeight * _grid.aggregateHeight() +
                            this.linesWeight * _grid.lines() -
                            this.holesWeight * _grid.holes() -
                            this.bumpinessWeight * _grid.bumpiness();
                }
                else {
                    let r = this._best(_grid, workingPieces, workingPieceIndex + 1);
                    score = (r.length && r[0].score) || -Infinity;
                }
                scoredPieces.push({ piece: piece.clone(), score });
                piece.column++;
            }
        }
        return scoredPieces.sort((a, b) => b.score - a.score);
    }
    best(grid, workingPieces) {
        return this._best(grid, workingPieces, 0)[0].piece;
    }
    choices(grid, workingPieces) {
        const b = this._best(grid, workingPieces, 0);
        const c = [b[0].piece, b[b.length - 1].piece];
        return c;
    }
}
