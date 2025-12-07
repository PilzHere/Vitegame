import * as CANNON from 'cannon-es';

export default class PhysicsManager {
    constructor() {
        this.world = new CANNON.World({
            gravity: new CANNON.Vec3(0, -9.82, 0)
        });

        this.materials = new Map();
        this.contactMaterials = new Map();
        this.fixedTimeStep = 1.0 / 60.0;
        this.maxSubSteps = 3;
    }

    createMaterial(name, options = {}) {
        const material = new CANNON.Material(name);
        this.materials.set(name, material);
        return material;
    }

    createContactMaterial(mat1Name, mat2Name, options = {}) {
        const mat1 = this.materials.get(mat1Name);
        const mat2 = this.materials.get(mat2Name);

        if (!mat1 || !mat2) {
            console.warn(`Material not found: ${mat1Name} or ${mat2Name}`);
            return;
        }

        const contactMaterial = new CANNON.ContactMaterial(mat1, mat2, {
            friction: options.friction ?? 0.3,
            restitution: options.restitution ?? 0.3,
            contactEquationStiffness: options.stiffness ?? 1e7,
            contactEquationRelaxation: options.relaxation ?? 3
        });

        this.world.addContactMaterial(contactMaterial);
        this.contactMaterials.set(`${mat1Name}_${mat2Name}`, contactMaterial);
        return contactMaterial;
    }

    getMaterial(name) {
        return this.materials.get(name);
    }

    update(deltaTime) {
        this.world.step(this.fixedTimeStep, deltaTime, this.maxSubSteps);
    }

    addBody(body) {
        this.world.addBody(body);
    }

    removeBody(body) {
        this.world.removeBody(body);
    }

    setGravity(x, y, z) {
        this.world.gravity.set(x, y, z);
    }
}
