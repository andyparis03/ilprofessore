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
    }

    // ... existing code ...

    updateBehavior(input, worldBounds, deltaTime) {
        if (this.freeze) {
            this.velocity = { x: 0, y: 0 };
            this.movementBuffer = { x: 0, y: 0 };
            this.isIdle = true;
            return;
        }

        this.currentInput = { ...input.keys };
        
        // Handle punch action
        if (input.keys.KeyP && !this.isPunching) {
            this.startPunch();
            
            // Check for collision with suina evil
            const gameInstance = window.gameInstance;
            if (gameInstance?.levelManager?.characters) {
                const suinaEvil = gameInstance.levelManager.characters.find(
                    char => char.type === 'suinaevil' && char.isVisible
                );
                
                if (suinaEvil && this.checkCollision(suinaEvil)) {
                    // Play punch sound
                    if (gameInstance.audioManager) {
                        gameInstance.audioManager.playSound('professore_punch');
                    }
                    
                    // Change suina evil sprite
                    if (suinaEvil.sprites?.attack) {
                        suinaEvil.currentSprite = 'attack';
                        suinaEvil.activeSprite = suinaEvil.sprites.attack;
                        
                        // Play urlo sound after a short delay
                        setTimeout(() => {
                            if (gameInstance.audioManager) {
                                gameInstance.audioManager.playSound('suina_evil');
                            }
                            
                            // Make suina evil disappear and spawn a new one
                            setTimeout(() => {
                                suinaEvil.isVisible = false;
                                if (gameInstance.levelManager) {
                                    gameInstance.levelManager.spawnSuina();
                                }
                            }, 2000);
                        }, 100);
                    }
                } else {
                    // If not hitting suina evil, just play punch sound
                    if (gameInstance?.audioManager) {
                        gameInstance.audioManager.playSound('professore_punch');
                    }
                }
            }
        }

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

    startPunch() {
        if (this.isPunching) return;
        
        this.isPunching = true;
        this.currentSprite = this.direction === 'left' ? 'punchL' : 'punchR';
        this.activeSprite = this.direction === 'left' ? this.sprites.punchL : this.sprites.punchR;
        
        // Reset punch state after 2 seconds
        this.punchTimer = setTimeout(() => {
            this.isPunching = false;
            this.currentSprite = this.isIdle ? 'idle' : 'walking';
            this.activeSprite = this.isIdle ? this.sprites.idle : this.sprites.walking;
            this.punchTimer = null;
        }, 2000);
    }

    cleanup() {
        super.cleanup();
        if (this.punchTimer) {
            clearTimeout(this.punchTimer);
            this.punchTimer = null;
        }
    }
} 