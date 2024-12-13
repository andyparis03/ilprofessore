// Suina1.js
import { BaseCharacter } from './BaseCharacter.js';
import { CONFIG } from '../config.js';

export class Suina1 extends BaseCharacter {
    constructor(x, y, width, height, sprites, type) {
        super(x, y, width, height, sprites, type, 1.5);
        this.moveTimer = 0;
        this.changeDirectionInterval = 2500;
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

        // Collision and interaction states
        this.isColliding = false;
        this.collisionStartTime = null;
        this.isDisappearing = false;
        this.hasChangedSprite = false;
        this.buttonInteractionAvailable = false;
        this.soundPlayed = false;
        this.isVisible = true;
        this.respawnTimeout = null;
    }

    respawn() {
        // Generate random coordinates within the world bounds
        const padding = 50; // To avoid spawning too close to edges
        this.x = Math.random() * (CONFIG.WORLD.WIDTH - this.width - padding * 2) + padding;
        this.y = Math.random() * (CONFIG.WORLD.HEIGHT - this.height - padding * 2) + padding;
        
        // Reset all states
        this.isColliding = false;
        this.collisionStartTime = null;
        this.isDisappearing = false;
        this.hasChangedSprite = false;
        this.buttonInteractionAvailable = false;
        this.soundPlayed = false;
        this.isVisible = true;
        this.isCaught = false;
        this.currentSprite = null;
        this.activeSprite = null;

        // Reset movement parameters
        this.moveTimer = performance.now();
        this.lastDirectionChange = performance.now();
        this.stuckTimer = 0;
        this.directionChangeCount = 0;
        this.isIdle = false;
        
        // Set a random initial direction
        const directions = ['up', 'down', 'left', 'right'];
        this.direction = directions[Math.floor(Math.random() * directions.length)];
        this.lastNonIdleDirection = this.direction;
    }

    handleCollision(player, input) {
        const currentTime = performance.now();
        const gameInstance = window.gameInstance;

        // Initial collision detection
        if (!this.isColliding && !this.isDisappearing && this.isVisible) {
            this.isColliding = true;
            this.collisionStartTime = currentTime;
            this.hasChangedSprite = true;
            this.buttonInteractionAvailable = true;

            // Play initial collision sound
            if (!this.soundPlayed && gameInstance.audioManager) {
                gameInstance.audioManager.playSound('suina_sound');
                this.soundPlayed = true;
            }

            // Change to attack sprite
            if (this.sprites.attack) {
                this.currentSprite = 'attack';
                this.activeSprite = this.sprites.attack;

                // Set timer for disappearance after 2 seconds
                setTimeout(() => {
                    this.isVisible = false;
                    this.isDisappearing = true;
                    this.buttonInteractionAvailable = false;

                    // Set timer for respawn after 2 more seconds
                    this.respawnTimeout = setTimeout(() => {
                        this.respawn();
                    }, 2000);
                }, 2000);
            }
        }

        // Handle button interactions during the 2-second window
        if (this.buttonInteractionAvailable && currentTime - this.collisionStartTime <= 2000) {
            if (input.keys.KeyB) {
                if (gameInstance.audioManager) {
                    gameInstance.audioManager.playSound('professore_smack');
                }
                if (gameInstance.scoreManager) {
                    gameInstance.scoreManager.increaseScore('love', 2);
                }
                this.buttonInteractionAvailable = false;
            }
            else if (input.keys.KeyF) {
                if (gameInstance.audioManager) {
                    gameInstance.audioManager.playSound('suina_fuck');
                }
                if (gameInstance.scoreManager) {
                    gameInstance.scoreManager.increaseScore('love', 4);
                }
                this.buttonInteractionAvailable = false;
            }
        }
    }

    cleanup() {
        if (this.respawnTimeout) {
            clearTimeout(this.respawnTimeout);
        }
        this.isColliding = false;
        this.collisionStartTime = null;
        this.hasChangedSprite = false;
        this.buttonInteractionAvailable = false;
        this.soundPlayed = false;
    }

    updateBehavior(player, worldBounds, deltaTime, input) {
        if (!this.isVisible) return;

        // Check for collision with player
        if (this.checkCollision(player)) {
            this.handleCollision(player, input);
            return;
        }

        // Reset collision states if not colliding
        if (!this.checkCollision(player) && this.isColliding) {
            this.cleanup();
        }

        const currentTime = performance.now();
        const maxDeltaTime = 32;
        const effectiveDeltaTime = Math.min(deltaTime, maxDeltaTime);

        // Regular movement behavior when not colliding
        if (!this.isColliding) {
            const timeSinceLastChange = currentTime - this.lastDirectionChange;
            
            if (currentTime - this.moveTimer > this.changeDirectionInterval || 
                (this.stuckTimer > 500 && timeSinceLastChange > 1000)) {
                this.randomizeDirection(worldBounds);
                this.moveTimer = currentTime;
                this.lastDirectionChange = currentTime;
                this.stuckTimer = 0;
                this.directionChangeCount = 0;
            }

            const distance = Math.hypot(player.x - this.x, player.y - this.y);

            if (distance < 150) {
                this.runAwayFrom(player, effectiveDeltaTime, worldBounds);
                this.isIdle = false;
            } else {
                const moved = this.moveRandomly(effectiveDeltaTime, worldBounds);
                if (!moved) {
                    this.stuckTimer += deltaTime * 16.67;
                } else {
                    this.stuckTimer = 0;
                }
            }
        }

        // Update animation frame
        if (!this.isIdle && currentTime - this.lastUpdateTime >= this.animationSpeed) {
            this.frame = (this.frame + 1) % this.totalFrames;
            this.lastUpdateTime = currentTime;
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

        if (this.directionChangeCount < 3) {
            if (!nearLeft && !nearRight && !nearTop && !nearBottom) {
                if (Math.random() < 0.7) {
                    return;
                }
            }
        }

        // Filter out directions based on position
        if (nearLeft) directions = directions.filter(d => d !== 'left');
        if (nearRight) directions = directions.filter(d => d !== 'right');
        if (nearTop) directions = directions.filter(d => d !== 'up');
        if (nearBottom) directions = directions.filter(d => d !== 'down');

        // Special handling for corners
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