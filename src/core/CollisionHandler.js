export default class CollisionHandler {
    constructor(world) {
        this.world = world;
        this.collisionCallbacks = new Map();
        this.#setupCollisionListeners();
    }

    #setupCollisionListeners() {
        this.world.addEventListener('beginContact', (event) => {
            this.#handleCollision(event, 'begin');
        });

        this.world.addEventListener('endContact', (event) => {
            this.#handleCollision(event, 'end');
        });
    }

    #handleCollision(event, type) {
        const bodyA = event.bodyA;
        const bodyB = event.bodyB;

        const keyAB = `${bodyA.id}_${bodyB.id}`;
        const keyBA = `${bodyB.id}_${bodyA.id}`;

        const callbackAB = this.collisionCallbacks.get(keyAB);
        const callbackBA = this.collisionCallbacks.get(keyBA);

        if (callbackAB) {
            callbackAB(bodyA, bodyB, type);
        }

        if (callbackBA) {
            callbackBA(bodyB, bodyA, type);
        }

        const wildcardA = this.collisionCallbacks.get(`${bodyA.id}_*`);
        const wildcardB = this.collisionCallbacks.get(`${bodyB.id}_*`);

        if (wildcardA) {
            wildcardA(bodyA, bodyB, type);
        }

        if (wildcardB) {
            wildcardB(bodyB, bodyA, type);
        }
    }

    registerCollision(bodyAId, bodyBId, callback) {
        const key = `${bodyAId}_${bodyBId}`;
        this.collisionCallbacks.set(key, callback);
    }

    registerCollisionWildcard(bodyId, callback) {
        const key = `${bodyId}_*`;
        this.collisionCallbacks.set(key, callback);
    }

    unregisterCollision(bodyAId, bodyBId) {
        const key = `${bodyAId}_${bodyBId}`;
        this.collisionCallbacks.delete(key);
    }

    clear() {
        this.collisionCallbacks.clear();
    }
}
