// Renderer.js
import { CONFIG } from '../../config.js';

export class Renderer {
    constructor(ctx, levelManager, gameState) {
        console.log('Initializing Renderer');
        this.ctx = ctx;
        this.levelManager = levelManager;
        this.gameState = gameState;
        this.directions = { down: 0, left: 1, right: 2, up: 3 };
        
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
                duration: Infinity,
                interval: 0,
                isActive: false,
                isPermanent: true,
                showNewGameButton: true
            },
            suinaMala: {
                lines: ['Suina mala!'],
                startTime: 0,
                duration: 800,
                interval: 200,
                isActive: false
            }
        };

        this.newGameButton = {
            element: null,
            visible: false
        };

        this.createNewGameButton();
        this.debug = true;
    }

    clear() {
        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    }

    showSuinaMalaMessage() {
        console.log('Showing Suina Mala message');
        this.setScreenMessage('suinaMala');
    }

    showGameOverMessage() {
        console.log('Showing Game Over message');
        this.setScreenMessage('gameOver');
    }

    setScreenMessage(type) {
        if (!this.screenMessages[type]) return;
        
        const message = this.screenMessages[type];
        message.startTime = performance.now();
        message.isActive = true;
    }

    createNewGameButton() {
        if (this.newGameButton.element) {
            document.body.removeChild(this.newGameButton.element);
        }

        const button = document.createElement('button');
        button.textContent = 'New Game';
        button.style.cssText = `
            position: absolute;
            padding: 10px 20px;
            font-size: 20px;
            background-color: #4CAF50;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            display: none;
            font-family: Arial, sans-serif;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            transition: background-color 0.3s, transform 0.2s;
            z-index: 1000;
        `;

        button.onmouseover = () => {
            button.style.backgroundColor = '#45a049';
            button.style.transform = 'scale(1.05)';
        };
        button.onmouseout = () => {
            button.style.backgroundColor = '#4CAF50';
            button.style.transform = 'scale(1)';
        };

        button.onclick = () => this.handleNewGameClick();
        document.body.appendChild(button);
        this.newGameButton.element = button;
    }

    handleNewGameClick() {
        this.hideNewGameButton();
        if (this.gameState) {
            this.gameState.reset();
        }
        Object.keys(this.screenMessages).forEach(key => {
            this.screenMessages[key].isActive = false;
        });
        window.location.reload();
    }

    showNewGameButton() {
        if (!this.newGameButton.element) return;

        const button = this.newGameButton.element;
        const canvas = this.ctx.canvas;
        
        const rect = canvas.getBoundingClientRect();
        const buttonX = rect.left + (canvas.width / 2);
        const buttonY = rect.top + (canvas.height / 2) + 50;

        button.style.left = `${buttonX}px`;
        button.style.top = `${buttonY}px`;
        button.style.transform = 'translate(-50%, -50%)';
        button.style.display = 'block';
        
        this.newGameButton.visible = true;
    }

    hideNewGameButton() {
        if (this.newGameButton.element) {
            this.newGameButton.element.style.display = 'none';
            this.newGameButton.visible = false;
        }
    }

    drawBackground(background, camera) {
        if (!background) return;

        // Always draw at world coordinates relative to camera
        const sourceX = Math.floor(camera.x);
        const sourceY = Math.floor(camera.y);

        this.ctx.drawImage(
            background,
            sourceX, sourceY,
            camera.width, camera.height,
            0, 0,
            this.ctx.canvas.width, this.ctx.canvas.height
        );
    }

    drawScreenMessage(type) {
        const message = this.screenMessages[type];
        if (!message || !message.isActive) return;

        const currentTime = performance.now();
        const elapsed = currentTime - message.startTime;
        
        if (elapsed > message.duration && !message.isPermanent) {
            message.isActive = false;
            
            if (message.nextMessage) {
                this.setScreenMessage(message.nextMessage);
            }
            return;
        }

        const isVisible = message.isPermanent || 
                         message.interval === 0 || 
                         (Math.floor(elapsed / message.interval) % 2 === 0);
        
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

            if (message.showNewGameButton && !this.newGameButton.visible) {
                this.showNewGameButton();
            }
        }
    }

    draw(player, sprites, camera) {
        this.clear();
        this.drawBackground(this.levelManager.getCurrentLevelBackground(), camera);
        
        if (this.levelManager?.characters) {
            this.drawCharacters(camera);
        }
        
        if (player && sprites.professore) {
            this.drawPlayer(player, sprites.professore, camera);
        }
        
        Object.keys(this.screenMessages).forEach(type => {
            this.drawScreenMessage(type);
        });
    }

    drawPlayer(player, sprites, camera) {
        if (!player) return;

        // Calculate screen position relative to camera
        const screenX = Math.floor(player.x - camera.x);
        const screenY = Math.floor(player.y - camera.y);

        if (this.gameState?.isGameOver && 
            this.gameState.gameOverType === 'jail' && 
            player.freeze) {
            
            if (sprites.freeze) {
                this.ctx.drawImage(sprites.freeze, screenX, screenY, player.width, player.height);
                
                const jailOverlay = this.gameState.getJailOverlay();
                if (jailOverlay) {
                    const overlayWidth = player.width * 1.5;
                    const overlayHeight = player.height * 1.5;
                    const overlayX = screenX - (overlayWidth - player.width) / 2;
                    const overlayY = screenY - (overlayHeight - player.height) / 2;
                    
                    this.ctx.drawImage(jailOverlay, overlayX, overlayY, overlayWidth, overlayHeight);
                }
            }
            return;
        }

        if (player.isIdle) {
            if (sprites.idle) {
                this.ctx.drawImage(sprites.idle, screenX, screenY, player.width, player.height);
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
                    screenX, screenY,
                    player.width, player.height
                );
            }
        }
    }

    drawCharacters(camera) {
        if (!this.levelManager?.characters) return;
        
        this.levelManager.characters.forEach(character => {
            if (!character || !character.type || !character.isVisible) return;

            const screenX = Math.floor(character.x - camera.x);
            const screenY = Math.floor(character.y - camera.y);

            if (character.currentSprite === 'attack' && character.activeSprite) {
                this.ctx.drawImage(character.activeSprite, screenX, screenY, 
                    character.width, character.height);
                return;
            }

            if (character.isIdle && character.sprites?.idle) {
                this.ctx.drawImage(character.sprites.idle, screenX, screenY, 
                    character.width, character.height);
            } else if (character.sprites?.walking) {
                const directionIndex = this.directions[character.direction] || this.directions['down'];
                const spriteX = character.frame * character.width;
                const spriteY = directionIndex * character.height;

                this.ctx.drawImage(
                    character.sprites.walking,
                    spriteX, spriteY,
                    character.width, character.height,
                    screenX, screenY,
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

    cleanup() {
        if (this.newGameButton.element) {
            document.body.removeChild(this.newGameButton.element);
            this.newGameButton.element = null;
        }
    }
}