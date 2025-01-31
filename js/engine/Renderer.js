// Renderer.js
import { CONFIG } from '../../config.js';

export class Renderer {
    constructor(ctx, levelManager, gameState) {
        console.log('Initializing Renderer');
        this.hasShownArrow = false;
        this.ctx = ctx;
        this.levelManager = levelManager;
        this.gameState = gameState;
        this.directions = { down: 0, left: 1, right: 2, up: 3 };
        
        // Mobile controls references
        this.actionContainer = document.getElementById('action-container');
        this.mobileControls = document.getElementById('mobile-controls');
        
        // Initialize controls as hidden
        if (this.actionContainer) this.actionContainer.style.display = 'none';
        if (this.mobileControls) this.mobileControls.style.display = 'none';
        
        // Splash screen properties
        this.splashScreen = null;
        this.splashScreenReady = false;
        this.isSplashVisible = true;
        this.splashDimensions = {
            width: 0,
            height: 0,
            x: 0,
            y: 0
        };

        // Win screen properties
        this.winScreen = null;
        this.isWinScreenVisible = false;
        this.hasTriggeredWin = false;
        this.winScreenDimensions = {
            width: 0,
            height: 0,
            x: 0,
            y: 0
        };

        this.originalSplashDimensions = {
            width: 1000,
            height: 1800
        };

        this.splashButtons = {
            start: {
                x: 100 / this.originalSplashDimensions.width,
                y: 1110 / this.originalSplashDimensions.height,
                width: 380 / this.originalSplashDimensions.width,
                height: 200 / this.originalSplashDimensions.height
            },
            instructions: {
                x: 520 / this.originalSplashDimensions.width,
                y: 1110 / this.originalSplashDimensions.height,
                width: 380 / this.originalSplashDimensions.width,
                height: 200 / this.originalSplashDimensions.height
            }
        };

        // Win screen button area
        this.winScreenButtons = {
            playAgain: {
                x: 0.35,    // 35% from left
                y: 0.85,    // 85% from top
                width: 0.3, // 30% of screen width
                height: 0.1 // 10% of screen height
            }
        };

        this.canvas = this.ctx.canvas;
        this.canvas.addEventListener('click', (e) => {
            if (this.isWinScreenVisible) {
                this.handleWinScreenClick(e);
            } else if (this.isSplashVisible) {
                this.handleSplashClick(e);
            }
        });
        
        this.screenMessages = {
            diegoWarning: {
                lines: ['Your friend Diego', 'needs your help', 'at the Pub!'],
                startTime: 0,
                duration: 2000,
                interval: 400,
                isActive: false
            },
            diegoGameOver: {
                lines: ['Your friend Diego', 'waited for you', "in vain, friendship is", 'broken forever'],
                startTime: 0,
                duration: 3000,
                interval: 400,
                isActive: false,
                nextMessage: 'finalGameOver'
            },
            lowLove: {
                lines: ['Too little love', 'score, Professor'],
                startTime: 0,
                duration: 2000,
                interval: 400,
                isActive: false,
                nextMessage: 'finalGameOver'
            },
            lowEnergy: {
                lines: ['Hungry, you need', 'pizza!', 'go to Restaurant!'],
                startTime: 0,
                duration: 2000,
                interval: 400,
                isActive: false
            },
            noEnergy: {
                lines: ['Too little energy', 'score, Professor'],
                startTime: 0,
                duration: 2000,
                interval: 400,
                isActive: false,
                nextMessage: 'finalGameOver'
            },
            gameOver: {
                lines: ['You caught', 'the Evil Swine... :('],
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
                lines: ['Evil Swine!'],
                startTime: 0,
                duration: 800,
                interval: 200,
                isActive: false
            },
            gustoClosed: {
                lines: ['Restaurant is closed', 'Try again later'],
                startTime: 0,
                duration: 2000,
                interval: 400,
                isActive: false
            },
            chesterClosed: {
                lines: ['Pub is closed', 'Try again later'],
                startTime: 0,
                duration: 2000,
                interval: 400,
                isActive: false
            }
        };

        // Initialize new game button
        this.newGameButton = {
            element: null,
            visible: false
        };

        this.createNewGameButton();
        this.debug = true;

        // Initialize screens
        this.initializeSplashScreen();
        this.initializeWinScreen();
        
        // Add resize listener
        window.addEventListener('resize', () => this.handleResize());
    }



