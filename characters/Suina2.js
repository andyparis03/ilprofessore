// Suina2.js
import { BaseCharacter } from './BaseCharacter.js';

export class Suina2 extends BaseCharacter {
    constructor(x, y, width, height, sprites, type) {
        super(x, y, width, height, sprites, type);
    }

    updateBehavior(player, worldBounds, deltaTime) {
        // Currently no special behavior: remains idle
        // If needed, add logic similar to Suina1 or other chars
        this.isIdle = true;
        this.direction = 'down';
    }
}
