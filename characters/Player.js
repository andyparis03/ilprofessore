// Player.js
import { CONFIG } from '../config.js';
import { BaseCharacter } from './BaseCharacter.js';

export class Player extends BaseCharacter {
    constructor(x, y, width, height, sprites, type) {
        super(x, y, width, height, sprites, type);
        this.lastUpdateTime = performance.now(); // Initialize the last update time
        this.updateSpeedMultiplier(); // Set the initial speed multiplier
    }

    // Determines the speed multiplier based on screen size
    determineSpeedMultiplier() {
        const screenWidth = window.innerWidth;
        if (screenWidth <= CONFIG.CANVAS.MOBILE_BREAKPOINT) {
            return CONFIG.PLAYER.SPEED_MULTIPLIERS.MOBILE; // Faster for small screens
        } else if (screenWidth <= 1024) {
            return CONFIG.PLAYER.SPEED_MULTIPLIERS.TABLET; // Medium speed for tablets
        }
        return CONFIG.PLAYER.SPEED_MULTIPLIERS.DESKTOP; // Slower for desktops
    }

    // Updates the speed multiplier and recalculates the speed
    updateSpeedMultiplier() {
        this.speedMultiplier = this.determineSpeedMultiplier(); // Update multiplier
        this.speed = CONFIG.PLAYER.SPEED * this.speedMultiplier; // Update speed
        console.log('Speed multiplier updated:', this.speedMultiplier, 'Speed:', this.speed);
    }

    // Updates the player's state each frame
    update(input, worldBounds) {
        const currentTime = performance.now();
        const deltaTime = (currentTime - this.lastUpdateTime) / 16.67; // Frame duration in ms
        this.lastUpdateTime = currentTime;

        this.updateBehavior(input, worldBounds, deltaTime);

        // Animation handling:
        if (!this.isIdle) {
            if (!this.lastAnimationUpdate || currentTime - this.lastAnimationUpdate >= this.animationSpeed) {
                this.frame = (this.frame + 1) % this.totalFrames;
                this.lastAnimationUpdate = currentTime;
            }
        } else {
            this.frame = 0;
            this.lastAnimationUpdate = 0;
        }
    }

    // Handles player movement and behavior based on input
    updateBehavior(input, worldBounds, deltaTime) {
        this.isIdle = !input.isMoving(); // Check if any keys are pressed

        if (!this.isIdle) {
            const adjustedSpeed = this.speed * deltaTime;

            const keys = input.keys;
            const startX = this.x;
            const startY = this.y;

            if (keys.ArrowRight) {
                this.x = Math.min(this.x + adjustedSpeed, worldBounds.width - this.width);
                this.direction = 'right';
            }
            if (keys.ArrowLeft) {
                this.x = Math.max(this.x - adjustedSpeed, 0);
                this.direction = 'left';
            }
            if (keys.ArrowDown) {
                this.y = Math.min(this.y + adjustedSpeed, worldBounds.height - this.height);
                this.direction = 'down';
            }
            if (keys.ArrowUp) {
                this.y = Math.max(this.y - adjustedSpeed, 0);
                this.direction = 'up';
            }

            // If no movement occurred, set idle
            if (this.x === startX && this.y === startY) {
                this.isIdle = true;
            }
        }
    }
}
