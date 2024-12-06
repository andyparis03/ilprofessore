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
    }

    loadLevel(levelNumber) {
        const levelConfig = CONFIG.LEVELS[levelNumber];
        if (!levelConfig) {
            console.error(`Level ${levelNumber} configuration not found.`);
            return;
        }

        this.currentLevel = levelNumber;
        this.characters = [];
        this.loadCharactersForLevel(levelNumber);

        console.log(`Loaded level ${levelNumber}:`, levelConfig);
        console.log(this.characters);
    }

    loadCharactersForLevel(levelNumber) {
        const levelCharacters = {
            2: [
                { type: 'suina1', x: 300, y: 200 },
                { type: 'suina2', x: 400, y: 250 }
            ],
            3: [
                { type: 'suinaevil', x: 500, y: 100 },
                { type: 'walter', x: 350, y: 300 }
            ],
            4: [
                { type: 'diego', x: 600, y: 200 }
            ]
        };

        const charactersConfig = levelCharacters[levelNumber];
        if (!charactersConfig) {
            console.warn(`No characters defined for level ${levelNumber}.`);
            return;
        }

        charactersConfig.forEach((config) => {
            const character = this.createCharacter(config);
            if (character) {
                this.characters.push(character);
            }
        });
    }

    createCharacter({ type, x, y }) {
        const activeCharacters = ['suina1', 'suina2', 'suinaevil', 'walter', 'diego', 'milly'];
        if (!activeCharacters.includes(type.toLowerCase())) {
            console.warn(`Skipping inactive character type: ${type}`);
            return null;
        }

        const characterClasses = {
            suina1: Suina1,
            suina2: Suina2,
            suinaevil: SuinaEvil,
            walter: Walter,
            diego: Diego,
            milly: Milly
        };

        const characterSprites = {
            suina1: this.assets.sprites.suina1,
            suina2: this.assets.sprites.suina2,
            suinaevil: this.assets.sprites.suinaevil,
            walter: this.assets.sprites.walter,
            diego: this.assets.sprites.diego,
            milly: this.assets.sprites.milly
        };

        const CharacterClass = characterClasses[type.toLowerCase()];
        const sprites = characterSprites[type.toLowerCase()];

        if (!CharacterClass || !sprites) {
            console.error(`Character class or sprites not found for type: ${type}`);
            return null;
        }

        return new CharacterClass(
            x,
            y,
            CONFIG.PLAYER.WIDTH,
            CONFIG.PLAYER.HEIGHT,
            sprites,
            type.toLowerCase()
        );
    }

    update(player) {
        this.characters.forEach((character) => {
            if (!character.isCaught) {
                character.update(player, {
                    width: CONFIG.WORLD.WIDTH,
                    height: CONFIG.WORLD.HEIGHT
                });
            }
        });
        console.log('Updated characters:', this.characters);
    }

    checkLevelTransition(player) {
        const currentLevelConfig = CONFIG.LEVELS[this.currentLevel];
        if (!currentLevelConfig || !currentLevelConfig.transitions) {
            return false;
        }

        for (const transition of Object.values(currentLevelConfig.transitions)) {
            if (
                player.x >= transition.x.min && player.x <= transition.x.max &&
                player.y >= transition.y.min && player.y <= transition.y.max
            ) {
                const nextLevel = transition.nextLevel;
                this.loadLevel(nextLevel);
                return true;
            }
        }

        return false;
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
