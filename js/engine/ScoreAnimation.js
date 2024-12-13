// ScoreAnimation.js
export class ScoreAnimation {
    constructor() {
        this.animations = [];
    }

    addAnimation(score) {
        // Get canvas dimensions directly from the game canvas
        const canvas = document.getElementById('gameCanvas');
        const centerX = Math.round(canvas.width / 2);
        const centerY = Math.round(canvas.height / 2);
        
        console.log('Canvas dimensions:', {
            width: canvas.width,
            height: canvas.height,
            centerX: centerX,
            centerY: centerY
        });

        this.animations.push({
            score: `+${score}`,
            x: centerX,         // Center X
            y: centerY,         // Center Y
            startTime: performance.now(),
            duration: 2000,     // 2 seconds
            startFontSize: 72,  // Starting size
            endFontSize: 24,    // Ending size
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
            const fontSize = Math.round(anim.startFontSize + (anim.endFontSize - anim.startFontSize) * easeOutCubic);
            
            // Calculate opacity (fade out in the last 30% of animation)
            anim.opacity = progress > 0.7 ? 1 - ((progress - 0.7) / 0.3) : 1;

            // Draw score with debug info
            ctx.save();
            
            // Set text properties
            ctx.font = `bold ${fontSize}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // Draw debug point at center (temporary)
            ctx.fillStyle = 'red';
            ctx.fillRect(anim.x - 2, anim.y - 2, 4, 4);
            
            // Move upward as it fades
            const yOffset = 50 * easeOutCubic;

            // Draw text outline
            ctx.strokeStyle = `rgba(0, 0, 0, ${anim.opacity * 0.5})`;
            ctx.lineWidth = 3;
            ctx.strokeText(anim.score, anim.x, anim.y - yOffset);

            // Draw text fill
            ctx.fillStyle = `rgba(255, 192, 203, ${anim.opacity})`;
            ctx.fillText(anim.score, anim.x, anim.y - yOffset);

            ctx.restore();

            // Remove finished animations
            if (progress >= 1) {
                this.animations.splice(i, 1);
            }
        }
    }
}