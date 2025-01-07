// BaseCharacter.js
import { CONFIG } from '../config.js';

export class BaseCharacter {
    constructor(x, y, width, height, sprites, type, speedMultiplier = 1) {
        console.log('BaseCharacter Constructor:', {
            x, y, width, height, type, speedMultiplier
        });

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
        this.lastAnimationUpdate = performance.now();
        this.isCaught = false;
        this.isPaused = false;

        console.log('BaseCharacter Initialized:', {
            speed: this.speed,
            direction: this.direction,
            isIdle: this.isIdle,
            totalFrames: this.totalFrames,
            isPaused: this.isPaused
        });
    }

update(player, worldBounds, input) {
        console.log('BaseCharacter Update ENTRY:', {
            type: this.type,
            isPaused: this.isPaused,
            isCaught: this.isCaught,
            isVisible: this.isVisible,
            position: { x: this.x, y: this.y }
        });

        if (this.isPaused || this.isCaught) {
            console.log('BaseCharacter Update BLOCKED by:', {
                isPaused: this.isPaused,
                isCaught: this.isCaught
            });
            return;
        }

        const currentTime = performance.now();
        const deltaTime = Math.min((currentTime - (this.lastUpdateTime || currentTime)) / 16.67, 32);
        this.lastUpdateTime = currentTime;

        console.log('BaseCharacter calling updateBehavior with:', {
            deltaTime,
            currentTime,
            lastUpdateTime: this.lastUpdateTime
        });

        this.updateBehavior(player, worldBounds, deltaTime, input);

        console.log('BaseCharacter after updateBehavior:', {
            isIdle: this.isIdle,
            frame: this.frame,
            position: { x: this.x, y: this.y }
        });

        if (!this.isIdle) {
            if (currentTime - this.lastAnimationUpdate >= this.animationSpeed) {
                this.frame = (this.frame + 1) % this.totalFrames;
                this.lastAnimationUpdate = currentTime;
                console.log('BaseCharacter animation updated:', {
                    frame: this.frame,
                    animationTime: currentTime - this.lastAnimationUpdate
                });
            }
        }
    }

    updateBehavior(player, worldBounds, deltaTime, input) {
        console.log('BaseCharacter updateBehavior called');
        this.isIdle = true;
    }

    checkCollision(other) {
        const collision = (
            this.x < other.x + other.width &&
            this.x + this.width > other.x &&
            this.y < other.y + other.height &&
            this.y + this.height > other.y
        );
        
        if (collision) {
            console.log('Collision detected:', {
                myPos: { x: this.x, y: this.y },
                otherPos: { x: other.x, y: other.y }
            });
        }
        
        return collision;
    }

    pauseUpdates() {
        console.log('Character paused');
        this.isPaused = true;
    }

    resumeUpdates() {
        console.log('Character resumed');
        this.isPaused = false;
        this.lastUpdateTime = performance.now();
        this.lastAnimationUpdate = performance.now();
    }

    cleanup() {
        console.log('Character cleanup');
        this.isPaused = false;
    }
}