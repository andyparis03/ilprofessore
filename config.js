// config.js
export const CONFIG = {
    CANVAS: {
        DEFAULT_WIDTH: 800,
        DEFAULT_HEIGHT: 600,
        MOBILE_BREAKPOINT: 768
    },
    WORLD: {
        WIDTH: 800,
        HEIGHT: 600
    },
    PLAYER: {
        WIDTH: 68,
        HEIGHT: 68,
        SPEED: 1,
        TOTAL_FRAMES: 4,
        FRAME_DELAY: 4,
        SPEED_MULTIPLIERS: {
            DESKTOP: 1.0,
            MOBILE: 2.0,
            TABLET: 0.85
        }
    },
    AUDIO: {
        MUSIC_VOLUME: 0.1,
        SFX_VOLUME: 0.3,
        FOOTSTEP_INTERVAL: 300
    },
    LEVELS: {
        1: {
            name: 'StartingLevel',
            backgroundKey: 'background1',
            transitions: {
                TEATRO: { x: { min: 0, max: 150 }, y: { min: 0, max: 100 }, nextLevel: 2 },
                MALAFAMA: { x: { min: 550, max: 800 }, y: { min: 0, max: 100 }, nextLevel: 3 },
                GUSTO: { x: { min: 0, max: 150 }, y: { min: 400, max: 600 }, nextLevel: 4 },
                CHESTER: { x: { min: 600, max: 800 }, y: { min: 450, max: 600 }, nextLevel: 5 }
            }
        },
        2: { name: 'Teatro', backgroundKey: 'background2' },
        3: { name: 'Malafama', backgroundKey: 'background3' },
        4: { name: 'Gusto', backgroundKey: 'background4' },
        5: { name: 'Chester', backgroundKey: 'background5' }
    }
};
