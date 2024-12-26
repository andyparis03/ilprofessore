// Diego.js
import { BaseCharacter } from './BaseCharacter.js';
import { CONFIG } from '../config.js';

export class Diego extends BaseCharacter {
    constructor(x, y, width, height, sprites, type) {
        // Using fast speed multiplier similar to Walter
        super(x, y, width, height, sprites, type, 3.5);
        
        const now = performance.now();
        
        // Initialize timers and movement variables (following Walter's pattern)
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
        
        this.isColliding = false;
        this.soundPlayed = false;
        this.isVisible = true;
        this.energyTaken = false;
        this.lastEnergyTime = now;
    }

    updateBehavior(player, worldBounds, deltaTime, input) {
        if (this.isPaused || !this.isVisible) return;

        const isCollidingNow = this.checkCollision(player);
        const currentTime = performance.now();

        // Handle collision with player
        if (isCollidingNow && !this.isColliding) {
            const gameInstance = window.gameInstance;
            
            // Check cooldown (5 seconds like Walter)
            if (!this.energyTaken || (currentTime - this.lastEnergyTime > 5000)) {
                if (gameInstance?.audioManager) {
                    gameInstance.audioManager.playSound('drink');
                }
                
                if (gameInstance?.scoreManager) {
                    // Decrease energy
                    gameInstance.scoreManager.increaseScore('energy', -30);
                    gameInstance.scoreManager.scoreAnimation.addAnimation(30, true);
                    
                    // Increase friendship
                    gameInstance.scoreManager.increaseScore('friendship', 30);
                    gameInstance.scoreManager.scoreAnimation.addAnimation(30);
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

        // Add unpredictable zigzag movement (similar to Walter's pattern)
        const timeSinceLastZigzag = currentTime - this.lastZigzag;
        const shouldZigzag = timeSinceLastZigzag > 400 && Math.random() < 0.5;

        if (shouldZigzag) {
            this.lastZigzag = currentTime;
            this.zigzagDirection *= -1;
            moveAngle += (Math.PI / 4) * this.zigzagDirection;
        } else if (timeSinceLastZigzag < 200) {
            moveAngle += (Math.PI / 4) * this.zigzagDirection;
        }

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
        }

        this.lastX = this.x;
        this.lastY = this.y;
    }

    updateDirection(dx, dy) {
        if (Math.abs(dx) > Math.abs(dy)) {
            this.direction = dx > 0 ? 'right' : 'left';
        } else {
            this.direction = dy > 0 ? 'down' : 'up';
        }
    }

    cleanup() {
        this.isColliding = false;
        this.soundPlayed = false;
        this.energyTaken = false;
        this.lastEnergyTime = performance.now();
        super.cleanup();
    }
}