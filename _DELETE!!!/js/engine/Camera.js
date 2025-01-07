// Camera.js
import { CONFIG } from '../../config.js';

export class Camera {
    constructor(width, height) {
        this.x = 0;
        this.y = 0;
        this.width = width;
        this.height = height;
    }

    follow(target, worldWidth, worldHeight) {
        const idealX = target.x + target.width / 2 - this.width / 2;
        const idealY = target.y + target.height / 2 - this.height / 2;

        this.x = this.clamp(idealX, 0, Math.max(0, worldWidth - this.width));
        this.y = this.clamp(idealY, 0, Math.max(0, worldHeight - this.height));

        if (worldWidth < this.width) {
            this.x = 0;
        }
        if (worldHeight < this.height) {
            this.y = 0;
        }
    }

    clamp(value, min, max) {
        return Math.max(min, Math.min(value, max));
    }
}
