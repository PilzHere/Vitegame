import Renderer from './Renderer.js';
import SceneManager from './SceneManager.js';
import FPSCameraController from '../controls/FPSCameraController.js';
import PerformanceMonitor from '../utils/PerformanceMonitor.js';
import AssetLoader from './AssetLoader.js';
import AudioManager from './AudioManager.js';
import InputManager from './InputManager.js';
import GameStateManager from './GameStateManager.js';
import DebugHelpers from '../utils/DebugHelpers.js';
import PostProcessing from '../graphics/PostProcessing.js';
import UIRenderer from '../ui/UIRenderer.js';

// Import shaders as raw text (Vite will bundle them)
import basicVertShader from '../assets/shaders/basic/basic.vert?raw';
import basicFragShader from '../assets/shaders/basic/basic.frag?raw';
import texturedVertShader from '../assets/shaders/textured/textured.vert?raw';
import texturedFragShader from '../assets/shaders/textured/textured.frag?raw';

export default class Game {
    constructor() {
        this.renderer = new Renderer();
        this.assetLoader = AssetLoader.getInstance();
        this.audioManager = AudioManager.getInstance(this.assetLoader);
        this.inputManager = InputManager.getInstance();
        this.stateManager = GameStateManager.getInstance();

        this.lastTime = 0;

        // Setup state handlers
        this.#setupStates();

        // Initialize game async
        this.initPromise = this.#init();
    }

    #setupStates() {
        // Register LOADING state
        this.stateManager.registerState(GameStateManager.States.LOADING, {
            onEnter: () => {
                // Show loading screen
                this.#showLoadingScreen();
            },
            onExit: () => {
                // Hide loading screen
                this.#hideLoadingScreen();
            }
        });

        // Register PLAYING state
        this.stateManager.registerState(GameStateManager.States.PLAYING, {
            onEnter: () => {
                // Game is ready to play
            },
            onUpdate: (dt) => {
                // Only update game logic when in PLAYING state
                this.controls.update(dt);
                this.sceneManager.update(dt);
            }
        });

