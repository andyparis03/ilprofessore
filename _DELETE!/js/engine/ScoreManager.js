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
            energy: '#FFA07A',    // Light Orange for Energy
            love: '#ff69b4',      // Pink for Love
            friendship: '#90EE90'  // Light Green for Friendship
        };
        this.barSpacing = 5;
        this.textPadding = 5;
        this.lastCountdownTime = performance.now();
        this.warningShown = false;
        this.energyWarningShown = false;
        this.gameOverTriggered = false;
        this.energyCountdownStarted = false;
        this.energyCountdownInterval = null;

        // Flash states for score bars
        this.flashStates = {
            energy: { isFlashing: false, flashCount: 0, lastFlashTime: 0 },
            love: { isFlashing: false, flashCount: 0, lastFlashTime: 0 },
            friendship: { isFlashing: false, flashCount: 0, lastFlashTime: 0 }
        };
        
        this.flashConfig = {
            totalFlashes: 3,
            flashDuration: 400,  // Duration of each flash in ms
            flashInterval: 800   // Total time for one flash cycle (on+off)
        };
        
        // Initialize score animation system
        this.scoreAnimation = new ScoreAnimation();

        // Start friendship countdown
        this.startFriendshipCountdown();
    }

    startBarFlash(type) {
        console.log(`Starting flash for ${type}`);
        this.flashStates[type] = {
            isFlashing: true,
            flashCount: 0,
            lastFlashTime: performance.now()
        };
    }

    increaseScore(type, amount) {
        if (this.scores.hasOwnProperty(type)) {
            const oldScore = this.scores[type];
            
            if (type === 'love' && amount > 0) {
                const actualLoveIncrease = Math.min(this.maxScore, oldScore + amount) - oldScore;
                const energyDecrease = actualLoveIncrease * 2;
                
                const newEnergy = Math.max(0, this.scores.energy - energyDecrease);
                if (newEnergy === 0 && this.scores.energy > 0) {
                    this.startBarFlash('energy');
                }
                this.scores.energy = newEnergy;
                
                this.scores[type] = Math.min(this.maxScore, oldScore + amount);
                this.scoreAnimation.addAnimation(amount);
            } else {
                const newScore = Math.min(this.maxScore, oldScore + amount);
                if (newScore === 0 && oldScore > 0) {
                    this.startBarFlash(type);
                }
                this.scores[type] = newScore;
                
                // If increasing energy and we're in countdown, stop it
                if (type === 'energy' && amount > 0 && this.scores.energy > 30) {
                    this.stopEnergyCountdown();
                    this.energyWarningShown = false;
                }
            }
            
            this.checkScores();
        }
    }

    startEnergyCountdown() {
        if (this.energyCountdownStarted) return;
        
        this.energyCountdownStarted = true;
        const countdownInterval = 1000; // 1 second

        this.energyCountdownInterval = setInterval(() => {
            const gameInstance = window.gameInstance;
            if (gameInstance?.gameState?.isGameOver) {
                this.stopEnergyCountdown();
                return;
            }

            if (this.scores.energy > 0) {
                this.scores.energy--;
                
                if (this.scores.energy === 0 && !this.gameOverTriggered) {
                    this.startBarFlash('energy');
                    this.gameOverTriggered = true;
                    this.triggerGameOver('energy');
                }
            } else {
                this.stopEnergyCountdown();
            }
        }, countdownInterval);
    }

    stopEnergyCountdown() {
        if (this.energyCountdownInterval) {
            clearInterval(this.energyCountdownInterval);
            this.energyCountdownInterval = null;
        }
        this.energyCountdownStarted = false;
    }

    checkScores() {
        const gameInstance = window.gameInstance;
        if (!gameInstance) return;

        // Check Love score
        if (this.scores.love <= 0 && !this.gameOverTriggered) {
            console.log('Love score triggered game over');
            this.startBarFlash('love');
            this.gameOverTriggered = true;
            this.triggerGameOver('love');
        }

        // Check Energy warnings and game over
        if (this.scores.energy <= 30 && !this.energyWarningShown) {
            this.energyWarningShown = true;
            this.startBarFlash('energy');
            if (gameInstance.renderer) {
                gameInstance.renderer.showLowEnergyWarning();
            }
            if (gameInstance.audioManager) {
                gameInstance.audioManager.playSound('dingdong');
            }
            this.startEnergyCountdown();
        }

        if (this.scores.energy <= 0 && !this.gameOverTriggered) {
            console.log('Energy score triggered game over');
            this.startBarFlash('energy');
            this.gameOverTriggered = true;
            this.triggerGameOver('energy');
        }
    }

    startFriendshipCountdown() {
        const countdownInterval = 1000;
        this.countdownInterval = setInterval(() => {
            const gameInstance = window.gameInstance;
            if (gameInstance?.gameState?.isGameOver) {
                clearInterval(this.countdownInterval);
                return;
            }

            if (this.scores.friendship > 0) {
                this.scores.friendship--;

                if (this.scores.friendship === 30 && !this.warningShown) {
                    this.warningShown = true;
                    this.startBarFlash('friendship');
                    if (gameInstance?.renderer) {
                        gameInstance.renderer.setScreenMessage('diegoWarning');
                    }
                    if (gameInstance?.audioManager) {
                        gameInstance.audioManager.playSound('dingdong');
                    }
                }

                if (this.scores.friendship === 0 && !this.gameOverTriggered) {
                    console.log('Friendship score triggered game over');
                    this.gameOverTriggered = true;
                    this.startBarFlash('friendship');

                    if (gameInstance?.audioManager) {
                        gameInstance.audioManager.playSound('buzz');
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

    triggerGameOver(type) {
        const gameInstance = window.gameInstance;
        if (!gameInstance) return;

        if (gameInstance.audioManager) {
            gameInstance.audioManager.playSound('buzz');
        }

        if (gameInstance.renderer) {
            if (type === 'love') {
                gameInstance.renderer.showLowLoveMessage();
            } else if (type === 'energy') {
                gameInstance.renderer.showNoEnergyMessage();
            }
        }

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

    draw() {
        this.ctx.save();

        Object.entries(this.scores).forEach(([type, score], index) => {
            const x = this.ctx.canvas.width - this.barWidth - this.padding;
            const y = this.padding + (index * (this.barHeight + this.barSpacing));
            const flashState = this.flashStates[type];

            // Draw label
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = 'bold 10px Arial';
            this.ctx.textAlign = 'right';
            this.ctx.fillText(type.toUpperCase(), x - this.textPadding, y + this.barHeight);

            // Simplified flash logic
            let shouldShow = true;
            let isFlashFrame = false;
            if (flashState.isFlashing) {
                const elapsed = performance.now() - flashState.lastFlashTime;
                const currentFlashCycle = Math.floor(elapsed / this.flashConfig.flashInterval);
                shouldShow = Math.floor((elapsed % this.flashConfig.flashInterval) / this.flashConfig.flashDuration) === 0;
                isFlashFrame = shouldShow;

                // Check if we should stop flashing
                if (currentFlashCycle >= this.flashConfig.totalFlashes) {
                    flashState.isFlashing = false;
                    shouldShow = true;
                    isFlashFrame = false;
                }
            }

            // Draw the bars
            if (shouldShow) {
                const fillWidth = (score / this.maxScore) * this.barWidth;
                const emptyWidth = this.barWidth - fillWidth;
                
                if (flashState.isFlashing) {
                    // Draw the colored part (if any)
                    if (fillWidth > 0) {
                        this.ctx.fillStyle = this.colors[type];
                        this.ctx.fillRect(x, y, fillWidth, this.barHeight);
                    }
                    
                    // Draw the empty part with flashing effect
                    if (emptyWidth > 0) {
                        this.ctx.fillStyle = isFlashFrame ? '#FF0000' : 'rgba(0, 0, 0, 0.3)';
                        this.ctx.fillRect(x + fillWidth, y, emptyWidth, this.barHeight);
                    }
                } else {
                    // Normal drawing
                    if (fillWidth > 0) {
                        this.ctx.fillStyle = this.colors[type];
                        this.ctx.fillRect(x, y, fillWidth, this.barHeight);
                    }
                    // Draw grey background for empty part
                    if (emptyWidth > 0) {
                        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
                        this.ctx.fillRect(x + fillWidth, y, emptyWidth, this.barHeight);
                    }
                }
            }
        });

        this.scoreAnimation.update(this.ctx);
        this.ctx.restore();
    }

    cleanup() {
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
        }
        this.stopEnergyCountdown();
        Object.keys(this.flashStates).forEach(type => {
            this.flashStates[type] = { isFlashing: false, flashCount: 0, lastFlashTime: 0 };
        });
    }
}