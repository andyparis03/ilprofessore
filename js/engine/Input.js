// Input.js
import { CONFIG } from '../../config.js';
import { JoystickController } from './JoystickController.js';

export class InputHandler {
constructor() {
    this.keys = {
        ArrowUp: false,
        ArrowDown: false,
        ArrowLeft: false,
        ArrowRight: false,
        KeyF: false,
        KeyB: false
    };

    this.isMobile = window.innerWidth <= CONFIG.CANVAS.MOBILE_BREAKPOINT ||
        /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    // Always set up keyboard controls
    this.setupKeyboardControls();
    


    // Set up mobile controls only if needed
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
            'fuck': 'KeyF'
        };

        Object.entries(actionButtons).forEach(([buttonId, keyCode]) => {
            const element = document.getElementById(buttonId);
            if (element) {
                ['touchstart', 'mousedown'].forEach(eventType => {
                    element.addEventListener(eventType, (e) => {
                        e.preventDefault();
                        this.setKey(keyCode, true);
                        element.classList.add('active');
                    });
                });

                ['touchend', 'touchcancel', 'mouseup', 'mouseleave'].forEach(eventType => {
                    element.addEventListener(eventType, (e) => {
                        e.preventDefault();
                        this.setKey(keyCode, false);
                        element.classList.remove('active');
                    });
                });
            }
        });
    }

    setKey(key, value) {
        if (this.keys.hasOwnProperty(key)) {
            this.keys[key] = value;
        }
    }

    getMovementVector() {
        if (this.isMobile && this.joystick) {
            const joystickInput = this.joystick.getInput();
            return joystickInput.active ? joystickInput.vector : { x: 0, y: 0 };
        }

        const vector = { x: 0, y: 0 };
        if (this.keys.ArrowRight) vector.x += 1;
        if (this.keys.ArrowLeft) vector.x -= 1;
        if (this.keys.ArrowDown) vector.y += 1;
        if (this.keys.ArrowUp) vector.y -= 1;

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