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
    constructor(assets, gameState = null) {
        this.assets = assets;
        this.gameState = gameState;
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

    isGameStopped() {
        return this.transitionState.inProgress || (this.gameState?.isGameOver ?? false);
    }

    registerCharacters() {
        this.registry.registerCharacter('suina1', Suina1);
        this.registry.registerCharacter('suina2', Suina2);
        this.registry.registerCharacter('suinaevil', SuinaEvil);
        this.registry.registerCharacter('walter', Walter);
        this.registry.registerCharacter('diego', Diego);
        this.registry.registerCharacter('milly', Milly);
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
        if (this.isGameStopped()) return;
        
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

        if (this.isGameStopped()) {
            console.warn('Level transition blocked - transition in progress or game over');
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

        this.characters.forEach(char => {
            if (char && char.resumeUpdates) {
                char.resumeUpdates();
            }
        });
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

        if (!this.isGameStopped()) {
            this.player.x = CONFIG.WORLD.WIDTH / 2;
            this.player.y = CONFIG.WORLD.HEIGHT / 2;
        }

        this.player.frame = this.player.frame % this.player.totalFrames;
    }

    async completeTransition() {
        return new Promise((resolve) => {
            const remainingTime = Math.max(0, 
                this.transitionState.duration - (performance.now() - this.transitionState.startTime));

            this.transitionState.timeout = setTimeout(() => {
                this.characters.forEach(char => {
                    if (char && char.resumeUpdates) {
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

        if (!this.isGameStopped()) {
            this.characters.forEach(char => {
                if (char && typeof char.resumeUpdates === 'function') {
                    char.resumeUpdates();
                }
            });
        }
    }

    loadCharactersForLevel(levelNumber, storedStates) {
        switch (levelNumber) {
            case 1:
                this.addRandomCharacter('milly', 10000);
                break;
            case 2:
            case 3:
                if (this.characters.length === 0) {
                    this.addCharacter('suina1', 
                        Math.random() * (CONFIG.WORLD.WIDTH - CONFIG.PLAYER.WIDTH), 
                        Math.random() * (CONFIG.WORLD.HEIGHT - CONFIG.PLAYER.HEIGHT), 
                        storedStates);
                }
                break;
            case 4:
                this.addCharacter('walter', 600, 500);  // Updated Y position for new height
                break;
            case 5:
                this.addCharacter('diego', 700, 550);   // Updated Y position for new height
                break;
            default:
                console.warn(`No characters defined for level ${levelNumber}`);
                break;
        }
    }

    spawnNextRandomCharacter() {
        if (this.currentLevel !== 2 && this.currentLevel !== 3) {
            return;
        }

        const characterTypes = ['suina1', 'suina2', 'suinaevil'];
        const characterType = characterTypes[Math.floor(Math.random() * characterTypes.length)];
        
        // Updated spawn position to use new height
        const x = Math.random() * (CONFIG.WORLD.WIDTH - CONFIG.PLAYER.WIDTH);
        const y = Math.random() * (CONFIG.WORLD.HEIGHT - CONFIG.PLAYER.HEIGHT);
        
        this.addCharacter(characterType, x, y);
    }

    handleCharacterDisappear(character) {
        this.characters = this.characters.filter(c => c !== character);

        if ((character.type === 'suina1' || character.type === 'suina2' || character.type === 'suinaevil') && 
            (this.currentLevel === 2 || this.currentLevel === 3)) {
            this.spawnNextRandomCharacter();
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

        character.isIdle = false;
        character.isPaused = false;
        character.levelManager = this;

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
        if (this.isGameStopped()) {
            return;
        }

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
        if (this.isGameStopped()) return false;

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