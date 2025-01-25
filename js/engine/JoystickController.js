// JoystickController.js
export class JoystickController {
    constructor() {
        this.joystickArea = null;
        this.joystickBase = null;
        this.joystickKnob = null;
        this.touchId = null;
        this.origin = { x: 0, y: 0 };
        this.position = { x: 0, y: 0 };
        this.vector = { x: 0, y: 0 };
        this.active = false;
        this.maxDistance = 40;
        this.init();
    }

    init() {
        // Create joystick area with boundary
        this.joystickArea = document.createElement('div');
        this.joystickArea.className = 'joystick-area';

        // Create joystick boundary
        this.joystickBoundary = document.createElement('div');
        this.joystickBoundary.className = 'joystick-boundary';
        
        // Create base and knob
        this.joystickBase = document.createElement('div');
        this.joystickBase.className = 'joystick-base';
        this.joystickBase.style.display = 'none';

        this.joystickKnob = document.createElement('div');
        this.joystickKnob.className = 'joystick-knob';

        this.joystickBase.appendChild(this.joystickKnob);
        this.joystickArea.appendChild(this.joystickBoundary);
        this.joystickArea.appendChild(this.joystickBase);
        document.body.appendChild(this.joystickArea);

        this.setupEventListeners();
    }

    setupEventListeners() {
        ['touchstart', 'mousedown'].forEach(eventType => {
            this.joystickArea.addEventListener(eventType, (e) => {
                e.preventDefault();
                this.handleStart(eventType === 'touchstart' ? e.touches[0] : e);
            });
        });

        ['touchmove', 'mousemove'].forEach(eventType => {
            this.joystickArea.addEventListener(eventType, (e) => {
                e.preventDefault();
                if (this.active) {
                    this.handleMove(eventType === 'touchmove' ? e.touches[0] : e);
                }
            });
        });

        ['touchend', 'touchcancel', 'mouseup', 'mouseleave'].forEach(eventType => {
            this.joystickArea.addEventListener(eventType, (e) => {
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
            
            this.joystickBase.style.display = 'block';
            this.joystickBase.style.left = `${this.origin.x - 60}px`;
            this.joystickBase.style.top = `${this.origin.y - 60}px`;
            
            this.updateJoystickState(event.clientX, event.clientY);
        }
    }

    handleMove(event) {
        if (this.active) {
            this.updateJoystickState(event.clientX, event.clientY);
        }
    }

    handleEnd() {
        this.active = false;
        this.vector = { x: 0, y: 0 };
        this.joystickBase.style.display = 'none';
        this.joystickKnob.style.transform = 'translate(-50%, -50%)';
    }

    updateJoystickState(clientX, clientY) {
        const dx = clientX - this.origin.x;
        const dy = clientY - this.origin.y;
        const distance = Math.min(Math.hypot(dx, dy), this.maxDistance);
        const angle = Math.atan2(dy, dx);

        const knobX = Math.cos(angle) * distance;
        const knobY = Math.sin(angle) * distance;

        this.joystickKnob.style.transform = `translate(calc(-50% + ${knobX}px), calc(-50% + ${knobY}px))`;

        this.vector = {
            x: distance > 0 ? (knobX / this.maxDistance) : 0,
            y: distance > 0 ? (knobY / this.maxDistance) : 0
        };
    }

    getInput() {
        return {
            active: this.active,
            vector: this.vector
        };
    }
}