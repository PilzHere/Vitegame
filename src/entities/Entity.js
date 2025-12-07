import { EntityTypes } from './EntityTypes.js';

export default class Entity {
    #id = crypto.randomUUID();
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
