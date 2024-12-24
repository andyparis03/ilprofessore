// Walter.js
import { BaseCharacter } from './BaseCharacter.js';
import { CONFIG } from '../config.js';

export class Walter extends BaseCharacter {
   constructor(x, y, width, height, sprites, type) {
       // Fast base speed
       super(x, y, width, height, sprites, type, 2.0);
       
       const now = performance.now();
       
       this.moveTimer = now;
       this.changeDirectionInterval = 1200; 
       this.lastNonIdleDirection = 'down';
       this.lastUpdateTime = now;
       this.frameTime = now;
       this.movementBuffer = { x: 0, y: 0 };
       this.velocity = { x: 0, y: 0 };
       this.lastX = x;
       this.lastY = y;
       this.stuckTimer = 0;
       this.directionChangeCount = 0;
       this.lastDirectionChange = now;

       this.frame = 0;
       this.isIdle = false;
       this.direction = 'down';
       
       this.isColliding = false;
       this.soundPlayed = false;
       this.isVisible = true;
       this.energyGiven = false;
       
       this.initialSpawn = true;
   }

   repositionNearPlayer(player) {
       if (!this.initialSpawn) return;
       
       const spawnDistance = 80;
       const angle = Math.random() * Math.PI * 2;
       
       this.x = player.x + Math.cos(angle) * spawnDistance;
       this.y = player.y + Math.sin(angle) * spawnDistance;
       
       // Keep within bounds
       this.x = Math.min(Math.max(this.x, 100), CONFIG.WORLD.WIDTH - this.width - 100);
       this.y = Math.min(Math.max(this.y, 100), CONFIG.WORLD.HEIGHT - this.height - 100);
       
       this.initialSpawn = false;
       this.isIdle = false;
   }

   updateBehavior(player, worldBounds, deltaTime, input) {
       if (this.isPaused || !this.isVisible) return;

       if (this.initialSpawn) {
           this.repositionNearPlayer(player);
       }

       const isCollidingNow = this.checkCollision(player);

       // Reset collision state when no longer colliding
       if (!isCollidingNow && this.isColliding) {
           this.isColliding = false;
           this.soundPlayed = false;
           this.forceMovementReset(worldBounds);
       }

       if (isCollidingNow && !this.isColliding && !this.energyGiven) {
           const gameInstance = window.gameInstance;
           
           if (!this.soundPlayed && gameInstance?.audioManager) {
               gameInstance.audioManager.playSound('walter_sound');
               this.soundPlayed = true;
           }

           if (gameInstance?.scoreManager) {
               gameInstance.scoreManager.increaseScore('energy', 30);
               this.energyGiven = true;
           }

           this.isColliding = true;
           this.velocity = { x: 0, y: 0 };
           this.movementBuffer = { x: 0, y: 0 };
           this.isIdle = true;
       }

       if (!this.isColliding) {
           const distance = Math.hypot(player.x - this.x, player.y - this.y);
           if (distance < 250) {
               this.runAwayFrom(player, deltaTime, worldBounds);
               this.isIdle = false;
           } else {
               this.moveRandomly(deltaTime, worldBounds);
           }
       }
   }

