import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import Ball from './entities/Ball.js';
import Floor from './entities/Floor.js';

export default class SceneManager {
    #entities = [];
    #entityCount = 0;

    constructor() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x20232a);

        // Lights
        const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.8);
        this.scene.add(hemiLight);
        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(5, 10, 7);
        this.scene.add(dirLight);

        // Physics
        this.world = new CANNON.World({ gravity: new CANNON.Vec3(0, -9.82, 0) });

        // Use NaiveBroadphase for better collision detection with fewer objects
        this.world.broadphase = new CANNON.NaiveBroadphase();

        // Enable collision detection between all bodies
        this.world.solver.iterations = 10;

        // Create physics materials
        this.ballMaterial = new CANNON.Material('ballMaterial');
        this.floorMaterial = new CANNON.Material('floorMaterial');

        // Ball to ball contact material (bouncy)
        const ballBallContact = new CANNON.ContactMaterial(
            this.ballMaterial,
            this.ballMaterial,
            {
                friction: 0.3,
                restitution: 0.8 // Bounciness (0 = no bounce, 1 = perfect bounce)
            }
        );
        this.world.addContactMaterial(ballBallContact);

        // Ball to floor contact material
        const ballFloorContact = new CANNON.ContactMaterial(
            this.ballMaterial,
            this.floorMaterial,
            {
                friction: 0.4,
                restitution: 0.6
            }
        );
        this.world.addContactMaterial(ballFloorContact);

        // Initialize entities async
        this.initPromise = this.initEntities();
    }

    async initEntities() {
        // Add floor
        const floor = new Floor(this.scene, this.world, this.floorMaterial);
        this.addEntity(floor);

        // Add standard ball
        const standardBall = new Ball(this.scene, this.world, { x: 0, y: 5, z: 0 }, false, this.ballMaterial);
        await standardBall.initPromise;
        this.addEntity(standardBall);

        // Add ball with custom shader
        const customShaderBall = new Ball(this.scene, this.world, { x: 0, y: 7, z: 0 }, true, this.ballMaterial);
        await customShaderBall.initPromise;
        this.addEntity(customShaderBall);

        this.#entityCount = this.#entities.length;
    }

    addEntity(entity) {
        this.#entities.push(entity);
    }

    removeEntityById(id) {
        this.#entities = this.#entities.filter(e => e.id !== id);
    }

    
    #preUpdate() {
        // Remove entities marked for deletion
        for (const entity of this.#entities) {
            if (entity.toBeDeleted) {
                this.removeEntityById(entity.id);
            }
        }
    }

    /**
     * Updates the scene, physics, and all entities.
     * @param {number} dt - Delta time in seconds
     */
    update(dt) {
        this.#preUpdate();

        // Step physics
        this.world.step(1 / 60, dt, 3);

        // Uppdatera alla entities
        for (const entity of this.#entities) {
            entity.update();
        }

        this.#postUpdate(dt);
    }

    #postUpdate(dt) {
        this.#entityCount = this.#entities.length;
    }

    getEntityCount() {
        return this.#entityCount;
    }
}
