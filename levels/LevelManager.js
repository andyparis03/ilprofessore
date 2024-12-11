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

        // Clear any existing transition timeout
        if (this.transitionTimeout) {
            clearTimeout(this.transitionTimeout);
        }

        // Start transition
        this.transitionInProgress = true;

        // Clear all timers and characters before loading the new level
        this.clearTimers();
        this.characters = [];
        this.characterTimers = {};

        // Set the current level and reload characters
        this.currentLevel = levelNumber;
        this.loadCharactersForLevel(levelNumber);

        // Update player reference if needed
        if (this.player !== player) {
            this.player = player;
        }

        // Capture current player state before reset
        const playerState = this.player ? {
            isMoving: !this.player.isIdle,
            direction: this.player.direction,
            currentInput: this.player.currentInput
        } : null;

        // Reset player state while preserving movement
        this.resetPlayerState(playerState);

        console.log(`Loaded level ${levelNumber}:`, levelConfig);

        // End transition after brief delay and restore player state
        this.transitionTimeout = setTimeout(() => {
            this.transitionInProgress = false;
            if (this.player) {
                // Restore player state and force update
                if (playerState && playerState.isMoving) {
                    this.player.isIdle = false;
                    this.player.direction = playerState.direction;
                }
                this.player.forceStateUpdate();
            }
        }, 100);
    }

    resetPlayerState(preservedState = null) {
        if (!this.player) return;

        const now = performance.now();

        // Reset timing variables
        this.player.lastUpdateTime = now;
        this.player.lastAnimationUpdate = now;
        this.player.frameTime = now;

        // Update speed settings
        this.player.updateSpeedMultiplier();

        // Reset movement tracking but preserve direction
        this.player.velocity = { x: 0, y: 0 };
        this.player.movementBuffer = { x: 0, y: 0 };

        // Center the player
        this.player.x = CONFIG.WORLD.WIDTH / 2;
        this.player.y = CONFIG.WORLD.HEIGHT / 2;
        this.player.lastX = this.player.x;
        this.player.lastY = this.player.y;

        // Restore preserved state if available
        if (preservedState) {
            this.player.isIdle = !preservedState.isMoving;
            this.player.direction = preservedState.direction;
            this.player.currentInput = preservedState.currentInput;
        }

        // Ensure animation frame is valid
        this.player.frame = this.player.frame % this.player.totalFrames;

        console.log('Player state reset completed with preserved state:', preservedState);
    }

    loadCharactersForLevel(levelNumber) {
        switch (levelNumber) {
            case 1: // StartingLevel
                this.addRandomCharacter('milly', 10000);
                break;
            case 2: // Teatro
                this.addCharacter('suina1', 300, 200);
                this.addDelayedCharacter('suina2', 400, 250, 5000);
                this.addDelayedCharacter('suinaevil', 500, 100, 6000);
                break;
            case 3: // Malafama
                this.addCharacter('suina1', 350, 300);
                this.addDelayedCharacter('suina2', 400, 200, 5000);
                this.addDelayedCharacter('suinaevil', 450, 150, 6000);
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
            return;
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