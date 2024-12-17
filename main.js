// main.js
import { CONFIG } from './config.js';
import { Camera } from './js/engine/Camera.js';
import { InputHandler } from './js/engine/Input.js';
import { Player } from './characters/Player.js';
import { Renderer } from './js/engine/Renderer.js';
import { AssetLoader } from './utils/AssetLoader.js';
import { AudioManager } from './js/engine/AudioManager.js';
import { LevelManager } from './levels/LevelManager.js';
import { ScoreManager } from './js/engine/ScoreManager.js';
import { GameStateManager } from './js/engine/GameStateManager.js';

const audioManager = new AudioManager();
let gameInitialized = false;

// Listen for initial game start
const startGameListener = async (event) => {
    if (!gameInitialized) {
        try {
            if (!audioManager.initialized) {
                await audioManager.init();
            }
            console.log('Starting the game...');
            game.init();
            gameInitialized = true;
            
            // Remove the event listeners once game is started
            window.removeEventListener('click', startGameListener);
            window.removeEventListener('touchstart', startGameListener);
        } catch (error) {
            console.error('Error initializing the game:', error);
        }
    }
};

// Add listeners for initial game start only
window.addEventListener('click', startGameListener);
window.addEventListener('touchstart', startGameListener);

// Prevent unwanted touch behaviors
window.addEventListener('touchmove', (event) => {
    event.preventDefault();
}, { passive: false });

window.addEventListener('gesturestart', (event) => {
    event.preventDefault();
}, { passive: false });

window.addEventListener('gesturechange', (event) => {
    event.preventDefault();
}, { passive: false });

window.addEventListener('gestureend', (event) => {
    event.preventDefault();
}, { passive: false });

function toggleControls() {
    const controlsContainer = document.getElementById('controls-container');
    if (window.innerWidth <= CONFIG.CANVAS.MOBILE_BREAKPOINT) {
        controlsContainer.style.display = 'flex';
    } else {
        controlsContainer.style.display = 'none';
    }
}

window.addEventListener('load', toggleControls);
window.addEventListener('resize', toggleControls);

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.camera = new Camera(CONFIG.CANVAS.DEFAULT_WIDTH, CONFIG.CANVAS.DEFAULT_HEIGHT);
        this.setupCanvas();

        this.input = new InputHandler();
        this.audioManager = audioManager;
        this.scoreManager = new ScoreManager(this.ctx);
        this.gameState = new GameStateManager(this);  // Initialize GameState first

        this.player = new Player(
            CONFIG.WORLD.WIDTH / 2,
            CONFIG.WORLD.HEIGHT / 2,
            CONFIG.PLAYER.WIDTH,
            CONFIG.PLAYER.HEIGHT,
            null,
            'professore'
        );

        window.gameInstance = this;
        window.addEventListener('resize', () => this.setupCanvas());
    }

    setupCanvas() {
        const isMobile = window.innerWidth <= CONFIG.CANVAS.MOBILE_BREAKPOINT;
        if (isMobile) {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
            this.canvas.style.width = '100%';
            this.canvas.style.height = '100%';
        } else {
            this.canvas.width = CONFIG.CANVAS.DEFAULT_WIDTH;
            this.canvas.height = CONFIG.CANVAS.DEFAULT_HEIGHT;
            this.canvas.style.width = `${CONFIG.CANVAS.DEFAULT_WIDTH}px`;
            this.canvas.style.height = `${CONFIG.CANVAS.DEFAULT_HEIGHT}px`;
            this.canvas.style.position = 'absolute';
            this.canvas.style.top = '50%';
            this.canvas.style.left = '50%';
            this.canvas.style.transform = 'translate(-50%, -50%)';
        }
        this.camera.width = this.canvas.width;
        this.camera.height = this.canvas.height;
    }

     async init() {
        try {
            const assets = await AssetLoader.loadAssets();
            console.log('Loaded assets:', assets);
            this.assets = assets;
            this.player.sprites = assets.sprites.professore;

            this.levelManager = new LevelManager(assets, this.gameState);  // Pass gameState here
            this.renderer = new Renderer(this.ctx, this.levelManager, this.gameState);  // Pass gameState to renderer too

            await this.audioManager.init();

            // Load Level 1 and pass the player object
            this.levelManager.loadLevel(1, this.player);
            this.gameLoop();
        } catch (error) {
            console.error('Game initialization failed:', error);
        }
    }

update() {
        console.log('Game Update cycle start');
        
        this.player.update(this.input, {
            width: CONFIG.WORLD.WIDTH,
            height: CONFIG.WORLD.HEIGHT
        });

        this.levelManager.update(
            this.player,
            {
                width: CONFIG.WORLD.WIDTH,
                height: CONFIG.WORLD.HEIGHT
            },
            this.input
        );

        console.log('Game Update cycle complete');

        if (this.levelManager.checkLevelTransition(this.player)) {
            console.log(`Transitioned to Level ${this.levelManager.currentLevel}`);
        }

        this.camera.follow(this.player, CONFIG.WORLD.WIDTH, CONFIG.WORLD.HEIGHT);
        this.audioManager.handleFootsteps(this.player, !this.player.isIdle);
    }



    draw() {
        this.renderer.clear();
        this.renderer.drawBackground(this.levelManager.getCurrentLevelBackground(), this.camera);
        this.renderer.drawCharacters(this.assets.sprites, this.camera);
        this.renderer.drawPlayer(this.player, this.assets.sprites.professore, this.camera);
        
        // Draw score bars last so they're always on top
        this.scoreManager.draw();
    }

    gameLoop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
}

const game = new Game();
game.init().catch(console.error);