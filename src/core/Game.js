import Renderer from './Renderer.js';
import SceneManager from './SceneManager.js';
import FPSCameraController from '../controls/FPSCameraController.js';
import PerformanceMonitor from '../utils/PerformanceMonitor.js';
import AssetLoader from './AssetLoader.js';
import DebugHelpers from '../utils/DebugHelpers.js';

export default class Game {
    #keyF3Pressed = false;
    #keyF4Pressed = false;

    constructor() {
        this.renderer = new Renderer();
        this.assetLoader = AssetLoader.getInstance();

        this.lastTime = 0;

        this.#setupKeyboardInput();

        // Initialize game async
        this.initPromise = this.#init();
    }

    async #init() {
        await this.#loadAllStandardAssets();

        // Create scene manager after assets are loaded
        this.sceneManager = new SceneManager();
        this.controls = new FPSCameraController(this.renderer.camera, this.renderer.domElement);
        this.performanceMonitor = new PerformanceMonitor(this.renderer, this.sceneManager);

        // Wait for scene entities to initialize
        await this.sceneManager.initPromise;
    }

    async #loadAllStandardAssets() {
        // Load all standard assets first
        await this.assetLoader.loadAssets([
            {
                type: 'shader',
                name: 'ballShader',
                vertexUrl: '/src/assets/shaders/basic/basic.vert',
                fragmentUrl: '/src/assets/shaders/basic/basic.frag'
            },
            {
                type: 'shader',
                name: 'texturedShader',
                vertexUrl: '/src/assets/shaders/textured/textured.vert',
                fragmentUrl: '/src/assets/shaders/textured/textured.frag'
            },
            {
                type: 'texture',
                name: 'ballTexture',
                url: 'https://threejs.org/examples/textures/uv_grid_opengl.jpg'
            }
        ]);
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

            if (event.key === 'F4') {
                event.preventDefault();
                if (!this.#keyF4Pressed) {
                    this.#keyF4Pressed = true;
                    DebugHelpers.toggle();
                }
            }
        });

        window.addEventListener('keyup', (event) => {
            if (event.key === 'F3') {
                this.#keyF3Pressed = false;
            }

            if (event.key === 'F4') {
                this.#keyF4Pressed = false;
            }
        });
    }

    async start() {
        // Wait for initialization to complete (assets + scene)
        await this.initPromise;
        requestAnimationFrame(this.loop.bind(this));
    }

    loop(time) {
        const dt = (time - this.lastTime) / 1000;
        this.lastTime = time;

        this.sceneManager.update(dt);      // uppdatera fysik + entiteter
        this.controls.update(dt);           // uppdatera kameran (FPS controls need deltaTime)
        this.renderer.render(this.sceneManager.scene, this.renderer.camera);
        this.performanceMonitor.update(dt);  // uppdatera performance monitor

        requestAnimationFrame(this.loop.bind(this));
    }
}
