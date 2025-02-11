// JoystickController.js
export class JoystickController {
    constructor() {
        // Keep exact property initialization sequence
        this.joystickContainer = null;
        this.joystickBoundary = null;
        this.joystick = null;
        this.knob = null;
        this.touchId = null;
        this.origin = { x: 0, y: 0 };
        this.position = { x: 0, y: 0 };
        this.vector = { x: 0, y: 0 };
        this.active = false;
        this.maxDistance = 60;  // Critical gameplay value - don't change
        this.sensitivity = 1.5; // Critical gameplay value - don't change
        this.visible = false;

        // Critical initialization order
        this.createElements();
        this.init();
        this.hideControls();
    }

    createElements() {
        // Create in exact original order
        this.joystickContainer = document.createElement('div');
        this.joystickBoundary = document.createElement('div');
        this.joystick = document.createElement('div');
        this.knob = document.createElement('div');
    }

    init() {
        // Keep exact original CSS string
        this.joystickContainer.id = 'joystick-zone';
        this.joystickContainer.style.cssText = `
            position: fixed;
            left: 0;
            bottom: 0;
            width: 50%;
            height: 40vh;
            z-index: 1000;
            touch-action: none;
            pointer-events: auto;
        `;

        this.joystickBoundary.className = 'joystick-boundary';
        
        // Maintain original display state
        this.joystick.className = 'joystick-base';
        this.joystick.style.display = 'none';

        this.knob.className = 'joystick-knob';

        // Keep exact DOM structure
        this.joystick.appendChild(this.knob);
        this.joystickContainer.appendChild(this.joystickBoundary);
        this.joystickContainer.appendChild(this.joystick);
        document.body.appendChild(this.joystickContainer);

        this.setupEventListeners();
    }

    showControls() {
        if (this.joystickContainer && this.joystickBoundary) {
            this.joystickContainer.style.display = 'block';
            this.joystickBoundary.style.display = 'block';
            this.visible = true;
        }
    }

    hideControls() {
        if (this.joystickContainer && this.joystickBoundary) {
            this.joystickContainer.style.display = 'none';
            this.joystickBoundary.style.display = 'none';
            this.visible = false;
        }
    }

    setupEventListeners() {
        // Keep exact event order
        ['touchstart', 'mousedown'].forEach(eventType => {
            this.joystickContainer.addEventListener(eventType, (e) => {
                e.preventDefault();
                this.handleStart(eventType === 'touchstart' ? e.touches[0] : e);
            });
        });

        ['touchmove', 'mousemove'].forEach(eventType => {
            this.joystickContainer.addEventListener(eventType, (e) => {
                e.preventDefault();
                if (this.active) {
                    this.handleMove(eventType === 'touchmove' ? e.touches[0] : e);
                }
            });
        });

        ['touchend', 'touchcancel', 'mouseup', 'mouseleave'].forEach(eventType => {
            this.joystickContainer.addEventListener(eventType, (e) => {
                e.preventDefault();
                this.handleEnd();
            });
        });
    }

    handleStart(event) {
        if (this.active) return;  // Keep original guard clause
        
        this.active = true;
        this.origin.x = event.clientX;
        this.origin.y = event.clientY;
        
        // Keep exact positioning calculation
        this.joystick.style.display = 'block';
        this.joystick.style.left = `${this.origin.x - 60}px`;  // Original offset
        this.joystick.style.top = `${this.origin.y - 60}px`;   // Original offset
        
        this.updateJoystickState(event.clientX, event.clientY);
    }

    handleMove(event) {
        this.updateJoystickState(event.clientX, event.clientY);
    }

    handleEnd() {
        // Keep original reset order
        this.active = false;
        this.vector = { x: 0, y: 0 };
        this.joystick.style.display = 'none';
        this.knob.style.transform = 'translate(-50%, -50%)';
    }

    updateJoystickState(clientX, clientY) {
        // Keep exact original calculation order
        const dx = clientX - this.origin.x;
        const dy = clientY - this.origin.y;
        const distance = Math.min(Math.hypot(dx, dy), this.maxDistance);
        const angle = Math.atan2(dy, dx);

        const knobX = Math.cos(angle) * distance;
        const knobY = Math.sin(angle) * distance;

        // Keep original transform order
        this.knob.style.transform = `translate(calc(-50% + ${knobX}px), calc(-50% + ${knobY}px))`;

        // Keep original vector calculation order
        if (distance > 0) {
            this.vector.x = (knobX / this.maxDistance) * this.sensitivity;
            this.vector.y = (knobY / this.maxDistance) * this.sensitivity;
        } else {
            this.vector.x = 0;
            this.vector.y = 0;
        }
    }

    getInput() {
        return {
            active: this.active,
            vector: this.vector
        };
    }

    cleanup() {
        if (this.joystickContainer) {
            this.joystickContainer.remove();
        }
    }
}