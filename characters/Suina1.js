// Suina1.js
import { BaseCharacter } from './BaseCharacter.js';
import { CONFIG } from '../config.js';

export class Suina1 extends BaseCharacter {
constructor(x, y, width, height, sprites, type) {
        super(x, y, width, height, sprites, type, 1.5);
        
        console.log('Suina1 Constructor - Start');
        
        // Initialize timestamps
        const now = performance.now();
        
        // Movement states with proper initialization
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

        // Animation states
        this.frame = 0;
        this.isIdle = false;
        this.direction = 'down';
        
        // Collision and interaction states
        this.isColliding = false;
        this.isDisappearing = false;
        this.buttonInteractionAvailable = false;
        this.soundPlayed = false;
        this.isVisible = true;
        this.hasInteracted = false;

        // Explicitly ensure not paused
        this.isPaused = false;

        // Set initial sprite state
        if (this.sprites && this.sprites.walking) {
            this.currentSprite = 'walking';
            this.activeSprite = this.sprites.walking;
        }

        console.log('Suina1 Constructor - Complete:', {
            position: { x: this.x, y: this.y },
            isPaused: this.isPaused,
            isIdle: this.isIdle,
            currentSprite: this.currentSprite ? 'set' : 'not set'
        });
    }

    updateBehavior(player, worldBounds, deltaTime, input) {
        console.log('UpdateBehavior Called:', {
            isPaused: this.isPaused,
            isVisible: this.isVisible,
            isColliding: this.isColliding,
            isDisappearing: this.isDisappearing,
            currentPosition: { x: this.x, y: this.y }
        });

        if (this.isPaused || !this.isVisible) {
            console.log('Early return due to:', { isPaused: this.isPaused, isVisible: this.isVisible });
            return;
        }

        // Check for collision with player
        if (this.checkCollision(player)) {
            console.log('Collision detected with player');
            this.handleCollision(player, input);
            return;
        }

        // Only reset states if we've moved away from collision and aren't disappearing
        if (!this.checkCollision(player) && !this.isDisappearing) {
            if (this.isColliding) {
                console.log('Cleaning up after collision');
                this.cleanup();
            }
        }

        // If in collision or disappearing state, stop all movement
        if (this.isColliding || this.isDisappearing) {
            console.log('Stopping movement due to:', { isColliding: this.isColliding, isDisappearing: this.isDisappearing });
            this.velocity = { x: 0, y: 0 };
            this.movementBuffer = { x: 0, y: 0 };
            return;
        }

        // Process movement logic
        const currentTime = performance.now();
        const maxDeltaTime = 32;
        const effectiveDeltaTime = Math.min(deltaTime, maxDeltaTime);

        const timeSinceLastChange = currentTime - this.lastDirectionChange;
        
        console.log('Movement timing:', {
            currentTime,
            timeSinceLastChange,
            moveTimer: this.moveTimer,
            changeInterval: this.changeDirectionInterval
        });

        if (currentTime - this.moveTimer > this.changeDirectionInterval || 
            (this.stuckTimer > 500 && timeSinceLastChange > 1000)) {
            console.log('Changing direction');
            this.randomizeDirection(worldBounds);
            this.moveTimer = currentTime;
            this.lastDirectionChange = currentTime;
            this.stuckTimer = 0;
            this.directionChangeCount = 0;
        }

        const distance = Math.hypot(player.x - this.x, player.y - this.y);
        console.log('Distance to player:', distance);

        if (distance < 150) {
            console.log('Running away from player');
            this.runAwayFrom(player, effectiveDeltaTime, worldBounds);
            this.isIdle = false;
        } else {
            console.log('Moving randomly');
            const moved = this.moveRandomly(effectiveDeltaTime, worldBounds);
            if (!moved) {
                this.stuckTimer += deltaTime * 16.67;
                console.log('Stuck timer increased:', this.stuckTimer);
            } else {
                this.stuckTimer = 0;
            }
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
            // 1. Stop all movement and set initial states
            this.isColliding = true;
            this.velocity = { x: 0, y: 0 };
            this.movementBuffer = { x: 0, y: 0 };
            this.isIdle = true;
            this.buttonInteractionAvailable = true;

            // 2. Play sound once
            if (!this.soundPlayed && gameInstance.audioManager) {
                gameInstance.audioManager.playSound('suina_sound');
                this.soundPlayed = true;
            }

            // 3. Change to attack sprite
            if (this.sprites.attack) {
                this.currentSprite = 'attack';
                this.activeSprite = this.sprites.attack;
                this.frame = 0;
            }
        }

        // 4. Handle button interactions (B or F)
        if (this.buttonInteractionAvailable) {
            if (input.keys.KeyB || input.keys.KeyF) {
                // 5. Play appropriate sound and update score
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

                // 6. Change sprite again to attack
                if (this.sprites.attack) {
                    this.currentSprite = 'attack';
                    this.activeSprite = this.sprites.attack;
                    this.frame = 0;
                }

                // 7. Trigger disappearance
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

        console.log('MoveRandomly:', {
            direction: this.direction,
            adjustedSpeed,
            currentPos: { x: this.x, y: this.y },
            speed: this.speed,
            deltaTime
        });

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
        console.log('Movement result:', {
            moved,
            newPos: { x: this.x, y: this.y },
            delta: { x: this.x - oldX, y: this.y - oldY }
        });

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