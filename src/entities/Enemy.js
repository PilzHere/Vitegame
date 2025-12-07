import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import Entity from './Entity.js';

export default class Enemy extends Entity {
    constructor(scene, world, position = { x: 0, y: 1, z: 0 }) {
        super();

        this.scene = scene;
        this.world = world;
        this.speed = 2;
        this.detectionRadius = 10;
        this.target = null;
        this.health = 100;

        this.#createMesh(position);
        this.#createPhysicsBody(position);
    }

    #createMesh(position) {
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(position.x, position.y, position.z);
        this.scene.add(this.mesh);
    }

    #createPhysicsBody(position) {
        const shape = new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5));
        this.body = new CANNON.Body({
            mass: 1,
            position: new CANNON.Vec3(position.x, position.y, position.z),
            linearDamping: 0.5
        });
        this.body.addShape(shape);
        this.world.addBody(this.body);
    }

    setTarget(target) {
        this.target = target;
    }

    #moveTowardsTarget() {
        if (!this.target || !this.body) return;

        const direction = new THREE.Vector3();
        direction.subVectors(this.target.position, this.mesh.position);
        direction.y = 0;
        direction.normalize();

        this.body.velocity.x = direction.x * this.speed;
        this.body.velocity.z = direction.z * this.speed;
    }

    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.toBeDeleted = true;
        }
    }

    update() {
        if (!this.mesh || !this.body) return;

        this.mesh.position.copy(this.body.position);
        this.mesh.quaternion.copy(this.body.quaternion);

        if (this.target) {
            const distance = this.mesh.position.distanceTo(this.target.position);
            if (distance < this.detectionRadius) {
                this.#moveTowardsTarget();
            }
        }
    }
}
