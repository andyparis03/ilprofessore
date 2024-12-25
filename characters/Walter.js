// Walter.js
import { BaseCharacter } from './BaseCharacter.js';

export class Walter extends BaseCharacter {
    constructor(x, y, width, height, sprites, type) {
        super(x, y, width, height, sprites, type, 3.0);
        
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
    }


updateBehavior(player, worldBounds, deltaTime, input) {
    if (this.isPaused || !this.isVisible) return;

    const isCollidingNow = this.checkCollision(player);

    if (!isCollidingNow && this.isColliding) {
        this.isColliding = false;
        this.soundPlayed = false;
        this.resetMovement();
    }

    if (isCollidingNow && !this.isColliding && !this.energyGiven) {
        // Collision handling remains the same...
    }

    if (!this.isColliding) {
        const distance = Math.hypot(player.x - this.x, player.y - this.y);
        if (distance < 200) {  // Increased detection range
            this.runAwayFrom(player, deltaTime, worldBounds);
            this.isIdle = false;
        } else {
            this.moveRandomly(deltaTime, worldBounds);
        }
    }
}


// Walter.js
runAwayFrom(player, deltaTime, worldBounds) {
    const dx = this.x - player.x;
    const dy = this.y - player.y;
    const angle = Math.atan2(dy, dx);
    
    const distance = Math.hypot(dx, dy);
    const speedMultiplier = distance < 100 ? 2.0 : 1.5;
    const adjustedSpeed = this.speed * deltaTime * speedMultiplier;

    // Edge and corner detection
    const cornerBuffer = 100;
    const nearLeftWall = this.x < cornerBuffer;
    const nearRightWall = this.x > worldBounds.width - cornerBuffer;
    const nearTopWall = this.y < cornerBuffer;
    const nearBottomWall = this.y > worldBounds.height - cornerBuffer;

    let newX = this.x;
    let newY = this.y;

    // Check if in corner
    const inCorner = (nearLeftWall && nearTopWall) || 
                    (nearLeftWall && nearBottomWall) ||
                    (nearRightWall && nearTopWall) ||
                    (nearRightWall && nearBottomWall);

    if (inCorner) {
        // Move diagonally away from corner
        const centerX = worldBounds.width / 2;
        const centerY = worldBounds.height / 2;
        const escapeAngle = Math.atan2(centerY - this.y, centerX - this.x);
        
        newX = this.x + Math.cos(escapeAngle) * adjustedSpeed * 2;
        newY = this.y + Math.sin(escapeAngle) * adjustedSpeed * 2;
    } else {
        // Normal escape movement
        newX += Math.cos(angle) * adjustedSpeed;
        newY += Math.sin(angle) * adjustedSpeed;

        // Enhanced edge handling
        if (nearLeftWall) newX += adjustedSpeed;
        if (nearRightWall) newX -= adjustedSpeed;
        if (nearTopWall) newY += adjustedSpeed;
        if (nearBottomWall) newY -= adjustedSpeed;
    }

    // Apply position with constraints
    this.x = Math.min(Math.max(newX, cornerBuffer), worldBounds.width - cornerBuffer);
    this.y = Math.min(Math.max(newY, cornerBuffer), worldBounds.height - cornerBuffer);

    // Update direction
    const actualDX = this.x - this.lastX;
    const actualDY = this.y - this.lastY;
    if (Math.abs(actualDX) > 0.5 || Math.abs(actualDY) > 0.5) {
        this.updateDirection(actualDX, actualDY);
        this.isIdle = false;
        this.stuckTimer = 0;
    }

    this.lastX = this.x;
    this.lastY = this.y;
}



moveRandomly(deltaTime, worldBounds) {
    const adjustedSpeed = this.speed * deltaTime * 0.8;  // Slower random movement
    const cornerBuffer = 100;
    const oldX = this.x;
    const oldY = this.y;

    let newX = this.x;
    let newY = this.y;

    // More gradual direction changes
    const now = performance.now();
    if (now - this.lastDirectionChange > 1500) {  // Longer intervals
        this.randomizeDirection(worldBounds);
        this.lastDirectionChange = now;
    }

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

    this.x = Math.min(Math.max(newX, cornerBuffer), worldBounds.width - cornerBuffer);
    this.y = Math.min(Math.max(newY, cornerBuffer), worldBounds.height - cornerBuffer);

    if (Math.abs(this.x - oldX) > 0.1 || Math.abs(this.y - oldY) > 0.1) {
        this.isIdle = false;
        this.lastNonIdleDirection = this.direction;
    }
}

resetMovement() {
    this.direction = this.lastNonIdleDirection;
    this.stuckTimer = 0;
    this.isIdle = false;
}



   updateDirection(dx, dy) {
       const minThreshold = 0.5;
       
       if (Math.abs(dx) < minThreshold && Math.abs(dy) < minThreshold) {
           return;
       }

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