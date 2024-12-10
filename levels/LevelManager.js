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
        this.player = null; // Track Il Professore separately
    }

    loadLevel(levelNumber, player) {
        const levelConfig = CONFIG.LEVELS[levelNumber];
        if (!levelConfig) {
            console.error(`Level ${levelNumber} configuration not found.`);
            return;
        }

        // Clear all timers and characters before loading the new level
        this.clearTimers();
        this.characters = [];
        this.characterTimers = {};

        // Set the current level and reload characters
        this.currentLevel = levelNumber;
        this.loadCharactersForLevel(levelNumber);

        // Ensure Il Professore is managed separately
        if (this.player !== player) {
            this.player = player;
        }

        // Reset player state
        this.resetPlayerState();

        console.log(`Loaded level ${levelNumber}:`, levelConfig);
    }

    resetPlayerState() {
        if (!this.player) return;

        // Reset critical player state variables
        this.player.lastUpdateTime = performance.now(); // Reset timing
        this.player.updateSpeedMultiplier(); // Recalculate speed multiplier

        // Place the player at the center of the world (adjust as necessary)
        this.player.x = CONFIG.WORLD.WIDTH / 2;
        this.player.y = CONFIG.WORLD.HEIGHT / 2;

        console.log('Player state reset.');
    }

    loadCharactersForLevel(levelNumber) {
        switch (levelNumber) {
            case 1: // StartingLevel
                this.addRandomCharacter('milly', 10000); // Milly appears randomly every 10 seconds
                break;
            case 2: // Teatro
                this.addCharacter('suina1', 300, 200);
                this.addDelayedCharacter('suina2', 400, 250, 5000); // Suina2 appears after 5 seconds
                this.addDelayedCharacter('suinaevil', 500, 100, 6000); // SuinaEvil appears after 6 seconds
                break;
            case 3: // Malafama
                this.addCharacter('suina1', 350, 300);
                this.addDelayedCharacter('suina2', 400, 200, 5000); // Suina2 appears after 5 seconds
                this.addDelayedCharacter('suinaevil', 450, 150, 6000); // SuinaEvil appears after 6 seconds
                break;
            case 4: // Gusto
                this.addCharacter('walter', 600, 300);
                break;
            case 5: // Chester
                this.addCharacter('diego', 700, 400);
                break;
            default:
                console.warn(`No characters defined for level ${levelNumber}.`);
                break;
        }
    }

    addCharacter(type, x, y) {
        const characterClasses = {
            suina1: Suina1,
            suina2: Suina2,
            suinaevil: SuinaEvil,
            walter: Walter,
            diego: Diego,
            milly: Milly
        };

        const sprites = this.assets.sprites[type];
        const CharacterClass = characterClasses[type.toLowerCase()];
        if (!CharacterClass || !sprites) {
            console.error(`Invalid character type or missing sprites: ${type}`);
            return; // Skip invalid characters
        }

        const character = new CharacterClass(
            x,
            y,
            CONFIG.PLAYER.WIDTH,
            CONFIG.PLAYER.HEIGHT,
            sprites,
            type.toLowerCase()
        );
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
            if (this.currentLevel !== 1) return; // Ensure Milly only spawns in Level 1
            const x = Math.random() * (CONFIG.WORLD.WIDTH - CONFIG.PLAYER.WIDTH);
            const y = Math.random() * (CONFIG.WORLD.HEIGHT - CONFIG.PLAYER.HEIGHT);
            this.addCharacter(type, x, y);
        };

        this.characterTimers[type] = setInterval(spawnRandomly, interval);
    }

    update(player) {
        // Clean up invalid characters before updating
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
                this.loadLevel(nextLevel, player); // Pass player to ensure consistent state
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
