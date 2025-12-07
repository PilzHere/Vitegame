import * as THREE from 'three';

export default class Renderer {
    constructor() {
        this.scene = null; // Scene skapas i SceneManager
        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 5, 10);

        this.renderer = new THREE.WebGLRenderer({ antialias: false });
        this.renderer.setSize(window.innerWidth, window.innerHeight);

        document.getElementById('app').appendChild(this.renderer.domElement);

        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    get domElement() {
        return this.renderer.domElement;
    }

    render(scene, camera) {
        this.renderer.render(scene, camera);
    }
}
