import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import Entity from './Entity.js';

export default class Player extends Entity {
    constructor(scene, world, position = { x: 0, y: 2, z: 0 }) {
        super();

        this.scene = scene;
        this.world = world;
        this.speed = 5;
        this.jumpForce = 5;
        this.isGrounded = false;

        this.#createMesh(position);
        this.#createPhysicsBody(position);
    }

    #createMesh(position) {
        const geometry = new THREE.CapsuleGeometry(0.5, 1, 8, 16);
        const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(position.x, position.y, position.z);
        this.scene.add(this.mesh);
    }

    #createPhysicsBody(position) {
        const shape = new CANNON.Cylinder(0.5, 0.5, 2, 8);
        this.body = new CANNON.Body({
            mass: 1,
            position: new CANNON.Vec3(position.x, position.y, position.z),
            linearDamping: 0.9,
            angularDamping: 0.9
        });
        this.body.addShape(shape);
        this.body.fixedRotation = true;
        this.world.addBody(this.body);
    }

    move(direction) {
        if (!this.body) return;

        const velocity = new CANNON.Vec3(
            direction.x * this.speed,
            this.body.velocity.y,
            direction.z * this.speed
        );

        this.body.velocity.copy(velocity);
    }

    jump() {
        if (this.isGrounded && this.body) {
            this.body.velocity.y = this.jumpForce;
            this.isGrounded = false;
        }
    }

    update() {
        if (!this.mesh || !this.body) return;

        this.mesh.position.copy(this.body.position);
        this.mesh.quaternion.copy(this.body.quaternion);

        if (this.body.velocity.y < 0.1 && this.body.velocity.y > -0.1) {
            this.isGrounded = true;
        }
    }
}
