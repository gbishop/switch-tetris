export default class Stopwatch {
  public isStopped = false;
  public startDate = Date.now();

  constructor(callback: (arg: number) => void) {
    var onAnimationFrame = () => {
      if (this.isStopped) {
        return;
      }
      callback(Date.now() - this.startDate);
      requestAnimationFrame(onAnimationFrame);
    };

    requestAnimationFrame(onAnimationFrame);
  }

  public stop(): void {
    this.isStopped = true;
  }
}
