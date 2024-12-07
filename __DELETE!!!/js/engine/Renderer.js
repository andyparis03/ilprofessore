// Renderer.js
import { CONFIG } from '../../config.js';

export class Renderer {
    constructor(ctx, levelManager) {
        this.ctx = ctx;
        this.levelManager = levelManager;
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
        const drawX = player.x - camera.x;
        const drawY = player.y - camera.y;

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
            const drawX = character.x - camera.x;
            const drawY = character.y - camera.y;

            if (!sprites[character.type]) {
                console.error(`Sprites for character type ${character.type} are undefined.`);
                return;
            }

            const characterSprites = sprites[character.type.toLowerCase()];

            if (character.isIdle) {
                if (characterSprites.idle) {
                    this.ctx.drawImage(characterSprites.idle, drawX, drawY, character.width, character.height);
                } else {
                    console.error(`Idle sprite for character type ${character.type} is undefined.`);
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
                } else {
                    console.error(`Walking sprite for character type ${character.type} is undefined.`);
                }
            }
        });
    }

    drawLevelName() {
        const currentLevel = CONFIG.LEVELS[this.levelManager.currentLevel];
        if (currentLevel) {
            this.ctx.fillStyle = 'white';
            this.ctx.font = '20px Arial';
            this.ctx.fillText(currentLevel.name, 10, 30);
        } else {
            console.warn('Current level configuration is undefined.');
        }
    }

    render(player, sprites, camera) {
        this.clear();
        const background = this.levelManager.getCurrentLevelBackground();
        this.drawBackground(background, camera);
        this.drawCharacters(sprites, camera);
        this.drawPlayer(player, sprites.professore, camera);
        this.drawLevelName();
    }
}
