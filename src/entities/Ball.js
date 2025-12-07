import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import Entity from './Entity.js';
import { EntityTypes } from './EntityTypes.js';
import Logger from '../utils/Logger.js';
import AssetLoader from '../core/AssetLoader.js';
import DebugHelpers from '../utils/DebugHelpers.js';

export default class Ball extends Entity {
    constructor(scene, world, position = { x: 0, y: 5, z: 0 }, useCustomShader = false, material = null, textureConfig = null, enableDebugHelpers = false) {
        super(EntityTypes.BALL);

        this.scene = scene;
        this.world = world;
        this.assetLoader = AssetLoader.getInstance();
        this.useCustomShader = useCustomShader;
        this.physicsMaterial = material;
        this.textureConfig = textureConfig; // { shaderName, textureName }
        this.enableDebugHelpers = enableDebugHelpers;

        // Initialize async
        this.initPromise = this.init(position);
    }

    async init(position) {
        // Mesh
        const geo = new THREE.SphereGeometry(0.5, 32, 32);

        let mat;
        if (this.textureConfig) {
            // Textured shader mode
            try {
                Logger.debug('Creating textured shader material for Ball...');

                const shader = this.assetLoader.getShader(this.textureConfig.shaderName);
                const texture = this.assetLoader.getTexture(this.textureConfig.textureName);

                if (!shader) {
                    Logger.warn(`Shader '${this.textureConfig.shaderName}' not found in AssetLoader, falling back to standard material`);
                    mat = new THREE.MeshStandardMaterial({ color: 0xff8800 });
                } else if (!texture) {
                    Logger.warn(`Texture '${this.textureConfig.textureName}' not found in AssetLoader, falling back to standard material`);
                    mat = new THREE.MeshStandardMaterial({ color: 0xff8800 });
                } else {
                    mat = new THREE.ShaderMaterial({
                        vertexShader: shader.vertex,
                        fragmentShader: shader.fragment,
                        uniforms: {
                            uTexture: { value: texture },
                            uTime: { value: 0.0 }
                        },
                        glslVersion: THREE.GLSL3
                    });
                    Logger.success('Textured shader material created successfully for Ball');
                }
            } catch (error) {
                Logger.error('Error creating textured shader:', error);
                mat = new THREE.MeshStandardMaterial({ color: 0xff0000 });
            }
        } else if (this.useCustomShader) {
            // Custom shader mode (non-textured)
            try {
                Logger.debug('Creating custom shader material for Ball...');

                const shader = this.assetLoader.getShader('ballShader');

                if (!shader) {
                    Logger.warn('Ball shader not found in AssetLoader, falling back to standard material');
                    mat = new THREE.MeshStandardMaterial({ color: 0xff8800 });
                } else {
                    mat = new THREE.ShaderMaterial({
                        vertexShader: shader.vertex,
                        fragmentShader: shader.fragment,
                        uniforms: {
                            uColor: { value: new THREE.Color(0x5d9cf0) },
                            uTime: { value: 0.0 }
                        },
                        glslVersion: THREE.GLSL3
                    });
                    Logger.success('Custom shader material created successfully for Ball');
                }
            } catch (error) {
                Logger.error('Error creating custom shader:', error);
                mat = new THREE.MeshStandardMaterial({ color: 0xff0000 });
            }
        } else {
            mat = new THREE.MeshStandardMaterial({ color: 0xf08a5d });
        }

        this.mesh = new THREE.Mesh(geo, mat);
        this.scene.add(this.mesh);

        // Physics
        this.body = new CANNON.Body({
            mass: 1,
            shape: new CANNON.Sphere(0.5),
            position: new CANNON.Vec3(position.x, position.y, position.z),
            linearDamping: 0.01,
            material: this.physicsMaterial
        });

        // Store reference to this entity on the body for collision lookup
        this.body.userData = { entity: this };

        // Register collision event listener
        this.body.addEventListener('collide', (event) => {
            const otherBody = event.body;
            const otherEntity = otherBody.userData?.entity;

            if (otherEntity) {
                this.onCollision(otherEntity, event);
            }
        });

        this.world.addBody(this.body);

        // Add debug helpers if enabled
        if (this.enableDebugHelpers) {
            // Add bounding sphere helper (white wireframe)
            // Note: Three.js uses ONLY bounding sphere for frustum culling
            DebugHelpers.addBoundingSphereHelper(this.mesh, this.scene, 0xffffff);

            Logger.debug(`Debug helpers enabled for Ball (ID: ${this.getId().substring(0, 8)}...)`);
        }

        const shaderType = this.textureConfig ? 'textured' : (this.useCustomShader ? 'custom' : 'standard');
        Logger.info(`Ball initialized at position (${position.x}, ${position.y}, ${position.z}), shader type: ${shaderType}`);
    }

    update() {
        // Don't update if not initialized yet
        if (!this.mesh || !this.body) return;

        this.mesh.position.copy(this.body.position);
        this.mesh.quaternion.copy(this.body.quaternion);

        // Update shader time uniform if using custom shader or textured shader
        if ((this.useCustomShader || this.textureConfig) && this.mesh.material.uniforms?.uTime) {
            this.mesh.material.uniforms.uTime.value += 0.016;
        }

        // Update debug helpers if enabled
        if (this.enableDebugHelpers) {
            DebugHelpers.updateBoundingSphereHelpers();
        }
    }

    onCollision(otherEntity, collision) {
        const otherType = otherEntity.getType();

        // Efficient type-based collision handling using switch
        switch (otherType) {
            case EntityTypes.FLOOR:
                this.#handleFloorCollision(otherEntity, collision);
                break;

            case EntityTypes.BALL:
                this.#handleBallCollision(otherEntity, collision);
                break;

            case EntityTypes.ENEMY:
                this.#handleEnemyCollision(otherEntity, collision);
                break;

            default:
                Logger.debug(`Ball collided with unknown entity type: ${otherType}`);
        }
    }

    #handleFloorCollision(floor, collision) {
        Logger.debug('Ball hit the floor');
        // Handle floor bounce, play sound, etc.

        //this.markForDeletion();
    }

    #handleBallCollision(ball, collision) {
        Logger.debug(`Ball hit another ball (ID: ${ball.getId().substring(0, 8)}...)`);
        // Handle ball-to-ball interaction
    }

    #handleEnemyCollision(enemy, collision) {
        Logger.debug('Ball hit an enemy');
        // Damage enemy, destroy ball, etc.
    }

    destroy() {
        // Clean up debug helpers if enabled
        if (this.enableDebugHelpers && this.mesh) {
            DebugHelpers.removeHelper(this.mesh, this.scene);
        }

        // Clean up Three.js resources
        if (this.mesh) {
            // Remove from scene
            this.scene.remove(this.mesh);

            // Dispose geometry
            if (this.mesh.geometry) {
                this.mesh.geometry.dispose();
            }

            // Dispose material(s)
            if (this.mesh.material) {
                if (Array.isArray(this.mesh.material)) {
                    this.mesh.material.forEach(mat => {
                        if (mat.map) mat.map.dispose(); // Dispose textures
                        mat.dispose();
                    });
                } else {
                    if (this.mesh.material.map) this.mesh.material.map.dispose();
                    this.mesh.material.dispose();
                }
            }
        }

        // Clean up physics body
        if (this.body) {
            // Remove all event listeners to prevent memory leaks
            this.body.removeEventListener('collide');

            // Remove from physics world
            this.world.removeBody(this.body);
        }

        Logger.info(`Ball destroyed (ID: ${this.getId().substring(0, 8)}...)`);
    }
}
