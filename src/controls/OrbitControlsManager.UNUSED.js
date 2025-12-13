import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export default class OrbitControlsManager {
    constructor(camera, domElement) {
        this.controls = new OrbitControls(camera, domElement);
        this.controls.enableDamping = true;
    }

    update() {
        this.controls.update();
    }
}
