// Renderer.js
import { CONFIG } from '../../config.js';

export class Renderer {
    constructor(ctx, levelManager, gameState) {
        console.log('Initializing Renderer');
        this.ctx = ctx;
        this.levelManager = levelManager;
        this.gameState = gameState;
        this.directions = { down: 0, left: 1, right: 2, up: 3 };
        
        // Message system with both flashing and permanent messages
        this.screenMessages = {
            gameOver: {
                lines: ['Hai beccato', 'la Suina Mala... :('],
                startTime: 0,
                duration: 2000,
                interval: 400,
                isActive: false,
                nextMessage: 'finalGameOver'
            },
            finalGameOver: {
                lines: ['GAME OVER'],
                startTime: 0,
                duration: Infinity,  // Permanent message
                interval: 0,         // No flashing
                isActive: false,
                isPermanent: true    // Flag for permanent display
            },
            suinaMala: {
                lines: ['Suina mala!'],
                startTime: 0,
                duration: 800,
                interval: 200,
                isActive: false
            }
        };
        
        this.debug = true;
    }

    showSuinaMalaMessage() {
        console.log('Showing Suina Mala message');
        this.setScreenMessage('suinaMala', this.screenMessages.suinaMala.lines);
    }

    showGameOverMessage() {
        console.log('Showing Game Over message');
        this.setScreenMessage('gameOver', this.screenMessages.gameOver.lines);
    }

    setScreenMessage(type) {
        if (!this.screenMessages[type]) return;
        
        const message = this.screenMessages[type];
        message.startTime = performance.now();
        message.isActive = true;
    }

    drawScreenMessage(type) {
        const message = this.screenMessages[type];
        if (!message || !message.isActive) return;

        const currentTime = performance.now();
        const elapsed = currentTime - message.startTime;
        
        // Handle message duration
        if (elapsed > message.duration && !message.isPermanent) {
            message.isActive = false;
            
            // If there's a next message, show it
            if (message.nextMessage) {
                this.setScreenMessage(message.nextMessage);
            }
            return;
        }

        // Determine visibility based on whether message is permanent or flashing
        const isVisible = message.isPermanent || (Math.floor((elapsed / message.interval)) % 2 === 0);
        
        if (isVisible) {
            this.ctx.save();
            this.ctx.font = 'bold 32px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.strokeStyle = '#000000';
            this.ctx.lineWidth = 3;
            
            const x = this.ctx.canvas.width / 2;
            const baseY = this.ctx.canvas.height / 2;
            
            message.lines.forEach((line, index) => {
                const y = baseY + (index - (message.lines.length - 1) / 2) * 40;
                this.ctx.strokeText(line, x, y);
                this.ctx.fillText(line, x, y);
            });
            
            this.ctx.restore();
        }
    }



    clear() {
        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    }




    setScreenMessage(type, message, duration = null) {
        console.log(`Setting screen message: ${type}`, message);
        
        if (!this.screenMessages[type]) return;
        
        const messageConfig = this.screenMessages[type];
        messageConfig.startTime = performance.now();
        messageConfig.isActive = true;
        
        if (duration) {
            messageConfig.duration = duration;
        }

        if (Array.isArray(message)) {
            messageConfig.lines = message;
        } else {
            messageConfig.lines = [message];
        }
    }

    drawScreenMessage(type) {
        const message = this.screenMessages[type];
        if (!message || !message.isActive) return;

        const currentTime = performance.now();
        const elapsed = currentTime - message.startTime;
        
        console.log(`Drawing ${type} message, elapsed time:`, elapsed);

        if (elapsed > message.duration) {
            console.log(`${type} message duration expired`);
            message.isActive = false;
            return;
        }

        const flashPhase = Math.floor((elapsed / message.interval));
        const isVisible = flashPhase % 2 === 0;
        
        console.log(`${type} message state:`, { flashPhase, isVisible });

        if (isVisible) {
            this.ctx.save();
            this.ctx.font = 'bold 32px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.strokeStyle = '#000000';
            this.ctx.lineWidth = 3;
            
            const x = this.ctx.canvas.width / 2;
            const baseY = this.ctx.canvas.height / 2;
            
            message.lines.forEach((line, index) => {
                const y = baseY + (index - (message.lines.length - 1) / 2) * 40;
                this.ctx.strokeText(line, x, y);
                this.ctx.fillText(line, x, y);
            });
            
            this.ctx.restore();
        }
    }

    setFlashMessage(message, duration) {
        this.setScreenMessage('flash', message, duration);
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

    draw(player, sprites, camera) {
        console.log('Starting render cycle');

        // Draw background
        this.clear();
        this.drawBackground(this.levelManager.getCurrentLevelBackground(), camera);
        
        // Draw characters
        console.log('Drawing characters');
        if (this.levelManager?.characters) {
            this.drawCharacters(camera);
        }
        
        // Draw player
        if (player && sprites.professore) {
            this.drawPlayer(player, sprites.professore, camera);
        }
        
        // Draw any active screen messages
        Object.keys(this.screenMessages).forEach(type => {
            if (this.screenMessages[type].isActive) {
                this.drawScreenMessage(type);
            }
        });

        console.log('Render cycle complete');
    }

    drawPlayer(player, sprites, camera) {
        if (!player) return;

        const drawX = player.x - camera.x;
        const drawY = player.y - camera.y;

        // Game Over State Handling
        if (this.gameState?.isGameOver && 
            this.gameState.gameOverType === 'jail' && 
            player.freeze) {
            
            console.log('Drawing frozen player state');
            
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

    drawCharacters(camera) {
        if (!this.levelManager?.characters) return;
        
        this.levelManager.characters.forEach(character => {
            if (!character || !character.type || !character.isVisible) return;

            const drawX = character.x - camera.x;
            const drawY = character.y - camera.y;

            if (character.currentSprite === 'attack' && character.activeSprite) {
                this.ctx.drawImage(character.activeSprite, drawX, drawY, 
                    character.width, character.height);
                return;
            }

            if (character.isIdle && character.sprites?.idle) {
                this.ctx.drawImage(character.sprites.idle, drawX, drawY, 
                    character.width, character.height);
            } else if (character.sprites?.walking) {
                const directionIndex = this.directions[character.direction] || this.directions['down'];
                const spriteX = character.frame * character.width;
                const spriteY = directionIndex * character.height;

                this.ctx.drawImage(
                    character.sprites.walking,
                    spriteX, spriteY,
                    character.width, character.height,
                    drawX, drawY,
                    character.width, character.height
                );
            }
        });
    }

    setFlashStartTime() {
        const startTime = performance.now();
        this.screenMessages.gameOver.startTime = startTime;
        if (this.debug) {
            console.log('Flash start time set to:', startTime);
        }
    }
}