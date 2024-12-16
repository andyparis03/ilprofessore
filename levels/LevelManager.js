// LevelManager.js
import { CONFIG } from '../config.js';
import { CharacterRegistry } from '../utils/CharacterRegistry.js';
import { Suina1 } from '../characters/Suina1.js';
import { Suina2 } from '../characters/Suina2.js';
import { SuinaEvil } from '../characters/SuinaEvil.js';
import { Walter } from '../characters/Walter.js';
import { Diego } from '../characters/Diego.js';
import { Milly } from '../characters/Milly.js';

export class LevelManager {
    constructor(assets) {
        this.assets = assets;
        this.registry = new CharacterRegistry();
        this.currentLevel = 1;
        this.characters = [];
        this.characterTimers = {};
        this.player = null;
        this.transitionState = {
            inProgress: false,
            timeout: null,
            startTime: null,
            duration: 500,
            previousLevel: null,
            targetLevel: null
        };

        this.registerCharacters();
        this.setupBackButton();
    }

    registerCharacters() {
        // Register Suina1
        this.registry.registerCharacter('suina1', Suina1, {
            // Basic properties
            x: 0,
            y: 0,
            direction: 'down',
            lastNonIdleDirection: 'down',
            isIdle: false,
            frame: 0,
            isPaused: false,

            // Animation states
            currentSprite: null,
            activeSprite: null,

            // Collision states
            isColliding: false,
            collisionStartTime: null,
            isDisappearing: false,
            buttonInteractionAvailable: false,
            hasInteracted: false,
            soundPlayed: false,
            isVisible: true,

            // Movement states
            moveTimer: (char) => char.moveTimer || performance.now(),
            velocity: { x: 0, y: 0 },
            movementBuffer: { x: 0, y: 0 },
            stuckTimer: 0,
            directionChangeCount: 0,
            lastDirectionChange: (char) => char.lastDirectionChange || performance.now()
        });

        // Register Suina2
        this.registry.registerCharacter('suina2', Suina2, {
            // Basic properties
            direction: 'down',
            isIdle: true,
            frame: 0,
            isPaused: false,
            lastBehaviorUpdate: (char) => char.lastBehaviorUpdate || performance.now()
        });

        // Register other characters with their specific states
        this.registry.registerCharacter('suinaevil', SuinaEvil, {
            direction: 'down',
            isIdle: true,
            frame: 0,
            isPaused: false,
            lastBehaviorUpdate: (char) => char.lastBehaviorUpdate || performance.now()
        });

        this.registry.registerCharacter('walter', Walter, {
            direction: 'down',
            isIdle: true,
            frame: 0,
            isPaused: false,
            lastBehaviorUpdate: (char) => char.lastBehaviorUpdate || performance.now()
        });

        this.registry.registerCharacter('diego', Diego, {
            direction: 'down',
            isIdle: true,
            frame: 0,
            isPaused: false,
            lastBehaviorUpdate: (char) => char.lastBehaviorUpdate || performance.now()
        });

        this.registry.registerCharacter('milly', Milly, {
            direction: 'down',
            isIdle: true,
            frame: 0,
            isPaused: false,
            lastBehaviorUpdate: (char) => char.lastBehaviorUpdate || performance.now()
        });
    }

