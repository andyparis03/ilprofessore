// Player.js
import { CONFIG } from '../config.js';
import { BaseCharacter } from './BaseCharacter.js';

export class Player extends BaseCharacter {
    constructor(x, y, width, height, sprites, type) {
        super(x, y, width, height, sprites, type);
        this.lastUpdateTime = performance.now();
        this.frameTime = performance.now();
        this.movementBuffer = { x: 0, y: 0 };
        this.velocity = { x: 0, y: 0 };
        this.lastX = x;
        this.lastY = y;
        this.currentInput = null;
        this.updateSpeedMultiplier();
        this.spriteState = {
            current: 'idle',
            frame: 0,
            lastUpdate: performance.now()
        };
    }

    forceStateUpdate() {
        const now = performance.now();
        this.lastUpdateTime = now;
        this.frameTime = now;
        this.lastAnimationUpdate = now;
        this.spriteState.lastUpdate = now;
        this.updateSpriteState(!this.isIdle);
    }

    updateSpriteState(isMoving) {
        const now = performance.now();
        const spriteType = isMoving ? 'walking' : 'idle';
        
        if (this.spriteState.current !== spriteType) {
            this.spriteState.current = spriteType;
            this.spriteState.frame = 0;
            this.spriteState.lastUpdate = now;
            this.frame = 0;
        }
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

    updateSpeedMultiplier() {
        this.speedMultiplier = this.determineSpeedMultiplier();
        this.speed = CONFIG.PLAYER.SPEED * this.speedMultiplier;
    }

    update(input, worldBounds) {
        const currentTime = performance.now();
        const maxDeltaTime = 32;
        const rawDeltaTime = (currentTime - this.lastUpdateTime) / 16.67;
        const deltaTime = Math.min(rawDeltaTime, maxDeltaTime);
        
        this.lastUpdateTime = currentTime;
        this.frameTime += deltaTime * 16.67;

        const wasMoving = !this.isIdle;
        this.updateBehavior(input, worldBounds, deltaTime);
        const isMoving = !this.isIdle;
        
        if (wasMoving !== isMoving) {
            this.updateSpriteState(isMoving);
        }

        if (isMoving) {
            if (currentTime - this.spriteState.lastUpdate >= this.animationSpeed) {
                this.frame = (this.frame + 1) % this.totalFrames;
                this.spriteState.lastUpdate = currentTime;
            }
        }
    }

    updateBehavior(input, worldBounds, deltaTime) {
        if (this.freeze) {
            this.velocity = { x: 0, y: 0 };
            this.movementBuffer = { x: 0, y: 0 };
            this.isIdle = true;
            return;
        }

        this.currentInput = { ...input.keys };
        
        const moving = input.isMoving();
        this.isIdle = !moving;

        if (moving) {
            const adjustedSpeed = this.speed * deltaTime;
            const keys = input.keys;
            
            this.velocity.x = 0;
            this.velocity.y = 0;

            if (keys.ArrowRight) {
                this.velocity.x = adjustedSpeed;
                this.direction = 'right';
            }
            if (keys.ArrowLeft) {
                this.velocity.x = -adjustedSpeed;
                this.direction = 'left';
            }
            if (keys.ArrowDown) {
                this.velocity.y = adjustedSpeed;
                this.direction = 'down';
            }
            if (keys.ArrowUp) {
                this.velocity.y = -adjustedSpeed;
                this.direction = 'up';
            }

            this.movementBuffer.x += this.velocity.x;
            this.movementBuffer.y += this.velocity.y;

            const newX = this.x + Math.round(this.movementBuffer.x);
            const newY = this.y + Math.round(this.movementBuffer.y);

            // Updated boundary checking for new world height
            this.x = Math.min(Math.max(newX, 0), worldBounds.width - this.width);
            this.y = Math.min(Math.max(newY, 0), worldBounds.height - this.height);

            this.movementBuffer.x -= Math.round(this.movementBuffer.x);
            this.movementBuffer.y -= Math.round(this.movementBuffer.y);

            this.lastX = this.x;
            this.lastY = this.y;
        } else {
            this.movementBuffer.x = 0;
            this.movementBuffer.y = 0;
        }
    }
}