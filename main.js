const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const worldWidth = 1000, worldHeight = 1000;
let cameraX = 0, cameraY = 0;

// Function to load an image with a Promise
const loadImage = (src) => new Promise((resolve, reject) => {
  const img = new Image();
  img.src = src;
  img.onload = () => resolve(img);
  img.onerror = reject;
});

// Load assets with Promise.all
let professorSprite, idleSprite;
Promise.all([
  loadImage('professore-spritesheet.png'),
  loadImage('professore-idle.png')
]).then(([loadedProfessorSprite, loadedIdleSprite]) => {
  professorSprite = loadedProfessorSprite;
  idleSprite = loadedIdleSprite;
  console.log('All assets loaded');
  gameLoop();
}).catch(error => console.error('An asset failed to load', error));

// Resize canvas based on screen size
const resizeCanvas = () => {
  if (window.innerWidth < 768) {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight - document.getElementById('controls')?.offsetHeight || 0;
  } else {
    canvas.width = 800;
    canvas.height = 600;
  }
};
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Player object
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
  frameCount: 0,
};

const directions = { down: 0, left: 1, right: 2, up: 3 };
const keys = { ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false };

// Check if device is mobile
const isMobileDevice = () => window.innerWidth <= 768 || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

// Movement functions
const setDirection = (direction) => { professor.direction = direction; };
const move = () => {
  if (keys.ArrowRight) { professor.x = Math.min(professor.x + professor.speed, canvas.width - professor.width); setDirection('right'); }
  if (keys.ArrowLeft) { professor.x = Math.max(professor.x - professor.speed, 0); setDirection('left'); }
  if (keys.ArrowDown) { professor.y = Math.min(professor.y + professor.speed, canvas.height - professor.height); setDirection('down'); }
  if (keys.ArrowUp) { professor.y = Math.max(professor.y - professor.speed, 0); setDirection('up'); }
};

// Update function
const update = () => {
  const isMoving = Object.values(keys).some(Boolean);
  if (isMoving) {
    professor.frameCount = (professor.frameCount + 1) % professor.frameDelay;
    if (professor.frameCount === 0) professor.frame = (professor.frame + 1) % professor.totalFrames;
    move();
  } else professor.frame = 0;
};

// Draw function
const draw = () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const { frame, width, height, direction, x, y } = professor;
  const spriteX = frame * width;
  const spriteY = directions[direction] * height;
  const sprite = Object.values(keys).some(Boolean) ? professorSprite : idleSprite;

  const drawX = isMobileDevice() ? (canvas.width - width) / 2 : x;
  const drawY = isMobileDevice() ? (canvas.height - height) / 2 : y;
  ctx.drawImage(sprite, spriteX, spriteY, width, height, drawX, drawY, width, height);
};

// Control events for both mobile and desktop
const controlKeys = (key, value) => { if (keys.hasOwnProperty(key)) keys[key] = value; };
window.addEventListener('keydown', (e) => controlKeys(e.key, true));
window.addEventListener('keyup', (e) => controlKeys(e.key, false));

['up', 'down', 'left', 'right'].forEach(dir => {
  const element = document.getElementById(dir);
  element?.addEventListener('touchstart', () => controlKeys(`Arrow${dir.charAt(0).toUpperCase() + dir.slice(1)}`, true));
  element?.addEventListener('touchend', () => controlKeys(`Arrow${dir.charAt(0).toUpperCase() + dir.slice(1)}`, false));
});

// Main game loop
const gameLoop = () => {
  update();
  draw();
  requestAnimationFrame(gameLoop);
};
