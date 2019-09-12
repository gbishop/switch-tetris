export default class Timer {
  public lastUpdate: number = null;
  public isRunning: boolean = false;

  constructor(public callback: () => void, public delay: number) {
    this.loop();
  }

  private loop() {
    requestAnimationFrame(() => {
      var now = Date.now();
      if (!this.isRunning) {
        this.lastUpdate = now;
        this.loop();
      } else {
        var elapsed = now - this.lastUpdate;
        if (this.lastUpdate === null || elapsed > this.delay) {
          this.callback();
          this.lastUpdate = now - (elapsed % this.delay);
        }
        this.loop();
      }
    });
  }

  public start() {
    if (this.isRunning) {
      return;
    }
    this.lastUpdate = Date.now();
    this.isRunning = true;
  }

  public stop() {
    this.isRunning = false;
  }

  public reset() {
    this.lastUpdate = Date.now();
    this.start();
  }

  public resetForward(newDelay: number) {
    this.callback();
    this.delay = newDelay;
    this.lastUpdate = Date.now();
    this.start();
  }
}
