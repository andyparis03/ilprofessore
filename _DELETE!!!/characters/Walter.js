// Walter.js
import { BaseCharacter } from './BaseCharacter.js';

export class Walter extends BaseCharacter {
    constructor(x, y, width, height, sprites, type) {
        super(x, y, width, height, sprites, type, 3.0);
        
        const now = performance.now();
        
        this.moveTimer = now;
        this.changeDirectionInterval = 1200;
        this.lastNonIdleDirection = 'down';
        this.lastUpdateTime = now;
        this.frameTime = now;
        this.movementBuffer = { x: 0, y: 0 };
        this.velocity = { x: 0, y: 0 };
        this.lastX = x;
        this.lastY = y;
        this.stuckTimer = 0;
        this.directionChangeCount = 0;
        this.lastDirectionChange = now;
        this.lastZigzag = now;
        this.zigzagDirection = 1;

        this.frame = 0;
        this.isIdle = false;
        this.direction = 'down';
        
        this.isColliding = false;
        this.soundPlayed = false;
        this.isVisible = true;
        this.energyGiven = false;
        this.lastEnergyTime = now;
    }

    updateBehavior(player, worldBounds, deltaTime, input) {
        if (this.isPaused || !this.isVisible) return;

        const isCollidingNow = this.checkCollision(player);
        const currentTime = performance.now();

        // Handle initial collision
        if (isCollidingNow && !this.isColliding) {
            const gameInstance = window.gameInstance;
            
            // Check if enough time has passed since last energy given (5 seconds cooldown)
            if (!this.energyGiven || (currentTime - this.lastEnergyTime > 5000)) {
                // Play sound
                if (gameInstance?.audioManager) {
                    gameInstance.audioManager.playSound('walter_sound');
                }
                
                // Increase energy score directly through scoreManager
                if (gameInstance?.scoreManager) {
                    const currentEnergy = gameInstance.scoreManager.scores.energy;
                    gameInstance.scoreManager.scores.energy = Math.min(100, currentEnergy + 30);
                    // Add animation for energy increase
                    gameInstance.scoreManager.scoreAnimation.addAnimation(30);
                }
                
                this.energyGiven = true;
                this.lastEnergyTime = currentTime;
            }
            
            this.isColliding = true;
            this.soundPlayed = true;
        }

        // Reset collision state when not colliding
        if (!isCollidingNow && this.isColliding) {
            this.isColliding = false;
            this.soundPlayed = false;
            this.resetMovement();
        }

        // Continue with movement
        if (!this.isColliding) {
            const distance = Math.hypot(player.x - this.x, player.y - this.y);
            if (distance < 200) {
                this.runAwayFrom(player, deltaTime, worldBounds);
                this.isIdle = false;
            } else {
                this.moveRandomly(deltaTime, worldBounds);
            }
        }
    }

