export default class Stopwatch {
    constructor(callback) {
        this.isStopped = false;
        this.startDate = Date.now();
        var onAnimationFrame = () => {
            if (this.isStopped) {
                return;
            }
            callback(Date.now() - this.startDate);
            requestAnimationFrame(onAnimationFrame);
        };
        requestAnimationFrame(onAnimationFrame);
    }
    stop() {
        this.isStopped = true;
    }
}
