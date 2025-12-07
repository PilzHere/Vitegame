import Renderer from './Renderer.js';
import SceneManager from './SceneManager.js';
import OrbitControlsManager from './controls/OrbitControlsManager.js';
import PerformanceMonitor from './PerformanceMonitor.js';

export default class Game {
    #keyF3Pressed = false;

    constructor() {
        this.renderer = new Renderer();
        this.sceneManager = new SceneManager();
        this.controls = new OrbitControlsManager(this.renderer.camera, this.renderer.domElement);
        this.performanceMonitor = new PerformanceMonitor(this.renderer, this.sceneManager);

        this.lastTime = 0;

        this.#setupKeyboardInput();

        // Wait for scene to initialize before starting
        this.initPromise = this.sceneManager.initPromise;
    }

    #setupKeyboardInput() {
        window.addEventListener('keydown', (event) => {
            if (event.key === 'F3') {
                event.preventDefault();
                if (!this.#keyF3Pressed) {
                this.#keyF3Pressed = true;
                this.performanceMonitor.toggle();
                }
            }
        });

        window.addEventListener('keyup', (event) => {
            if (event.key === 'F3') {
                this.#keyF3Pressed = false;
            }
        });
    }

    async start() {
        // Wait for scene initialization to complete
        await this.initPromise;
        requestAnimationFrame(this.loop.bind(this));
    }

    loop(time) {
        const dt = (time - this.lastTime) / 1000;
        this.lastTime = time;

        this.sceneManager.update(dt);      // uppdatera fysik + entiteter
        this.controls.update();             // uppdatera kameran
        this.renderer.render(this.sceneManager.scene, this.renderer.camera);
        this.performanceMonitor.update(dt);  // uppdatera performance monitor

        requestAnimationFrame(this.loop.bind(this));
    }
}
