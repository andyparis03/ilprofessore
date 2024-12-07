// Suina1.js
import { BaseCharacter } from './BaseCharacter.js';

export class Suina1 extends BaseCharacter {
    constructor(x, y, width, height, sprites, type) {
        super(x, y, width, height, sprites, type, 1.5);
        this.moveTimer = 0;
        this.changeDirectionInterval = 1000;
        this.lastNonIdleDirection = 'down';
        this.isAttacking = false;
        this.attackTimeout = null;
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

    handleCollision() {
        if (this.isAttacking) return;

        this.isAttacking = true;
        this.sprites.current = this.sprites.attack;

        // Play the sound only once
        if (this.sprites.audioContext && this.sprites.suinaSound) {
            const soundSource = this.sprites.audioContext.createBufferSource();
            soundSource.buffer = this.sprites.suinaSound;
            soundSource.connect(this.sprites.audioContext.destination);
            soundSource.start();
        }

        // Revert to idle sprite after 1 second
        this.attackTimeout = setTimeout(() => {
            this.sprites.current = this.sprites.idle;
            this.isAttacking = false;
        }, 1000);
    }
}