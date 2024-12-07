// Player.js
import { CONFIG } from '../config.js';
import { BaseCharacter } from './BaseCharacter.js';

export class Player extends BaseCharacter {
    constructor(x, y, width, height, sprites, type) {
        super(x, y, width, height, sprites, type);
        this.speedMultiplier = this.determineSpeedMultiplier();
        this.speed = CONFIG.PLAYER.SPEED * this.speedMultiplier;
    }

    determineSpeedMultiplier() {
        const screenWidth = window.innerWidth;
        if (screenWidth <= CONFIG.CANVAS.MOBILE_BREAKPOINT) {
            return CONFIG.PLAYER.SPEED_MULTIPLIERS.MOBILE;
        } else if (screenWidth <= 1024) {
            return CONFIG.PLAYER.SPEED_MULTIPLIERS.TABLET;
        }
        return CONFIG.PLAYER.SPEED_MULTIPLIERS.DESKTOP;
    }

    // For the Player:
    // update(input, worldBounds) - we do NOT call super.update()
    // because super.update() expects a player parameter (for NPC logic)
    // Instead, we handle deltaTime and call updateBehavior(input) directly.
    update(input, worldBounds) {
        const currentTime = performance.now();
        const deltaTime = (currentTime - this.lastUpdateTime) / 16.67;
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

    // Player logic uses input instead of player object
    updateBehavior(input, worldBounds, deltaTime) {
        this.isIdle = !input.isMoving();

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
