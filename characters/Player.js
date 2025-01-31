// Player.js
import { CONFIG } from '../config.js';
import { BaseCharacter } from './BaseCharacter.js';

export class Player extends BaseCharacter {
    constructor(x, y, width, height, sprites, type) {
        super(x, y, width, height, sprites, type);
        this.lastUpdateTime = performance.now();
        this.frameTime = performance.now();
        this.movementBuffer = { x: 0, y: 0 };
        this.velocity = { x: 0, y: 0 };
        this.lastX = x;
        this.lastY = y;
        this.currentInput = null;
        this.updateSpeedMultiplier();
        this.spriteState = {
            current: 'idle',
            frame: 0,
            lastUpdate: performance.now()
        };
        this.isPunching = false;
        this.punchTimer = null;
        this.lastPunchTime = 0;
    }

    forceStateUpdate() {
        const now = performance.now();
        this.lastUpdateTime = now;
        this.frameTime = now;
        this.lastAnimationUpdate = now;
        this.spriteState.lastUpdate = now;
        
        // Update sprite state based on current movement
        this.updateSpriteState(!this.isIdle);
    }

    updateSpriteState(isMoving) {
        const now = performance.now();
        const spriteType = isMoving ? 'walking' : 'idle';
        
        // Only update if state actually changed
        if (this.spriteState.current !== spriteType) {
            this.spriteState.current = spriteType;
            this.spriteState.frame = 0;
            this.spriteState.lastUpdate = now;
            this.frame = 0; // Reset animation frame
        }
    }

    determineSpeedMultiplier() {
        const screenWidth = window.innerWidth;
        if (screenWidth <= CONFIG.CANVAS.MOBILE_BREAKPOINT) {
            return CONFIG.PLAYER.SPEED_MULTIPLIERS.MOBILE;
        } else if (screenWidth <= 1024) {
            return CONFIG.PLAYER.SPEED_MULTIPLIERS.TABLET;
        }
        return CONFIG.PLAYER.SPEED_MULTIPLIERS.DESKTOP;
    }

    updateSpeedMultiplier() {
        this.speedMultiplier = this.determineSpeedMultiplier();
        this.speed = CONFIG.PLAYER.SPEED * this.speedMultiplier;
    }

    update(input, worldBounds) {
        const currentTime = performance.now();
        
        // Limit deltaTime to prevent extreme values
        const maxDeltaTime = 32;
        const rawDeltaTime = (currentTime - this.lastUpdateTime) / 16.67;
        const deltaTime = Math.min(rawDeltaTime, maxDeltaTime);
        
        this.lastUpdateTime = currentTime;
        this.frameTime += deltaTime * 16.67;

        // Store previous state
        const wasMoving = !this.isIdle;
        
        // Update movement and state
        this.updateBehavior(input, worldBounds, deltaTime);
        
        // Check if movement state changed
        const isMoving = !this.isIdle;
        if (wasMoving !== isMoving) {
            this.updateSpriteState(isMoving);
        }

        // Update animation
        if (isMoving) {
            if (currentTime - this.spriteState.lastUpdate >= this.animationSpeed) {
                this.frame = (this.frame + 1) % this.totalFrames;
                this.spriteState.lastUpdate = currentTime;
            }
        }
    }

    updateBehavior(input, worldBounds, deltaTime) {
        if (this.freeze) {
            this.velocity = { x: 0, y: 0 };
            this.movementBuffer = { x: 0, y: 0 };
            this.isIdle = true;
            return;
        }

        this.currentInput = { ...input.keys };
        
        // Handle punch action
        const currentTime = performance.now();
        if (input.keys.KeyP && !this.isPunching && currentTime - this.lastPunchTime > 2000) {
            this.isPunching = true;
            this.lastPunchTime = currentTime;
            
            // Change sprite based on last direction
            if (this.direction === 'left' || this.lastNonIdleDirection === 'left') {
                this.currentSprite = 'punchL';
                this.activeSprite = this.sprites.punchL;
            } else {
                this.currentSprite = 'punchR';
                this.activeSprite = this.sprites.punchR;
            }

            // Play punch sound
            const gameInstance = window.gameInstance;
            if (gameInstance?.audioManager) {
                gameInstance.audioManager.playSound('prof-punch');
            }

            // Reset punch state after 2 seconds
            this.punchTimer = setTimeout(() => {
                this.isPunching = false;
                this.currentSprite = this.isIdle ? 'idle' : 'walking';
                this.activeSprite = this.sprites[this.currentSprite];
            }, 2000);
        }

        // Handle movement only if not punching
        if (!this.isPunching) {
            const movementVector = input.getMovementVector();
            this.isIdle = movementVector.x === 0 && movementVector.y === 0;

            if (!this.isIdle) {
                const adjustedSpeed = this.speed * deltaTime;
                
                // Calculate velocity based on movement vector
                this.velocity.x = movementVector.x * adjustedSpeed;
                this.velocity.y = movementVector.y * adjustedSpeed;

                // Update direction based on movement
                if (Math.abs(movementVector.x) > Math.abs(movementVector.y)) {
                    this.direction = movementVector.x > 0 ? 'right' : 'left';
                    this.lastNonIdleDirection = this.direction;
                } else {
                    this.direction = movementVector.y > 0 ? 'down' : 'up';
                }

                // Add to movement buffer
                this.movementBuffer.x += this.velocity.x;
                this.movementBuffer.y += this.velocity.y;

                // Apply whole pixel movements
                const newX = this.x + Math.round(this.movementBuffer.x);
                const newY = this.y + Math.round(this.movementBuffer.y);

                // Clamp to world bounds
                this.x = Math.min(Math.max(newX, 0), worldBounds.width - this.width);
                this.y = Math.min(Math.max(newY, 0), worldBounds.height - this.height);

                // Remove used movement from buffer
                this.movementBuffer.x -= Math.round(this.movementBuffer.x);
                this.movementBuffer.y -= Math.round(this.movementBuffer.y);

                // Update last position
                this.lastX = this.x;
                this.lastY = this.y;
            } else {
                // Reset movement buffer when idle
                this.movementBuffer.x = 0;
                this.movementBuffer.y = 0;
            }
        }

        // Check for collision with suina evil when punching
        if (this.isPunching) {
            const gameInstance = window.gameInstance;
            if (gameInstance?.levelManager?.characters) {
                gameInstance.levelManager.characters.forEach(character => {
                    if (character.type === 'suinaevil' && this.checkCollision(character)) {
                        // Play punch hit sound
                        if (gameInstance.audioManager) {
                            gameInstance.audioManager.playSound('prof-punch');
                        }

                        // Change suina evil sprite and play sound
                        character.currentSprite = 'punch';
                        character.activeSprite = character.sprites.punch;
                        
                        setTimeout(() => {
                            if (gameInstance.audioManager) {
                                gameInstance.audioManager.playSound('urlo');
                            }
                            // Remove the suina evil
                            character.isVisible = false;
                            // Spawn a new regular suina
                            gameInstance.levelManager.spawnCharacter('suina1');
                        }, 2000);
                    }
                });
            }
        }
    }

    cleanup() {
        if (this.punchTimer) {
            clearTimeout(this.punchTimer);
            this.punchTimer = null;
        }
        this.isPunching = false;
        super.cleanup();
    }
}