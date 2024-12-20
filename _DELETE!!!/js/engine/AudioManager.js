// AudioManager.js
import { CONFIG } from '../../config.js';

export class AudioManager {
    constructor() {
        this.sounds = {};
        this.music = {};
        this.audioContext = null;
        this.musicGainNode = null;
        this.sfxGainNode = null;
        this.currentMusicSource = null;
        this.initialized = false;
    }

    async init() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.musicGainNode = this.audioContext.createGain();
            this.sfxGainNode = this.audioContext.createGain();
            this.musicGainNode.connect(this.audioContext.destination);
            this.sfxGainNode.connect(this.audioContext.destination);

            this.musicGainNode.gain.setValueAtTime(CONFIG.AUDIO.MUSIC_VOLUME, this.audioContext.currentTime);
            this.sfxGainNode.gain.setValueAtTime(CONFIG.AUDIO.SFX_VOLUME, this.audioContext.currentTime);

            await this.ensureAudioContextResume();
            await this.loadAllSounds();
            this.initialized = true;
            console.log('AudioManager initialized successfully.');

            if (this.music['prof-theme']) {
                this.playBackgroundMusic();
            } else {
                console.warn('Theme music is not loaded.');
            }
        } catch (error) {
            console.error('AudioManager initialization failed:', error);
        }
    }

    async ensureAudioContextResume() {
        if (this.audioContext.state === 'suspended') {
            return new Promise((resolve) => {
                const resumeAudio = () => {
                    this.audioContext.resume().then(() => {
                        console.log('AudioContext resumed.');
                        window.removeEventListener('click', resumeAudio);
                        window.removeEventListener('keydown', resumeAudio);
                        resolve();
                    }).catch((error) => {
                        console.error('Failed to resume AudioContext:', error);
                    });
                };
                window.addEventListener('click', resumeAudio);
                window.addEventListener('keydown', resumeAudio);
            });
        }
    }

    async loadAllSounds() {
        console.log('Loading sounds...');
        try {
            await Promise.all([
                this.loadSound('prof-theme', './assets/sounds/prof-theme.mp3', 'music'),
                this.loadSound('professore_step', './assets/sounds/prof-step.mp3', 'sfx'),
                this.loadSound('professore_fuck', './assets/sounds/prof-fuck.mp3', 'sfx'),
                this.loadSound('professore_smack', './assets/sounds/prof-smack.mp3', 'sfx'),
                this.loadSound('professore_punch', './assets/sounds/prof-punch.mp3', 'sfx'),
                this.loadSound('walter_welcome', './assets/sounds/walter-welcome.mp3', 'sfx'),
                this.loadSound('walter_sound', './assets/sounds/walter-sound.mp3', 'sfx'),
                this.loadSound('suina_walk', './assets/sounds/suina-walk.mp3', 'sfx'),
                this.loadSound('suina_sound', './assets/sounds/suina-sound.mp3', 'sfx'),
                this.loadSound('suina_fuck', './assets/sounds/suina-fuck.mp3', 'sfx'),
                this.loadSound('suina_evil', './assets/sounds/suina-evil.mp3', 'sfx'),
                this.loadSound('milly_sound', './assets/sounds/milly-sound.mp3', 'sfx'),
                this.loadSound('diego_sound', './assets/sounds/diego-sound.mp3', 'sfx')
            ]);
            console.log('All sounds loaded successfully.');
        } catch (error) {
            console.error('Failed to load some sounds:', error);
        }
    }

    async loadSound(key, url, type = 'sfx') {
        try {
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

            if (type === 'music') {
                this.music[key] = audioBuffer;
            } else {
                this.sounds[key] = audioBuffer;
            }
            console.log(`Sound loaded: ${key} (${type})`);
        } catch (error) {
            console.error(`Failed to load sound: ${key} from ${url}`, error);
            throw new Error(`Failed to load sound: ${key}`);
        }
    }

    playBackgroundMusic() {
        if (!this.initialized || !this.music['prof-theme']) {
            console.warn('Background music not initialized or theme music not loaded.', {
                initialized: this.initialized,
                themeLoaded: !!this.music['prof-theme']
            });
            return;
        }

        if (this.currentMusicSource) {
            this.currentMusicSource.stop();
        }

        this.currentMusicSource = this.audioContext.createBufferSource();
        this.currentMusicSource.buffer = this.music['prof-theme'];
        this.currentMusicSource.loop = true;
        this.currentMusicSource.connect(this.musicGainNode);
        this.currentMusicSource.start(0);
        console.log('Background music started.');
    }

    playSound(key, type = 'sfx') {
        if (!this.initialized) {
            console.warn('AudioManager not initialized.');
            return;
        }

        const buffer = type === 'music' ? this.music[key] : this.sounds[key];
        if (!buffer) {
            console.warn(`Sound not found: ${key}`);
            return;
        }

        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        const gainNode = type === 'music' ? this.musicGainNode : this.sfxGainNode;
        source.connect(gainNode);
        source.start();
        console.log(`Playing sound: ${key}`);
    }

    handleFootsteps(player, isMoving) {
        if (isMoving) {
            const now = Date.now();
            if (!this.lastFootstepTime || now - this.lastFootstepTime > CONFIG.AUDIO.FOOTSTEP_INTERVAL) {
                this.playSound('professore_step');
                this.lastFootstepTime = now;
            }
        }
    }

    setMusicVolume(volume) {
        if (this.musicGainNode) {
            this.musicGainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
        }
    }

    setSFXVolume(volume) {
        if (this.sfxGainNode) {
            this.sfxGainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
        }
    }
}
