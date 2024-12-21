// AssetLoader.js
export class AssetLoader {
    static async loadImage(src, fallbackSrc = null) {
        const img = new Image();
        img.src = src;
        return new Promise((resolve, reject) => {
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
        });
    }

    static async loadSound(audioContext, url) {
        try {
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            return await audioContext.decodeAudioData(arrayBuffer);
        } catch (error) {
            console.error(`Failed to load sound: ${url}`, error);
            throw new Error(`Failed to load sound: ${url}`);
        }
    }

    static async loadAssets() {
        try {
            const audioContext = new AudioContext(); 
            const [
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
                profstep,
                proftheme,
		skull,
                suinafuck,
                suinasound,
                suinaevil,
                suinawalk,
                waltersound,
                walterwelcome,
                diegosound,
                millysound
            ] = await Promise.all([
                this.loadImage('./assets/sprites/professore/professore-idle.png'),
                this.loadImage('./assets/sprites/professore/professore-spritesheet.png'),
 		this.loadImage('./assets/sprites/skull.png'),
                this.loadImage('./assets/sprites/milly/milly-idle.png'),
                this.loadImage('./assets/sprites/milly/milly-spritesheet.png'),
                this.loadImage('./assets/sprites/milly/milly-interact.png'),
                this.loadImage('./assets/sprites/suina1/suina1-idle.png'),
                this.loadImage('./assets/sprites/suina1/suina1-spritesheet.png'),
                this.loadImage('./assets/sprites/suina1/suina1-attack.png'),
                this.loadImage('./assets/sprites/suina2/suina2-idle.png'),
                this.loadImage('./assets/sprites/suina2/suina2-spritesheet.png'),
                this.loadImage('./assets/sprites/suina2/suina2-attack.png'),
                this.loadImage('./assets/sprites/suinaEvil/suinaevil-idle.png'),
                this.loadImage('./assets/sprites/suinaEvil/suinaevil-spritesheet.png'),
                this.loadImage('./assets/sprites/suinaEvil/suinaevil-attack.png'),
                this.loadImage('./assets/sprites/walter/walter-idle.png'),
                this.loadImage('./assets/sprites/walter/walter-spritesheet.png'),
                this.loadImage('./assets/sprites/walter/walter-attack.png'),
                this.loadImage('./assets/sprites/diego/diego-idle.png'),
                this.loadImage('./assets/sprites/diego/diego-spritesheet.png'),
                this.loadImage('./assets/sprites/diego/diego-attack.png'),
                this.loadImage('./assets/sprites/background.png'),
                this.loadImage('./assets/sprites/background2.png'),
                this.loadImage('./assets/sprites/background3.png'),
                this.loadImage('./assets/sprites/background4.png'),
                this.loadImage('./assets/sprites/background5.png'),
                this.loadSound(audioContext, './assets/sounds/prof-fuck.mp3'),
                this.loadSound(audioContext, './assets/sounds/prof-punch.mp3'),
                this.loadSound(audioContext, './assets/sounds/prof-smack.mp3'),
		this.loadSound(audioContext, './assets/sounds/buzz.mp3'), 
                this.loadSound(audioContext, './assets/sounds/prof-step.mp3'),
                this.loadSound(audioContext, './assets/sounds/prof-theme.mp3'),
                this.loadSound(audioContext, './assets/sounds/suina-fuck.mp3'),
                this.loadSound(audioContext, './assets/sounds/suina-sound.mp3'),
                this.loadSound(audioContext, './assets/sounds/suina-evil.mp3'),
                this.loadSound(audioContext, './assets/sounds/suina-walk.mp3'),
                this.loadSound(audioContext, './assets/sounds/walter-sound.mp3'),
                this.loadSound(audioContext, './assets/sounds/walter-welcome.mp3'),
                this.loadSound(audioContext, './assets/sounds/diego-sound.mp3'),
                this.loadSound(audioContext, './assets/sounds/milly-sound.mp3')
            ]);

            return {
                sprites: {
                    professore: { idle: professoreidle, walking: professorewalking, freeze: skullSprite },
                    milly: { idle: millyidle, spritesheet: millyspritesheet, interact: millyinteract },
                    suina1: { idle: suina1idle, walking: suina1walking, attack: suina1attack },
                    suina2: { idle: suina2idle, walking: suina2walking, attack: suina1attack },
                    suinaevil: { idle: suinaevilidle, walking: suinaevilwalking, attack: suina1attack },
                    walter: { idle: walteridle, walking: walterwalking, attack: walterattack },
                    diego: { idle: diegoidle, walking: diegowalking, attack: diegoattack }
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
                    profstep,
                    proftheme,
                    suinafuck,
                    suinasound,
                    suinaevil,
                    suinawalk,
                    waltersound,
                    walterwelcome,
                    diegosound,
                    millysound
                },
                audioContext
            };
        } catch (error) {
            console.error('Error loading assets:', error);
            throw new Error('Failed to load assets.');
        }
    }
}
