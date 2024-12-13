// ScoreAnimation.js
export class ScoreAnimation {
    constructor() {
        this.animations = [];
    }

    addAnimation(score) {
        // Get canvas dimensions for centering
        const canvasWidth = window.gameInstance.canvas.width;
        const canvasHeight = window.gameInstance.canvas.height;

        this.animations.push({
            score: `+${score}`,
            x: canvasWidth / 2,  // Center X
            y: canvasHeight / 2, // Center Y
            startTime: performance.now(),
            duration: 2000, // 2 seconds
            startFontSize: 72,   // Bigger starting size
            endFontSize: 24,     // Bigger ending size
            opacity: 1
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

            // Calculate current font size
            const fontSize = anim.startFontSize + (anim.endFontSize - anim.startFontSize) * easeOutCubic;
            
            // Calculate opacity (fade out in the last 30% of animation)
            anim.opacity = progress > 0.7 ? 1 - ((progress - 0.7) / 0.3) : 1;

            // Draw score
            ctx.save();
            ctx.font = `bold ${Math.round(fontSize)}px Arial`;
            ctx.fillStyle = `rgba(255, 192, 203, ${anim.opacity})`; // Pink color for love points
            ctx.strokeStyle = `rgba(0, 0, 0, ${anim.opacity * 0.5})`; // Black outline
            ctx.lineWidth = 3;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            // Move upward as it fades
            const yOffset = 50 * easeOutCubic;
            
            // Add text outline for better visibility
            ctx.strokeText(anim.score, anim.x, anim.y - yOffset);
            ctx.fillText(anim.score, anim.x, anim.y - yOffset);
            
            ctx.restore();

            // Remove finished animations
            if (progress >= 1) {
                this.animations.splice(i, 1);
            }
        }
    }
}