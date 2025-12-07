export default class Timer {
    constructor(duration, callback, autoStart = false) {
        this.duration = duration;
        this.callback = callback;
        this.elapsed = 0;
        this.isRunning = false;
        this.loop = false;

        if (autoStart) {
            this.start();
        }
    }

    start() {
        this.isRunning = true;
        this.elapsed = 0;
    }

    stop() {
        this.isRunning = false;
    }

    reset() {
        this.elapsed = 0;
    }

    restart() {
        this.reset();
        this.start();
    }

    setLoop(shouldLoop) {
        this.loop = shouldLoop;
    }

    update(deltaTime) {
        if (!this.isRunning) return;

        this.elapsed += deltaTime;

        if (this.elapsed >= this.duration) {
            if (this.callback) {
                this.callback();
            }

            if (this.loop) {
                this.elapsed = 0;
            } else {
                this.stop();
            }
        }
    }

    getProgress() {
        return Math.min(this.elapsed / this.duration, 1);
    }

    getRemaining() {
        return Math.max(this.duration - this.elapsed, 0);
    }

    isComplete() {
        return this.elapsed >= this.duration;
    }
}

export class TimerManager {
    constructor() {
        this.timers = new Set();
    }

    createTimer(duration, callback, autoStart = false) {
        const timer = new Timer(duration, callback, autoStart);
        this.timers.add(timer);
        return timer;
    }

    removeTimer(timer) {
        this.timers.delete(timer);
    }

    update(deltaTime) {
        this.timers.forEach(timer => {
            timer.update(deltaTime);
            if (!timer.loop && timer.isComplete()) {
                this.timers.delete(timer);
            }
        });
    }

    clear() {
        this.timers.clear();
    }
}