    runAwayFrom(player, deltaTime, worldBounds) {
        const dx = this.x - player.x;
        const dy = this.y - player.y;
        const angle = Math.atan2(dy, dx);
        
        const distance = Math.hypot(dx, dy);
        const speedMultiplier = distance < 100 ? 2.2 : 1.8;
        const adjustedSpeed = this.speed * deltaTime * speedMultiplier;

        const cornerBuffer = 50;
        const nearLeftWall = this.x < cornerBuffer;
        const nearRightWall = this.x > worldBounds.width - cornerBuffer;
        const nearTopWall = this.y < cornerBuffer;
        const nearBottomWall = this.y > worldBounds.height - cornerBuffer;

        let newX = this.x;
        let newY = this.y;

        const inCorner = (nearLeftWall && nearTopWall) || 
                        (nearLeftWall && nearBottomWall) ||
                        (nearRightWall && nearTopWall) ||
                        (nearRightWall && nearBottomWall);

        const currentTime = performance.now();

        // Base escape angle calculation
        let moveAngle = angle;

        // Add randomization to the base angle for unpredictability
        const randomAngleOffset = (Math.random() - 0.5) * (Math.PI / 6); // ±30 degrees
        moveAngle += randomAngleOffset;

        // Zigzag logic with increased frequency
        const timeSinceLastZigzag = currentTime - this.lastZigzag;
        const shouldStartNewZigzag = timeSinceLastZigzag > 600 && Math.random() < 0.4;

        if (shouldStartNewZigzag) {
            this.lastZigzag = currentTime;
            this.zigzagDirection *= -1;
            moveAngle += (Math.PI / 3) * this.zigzagDirection;
        } else if (timeSinceLastZigzag < 300) {
            moveAngle += (Math.PI / 3) * this.zigzagDirection;
        }

        if (inCorner) {
            const centerX = worldBounds.width / 2;
            const centerY = worldBounds.height / 2;
            moveAngle = Math.atan2(centerY - this.y, centerX - this.x);
        }

        newX = this.x + Math.cos(moveAngle) * adjustedSpeed;
        newY = this.y + Math.sin(moveAngle) * adjustedSpeed;

        const edgeBuffer = 30;
        if (this.x < edgeBuffer) newX += adjustedSpeed;
        if (this.x > worldBounds.width - edgeBuffer) newX -= adjustedSpeed;
        if (this.y < edgeBuffer) newY += adjustedSpeed;
        if (this.y > worldBounds.height - edgeBuffer) newY -= adjustedSpeed;

        this.x = Math.min(Math.max(newX, 20), worldBounds.width - 20);
        this.y = Math.min(Math.max(newY, 20), worldBounds.height - 20);

        const actualDX = this.x - this.lastX;
        const actualDY = this.y - this.lastY;
        if (Math.abs(actualDX) > 0.5 || Math.abs(actualDY) > 0.5) {
            this.updateDirection(actualDX, actualDY);
            this.isIdle = false;
            this.stuckTimer = 0;
        }

        this.lastX = this.x;
        this.lastY = this.y;
    }

    moveRandomly(deltaTime, worldBounds) {
        const adjustedSpeed = this.speed * deltaTime * 0.8;
        const cornerBuffer = 50;
        const oldX = this.x;
        const oldY = this.y;

        let newX = this.x;
        let newY = this.y;

        const now = performance.now();
        if (now - this.lastDirectionChange > 1500) {
            this.randomizeDirection(worldBounds);
            this.lastDirectionChange = now;
        }

        switch (this.direction) {
            case 'up':
                newY = this.y - adjustedSpeed;
                break;
            case 'down':
                newY = this.y + adjustedSpeed;
                break;
            case 'left':
                newX = this.x - adjustedSpeed;
                break;
            case 'right':
                newX = this.x + adjustedSpeed;
                break;
        }

        this.x = Math.min(Math.max(newX, cornerBuffer), worldBounds.width - cornerBuffer);
        this.y = Math.min(Math.max(newY, cornerBuffer), worldBounds.height - cornerBuffer);

        if (Math.abs(this.x - oldX) > 0.1 || Math.abs(this.y - oldY) > 0.1) {
            this.isIdle = false;
            this.lastNonIdleDirection = this.direction;
        }
    }

    resetMovement() {
        this.direction = this.lastNonIdleDirection;
        this.stuckTimer = 0;
        this.isIdle = false;
    }

    updateDirection(dx, dy) {
        const minThreshold = 0.5;
        
        if (Math.abs(dx) < minThreshold && Math.abs(dy) < minThreshold) {
            return;
        }

        if (Math.abs(dx) > Math.abs(dy) * 1.5) {
            this.direction = dx > 0 ? 'right' : 'left';
        } else if (Math.abs(dy) > Math.abs(dx) * 1.5) {
            this.direction = dy > 0 ? 'down' : 'up';
        }
        this.lastNonIdleDirection = this.direction;
    }

    randomizeDirection(worldBounds) {
        const directions = ['up', 'down', 'left', 'right'];
        const currentIndex = directions.indexOf(this.direction);
        
        if (currentIndex !== -1) {
            directions.splice(currentIndex, 1);
            const oppositeIndex = (currentIndex + 2) % 4;
            if (oppositeIndex < directions.length) {
                directions.splice(oppositeIndex, 1);
            }
        }
        
        const newDirection = directions[Math.floor(Math.random() * directions.length)];
        this.direction = newDirection;
        this.lastNonIdleDirection = newDirection;
        this.isIdle = false;
    }

    cleanup() {
        this.isColliding = false;
        this.soundPlayed = false;
        this.energyGiven = false;
        this.lastEnergyTime = performance.now();
        super.cleanup();
    }
}