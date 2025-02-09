// JoystickController.js
export class JoystickController {
    constructor() {
        this.joystickContainer = null;
        this.joystickBoundary = null;
        this.joystick = null;
        this.knob = null;
        this.touchId = null;
        this.origin = { x: 0, y: 0 };
        this.position = { x: 0, y: 0 };
        this.vector = { x: 0, y: 0 };
        this.active = false;
        this.maxDistance = 60;
        this.sensitivity = 1.5;
        this.visible = false;

        this.createElements();
        this.init();
        this.hideControls();
    }

    createElements() {
        this.joystickContainer = document.createElement('div');
        this.joystickBoundary = document.createElement('div');
        this.joystick = document.createElement('div');
        this.knob = document.createElement('div');
    }

    init() {
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
        
        this.joystick.className = 'joystick-base';
        this.joystick.style.display = 'none';

        this.knob.className = 'joystick-knob';

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
        if (!this.active) {
            this.active = true;
            this.origin.x = event.clientX;
            this.origin.y = event.clientY;
            
            this.joystick.style.display = 'block';
            this.joystick.style.left = `${this.origin.x - 60}px`;
            this.joystick.style.top = `${this.origin.y - 60}px`;
            
            this.updateJoystickState(event.clientX, event.clientY);
        }
    }

    handleMove(event) {
        this.updateJoystickState(event.clientX, event.clientY);
    }

    handleEnd() {
        this.active = false;
        this.vector = { x: 0, y: 0 };
        this.joystick.style.display = 'none';
        this.knob.style.transform = 'translate(-50%, -50%)';
    }

    updateJoystickState(clientX, clientY) {
        const dx = clientX - this.origin.x;
        const dy = clientY - this.origin.y;
        const distance = Math.min(Math.hypot(dx, dy), this.maxDistance);
        const angle = Math.atan2(dy, dx);

        const knobX = Math.cos(angle) * distance;
        const knobY = Math.sin(angle) * distance;

        this.knob.style.transform = `translate(calc(-50% + ${knobX}px), calc(-50% + ${knobY}px))`;

        this.vector = {
            x: distance > 0 ? (knobX / this.maxDistance) * this.sensitivity : 0,
            y: distance > 0 ? (knobY / this.maxDistance) * this.sensitivity : 0
        };
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