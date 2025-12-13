import * as THREE from 'three';
import Logger from '../utils/Logger.js';
import InputManager from '../core/InputManager.js';

export default class FPSCameraController {
    #velocity = new THREE.Vector3();
    #direction = new THREE.Vector3();
    #euler = new THREE.Euler(0, 0, 0, 'YXZ');
    #mouseSensitivity = 0.002;
    #isLocked = false;
    #camera = null;
    #domElement = null;
    #inputManager = null;
    #moveSpeed = 10.0;
    #enabled = true;

    constructor(camera, domElement) {
        this.#camera = camera;
        this.#domElement = domElement;
        this.#inputManager = InputManager.getInstance();

        // Set initial camera position
        this.#camera.position.set(0, 5, 10);
        this.#camera.lookAt(0, 0, 0);

        this.#setupPointerLock();
    }

    #setupPointerLock() {
        this.#domElement.addEventListener('click', async () => {
            if (!this.#isLocked) {
                try {
                    await this.#domElement.requestPointerLock();
                } catch (error) {
                    // SecurityError: User exited lock too recently, ignore
                    if (error.name !== 'SecurityError') {
                        Logger.error('Pointer lock error:', error);
                    }
                }
            }
        });

        document.addEventListener('pointerlockchange', () => {
            this.#isLocked = document.pointerLockElement === this.#domElement;
        });

        document.addEventListener('pointerlockerror', () => {
            Logger.warn('Pointer lock failed - try clicking again');
        });
    }

    update(deltaTime) {
        if (!this.#enabled) return;

        // Handle mouse look
        if (this.#isLocked) {
            const movementX = this.#inputManager.mouseDeltaX;
            const movementY = this.#inputManager.mouseDeltaY;

            this.#euler.setFromQuaternion(this.#camera.quaternion);
            this.#euler.y -= movementX * this.#mouseSensitivity;
            this.#euler.x -= movementY * this.#mouseSensitivity;

            // Clamp vertical rotation (prevent camera flip)
            this.#euler.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.#euler.x));

            this.#camera.quaternion.setFromEuler(this.#euler);
        }

        // Reset velocity
        this.#velocity.set(0, 0, 0);

        // Calculate movement direction based on input
        this.#direction.set(0, 0, 0);

        if (this.#inputManager.isKeyPressed('KeyW')) this.#direction.z += 1;   // W moves forward
        if (this.#inputManager.isKeyPressed('KeyS')) this.#direction.z -= 1;  // S moves backward
        if (this.#inputManager.isKeyPressed('KeyA')) this.#direction.x -= 1;      // A strafes left
        if (this.#inputManager.isKeyPressed('KeyD')) this.#direction.x += 1;     // D strafes right
        if (this.#inputManager.isKeyPressed('Space')) this.#direction.y += 1;        // Space moves up
        if (this.#inputManager.isKeyPressed('ShiftLeft') || this.#inputManager.isKeyPressed('ShiftRight')) this.#direction.y -= 1;      // Shift moves down

        // Normalize direction for consistent speed in all directions
        if (this.#direction.length() > 0) {
            this.#direction.normalize();
        }

        // Apply movement in camera's local space
        const moveSpeed = this.#moveSpeed * deltaTime;

        // Get camera's forward direction (where it's looking)
        const forward = new THREE.Vector3();
        this.#camera.getWorldDirection(forward);

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
        this.#camera.position.add(this.#velocity);
    }

    get camera() {
        return this.#camera;
    }

    get domElement() {
        return this.#domElement;
    }

    get moveSpeed() {
        return this.#moveSpeed;
    }

    set moveSpeed(speed) {
        this.#moveSpeed = speed;
    }

    get enabled() {
        return this.#enabled;
    }

    set enabled(value) {
        this.#enabled = value;
    }

    get mouseSensitivity() {
        return this.#mouseSensitivity;
    }

    set mouseSensitivity(sensitivity) {
        this.#mouseSensitivity = sensitivity;
    }

    get isLocked() {
        return this.#isLocked;
    }

    exitPointerLock() {
        document.exitPointerLock();
    }
}
