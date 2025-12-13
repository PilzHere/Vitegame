export default class ObjectPool {
    constructor(createFn, resetFn = null, initialSize = 10) {
        this.createFn = createFn;
        this.resetFn = resetFn;
        this.pool = [];
        this.active = new Set();

        for (let i = 0; i < initialSize; i++) {
            this.pool.push(this.createFn());
        }
    }

    acquire() {
        let obj;

        if (this.pool.length > 0) {
            obj = this.pool.pop();
        } else {
            obj = this.createFn();
        }

        this.active.add(obj);
        return obj;
    }

    release(obj) {
        if (!this.active.has(obj)) {
            console.warn('Trying to release object not in active set');
            return;
        }

        this.active.delete(obj);

        if (this.resetFn) {
            this.resetFn(obj);
        }

        this.pool.push(obj);
    }

    releaseAll() {
        this.active.forEach(obj => {
            if (this.resetFn) {
                this.resetFn(obj);
            }
            this.pool.push(obj);
        });
        this.active.clear();
    }

    getActiveCount() {
        return this.active.size;
    }

    getPoolSize() {
        return this.pool.length;
    }

    getTotalSize() {
        return this.active.size + this.pool.length;
    }

    clear() {
        this.pool = [];
        this.active.clear();
    }
}
