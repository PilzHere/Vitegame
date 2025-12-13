import * as THREE from 'three';
import Ball from '../entities/Ball.js';
import Floor from '../entities/Floor.js';
import AudioManager from './AudioManager.js';
import PhysicsManager from './PhysicsManager.js';
import InputManager from './InputManager.js';
import BillboardParticleSystem from '../graphics/BillboardParticleSystem.js';
import SpriteParticleSystem from '../graphics/SpriteParticleSystem.js';

export default class SceneManager {
    #entities = [];
    #entityCount = 0;

    constructor(assetLoader) {
        this.assetLoader = assetLoader;
        this.audioManager = AudioManager.getInstance();
        this.physicsManager = PhysicsManager.getInstance();
        this.inputManager = InputManager.getInstance();
        this.world = this.physicsManager.world;

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x20232a);

        // Particle systems for visual effects
        this.billboardParticleSystem = new BillboardParticleSystem(this.scene, 1000); // Billboard particles (efficient)
        this.spriteParticleSystem = new SpriteParticleSystem(this.scene, 100); // Sprite particles (flexible)

        // Lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.8); // Brighter uniform lighting
        this.scene.add(ambientLight);
        const dirLight = new THREE.DirectionalLight(0xffffff, 0.5); // Reduced directional for subtle shadows
        dirLight.position.set(5, 10, 7);
        this.scene.add(dirLight);

        // Setup physics materials
        this.#setupPhysicsMaterials();

        // Initialize entities async
        this.initPromise = this.initEntities();
    }

    #setupPhysicsMaterials() {
        // Create physics materials
        this.ballMaterial = this.physicsManager.createMaterial('ballMaterial');
        this.floorMaterial = this.physicsManager.createMaterial('floorMaterial');

        // Ball to ball contact material (bouncy)
        this.physicsManager.createContactMaterial('ballMaterial', 'ballMaterial', {
            friction: 0.8,
            restitution: 0.2
        });

        // Ball to floor contact material
        this.physicsManager.createContactMaterial('ballMaterial', 'floorMaterial', {
            friction: 0.8,
            restitution: 0.2,
            contactEquationStiffness: 5e8,  // High stiffness prevents sinking at 20 Hz
            contactEquationRelaxation: 3    // Lower = more rigid (range: 3-5, lower is stiffer)
        });
    }

    async initEntities() {
        // Add floor (with debug helpers enabled)
        const floor = new Floor(this.scene, this.world, this.floorMaterial, true);
        this.addEntity(floor);

        // Add standard ball (with debug helpers enabled)
        const standardBall = new Ball(
            this.scene,
            this.world,
            { x: -3, y: 3, z: 0 },
            false,
            this.ballMaterial,
            null,
            true,
            this.audioManager
        );
        await standardBall.initPromise;
        this.addEntity(standardBall);

        // Add ball with custom shader (middle ball - blue, can jump with E key, uses BOTH particle systems)
        const customShaderBall = new Ball(
            this.scene,
            this.world,
            { x: 0, y: 4, z: 0 },
            true,
            this.ballMaterial,
            null,
            false,
            this.audioManager,
            true,
            this.billboardParticleSystem,  // Billboard particles
            this.spriteParticleSystem      // Sprite particles
        );
        await customShaderBall.initPromise;
        this.addEntity(customShaderBall);

        // Add ball with textured shader
        const texturedBall = new Ball(
            this.scene,
            this.world,
            { x: 3, y: 5, z: 0 },
            false,
            this.ballMaterial,
            { shaderName: 'texturedShader', textureName: 'ballTexture' },
            false,
            this.audioManager
        );
        await texturedBall.initPromise;
        this.addEntity(texturedBall);

        this.#entityCount = this.#entities.length;
    }

    addEntity(entity) {
        this.#entities.push(entity);
    }

    removeEntityById(id) {
        const entity = this.#entities.find(e => e.getId() === id);
        if (entity) {
            entity.destroy();
        }
        this.#entities = this.#entities.filter(e => e.getId() !== id);
    }


    #preUpdate() {
        // Remove entities marked for deletion
        for (const entity of this.#entities) {
            if (entity.getToBeDeleted()) {
                this.removeEntityById(entity.getId());
            }
        }
    }

    /**
     * Updates the scene, physics, and all entities.
     * @param {number} dt - Delta time in seconds
     */
    update(dt) {
        this.#preUpdate();

        // Step physics at 20 Hz (with interpolation)
        this.physicsManager.update(dt);

        // Update all entities (pass InputManager for entity-specific input handling)
        for (const entity of this.#entities) {
            entity.update(this.inputManager);
        }

        // Update particle systems
        this.billboardParticleSystem.update(dt);
        this.spriteParticleSystem.update(dt);

        this.#postUpdate(dt);
    }

    #postUpdate(dt) {
        this.#entityCount = this.#entities.length;
    }

    getEntityCount() {
        return this.#entityCount;
    }
}
