const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');



let cameraX = 0;
let cameraY = 0;
const worldWidth = 1000;
const worldHeight = 1000;

// Load sprites
const professorSprite = new Image();
professorSprite.src = 'professore-spritesheet.png';

const idleSprite = new Image();
idleSprite.src = 'professore-idle.png';

// Start the game loop once sprites are fully loaded
professorSprite.onload = () => {
  idleSprite.onload = () => {
    gameLoop();
  };
};

// Set canvas to full screen for mobile
function resizeCanvas() {
  if (window.innerWidth < 768) {  // mobile view
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  } else {  // desktop view
    canvas.width = 800;  // or your desired desktop width
    canvas.height = 600; // or your desired desktop height
  }
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

////////

function moveLeft() {
  player.vx = -player.speed;  // Example setting velocity
}

function moveRight() {
  player.vx = player.speed;
}

function moveUp() {
  player.vy = -player.speed;
}

function moveDown() {
  player.vy = player.speed;
}

function stopMovement() {
  player.vx = 0;
  player.vy = 0;
}

////////

// Define the player (Il Professore) object
const professor = {
  x: canvas.width / 2 - 34, // Centered horizontally for 68x68 size
  y: canvas.height / 2 - 34, // Centered vertically for 68x68 size
  width: 68,
  height: 68,
  speed: 2,
  direction: 'down',
  frame: 0,
  totalFrames: 4,
  frameDelay: 4,
  frameCount: 0
};

// Movement directions
const directions = {
  down: 0,
  left: 1,
  right: 2,
  up: 3
};

// Track keys and touch events
const keys = { ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false };

// Touch control event listeners
document.getElementById('up').addEventListener('touchstart', () => keys.ArrowUp = true);
document.getElementById('up').addEventListener('touchend', () => keys.ArrowUp = false);

document.getElementById('down').addEventListener('touchstart', () => keys.ArrowDown = true);
document.getElementById('down').addEventListener('touchend', () => keys.ArrowDown = false);

document.getElementById('left').addEventListener('touchstart', () => keys.ArrowLeft = true);
document.getElementById('left').addEventListener('touchend', () => keys.ArrowLeft = false);

document.getElementById('right').addEventListener('touchstart', () => keys.ArrowRight = true);
document.getElementById('right').addEventListener('touchend', () => keys.ArrowRight = false);


// Example: Add touch events for each button if on a mobile screen
if (window.innerWidth < 768) {  // Check if on mobile device (optional)
  document.getElementById('left-button').addEventListener('touchstart', () => moveLeft());
  document.getElementById('right-button').addEventListener('touchstart', () => moveRight());
  document.getElementById('up-button').addEventListener('touchstart', () => moveUp());
  document.getElementById('down-button').addEventListener('touchstart', () => moveDown());

  document.getElementById('left-button').addEventListener('touchend', stopMovement);
  document.getElementById('right-button').addEventListener('touchend', stopMovement);
  document.getElementById('up-button').addEventListener('touchend', stopMovement);
  document.getElementById('down-button').addEventListener('touchend', stopMovement);
}


// Keyboard controls for desktop testing
window.addEventListener('keydown', (e) => { if (e.key in keys) keys[e.key] = true; });
window.addEventListener('keyup', (e) => { if (e.key in keys) keys[e.key] = false; });

function isMobileDevice() {
  return window.innerWidth <= 768 || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}


// Update function
function update() {
  const isMoving = keys.ArrowRight || keys.ArrowLeft || keys.ArrowDown || keys.ArrowUp;

  if (isMoving) {
    professor.frameCount++;
    if (professor.frameCount >= professor.frameDelay) {
      professor.frameCount = 0;
      professor.frame = (professor.frame + 1) % professor.totalFrames;
    }

    // Adjust camera only if on mobile
    if (isMobileDevice()) {
      if (keys.ArrowRight) { cameraX += professor.speed; professor.direction = 'right'; }
      if (keys.ArrowLeft) { cameraX -= professor.speed; professor.direction = 'left'; }
      if (keys.ArrowDown) { cameraY += professor.speed; professor.direction = 'down'; }
      if (keys.ArrowUp) { cameraY -= professor.speed; professor.direction = 'up'; }

      // Optional: Limit camera position to world boundaries
      cameraX = Math.max(0, Math.min(cameraX, worldWidth - canvas.width));
      cameraY = Math.max(0, Math.min(cameraY, worldHeight - canvas.height));
    } else {
      // If on PC, update `professor.x` and `professor.y` directly
      if (keys.ArrowRight) { professor.x += professor.speed; professor.direction = 'right'; }
      if (keys.ArrowLeft) { professor.x -= professor.speed; professor.direction = 'left'; }
      if (keys.ArrowDown) { professor.y += professor.speed; professor.direction = 'down'; }
      if (keys.ArrowUp) { professor.y -= professor.speed; professor.direction = 'up'; }
    }
  } else {
    professor.frame = 0; // Reset to the idle frame
  }
}



// Draw function
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const isMoving = keys.ArrowRight || keys.ArrowLeft || keys.ArrowDown || keys.ArrowUp;

  if (isMobileDevice()) {
    // Centered on mobile
    if (isMoving) {
      const spriteX = professor.frame * professor.width;
      const spriteY = directions[professor.direction] * professor.height;
      ctx.drawImage(
        professorSprite,
        spriteX, spriteY, professor.width, professor.height,
        canvas.width / 2 - professor.width / 2, // Center X
        canvas.height / 2 - professor.height / 2, // Center Y
        professor.width, professor.height
      );
    } else {
      ctx.drawImage(
        idleSprite,
        canvas.width / 2 - professor.width / 2, // Center X
        canvas.height / 2 - professor.height / 2, // Center Y
        professor.width, professor.height
      );
    }
  } else {
    // Position normally on PC
    if (isMoving) {
      const spriteX = professor.frame * professor.width;
      const spriteY = directions[professor.direction] * professor.height;
      ctx.drawImage(
        professorSprite,
        spriteX, spriteY, professor.width, professor.height,
        professor.x, professor.y,
        professor.width, professor.height
      );
    } else {
      ctx.drawImage(
        idleSprite,
        professor.x, professor.y,
        professor.width, professor.height
      );
    }
  }
}




// Game loop
function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}


