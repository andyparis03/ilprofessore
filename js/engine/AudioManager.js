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

        this.initializationPromise = (async () => {
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

                // Ensure audio context is resumed
                await this.ensureAudioContextResume();
                
                // Load all sounds
                await this.loadAllSounds();
                
                this.initialized = true;
                console.log('AudioManager initialized successfully');
                console.log('Available sounds:', Object.keys(this.sounds));

                // Start background music if available
                if (this.sounds['prof-theme']) {
                    await this.playBackgroundMusic();
                }

                return true;
            } catch (error) {
                console.error('AudioManager initialization failed:', error);
                this.initialized = false;
                throw error;
            }
        })();

        return this.initializationPromise;
    }

    async loadAllSounds() {
        console.log('Loading sounds...');
        try {
            const soundsToLoad = [
                ['buzz', './assets/sounds/buzz.mp3'],
		['dingdong', './assets/sounds/dingdong.mp3'],
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
                ['diego_sound', './assets/sounds/diego-sound.mp3']
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
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            this.sounds[key] = audioBuffer;
            console.log(`Loaded sound: ${key}`);
        } catch (error) {
            console.error(`Failed to load sound ${key}:`, error);
            throw error;
        }
    }

    playBackgroundMusic() {
        if (!this.initialized || !this.sounds['prof-theme']) {
            console.warn('Cannot play background music - system not ready or music not loaded');
            return;
        }

        try {
            // Stop current music if playing
            if (this.currentMusicSource) {
                this.currentMusicSource.stop();
            }

            // Create new source
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

    async ensureAudioContextResume() {
        if (this.audioContext.state === 'suspended') {
            return new Promise((resolve) => {
                const resumeAudio = async () => {
                    await this.audioContext.resume();
                    window.removeEventListener('click', resumeAudio);
                    window.removeEventListener('keydown', resumeAudio);
                    resolve();
                };

                window.addEventListener('click', resumeAudio);
                window.addEventListener('keydown', resumeAudio);
            });
        }
        return Promise.resolve();
    }

    playSound(key, type = 'sfx') {
        if (!this.initialized) {
            console.warn('AudioManager not initialized. Cannot play sound:', key);
            return;
        }

        if (!this.sounds[key]) {
            console.warn(`Sound not found: ${key}. Available sounds:`, Object.keys(this.sounds));
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