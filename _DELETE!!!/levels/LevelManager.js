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

    // Helper method to check if game is in a stopped state
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

    // Make sure characters aren't paused after level setup
    this.characters.forEach(char => {
        if (char && char.resumeUpdates) {
            char.resumeUpdates();
        }
    });

    console.log('Level setup complete, characters:', this.characters.map(char => ({
        type: char.type,
        isPaused: char.isPaused,
        isIdle: char.isIdle
    })));
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
            // Resume all characters
            this.characters.forEach(char => {
                if (char && char.resumeUpdates) {
                    console.log('Resuming character:', char.type);
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
                // Start with Suina1 for initial spawn only
                if (this.characters.length === 0) {
                    this.addCharacter('suina1', 
                        Math.random() * (CONFIG.WORLD.WIDTH - CONFIG.PLAYER.WIDTH), 
                        Math.random() * (CONFIG.WORLD.HEIGHT - CONFIG.PLAYER.HEIGHT), 
                        storedStates);
                }
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



spawnNextRandomCharacter() {
    console.log("Spawning next random character...");
    // Only spawn in levels 2 or 3
    if (this.currentLevel !== 2 && this.currentLevel !== 3) {
        console.log("Not in level 2 or 3, skipping spawn");
        return;
    }

    // Include all three Suina types in random selection
    const characterTypes = ['suina1', 'suina2', 'suinaevil'];
    const characterType = characterTypes[Math.floor(Math.random() * characterTypes.length)];
    
    console.log(`Selected character type: ${characterType}`);
    
    // Random position with padding from edges
    const padding = 100;
    const x = padding + Math.random() * (CONFIG.WORLD.WIDTH - CONFIG.PLAYER.WIDTH - 2 * padding);
    const y = padding + Math.random() * (CONFIG.WORLD.HEIGHT - CONFIG.PLAYER.HEIGHT - 2 * padding);
    
    this.addCharacter(characterType, x, y);
}

addCharacter(type, x, y, storedStates = null) {
    console.log('Adding character:', { type, x, y });
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

    // Initialize movement state
    character.isIdle = false;
    character.isPaused = false;
    character.levelManager = this;
    
    // Set initial direction randomly
    const directions = ['up', 'down', 'left', 'right'];
    character.direction = directions[Math.floor(Math.random() * directions.length)];
    character.lastNonIdleDirection = character.direction;
    
    // Initialize timers
    const now = performance.now();
    character.moveTimer = now;
    character.lastDirectionChange = now;
    character.lastUpdateTime = now;
    character.frameTime = now;
    
    // Reset movement buffers
    character.velocity = { x: 0, y: 0 };
    character.movementBuffer = { x: 0, y: 0 };
    character.stuckTimer = 0;
    character.directionChangeCount = 0;

    console.log('Character created:', {
        type: character.type,
        isPaused: character.isPaused,
        isIdle: character.isIdle,
        direction: character.direction
    });

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
        console.log('LevelManager Update:', {
            isGameStopped: this.isGameStopped(),
            characterCount: this.characters.length,
            characters: this.characters.map(char => ({
                type: char.type,
                position: { x: char.x, y: char.y },
                isPaused: char.isPaused,
                isCaught: char.isCaught
            }))
        });

        if (this.isGameStopped()) {
            console.log('LevelManager Update blocked by isGameStopped');
            return;
        }

        this.characters = this.characters.filter(character => character && character.type);

        console.log('Updating characters:', this.characters.length);

        this.characters.forEach((character) => {
            console.log('Updating character:', {
                type: character.type,
                isPaused: character.isPaused,
                isCaught: character.isCaught,
                isVisible: character.isVisible
            });

            if (!character.isCaught && !character.isPaused) {
                character.update(player, {
                    width: CONFIG.WORLD.WIDTH,
                    height: CONFIG.WORLD.HEIGHT
                }, input);
            } else {
                console.log('Character update skipped:', {
                    type: character.type,
                    isCaught: character.isCaught,
                    isPaused: character.isPaused
                });
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