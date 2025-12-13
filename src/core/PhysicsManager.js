import * as CANNON from 'cannon-es';
import Logger from '../utils/Logger.js';

export default class PhysicsManager {
    static #instance = null;

    #world = null;
    #materials = new Map();
    #contactMaterials = new Map();
    #fixedTimeStep = 1.0 / 20.0; // Physics timestep (20 Hz)
    #maxSubSteps = 3; // Maximum physics substeps

    constructor() {
        if (PhysicsManager.#instance) {
            return PhysicsManager.#instance;
        }

        this.#world = new CANNON.World({
            gravity: new CANNON.Vec3(0, -9.82, 0)
        });

        // Use NaiveBroadphase for better collision detection with fewer objects
        this.#world.broadphase = new CANNON.NaiveBroadphase();

        // Solver settings for 20 Hz physics
        // Higher iterations and tighter tolerance to prevent penetration
        this.#world.solver.iterations = 20;  // Good balance for 20 Hz
        this.#world.solver.tolerance = 0.0001;  // Tight tolerance

        this.#world.allowSleep = true;

        PhysicsManager.#instance = this;
    }

    static getInstance() {
        if (!PhysicsManager.#instance) {
            PhysicsManager.#instance = new PhysicsManager();
        }
        return PhysicsManager.#instance;
    }

    createMaterial(name, options = {}) {
        const material = new CANNON.Material(name);
        this.#materials.set(name, material);
        return material;
    }

    createContactMaterial(mat1Name, mat2Name, options = {}) {
        const mat1 = this.#materials.get(mat1Name);
        const mat2 = this.#materials.get(mat2Name);

        if (!mat1 || !mat2) {
            Logger.warn(`Material not found: ${mat1Name} or ${mat2Name}`);
            return;
        }

        const contactMaterial = new CANNON.ContactMaterial(mat1, mat2, {
            friction: options.friction ?? 0.3,
            restitution: options.restitution ?? 0.3,
            contactEquationStiffness: options.stiffness ?? 1e7,
            contactEquationRelaxation: options.relaxation ?? 3
        });

        this.#world.addContactMaterial(contactMaterial);
        this.#contactMaterials.set(`${mat1Name}_${mat2Name}`, contactMaterial);
        return contactMaterial;
    }

    getMaterial(name) {
        return this.#materials.get(name);
    }

    update(deltaTime) {
        // Clamp deltaTime to prevent spiral of death (max 100ms frame time)
        const clampedDt = Math.min(deltaTime, 0.1);

        // Fixed timestep physics at 20 Hz with automatic interpolation
        // Cannon.js handles accumulator pattern internally
        // interpolatedPosition/interpolatedQuaternion provide smooth rendering at 60 FPS
        this.#world.step(this.#fixedTimeStep, clampedDt, this.#maxSubSteps);
    }

    addBody(body) {
        this.#world.addBody(body);
    }

    removeBody(body) {
        this.#world.removeBody(body);
    }

    setGravity(x, y, z) {
        this.#world.gravity.set(x, y, z);
    }

    get world() {
        return this.#world;
    }

    get fixedTimeStep() {
        return this.#fixedTimeStep;
    }

    set fixedTimeStep(value) {
        this.#fixedTimeStep = value;
    }

    get maxSubSteps() {
        return this.#maxSubSteps;
    }

    set maxSubSteps(value) {
        this.#maxSubSteps = value;
    }
}
