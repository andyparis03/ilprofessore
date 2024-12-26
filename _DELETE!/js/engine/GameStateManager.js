// GameStateManager.js
export class GameStateManager {
    constructor(game) {
        this.game = game;
        this.isGameOver = false;
        this.gameOverType = null;
        this.jailOverlay = null;
        this.transitionState = {
            active: false,
            startTime: null,
            duration: 1000
        };
        this.initializeJailOverlay();  // Changed name to be more accurate
    }

    initializeJailOverlay() {  // Renamed method
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

    triggerJailGameOver(player) {
        console.log('Triggering jail game over sequence');
        if (this.isGameOver) return;

        this.isGameOver = true;
        this.gameOverType = 'jail';
        this.transitionState.active = true;
        this.transitionState.startTime = performance.now();

        // Use the centralized message system
        if (this.game.renderer) {
            this.game.renderer.showGameOverMessage();
        }

        // Set flash start time in renderer
        if (this.game.renderer) {
            console.log('Setting flash start time');
            this.game.renderer.setFlashStartTime();
        } else {
            console.warn('Renderer not available for flash timing');
        }

        // Handle player state
        if (player) {
            console.log('Setting player game over state');
            player.freeze = true;
            player.isIdle = true;
            player.velocity = { x: 0, y: 0 };
            player.movementBuffer = { x: 0, y: 0 };
        }

        // Stop background music with fade out
        if (this.game.audioManager?.currentMusicSource) {
            const gainNode = this.game.audioManager.musicGainNode;
            const currentTime = this.game.audioManager.audioContext.currentTime;
            gainNode.gain.setValueAtTime(gainNode.gain.value, currentTime);
            gainNode.gain.linearRampToValueAtTime(0, currentTime + 1);
            
            setTimeout(() => {
                this.game.audioManager.currentMusicSource.stop();
            }, 1000);
        }

        // Animate score reset
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

        // Reset player state if available
        if (this.game?.player) {
            this.game.player.freeze = false;
            if (this.game.assets?.sprites?.professore) {
                this.game.player.sprites = this.game.assets.sprites.professore;
            }
        }

        // Reset score animation if available
        if (this.game?.scoreManager?.scoreAnimation) {
            this.game.scoreManager.scoreAnimation.cleanup();
        }

        // Reset audio if available
        if (this.game?.audioManager) {
            this.game.audioManager.musicGainNode.gain.setValueAtTime(
                this.game.audioManager.musicGainNode.gain.defaultValue,
                this.game.audioManager.audioContext.currentTime
            );
        }
    }
}