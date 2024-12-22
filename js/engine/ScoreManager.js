// ScoreManager.js
import { ScoreAnimation } from './ScoreAnimation.js';

export class ScoreManager {
    constructor(ctx) {
        this.ctx = ctx;
        this.scores = {
            energy: 100,    // Starting at 100
            love: 0,        // Starting at 0
            friendship: 100  // Starting at 100
        };
        this.maxScore = 100;
        this.barWidth = 150;
        this.barHeight = 10;
        this.padding = 10;
        this.colors = {
            energy: '#ff4444',    // Red for Energy
            love: '#ff69b4',      // Pink for Love
            friendship: '#4CAF50'  // Green for Friendship
        };
        this.barSpacing = 5;
        this.textPadding = 5;
        this.lastCountdownTime = performance.now();
        this.warningShown = false;
        this.gameOverTriggered = false;
        
        // Initialize score animation system
        this.scoreAnimation = new ScoreAnimation();

        // Start friendship countdown
        this.startFriendshipCountdown();
    }

    startFriendshipCountdown() {
        const countdownInterval = 1000; // 1 second
        this.countdownInterval = setInterval(() => {
            const gameInstance = window.gameInstance;
            if (gameInstance?.gameState?.isGameOver) {
                clearInterval(this.countdownInterval);
                return;
            }

            if (this.scores.friendship > 0) {
                this.scores.friendship--;

                // Check for warning at 30 points
                if (this.scores.friendship === 30 && !this.warningShown) {
                    this.warningShown = true;
                    const gameInstance = window.gameInstance;
                    if (gameInstance?.renderer) {
                        gameInstance.renderer.setScreenMessage('diegoWarning');
                    }
                    if (gameInstance?.audioManager) {
                        gameInstance.audioManager.playSound('buzz');
                    }
                }

                // Check for game over at 0 points
                if (this.scores.friendship === 0 && !this.gameOverTriggered) {
                    this.gameOverTriggered = true;
                    const gameInstance = window.gameInstance;

                    // Stop background music with fade out
                    if (gameInstance.audioManager?.currentMusicSource) {
                        const gainNode = gameInstance.audioManager.musicGainNode;
                        const currentTime = gameInstance.audioManager.audioContext.currentTime;
                        gainNode.gain.setValueAtTime(gainNode.gain.value, currentTime);
                        gainNode.gain.linearRampToValueAtTime(0, currentTime + 1);
                        
                        setTimeout(() => {
                            if (gameInstance.audioManager.currentMusicSource) {
                                gameInstance.audioManager.currentMusicSource.stop();
                            }
                        }, 1000);
                    }

                    if (gameInstance?.renderer) {
                        gameInstance.renderer.setScreenMessage('diegoGameOver');
                    }
                    if (gameInstance?.gameState) {
                        // Set game state to game over
                        gameInstance.gameState.isGameOver = true;
                        setTimeout(() => {
                            if (gameInstance.audioManager) {
                                gameInstance.audioManager.playSound('suina_evil');
                            }
                            gameInstance.renderer.setScreenMessage('finalGameOver');
                            gameInstance.renderer.showNewGameButton();
                        }, 3000); // Wait for the message to flash 3 times
                    }
                }
            }
        }, countdownInterval);
    }

    increaseScore(type, amount) {
        if (this.scores.hasOwnProperty(type)) {
            const oldScore = this.scores[type];
            this.scores[type] = Math.min(this.maxScore, oldScore + amount);
            
            // If it's a love score increase, trigger animation
            if (type === 'love' && amount > 0) {
                this.scoreAnimation.addAnimation(amount);
            }
        }
    }

    draw() {
        this.ctx.save();

        // Draw score bars
        Object.entries(this.scores).forEach(([type, score], index) => {
            const x = this.ctx.canvas.width - this.barWidth - this.padding;
            const y = this.padding + (index * (this.barHeight + this.barSpacing));

            // Draw label with shadow for better visibility
            this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
            this.ctx.shadowBlur = 2;
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = 'bold 10px Arial';
            this.ctx.textAlign = 'right';
            this.ctx.fillText(type.toUpperCase(), x - this.textPadding, y + this.barHeight);
            
            // Reset shadow for bars
            this.ctx.shadowBlur = 0;

            // Draw background bar with slight transparency
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            this.ctx.fillRect(x, y, this.barWidth, this.barHeight);

            // Draw score bar
            this.ctx.fillStyle = this.colors[type];
            const fillWidth = (score / this.maxScore) * this.barWidth;
            this.ctx.fillRect(x, y, fillWidth, this.barHeight);
        });

        // Draw any active score animations
        this.scoreAnimation.update(this.ctx);

        this.ctx.restore();
    }

    cleanup() {
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
        }
    }
}