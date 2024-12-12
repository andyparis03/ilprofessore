// Suina1.js
import { BaseCharacter } from './BaseCharacter.js';

export class Suina1 extends BaseCharacter {
    constructor(x, y, width, height, sprites, type) {
        super(x, y, width, height, sprites, type, 1.5);
        this.moveTimer = 0;
        this.changeDirectionInterval = 2500; // Increased interval for more stable movement
        this.lastNonIdleDirection = 'down';
        this.lastUpdateTime = performance.now();
        this.frameTime = performance.now();
        this.movementBuffer = { x: 0, y: 0 };
        this.velocity = { x: 0, y: 0 };
        this.lastX = x;
        this.lastY = y;
        this.frame = 0;
        this.isIdle = false;
        this.direction = 'down';
        this.stuckTimer = 0;
        this.directionChangeCount = 0;
        this.lastDirectionChange = performance.now();
    }

    updateBehavior(player, worldBounds, deltaTime) {
        const currentTime = performance.now();
        const maxDeltaTime = 32;
        const effectiveDeltaTime = Math.min(deltaTime, maxDeltaTime);

        // Check if enough time has passed since last direction change
        const timeSinceLastChange = currentTime - this.lastDirectionChange;
        
        // Only change direction if:
        // 1. Normal interval has passed OR
        // 2. We're stuck and minimum time has passed
        if (currentTime - this.moveTimer > this.changeDirectionInterval || 
            (this.stuckTimer > 500 && timeSinceLastChange > 1000)) {
            
            this.randomizeDirection(worldBounds);
            this.moveTimer = currentTime;
            this.lastDirectionChange = currentTime;
            this.stuckTimer = 0;
            this.directionChangeCount = 0;
        }

        const distance = Math.hypot(player.x - this.x, player.y - this.y);
        const startPos = { x: this.x, y: this.y };

        if (distance < 150) {
            this.runAwayFrom(player, effectiveDeltaTime, worldBounds);
            this.isIdle = false;
        } else {
            const moved = this.moveRandomly(effectiveDeltaTime, worldBounds);
            
            // If not moving, increment stuck timer
            if (!moved) {
                this.stuckTimer += deltaTime * 16.67;
            } else {
                this.stuckTimer = 0;
            }
        }

        // Update animation
        if (!this.isIdle && currentTime - this.lastUpdateTime >= this.animationSpeed) {
            this.frame = (this.frame + 1) % this.totalFrames;
            this.lastUpdateTime = currentTime;
        }
    }

    runAwayFrom(player, deltaTime, worldBounds) {
        const dx = this.x - player.x;
        const dy = this.y - player.y;
        const angle = Math.atan2(dy, dx);
        const adjustedSpeed = this.speed * deltaTime * 1.2; // Faster when escaping

        const oldX = this.x;
        const oldY = this.y;

        // Calculate target position with some randomness to avoid straight lines
        const randomOffset = Math.random() * 0.2 - 0.1; // Small random angle adjustment
        const finalAngle = angle + randomOffset;

        this.x = Math.min(Math.max(this.x + Math.cos(finalAngle) * adjustedSpeed, 0), 
                         worldBounds.width - this.width);
        this.y = Math.min(Math.max(this.y + Math.sin(finalAngle) * adjustedSpeed, 0), 
                         worldBounds.height - this.height);

        if (this.x !== oldX || this.y !== oldY) {
            this.updateDirection(this.x - oldX, this.y - oldY);
            this.isIdle = false;
            this.stuckTimer = 0;
        }
    }

    moveRandomly(deltaTime, worldBounds) {
        const adjustedSpeed = this.speed * deltaTime * 0.8; // Slightly slower for smoother movement
        const oldX = this.x;
        const oldY = this.y;

        switch (this.direction) {
            case 'up':
                this.y = Math.max(this.y - adjustedSpeed, 0);
                break;
            case 'down':
                this.y = Math.min(this.y + adjustedSpeed, worldBounds.height - this.height);
                break;
            case 'left':
                this.x = Math.max(this.x - adjustedSpeed, 0);
                break;
            case 'right':
                this.x = Math.min(this.x + adjustedSpeed, worldBounds.width - this.width);
                break;
        }

        const moved = (Math.abs(this.x - oldX) > 0.01 || Math.abs(this.y - oldY) > 0.01);
        
        if (moved) {
            this.isIdle = false;
            this.lastNonIdleDirection = this.direction;
            this.stuckTimer = 0;
        } else {
            this.stuckTimer += deltaTime * 16.67;
        }

        return moved;
    }

    randomizeDirection(worldBounds) {
        const { width, height } = worldBounds;
        const edgeBuffer = 50;
        const cornerBuffer = 100;
        
        const nearLeft = this.x < edgeBuffer;
        const nearRight = this.x > width - this.width - edgeBuffer;
        const nearTop = this.y < edgeBuffer;
        const nearBottom = this.y > height - this.height - edgeBuffer;

        let directions = ['up', 'down', 'left', 'right'];

        // Avoid rapid direction changes
        if (this.directionChangeCount < 3) {
            // Prefer to maintain current direction if not near edges
            if (!nearLeft && !nearRight && !nearTop && !nearBottom) {
                if (Math.random() < 0.7) { // 70% chance to keep current direction
                    return;
                }
            }
        }

        // Filter out directions based on position
        if (nearLeft) directions = directions.filter(d => d !== 'left');
        if (nearRight) directions = directions.filter(d => d !== 'right');
        if (nearTop) directions = directions.filter(d => d !== 'up');
        if (nearBottom) directions = directions.filter(d => d !== 'down');

        // Special handling for corners to ensure escape
        if (this.x < cornerBuffer && this.y < cornerBuffer) {
            directions = ['right', 'down'];
        } else if (this.x > width - cornerBuffer && this.y < cornerBuffer) {
            directions = ['left', 'down'];
        } else if (this.x < cornerBuffer && this.y > height - cornerBuffer) {
            directions = ['right', 'up'];
        } else if (this.x > width - cornerBuffer && this.y > height - cornerBuffer) {
            directions = ['left', 'up'];
        }

        // Ensure we have valid directions
        if (directions.length === 0) {
            directions = ['up', 'down', 'left', 'right'];
        }

        // Avoid choosing the opposite direction of current movement
        const opposites = { up: 'down', down: 'up', left: 'right', right: 'left' };
        if (this.direction && this.directionChangeCount < 2) {
            directions = directions.filter(d => d !== opposites[this.direction]);
        }

        const newDirection = directions[Math.floor(Math.random() * directions.length)];
        this.direction = newDirection;
        this.lastNonIdleDirection = newDirection;
        this.isIdle = false;
        this.directionChangeCount++;
    }

    updateDirection(dx, dy) {
        if (Math.abs(dx) > Math.abs(dy)) {
            this.direction = dx > 0 ? 'right' : 'left';
        } else {
            this.direction = dy > 0 ? 'down' : 'up';
        }
        this.lastNonIdleDirection = this.direction;
    }
}
