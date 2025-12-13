export default class InputManager {
    static #instance = null;

    // Use Maps for better performance
    #keys = new Map();
    #keysPressed = new Map(); // Track keys pressed this frame
    #keysReleased = new Map(); // Track keys released this frame

    #mouse = {
        x: 0,
        y: 0,
        deltaX: 0,
        deltaY: 0,
        buttons: new Map(),
        buttonsPressed: new Map(), // Track buttons pressed this frame
        buttonsReleased: new Map() // Track buttons released this frame
    };

    // Keys that should have preventDefault called
    static #GAME_KEYS = new Set([
        'KeyF', 'F3', 'F4', 'F5', 'Space', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyE',
        'ShiftLeft', 'ShiftRight', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'
    ]);

    constructor() {
        if (InputManager.#instance) {
            return InputManager.#instance;
        }

        this.#setupEventListeners();
        InputManager.#instance = this;
    }

    static getInstance() {
        if (!InputManager.#instance) {
            InputManager.#instance = new InputManager();
        }
        return InputManager.#instance;
    }

    #setupEventListeners() {
        window.addEventListener('keydown', (e) => {
            // Prevent default browser behavior for game keys
            if (InputManager.#GAME_KEYS.has(e.code)) {
                e.preventDefault();
            }

            if (!this.#keys.get(e.code)) {
                this.#keysPressed.set(e.code, true);
            }
            this.#keys.set(e.code, true);
        });

        window.addEventListener('keyup', (e) => {
            // Prevent default browser behavior for game keys
            if (InputManager.#GAME_KEYS.has(e.code)) {
                e.preventDefault();
            }

            this.#keys.set(e.code, false);
            this.#keysReleased.set(e.code, true);
        });

        window.addEventListener('mousemove', (e) => {
            this.#mouse.deltaX = e.movementX || 0;
            this.#mouse.deltaY = e.movementY || 0;
            this.#mouse.x = e.clientX;
            this.#mouse.y = e.clientY;
        });

        window.addEventListener('mousedown', (e) => {
            if (!this.#mouse.buttons.get(e.button)) {
                this.#mouse.buttonsPressed.set(e.button, true);
            }
            this.#mouse.buttons.set(e.button, true);
        });

        window.addEventListener('mouseup', (e) => {
            this.#mouse.buttons.set(e.button, false);
            this.#mouse.buttonsReleased.set(e.button, true);
        });
    }

    // Check if key is currently held down
    isKeyPressed(keyCode) {
        return this.#keys.get(keyCode) || false;
    }

    // Check if key was just pressed this frame
    isKeyJustPressed(keyCode) {
        return this.#keysPressed.get(keyCode) || false;
    }

    // Check if key was just released this frame
    isKeyJustReleased(keyCode) {
        return this.#keysReleased.get(keyCode) || false;
    }

    // Check if mouse button is currently held down
    isMouseButtonPressed(button = 0) {
        return this.#mouse.buttons.get(button) || false;
    }

    // Check if mouse button was just pressed this frame
    isMouseButtonJustPressed(button = 0) {
        return this.#mouse.buttonsPressed.get(button) || false;
    }

    // Check if mouse button was just released this frame
    isMouseButtonJustReleased(button = 0) {
        return this.#mouse.buttonsReleased.get(button) || false;
    }

    get mouseX() {
        return this.#mouse.x;
    }

    get mouseY() {
        return this.#mouse.y;
    }

    get mouseDeltaX() {
        return this.#mouse.deltaX;
    }

    get mouseDeltaY() {
        return this.#mouse.deltaY;
    }

    // Call this at the end of each frame to clear "just pressed/released" states
    update() {
        // Clear frame-specific input states efficiently (reuse Maps instead of creating new ones)
        this.#keysPressed.clear();
        this.#keysReleased.clear();
        this.#mouse.buttonsPressed.clear();
        this.#mouse.buttonsReleased.clear();
        this.#mouse.deltaX = 0;
        this.#mouse.deltaY = 0;
    }
}
