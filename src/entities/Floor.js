import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import Entity from './Entity.js';
import { EntityTypes } from './EntityTypes.js';
import DebugHelpers from '../utils/DebugHelpers.js';
import Logger from '../utils/Logger.js';
import { CollisionGroups, CollisionMasks } from '../physics/CollisionGroups.js';

export default class Floor extends Entity {
    constructor(scene, world, material = null, enableDebugHelpers = false) {
        super(EntityTypes.FLOOR);

        this.scene = scene;
        this.enableDebugHelpers = enableDebugHelpers;

        const width = 20;
        const depth = 20;
        const thickness = 1.0; // Thick floor to prevent tunneling at 15 Hz physics

        // Mesh
        const geo = new THREE.PlaneGeometry(width, depth);
        const mat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a });
        this.mesh = new THREE.Mesh(geo, mat);
        this.mesh.rotation.x = -Math.PI / 2;
        this.mesh.position.y = 0; // At ground level
        scene.add(this.mesh);

        // Add debug helpers if enabled
        if (this.enableDebugHelpers) {
            // Add bounding sphere helper to visualize how inefficient sphere culling is for flat planes
            DebugHelpers.addBoundingSphereHelper(this.mesh, this.scene, 0xffffff);
            Logger.debug('Debug helpers enabled for Floor - notice the large sphere for a flat plane!');
        }

        // Physics - Use Box instead of Plane for finite collision area
        const shape = new CANNON.Box(new CANNON.Vec3(width / 2, thickness / 2, depth / 2));
        this.body = new CANNON.Body({
            mass: 0,
            material: material,
            position: new CANNON.Vec3(0, -thickness / 2, 0), // Half-thickness below ground
            // Collision filtering using bitmasks (faster than entity type checking)
            collisionFilterGroup: CollisionGroups.FLOOR,
            collisionFilterMask: CollisionMasks.FLOOR
        });
        this.body.addShape(shape);

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

        world.addBody(this.body);
    }

    update(inputManager) {
        // Floor is static, no update needed
    }

    destroy() {
        // Clean up debug helpers if enabled
        if (this.enableDebugHelpers && this.mesh) {
            DebugHelpers.removeHelper(this.mesh, this.scene);
        }

        // Clean up Three.js resources
        if (this.mesh) {
            this.mesh.parent.remove(this.mesh);

            if (this.mesh.geometry) {
                this.mesh.geometry.dispose();
            }

            if (this.mesh.material) {
                this.mesh.material.dispose();
            }
        }

        // Clean up physics body
        if (this.body) {
            this.body.removeEventListener('collide');
            this.body.world.removeBody(this.body);
        }
    }
}
