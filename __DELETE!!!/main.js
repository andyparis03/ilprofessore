// main.js
import { CONFIG } from './config.js';
import { Camera } from './js/engine/Camera.js';
import { InputHandler } from './js/engine/Input.js';
import { Player } from './characters/Player.js';
import { Renderer } from './js/engine/Renderer.js';
import { AssetLoader } from './utils/AssetLoader.js';
import { AudioManager } from './js/engine/AudioManager.js';
import { LevelManager } from './levels/LevelManager.js';

const audioManager = new AudioManager();

window.addEventListener('click', async () => {
    try {
        if (!audioManager.initialized) {
            await audioManager.init();
        }
        console.log('Starting the game...');
        game.init();
    } catch (error) {
        console.error('Error initializing the game:', error);
    }
});

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

        this.player = new Player(
            CONFIG.WORLD.WIDTH / 2,
            CONFIG.WORLD.HEIGHT / 2,
            CONFIG.PLAYER.WIDTH,
            CONFIG.PLAYER.HEIGHT,
            null,
            'professore'
        );

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

            this.levelManager = new LevelManager(assets);
            this.renderer = new Renderer(this.ctx, this.levelManager);
            await this.audioManager.init();

            this.levelManager.loadLevel(1);
            this.gameLoop();
        } catch (error) {
            console.error('Game initialization failed:', error);
        }
    }

    update() {
        this.player.update(this.input, {
            width: CONFIG.WORLD.WIDTH,
            height: CONFIG.WORLD.HEIGHT
        });

        this.levelManager.update(this.player);

        this.levelManager.characters.forEach(character => {
            if (character.type === 'suina1') {
                if (this.player.checkCollision(character)) {
                    character.handleCollision();
                    this.audioManager.playSound('suina_sound');
                } else {
                    character.resetCollisionFlag();
                }
            }
        });

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
    }

    gameLoop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
}

const game = new Game();
game.init().catch(console.error);
