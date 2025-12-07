export default class InputManager {
    constructor() {
        this.keys = {};
        this.mouse = {
            x: 0,
            y: 0,
            deltaX: 0,
            deltaY: 0,
            buttons: {}
        };

        this.#setupEventListeners();
    }

    #setupEventListeners() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });

        window.addEventListener('mousemove', (e) => {
            this.mouse.deltaX = e.movementX;
            this.mouse.deltaY = e.movementY;
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        });

        window.addEventListener('mousedown', (e) => {
            this.mouse.buttons[e.button] = true;
        });

        window.addEventListener('mouseup', (e) => {
            this.mouse.buttons[e.button] = false;
        });
    }

    isKeyPressed(keyCode) {
        return this.keys[keyCode] || false;
    }

    isMouseButtonPressed(button = 0) {
        return this.mouse.buttons[button] || false;
    }

    resetMouseDelta() {
        this.mouse.deltaX = 0;
        this.mouse.deltaY = 0;
    }
}
