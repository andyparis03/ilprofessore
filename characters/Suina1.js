// Suina1.js
import { BaseCharacter } from './BaseCharacter.js';

export class Suina1 extends BaseCharacter {
    constructor(x, y, width, height, sprites, type) {
        super(x, y, width, height, sprites, type, 1.5);
        
        // Initialize exactly like Player.js
        this.lastUpdateTime = performance.now();
        this.frameTime = performance.now();
        this.movementBuffer = { x: 0, y: 0 };
        this.velocity = { x: 0, y: 0 };
        this.lastX = x;
        this.lastY = y;
        this.currentInput = null;

        // Suina1 specific properties
        this.moveTimer = 0;
        this.changeDirectionInterval = 1000;
        this.lastNonIdleDirection = 'down';
    }

    update(player, worldBounds) {
        const currentTime = performance.now();
        
        // Limit deltaTime just like in Player.js
        const maxDeltaTime = 32;
        const rawDeltaTime = (currentTime - this.lastUpdateTime) / 16.67;
        const deltaTime = Math.min(rawDeltaTime, maxDeltaTime);
        
        this.lastUpdateTime = currentTime;
        this.frameTime += deltaTime * 16.67;

        // Store previous state for animation handling
        const wasMoving = !this.isIdle;
        
        // Update movement and state
        this.updateBehavior(player, worldBounds, deltaTime);

        // Handle animation timing with accumulated time
        if (!this.isIdle) {
            if (this.frameTime - this.lastAnimationUpdate >= this.animationSpeed) {
                this.frame = (this.frame + 1) % this.totalFrames;
                this.lastAnimationUpdate = this.frameTime;
            }
        } else {
            this.frame = 0;
        }
    }

    updateBehavior(player, worldBounds, deltaTime) {
        const currentTime = performance.now();
        
        // Update direction based on timer
        if (currentTime - this.moveTimer > this.changeDirectionInterval) {
            this.randomizeDirection(worldBounds);
            this.moveTimer = currentTime;
        }

        // Reset velocity
        this.velocity.x = 0;
        this.velocity.y = 0;

        // Calculate velocity based on player distance or random movement
        const distance = Math.hypot(player.x - this.x, player.y - this.y);
        if (distance < 150) {
            // Run away from player
            const dx = this.x - player.x;
            const dy = this.y - player.y;
            const angle = Math.atan2(dy, dx);
            const adjustedSpeed = this.speed * deltaTime;

            this.velocity.x = Math.cos(angle) * adjustedSpeed;
            this.velocity.y = Math.sin(angle) * adjustedSpeed;
            this.isIdle = false;
        } else {
            // Random movement
            const adjustedSpeed = this.speed * deltaTime;
            
            switch (this.direction) {
                case 'up':
                    this.velocity.y = -adjustedSpeed;
                    break;
                case 'down':
                    this.velocity.y = adjustedSpeed;
                    break;
                case 'left':
                    this.velocity.x = -adjustedSpeed;
                    break;
                case 'right':
                    this.velocity.x = adjustedSpeed;
                    break;
                case 'idle':
                    this.isIdle = true;
                    break;
            }
        }

        // Add to movement buffer
        this.movementBuffer.x += this.velocity.x;
        this.movementBuffer.y += this.velocity.y;

        // Apply whole pixel movements
        const newX = this.x + Math.round(this.movementBuffer.x);
        const newY = this.y + Math.round(this.movementBuffer.y);

        // Store old position
        const oldX = this.x;
        const oldY = this.y;

        // Clamp to world bounds
        this.x = Math.min(Math.max(newX, 0), worldBounds.width - this.width);
        this.y = Math.min(Math.max(newY, 0), worldBounds.height - this.height);

        // Remove used movement from buffer
        this.movementBuffer.x -= Math.round(this.movementBuffer.x);
        this.movementBuffer.y -= Math.round(this.movementBuffer.y);

        // Update movement state
        if (this.x === oldX && this.y === oldY) {
            if (!this.isIdle) {
                this.attemptMultipleMoves(deltaTime, worldBounds, 3);
            }
        } else {
            this.isIdle = false;
            if (Math.abs(this.x - oldX) > Math.abs(this.y - oldY)) {
                this.direction = this.x > oldX ? 'right' : 'left';
            } else {
                this.direction = this.y > oldY ? 'down' : 'up';
            }
            this.lastNonIdleDirection = this.direction;
        }

        // Store position for next frame
        this.lastX = this.x;
        this.lastY = this.y;
    }

