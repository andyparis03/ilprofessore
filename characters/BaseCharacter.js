// BaseCharacter.js
import { CONFIG } from '../config.js';

export class BaseCharacter {
    constructor(x, y, width, height, sprites, type, speedMultiplier = 1) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.sprites = sprites;
        this.type = type.toLowerCase();

        // Movement and animation
        this.speed = CONFIG.PLAYER.SPEED * speedMultiplier;
        this.direction = 'down';
        this.isIdle = true;
        this.frame = 0;
        this.totalFrames = CONFIG.PLAYER.TOTAL_FRAMES;
        this.animationSpeed = 100;
        this.lastAnimationUpdate = 0;
        this.isCaught = false;
        this.lastUpdateTime = performance.now();
        
        // Add pause state
        this.isPaused = false;
    }

    pauseUpdates() {
        this.isPaused = true;
    }

    resumeUpdates() {
        this.isPaused = false;
        // Reset animation timing to prevent jumps
        this.lastUpdateTime = performance.now();
        this.lastAnimationUpdate = performance.now();
    }

    update(player, worldBounds, input) {
        if (this.isPaused || this.isCaught) return;

        const currentTime = performance.now();
        const deltaTime = (currentTime - this.lastUpdateTime) / 16.67;
        this.lastUpdateTime = currentTime;

        this.updateBehavior(player, worldBounds, deltaTime, input);

        if (!this.isIdle) {
            if (currentTime - this.lastAnimationUpdate >= this.animationSpeed) {
                this.frame = (this.frame + 1) % this.totalFrames;
                this.lastAnimationUpdate = currentTime;
            }
        } else {
            this.frame = 0;
            this.lastAnimationUpdate = currentTime;
        }
    }

    updateBehavior(player, worldBounds, deltaTime, input) {
        if (this.isPaused) return;
        this.isIdle = true;
    }

    checkCollision(other) {
        return (
            this.x < other.x + other.width &&
            this.x + this.width > other.x &&
            this.y < other.y + other.height &&
            this.y + this.height > other.y
        );
    }

    cleanup() {
        // Base cleanup method for all characters
        this.isPaused = false;
    }
}