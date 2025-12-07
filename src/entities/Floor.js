import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import Entity from './Entity.js';

export default class Floor extends Entity {
    constructor(scene, world, material = null) {
        super();

        const width = 20;
        const depth = 20;
        const thickness = 0.01; // Very thin but not zero to avoid collision issues

        // Mesh
        const geo = new THREE.PlaneGeometry(width, depth);
        const mat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a });
        this.mesh = new THREE.Mesh(geo, mat);
        this.mesh.rotation.x = -Math.PI / 2;
        this.mesh.position.y = 0; // At ground level
        scene.add(this.mesh);

        // Physics - Use Box instead of Plane for finite collision area
        const shape = new CANNON.Box(new CANNON.Vec3(width / 2, thickness / 2, depth / 2));
        this.body = new CANNON.Body({
            mass: 0,
            material: material,
            position: new CANNON.Vec3(0, -thickness / 2, 0) // Half-thickness below ground
        });
        this.body.addShape(shape);
        world.addBody(this.body);
    }

    update() {
        // Golvet är statiskt, ingen uppdatering behövs
    }
}
