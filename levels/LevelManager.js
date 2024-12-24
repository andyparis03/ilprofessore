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

        // Play welcome sounds for specific levels
        if (levelNumber === 4) {
            const gameInstance = window.gameInstance;
            if (gameInstance?.audioManager) {
                gameInstance.audioManager.playSound('walter_welcome');
            }
        } else if (levelNumber === 5) {
            const gameInstance = window.gameInstance;
            if (gameInstance?.audioManager) {
                gameInstance.audioManager.playSound('diego_sound');
            }
        }

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
        
        // Random position
        const x = Math.random() * (CONFIG.WORLD.WIDTH - CONFIG.PLAYER.WIDTH);
        const y = Math.random() * (CONFIG.WORLD.HEIGHT - CONFIG.PLAYER.HEIGHT);
        
        this.addCharacter(characterType, x, y);
    }

    handleCharacterDisappear(character) {
        console.log(`Handling disappearance of character: ${character.type}`);
        
        // Remove the character from the array
        this.characters = this.characters.filter(c => c !== character);

        // If it's any Suina type in levels 2 or 3, spawn next random character
        if ((character.type === 'suina1' || character.type === 'suina2' || character.type === 'suinaevil') && 
            (this.currentLevel === 2 || this.currentLevel === 3)) {
            
            console.log("Triggering next random character spawn");
            this.spawnNextRandomCharacter();
        }
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

    character.isIdle = false;
    character.isPaused = false;  // Initialize as not paused
    character.levelManager = this;

    console.log('Character created:', {
        type: character.type,
        isPaused: character.isPaused,
        isIdle: character.isIdle
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

    const gameInstance = window.gameInstance;
    if (!gameInstance?.scoreManager) return false;

    for (const [locationName, transition] of Object.entries(currentLevelConfig.transitions)) {
        if (
            player.x >= transition.x.min &&
            player.x <= transition.x.max &&
            player.y >= transition.y.min &&
            player.y <= transition.y.max
        ) {
            // Check Gusto (Level 4) condition
            if (locationName === 'GUSTO' && gameInstance.scoreManager.scores.energy > 30) {
                if (gameInstance.renderer) {
                    gameInstance.renderer.setScreenMessage('gustoClosed');
                }
                return false;
            }

            // Check Chester (Level 5) condition
            if (locationName === 'CHESTER' && gameInstance.scoreManager.scores.friendship > 30) {
                if (gameInstance.renderer) {
                    gameInstance.renderer.setScreenMessage('chesterClosed');
                }
                return false;
            }

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