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
        const edgeBuffer = 50; 
        const cornerBuffer = 80; // Off-limit zone: 80x80 pixels around each corner
        const nearLeft = this.x < edgeBuffer;
        const nearRight = this.x > width - this.width - edgeBuffer;
        const nearTop = this.y < edgeBuffer;
        const nearBottom = this.y > height - this.height - edgeBuffer;

        // Determine if we are inside an off-limit corner zone
        const inTopLeftCorner = (this.x < cornerBuffer && this.y < cornerBuffer);
        const inTopRightCorner = (this.x > width - cornerBuffer - this.width && this.y < cornerBuffer);
        const inBottomLeftCorner = (this.x < cornerBuffer && this.y > height - cornerBuffer - this.height);
        const inBottomRightCorner = (this.x > width - cornerBuffer - this.width && this.y > height - cornerBuffer - this.height);

        let directions;

        // If inside a forbidden corner zone, force directions away from it
        if (inTopLeftCorner) {
            directions = ['right', 'down'];
        } else if (inTopRightCorner) {
            directions = ['left', 'down'];
        } else if (inBottomLeftCorner) {
            directions = ['right', 'up'];
        } else if (inBottomRightCorner) {
            directions = ['left', 'up'];
        } else {
            // Not in a forbidden zone, proceed with normal logic plus idle
            directions = ['up', 'down', 'left', 'right', 'idle'];

            // Remove directions leading directly into edges if near them
            if (nearLeft) directions = directions.filter(d => d !== 'left');
            if (nearRight) directions = directions.filter(d => d !== 'right');
            if (nearTop) directions = directions.filter(d => d !== 'up');
            if (nearBottom) directions = directions.filter(d => d !== 'down');

            // If all that’s left is idle, reintroduce all directions
            if (directions.every(d => d === 'idle')) {
                directions = ['idle', 'up', 'down', 'left', 'right'];
            }

            // Avoid directions that would lead into a forbidden corner zone
            directions = this.filterDirectionsAvoidingForbiddenZones(directions, { width, height, cornerBuffer });
        }

        const chosen = directions[Math.floor(Math.random() * directions.length)];

        // FIX FOR POINT 1 (Idle State vs. Direction):
        // If idle is chosen, just set isIdle = true and do NOT overwrite direction 
        // with lastNonIdleDirection. This ensures no logical contradiction.
        if (chosen === 'idle') {
            this.isIdle = true;
            // Keep the current direction as is; direction now represents facing, not movement.
            // Do not change direction here to avoid contradictory states.
        } else {
            this.isIdle = false;
            this.direction = chosen;
            this.lastNonIdleDirection = chosen;
        }
    }

    filterDirectionsAvoidingForbiddenZones(directions, { width, height, cornerBuffer }) {
        return directions.filter(dir => {
            let testX = this.x;
            let testY = this.y;
            const testStep = 10; // A small step to test future position
            switch (dir) {
                case 'up': testY -= testStep; break;
                case 'down': testY += testStep; break;
                case 'left': testX -= testStep; break;
                case 'right': testX += testStep; break;
                case 'idle':
                    // Idle won't move into a forbidden zone by itself, keep it
                    return true;
            }

            const inTopLeft = testX < cornerBuffer && testY < cornerBuffer;
            const inTopRight = testX > width - cornerBuffer - this.width && testY < cornerBuffer;
            const inBottomLeft = testX < cornerBuffer && testY > height - cornerBuffer - this.height;
            const inBottomRight = testX > width - cornerBuffer - this.width && testY > height - cornerBuffer - this.height;

            // If moving in that direction puts us in a forbidden zone, exclude it
            return !(inTopLeft || inTopRight || inBottomLeft || inBottomRight);
        });
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

        // If no actual movement occurred, return false to allow further attempts.
        if (!moved) {
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
