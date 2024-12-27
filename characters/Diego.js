// Diego.js
import { BaseCharacter } from './BaseCharacter.js';
import { CONFIG } from '../config.js';

export class Diego extends BaseCharacter {
    constructor(x, y, width, height, sprites, type) {
        super(x, y, width, height, sprites, type, 1.1);
        
        const now = performance.now();
        
        // Initialize timers and movement variables
        this.moveTimer = now;
        this.lastUpdateTime = now;
        this.frameTime = now;
        this.movementBuffer = { x: 0, y: 0 };
        this.velocity = { x: 0, y: 0 };
        this.lastX = x;
        this.lastY = y;
        this.lastDirectionChange = now;
        this.lastZigzag = now;
        this.zigzagDirection = 1;

        // State variables
        this.frame = 0;
        this.isIdle = false;
        this.direction = 'down';
        
        // Interaction states
        this.isColliding = false;
        this.soundPlayed = false;
        this.isVisible = true;
        this.energyTaken = false;
        this.lastEnergyTime = now;
        
        // Movement properties
        this.stuckTimer = 0;
        this.directionChangeCount = 0;
        this.cornerAvoidanceRadius = 100;
        this.zigzagInterval = 400;
        this.zigzagDuration = 200;
        this.cooldownDuration = 5000;
    }

    updateBehavior(player, worldBounds, deltaTime, input) {
        if (this.isPaused || !this.isVisible) return;

        const isCollidingNow = this.checkCollision(player);
        const currentTime = performance.now();

        // Handle collision with player
        if (isCollidingNow && !this.isColliding) {
            const gameInstance = window.gameInstance;
            
            // Check cooldown (5 seconds)
            if (!this.energyTaken || (currentTime - this.lastEnergyTime > this.cooldownDuration)) {
                // Play drink sound
                if (gameInstance?.audioManager) {
                    gameInstance.audioManager.playSound('drink');
                }
                
                // Decrease energy with animation
                if (gameInstance?.scoreManager) {
                    gameInstance.scoreManager.increaseScore('energy', -20);
                    gameInstance.scoreManager.scoreAnimation.addAnimation(20, true);
                }
                
                this.energyTaken = true;
                this.lastEnergyTime = currentTime;
            }
            
            this.isColliding = true;
            this.soundPlayed = true;
        }

        // Reset collision state when not colliding
        if (!isCollidingNow && this.isColliding) {
            this.isColliding = false;
            this.soundPlayed = false;
            this.energyTaken = false;
        }

        // Chase player with unpredictable movement
        if (!this.isColliding) {
            this.chasePlayer(player, deltaTime, worldBounds);
            this.isIdle = false;
        }
    }

    chasePlayer(player, deltaTime, worldBounds) {
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const angle = Math.atan2(dy, dx);
        
        const adjustedSpeed = this.speed * deltaTime * 1.8;

        const currentTime = performance.now();

        // Base chase angle
        let moveAngle = angle;

        // Add unpredictable zigzag movement
        const timeSinceLastZigzag = currentTime - this.lastZigzag;
        const shouldZigzag = timeSinceLastZigzag > this.zigzagInterval && Math.random() < 0.5;

        if (shouldZigzag) {
            this.lastZigzag = currentTime;
            this.zigzagDirection *= -1;
            moveAngle += (Math.PI / 4) * this.zigzagDirection;
        } else if (timeSinceLastZigzag < this.zigzagDuration) {
            moveAngle += (Math.PI / 4) * this.zigzagDirection;
        }

        // Apply corner avoidance
        moveAngle = this.adjustForCorners(moveAngle, worldBounds);

        // Calculate new position
        const newX = this.x + Math.cos(moveAngle) * adjustedSpeed;
        const newY = this.y + Math.sin(moveAngle) * adjustedSpeed;

        // Apply movement with world bounds check
        this.x = Math.min(Math.max(newX, 0), worldBounds.width - this.width);
        this.y = Math.min(Math.max(newY, 0), worldBounds.height - this.height);

        // Update direction based on movement
        const actualDX = this.x - this.lastX;
        const actualDY = this.y - this.lastY;
        if (Math.abs(actualDX) > 0.5 || Math.abs(actualDY) > 0.5) {
            this.updateDirection(actualDX, actualDY);
            this.stuckTimer = 0;
        } else {
            this.stuckTimer += deltaTime;
            if (this.stuckTimer > 1000) {
                this.randomizeDirection();
                this.stuckTimer = 0;
            }
        }

        this.lastX = this.x;
        this.lastY = this.y;
    }

    adjustForCorners(angle, worldBounds) {
        const nearLeftWall = this.x < this.cornerAvoidanceRadius;
        const nearRightWall = this.x > worldBounds.width - this.cornerAvoidanceRadius;
        const nearTopWall = this.y < this.cornerAvoidanceRadius;
        const nearBottomWall = this.y > worldBounds.height - this.cornerAvoidanceRadius;

        if (nearLeftWall && nearTopWall) {
            return Math.PI / 4; // 45 degrees
        } else if (nearRightWall && nearTopWall) {
            return (3 * Math.PI) / 4; // 135 degrees
        } else if (nearLeftWall && nearBottomWall) {
            return -Math.PI / 4; // -45 degrees
        } else if (nearRightWall && nearBottomWall) {
            return (-3 * Math.PI) / 4; // -135 degrees
        } else if (nearLeftWall) {
            return 0;
        } else if (nearRightWall) {
            return Math.PI;
        } else if (nearTopWall) {
            return Math.PI / 2;
        } else if (nearBottomWall) {
            return -Math.PI / 2;
        }

        return angle;
    }

    updateDirection(dx, dy) {
        if (Math.abs(dx) > Math.abs(dy)) {
            this.direction = dx > 0 ? 'right' : 'left';
        } else {
            this.direction = dy > 0 ? 'down' : 'up';
        }
    }

    randomizeDirection() {
        const directions = ['up', 'down', 'left', 'right'];
        this.direction = directions[Math.floor(Math.random() * directions.length)];
    }

    cleanup() {
        this.isColliding = false;
        this.soundPlayed = false;
        this.energyTaken = false;
        this.lastEnergyTime = performance.now();
        this.stuckTimer = 0;
        this.directionChangeCount = 0;
        super.cleanup();
    }

    pauseUpdates() {
        super.pauseUpdates();
        this.lastUpdateTime = performance.now();
        this.frameTime = performance.now();
    }

    resumeUpdates() {
        super.resumeUpdates();
        const now = performance.now();
        this.lastUpdateTime = now;
        this.frameTime = now;
        this.lastZigzag = now;
        this.lastEnergyTime = now;
    }
}