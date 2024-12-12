// Input.js
import { CONFIG } from '../../config.js';

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

        this.isMobile = window.innerWidth <= 768 ||
            /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

        this.touchState = {};
        this.setupEventListeners();
    }

    setupEventListeners() {
        window.addEventListener('keydown', (e) => this.setKey(e.code, true));
        window.addEventListener('keyup', (e) => this.setKey(e.code, false));

        if (this.isMobile) {
            this.setupTouchControls();
        }
    }

    setupTouchControls() {
        const directions = ['up', 'down', 'left', 'right'];
        directions.forEach((dir) => {
            const element = document.getElementById(dir);
            if (element) {
                element.addEventListener('touchstart', (e) => this.handleTouch(e, dir, true));
                element.addEventListener('touchend', (e) => this.handleTouch(e, dir, false));
                element.addEventListener('touchcancel', (e) => this.handleTouch(e, dir, false));
            } else {
                console.warn(`Touch control button with ID '${dir}' not found.`);
            }
        });
    }

    handleTouch(event, direction, isPressed) {
        event.preventDefault();
        const key = `Arrow${direction.charAt(0).toUpperCase() + direction.slice(1)}`;
        if (this.touchState[key] !== isPressed) {
            this.touchState[key] = isPressed;
            this.setKey(key, isPressed);
            const element = document.getElementById(direction);
            if (element) {
                element.classList.toggle('active', isPressed);
            }
        }
    }

    setKey(key, value) {
        if (this.keys.hasOwnProperty(key)) {
            this.keys[key] = value;
        }
    }

    isMoving() {
        return Object.values(this.keys).some(Boolean);
    }
}