        // Manually show loading screen since we're already in LOADING state
        this.#showLoadingScreen();
    }

    #showLoadingScreen() {
        const loadingDiv = document.createElement('div');
        loadingDiv.id = 'loading-screen';
        loadingDiv.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            display: flex;
            justify-content: center;
            align-items: center;
            color: #ffffff;
            font-family: "Press Start 2P", monospace;
            font-size: 24px;
            text-shadow: 1px 1px 0px rgb(0, 0, 0);
            -webkit-font-smoothing: none;
            -moz-osx-font-smoothing: grayscale;
            font-smooth: never;
            z-index: 10000;
        `;
        loadingDiv.textContent = 'LOADING...';
        document.body.appendChild(loadingDiv);
    }

    #hideLoadingScreen() {
        const loadingDiv = document.getElementById('loading-screen');
        if (loadingDiv) {
            loadingDiv.remove();
        }
    }

    async #init() {
        // Delay to ensure loading screen is visible
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Load all assets while in LOADING state
        await this.#loadAllStandardAssets();

        // Create scene manager after assets are loaded
        this.sceneManager = new SceneManager(this.assetLoader);
        this.controls = new FPSCameraController(this.renderer.camera, this.renderer.domElement);

        // Setup post-processing
        this.postProcessing = new PostProcessing(
            this.renderer.renderer,
            this.sceneManager.scene,
            this.renderer.camera
        );
        this.postProcessing.addVignette(0.8, 1.0); // Subtle vignette
        this.postProcessing.enable();

        // Create performance monitor with post-processing reference
        this.performanceMonitor = new PerformanceMonitor(this.renderer, this.sceneManager, this.postProcessing);

        // Create UI renderer for 2D GUI
        this.uiRenderer = new UIRenderer();

        // Wait for scene entities to initialize
        await this.sceneManager.initPromise;

        // Transition to PLAYING state after all assets and entities are ready
        this.stateManager.changeState(GameStateManager.States.PLAYING);
    }

    async #loadAllStandardAssets() {
        // Load all standard assets first
        await this.assetLoader.loadAssets([
            {
                type: 'shader',
                name: 'ballShader',
                vertexSource: basicVertShader,
                fragmentSource: basicFragShader
            },
            {
                type: 'shader',
                name: 'texturedShader',
                vertexSource: texturedVertShader,
                fragmentSource: texturedFragShader
            },
            {
                type: 'texture',
                name: 'ballTexture',
                url: 'https://threejs.org/examples/textures/uv_grid_opengl.jpg'
            },
            {
                type: 'sound',
                name: 'bounce',
                url: '/src/assets/sound/sfx/faahhh.mp3'
            },
            {
                type: 'atlas',
                name: 'demo-atlas',
                imageUrl: 'https://threejs.org/examples/textures/uv_grid_opengl.jpg',
                atlasData: {
                    frames: {
                        'icon-health': { frame: { x: 0, y: 0, w: 64, h: 64 } },
                        'icon-coin': { frame: { x: 64, y: 0, w: 64, h: 64 } },
                        'icon-star': { frame: { x: 128, y: 0, w: 64, h: 64 } }
                    }
                }
            }
        ]);
    }

    #handleInput() {
        // Handle F key for fullscreen toggle
        if (this.inputManager.isKeyJustPressed('KeyF')) {
            this.#toggleFullscreen();
        }

        // Handle F3 key for performance monitor
        if (this.inputManager.isKeyJustPressed('F3')) {
            this.performanceMonitor.toggle();
        }

        // Handle F4 key for debug helpers
        if (this.inputManager.isKeyJustPressed('F4')) {
            DebugHelpers.toggle();
        }

        // Handle F5 key for post-processing toggle
        if (this.inputManager.isKeyJustPressed('F5')) {
            if (this.postProcessing.enabled) {
                this.postProcessing.disable();
            } else {
                this.postProcessing.enable();
            }
        }
    }

    #toggleFullscreen() {
        if (!document.fullscreenElement) {
            // Enter fullscreen
            document.documentElement.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable fullscreen: ${err.message}`);
            });
        } else {
            // Exit fullscreen
            document.exitFullscreen();
        }
    }

    #renderUI(dt) {
        // Clear previous frame
        this.uiRenderer.clear();

        // Example: Draw a simple crosshair in the center
        const centerX = this.uiRenderer.width / 2;
        const centerY = this.uiRenderer.height / 2;
        const crosshairSize = 10;
        const crosshairThickness = 2;

        // Draw crosshair
        this.uiRenderer.drawRect(centerX - crosshairSize / 2, centerY - crosshairThickness / 2, crosshairSize, crosshairThickness, 'white', 0.8);
        this.uiRenderer.drawRect(centerX - crosshairThickness / 2, centerY - crosshairSize / 2, crosshairThickness, crosshairSize, 'white', 0.8);

        // Draw atlas demo sprites
        const demoAtlas = this.assetLoader.getAtlas('demo-atlas');
        if (demoAtlas) {
            // Draw health icon in top-left
            this.uiRenderer.drawAtlasFrame(demoAtlas, 'icon-health', 10, 10, 48, 48);

            // Draw coin icon next to health
            this.uiRenderer.drawAtlasFrame(demoAtlas, 'icon-coin', 70, 10, 48, 48);

            // Draw star icon with rotation animation
            const rotation = (Date.now() / 1000) % (Math.PI * 2);
            this.uiRenderer.drawAtlasFrame(demoAtlas, 'icon-star', 130, 10, 48, 48, 1.0, rotation);
        }

        // Example: Draw game info text
        this.uiRenderer.drawOutlinedText(
            'E: Jump | F: Fullscreen | F3: Performance | F4: Draw lines | F5: Post-processing',
            20,
            this.uiRenderer.height - 40,
            '14px monospace',
            'white',
            'black',
            3
        );
    }

    async start() {
        // Wait for initialization to complete (assets + scene)
        await this.initPromise;

        // Resume AudioContext on first user click (required for browser autoplay policy)
        this.renderer.domElement.addEventListener('click', async () => {
            await this.audioManager.resume();
        }, { once: true });

        requestAnimationFrame(this.loop.bind(this));
    }

    loop(time) {
        const dt = (time - this.lastTime) / 1000;
        this.lastTime = time;

        // Handle input at the start of the frame
        this.#handleInput();

        // Update state machine (only updates game logic in PLAYING state)
        this.stateManager.update(dt);

        // Always render and update performance monitor regardless of state
        // Use post-processing render instead of direct render
        this.postProcessing.render();
        this.performanceMonitor.update(dt);

        // Render UI on top of 3D scene
        this.#renderUI(dt);

        // Clear input states at the end of the frame
        this.inputManager.update();

        requestAnimationFrame(this.loop.bind(this));
    }
}
