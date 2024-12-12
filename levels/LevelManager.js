// LevelManager.js
import { CONFIG } from '../config.js';
import { Suina1 } from '../characters/Suina1.js';
import { Suina2 } from '../characters/Suina2.js';
import { SuinaEvil } from '../characters/SuinaEvil.js';
import { Walter } from '../characters/Walter.js';
import { Diego } from '../characters/Diego.js';
import { Milly } from '../characters/Milly.js';

export class LevelManager {
    constructor(assets) {
        this.assets = assets;
        this.currentLevel = 1;
        this.characters = [];
        this.characterTimers = {};
        this.player = null;
        this.transitionInProgress = false;
        this.transitionTimeout = null;
    }

    loadLevel(levelNumber, player) {
        const levelConfig = CONFIG.LEVELS[levelNumber];
        if (!levelConfig) {
            console.error(`Level ${levelNumber} configuration not found.`);
            return;
        }

        if (this.transitionTimeout) {
            clearTimeout(this.transitionTimeout);
        }

        this.transitionInProgress = true;

        // Store character states before clearing
        const storedStates = new Map();
        this.characters.forEach(char => {
            if (char && char.type) {
                storedStates.set(char.type, {
                    direction: char.direction,
                    lastNonIdleDirection: char.lastNonIdleDirection,
                    isIdle: false
                });
            }
        });

        this.clearTimers();
        this.characters = [];
        this.characterTimers = {};

        this.currentLevel = levelNumber;
        this.loadCharactersForLevel(levelNumber, storedStates);

        if (this.player !== player) {
            this.player = player;
        }

        this.resetPlayerState();

        console.log(`Loaded level ${levelNumber}`);

        this.transitionTimeout = setTimeout(() => {
            this.transitionInProgress = false;
            // Force walking state after transition
            this.characters.forEach(char => {
                if (char) char.isIdle = false;
            });
        }, 100);
    }

    resetPlayerState() {
        if (!this.player) return;

        // Preserve timing consistency
        const now = performance.now();
        this.player.lastUpdateTime = now;
        this.player.lastAnimationUpdate = now;
        this.player.frameTime = now;

        this.player.updateSpeedMultiplier();
        
        // Reset movement tracking
        this.player.velocity = { x: 0, y: 0 };
        this.player.movementBuffer = { x: 0, y: 0 };

        this.player.x = CONFIG.WORLD.WIDTH / 2;
        this.player.y = CONFIG.WORLD.HEIGHT / 2;

        this.player.frame = this.player.frame % this.player.totalFrames;
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
        const characterClasses = {
            suina1: Suina1,
            suina2: Suina2,
            suinaevil: SuinaEvil,
            walter: Walter,
            diego: Diego,
            milly: Milly
        };

        const CharacterClass = characterClasses[type.toLowerCase()];
        const sprites = this.assets.sprites[type];

        if (!CharacterClass || !sprites) {
            console.error(`Invalid character type or missing sprites: ${type}`);
            return;
        }

        const character = new CharacterClass(x, y, CONFIG.PLAYER.WIDTH, CONFIG.PLAYER.HEIGHT, sprites, type.toLowerCase());

        // Restore previous state if available
        if (storedStates) {
            const storedState = storedStates.get(type.toLowerCase());
            if (storedState) {
                Object.assign(character, storedState);
            }
        }

        // Ensure character starts in walking state
        character.isIdle = false;

        this.characters.push(character);
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

    update(player) {
        if (this.transitionInProgress) return;

        this.characters = this.characters.filter(character => character && character.type);

        this.characters.forEach((character) => {
            if (!character.isCaught) {
                character.update(player, {
                    width: CONFIG.WORLD.WIDTH,
                    height: CONFIG.WORLD.HEIGHT
                });
            }
        });
    }

    checkLevelTransition(player) {
        if (this.transitionInProgress) return false;

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
                const nextLevel = transition.nextLevel;
                this.loadLevel(nextLevel, player);
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