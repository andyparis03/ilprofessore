// Canvas and Context Setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let cameraX = 0;
let cameraY = 0;
const worldWidth = 1000;
const worldHeight = 1000;

// Load sprites with Promise.all for clean asynchronous loading
const professorSprite = new Image();
professorSprite.src = 'professore-spritesheet.png';
const idleSprite = new Image();
idleSprite.src = 'professore-idle.png';

Promise.all([
  new Promise((resolve) => { professorSprite.onload = resolve; }),
  new Promise((resolve) => { idleSprite.onload = resolve; })
]).then(() => {
  console.log('Sprites loaded');
  gameLoop();
});

// Set canvas to full screen for mobile
function resizeCanvas() {
  if (window.innerWidth < 768) { // mobile view
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight - document.getElementById('controls').offsetHeight;
  } else { // desktop view
    canvas.width = 800;
    canvas.height = 600;
  }
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Helper function to reset all keys
function resetKeys() {
  keys.ArrowUp = keys.ArrowDown = keys.ArrowLeft = keys.ArrowRight = false;
}

// Define the player (Il Professore) object
const professor = {
  x: canvas.width / 2 - 34,
  y: canvas.height / 2 - 34,
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
const directions = { down: 0, left: 1, right: 2, up: 3 };

// Track keys and touch events
const keys = { ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false };

// Mobile controls using pointer events or touch events
const controlEvents = window.PointerEvent ? { start: 'pointerdown', end: 'pointerup' } : { start: 'touchstart', end: 'touchend' };

document.getElementById('up').addEventListener(controlEvents.start, () => { resetKeys(); keys.ArrowUp = true; });
document.getElementById('up').addEventListener(controlEvents.end, () => keys.ArrowUp = false);

document.getElementById('down').addEventListener(controlEvents.start, () => { resetKeys(); keys.ArrowDown = true; });
document.getElementById('down').addEventListener(controlEvents.end, () => keys.ArrowDown = false);

document.getElementById('left').addEventListener(controlEvents.start, () => { resetKeys(); keys.ArrowLeft = true; });
document.getElementById('left').addEventListener(controlEvents.end, () => keys.ArrowLeft = false);

document.getElementById('right').addEventListener(controlEvents.start, () => { resetKeys(); keys.ArrowRight = true; });
document.getElementById('right').addEventListener(controlEvents.end, () => keys.ArrowRight = false);

window.addEventListener('blur', resetKeys);  // Reset keys if the window loses focus

// Update function
function update() {
  const isMoving = keys.ArrowRight || keys.ArrowLeft || keys.ArrowDown || keys.ArrowUp;

  if (isMoving) {
    professor.frameCount++;
    if (professor.frameCount >= professor.frameDelay) {
      professor.frameCount = 0;
      professor.frame = (professor.frame + 1) % professor.totalFrames;
    }

    // Mobile-specific movement logic
    if (isMobileDevice()) {
      if (keys.ArrowRight) {
        cameraX = Math.min(cameraX + professor.speed, worldWidth - canvas.width / 2);
        professor.direction = 'right';
      } else if (keys.ArrowLeft) {
        cameraX = Math.max(cameraX - professor.speed, canvas.width / 2 - professor.width / 2);
        professor.direction = 'left';
      } else if (keys.ArrowDown) {
        cameraY = Math.min(cameraY + professor.speed, worldHeight - canvas.height / 2);
        professor.direction = 'down';
      } else if (keys.ArrowUp) {
        cameraY = Math.max(cameraY - professor.speed, canvas.height / 2 - professor.height / 2);
        professor.direction = 'up';
      }
    }

  } else {
    professor.frame = 0; // Reset to the idle frame if not moving
  }
}

// Draw function
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const isMoving = keys.ArrowRight || keys.ArrowLeft || keys.ArrowDown || keys.ArrowUp;

  // Calculate the correct sprite based on direction
  const spriteX = professor.frame * professor.width;
  const spriteY = directions[professor.direction] * professor.height;

  if (isMobileDevice()) {
    // Centered on mobile
    if (isMoving) {
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
        canvas.width / 2 - professor.width / 2,
        canvas.height / 2 - professor.height / 2,
        professor.width, professor.height
      );
    }
  } else {
    // Position normally on PC
    if (isMoving) {
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

// Utility to detect if on mobile device
function isMobileDevice() {
  return window.innerWidth <= 768 || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}
