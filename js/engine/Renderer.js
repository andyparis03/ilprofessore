// Renderer.js
import { CONFIG } from '../../config.js';

export class Renderer {
    constructor(ctx, levelManager, gameState) {
        this.ctx = ctx;
        this.levelManager = levelManager;
        this.gameState = gameState;
        this.directions = { down: 0, left: 1, right: 2, up: 3 };
        this.flashStartTime = 0;
        this.flashDuration = 2000; // 2 seconds total
        this.flashInterval = 400;   // Flash every 400ms
        
        // Debug flag
        this.debug = true;
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
        }
    }

// Renderer.js

// Only the modified method shown, rest of the class remains the same
drawGameOverText() {
    if (!this.gameState?.isGameOver || this.gameState.gameOverType !== 'jail') return;

    const currentTime = performance.now();
    const elapsed = currentTime - this.flashStartTime;
    
    const NUMBER_OF_FLASHES = 2;
    const FLASH_DURATION = 400; // Duration of each flash (on + off)
    const TOTAL_FLASH_TIME = NUMBER_OF_FLASHES * FLASH_DURATION;

    // If we're within the flash period, handle flashing
    if (elapsed <= TOTAL_FLASH_TIME) {
        // Calculate flash state (on/off)
        const flashPhase = Math.floor(elapsed / (FLASH_DURATION / 2));
        const isVisible = flashPhase % 2 === 0;
        
        if (!isVisible) return;
    }
    
    // Draw text (either flashing or persistent after flashes)
    this.ctx.save();
    
    // Set text style
    this.ctx.font = 'bold 32px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';

// Create stroke effect
this.ctx.strokeText(
    'Hai beccato',  // First line
    this.ctx.canvas.width / 2,
    this.ctx.canvas.height / 2 - 20  // Move up by 20 pixels
);
this.ctx.strokeText(
    'la Suina Mala... :(',  // Second line
    this.ctx.canvas.width / 2,
    this.ctx.canvas.height / 2 + 20  // Move down by 20 pixels
);

// Fill text
this.ctx.fillStyle = '#FFFFFF';
this.ctx.fillText(
    'Hai beccato',  // First line
    this.ctx.canvas.width / 2,
    this.ctx.canvas.height / 2 - 20  // Move up by 20 pixels
);
this.ctx.fillText(
    'la Suina Mala... :(',  // Second line
    this.ctx.canvas.width / 2,
    this.ctx.canvas.height / 2 + 20  // Move down by 20 pixels
);

    this.ctx.restore();
}

    drawPlayer(player, sprites, camera) {
        if (!player) return;

        const drawX = player.x - camera.x;
        const drawY = player.y - camera.y;

        // Game Over State Handling
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

        // Normal State Rendering
        if (player.isIdle) {
            if (sprites.idle) {
                this.ctx.drawImage(sprites.idle, drawX, drawY, player.width, player.height);
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
            }
        }
    }

    drawCharacters(sprites, camera) {
        this.levelManager.characters.forEach((character) => {
            if (!character || !character.type || !sprites[character.type]) return;
            if (!character.isVisible) return;

            const drawX = character.x - camera.x;
            const drawY = character.y - camera.y;
            const characterSprites = sprites[character.type.toLowerCase()];

            if (character.currentSprite === 'attack' && character.activeSprite) {
                this.ctx.drawImage(character.activeSprite, drawX, drawY, 
                    character.width, character.height);
                return;
            }

            if (character.isIdle) {
                if (characterSprites.idle) {
                    this.ctx.drawImage(characterSprites.idle, drawX, drawY, 
                        character.width, character.height);
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

    setFlashStartTime() {
        this.flashStartTime = performance.now();
        if (this.debug) {
            console.log('Flash start time set to:', this.flashStartTime);
        }
    }
}