// GameStateManager.js
export class GameStateManager {
    constructor(game) {
        this.game = game;
	this.assets = game.assets;
        this.isGameOver = false;
        this.gameOverType = null;
        this.jailOverlay = null;
        this.gameState = 'SPLASH';
        this.fadeAlpha = 1;
        this.isFading = false;
        this.fadeDuration = 500;
        this.fadeStartTime = null;
        this.fadeCallback = null;
        this.playerInitialized = false;
        
        this.transitionState = {
            active: false,
            startTime: null,
            duration: 1000
        };
        
        this.initializeJailOverlay();
    }

    initializeJailOverlay() {
        try {
            this.jailOverlay = new Image();
            this.jailOverlay.src = './assets/sprites/jail.png';
            this.jailOverlay.onload = () => console.log('Jail overlay loaded successfully');
            this.jailOverlay.onerror = (error) => console.error('Failed to load jail overlay:', error);
        } catch (error) {
            console.error('Error initializing jail overlay:', error);
        }
    }

    startFadeOut(callback) {
        this.isFading = true;
        this.fadeStartTime = performance.now();
        this.fadeCallback = callback;
    }

    startFadeIn() {
        this.isFading = true;
        this.fadeStartTime = performance.now();
    }

    updateFade() {
        if (!this.isFading) return;

        const currentTime = performance.now();
        const elapsed = currentTime - this.fadeStartTime;
        const progress = Math.min(elapsed / this.fadeDuration, 1);

        if (this.fadeCallback) {
            this.fadeAlpha = 1 - progress;
        } else {
            this.fadeAlpha = progress;
        }

        if (progress >= 1) {
            this.isFading = false;
            if (this.fadeCallback) {
                const callback = this.fadeCallback;
                this.fadeCallback = null;
                callback();
            }
        }
    }

    handleSplashClick(x, y) {
        if (this.isFading) return;

        if (x >= 220 && x <= 380 && y >= 450 && y <= 500) {
            this.startFadeOut(() => {
                this.gameState = 'GAME';
                if (!this.playerInitialized) {
                    this.initializeGameplay();
                }
                this.startFadeIn();
            });
        } else if (x >= 420 && x <= 580 && y >= 450 && y <= 500) {
            this.startFadeOut(() => {
                this.gameState = 'INSTRUCTIONS';
                this.startFadeIn();
            });
        }
    }

    initializeGameplay() {
        if (this.game.player) {
            this.game.player.x = CONFIG.WORLD.WIDTH / 2;
            this.game.player.y = CONFIG.WORLD.HEIGHT / 2;
        }
        this.playerInitialized = true;
    }

    handleInstructionsClick(x, y) {
        if (this.isFading) return;

        if (x >= 650 && x <= 750 && y >= 520 && y <= 570) {
            this.startFadeOut(() => {
                this.gameState = 'SPLASH';
                this.startFadeIn();
            });
        }
    }

    triggerJailGameOver(player) {
        if (this.isGameOver) return;

        this.isGameOver = true;
        this.gameOverType = 'jail';
        this.transitionState.active = true;
        this.transitionState.startTime = performance.now();

        if (this.game.renderer) {
            this.game.renderer.showGameOverMessage();
            this.game.renderer.setFlashStartTime();
        }

        if (player) {
            player.freeze = true;
            player.isIdle = true;
            player.velocity = { x: 0, y: 0 };
            player.movementBuffer = { x: 0, y: 0 };
        }

        if (this.game.audioManager?.currentMusicSource) {
            const gainNode = this.game.audioManager.musicGainNode;
            const currentTime = this.game.audioManager.audioContext.currentTime;
            gainNode.gain.setValueAtTime(gainNode.gain.value, currentTime);
            gainNode.gain.linearRampToValueAtTime(0, currentTime + 1);
            
            setTimeout(() => {
                this.game.audioManager.currentMusicSource.stop();
            }, 1000);
        }

        if (this.game.scoreManager) {
            this.game.scoreManager.scoreAnimation.animateScoreReset(
                this.game.scoreManager,
                () => {
                    this.transitionState.active = false;
                }
            );
        }
    }

    isInTransition() {
        if (!this.transitionState.active) return false;
        const elapsed = performance.now() - this.transitionState.startTime;
        return elapsed < this.transitionState.duration;
    }

    getJailOverlay() {
        return this.jailOverlay?.complete ? this.jailOverlay : null;
    }

    reset() {
        this.isGameOver = false;
        this.gameOverType = null;
        this.transitionState.active = false;
        this.transitionState.startTime = null;
        this.gameState = 'SPLASH';
        this.isFading = false;
        this.fadeAlpha = 1;
        this.playerInitialized = false;

        if (this.game?.player) {
            this.game.player.freeze = false;
            if (this.game.assets?.sprites?.professore) {
                this.game.player.sprites = this.game.assets.sprites.professore;
            }
        }

        if (this.game?.scoreManager?.scoreAnimation) {
            this.game.scoreManager.scoreAnimation.cleanup();
        }

        if (this.game?.audioManager) {
            this.game.audioManager.musicGainNode.gain.setValueAtTime(
                this.game.audioManager.musicGainNode.gain.defaultValue,
                this.game.audioManager.audioContext.currentTime
            );
        }
    }
}