import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import Entity from './Entity.js';

export default class Ball extends Entity {
    constructor(scene, world, position = { x: 0, y: 5, z: 0 }, useCustomShader = false, material = null) {
        super();

        this.scene = scene;
        this.world = world;
        this.useCustomShader = useCustomShader;
        this.physicsMaterial = material;

        // Initialize async
        this.initPromise = this.init(position);
    }

    async init(position) {
        // Mesh
        const geo = new THREE.SphereGeometry(0.5, 32, 32);

        let mat;
        if (this.useCustomShader) {
            try {
                // Load custom shaders
                console.log('Loading custom shaders...');
                const vertexShader = await fetch('/src/assets/shaders/basic/basic.vert').then(r => r.text());
                const fragmentShader = await fetch('/src/assets/shaders/basic/basic.frag').then(r => r.text());

                console.log('Shaders loaded, creating material...');
                mat = new THREE.ShaderMaterial({
                    vertexShader,
                    fragmentShader,
                    uniforms: {
                        uColor: { value: new THREE.Color(0x5d9cf0) }, // Blue for custom shader
                        uTime: { value: 0.0 }
                    },
                    glslVersion: THREE.GLSL3
                });
                console.log('Custom shader material created successfully');
            } catch (error) {
                console.error('Error loading custom shaders:', error);
                // Fallback to standard material
                mat = new THREE.MeshStandardMaterial({ color: 0xff0000 }); // Red to indicate error
            }
        } else {
            mat = new THREE.MeshStandardMaterial({ color: 0xf08a5d });
        }

        this.mesh = new THREE.Mesh(geo, mat);
        this.scene.add(this.mesh);

        // Physics
        this.body = new CANNON.Body({
            mass: 1,
            shape: new CANNON.Sphere(0.5),
            position: new CANNON.Vec3(position.x, position.y, position.z),
            linearDamping: 0.01,
            material: this.physicsMaterial
        });
        this.world.addBody(this.body);

        console.log(`Ball initialized at position (${position.x}, ${position.y}, ${position.z}), custom shader: ${this.useCustomShader}`);
    }

    update() {
        // Don't update if not initialized yet
        if (!this.mesh || !this.body) return;

        this.mesh.position.copy(this.body.position);
        this.mesh.quaternion.copy(this.body.quaternion);

        // Update shader time uniform if using custom shader
        if (this.useCustomShader && this.mesh.material.uniforms.uTime) {
            this.mesh.material.uniforms.uTime.value += 0.016;
        }
    }
}
