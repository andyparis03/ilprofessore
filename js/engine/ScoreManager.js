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
    energy: '#FFA07A',    // Light Orange (Salmon) for Energy
    love: '#ff69b4',      // Pink for Love (unchanged)
    friendship: '#90EE90'  // Light Green for Friendship
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

    increaseScore(type, amount) {
        if (this.scores.hasOwnProperty(type)) {
            const oldScore = this.scores[type];
            
            // For love score increases, decrease energy by the same amount
            if (type === 'love' && amount > 0) {
                // Calculate actual love increase (considering max score limit)
                const actualLoveIncrease = Math.min(this.maxScore, oldScore + amount) - oldScore;
                
                // Decrease energy by the same amount
                this.scores.energy = Math.max(0, this.scores.energy - actualLoveIncrease);
                
                // Update love score and trigger animation only for love
                this.scores[type] = Math.min(this.maxScore, oldScore + amount);
                this.scoreAnimation.addAnimation(amount);
            } else {
                // For other scores, just update normally
                this.scores[type] = Math.min(this.maxScore, oldScore + amount);
            }
        }
    }


checkScores() {
    const gameInstance = window.gameInstance;
    if (!gameInstance) return;

    // Check Love score
    if (this.scores.love <= 0 && !this.gameOverTriggered) {
        this.gameOverTriggered = true;
        this.triggerGameOver('love');
    }

    // Check Energy warnings and game over
    if (this.scores.energy <= 30 && !this.energyWarningShown) {
        this.energyWarningShown = true;
        if (gameInstance.renderer) {
            gameInstance.renderer.showLowEnergyWarning();
        }
        if (gameInstance.audioManager) {
            gameInstance.audioManager.playSound('dingdong');
        }
    }

    if (this.scores.energy <= 0 && !this.gameOverTriggered) {
        this.gameOverTriggered = true;
        this.triggerGameOver('energy');
    }
}

triggerGameOver(type) {
    const gameInstance = window.gameInstance;
    if (!gameInstance) return;

    // Play buzz sound
    if (gameInstance.audioManager) {
        gameInstance.audioManager.playSound('buzz');
    }

    // Show appropriate message
    if (gameInstance.renderer) {
        if (type === 'love') {
            gameInstance.renderer.showLowLoveMessage();
        } else if (type === 'energy') {
            gameInstance.renderer.showNoEnergyMessage();
        }
    }

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

    // Set game over state and play final sound
    if (gameInstance.gameState) {
        gameInstance.gameState.isGameOver = true;
        setTimeout(() => {
            if (gameInstance.audioManager) {
                gameInstance.audioManager.playSound('suina_evil');
            }
            gameInstance.renderer.setScreenMessage('finalGameOver');
            gameInstance.renderer.showNewGameButton();
        }, 2000);
    }
}

// Update the increaseScore method to check scores after changes
increaseScore(type, amount) {
    if (this.scores.hasOwnProperty(type)) {
        const oldScore = this.scores[type];
        
        if (type === 'love' && amount > 0) {
            const actualLoveIncrease = Math.min(this.maxScore, oldScore + amount) - oldScore;
            this.scores.energy = Math.max(0, this.scores.energy - actualLoveIncrease);
            this.scores[type] = Math.min(this.maxScore, oldScore + amount);
            this.scoreAnimation.addAnimation(amount);
        } else {
            this.scores[type] = Math.min(this.maxScore, oldScore + amount);
        }
        
        // Check scores after any changes
        this.checkScores();
    }
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
                        gameInstance.audioManager.playSound('dingdong');
                    }
                }

                // Check for game over at 0 points
                if (this.scores.friendship === 0 && !this.gameOverTriggered) {
                    this.gameOverTriggered = true;
                    const gameInstance = window.gameInstance;

                    if (gameInstance?.audioManager) {
                        gameInstance.audioManager.playSound('buzz');
                    }

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
                        gameInstance.gameState.isGameOver = true;
                        setTimeout(() => {
                            if (gameInstance.audioManager) {
                                gameInstance.audioManager.playSound('suina_evil');
                            }
                            gameInstance.renderer.setScreenMessage('finalGameOver');
                            gameInstance.renderer.showNewGameButton();
                        }, 3000);
                    }
                }
            }
        }, countdownInterval);
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