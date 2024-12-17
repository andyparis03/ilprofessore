// GameStateManager.js - to be placed in js/engine/
export class GameStateManager {
    constructor(game) {
        this.game = game;
        this.isGameOver = false;
        this.gameOverType = null; // 'jail' or other future game over conditions
        this.jailOverlay = null;
        this.scoreAnimationInProgress = false;
        this.setupJailOverlay();
    }

    setupJailOverlay() {
        // Pre-load the jail overlay image
        this.jailOverlay = new Image();
        this.jailOverlay.src = './assets/sprites/jail.png';
    }

    triggerJailGameOver(player) {
        if (this.isGameOver) return;
        
        this.isGameOver = true;
        this.gameOverType = 'jail';
        
        // Change player sprite to skull
        if (this.game.player) {
            this.game.player.sprites = this.game.assets.sprites.skull;
            this.game.player.freeze = true;
        }

        // Animate score reset
        this.animateScoreReset();
    }

    animateScoreReset() {
        if (!this.game.scoreManager || this.scoreAnimationInProgress) return;

        this.scoreAnimationInProgress = true;
        const scores = this.game.scoreManager.scores;
        const decrementInterval = 50; // ms between each decrement
        const decrementAmount = 1; // points to decrease per step

        const animationInterval = setInterval(() => {
            let allZero = true;
            
            // Decrease each score type
            Object.keys(scores).forEach(scoreType => {
                if (scores[scoreType] > 0) {
                    scores[scoreType] = Math.max(0, scores[scoreType] - decrementAmount);
                    allZero = false;
                }
            });

            // Stop animation when all scores are zero
            if (allZero) {
                clearInterval(animationInterval);
                this.scoreAnimationInProgress = false;
            }
        }, decrementInterval);
    }

    reset() {
        this.isGameOver = false;
        this.gameOverType = null;
        this.scoreAnimationInProgress = false;
        
        // Reset player state if exists
        if (this.game.player) {
            this.game.player.freeze = false;
        }
    }
}