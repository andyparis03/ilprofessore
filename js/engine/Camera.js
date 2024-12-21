// Camera.js
import { CONFIG } from '../../config.js';

export class Camera {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.width = CONFIG.WORLD.WIDTH;
        this.height = CONFIG.WORLD.HEIGHT;
        this.smoothing = 0.15; // Camera smoothing factor
    }

    follow(target, worldWidth, worldHeight) {
        if (!target) return;

        // Calculate center position for target
        const targetCenterX = target.x + target.width / 2;
        const targetCenterY = target.y + target.height / 2;

        // Calculate desired camera position (center on target)
        const desiredX = targetCenterX - this.width / 2;
        const desiredY = targetCenterY - this.height / 2;

        // Smooth camera movement
        this.x += (desiredX - this.x) * this.smoothing;
        this.y += (desiredY - this.y) * this.smoothing;

        // Clamp camera position to world boundaries
        this.x = Math.max(0, Math.min(this.x, worldWidth - this.width));
        this.y = Math.max(0, Math.min(this.y, worldHeight - this.height));
    }
}