// Renderer.js
export class Renderer {
    constructor(ctx, levelManager, gameState) {
        this.ctx = ctx;
        this.levelManager = levelManager;
        this.gameState = gameState;
        this.directions = { down: 0, left: 1, right: 2, up: 3 };
        
        // Flash timing values (used for both game over and temporary messages)
        this.flashStartTime = 0;
        this.flashDuration = 2000;  // 2 seconds total
        this.flashInterval = 400;   // Flash every 400ms
        
        // Flash message system for temporary messages
        this.flashMessage = {
            text: null,
            startTime: 0,
            isActive: false
        };
    }

    clear() {
        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    }

    drawBackground(background, camera) {
        if (background) {
            this.ctx.drawImage(
                background,
                camera.x, camera.y,
                camera.width, camera.height,
                0, 0,
                camera.width, camera.height
            );
        } else {
            console.warn('Background image is undefined.');
        }
    }

    drawGameOverText() {
        if (!this.gameState?.isGameOver || this.gameState.gameOverType !== 'jail') return;

        const currentTime = performance.now();
        const elapsed = currentTime - this.flashStartTime;

        // Only show text for flashDuration milliseconds
        if (elapsed > this.flashDuration) return;

        // Calculate flash state (on/off)
        const isVisible = Math.floor(elapsed / this.flashInterval) % 2 === 0;
        
        if (isVisible) {
            this.ctx.save();
            
            // Set text style
            this.ctx.font = 'bold 32px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';

            // Create stroke effect
            this.ctx.strokeStyle = 'black';
            this.ctx.lineWidth = 4;
            
            // First line
            this.ctx.strokeText(
                'Hai beccato',
                this.ctx.canvas.width / 2,
                this.ctx.canvas.height / 2 - 20
            );
            this.ctx.strokeText(
                'la Suina Mala... :(',
                this.ctx.canvas.width / 2,
                this.ctx.canvas.height / 2 + 20
            );

            // Fill text
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.fillText(
                'Hai beccato',
                this.ctx.canvas.width / 2,
                this.ctx.canvas.height / 2 - 20
            );
            this.ctx.fillText(
                'la Suina Mala... :(',
                this.ctx.canvas.width / 2,
                this.ctx.canvas.height / 2 + 20
            );

            this.ctx.restore();
        }
    }

    showFlashMessage(text) {
        this.flashMessage = {
            text: text,
            startTime: performance.now(),
            isActive: true
        };
    }

    drawFlashMessage() {
        if (!this.flashMessage.isActive) return;

        const currentTime = performance.now();
        const elapsed = currentTime - this.flashMessage.startTime;

        // Check if animation should end
        if (elapsed >= this.flashDuration) {
            this.flashMessage.isActive = false;
            return;
        }

        // Calculate flash visibility
        const isVisible = Math.floor(elapsed / this.flashInterval) % 2 === 0;

        if (isVisible) {
            this.ctx.save();
            this.ctx.font = 'bold 32px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';

            // Draw stroke
            this.ctx.strokeStyle = 'black';
            this.ctx.lineWidth = 4;
            this.ctx.strokeText(
                this.flashMessage.text,
                this.ctx.canvas.width / 2,
                this.ctx.canvas.height / 2
            );

            // Draw text
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.fillText(
                this.flashMessage.text,
                this.ctx.canvas.width / 2,
                this.ctx.canvas.height / 2
            );

            this.ctx.restore();
        }
    }

    drawPlayer(player, sprites, camera) {
        if (!player) return;

        const drawX = player.x - camera.x;
        const drawY = player.y - camera.y;

        // Handle game over state
        if (this.gameState?.isGameOver && 
            this.gameState.gameOverType === 'jail' && 
            player.freeze) {
            
            // Draw freeze sprite (skull)
            if (sprites.freeze) {
                this.ctx.drawImage(sprites.freeze, drawX, drawY, player.width, player.height);
                
                // Draw jail overlay
                const jailOverlay = this.gameState.getJailOverlay();
                if (jailOverlay) {
                    const overlayWidth = player.width * 1.5;
                    const overlayHeight = player.height * 1.5;
                    const overlayX = drawX - (overlayWidth - player.width) / 2;
                    const overlayY = drawY - (overlayHeight - player.height) / 2;
                    
                    this.ctx.drawImage(
                        jailOverlay, 
                        overlayX, overlayY, 
                        overlayWidth, overlayHeight
                    );
                }
            }
            return;
        }

        // Normal player rendering
        if (player.isIdle) {
            if (sprites.idle) {
                this.ctx.drawImage(sprites.idle, drawX, drawY, player.width, player.height);
            } else {
                console.warn('Player idle sprite is undefined.');
            }
        } else {
            const directionIndex = this.directions[player.direction] || this.directions['down'];
            const spriteX = player.frame * player.width;
            const spriteY = directionIndex * player.height;

            if (sprites.walking) {
                this.ctx.drawImage(
                    sprites.walking,
                    spriteX, spriteY,
                    player.width, player.height,
                    drawX, drawY,
                    player.width, player.height
                );
            } else {
                console.warn('Player walking sprite is undefined.');
            }
        }
    }

    drawCharacters(sprites, camera) {
        this.levelManager.characters.forEach((character) => {
            if (!character || !character.type || !sprites[character.type]) {
                console.warn(`Sprites for character type ${character?.type} are undefined.`);
                return;
            }

            if (!character.isVisible) return;

            const drawX = character.x - camera.x;
            const drawY = character.y - camera.y;
            const characterSprites = sprites[character.type.toLowerCase()];

            if (character.currentSprite === 'attack' && character.activeSprite) {
                this.ctx.drawImage(
                    character.activeSprite, 
                    drawX, drawY, 
                    character.width, character.height
                );
                return;
            }

            if (character.isIdle) {
                if (characterSprites.idle) {
                    this.ctx.drawImage(
                        characterSprites.idle, 
                        drawX, drawY, 
                        character.width, character.height
                    );
                }
            } else {
                const directionIndex = this.directions[character.direction] || this.directions['down'];
                const spriteX = character.frame * character.width;
                const spriteY = directionIndex * character.height;

                if (characterSprites.walking) {
                    this.ctx.drawImage(
                        characterSprites.walking,
                        spriteX, spriteY,
                        character.width, character.height,
                        drawX, drawY,
                        character.width, character.height
                    );
                }
            }
        });
    }
}