    randomizeDirection(worldBounds) {
        const { width, height } = worldBounds;
        const edgeBuffer = 50;
        const cornerBuffer = 60;

        const nearLeft = this.x < edgeBuffer;
        const nearRight = this.x > width - this.width - edgeBuffer;
        const nearTop = this.y < edgeBuffer;
        const nearBottom = this.y > height - this.height - edgeBuffer;

        const inTopLeftCorner = (this.x < cornerBuffer && this.y < cornerBuffer);
        const inTopRightCorner = (this.x > width - cornerBuffer - this.width && this.y < cornerBuffer);
        const inBottomLeftCorner = (this.x < cornerBuffer && this.y > height - cornerBuffer - this.height);
        const inBottomRightCorner = (this.x > width - cornerBuffer - this.width && this.y > height - cornerBuffer - this.height);

        let directions;

        if (inTopLeftCorner) {
            directions = ['right', 'down'];
        } else if (inTopRightCorner) {
            directions = ['left', 'down'];
        } else if (inBottomLeftCorner) {
            directions = ['right', 'up'];
        } else if (inBottomRightCorner) {
            directions = ['left', 'up'];
        } else {
            directions = ['up', 'down', 'left', 'right', 'idle'];

            if (nearLeft) directions = directions.filter(d => d !== 'left');
            if (nearRight) directions = directions.filter(d => d !== 'right');
            if (nearTop) directions = directions.filter(d => d !== 'up');
            if (nearBottom) directions = directions.filter(d => d !== 'down');

            if (directions.length === 0 || (directions.length === 1 && directions[0] === 'idle')) {
                directions = ['idle', 'up', 'down', 'left', 'right'];
            }

            directions = this.filterDirectionsAvoidingForbiddenZones(directions, { width, height, cornerBuffer });
        }

        const chosen = directions[Math.floor(Math.random() * directions.length)];

        if (chosen === 'idle') {
            this.isIdle = true;
        } else {
            this.isIdle = false;
            this.direction = chosen;
            this.lastNonIdleDirection = chosen;
        }
    }

    filterDirectionsAvoidingForbiddenZones(directions, { width, height, cornerBuffer }) {
        return directions.filter(dir => {
            if (dir === 'idle') return true;
            
            let testX = this.x;
            let testY = this.y;
            const testStep = 10;

            switch (dir) {
                case 'up': testY -= testStep; break;
                case 'down': testY += testStep; break;
                case 'left': testX -= testStep; break;
                case 'right': testX += testStep; break;
            }

            const wouldBeInCorner = (
                (testX < cornerBuffer && testY < cornerBuffer) ||
                (testX > width - cornerBuffer - this.width && testY < cornerBuffer) ||
                (testX < cornerBuffer && testY > height - cornerBuffer - this.height) ||
                (testX > width - cornerBuffer - this.width && testY > height - cornerBuffer - this.height)
            );

            return !wouldBeInCorner;
        });
    }

    attemptMultipleMoves(deltaTime, worldBounds, attempts) {
        for (let i = 0; i < attempts; i++) {
            this.randomizeDirection(worldBounds);
            const startX = this.x;
            const startY = this.y;
            
            // Try movement in new direction
            this.updateBehavior({ x: startX + 1000 * (Math.random() - 0.5), 
                                y: startY + 1000 * (Math.random() - 0.5) }, 
                                worldBounds, deltaTime);
            
            if (this.x !== startX || this.y !== startY) {
                return true;
            }
        }
        return false;
    }
}