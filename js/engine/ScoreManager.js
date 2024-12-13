// ScoreManager.js
import { ScoreAnimation } from './ScoreAnimation.js';

export class ScoreManager {
    constructor(ctx) {
        this.ctx = ctx;
        this.scores = {
            energy: 0,
            love: 0,
            friendship: 0
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
        
        // Initialize score animation system
        this.scoreAnimation = new ScoreAnimation();
    }

    increaseScore(type, amount) {
        if (this.scores.hasOwnProperty(type)) {
            const oldScore = this.scores[type];
            this.scores[type] = Math.min(this.maxScore, oldScore + amount);
            
            // If it's a love score increase, trigger animation
            if (type === 'love' && amount > 0) {
                // Position the animation near the love score bar
                const x = this.ctx.canvas.width - this.barWidth / 2 - this.padding;
                const y = this.padding + this.barHeight + this.barSpacing;
                this.scoreAnimation.addAnimation(amount, x, y);
            }
        }
    }

    draw() {
        this.ctx.save();

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
}