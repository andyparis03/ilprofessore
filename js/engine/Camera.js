// Camera.js
import { CONFIG } from '../../config.js';

export class Camera {
    constructor(width, height) {
        this.x = 0;
        this.y = 0;
        this.width = CONFIG.WORLD.WIDTH;
        this.height = CONFIG.WORLD.HEIGHT;
        this.lastTargetX = null;
        this.lastTargetY = null;
    }

    follow(target, worldWidth, worldHeight) {
        if (!target) return;

        // Center camera on target
        const idealX = target.x + target.width / 2 - this.width / 2;
        const idealY = target.y + target.height / 2 - this.height / 2;

        // Smooth camera movement
        if (this.lastTargetX === null) {
            this.lastTargetX = idealX;
            this.lastTargetY = idealY;
        }

        // Lerp to target position
        const lerp = 0.1;
        this.lastTargetX += (idealX - this.lastTargetX) * lerp;
        this.lastTargetY += (idealY - this.lastTargetY) * lerp;

        // Clamp camera position to world boundaries
        this.x = this.clamp(this.lastTargetX, 0, Math.max(0, worldWidth - this.width));
        this.y = this.clamp(this.lastTargetY, 0, Math.max(0, worldHeight - this.height));
    }

    clamp(value, min, max) {
        return Math.max(min, Math.min(value, max));
    }
}