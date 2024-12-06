// Suina1.js
import { BaseCharacter } from './BaseCharacter.js';

export class Suina1 extends BaseCharacter {
    constructor(x, y, width, height, sprites, type) {
        super(x, y, width, height, sprites, type, 1.5);
        this.moveTimer = 0;
        this.changeDirectionInterval = 1000;
        this.lastNonIdleDirection = 'down';
    }

    updateBehavior(player, worldBounds, deltaTime) {
        const currentTime = performance.now();
        if (currentTime - this.moveTimer > this.changeDirectionInterval) {
            this.randomizeDirection(worldBounds);
            this.moveTimer = currentTime;
        }

        const distance = Math.hypot(player.x - this.x, player.y - this.y);
        if (distance < 150) {
            this.runAwayFrom(player, deltaTime, worldBounds);
            this.isIdle = false;
        } else {
            // Attempt multiple moves; if no success, face away from the corner
            if (!this.attemptMultipleMoves(deltaTime, worldBounds, 3)) {
                this.goIdleFacingAwayFromCorner(worldBounds);
            }
        }
    }

    attemptMultipleMoves(deltaTime, worldBounds, attempts) {
        // Try current direction first
        if (this.moveRandomly(deltaTime, worldBounds)) {
            return true;
        }

        // If failed, try random directions for a given number of attempts
        for (let i = 0; i < attempts; i++) {
            this.randomizeDirection(worldBounds);
            if (this.moveRandomly(deltaTime, worldBounds)) {
                return true;
            }
        }
        return false;
    }

    randomizeDirection({ width, height }) {
        // Base directions including idle
        let directions = ['up', 'down', 'left', 'right', 'idle'];

        // Bias away from edges:
        const edgeBuffer = 50; // Distance from edge considered "near"
        const nearLeft = this.x < edgeBuffer;
        const nearRight = this.x > width - this.width - edgeBuffer;
        const nearTop = this.y < edgeBuffer;
        const nearBottom = this.y > height - this.height - edgeBuffer;

        // If near a border, remove or reduce likelihood of choosing that direction
        if (nearLeft) directions = directions.filter(d => d !== 'left');
        if (nearRight) directions = directions.filter(d => d !== 'right');
        if (nearTop) directions = directions.filter(d => d !== 'up');
        if (nearBottom) directions = directions.filter(d => d !== 'down');

        // If we removed all movement directions due to edges, keep at least one:
        if (directions.every(d => d === 'idle')) {
            // If all that’s left is idle, re-allow some directions to prevent being stuck
            directions = ['idle', 'up', 'down', 'left', 'right'];
        }

        const chosen = directions[Math.floor(Math.random() * directions.length)];

        if (chosen === 'idle') {
            this.isIdle = true;
            this.direction = this.lastNonIdleDirection;
        } else {
            this.isIdle = false;
            this.direction = chosen;
            this.lastNonIdleDirection = chosen;
        }
    }

    runAwayFrom(professore, deltaTime, { width, height }) {
        const dx = this.x - professore.x;
        const dy = this.y - professore.y;
        const angle = Math.atan2(dy, dx);

        const adjustedSpeed = this.speed * deltaTime;
        const oldX = this.x, oldY = this.y;

        this.x = Math.min(Math.max(this.x + Math.cos(angle) * adjustedSpeed, 0), width - this.width);
        this.y = Math.min(Math.max(this.y + Math.sin(angle) * adjustedSpeed, 0), height - this.height);

        this.isIdle = false;
        this.updateDirection(this.x - oldX, this.y - oldY);
        this.lastNonIdleDirection = this.direction;
    }

    moveRandomly(deltaTime, { width, height }) {
        const adjustedSpeed = this.speed * deltaTime;
        const oldX = this.x;
        const oldY = this.y;

        let moved = false;
        if (this.direction === 'up') {
            this.y = Math.max(this.y - adjustedSpeed, 0);
            moved = (this.y !== oldY);
        } else if (this.direction === 'down') {
            this.y = Math.min(this.y + adjustedSpeed, height - this.height);
            moved = (this.y !== oldY);
        } else if (this.direction === 'left') {
            this.x = Math.max(this.x - adjustedSpeed, 0);
            moved = (this.x !== oldX);
        } else if (this.direction === 'right') {
            this.x = Math.min(this.x + adjustedSpeed, width - this.width);
            moved = (this.x !== oldX);
        } else if (this.direction === 'idle') {
            moved = false;
        }

        if (!moved && this.direction !== 'idle') {
            return false;
        } else {
            this.isIdle = (this.direction === 'idle');
            if (!this.isIdle) {
                this.lastNonIdleDirection = this.direction;
            }
            return true;
        }
    }

    updateDirection(dx, dy) {
        if (Math.abs(dx) > Math.abs(dy)) {
            this.direction = dx > 0 ? 'right' : 'left';
        } else {
            this.direction = dy > 0 ? 'down' : 'up';
        }
    }

    goIdleFacingAwayFromCorner({ width, height }) {
        const nearTop = this.y < height / 2;
        const nearLeft = this.x < width / 2;

        let horizontalPref = nearLeft ? 'right' : 'left';
        let verticalPref = nearTop ? 'down' : 'up';

        const chosen = Math.random() < 0.5 ? horizontalPref : verticalPref;

        this.direction = chosen;
        this.isIdle = true;
        this.lastNonIdleDirection = chosen;
    }
}
