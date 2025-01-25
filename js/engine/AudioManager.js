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
        this.initializationPromise = null;
    }

    async init() {
        if (this.initializationPromise) {
            return this.initializationPromise;
        }

        // Return if already initialized
        if (this.initialized) {
            return Promise.resolve(true);
        }

        this.initializationPromise = this.performInit();
        return this.initializationPromise;
    }

    async performInit() {
        try {
            console.log('Starting AudioManager initialization...');
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Create and connect gain nodes
            this.musicGainNode = this.audioContext.createGain();
            this.sfxGainNode = this.audioContext.createGain();
            this.musicGainNode.connect(this.audioContext.destination);
            this.sfxGainNode.connect(this.audioContext.destination);

            // Set initial volumes
            this.musicGainNode.gain.setValueAtTime(CONFIG.AUDIO.MUSIC_VOLUME, this.audioContext.currentTime);
            this.sfxGainNode.gain.setValueAtTime(CONFIG.AUDIO.SFX_VOLUME, this.audioContext.currentTime);

            // Add user interaction listeners for audio unlock
            const unlockAudio = () => {
                if (this.audioContext?.state === 'suspended') {
                    this.audioContext.resume();
                }
                document.removeEventListener('click', unlockAudio);
                document.removeEventListener('touchstart', unlockAudio);
            };

            document.addEventListener('click', unlockAudio);
            document.addEventListener('touchstart', unlockAudio);

            // Load all sounds
            await this.loadAllSounds();
            
            this.initialized = true;
            console.log('AudioManager initialized successfully');
            console.log('Available sounds:', Object.keys(this.sounds));

            return true;
        } catch (error) {
            console.error('AudioManager initialization failed:', error);
            this.initialized = false;
            throw error;
        } finally {
            this.initializationPromise = null;
        }
    }

    async loadAllSounds() {
        console.log('Loading sounds...');
        try {
            const soundsToLoad = [
                ['recharge', './assets/sounds/recharge.mp3'],
                ['buzz', './assets/sounds/buzz.mp3'],
                ['dingdong', './assets/sounds/dingdong.mp3'],
                ['drink', './assets/sounds/drink.mp3'],
                ['prof-theme', './assets/sounds/prof-theme.mp3'],
                ['professore_step', './assets/sounds/prof-step.mp3'],
                ['professore_fuck', './assets/sounds/prof-fuck.mp3'],
                ['professore_smack', './assets/sounds/prof-smack.mp3'],
                ['professore_punch', './assets/sounds/prof-punch.mp3'],
                ['walter_welcome', './assets/sounds/walter-welcome.mp3'],
                ['walter_sound', './assets/sounds/walter-sound.mp3'],
                ['suina_walk', './assets/sounds/suina-walk.mp3'],
                ['suina_sound', './assets/sounds/suina-sound.mp3'],
                ['suina_fuck', './assets/sounds/suina-fuck.mp3'],
                ['suina_evil', './assets/sounds/suina-evil.mp3'],
                ['milly_sound', './assets/sounds/milly-sound.mp3'],
                ['diego_sound', './assets/sounds/diego-sound.mp3'],
                ['win', './assets/sounds/win.mp3']
            ];

            await Promise.all(
                soundsToLoad.map(([key, url]) => 
                    this.loadSound(key, url).catch(error => {
                        console.error(`Failed to load sound ${key}:`, error);
                        return null;
                    })
                )
            );

            console.log('All sounds loaded. Available sounds:', Object.keys(this.sounds));
        } catch (error) {
            console.error('Error loading sounds:', error);
            throw error;
        }
    }

    async loadSound(key, url) {
        try {
            console.log(`Loading sound: ${key}`);
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            this.sounds[key] = audioBuffer;
            console.log(`Loaded sound: ${key}`);
        } catch (error) {
            console.error(`Failed to load sound ${key}:`, error);
            throw error;
        }
    }

    playSound(key, type = 'sfx') {
        if (!this.initialized || !this.sounds[key]) {
            console.warn(`Cannot play sound: ${key}`);
            return;
        }

        try {
            const source = this.audioContext.createBufferSource();
            source.buffer = this.sounds[key];
            source.connect(type === 'music' ? this.musicGainNode : this.sfxGainNode);
            source.start(0);
            console.log(`Playing sound: ${key}`);
        } catch (error) {
            console.error(`Error playing sound ${key}:`, error);
        }
    }

    playBackgroundMusic() {
        if (!this.initialized || !this.sounds['prof-theme']) {
            console.warn('Cannot play background music - system not ready');
            return;
        }

        try {
            if (this.currentMusicSource) {
                this.currentMusicSource.stop();
            }

            this.currentMusicSource = this.audioContext.createBufferSource();
            this.currentMusicSource.buffer = this.sounds['prof-theme'];
            this.currentMusicSource.loop = true;
            this.currentMusicSource.connect(this.musicGainNode);
            this.currentMusicSource.start(0);
            console.log('Background music started');
        } catch (error) {
            console.error('Error playing background music:', error);
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

    handleFootsteps(player, isMoving) {
        if (isMoving) {
            const now = Date.now();
            if (!this.lastFootstepTime || now - this.lastFootstepTime > CONFIG.AUDIO.FOOTSTEP_INTERVAL) {
                this.playSound('professore_step');
                this.lastFootstepTime = now;
            }
        }
    }
}