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
        
        // Update sprite state based on current movement
        this.updateSpriteState(!this.isIdle);
    }

    updateSpriteState(isMoving) {
        const now = performance.now();
        const spriteType = isMoving ? 'walking' : 'idle';
        
        // Only update if state actually changed
        if (this.spriteState.current !== spriteType) {
            this.spriteState.current = spriteType;
            this.spriteState.frame = 0;
            this.spriteState.lastUpdate = now;
            this.frame = 0; // Reset animation frame
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
        
        // Limit deltaTime to prevent extreme values
        const maxDeltaTime = 32;
        const rawDeltaTime = (currentTime - this.lastUpdateTime) / 16.67;
        const deltaTime = Math.min(rawDeltaTime, maxDeltaTime);
        
        this.lastUpdateTime = currentTime;
        this.frameTime += deltaTime * 16.67;

        // Store previous state
        const wasMoving = !this.isIdle;
        
        // Update movement and state
        this.updateBehavior(input, worldBounds, deltaTime);
        
        // Check if movement state changed
        const isMoving = !this.isIdle;
        if (wasMoving !== isMoving) {
            this.updateSpriteState(isMoving);
        }

        // Update animation
        if (isMoving) {
            if (currentTime - this.spriteState.lastUpdate >= this.animationSpeed) {
                this.frame = (this.frame + 1) % this.totalFrames;
                this.spriteState.lastUpdate = currentTime;
            }
        }
    }

    updateBehavior(input, worldBounds, deltaTime) {
        // Store current input for state preservation
        this.currentInput = { ...input.keys };
        
        const moving = input.isMoving();
        this.isIdle = !moving;

        if (moving) {
            const adjustedSpeed = this.speed * deltaTime;
            const keys = input.keys;
            
            // Reset velocity
            this.velocity.x = 0;
            this.velocity.y = 0;

            // Calculate velocity based on input
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

            // Add to movement buffer
            this.movementBuffer.x += this.velocity.x;
            this.movementBuffer.y += this.velocity.y;

            // Apply whole pixel movements
            const newX = this.x + Math.round(this.movementBuffer.x);
            const newY = this.y + Math.round(this.movementBuffer.y);

            // Clamp to world bounds
            this.x = Math.min(Math.max(newX, 0), worldBounds.width - this.width);
            this.y = Math.min(Math.max(newY, 0), worldBounds.height - this.height);

            // Remove used movement from buffer
            this.movementBuffer.x -= Math.round(this.movementBuffer.x);
            this.movementBuffer.y -= Math.round(this.movementBuffer.y);

            // Update last position
            this.lastX = this.x;
            this.lastY = this.y;
        } else {
            // Reset movement buffer when idle
            this.movementBuffer.x = 0;
            this.movementBuffer.y = 0;
        }
    }
}