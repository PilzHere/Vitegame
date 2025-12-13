import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import Entity from './Entity.js';

export default class Collectible extends Entity {
    constructor(scene, world, position = { x: 0, y: 1, z: 0 }, type = 'coin') {
        super();

        this.scene = scene;
        this.world = world;
        this.type = type;
        this.value = 10;
        this.rotationSpeed = 2;
        this.bobSpeed = 2;
        this.bobHeight = 0.3;
        this.startY = position.y;
        this.time = 0;

        this.#createMesh(position);
        this.#createPhysicsBody(position);
    }

    #createMesh(position) {
        const geometry = new THREE.OctahedronGeometry(0.3);
        const material = new THREE.MeshStandardMaterial({
            color: 0xffff00,
            emissive: 0xffff00,
            emissiveIntensity: 0.3
        });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(position.x, position.y, position.z);
        this.scene.add(this.mesh);
    }

    #createPhysicsBody(position) {
        const shape = new CANNON.Sphere(0.3);
        this.body = new CANNON.Body({
            mass: 0,
            position: new CANNON.Vec3(position.x, position.y, position.z),
            isTrigger: true
        });
        this.body.addShape(shape);
        this.body.collisionResponse = false;
        this.world.addBody(this.body);
    }

    collect() {
        this.toBeDeleted = true;
        return this.value;
    }

    update(deltaTime) {
        if (!this.mesh || !this.body) return;

        this.time += deltaTime;

        this.mesh.rotation.y += this.rotationSpeed * deltaTime;

        const bobOffset = Math.sin(this.time * this.bobSpeed) * this.bobHeight;
        this.mesh.position.y = this.startY + bobOffset;
        this.body.position.y = this.mesh.position.y;
    }
}
