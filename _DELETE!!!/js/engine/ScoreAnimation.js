// ScoreAnimation.js
export class ScoreAnimation {
    constructor() {
        this.animations = [];
        this.scoreCountdownElement = null;
        this.isResetting = false;
        this.countdownAnimationFrame = null;
    }


addAnimation(score) {
    const canvas = document.getElementById('gameCanvas');
    const centerX = Math.round(canvas.width / 2);
    const centerY = Math.round(canvas.height / 2);
    
    const prefix = score > 0 ? '+' : ''; // Only add + for positive numbers
    
    this.animations.push({
        score: `${prefix}${score}`,
        x: centerX,
        y: centerY,
        startTime: performance.now(),
        duration: 2000,
        startFontSize: 24,  // Start smaller
        endFontSize: 72,    // End bigger
        opacity: 1,
        // For negative scores, use a different color
        color: score >= 0 ? '#FFC0CB' : '#FF4444'  // Pink for positive, Red for negative
    });
}

update(ctx) {
    const currentTime = performance.now();
    
    for (let i = this.animations.length - 1; i >= 0; i--) {
        const anim = this.animations[i];
        const elapsed = currentTime - anim.startTime;
        const progress = Math.min(elapsed / anim.duration, 1);

        // Smooth easing function
        const easeOutCubic = 1 - Math.pow(1 - progress, 3);

        // Calculate current font size (growing from small to large)
        const fontSize = Math.round(anim.startFontSize + (anim.endFontSize - anim.startFontSize) * easeOutCubic);
        
        // Calculate opacity (fade out in the last 30% of animation)
        anim.opacity = progress > 0.7 ? 1 - ((progress - 0.7) / 0.3) : 1;

        ctx.save();
        
        ctx.font = `bold ${fontSize}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Move upward as it grows
        const yOffset = 50 * easeOutCubic;

        // Draw text outline
        ctx.strokeStyle = `rgba(0, 0, 0, ${anim.opacity * 0.5})`;
        ctx.lineWidth = 3;
        ctx.strokeText(anim.score, anim.x, anim.y - yOffset);

        // Draw text fill
        ctx.fillStyle = `rgba(${anim.color}, ${anim.opacity})`;
        ctx.fillText(anim.score, anim.x, anim.y - yOffset);

        ctx.restore();

        if (progress >= 1) {
            this.animations.splice(i, 1);
        }
    }
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