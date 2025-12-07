import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import Entity from './Entity.js';

export default class Obstacle extends Entity {
    constructor(scene, world, position = { x: 0, y: 1, z: 0 }, size = { x: 1, y: 1, z: 1 }, isStatic = true) {
        super();

        this.scene = scene;
        this.world = world;
        this.size = size;
        this.isStatic = isStatic;
        this.health = isStatic ? Infinity : 100;
        this.isDestructible = !isStatic;

        this.#createMesh(position);
        this.#createPhysicsBody(position);
    }

    #createMesh(position) {
        const geometry = new THREE.BoxGeometry(this.size.x, this.size.y, this.size.z);
        const material = new THREE.MeshStandardMaterial({
            color: this.isStatic ? 0x808080 : 0xcc6600
        });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(position.x, position.y, position.z);
        this.scene.add(this.mesh);
    }

    #createPhysicsBody(position) {
        const shape = new CANNON.Box(new CANNON.Vec3(
            this.size.x / 2,
            this.size.y / 2,
            this.size.z / 2
        ));
        this.body = new CANNON.Body({
            mass: this.isStatic ? 0 : 10,
            position: new CANNON.Vec3(position.x, position.y, position.z)
        });
        this.body.addShape(shape);
        this.world.addBody(this.body);
    }

    takeDamage(amount) {
        if (!this.isDestructible) return;

        this.health -= amount;
        if (this.health <= 0) {
            this.destroy();
        }
    }

    destroy() {
        this.toBeDeleted = true;
    }

    update() {
        if (!this.mesh || !this.body) return;

        this.mesh.position.copy(this.body.position);
        this.mesh.quaternion.copy(this.body.quaternion);
    }
}
