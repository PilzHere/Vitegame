import * as THREE from 'three';

export default class Renderer {
    #camera = null;
    #renderer = null;

    constructor() {
        this.#camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.01, 2000);
        this.#camera.position.set(0, 5, 10);
        this.#camera.lookAt(0, 0, 0); // Look at the origin where the action happens

        this.#renderer = new THREE.WebGLRenderer({ antialias: false });
        this.#renderer.setSize(window.innerWidth, window.innerHeight);

        document.getElementById('app').appendChild(this.#renderer.domElement);

        window.addEventListener('resize', () => {
            this.#camera.aspect = window.innerWidth / window.innerHeight;
            this.#camera.updateProjectionMatrix();
            this.#renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    get camera() {
        return this.#camera;
    }

    get renderer() {
        return this.#renderer;
    }

    get domElement() {
        return this.#renderer.domElement;
    }

    render(scene, camera) {
        this.#renderer.render(scene, camera);
    }
}
