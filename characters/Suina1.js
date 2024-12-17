// Suina1.js
import { BaseCharacter } from './BaseCharacter.js';
import { CONFIG } from '../config.js';

export class Suina1 extends BaseCharacter {
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

        this.isPaused = false;

        if (this.sprites && this.sprites.walking) {
            this.currentSprite = 'walking';
            this.activeSprite = this.sprites.walking;
        }
    }

    updateBehavior(player, worldBounds, deltaTime, input) {
        if (this.isPaused || !this.isVisible) {
            return;
        }

        const isCollidingNow = this.checkCollision(player);

        // First collision detection
        if (isCollidingNow && !this.isColliding && !this.isDisappearing && !this.disappearanceTimer) {
            // Change sprite and play sound
            if (this.sprites.attack) {
                this.currentSprite = 'attack';
                this.activeSprite = this.sprites.attack;
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
                        gameInstance.scoreManager.increaseScore('love', 2);
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
                        gameInstance.scoreManager.increaseScore('love', 5);
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

        // Schedule respawn
        const respawnDelay = 1000 + Math.random() * 1000;
        setTimeout(() => {
            this.respawn();
        }, respawnDelay);
    }

    respawn() {
        const padding = 100;
        
        // Calculate valid spawn area
        const minX = padding;
        const maxX = CONFIG.WORLD.WIDTH - this.width - padding;
        const minY = padding;
        const maxY = CONFIG.WORLD.HEIGHT - this.height - padding;
        
        // Generate random position within valid bounds
        this.x = Math.floor(minX + Math.random() * (maxX - minX));
        this.y = Math.floor(minY + Math.random() * (maxY - minY));
        
        // Reset all states
        this.isColliding = false;
        this.isDisappearing = false;
        this.soundPlayed = false;
        this.isVisible = true;
        this.hasInteracted = false;
        this.currentSprite = 'walking';
        this.activeSprite = this.sprites.walking;
        this.canInteract = false;
        
        if (this.disappearanceTimer) {
            clearTimeout(this.disappearanceTimer);
            this.disappearanceTimer = null;
        }

        // Reset movement parameters
        const now = performance.now();
        this.moveTimer = now;
        this.lastDirectionChange = now;
        this.stuckTimer = 0;
        this.directionChangeCount = 0;
        this.isIdle = false;
        this.velocity = { x: 0, y: 0 };
        this.movementBuffer = { x: 0, y: 0 };
        
        // Set random initial direction
        const directions = ['up', 'down', 'left', 'right'];
        this.direction = directions[Math.floor(Math.random() * directions.length)];
        this.lastNonIdleDirection = this.direction;
    }

    cleanup() {
        if (this.disappearanceTimer) {
            clearTimeout(this.disappearanceTimer);
            this.disappearanceTimer = null;
        }
        this.canInteract = false;
        super.cleanup();
    }

  


    resetCollisionState() {
        if (!this.isDisappearing) {
            this.isColliding = false;
            this.soundPlayed = false;
            this.currentSprite = 'walking';
            this.activeSprite = this.sprites.walking;
        }
    }

    handleMovement(player, worldBounds, deltaTime) {
        // Your existing movement code here...
        const currentTime = performance.now();
        const maxDeltaTime = 32;
        const effectiveDeltaTime = Math.min(deltaTime, maxDeltaTime);
        const distance = Math.hypot(player.x - this.x, player.y - this.y);

        if (distance < 150) {
            this.runAwayFrom(player, effectiveDeltaTime, worldBounds);
        } else {
            this.moveRandomly(effectiveDeltaTime, worldBounds);
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

    handleCollision(player, input) {
        const gameInstance = window.gameInstance;

        // Initial collision detection
        if (!this.isColliding && !this.isDisappearing && this.isVisible) {
            // Stop all movement and set initial states
            this.isColliding = true;
            this.velocity = { x: 0, y: 0 };
            this.movementBuffer = { x: 0, y: 0 };
            this.isIdle = true;
            this.buttonInteractionAvailable = true;

            // Play sound once
            if (!this.soundPlayed && gameInstance.audioManager) {
                gameInstance.audioManager.playSound('suina_sound');
                this.soundPlayed = true;
            }

            // Change to attack sprite
            if (this.sprites.attack) {
                this.currentSprite = 'attack';
                this.activeSprite = this.sprites.attack;
                this.frame = 0;
            }
        }

        // Handle button interactions
        if (this.buttonInteractionAvailable) {
            if (input.keys.KeyB || input.keys.KeyF) {
                if (input.keys.KeyB && gameInstance.audioManager) {
                    gameInstance.audioManager.playSound('professore_smack');
                    if (gameInstance.scoreManager) {
                        gameInstance.scoreManager.increaseScore('love', 2);
                    }
                } else if (input.keys.KeyF && gameInstance.audioManager) {
                    gameInstance.audioManager.playSound('suina_fuck');
                    if (gameInstance.scoreManager) {
                        gameInstance.scoreManager.increaseScore('love', 5);
                    }
                }

                if (this.sprites.attack) {
                    this.currentSprite = 'attack';
                    this.activeSprite = this.sprites.attack;
                    this.frame = 0;
                }

                this.hasInteracted = true;
                this.buttonInteractionAvailable = false;
                this.startDisappearance();
            }
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

        if (directions.length === 0) {
            directions = ['up', 'down', 'left', 'right'];
        }

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

    cleanup() {
        super.cleanup();
        
        if (!this.isDisappearing) {
            this.isColliding = false;
            this.buttonInteractionAvailable = false;
            this.soundPlayed = false;
            this.currentSprite = null;
            this.activeSprite = null;
            this.hasInteracted = false;
        }
    }

    pauseUpdates() {
        super.pauseUpdates();
    }

    resumeUpdates() {
        super.resumeUpdates();
        this.moveTimer = performance.now();
        this.lastDirectionChange = performance.now();
        this.lastUpdateTime = performance.now();
        this.frameTime = performance.now();
    }
}