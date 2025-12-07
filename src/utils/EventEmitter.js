export default class EventEmitter {
    constructor() {
        this.events = new Map();
    }

    on(eventName, callback) {
        if (!this.events.has(eventName)) {
            this.events.set(eventName, []);
        }
        this.events.get(eventName).push(callback);
        return () => this.off(eventName, callback);
    }

    once(eventName, callback) {
        const wrapper = (...args) => {
            callback(...args);
            this.off(eventName, wrapper);
        };
        return this.on(eventName, wrapper);
    }

    off(eventName, callback) {
        const callbacks = this.events.get(eventName);
        if (!callbacks) return;

        const index = callbacks.indexOf(callback);
        if (index !== -1) {
            callbacks.splice(index, 1);
        }

        if (callbacks.length === 0) {
            this.events.delete(eventName);
        }
    }

    emit(eventName, ...args) {
        const callbacks = this.events.get(eventName);
        if (!callbacks) return;

        callbacks.forEach(callback => {
            try {
                callback(...args);
            } catch (error) {
                console.error(`Error in event handler for "${eventName}":`, error);
            }
        });
    }

    clear(eventName) {
        if (eventName) {
            this.events.delete(eventName);
        } else {
            this.events.clear();
        }
    }

    listenerCount(eventName) {
        const callbacks = this.events.get(eventName);
        return callbacks ? callbacks.length : 0;
    }
}
