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
        this.setupJailOverlay();
    }

    setupJailOverlay() {
        this.jailOverlay = new Image();
        this.jailOverlay.src = './assets/sprites/jail.png';
        this.jailOverlay.onload = () => {
            console.log('Jail overlay loaded successfully');
        };
        this.jailOverlay.onerror = (error) => {
            console.error('Failed to load jail overlay:', error);
        };
    }

    triggerJailGameOver(player) {
        if (this.isGameOver) return;
        
        this.isGameOver = true;
        this.gameOverType = 'jail';
        this.transitionState.active = true;
        this.transitionState.startTime = performance.now();

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

        // Freeze player and change sprite
        if (player) {
            player.freeze = true;
            if (this.game.assets.sprites.skull1) {
                player.sprites = {
                    idle: this.game.assets.sprites.skull1,
                    walking: this.game.assets.sprites.skull1
                };
            }
        }
    }

    isInTransition() {
        if (!this.transitionState.active) return false;
        
        const elapsed = performance.now() - this.transitionState.startTime;
        return elapsed < this.transitionState.duration;
    }

    reset() {
        this.isGameOver = false;
        this.gameOverType = null;
        this.transitionState.active = false;
        this.transitionState.startTime = null;

        // Reset player state
        if (this.game.player) {
            this.game.player.freeze = false;
            // Restore original sprites if needed
            if (this.game.assets.sprites.professore) {
                this.game.player.sprites = this.game.assets.sprites.professore;
            }
        }

        // Reset score animation state
        if (this.game.scoreManager?.scoreAnimation) {
            this.game.scoreManager.scoreAnimation.cleanup();
        }

        // Reset audio
        if (this.game.audioManager) {
            this.game.audioManager.musicGainNode.gain.setValueAtTime(
                this.game.audioManager.musicGainNode.gain.defaultValue,
                this.game.audioManager.audioContext.currentTime
            );
        }
    }

    getJailOverlay() {
        return this.jailOverlay?.complete ? this.jailOverlay : null;
    }
}