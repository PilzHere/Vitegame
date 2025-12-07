let entityIdCounter = 0;

export default class Entity {
    constructor() {
        this.id = entityIdCounter++;
        this.toBeDeleted = false;
    }

    update() {
        // Implementeras i subklasser
    }
}
