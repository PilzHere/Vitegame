import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import Entity from './Entity.js';

export default class Projectile extends Entity {
    constructor(scene, world, position = { x: 0, y: 1, z: 0 }, direction = { x: 0, y: 0, z: 1 }) {
        super();

        this.scene = scene;
        this.world = world;
        this.speed = 20;
        this.damage = 25;
        this.lifetime = 5;
        this.age = 0;

        this.#createMesh(position);
        this.#createPhysicsBody(position, direction);
    }

    #createMesh(position) {
        const geometry = new THREE.SphereGeometry(0.2, 8, 8);
        const material = new THREE.MeshStandardMaterial({
            color: 0xff8800,
            emissive: 0xff4400,
            emissiveIntensity: 0.5
        });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(position.x, position.y, position.z);
        this.scene.add(this.mesh);
    }

    #createPhysicsBody(position, direction) {
        const shape = new CANNON.Sphere(0.2);
        this.body = new CANNON.Body({
            mass: 0.1,
            position: new CANNON.Vec3(position.x, position.y, position.z),
            linearDamping: 0
        });
        this.body.addShape(shape);

        const dir = new THREE.Vector3(direction.x, direction.y, direction.z).normalize();
        this.body.velocity.set(
            dir.x * this.speed,
            dir.y * this.speed,
            dir.z * this.speed
        );

        this.world.addBody(this.body);
    }

    onCollision(otherBody) {
        this.toBeDeleted = true;
    }

    update(deltaTime) {
        if (!this.mesh || !this.body) return;

        this.mesh.position.copy(this.body.position);
        this.mesh.quaternion.copy(this.body.quaternion);

        this.age += deltaTime;
        if (this.age >= this.lifetime) {
            this.toBeDeleted = true;
        }
    }
}
