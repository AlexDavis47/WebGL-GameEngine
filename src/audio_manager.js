/**
 * Developers: Alexander Davis, Maika West, Austin Medina.
 * Date: 11/12/2024
 */
import {Howler} from 'howler';

class AudioManager {
    constructor() {
        if (AudioManager.instance) return AudioManager.instance;

        this._sounds = new Map();
        this._globalVolume = 1.0;
        this._musicVolume = 1.0;
        this._sfxVolume = 1.0;
        this._activeReceiver = null;
        this._muted = false;
        this._unlocked = false;
        this._pendingPlaybacks = [];

        Howler.pos(0, 0, 0);
        Howler.orientation(0, 0, -1, 0, 1, 0);

        AudioManager.instance = this;
    }

    init() {
        Howler.autoUnlock = true;
        Howler.autoSuspend = false;
        return this;
    }

    // Volume controls
    setGlobalVolume(volume) {
        this._globalVolume = Math.max(0, Math.min(1, volume));
        Howler.volume(this._globalVolume);
        return this;
    }

    setMusicVolume(volume) {
        this._musicVolume = Math.max(0, Math.min(1, volume));
        return this;
    }

    setSFXVolume(volume) {
        this._sfxVolume = Math.max(0, Math.min(1, volume));
        return this;
    }

    // Utility methods
    isUnlocked() { return this._unlocked; }
    getSound(id) { return this._sounds.get(id); }
    getActiveReceiver() { return this._activeReceiver; }
    mute() { this._muted = true; Howler.mute(true); return this; }
    unmute() { this._muted = false; Howler.mute(false); return this; }
    stopAll() { Howler.stop(); this._pendingPlaybacks = []; return this; }
}


const audioManager = new AudioManager();
export default audioManager;