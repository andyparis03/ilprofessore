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

        this.isMobile = window.innerWidth <= CONFIG.CANVAS.MOBILE_BREAKPOINT ||
            /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

        this.touchState = {};
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Keyboard events
        window.addEventListener('keydown', (e) => this.setKey(e.code, true));
        window.addEventListener('keyup', (e) => this.setKey(e.code, false));

        // Mouse click events for UI
        const canvas = document.getElementById('gameCanvas');
        if (canvas) {
            canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
            canvas.addEventListener('touchend', (e) => {
                e.preventDefault();
                if (e.changedTouches.length > 0) {
                    const touch = e.changedTouches[0];
                    this.handleCanvasClick({
                        clientX: touch.clientX,
                        clientY: touch.clientY,
                        target: touch.target
                    });
                }
            });
        }

        if (this.isMobile) {
            this.setupTouchControls();
        }
    }

    handleCanvasClick(e) {
        const canvas = e.target;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;

        const gameInstance = window.gameInstance;
        if (!gameInstance?.gameState) return;

        // Handle clicks based on game state
        if (gameInstance.gameState.gameState === 'SPLASH') {
            gameInstance.gameState.handleSplashClick(x, y);
        } else if (gameInstance.gameState.gameState === 'INSTRUCTIONS') {
            gameInstance.gameState.handleInstructionsClick(x, y);
        }
    }

    setupTouchControls() {
        // Direction buttons
        const directions = ['up', 'down', 'left', 'right'];
        directions.forEach((dir) => {
            const element = document.getElementById(dir);
            if (element) {
                // Touch events
                element.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    this.handleDirectionTouch(e, dir, true);
                });
                element.addEventListener('touchend', (e) => {
                    e.preventDefault();
                    this.handleDirectionTouch(e, dir, false);
                });
                element.addEventListener('touchcancel', (e) => {
                    e.preventDefault();
                    this.handleDirectionTouch(e, dir, false);
                });

                // Mouse events
                element.addEventListener('mousedown', (e) => {
                    e.preventDefault();
                    this.handleDirectionTouch(e, dir, true);
                });
                element.addEventListener('mouseup', (e) => {
                    e.preventDefault();
                    this.handleDirectionTouch(e, dir, false);
                });
                element.addEventListener('mouseleave', (e) => {
                    e.preventDefault();
                    this.handleDirectionTouch(e, dir, false);
                });
            }
        });

        // Action buttons
        const actionButtons = {
            'bacio': 'KeyB',
            'fuck': 'KeyF'
        };

        Object.entries(actionButtons).forEach(([buttonId, keyCode]) => {
            const element = document.getElementById(buttonId);
            if (element) {
                // Touch events
                element.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    this.handleActionTouch(keyCode, true);
                    element.classList.add('active');
                });
                element.addEventListener('touchend', (e) => {
                    e.preventDefault();
                    this.handleActionTouch(keyCode, false);
                    element.classList.remove('active');
                });
                element.addEventListener('touchcancel', (e) => {
                    e.preventDefault();
                    this.handleActionTouch(keyCode, false);
                    element.classList.remove('active');
                });

                // Mouse events
                element.addEventListener('mousedown', (e) => {
                    e.preventDefault();
                    this.handleActionTouch(keyCode, true);
                    element.classList.add('active');
                });
                element.addEventListener('mouseup', (e) => {
                    e.preventDefault();
                    this.handleActionTouch(keyCode, false);
                    element.classList.remove('active');
                });
                element.addEventListener('mouseleave', (e) => {
                    e.preventDefault();
                    this.handleActionTouch(keyCode, false);
                    element.classList.remove('active');
                });
            }
        });
    }

    handleDirectionTouch(event, direction, isPressed) {
        const key = `Arrow${direction.charAt(0).toUpperCase() + direction.slice(1)}`;
        this.setKey(key, isPressed);
        const element = document.getElementById(direction);
        if (element) {
            element.classList.toggle('active', isPressed);
        }
    }

    handleActionTouch(keyCode, isPressed) {
        this.setKey(keyCode, isPressed);
    }

    setKey(key, value) {
        if (this.keys.hasOwnProperty(key)) {
            this.keys[key] = value;
        }
    }

    isMoving() {
        return this.keys.ArrowUp || this.keys.ArrowDown || 
               this.keys.ArrowLeft || this.keys.ArrowRight;
    }
}