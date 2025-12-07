import * as THREE from 'three';

export default class ParticleSystem {
    constructor(scene, maxParticles = 1000) {
        this.scene = scene;
        this.maxParticles = maxParticles;
        this.particles = [];
        this.particlePool = [];

        this.#createParticleGeometry();
    }

    #createParticleGeometry() {
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(this.maxParticles * 3);
        const colors = new Float32Array(this.maxParticles * 3);
        const sizes = new Float32Array(this.maxParticles);

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        const material = new THREE.PointsMaterial({
            size: 0.1,
            vertexColors: true,
            transparent: true,
            opacity: 0.8,
            sizeAttenuation: true
        });

        this.particleMesh = new THREE.Points(geometry, material);
        this.scene.add(this.particleMesh);
    }

    emit(config = {}) {
        const particle = {
            position: new THREE.Vector3(
                config.x || 0,
                config.y || 0,
                config.z || 0
            ),
            velocity: new THREE.Vector3(
                (Math.random() - 0.5) * (config.spread || 1),
                Math.random() * (config.upwardForce || 1),
                (Math.random() - 0.5) * (config.spread || 1)
            ),
            color: new THREE.Color(config.color || 0xffffff),
            size: config.size || 0.1,
            life: config.lifetime || 1,
            maxLife: config.lifetime || 1,
            gravity: config.gravity !== undefined ? config.gravity : -9.82
        };

        this.particles.push(particle);
    }

    emitBurst(count, config = {}) {
        for (let i = 0; i < count; i++) {
            this.emit(config);
        }
    }

    update(deltaTime) {
        const positions = this.particleMesh.geometry.attributes.position.array;
        const colors = this.particleMesh.geometry.attributes.color.array;
        const sizes = this.particleMesh.geometry.attributes.size.array;

        let particleIndex = 0;

        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];

            particle.velocity.y += particle.gravity * deltaTime;
            particle.position.add(particle.velocity.clone().multiplyScalar(deltaTime));

            particle.life -= deltaTime;

            if (particle.life <= 0) {
                this.particles.splice(i, 1);
                continue;
            }

            const lifeRatio = particle.life / particle.maxLife;

            positions[particleIndex * 3] = particle.position.x;
            positions[particleIndex * 3 + 1] = particle.position.y;
            positions[particleIndex * 3 + 2] = particle.position.z;

            colors[particleIndex * 3] = particle.color.r;
            colors[particleIndex * 3 + 1] = particle.color.g;
            colors[particleIndex * 3 + 2] = particle.color.b;

            sizes[particleIndex] = particle.size * lifeRatio;

            particleIndex++;
        }

        for (let i = particleIndex; i < this.maxParticles; i++) {
            positions[i * 3] = 0;
            positions[i * 3 + 1] = 0;
            positions[i * 3 + 2] = 0;
            sizes[i] = 0;
        }

        this.particleMesh.geometry.attributes.position.needsUpdate = true;
        this.particleMesh.geometry.attributes.color.needsUpdate = true;
        this.particleMesh.geometry.attributes.size.needsUpdate = true;
    }

    clear() {
        this.particles = [];
    }

    destroy() {
        this.scene.remove(this.particleMesh);
        this.particleMesh.geometry.dispose();
        this.particleMesh.material.dispose();
    }
}
