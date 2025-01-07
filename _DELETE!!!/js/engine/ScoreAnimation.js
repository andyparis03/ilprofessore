// ScoreAnimation.js
export class ScoreAnimation {
    constructor() {
        this.animations = [];
        this.scoreCountdownElement = null;
        this.isResetting = false;
        this.countdownAnimationFrame = null;
    }

    addAnimation(score, isNegative = false) {
        const canvas = document.getElementById('gameCanvas');
        const isLevel5 = window.gameInstance?.levelManager?.currentLevel === 5;
        
        // Only apply special animation in Level 5
        if (isLevel5 && window.gameInstance?.levelManager?.characters.some(c => c.type === 'diego')) {
            if (isNegative) {
                // Energy loss animation (left side)
                this.animations.push({
                    score: `-${score}`,
                    x: Math.round(canvas.width / 2 - 50), // Offset left
                    y: Math.round(canvas.height / 2),
                    startTime: performance.now(),
                    duration: 2000,
                    startFontSize: 72,
                    endFontSize: 24,
                    opacity: 1,
                    color: '#FF0000' // Light Orange for Energy
                });
            } else {
                // Friendship gain animation (right side)
                this.animations.push({
                    score: `+${score}`,
                    x: Math.round(canvas.width / 2 + 50), // Offset right
                    y: Math.round(canvas.height / 2),
                    startTime: performance.now(),
                    duration: 2000,
                    startFontSize: 24,
                    endFontSize: 72,
                    opacity: 1,
                    color: '#90EE90' // Light Green for Friendship
                });
            }
        } else {
            // Default animation for other scenarios
            this.animations.push({
                score: `${isNegative ? '-' : '+'}${score}`,
                x: Math.round(canvas.width / 2),
                y: Math.round(canvas.height / 2),
                startTime: performance.now(),
                duration: 2000,
                startFontSize: 72,
                endFontSize: 24,
                opacity: 1,
                color: isNegative ? '#FFA07A' : '#90EE90'
            });
        }
    }

    update(ctx) {
        const currentTime = performance.now();
        
        for (let i = this.animations.length - 1; i >= 0; i--) {
            const anim = this.animations[i];
            const elapsed = currentTime - anim.startTime;
            const progress = Math.min(elapsed / anim.duration, 1);

            // Smooth easing function
            const easeOutCubic = 1 - Math.pow(1 - progress, 3);

            // Calculate current font size
            const fontSize = Math.round(
                anim.startFontSize + (anim.endFontSize - anim.startFontSize) * easeOutCubic
            );
            
            // Calculate opacity (fade out in the last 30% of animation)
            anim.opacity = progress > 0.7 ? 1 - ((progress - 0.7) / 0.3) : 1;

            ctx.save();
            
            ctx.font = `bold ${fontSize}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            // Move upward as it fades
            const yOffset = 50 * easeOutCubic;

            // Draw text outline
            ctx.strokeStyle = `rgba(0, 0, 0, ${anim.opacity * 0.5})`;
            ctx.lineWidth = 3;
            ctx.strokeText(anim.score, anim.x, anim.y - yOffset);

            // Draw text fill with specified color
            ctx.fillStyle = `rgba(${this.hexToRgb(anim.color)}, ${anim.opacity})`;
            ctx.fillText(anim.score, anim.x, anim.y - yOffset);

            ctx.restore();

            if (progress >= 1) {
                this.animations.splice(i, 1);
            }
        }
    }

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? 
            `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : 
            '255, 255, 255';
    }



    animateScoreReset(scoreManager, onComplete) {
        if (this.isResetting) return;
        
        this.isResetting = true;
        const scores = scoreManager.scores;
        const startScores = { ...scores };
        const animationDuration = 2000;
        const startTime = performance.now();
        const startFontSize = 120; // Starting larger
        const endFontSize = 48;   // Ending smaller

        this.createCountdownElement(startFontSize);

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / animationDuration, 1);

            // Easing function for smooth animation
            const easeInOutQuad = progress < 0.5 
                ? 2 * progress * progress 
                : 1 - Math.pow(-2 * progress + 2, 2) / 2;

            // Animate scores down
            Object.keys(scores).forEach(type => {
                scores[type] = Math.round(startScores[type] * (1 - easeInOutQuad));
            });

            // Update countdown number with size and opacity animation
            const countdownValue = Math.round(100 * (1 - easeInOutQuad));
            if (this.scoreCountdownElement) {
                // Calculate current font size
                const currentFontSize = startFontSize - (startFontSize - endFontSize) * easeInOutQuad;
                
                // Calculate opacity (start fading halfway through)
                const opacity = progress > 0.5 ? 2 * (1 - progress) : 1;
                
                this.scoreCountdownElement.style.fontSize = `${currentFontSize}px`;
                this.scoreCountdownElement.style.opacity = opacity;
                this.scoreCountdownElement.textContent = countdownValue;
            }

            if (progress < 1) {
                this.countdownAnimationFrame = requestAnimationFrame(animate);
            } else {
                this.cleanup();
                this.isResetting = false;
                if (onComplete) onComplete();
            }
        };

        this.countdownAnimationFrame = requestAnimationFrame(animate);
    }

    createCountdownElement(fontSize) {
        this.scoreCountdownElement = document.createElement('div');
        this.scoreCountdownElement.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: ${fontSize}px;
            font-family: 'Arial Black', Arial;
            color: white;
            font-weight: bold;
            text-shadow: 3px 3px 6px rgba(0, 0, 0, 0.5),
                         -3px -3px 6px rgba(0, 0, 0, 0.5);
            z-index: 1000;
            transition: transform 0.1s ease-out;
            opacity: 1;
        `;
        document.body.appendChild(this.scoreCountdownElement);
    }


    cleanup() {
        if (this.countdownAnimationFrame) {
            cancelAnimationFrame(this.countdownAnimationFrame);
            this.countdownAnimationFrame = null;
        }
        
        if (this.scoreCountdownElement) {
            document.body.removeChild(this.scoreCountdownElement);
            this.scoreCountdownElement = null;
        }
    }
}