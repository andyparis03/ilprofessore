// Renderer.js
import { CONFIG } from '../../config.js';

export class Renderer {
    constructor(ctx, levelManager, gameState) {
        this.ctx = ctx;
        this.levelManager = levelManager;
        this.gameState = gameState;
        this.directions = { down: 0, left: 1, right: 2, up: 3 };
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

    drawPlayer(player, sprites, camera) {
        if (!player) return;

        const drawX = player.x - camera.x;
        const drawY = player.y - camera.y;

        // Handle game over state
        if (this.gameState?.isGameOver) {
            if (this.gameState.gameOverType === 'jail' && sprites.skull) {
                // Draw skull sprite
                this.ctx.drawImage(sprites.skull, drawX, drawY, player.width, player.height);
                
                // Draw jail overlay if loaded
                if (this.gameState.jailOverlay) {
                    const overlayWidth = player.width * 1.5;
                    const overlayHeight = player.height * 1.5;
                    const overlayX = drawX - (overlayWidth - player.width) / 2;
                    const overlayY = drawY - (overlayHeight - player.height) / 2;
                    
                    this.ctx.drawImage(
                        this.gameState.jailOverlay, 
                        overlayX, overlayY, 
                        overlayWidth, overlayHeight
                    );
                }
                return;
            }
        }

        // Normal player rendering
        if (player.isIdle) {
            if (sprites.idle) {
                this.ctx.drawImage(sprites.idle, drawX, drawY, player.width, player.height);
            } else {
                console.error('Player idle sprite is undefined.');
            }
        } else {
            const directionIndex = this.directions[player.direction] !== undefined 
                ? this.directions[player.direction] 
                : this.directions['down'];
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
                console.error('Player walking sprite is undefined.');
            }
        }
    }

    drawCharacters(sprites, camera) {
        this.levelManager.characters.forEach((character) => {
            if (!character || !character.type || !sprites[character.type]) {
                console.error(`Sprites for character type ${character ? character.type : 'undefined'} are undefined.`);
                return;
            }

            if (!character.isVisible) return;

            const drawX = character.x - camera.x;
            const drawY = character.y - camera.y;
            const characterSprites = sprites[character.type.toLowerCase()];

            // Handle specific sprite states
            if (character.currentSprite === 'attack' && character.activeSprite) {
                this.ctx.drawImage(character.activeSprite, drawX, drawY, 
                    character.width, character.height);
                return;
            }

            // Normal character rendering
            if (character.isIdle) {
                if (characterSprites.idle) {
                    this.ctx.drawImage(characterSprites.idle, drawX, drawY, 
                        character.width, character.height);
                }
            } else {
                const directionIndex = this.directions[character.direction] !== undefined
                    ? this.directions[character.direction]
                    : this.directions['down'];
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