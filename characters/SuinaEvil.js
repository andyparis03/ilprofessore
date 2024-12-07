export class SuinaEvil {
    constructor(x, y, width, height, sprites) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.sprites = sprites || {}; // Placeholder sprites
        this.isIdle = true; // Placeholder state
    }

    update(player, worldBounds) {
        // No behavior yet
    }
}
