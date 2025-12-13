import * as THREE from 'three';

/**
 * Sprite particle system (individual textured quads with rotation support)
 * Each particle is a THREE.Sprite with individual control
 * Supports texture animations, rotation, and complex visual effects
 * Less performant than billboard particles but more flexible
 */
export default class SpriteParticleSystem {
    #scene;
    #maxParticles;
    #particles = [];
    #particlePool = [];
    #defaultTexture;

    constructor(scene, maxParticles = 100) {
        this.#scene = scene;
        this.#maxParticles = maxParticles;

        // Create default circular particle texture
        this.#defaultTexture = this.#createDefaultTexture();
    }

    #createDefaultTexture() {
        // Create a simple circular gradient texture
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');

        const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(0.4, 'rgba(255, 255, 255, 0.8)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 64, 64);

        const texture = new THREE.CanvasTexture(canvas);
        return texture;
    }

    emit(config = {}) {
        // Reuse pooled particle or check max limit
        if (this.#particles.length >= this.#maxParticles) {
            return; // Max particles reached
        }

        const texture = config.texture || this.#defaultTexture;
        const material = new THREE.SpriteMaterial({
            map: texture,
            color: config.color || 0xffffff,
            transparent: true,
            opacity: config.opacity || 1.0,
            blending: config.blending || THREE.AdditiveBlending,
            rotation: config.rotation || 0
        });

        const sprite = new THREE.Sprite(material);
        sprite.position.set(
            config.x || 0,
            config.y || 0,
            config.z || 0
        );

        const size = config.size || 0.5;
        sprite.scale.set(size, size, 1);

        this.#scene.add(sprite);

        const particle = {
            sprite: sprite,
            velocity: new THREE.Vector3(
                (Math.random() - 0.5) * (config.spread || 1),
                Math.random() * (config.upwardForce || 1),
                (Math.random() - 0.5) * (config.spread || 1)
            ),
            angularVelocity: config.angularVelocity || 0, // Rotation speed (radians per second)
            life: config.lifetime || 1,
            maxLife: config.lifetime || 1,
            gravity: config.gravity !== undefined ? config.gravity : -9.82,
            startSize: size,
            endSize: config.endSize !== undefined ? config.endSize : size * 0.1,
            startOpacity: config.opacity || 1.0,
            fadeOut: config.fadeOut !== undefined ? config.fadeOut : true
        };

        this.#particles.push(particle);
    }

    emitBurst(count, config = {}) {
        for (let i = 0; i < count; i++) {
            this.emit(config);
        }
    }

    update(deltaTime) {
        for (let i = this.#particles.length - 1; i >= 0; i--) {
            const particle = this.#particles[i];

            // Update physics
            particle.velocity.y += particle.gravity * deltaTime;
            particle.sprite.position.add(
                particle.velocity.clone().multiplyScalar(deltaTime)
            );

            // Update rotation
            if (particle.angularVelocity !== 0) {
                particle.sprite.material.rotation += particle.angularVelocity * deltaTime;
            }

            // Update lifetime
            particle.life -= deltaTime;

            if (particle.life <= 0) {
                // Remove particle
                this.#scene.remove(particle.sprite);
                particle.sprite.material.dispose();
                this.#particles.splice(i, 1);
                continue;
            }

            const lifeRatio = particle.life / particle.maxLife;

            // Update size (shrink over time)
            const currentSize = THREE.MathUtils.lerp(
                particle.endSize,
                particle.startSize,
                lifeRatio
            );
            particle.sprite.scale.set(currentSize, currentSize, 1);

            // Update opacity (fade out)
            if (particle.fadeOut) {
                particle.sprite.material.opacity = particle.startOpacity * lifeRatio;
            }
        }
    }

    clear() {
        for (const particle of this.#particles) {
            this.#scene.remove(particle.sprite);
            particle.sprite.material.dispose();
        }
        this.#particles = [];
    }

    destroy() {
        this.clear();
        this.#defaultTexture.dispose();
    }

    // Getters for external access
    get particleCount() {
        return this.#particles.length;
    }

    get maxParticles() {
        return this.#maxParticles;
    }
}