   forceMovementReset(worldBounds) {
       this.stuckTimer = 0;
       this.isIdle = false;
       
       // Move towards center
       const centerX = worldBounds.width / 2;
       const centerY = worldBounds.height / 2;
       
       const dx = centerX - this.x;
       const dy = centerY - this.y;
       const angle = Math.atan2(dy, dx);
       
       if (Math.abs(Math.cos(angle)) > Math.abs(Math.sin(angle))) {
           this.direction = Math.cos(angle) > 0 ? 'right' : 'left';
       } else {
           this.direction = Math.sin(angle) > 0 ? 'down' : 'up';
       }
       
       this.velocity = { x: this.speed, y: this.speed };
       this.movementBuffer = { x: 0, y: 0 };
       this.lastDirectionChange = performance.now();
   }

 


runAwayFrom(player, deltaTime, worldBounds) {
    const dx = this.x - player.x;
    const dy = this.y - player.y;
    let angle = Math.atan2(dy, dx);
    const adjustedSpeed = this.speed * deltaTime * 3.0; // Increased speed

    const cornerBuffer = 120;

    // Store old position
    const oldX = this.x;
    const oldY = this.y;

    // Forced directional change when stuck
    if (this.stuckTimer > 0) {
        // Rotate angle by 90 degrees when stuck
        angle += Math.PI/2;
        this.stuckTimer = 0;
    }

    // Calculate new position with minimum movement
    const minMove = 5.0;
    const moveAmount = Math.max(adjustedSpeed, minMove);
    const newX = this.x + Math.cos(angle) * moveAmount;
    const newY = this.y + Math.sin(angle) * moveAmount;

    // Apply movement with boundary checks
    this.x = Math.min(Math.max(newX, cornerBuffer), worldBounds.width - this.width - cornerBuffer);
    this.y = Math.min(Math.max(newY, cornerBuffer), worldBounds.height - this.height - cornerBuffer);

    // Check if actually moved
    const hasMoved = Math.abs(this.x - oldX) > 0.5 || Math.abs(this.y - oldY) > 0.5;
    
    if (!hasMoved) {
        this.stuckTimer += deltaTime * 16.67;
    }

    this.updateDirection(this.x - oldX, this.y - oldY);
    this.isIdle = false;
}


   moveRandomly(deltaTime, worldBounds) {
       const adjustedSpeed = this.speed * deltaTime;
       const cornerBuffer = 120;
       const oldX = this.x;
       const oldY = this.y;

       let newX = this.x;
       let newY = this.y;

       // Basic 4-direction movement
       switch (this.direction) {
           case 'up':
               newY = this.y - adjustedSpeed;
               break;
           case 'down':
               newY = this.y + adjustedSpeed;
               break;
           case 'left':
               newX = this.x - adjustedSpeed;
               break;
           case 'right':
               newX = this.x + adjustedSpeed;
               break;
       }

       // Keep in bounds
       this.x = Math.min(Math.max(newX, cornerBuffer), worldBounds.width - this.width - cornerBuffer);
       this.y = Math.min(Math.max(newY, cornerBuffer), worldBounds.height - this.height - cornerBuffer);

       // Check if actually moved
       const moved = (Math.abs(this.x - oldX) > 0.1 || Math.abs(this.y - oldY) > 0.1);

       if (moved) {
           this.isIdle = false;
           this.lastNonIdleDirection = this.direction;
           this.stuckTimer = 0;
       } else {
           this.stuckTimer += deltaTime * 16.67;
           if (this.stuckTimer > 400) {
               this.randomizeDirection(worldBounds);
               this.stuckTimer = 0;
           }
       }
   }

   updateDirection(dx, dy) {
       // Require minimum movement for direction change
       const minThreshold = 0.5;
       
       if (Math.abs(dx) < minThreshold && Math.abs(dy) < minThreshold) {
           return;
       }

       // Use dominant axis for direction
       if (Math.abs(dx) > Math.abs(dy) * 1.5) {
           this.direction = dx > 0 ? 'right' : 'left';
       } else if (Math.abs(dy) > Math.abs(dx) * 1.5) {
           this.direction = dy > 0 ? 'down' : 'up';
       }
       this.lastNonIdleDirection = this.direction;
   }

   randomizeDirection(worldBounds) {
       const directions = ['up', 'down', 'left', 'right'];
       const currentIndex = directions.indexOf(this.direction);
       
       // Avoid same or opposite direction
       if (currentIndex !== -1) {
           directions.splice(currentIndex, 1);
           const oppositeIndex = (currentIndex + 2) % 4;
           if (oppositeIndex < directions.length) {
               directions.splice(oppositeIndex, 1);
           }
       }
       
       const newDirection = directions[Math.floor(Math.random() * directions.length)];
       this.direction = newDirection;
       this.lastNonIdleDirection = newDirection;
       this.isIdle = false;
   }

   cleanup() {
       this.isColliding = false;
       this.soundPlayed = false;
       this.energyGiven = false;
       super.cleanup();
   }
}