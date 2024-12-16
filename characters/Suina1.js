// Suina1.js
import { BaseCharacter } from './BaseCharacter.js';
import { CONFIG } from '../config.js';

export class Suina1 extends BaseCharacter {
    constructor(x, y, width, height, sprites, type) {
        super(x, y, width, height, sprites, type, 1.5);
        
        // Movement states
        this.moveTimer = performance.now();
        this.changeDirectionInterval = 2500;
        this.lastNonIdleDirection = 'down';
        this.lastUpdateTime = performance.now();
        this.frameTime = performance.now();
        this.movementBuffer = { x: 0, y: 0 };
        this.velocity = { x: 0, y: 0 };
        this.lastX = x;
        this.lastY = y;
        this.stuckTimer = 0;
        this.directionChangeCount = 0;
        this.lastDirectionChange = performance.now();

        // Animation states
        this.frame = 0;
        this.isIdle = false;
        this.direction = 'down';
        
        // Collision and interaction states
        this.isColliding = false;
        this.collisionStartTime = null;
        this.isDisappearing = false;
        this.buttonInteractionAvailable = false;
        this.soundPlayed = false;
        this.isVisible = true;
        this.respawnTimeout = null;
        this.currentSprite = null;
        this.activeSprite = null;
    }

    handleCollision(player, input) {
        const currentTime = performance.now();
        const gameInstance = window.gameInstance;

        // Initial collision detection
        if (!this.isColliding && !this.isDisappearing && this.isVisible) {
            // Stop movement and set collision state
            this.isColliding = true;
            this.collisionStartTime = currentTime;
            this.buttonInteractionAvailable = true;

            // Play initial collision sound only once
            if (!this.soundPlayed && gameInstance.audioManager) {
                gameInstance.audioManager.playSound('suina_sound');
                this.soundPlayed = true;
            }

            // Change to attack sprite
            if (this.sprites.attack) {
                this.currentSprite = 'attack';
                this.activeSprite = this.sprites.attack;
            }

            // Set disappearance timer if no interaction
            setTimeout(() => {
                if (this.isVisible && !this.hasInteracted) {
                    this.isVisible = false;
                    this.isDisappearing = true;
                    this.buttonInteractionAvailable = false;

                    // Schedule respawn
                    this.respawnTimeout = setTimeout(() => {
                        this.respawn();
                    }, 2000);
                }
            }, 2000);
        }

        // Handle button interactions
        if (this.buttonInteractionAvailable) {
            if (input.keys.KeyB) {
                if (gameInstance.audioManager) {
                    gameInstance.audioManager.playSound('professore_smack');
                }
                if (gameInstance.scoreManager) {
                    gameInstance.scoreManager.increaseScore('love', 2);
                }
                this.startDisappearance();
            }
            else if (input.keys.KeyF) {
                if (gameInstance.audioManager) {
                    gameInstance.audioManager.playSound('suina_fuck');
                }
                if (gameInstance.scoreManager) {
                    gameInstance.scoreManager.increaseScore('love', 5);
                }
                this.startDisappearance();
            }
        }
    }

    startDisappearance() {
        this.buttonInteractionAvailable = false;
        this.isVisible = false;
        this.isDisappearing = true;
        this.hasInteracted = true;

        if (this.respawnTimeout) {
            clearTimeout(this.respawnTimeout);
        }

        this.respawnTimeout = setTimeout(() => {
            this.respawn();
        }, 2000);
    }

    respawn() {
        const padding = 50;
        this.x = Math.random() * (CONFIG.WORLD.WIDTH - this.width - padding * 2) + padding;
        this.y = Math.random() * (CONFIG.WORLD.HEIGHT - this.height - padding * 2) + padding;
        
        // Reset all states
        this.isColliding = false;
        this.collisionStartTime = null;
        this.isDisappearing = false;
        this.buttonInteractionAvailable = false;
        this.soundPlayed = false;
        this.isVisible = true;
        this.hasInteracted = false;
        this.currentSprite = null;
        this.activeSprite = null;

        // Reset movement parameters
        this.moveTimer = performance.now();
        this.lastDirectionChange = performance.now();
        this.stuckTimer = 0;
        this.directionChangeCount = 0;
        this.isIdle = false;
        
        // Set random initial direction
        const directions = ['up', 'down', 'left', 'right'];
        this.direction = directions[Math.floor(Math.random() * directions.length)];
        this.lastNonIdleDirection = this.direction;
    }

    cleanup() {
        // Clear any pending timeouts
        if (this.respawnTimeout) {
            clearTimeout(this.respawnTimeout);
            this.respawnTimeout = null;
        }
        
        // Only perform cleanup if we're not in the middle of disappearing
        if (!this.isDisappearing) {
            this.isColliding = false;
            this.collisionStartTime = null;
            this.buttonInteractionAvailable = false;
            this.soundPlayed = false;
            this.currentSprite = null;
            this.activeSprite = null;
            
            // Reset interaction states
            this.hasInteracted = false;
            
            // Ensure sprite reset only happens when appropriate
            if (this.sprites && this.sprites.walking) {
                this.currentSprite = 'walking';
                this.activeSprite = this.sprites.walking;
            }
        }
    }

    updateBehavior(player, worldBounds, deltaTime, input) {
        if (!this.isVisible) return;

        const isCollidingNow = this.checkCollision(player);

        // Handle collision state changes
        if (isCollidingNow && !this.isColliding) {
            // New collision
            this.handleCollision(player, input);
            return; // Stop all movement when starting collision
        } else if (isCollidingNow && this.isColliding) {
            // Ongoing collision
            this.handleCollision(player, input);
            return; // Maintain collision state
        } else if (!isCollidingNow && this.isColliding) {
            // Just stopped colliding
            const timeSinceCollisionStart = this.collisionStartTime ? 
                performance.now() - this.collisionStartTime : 0;
            
            // Only cleanup if we're not in the disappearing animation window
            if (timeSinceCollisionStart > 2000 || !this.collisionStartTime) {
                this.cleanup();
            }
        }

        // Only process movement if not in collision state
        if (!this.isColliding) {
            const currentTime = performance.now();
            const maxDeltaTime = 32;
            const effectiveDeltaTime = Math.min(deltaTime, maxDeltaTime);

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

            // Update animation frame only when moving and not colliding
            if (!this.isIdle && currentTime - this.lastUpdateTime >= this.animationSpeed) {
                this.frame = (this.frame + 1) % this.totalFrames;
                this.lastUpdateTime = currentTime;
            }
        }
    }

    // Rest of the movement methods remain unchanged...
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