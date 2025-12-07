import * as THREE from 'three';
import Logger from './Logger.js';

export default class DebugHelpers {
    static #boundingSphereHelpers = new Map();
    static #visible = true;

    /**
     * Add a bounding sphere helper to visualize frustum culling bounds
     * Note: Three.js uses ONLY bounding spheres for frustum culling by default
     * @param {THREE.Mesh} mesh - The mesh to add helper to
     * @param {THREE.Scene} scene - The scene to add helper to
     * @param {number} color - Optional color (default: 0xffffff white)
     */
    static addBoundingSphereHelper(mesh, scene, color = 0xffffff) {
        // Compute bounding sphere if not already computed
        if (!mesh.geometry.boundingSphere) {
            mesh.geometry.computeBoundingSphere();
        }

        // Create sphere wireframe
        const radius = mesh.geometry.boundingSphere.radius;
        const sphereGeometry = new THREE.SphereGeometry(radius, 16, 16);
        const sphereMaterial = new THREE.MeshBasicMaterial({
            color: color,
            wireframe: true,
            transparent: true,
            opacity: 0.5
        });
        const helper = new THREE.Mesh(sphereGeometry, sphereMaterial);

        // Position the helper at the mesh position
        helper.position.copy(mesh.position);
        helper.visible = this.#visible;
        scene.add(helper);

        // Store reference
        this.#boundingSphereHelpers.set(mesh.uuid, { helper, mesh });

        Logger.debug(`Bounding sphere helper added for mesh ${mesh.uuid.substring(0, 8)}...`);
        return helper;
    }

    /**
     * Update bounding sphere helpers to follow their meshes
     * Call this in your game loop
     */
    static updateBoundingSphereHelpers() {
        for (const { helper, mesh } of this.#boundingSphereHelpers.values()) {
            helper.position.copy(mesh.position);
            helper.quaternion.copy(mesh.quaternion);
        }
    }

    /**
     * Show all debug helpers
     */
    static show() {
        this.#visible = true;
        for (const { helper } of this.#boundingSphereHelpers.values()) {
            helper.visible = true;
        }
        Logger.info('Debug helpers shown');
    }

    /**
     * Hide all debug helpers
     */
    static hide() {
        this.#visible = false;
        for (const { helper } of this.#boundingSphereHelpers.values()) {
            helper.visible = false;
        }
        Logger.info('Debug helpers hidden');
    }

    /**
     * Toggle visibility of all debug helpers
     */
    static toggle() {
        if (this.#visible) {
            this.hide();
        } else {
            this.show();
        }
    }

    /**
     * Check if debug helpers are visible
     */
    static isVisible() {
        return this.#visible;
    }

    /**
     * Remove all helpers
     */
    static removeAllHelpers(scene) {
        // Remove bounding spheres
        for (const { helper } of this.#boundingSphereHelpers.values()) {
            scene.remove(helper);
            helper.geometry.dispose();
            helper.material.dispose();
        }
        this.#boundingSphereHelpers.clear();

        Logger.info('All debug helpers removed');
    }

    /**
     * Remove helper for specific mesh
     */
    static removeHelper(mesh, scene) {
        // Remove bounding sphere
        const sphereData = this.#boundingSphereHelpers.get(mesh.uuid);
        if (sphereData) {
            scene.remove(sphereData.helper);
            sphereData.helper.geometry.dispose();
            sphereData.helper.material.dispose();
            this.#boundingSphereHelpers.delete(mesh.uuid);
        }
    }
}
