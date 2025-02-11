// Player.js
import { CONFIG } from '../config.js';
import { BaseCharacter } from './BaseCharacter.js';

export class Player extends BaseCharacter {
    constructor(x, y, width, height, sprites, type) {
        super(x, y, width, height, sprites, type);
        
        // Preserve exact same property initialization order for compatibility
        this.lastUpdateTime = performance.now();
        this.frameTime = performance.now();
        this.movementBuffer = { x: 0, y: 0 };
        this.velocity = { x: 0, y: 0 };
        this.lastX = x;
        this.lastY = y;
        this.currentInput = null;
        this.updateSpeedMultiplier();
        
        // Animation state - keep original structure
        this.spriteState = {
            current: 'idle',
            frame: 0,
            lastUpdate: performance.now()
        };
        
        // Combat state - maintain original properties
        this.isPunching = false;
        this.punchTimer = null;
        this.lastPunchTime = 0;
        this.lastNonIdleDirection = this.direction;
    }

    forceStateUpdate() {
        const now = performance.now();
        this.lastUpdateTime = now;
        this.frameTime = now;
        this.lastAnimationUpdate = now;
        this.spriteState.lastUpdate = now;
        
        this.updateSpriteState(!this.isIdle);
    }

    updateSpriteState(isMoving) {
        const now = performance.now();
        const spriteType = isMoving ? 'walking' : 'idle';
        
        if (this.spriteState.current !== spriteType) {
            this.spriteState.current = spriteType;
            this.spriteState.frame = 0;
            this.spriteState.lastUpdate = now;
            this.frame = 0;
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
        
        const maxDeltaTime = 32;
        const rawDeltaTime = (currentTime - this.lastUpdateTime) / 16.67;
        const deltaTime = Math.min(rawDeltaTime, maxDeltaTime);
        
        this.lastUpdateTime = currentTime;
        this.frameTime += deltaTime * 16.67;

        const wasMoving = !this.isIdle;
        
        this.updateBehavior(input, worldBounds, deltaTime);
        
        const isMoving = !this.isIdle;
        if (wasMoving !== isMoving) {
            this.updateSpriteState(isMoving);
        }

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
        
        // Handle punch action with original timing
        if (input.keys.KeyP && !this.isPunching && performance.now() - this.lastPunchTime > 100) {
            this.handlePunch();
        }

        // Only handle movement if not punching - maintain original behavior
        if (!this.isPunching) {
            this.handleMovement(input, worldBounds, deltaTime);
        }

        // Keep original combat collision detection
        if (this.isPunching) {
            this.handleCombatCollision();
        }
    }

    handlePunch() {
        this.isPunching = true;
        this.lastPunchTime = performance.now();
        
        // Maintain original sprite logic
        if (this.direction === 'left' || this.lastNonIdleDirection === 'left') {
            this.currentSprite = 'punchL';
            this.activeSprite = this.sprites.punchL;
        } else {
            this.currentSprite = 'punchR';
            this.activeSprite = this.sprites.punchR;
        }

        // Play sound exactly as before
        const gameInstance = window.gameInstance;
        if (gameInstance?.audioManager) {
            gameInstance.audioManager.playSound('professore_punch');
        }

        // Keep original timer logic
        if (this.punchTimer) {
            clearTimeout(this.punchTimer);
        }

        this.punchTimer = setTimeout(() => {
            this.isPunching = false;
            this.currentSprite = this.isIdle ? 'idle' : 'walking';
            this.activeSprite = this.sprites[this.currentSprite];
        }, 100);
    }

    handleMovement(input, worldBounds, deltaTime) {
        const movementVector = input.getMovementVector();
        this.isIdle = movementVector.x === 0 && movementVector.y === 0;

        if (!this.isIdle) {
            const adjustedSpeed = this.speed * deltaTime;
            
            this.velocity.x = movementVector.x * adjustedSpeed;
            this.velocity.y = movementVector.y * adjustedSpeed;

            // Preserve original direction logic
            if (Math.abs(movementVector.x) > Math.abs(movementVector.y)) {
                this.direction = movementVector.x > 0 ? 'right' : 'left';
                this.lastNonIdleDirection = this.direction;
            } else {
                this.direction = movementVector.y > 0 ? 'down' : 'up';
            }

            // Keep original movement buffer logic
            this.movementBuffer.x += this.velocity.x;
            this.movementBuffer.y += this.velocity.y;

            const newX = this.x + Math.round(this.movementBuffer.x);
            const newY = this.y + Math.round(this.movementBuffer.y);

            this.x = Math.min(Math.max(newX, 0), worldBounds.width - this.width);
            this.y = Math.min(Math.max(newY, 0), worldBounds.height - this.height);

            this.movementBuffer.x -= Math.round(this.movementBuffer.x);
            this.movementBuffer.y -= Math.round(this.movementBuffer.y);

            this.lastX = this.x;
            this.lastY = this.y;
        } else {
            this.movementBuffer.x = 0;
            this.movementBuffer.y = 0;
        }
    }

    handleCombatCollision() {
        const gameInstance = window.gameInstance;
        if (gameInstance?.levelManager?.characters) {
            gameInstance.levelManager.characters.forEach(character => {
                if (character.type === 'suinaevil' && this.checkCollision(character)) {
                    character.currentSprite = 'punch';
                    character.activeSprite = character.sprites.punch;
                    
                    setTimeout(() => {
                        if (gameInstance.audioManager) {
                            gameInstance.audioManager.playSound('urlo');
                        }
                        character.isVisible = false;
                        gameInstance.levelManager.spawnCharacter('suina1');
                    }, 2000);
                }
            });
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