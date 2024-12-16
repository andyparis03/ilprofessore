// Suina2.js
import { BaseCharacter } from './BaseCharacter.js';

export class Suina2 extends BaseCharacter {
    constructor(x, y, width, height, sprites, type) {
        super(x, y, width, height, sprites, type);
        this.lastBehaviorUpdate = performance.now();
    }

    updateBehavior(player, worldBounds, deltaTime, input) {
        if (this.isPaused) return;
        
        const currentTime = performance.now();
        this.lastBehaviorUpdate = currentTime;
        
        // Currently remains idle - future behavior can be added here
        this.isIdle = true;
        this.direction = 'down';
    }

    cleanup() {
        super.cleanup();
        // Add any Suina2-specific cleanup here
    }
}