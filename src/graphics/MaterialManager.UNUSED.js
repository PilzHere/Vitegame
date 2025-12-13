import * as THREE from 'three';

export default class MaterialManager {
    constructor() {
        this.materials = new Map();
        this.#createDefaultMaterials();
    }

    #createDefaultMaterials() {
        this.createMaterial('default', {
            type: 'standard',
            color: 0xffffff
        });

        this.createMaterial('emissive', {
            type: 'standard',
            color: 0xffffff,
            emissive: 0xffffff,
            emissiveIntensity: 0.5
        });

        this.createMaterial('transparent', {
            type: 'standard',
            color: 0xffffff,
            transparent: true,
            opacity: 0.5
        });

        this.createMaterial('wireframe', {
            type: 'basic',
            color: 0x00ff00,
            wireframe: true
        });
    }

    createMaterial(name, config = {}) {
        let material;

        switch (config.type) {
            case 'basic':
                material = new THREE.MeshBasicMaterial(config);
                break;
            case 'lambert':
                material = new THREE.MeshLambertMaterial(config);
                break;
            case 'phong':
                material = new THREE.MeshPhongMaterial(config);
                break;
            case 'standard':
            default:
                material = new THREE.MeshStandardMaterial(config);
                break;
        }

        this.materials.set(name, material);
        return material;
    }

    createShaderMaterial(name, vertexShader, fragmentShader, uniforms = {}) {
        const material = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            uniforms,
            glslVersion: THREE.GLSL3
        });

        this.materials.set(name, material);
        return material;
    }

    getMaterial(name) {
        return this.materials.get(name);
    }

    cloneMaterial(name, newName) {
        const original = this.materials.get(name);
        if (!original) {
            console.warn(`Material not found: ${name}`);
            return null;
        }

        const cloned = original.clone();
        this.materials.set(newName, cloned);
        return cloned;
    }

    updateMaterial(name, properties) {
        const material = this.materials.get(name);
        if (!material) {
            console.warn(`Material not found: ${name}`);
            return;
        }

        Object.assign(material, properties);
        material.needsUpdate = true;
    }

    removeMaterial(name) {
        const material = this.materials.get(name);
        if (material) {
            material.dispose();
            this.materials.delete(name);
        }
    }

    dispose() {
        this.materials.forEach(material => material.dispose());
        this.materials.clear();
    }
}
