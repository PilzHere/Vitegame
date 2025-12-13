import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import Entity from './Entity.js';
import { EntityTypes } from './EntityTypes.js';
import Logger from '../utils/Logger.js';
import AssetLoader from '../core/AssetLoader.js';
import DebugHelpers from '../utils/DebugHelpers.js';
import { CollisionGroups, CollisionMasks } from '../physics/CollisionGroups.js';

export default class Ball extends Entity {
    constructor(scene, world, position = { x: 0, y: 5, z: 0 }, useCustomShader = false, material = null, textureConfig = null, enableDebugHelpers = false, audioManager = null, canJump = false, billboardParticleSystem = null, spriteParticleSystem = null) {
        super(EntityTypes.BALL);

        this.scene = scene;
        this.world = world;
        this.assetLoader = AssetLoader.getInstance();
        this.audioManager = audioManager;
        this.useCustomShader = useCustomShader;
        this.physicsMaterial = material;
        this.textureConfig = textureConfig; // { shaderName, textureName }
        this.enableDebugHelpers = enableDebugHelpers;
        this.canJump = canJump; // Whether this ball can jump with E key
        this.billboardParticleSystem = billboardParticleSystem; // Billboard particle system for visual effects
        this.spriteParticleSystem = spriteParticleSystem; // Sprite particle system for complex effects
        this.wasGrounded = false; // Track if ball was on ground last frame

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
        const ballShape = new CANNON.Sphere(0.5);
        this.body = new CANNON.Body({
            mass: 1,
            position: new CANNON.Vec3(position.x, position.y, position.z),
            linearDamping: 0.01,
            material: this.physicsMaterial,
            // Collision filtering using bitmasks (faster than entity type checking)
            collisionFilterGroup: CollisionGroups.BALL,
            collisionFilterMask: CollisionMasks.BALL
        });
        this.body.addShape(ballShape);

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
    /**
     * Update mesh position and rotation based on physics body
     * Uses interpolated values for smooth 60 FPS rendering even with 15 Hz physics
     */
    update(inputManager) {
        if (!this.mesh || !this.body) return;

        // Handle jump input if this ball can jump
        if (this.canJump && inputManager && inputManager.isKeyJustPressed('KeyE')) {
            this.#jump();
        }

        // Use interpolated position/rotation from Cannon.js for smooth rendering
        // Physics runs at 20 Hz, but interpolatedPosition/interpolatedQuaternion
        // give us smooth values for 60 FPS rendering (Minecraft-style)
        this.mesh.position.copy(this.body.interpolatedPosition);
        this.mesh.quaternion.copy(this.body.interpolatedQuaternion);

        // Update shader time uniform if using custom shader or textured shader
        if ((this.useCustomShader || this.textureConfig) && this.mesh.material.uniforms?.uTime) {
            this.mesh.material.uniforms.uTime.value += 0.016;
        }

        // Update debug helpers if enabled
        if (this.enableDebugHelpers) {
            DebugHelpers.updateBoundingSphereHelpers();
        }
    }

    #jump() {
        if (!this.body) return;

        // Wake up the body if it's sleeping
        this.body.wakeUp();

        // Apply upward impulse to make the ball jump
        const jumpForce = 4; // Adjust for desired jump height
        this.body.velocity.y = jumpForce;

        // Emit sprite particles with rotation (blue swirling puff at launch)
        if (this.spriteParticleSystem) {
            this.spriteParticleSystem.emitBurst(8, {
                x: this.body.position.x,
                y: this.body.position.y - 0.5, // Below ball
                z: this.body.position.z,
                color: 0x5d9cf0, // Match blue ball color
                size: 0.3,
                endSize: 0.05,
                lifetime: 0.6,
                spread: 1.2,
                upwardForce: 2,
                gravity: -3,
                angularVelocity: (Math.random() - 0.5) * 10, // Random spin
                fadeOut: true
            });
        }

        // Also emit fast billboard particles for extra sparkle
        if (this.billboardParticleSystem) {
            this.billboardParticleSystem.emitBurst(12, {
                x: this.body.position.x,
                y: this.body.position.y - 0.5,
                z: this.body.position.z,
                color: 0xaaddff, // Light blue sparkle
                size: 0.05,
                lifetime: 0.3,
                spread: 2,
                upwardForce: 3,
                gravity: -5
            });
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
        // Get collision impact velocity
        const impactVelocity = collision.contact.getImpactVelocityAlongNormal();

        // Only play sound if impact is strong enough (avoid rolling sounds)
        if (Math.abs(impactVelocity) > 1.0) {
            // Play bounce sound with volume based on impact strength
            if (this.audioManager) {
                // Volume scales with impact (clamped between 0.1 and 1.0)
                const volume = Math.min(1.0, Math.max(0.1, Math.abs(impactVelocity) / 10));
                this.audioManager.playSound('bounce', volume);
            }

            // Emit landing particles for blue ball (if it has billboard particle system)
            if (this.billboardParticleSystem && this.canJump) {
                const particleCount = Math.min(25, Math.floor(Math.abs(impactVelocity) * 3));
                this.billboardParticleSystem.emitBurst(particleCount, {
                    x: this.body.position.x,
                    y: 0.1, // Just above floor
                    z: this.body.position.z,
                    color: 0xcccccc, // Gray dust
                    size: 0.06,
                    lifetime: 0.5,
                    spread: 2,
                    upwardForce: Math.abs(impactVelocity) * 0.5,
                    gravity: -9.82
                });
            }

            Logger.debug(`Ball hit floor with velocity: ${impactVelocity.toFixed(2)}`);
        }
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
