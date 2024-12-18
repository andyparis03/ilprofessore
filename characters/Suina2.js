// Suina2.js
import { BaseCharacter } from './BaseCharacter.js';
import { CONFIG } from '../config.js';

export class Suina2 extends BaseCharacter {
    constructor(x, y, width, height, sprites, type) {
        super(x, y, width, height, sprites, type, 1.5);
        
        const now = performance.now();
        
        this.moveTimer = now;
        this.changeDirectionInterval = 2500;
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

        this.frame = 0;
        this.isIdle = false;
        this.direction = 'down';
        
        this.isColliding = false;
        this.isDisappearing = false;
        this.soundPlayed = false;
        this.isVisible = true;
        this.hasInteracted = false;
        this.disappearanceTimer = null;
        this.canInteract = false;
    }

    updateBehavior(player, worldBounds, deltaTime, input) {
        if (this.isPaused || !this.isVisible) {
            return;
        }

        const isCollidingNow = this.checkCollision(player);

        // First collision detection


    if (isCollidingNow && !this.isColliding && !this.isDisappearing && !this.disappearanceTimer) {
        // Change to suina1-attack.png sprite
        if (this.sprites.attack) {
            this.currentSprite = 'attack';
            this.activeSprite = this.sprites.attack;  // This will be suina1-attack.png
            this.frame = 0;
        }

        const gameInstance = window.gameInstance;
        if (!this.soundPlayed && gameInstance?.audioManager) {
            gameInstance.audioManager.playSound('suina_sound');
            this.soundPlayed = true;
        }

        this.canInteract = true;

        // Set disappearance timer for 2 seconds
        this.disappearanceTimer = setTimeout(() => {
            this.startDisappearance();
        }, 2000);

        this.isColliding = true;
        this.velocity = { x: 0, y: 0 };
        this.movementBuffer = { x: 0, y: 0 };
        this.isIdle = true;
    }


        // Handle button interactions within the 2-second window
        if (this.canInteract && !this.isDisappearing) {
            const gameInstance = window.gameInstance;
            
            if (input.keys.KeyB) {
                if (gameInstance?.audioManager) {
                    gameInstance.audioManager.playSound('professore_smack');
                    if (gameInstance.scoreManager) {
                        gameInstance.scoreManager.increaseScore('love', 3);
                    }
                }
                this.canInteract = false;
                if (this.disappearanceTimer) {
                    clearTimeout(this.disappearanceTimer);
                }
                this.startDisappearance();
            }
            else if (input.keys.KeyF) {
                if (gameInstance?.audioManager) {
                    gameInstance.audioManager.playSound('suina_fuck');
                    if (gameInstance.scoreManager) {
                        gameInstance.scoreManager.increaseScore('love', 6);
                    }
                }
                this.canInteract = false;
                if (this.disappearanceTimer) {
                    clearTimeout(this.disappearanceTimer);
                }
                this.startDisappearance();
            }
        }

        // Handle movement if not in collision or disappearing state
        if (!this.isColliding && !this.isDisappearing) {
            const distance = Math.hypot(player.x - this.x, player.y - this.y);
            if (distance < 150) {
                this.runAwayFrom(player, deltaTime, worldBounds);
                this.isIdle = false;
            } else {
                this.moveRandomly(deltaTime, worldBounds);
            }
        }
    }

    startDisappearance() {
        this.isDisappearing = true;
        this.isVisible = false;
        this.canInteract = false;
        
        // Clear any existing timer
        if (this.disappearanceTimer) {
            clearTimeout(this.disappearanceTimer);
            this.disappearanceTimer = null;
        }

        if (this.levelManager) {
            this.levelManager.handleCharacterDisappear(this);
        }
    }

    runAwayFrom(player, deltaTime, worldBounds) {
        const dx = this.x - player.x;
        const dy = this.y - player.y;
        const angle = Math.atan2(dy, dx);
        const adjustedSpeed = this.speed * deltaTime * 1.2;

        const oldX = this.x;
        const oldY = this.y;

        const randomOffset = Math.random() * 0.2 - 0.1;
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
        const adjustedSpeed = this.speed * deltaTime * 0.8;
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
            if (this.stuckTimer > 1000) {
                this.randomizeDirection(worldBounds);
                this.stuckTimer = 0;
            }
        }
    }

    updateDirection(dx, dy) {
        if (Math.abs(dx) > Math.abs(dy)) {
            this.direction = dx > 0 ? 'right' : 'left';
        } else {
            this.direction = dy > 0 ? 'down' : 'up';
        }
        this.lastNonIdleDirection = this.direction;
    }

    randomizeDirection(worldBounds) {
        const directions = ['up', 'down', 'left', 'right'];
        const newDirection = directions[Math.floor(Math.random() * directions.length)];
        this.direction = newDirection;
        this.lastNonIdleDirection = newDirection;
        this.isIdle = false;
    }

    cleanup() {
        if (this.disappearanceTimer) {
            clearTimeout(this.disappearanceTimer);
            this.disappearanceTimer = null;
        }
        this.canInteract = false;
        super.cleanup();
    }
}