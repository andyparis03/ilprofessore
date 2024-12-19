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

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.camera = new Camera(CONFIG.CANVAS.DEFAULT_WIDTH, CONFIG.CANVAS.DEFAULT_HEIGHT);
        
        // Initialize managers
        this.audioManager = new AudioManager();
        this.input = new InputHandler();
        this.scoreManager = new ScoreManager(this.ctx);
        this.gameState = new GameStateManager(this);
        
        this.setupCanvas();
        this.initialized = false;
        
        // Make game instance globally available
        window.gameInstance = this;
        
        // Set up event listeners
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
        if (this.initialized) return;

        try {
            console.log('Starting game initialization...');

            // Load assets first
            const assets = await AssetLoader.loadAssets();
            console.log('Assets loaded successfully');
            this.assets = assets;

            // Initialize audio
            await this.audioManager.init();
            console.log('Audio initialized');

            // Create player
            this.player = new Player(
                CONFIG.WORLD.WIDTH / 2,
                CONFIG.WORLD.HEIGHT / 2,
                CONFIG.PLAYER.WIDTH,
                CONFIG.PLAYER.HEIGHT,
                assets.sprites.professore,
                'professore'
            );

            // Initialize managers that depend on other components
            this.levelManager = new LevelManager(assets, this.gameState);
            this.renderer = new Renderer(this.ctx, this.levelManager, this.gameState);
            
            // Store renderer reference in gameState
            this.gameState.renderer = this.renderer;

            // Load initial level
            await this.levelManager.loadLevel(1, this.player);
            
            this.initialized = true;
            console.log('Game initialization complete');

            // Start game loop
            this.gameLoop();

        } catch (error) {
            console.error('Game initialization failed:', error);
            throw error;
        }
    }

    update() {
        if (!this.initialized) return;

        console.log('Game Update cycle start');

        if (!this.gameState.isGameOver) {
            // Update player
            this.player.update(this.input, {
                width: CONFIG.WORLD.WIDTH,
                height: CONFIG.WORLD.HEIGHT
            });

            // Update level and characters
            this.levelManager.update(
                this.player,
                {
                    width: CONFIG.WORLD.WIDTH,
                    height: CONFIG.WORLD.HEIGHT
                },
                this.input
            );

            // Check level transitions
            if (this.levelManager.checkLevelTransition(this.player)) {
                console.log(`Transitioned to Level ${this.levelManager.currentLevel}`);
            }

            // Update camera and audio
            this.camera.follow(this.player, CONFIG.WORLD.WIDTH, CONFIG.WORLD.HEIGHT);
            this.audioManager.handleFootsteps(this.player, !this.player.isIdle);
        }

        console.log('Game Update cycle complete');
    }

    draw() {
        if (!this.initialized) return;

        // Clear and draw background
        this.renderer.clear();
        this.renderer.drawBackground(this.levelManager.getCurrentLevelBackground(), this.camera);
        
        // Draw characters and player
        this.renderer.drawCharacters(this.assets.sprites, this.camera);
        this.renderer.drawPlayer(this.player, this.assets.sprites.professore, this.camera);
        
        // Draw UI elements
        this.scoreManager.draw();
        
        // Draw game over text if needed
        if (this.gameState.isGameOver) {
            console.log('Drawing game over state');
            this.renderer.drawGameOverText();
        }
    }

    gameLoop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Game startup
const startGame = async () => {
    const game = new Game();
    try {
        await game.init();
        console.log('Game started successfully');
    } catch (error) {
        console.error('Failed to start game:', error);
    }
};

startGame();