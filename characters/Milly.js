// Milly.js
import { BaseCharacter } from './BaseCharacter.js';

export class Milly extends BaseCharacter {
    constructor(x, y, width, height, sprites, type) {
        super(x, y, width, height, sprites, type);
    }

    updateBehavior(player, worldBounds, deltaTime) {
        // Placeholder: remains idle
        this.isIdle = true;
        this.direction = 'down';
    }
}
