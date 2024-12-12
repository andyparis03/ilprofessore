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
    }

    update(player, worldBounds, input) {  // Add input parameter here
        if (this.isCaught) return;

        const currentTime = performance.now();
        const deltaTime = (currentTime - this.lastUpdateTime) / 16.67;
        this.lastUpdateTime = currentTime;

        // Pass input to updateBehavior
        this.updateBehavior(player, worldBounds, deltaTime, input);

        if (!this.isIdle) {
            if (currentTime - this.lastAnimationUpdate >= this.animationSpeed) {
                this.frame = (this.frame + 1) % this.totalFrames;
                this.lastAnimationUpdate = currentTime;
            }
        } else {
            this.frame = 0;
            this.lastAnimationUpdate = 0;
        }
    }

    updateBehavior(player, worldBounds, deltaTime, input) {  // Add input parameter here
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
}