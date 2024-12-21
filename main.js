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
        
        // Core systems initialization with verified state
        this.initializationState = {
            audio: false,
            assets: false,
            player: false,
            levelManager: false,
            renderer: false
        };

        // Core components (initially null)
        this.camera = null;
        this.input = null;
        this.audioManager = null;
        this.scoreManager = null;
        this.gameState = null;
        this.renderer = null;
        this.levelManager = null;
        this.player = null;
        
        // Make game instance globally available immediately
        window.gameInstance = this;
        
        // Initialize core systems
        this.setupCoreSystems();
        
        // State tracking
        this.initialized = false;
        this.assetsLoaded = false;
        
        // Performance monitoring
        this.lastUpdateTime = performance.now();
        this.frameCount = 0;
        this.fps = 0;
        this.fpsUpdateInterval = 1000;
        this.lastFpsUpdate = performance.now();
    }

    setupCoreSystems() {
        // Initialize core components
        this.camera = new Camera(CONFIG.CANVAS.DEFAULT_WIDTH, CONFIG.CANVAS.DEFAULT_HEIGHT);
        this.input = new InputHandler();
        this.audioManager = new AudioManager();
        this.scoreManager = new ScoreManager(this.ctx);
        this.gameState = new GameStateManager(this);

        // Set up canvas and event listeners
        this.setupCanvas();
        window.addEventListener('resize', () => this.setupCanvas());
    }


setupCanvas() {
        const isMobile = window.innerWidth <= CONFIG.CANVAS.MOBILE_BREAKPOINT;
        
        if (isMobile) {
            // Calculate height while maintaining aspect ratio
            const aspectRatio = CONFIG.WORLD.WIDTH / CONFIG.WORLD.HEIGHT;
            const targetWidth = window.innerWidth;
            const targetHeight = targetWidth / aspectRatio;

            this.canvas.width = targetWidth;
            this.canvas.height = targetHeight;
            this.canvas.style.width = '100%';
            this.canvas.style.height = `${targetHeight}px`;
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
        
        if (this.camera) {
            this.camera.width = CONFIG.WORLD.WIDTH;
            this.camera.height = CONFIG.WORLD.HEIGHT;
        }
    }

    async initAudio() {
        try {
            console.log('Initializing audio system...');
            await this.audioManager.init();
            this.initializationState.audio = true;
            console.log('Audio system initialized successfully');
        } catch (error) {
            console.error('Audio initialization failed:', error);
            this.initializationState.audio = false;
            throw new Error('Audio initialization failed');
        }
    }

    async loadGameAssets() {
        try {
            console.log('Loading game assets...');
            const assets = await AssetLoader.loadAssets();
            this.assets = assets;
            this.assetsLoaded = true;
            this.initializationState.assets = true;
            console.log('Game assets loaded successfully');
            return assets;
        } catch (error) {
            console.error('Asset loading failed:', error);
            this.initializationState.assets = false;
            throw new Error('Asset loading failed');
        }
    }

    async init() {
        if (this.initialized) {
            console.warn('Game already initialized');
            return;
        }

        try {
            console.log('Starting game initialization sequence...');

            // Step 1: Initialize audio system
            await this.initAudio();
            
            // Verify audio initialization
            if (!this.audioManager.initialized) {
                throw new Error('Audio system failed to initialize properly');
            }

            // Step 2: Load game assets
            const assets = await this.loadGameAssets();
            
            // Step 3: Initialize player
            this.player = new Player(
                CONFIG.WORLD.WIDTH / 2,
                CONFIG.WORLD.HEIGHT / 2,
                CONFIG.PLAYER.WIDTH,
                CONFIG.PLAYER.HEIGHT,
                assets.sprites.professore,
                'professore'
            );
            this.initializationState.player = true;

            // Step 4: Initialize game systems
            console.log('Initializing game systems...');
            this.levelManager = new LevelManager(assets, this.gameState);
            this.initializationState.levelManager = true;

            this.renderer = new Renderer(this.ctx, this.levelManager, this.gameState);
            this.initializationState.renderer = true;
            
            // Store renderer reference in gameState
            this.gameState.renderer = this.renderer;

            // Step 5: Load initial level
            console.log('Loading initial level...');
            await this.levelManager.loadLevel(1, this.player);

            // Verify all systems
            if (this.verifyInitialization()) {
                this.initialized = true;
                console.log('Game initialization complete');
                this.startGameLoop();
            } else {
                throw new Error('System verification failed');
            }

        } catch (error) {
            console.error('Game initialization failed:', error);
            this.handleInitializationError(error);
            throw error;
        }
    }

    verifyInitialization() {
        const failed = Object.entries(this.initializationState)
            .filter(([, value]) => !value)
            .map(([key]) => key);

        if (failed.length > 0) {
            console.error('Initialization failed for:', failed);
            return false;
        }

        return true;
    }

    handleInitializationError(error) {
        // Display error message to user
        this.ctx.fillStyle = 'black';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = 'white';
        this.ctx.font = '20px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Failed to start game. Please refresh the page.', 
            this.canvas.width / 2, this.canvas.height / 2);
    }

    startGameLoop() {
        console.log('Starting game loop');
        this.lastUpdateTime = performance.now();
        this.gameLoop();
    }

    update() {
        if (!this.initialized || this.gameState.isGameOver) return;

        const currentTime = performance.now();
        const deltaTime = (currentTime - this.lastUpdateTime) / 16.67;
        this.lastUpdateTime = currentTime;

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

    draw() {
        if (!this.initialized) return;
        
        // Use consolidated rendering approach
        this.renderer.draw(this.player, this.assets.sprites, this.camera);
        
        // Draw score
        this.scoreManager.draw();

        // Update and draw FPS if in debug mode
        if (CONFIG.DEBUG) {
            this.updateFPS();
            this.drawFPS();
        }
    }

    updateFPS() {
        const now = performance.now();
        this.frameCount++;

        if (now - this.lastFpsUpdate >= this.fpsUpdateInterval) {
            this.fps = Math.round((this.frameCount * 1000) / (now - this.lastFpsUpdate));
            this.frameCount = 0;
            this.lastFpsUpdate = now;
        }
    }

    drawFPS() {
        this.ctx.fillStyle = 'white';
        this.ctx.font = '12px Arial';
        this.ctx.fillText(`FPS: ${this.fps}`, 10, 20);
    }

    gameLoop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Game startup
const startGame = async () => {
    try {
        console.log('Creating game instance...');
        const game = new Game();
        await game.init();
        console.log('Game started successfully');
    } catch (error) {
        console.error('Failed to start game:', error);
    }
};

startGame();