    setupBackButton() {
        const backButton = document.getElementById('back-button');
        if (!backButton) return;

        backButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (this.currentLevel !== 1) {
                this.transitionToLevel1();
            }
        });

        this.updateBackButtonVisibility();
    }

    updateBackButtonVisibility() {
        const backButton = document.getElementById('back-button');
        if (backButton) {
            backButton.style.display = this.currentLevel === 1 ? 'none' : 'block';
        }
    }

    async transitionToLevel1() {
        if (this.transitionState.inProgress) return;
        
        this.clearTimers();
        
        if (this.player) {
            this.player.x = CONFIG.WORLD.WIDTH / 2;
            this.player.y = CONFIG.WORLD.HEIGHT / 2;
        }

        await this.loadLevel(1, this.player);
        this.updateBackButtonVisibility();
    }

    async loadLevel(levelNumber, player) {
        const levelConfig = CONFIG.LEVELS[levelNumber];
        if (!levelConfig) {
            console.error(`Level ${levelNumber} configuration not found.`);
            return;
        }

        if (this.transitionState.inProgress) {
            console.warn('Level transition already in progress');
            return;
        }

        try {
            await this.startTransition(levelNumber);
            const storedStates = this.preserveCharacterStates();
            await this.clearCurrentLevel();
            await this.setupNewLevel(levelNumber, player, storedStates);
            await this.completeTransition();
            console.log(`Loaded level ${levelNumber}`);
        } catch (error) {
            console.error('Error during level transition:', error);
            this.handleTransitionError();
        }
    }

    async startTransition(newLevelNumber) {
        this.transitionState = {
            inProgress: true,
            startTime: performance.now(),
            previousLevel: this.currentLevel,
            targetLevel: newLevelNumber,
            duration: 500,
            timeout: null
        };

        if (this.transitionState.timeout) {
            clearTimeout(this.transitionState.timeout);
        }

        // Pause all characters during transition
        this.characters.forEach(char => {
            if (char && typeof char.pauseUpdates === 'function') {
                char.pauseUpdates();
            }
        });
    }

    preserveCharacterStates() {
        const storedStates = new Map();
        this.characters.forEach(char => {
            if (char && char.type) {
                const state = this.registry.preserveState(char);
                if (state) {
                    storedStates.set(char.type, state);
                }
            }
        });
        return storedStates;
    }

    async clearCurrentLevel() {
        this.clearTimers();
        
        // Cleanup all characters
        this.characters.forEach(char => {
            if (char && typeof char.cleanup === 'function') {
                char.cleanup();
            }
        });

        this.characters = [];
        this.characterTimers = {};
    }

    async setupNewLevel(levelNumber, player, storedStates) {
        this.currentLevel = levelNumber;
        
        if (this.player !== player) {
            this.player = player;
        }

        await this.loadCharactersForLevel(levelNumber, storedStates);
        this.updateBackButtonVisibility();
        this.resetPlayerState();
    }

    resetPlayerState() {
        if (!this.player) return;

        const now = performance.now();
        this.player.lastUpdateTime = now;
        this.player.lastAnimationUpdate = now;
        this.player.frameTime = now;
        this.player.updateSpeedMultiplier();
        
        this.player.velocity = { x: 0, y: 0 };
        this.player.movementBuffer = { x: 0, y: 0 };
        this.player.x = CONFIG.WORLD.WIDTH / 2;
        this.player.y = CONFIG.WORLD.HEIGHT / 2;
        this.player.frame = this.player.frame % this.player.totalFrames;
    }

    async completeTransition() {
        return new Promise((resolve) => {
            const remainingTime = Math.max(0, 
                this.transitionState.duration - (performance.now() - this.transitionState.startTime));

            this.transitionState.timeout = setTimeout(() => {
                // Resume all characters
                this.characters.forEach(char => {
                    if (char && typeof char.resumeUpdates === 'function') {
                        char.resumeUpdates();
                    }
                });

                this.transitionState = {
                    inProgress: false,
                    timeout: null,
                    startTime: null,
                    previousLevel: null,
                    targetLevel: null,
                    duration: 500
                };

                resolve();
            }, remainingTime);
        });
    }

    handleTransitionError() {
        this.transitionState = {
            inProgress: false,
            timeout: null,
            startTime: null,
            previousLevel: null,
            targetLevel: null,
            duration: 500
        };

        // Resume all characters
        this.characters.forEach(char => {
            if (char && typeof char.resumeUpdates === 'function') {
                char.resumeUpdates();
            }
        });
    }

    loadCharactersForLevel(levelNumber, storedStates) {
        switch (levelNumber) {
            case 1:
                this.addRandomCharacter('milly', 10000);
                break;
            case 2:
                this.addCharacter('suina1', 300, 200, storedStates);
                this.addDelayedCharacter('suina2', 400, 250, 5000);
                this.addDelayedCharacter('suinaevil', 500, 100, 6000);
                break;
            case 3:
                this.addCharacter('suina1', 350, 300, storedStates);
                this.addDelayedCharacter('suina2', 400, 200, 5000);
                this.addDelayedCharacter('suinaevil', 450, 150, 6000);
                break;
            case 4:
                this.addCharacter('walter', 600, 300);
                break;
            case 5:
                this.addCharacter('diego', 700, 400);
                break;
            default:
                console.warn(`No characters defined for level ${levelNumber}`);
                break;
        }
    }

    addCharacter(type, x, y, storedStates = null) {
        const CharacterClass = this.registry.getCharacterClass(type);
        const sprites = this.assets.sprites[type];

        if (!CharacterClass || !sprites) {
            console.error(`Invalid character type or missing sprites: ${type}`);
            return;
        }

        const character = new CharacterClass(x, y, CONFIG.PLAYER.WIDTH, CONFIG.PLAYER.HEIGHT, sprites, type.toLowerCase());

        if (storedStates) {
            const storedState = storedStates.get(type.toLowerCase());
            if (storedState) {
                Object.assign(character, storedState);
            }
        }

        // Ensure character starts in correct state
        character.isIdle = false;
        character.isPaused = this.transitionState.inProgress;

        this.characters.push(character);
        return character;
    }

    addDelayedCharacter(type, x, y, delay) {
        if (!this.assets.sprites[type]) {
            console.error(`Cannot add delayed character: Missing sprites for type ${type}`);
            return;
        }
        this.characterTimers[type] = setTimeout(() => {
            this.addCharacter(type, x, y);
            delete this.characterTimers[type];
        }, delay);
    }

    addRandomCharacter(type, interval) {
        const spawnRandomly = () => {
            if (this.currentLevel !== 1) return;
            const x = Math.random() * (CONFIG.WORLD.WIDTH - CONFIG.PLAYER.WIDTH);
            const y = Math.random() * (CONFIG.WORLD.HEIGHT - CONFIG.PLAYER.HEIGHT);
            this.addCharacter(type, x, y);
        };

        this.characterTimers[type] = setInterval(spawnRandomly, interval);
    }

    update(player, worldBounds, input) {
        if (this.transitionState.inProgress) return;

        this.characters = this.characters.filter(character => character && character.type);

        this.characters.forEach((character) => {
            if (!character.isCaught && !character.isPaused) {
                character.update(player, {
                    width: CONFIG.WORLD.WIDTH,
                    height: CONFIG.WORLD.HEIGHT
                }, input);
            }
        });
    }

    checkLevelTransition(player) {
        if (this.transitionState.inProgress) return false;

        const currentLevelConfig = CONFIG.LEVELS[this.currentLevel];
        if (!currentLevelConfig || !currentLevelConfig.transitions) {
            return false;
        }

        for (const transition of Object.values(currentLevelConfig.transitions)) {
            if (
                player.x >= transition.x.min &&
                player.x <= transition.x.max &&
                player.y >= transition.y.min &&
                player.y <= transition.y.max
            ) {
                this.loadLevel(transition.nextLevel, player);
                return true;
            }
        }

        return false;
    }

    clearTimers() {
        for (const timer in this.characterTimers) {
            clearTimeout(this.characterTimers[timer]);
            clearInterval(this.characterTimers[timer]);
        }
        this.characterTimers = {};
    }

    getCurrentLevelBackground() {
        const levelConfig = CONFIG.LEVELS[this.currentLevel];
        if (!levelConfig) {
            console.error(`Level ${this.currentLevel} configuration not found.`);
            return null;
        }

        const backgroundKey = levelConfig.backgroundKey;
        return this.assets.backgrounds[backgroundKey];
    }
}