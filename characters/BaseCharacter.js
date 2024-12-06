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

    // For NPCs: 'player' parameter is the Player character object.
    // For NPCs, 'player' is used to determine behavior. 'worldBounds' is the game area.
    update(player, worldBounds) {
        if (this.isCaught) return;

        const currentTime = performance.now();
        const deltaTime = (currentTime - this.lastUpdateTime) / 16.67;
        this.lastUpdateTime = currentTime;

        // NPC logic uses 'player' to decide how to move/behave
        this.updateBehavior(player, worldBounds, deltaTime);

        // Update animation frames if not idle
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

    // NPC subclasses implement their own behavior, using the 'player' parameter for logic
    updateBehavior(player, worldBounds, deltaTime) {
        // Default (idle)
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
