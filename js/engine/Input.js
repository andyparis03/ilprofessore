// Input.js
import { CONFIG } from '../../config.js';
import { JoystickController } from './JoystickController.js';

export class InputHandler {
    constructor() {
        // Keep exact original property order and structure
        this.keys = {
            ArrowUp: false,
            ArrowDown: false,
            ArrowLeft: false,
            ArrowRight: false,
            KeyF: false,
            KeyB: false,
            KeyP: false
        };

        // Preserve original device detection exactly
        this.isMobile = window.innerWidth <= CONFIG.CANVAS.MOBILE_BREAKPOINT ||
            /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

        // Initialize joystick first if mobile (original order)
        this.joystick = null;
        
        // Set up keyboard first - maintain original initialization order
        this.setupKeyboardControls();

        // Handle mobile setup after keyboard - preserve timing
        if (this.isMobile) {
            this.joystick = new JoystickController();
            this.setupMobileControls();
        }
    }

    setupKeyboardControls() {
        window.addEventListener('keydown', (e) => this.setKey(e.code, true));
        window.addEventListener('keyup', (e) => this.setKey(e.code, false));
    }

    setupMobileControls() {
        const actionButtons = {
            'bacio': 'KeyB',
            'fuck': 'KeyF',
            'punch': 'KeyP'
        };

        Object.entries(actionButtons).forEach(([buttonId, keyCode]) => {
            const element = document.getElementById(buttonId);
            if (element) {
                console.log(`Setting up mobile control for ${buttonId}`);
                
                // Maintain exact original event order
                ['touchstart', 'mousedown'].forEach(eventType => {
                    element.addEventListener(eventType, (e) => {
                        e.preventDefault();
                        this.setKey(keyCode, true);
                        element.classList.add('active');
                        console.log(`${buttonId} pressed, setting ${keyCode} to true`);
                    });
                });

                ['touchend', 'touchcancel', 'mouseup', 'mouseleave'].forEach(eventType => {
                    element.addEventListener(eventType, (e) => {
                        e.preventDefault();
                        this.setKey(keyCode, false);
                        element.classList.remove('active');
                        console.log(`${buttonId} released, setting ${keyCode} to false`);
                    });
                });
            } else {
                console.warn(`Button element with id ${buttonId} not found`);
            }
        });
    }

    setKey(key, value) {
        if (this.keys.hasOwnProperty(key)) {
            this.keys[key] = value;
        }
    }

    getMovementVector() {
        // Mobile check first - preserve original order
        if (this.isMobile && this.joystick) {
            const joystickInput = this.joystick.getInput();
            if (joystickInput.active) {
                return joystickInput.vector;
            }
            return { x: 0, y: 0 };
        }

        // Original keyboard vector calculation
        const vector = { x: 0, y: 0 };
        
        // Keep original key check order
        if (this.keys.ArrowRight) vector.x += 1;
        if (this.keys.ArrowLeft) vector.x -= 1;
        if (this.keys.ArrowDown) vector.y += 1;
        if (this.keys.ArrowUp) vector.y -= 1;

        // Original diagonal movement normalization
        if (vector.x !== 0 && vector.y !== 0) {
            const magnitude = Math.sqrt(2);
            vector.x /= magnitude;
            vector.y /= magnitude;
        }

        return vector;
    }

    isMoving() {
        const vector = this.getMovementVector();
        return vector.x !== 0 || vector.y !== 0;
    }

    cleanup() {
        if (this.joystick) {
            this.joystick.joystickContainer.remove();
        }
    }
}