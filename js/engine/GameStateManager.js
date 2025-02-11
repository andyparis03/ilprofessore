// GameStateManager.js
export class GameStateManager {
    constructor(game) {
        this.game = game;
        this.isGameOver = false;
        this.gameOverType = null;
        this.jailOverlay = null;
        
        // Keep original transition state structure
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
            
            this.jailOverlay.onload = () => {
                console.log('Jail overlay loaded successfully');
            };
            
            this.jailOverlay.onerror = (error) => {
                console.error('Failed to load jail overlay:', error);
            };
        } catch (error) {
            console.error('Error initializing jail overlay:', error);
        }
    }

    // Maintain exact original method signature and execution flow
    triggerJailGameOver(player) {
        console.log('Triggering jail game over sequence');
        if (this.isGameOver) return;

        // Preserve original execution order
        this.isGameOver = true;
        this.gameOverType = 'jail';
        this.transitionState.active = true;
        this.transitionState.startTime = performance.now();

        // Keep renderer interactions in original order
        if (this.game.renderer) {
            this.game.renderer.showGameOverMessage();
        }

        // Maintain exact player state management
        if (player) {
            console.log('Setting player game over state');
            player.freeze = true;
            player.isIdle = true;
            player.velocity = { x: 0, y: 0 };
            player.movementBuffer = { x: 0, y: 0 };
        }

        // Set flash start time in renderer - keep original order
        if (this.game.renderer) {
            console.log('Setting flash start time');
            this.game.renderer.setFlashStartTime();
        } else {
            console.warn('Renderer not available for flash timing');
        }

        // Keep original audio handling
        if (this.game.audioManager?.currentMusicSource) {
            const gainNode = this.game.audioManager.musicGainNode;
            const currentTime = this.game.audioManager.audioContext.currentTime;
            gainNode.gain.setValueAtTime(gainNode.gain.value, currentTime);
            gainNode.gain.linearRampToValueAtTime(0, currentTime + 1);
            
            setTimeout(() => {
                this.game.audioManager.currentMusicSource.stop();
            }, 1000);
        }

        // Maintain original score animation sequence
        if (this.game.scoreManager) {
            this.game.scoreManager.scoreAnimation.animateScoreReset(
                this.game.scoreManager,
                () => {
                    console.log('Score reset animation complete');
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

        // Keep original player reset logic
        if (this.game?.player) {
            this.game.player.freeze = false;
            if (this.game.assets?.sprites?.professore) {
                this.game.player.sprites = this.game.assets.sprites.professore;
            }
        }

        // Keep original animation reset
        if (this.game?.scoreManager?.scoreAnimation) {
            this.game.scoreManager.scoreAnimation.cleanup();
        }

        // Keep original audio reset
        if (this.game?.audioManager) {
            this.game.audioManager.musicGainNode.gain.setValueAtTime(
                this.game.audioManager.musicGainNode.gain.defaultValue,
                this.game.audioManager.audioContext.currentTime
            );
        }
    }
}