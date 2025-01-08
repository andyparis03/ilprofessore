// AssetLoader.js
export class AssetLoader {
    constructor() {
        // Empty constructor as we're using static methods
    }

    static async loadImage(src, fallbackSrc = null) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => {
                if (fallbackSrc) {
                    console.warn(`Failed to load ${src}, trying fallback: ${fallbackSrc}`);
                    img.src = fallbackSrc;
                    img.onload = () => resolve(img);
                    img.onerror = () => reject(new Error(`Failed to load fallback image: ${fallbackSrc}`));
                } else {
                    reject(new Error(`Failed to load image: ${src}`));
                }
            };
            img.src = src;
        });
    }

    static async loadSound(audioContext, url) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const arrayBuffer = await response.arrayBuffer();
            return await audioContext.decodeAudioData(arrayBuffer);
        } catch (error) {
            console.error(`Failed to load sound: ${url}`, error);
            throw new Error(`Failed to load sound: ${url}`);
        }
    }

    static async loadAssets() {
        try {
            console.log('Starting asset loading...');
            const audioContext = new (window.AudioContext || window.webkitAudioContext)(); 
            
            console.log('Loading assets...');
            const [
                splashScreen,
                winScreen,
                instructionsScreen,
                professoreidle,
                professorewalking,
                skullSprite,
                millyidle,
                millyspritesheet,
                millyinteract,
                suina1idle,
                suina1walking,
                suina1attack,
                suina2idle,
                suina2walking,
                suina2attack,
                suinaevilidle,
                suinaevilwalking,
                suinaevilattack,
                walteridle,
                walterwalking,
                walterattack,
                diegoidle,
                diegowalking,
                diegoattack,
                background1,
                background2,
                background3,
                background4,
                background5,
                proffuck,
                profpunch,
                profsmack,
                buzz,
                dingdong,
                drink,
                profstep,
                proftheme,
                suinafuck,
                suinasound,
                suinaevil,
                suinawalk,
                waltersound,
                walterwelcome,
                diegosound,
                millysound,
                recharge,
                win
            ] = await Promise.all([
                AssetLoader.loadImage('./assets/sprites/splash.png'),
                AssetLoader.loadImage('./assets/sprites/winscreen.png'),
                AssetLoader.loadImage('./assets/sprites/instructions.png'),
                AssetLoader.loadImage('./assets/sprites/professore/professore-idle.png'),
                AssetLoader.loadImage('./assets/sprites/professore/professore-spritesheet.png'),
                AssetLoader.loadImage('./assets/sprites/skull.png'),
                AssetLoader.loadImage('./assets/sprites/milly/milly-idle.png'),
                AssetLoader.loadImage('./assets/sprites/milly/milly-spritesheet.png'),
                AssetLoader.loadImage('./assets/sprites/milly/milly-interact.png'),
                AssetLoader.loadImage('./assets/sprites/suina1/suina1-idle.png'),
                AssetLoader.loadImage('./assets/sprites/suina1/suina1-spritesheet.png'),
                AssetLoader.loadImage('./assets/sprites/suina1/suina1-attack.png'),
                AssetLoader.loadImage('./assets/sprites/suina2/suina2-idle.png'),
                AssetLoader.loadImage('./assets/sprites/suina2/suina2-spritesheet.png'),
                AssetLoader.loadImage('./assets/sprites/suina2/suina2-attack.png'),
                AssetLoader.loadImage('./assets/sprites/suinaEvil/suinaevil-idle.png'),
                AssetLoader.loadImage('./assets/sprites/suinaEvil/suinaevil-spritesheet.png'),
                AssetLoader.loadImage('./assets/sprites/suinaEvil/suinaevil-attack.png'),
                AssetLoader.loadImage('./assets/sprites/walter/walter-idle.png'),
                AssetLoader.loadImage('./assets/sprites/walter/walter-spritesheet.png'),
                AssetLoader.loadImage('./assets/sprites/walter/walter-attack.png'),
                AssetLoader.loadImage('./assets/sprites/diego/diego-idle.png'),
                AssetLoader.loadImage('./assets/sprites/diego/diego-spritesheet.png'),
                AssetLoader.loadImage('./assets/sprites/diego/diego-attack.png'),
                AssetLoader.loadImage('./assets/sprites/background.png'),
                AssetLoader.loadImage('./assets/sprites/background2.png'),
                AssetLoader.loadImage('./assets/sprites/background3.png'),
                AssetLoader.loadImage('./assets/sprites/background4.png'),
                AssetLoader.loadImage('./assets/sprites/background5.png'),
                AssetLoader.loadSound(audioContext, './assets/sounds/prof-fuck.mp3'),
                AssetLoader.loadSound(audioContext, './assets/sounds/prof-punch.mp3'),
                AssetLoader.loadSound(audioContext, './assets/sounds/prof-smack.mp3'),
                AssetLoader.loadSound(audioContext, './assets/sounds/buzz.mp3'),
                AssetLoader.loadSound(audioContext, './assets/sounds/dingdong.mp3'),
                AssetLoader.loadSound(audioContext, './assets/sounds/drink.mp3'),
                AssetLoader.loadSound(audioContext, './assets/sounds/prof-step.mp3'),
                AssetLoader.loadSound(audioContext, './assets/sounds/prof-theme.mp3'),
                AssetLoader.loadSound(audioContext, './assets/sounds/suina-fuck.mp3'),
                AssetLoader.loadSound(audioContext, './assets/sounds/suina-sound.mp3'),
                AssetLoader.loadSound(audioContext, './assets/sounds/suina-evil.mp3'),
                AssetLoader.loadSound(audioContext, './assets/sounds/suina-walk.mp3'),
                AssetLoader.loadSound(audioContext, './assets/sounds/walter-sound.mp3'),
                AssetLoader.loadSound(audioContext, './assets/sounds/walter-welcome.mp3'),
                AssetLoader.loadSound(audioContext, './assets/sounds/diego-sound.mp3'),
                AssetLoader.loadSound(audioContext, './assets/sounds/milly-sound.mp3'),
                AssetLoader.loadSound(audioContext, './assets/sounds/recharge.mp3'),
                AssetLoader.loadSound(audioContext, './assets/sounds/win.mp3')
            ]);

            console.log('All assets loaded successfully');

            return {
                sprites: {
                    professore: { idle: professoreidle, walking: professorewalking, freeze: skullSprite },
                    milly: { idle: millyidle, spritesheet: millyspritesheet, interact: millyinteract },
                    suina1: { idle: suina1idle, walking: suina1walking, attack: suina1attack },
                    suina2: { idle: suina2idle, walking: suina2walking, attack: suina1attack },
                    suinaevil: { idle: suinaevilidle, walking: suinaevilwalking, attack: suina1attack },
                    walter: { idle: walteridle, walking: walterwalking, attack: walterattack },
                    diego: { idle: diegoidle, walking: diegowalking, attack: diegoattack },
                    splash: splashScreen,
                    instructions: instructionsScreen,
                    winscreen: winScreen
                },
                backgrounds: {
                    background1,
                    background2,
                    background3,
                    background4,
                    background5
                },
                sounds: {
                    proffuck,
                    profpunch,
                    profsmack,
                    buzz,
                    dingdong,
                    drink,
                    profstep,
                    proftheme,
                    suinafuck,
                    suinasound,
                    suinaevil,
                    suinawalk,
                    waltersound,
                    walterwelcome,
                    diegosound,
                    millysound,
                    recharge,
                    win
                },
                audioContext
            };
        } catch (error) {
            console.error('Error loading assets:', error);
            throw new Error('Failed to load assets.');
        }
    }
}