    updateUIVisibility() {
        const shouldShowControls = !this.isSplashVisible && !this.isWinScreenVisible;
        
        // Update mobile controls visibility
        if (window.innerWidth <= CONFIG.CANVAS.MOBILE_BREAKPOINT) {
            if (this.actionContainer) {
                this.actionContainer.style.display = shouldShowControls ? 'flex' : 'none';
            }
            if (this.mobileControls) {
                this.mobileControls.style.display = shouldShowControls ? 'block' : 'none';
            }

        // Add joystick control here
        const gameInstance = window.gameInstance;
        if (gameInstance?.input?.joystick) {
    if (shouldShowControls) {
        gameInstance.input.joystick.showControls();
    } else {
        gameInstance.input.joystick.hideControls();
    }
        }




        }

        const gameInstance = window.gameInstance;
        if (gameInstance?.scoreManager) {
            gameInstance.scoreManager.setVisibility(shouldShowControls);
        }

        if (gameInstance?.levelManager) {
            if (this.isSplashVisible || this.isWinScreenVisible) {
                gameInstance.levelManager.pauseFriendshipCountdown();
            } else {
                gameInstance.levelManager.resumeFriendshipCountdown();
            }
        }
    }



    async initAudio() {
        const gameInstance = window.gameInstance;
        if (gameInstance?.audioManager && !gameInstance.audioManager.initialized) {
            try {
                await gameInstance.audioManager.init();
                gameInstance.audioManager.playBackgroundMusic();
            } catch (error) {
                console.error('Failed to initialize audio:', error);
            }
        }
    }

    initializeSplashScreen() {
        const gameInstance = window.gameInstance;
        if (gameInstance?.assets?.sprites?.splash) {
            this.splashScreen = gameInstance.assets.sprites.splash;
            this.calculateSplashDimensions();
            this.splashScreenReady = true;
            this.updateUIVisibility();
            console.log('Splash screen initialized with dimensions:', this.splashDimensions);
        } else {
            console.warn('Splash screen asset not found');
        }
    }

    initializeWinScreen() {
        const gameInstance = window.gameInstance;
        if (gameInstance?.assets?.sprites?.winscreen) {
            this.winScreen = gameInstance.assets.sprites.winscreen;
            this.calculateWinScreenDimensions();
            console.log('Win screen initialized with dimensions:', this.winScreenDimensions);
        } else {
            console.warn('Win screen asset not found');
        }
    }

    calculateWinScreenDimensions() {
        if (!this.winScreen) return;

        const canvasWidth = this.ctx.canvas.width;
        const canvasHeight = this.ctx.canvas.height;
        const imageRatio = this.winScreen.width / this.winScreen.height;
        const canvasRatio = canvasWidth / canvasHeight;

        let newWidth, newHeight;

        if (canvasRatio > imageRatio) {
            newHeight = canvasHeight;
            newWidth = canvasHeight * imageRatio;
        } else {
            newWidth = canvasWidth;
            newHeight = canvasWidth / imageRatio;
        }

        this.winScreenDimensions = {
            width: newWidth,
            height: newHeight,
            x: (canvasWidth - newWidth) / 2,
            y: (canvasHeight - newHeight) / 2
        };
    }

    showWinScreen() {
        const gameInstance = window.gameInstance;
        if (gameInstance?.audioManager?.initialized) {
            if (gameInstance.audioManager.currentMusicSource) {
                gameInstance.audioManager.currentMusicSource.stop();
            }
            gameInstance.audioManager.playSound('win');
        }
        this.isWinScreenVisible = true;
        this.updateUIVisibility();
    }

    handleWinScreenClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;

