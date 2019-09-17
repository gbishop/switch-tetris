export default class Timer {
    constructor(callback, delay) {
        this.callback = callback;
        this.delay = delay;
        this.lastUpdate = null;
        this.isRunning = false;
        this.loop = () => {
            this._loop();
        };
        requestAnimationFrame(this.loop);
    }
    _loop() {
        var now = Date.now();
        if (!this.isRunning) {
            this.lastUpdate = now;
        }
        else {
            var elapsed = now - this.lastUpdate;
            if (this.lastUpdate === null || elapsed > this.delay) {
                this.callback();
                this.lastUpdate = now - (elapsed % this.delay);
            }
        }
        requestAnimationFrame(this.loop);
    }
    start() {
        if (this.isRunning) {
            return;
        }
        this.lastUpdate = Date.now();
        this.isRunning = true;
    }
    stop() {
        this.isRunning = false;
    }
    reset() {
        this.lastUpdate = Date.now();
        this.start();
    }
    resetForward(newDelay) {
        this.callback();
        this.delay = newDelay;
        this.lastUpdate = Date.now();
        this.start();
    }
}
