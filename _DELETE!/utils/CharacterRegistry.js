// CharacterRegistry.js
export class CharacterRegistry {
    constructor() {
        this.characterClasses = new Map();
        this.characterStates = new Map();
    }

    registerCharacter(type, characterClass, stateDefinition) {
        this.characterClasses.set(type.toLowerCase(), {
            class: characterClass,
            defaultState: stateDefinition
        });
    }

    getCharacterClass(type) {
        return this.characterClasses.get(type.toLowerCase())?.class;
    }

    getDefaultState(type) {
        return this.characterClasses.get(type.toLowerCase())?.defaultState;
    }

    preserveState(character) {
        if (!character || !character.type) return null;

        const defaultState = this.getDefaultState(character.type);
        if (!defaultState) return null;

        // Create state object based on character's default state definition
        const state = {};
        for (const [key, definition] of Object.entries(defaultState)) {
            if (typeof definition === 'function') {
                state[key] = definition(character);
            } else {
                state[key] = character[key] ?? definition;
            }
        }

        return state;
    }
}