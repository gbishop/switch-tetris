import Piece from "./piece.js";

export default class RandomPieceGenerator {
  public bag = [0, 1, 2, 3, 4, 5, 6];
  public index = -1;

  constructor() {
    this.shuffleBag();
  }

  public nextPiece() {
    this.index++;
    if (this.index >= this.bag.length) {
      this.shuffleBag();
      this.index = 0;
    }
    return Piece.fromIndex(this.bag[this.index]);
  }

  public shuffleBag() {
    var currentIndex = this.bag.length,
      temporaryValue,
      randomIndex;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {
      // Pick a remaining element...
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;

      // And swap it with the current element.
      temporaryValue = this.bag[currentIndex];
      this.bag[currentIndex] = this.bag[randomIndex];
      this.bag[randomIndex] = temporaryValue;
    }
  }
}
