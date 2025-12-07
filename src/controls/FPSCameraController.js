import * as THREE from 'three';

export default class FPSCameraController {
    #keys = {
        forward: false,
        backward: false,
        left: false,
        right: false,
        up: false,
        down: false
    };

    #velocity = new THREE.Vector3();
    #direction = new THREE.Vector3();
    #euler = new THREE.Euler(0, 0, 0, 'YXZ');
    #mouseSensitivity = 0.002;
    #isLocked = false;

    constructor(camera, domElement) {
        this.camera = camera;
        this.domElement = domElement;
        this.moveSpeed = 10.0; // Units per second
        this.enabled = true;

        // Set initial camera position
        this.camera.position.set(0, 5, 10);
        this.camera.lookAt(0, 0, 0);

        this.#setupPointerLock();
        this.#setupKeyboardControls();
        this.#setupMouseControls();
    }

    #setupPointerLock() {
        this.domElement.addEventListener('click', () => {
            if (!this.#isLocked) {
                this.domElement.requestPointerLock();
            }
        });

        document.addEventListener('pointerlockchange', () => {
            this.#isLocked = document.pointerLockElement === this.domElement;
        });
    }

    #setupKeyboardControls() {
        document.addEventListener('keydown', (event) => {
            if (!this.enabled) return;

            switch (event.code) {
                case 'KeyW':
                    this.#keys.forward = true;
                    break;
                case 'KeyS':
                    this.#keys.backward = true;
                    break;
                case 'KeyA':
                    this.#keys.left = true;
                    break;
                case 'KeyD':
                    this.#keys.right = true;
                    break;
                case 'Space':
                    this.#keys.up = true;
                    break;
                case 'ShiftLeft':
                    this.#keys.down = true;
                case 'ShiftRight':
                    break;
            }
        });

        document.addEventListener('keyup', (event) => {
            switch (event.code) {
                case 'KeyW':
                    this.#keys.forward = false;
                    break;
                case 'KeyS':
                    this.#keys.backward = false;
                    break;
                case 'KeyA':
                    this.#keys.left = false;
                    break;
                case 'KeyD':
                    this.#keys.right = false;
                    break;
                case 'Space':
                    this.#keys.up = false;
                    break;
                case 'ShiftLeft':
                    this.#keys.down = false;
                case 'ShiftRight':
                    break;
            }
        });
    }

    #setupMouseControls() {
        document.addEventListener('mousemove', (event) => {
            if (!this.#isLocked || !this.enabled) return;

            const movementX = event.movementX || 0;
            const movementY = event.movementY || 0;

            this.#euler.setFromQuaternion(this.camera.quaternion);
            this.#euler.y -= movementX * this.#mouseSensitivity;
            this.#euler.x -= movementY * this.#mouseSensitivity;

            // Clamp vertical rotation (prevent camera flip)
            this.#euler.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.#euler.x));

            this.camera.quaternion.setFromEuler(this.#euler);
        });
    }

    update(deltaTime) {
        if (!this.enabled) return;

        // Reset velocity
        this.#velocity.set(0, 0, 0);

        // Calculate movement direction
        this.#direction.set(0, 0, 0);

        if (this.#keys.forward) this.#direction.z += 1;   // W moves forward
        if (this.#keys.backward) this.#direction.z -= 1;  // S moves backward
        if (this.#keys.left) this.#direction.x -= 1;      // A strafes left
        if (this.#keys.right) this.#direction.x += 1;     // D strafes right
        if (this.#keys.up) this.#direction.y += 1;        // Space moves up
        if (this.#keys.down) this.#direction.y -= 1;      // Shift moves down

        // Normalize direction for consistent speed in all directions
        if (this.#direction.length() > 0) {
            this.#direction.normalize();
        }

        // Apply movement in camera's local space
        const moveSpeed = this.moveSpeed * deltaTime;

        // Get camera's forward direction (where it's looking)
        const forward = new THREE.Vector3();
        this.camera.getWorldDirection(forward);

        // Calculate right vector (perpendicular to forward, for strafing)
        const right = new THREE.Vector3();
        const worldUp = new THREE.Vector3(0, 1, 0);
        right.crossVectors(forward, worldUp).normalize();

        // Forward/backward movement (W/S) - moves along camera's EXACT looking direction
        this.#velocity.add(forward.multiplyScalar(this.#direction.z * moveSpeed));

        // Left/right movement (A/D - strafe) - moves perpendicular to looking direction
        this.#velocity.add(right.multiplyScalar(this.#direction.x * moveSpeed));

        // Up/down movement (Space/Shift - vertical) - world space up/down
        this.#velocity.y += this.#direction.y * moveSpeed;

        // Apply velocity to camera position
        this.camera.position.add(this.#velocity);
    }

    isLocked() {
        return this.#isLocked;
    }

    exitPointerLock() {
        document.exitPointerLock();
    }
}