        if (this.isClickInButton(x, y, this.winScreenButtons.playAgain)) {
            window.location.reload();
        }
    }

    calculateSplashDimensions() {
        if (!this.splashScreen) return;

        const canvasWidth = this.ctx.canvas.width;
        const canvasHeight = this.ctx.canvas.height;
        const imageRatio = this.splashScreen.width / this.splashScreen.height;
        const canvasRatio = canvasWidth / canvasHeight;

        let newWidth, newHeight;

        if (canvasRatio > imageRatio) {
            newHeight = canvasHeight;
            newWidth = canvasHeight * imageRatio;
        } else {
            newWidth = canvasWidth;
            newHeight = canvasWidth / imageRatio;
        }

        this.splashDimensions = {
            width: newWidth,
            height: newHeight,
            x: (canvasWidth - newWidth) / 2,
            y: (canvasHeight - newHeight) / 2
        };
    }

    handleResize() {
        if (this.splashScreenReady) {
            this.calculateSplashDimensions();
        }
        this.calculateWinScreenDimensions();
        this.updateUIVisibility();
    }

    showSuinaMalaMessage() {
        this.setScreenMessage('suinaMala');
    }

    showGameOverMessage() {
        this.setScreenMessage('gameOver');
    }

    showLowLoveMessage() {
        this.setScreenMessage('lowLove');
    }

    showLowEnergyWarning() {
        this.setScreenMessage('lowEnergy');
    }

    showNoEnergyMessage() {
        this.setScreenMessage('noEnergy');
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

        const gameInstance = window.gameInstance;
        if (!this.hasTriggeredWin && gameInstance?.scoreManager?.scores?.love >= 100) {
            this.showWinScreen();
            this.hasTriggeredWin = true;
        }

        if (this.isWinScreenVisible && this.winScreen) {
            this.ctx.drawImage(
                this.winScreen,
                this.winScreenDimensions.x,
                this.winScreenDimensions.y,
                this.winScreenDimensions.width,
                this.winScreenDimensions.height
            );
            return;
        }
        
        if (!this.isSplashVisible) {
            Object.keys(this.screenMessages).forEach(type => {
                this.drawScreenMessage(type);
            });
        }

        if (this.isSplashVisible) {
            this.drawSplashScreen();
        }
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

        if (this.levelManager?.currentLevel === 1 && !this.hasShownArrow) {
            const currentTime = performance.now();
            const isVisible = Math.floor(currentTime / 500) % 2 === 0;
            
            if (isVisible) {
                this.ctx.save();
                this.ctx.font = 'bold 48px Arial';
                this.ctx.fillStyle = 'white';
                this.ctx.textAlign = 'center';
                this.ctx.fillText('↖️', 100, 200);
                this.ctx.restore();
            }
        }
    }

    handleSplashClick(e) {
        if (!this.isSplashVisible) return;

        if (this.showingInstructions) {
            this.setSplashVisibility(false);
            this.initAudio();
            return;
        }

        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;

        if (this.isClickInButton(x, y, this.splashButtons.start)) {
            this.setSplashVisibility(false);
            this.initAudio();
            return;
        }

        if (this.isClickInButton(x, y, this.splashButtons.instructions)) {
            this.showInstructions();
            return;
        }
    }

    isClickInButton(x, y, button) {
        if (this.isSplashVisible) {
            const actualX = this.splashDimensions.x + (button.x * this.splashDimensions.width);
            const actualY = this.splashDimensions.y + (button.y * this.splashDimensions.height);
            const actualWidth = button.width * this.splashDimensions.width;
            const actualHeight = button.height * this.splashDimensions.height;

            return x >= actualX && 
                   x <= actualX + actualWidth && 
                   y >= actualY && 
                   y <= actualY + actualHeight;
        } else if (this.isWinScreenVisible) {
            const actualX = this.winScreenDimensions.x + (button.x * this.winScreenDimensions.width);
            const actualY = this.winScreenDimensions.y + (button.y * this.winScreenDimensions.height);
            const actualWidth = button.width * this.winScreenDimensions.width;
            const actualHeight = button.height * this.winScreenDimensions.height;

            return x >= actualX && 
                   x <= actualX + actualWidth && 
                   y >= actualY && 
                   y <= actualY + actualHeight;
        }
        return false;
    }

    showInstructions() {
        const gameInstance = window.gameInstance;
        if (gameInstance?.assets?.sprites?.instructions) {
            this.splashScreen = gameInstance.assets.sprites.instructions;
            this.calculateSplashDimensions();
            this.showingInstructions = true;
        }
    }

    drawSplashScreen() {
        if (this.splashScreenReady && this.splashScreen && this.isSplashVisible) {
            this.ctx.drawImage(
                this.splashScreen,
                this.splashDimensions.x,
                this.splashDimensions.y,
                this.splashDimensions.width,
                this.splashDimensions.height
            );
        }
    }

    setSplashVisibility(visible) {
        this.isSplashVisible = visible;
        this.updateUIVisibility();
    }

    drawPlayer(player, sprites, camera) {
        if (!player) return;

        const drawX = player.x - camera.x;
        const drawY = player.y - camera.y;

        if (this.gameState?.isGameOver && 
            this.gameState.gameOverType === 'jail' && 
            player.freeze) {
            
            if (sprites.freeze) {
                this.ctx.drawImage(sprites.freeze, drawX, drawY, player.width, player.height);
                
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

        // Handle punch sprites
        if (player.isPunching) {
            const punchSprite = player.direction === 'left' ? sprites.punchL : sprites.punchR;
            if (punchSprite) {
                this.ctx.drawImage(punchSprite, drawX, drawY, player.width, player.height);
            }
            return;
        }

        // Normal sprite handling
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

    clear() {
        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    }

    cleanup() {
        window.removeEventListener('resize', () => this.handleResize());
        
        if (this.newGameButton.element) {
            document.body.removeChild(this.newGameButton.element);
            this.newGameButton.element = null;
        }

        if (this.actionContainer) {
            this.actionContainer.style.display = 'none';
        }

        if (this.mobileControls) {
            this.mobileControls.style.display = 'none';
        }

        this.splashScreenReady = false;
        this.splashScreen = null;
        this.isSplashVisible = false;
    }
}


