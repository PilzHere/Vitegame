import { EntityTypes } from './EntityTypes.js';

export default class Entity {
    #id = (() => {
        // Use crypto.randomUUID if available, otherwise fall back to polyfill
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            return crypto.randomUUID();
        }
        // Fallback UUID v4 generation for older browsers/environments
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    })();
    #toBeDeleted = false;
    #type = EntityTypes.UNKNOWN;

    constructor(type = EntityTypes.UNKNOWN) {
        this.#toBeDeleted = false;
        this.#type = type;
    }

    update() {
        // Override in subclasses to implement per-frame update logic
    }

    onCollision(otherEntity, collision) {
        // Override in subclasses to handle collision events
        // otherEntity: The entity this collided with
        // collision: Collision event data from cannon-es (contact, target, body, etc.)
    }

    destroy() {
        // Override in subclasses to clean up resources
        // Should dispose geometries, materials, remove from scene/world, etc.
    }

    markForDeletion() {
        this.#toBeDeleted = true;
    }

    getId() {
        return this.#id;
    }

    getType() {
        return this.#type;
    }

    getToBeDeleted() {
        return this.#toBeDeleted;
    }
}
