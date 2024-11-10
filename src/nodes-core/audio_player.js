// audio_player.js
import Node3D from './node3d.js';
import audioManager from '../audio_manager.js';
import audio_manager from "../audio_manager.js";

class AudioPlayer extends Node3D {
    constructor() {
        super();
        this.name = "AudioPlayer";

        this._sound = null;
        this._soundId = null;
        this._currentId = null;
        this._volume = 1.0;
        this._loop = false;
    }

    async loadSound(id, url, options = {}) {
        const absoluteUrl = url.startsWith('/') ? url : '/' + url;

        this._sound = audioManager.loadSound(id, absoluteUrl, {
            volume: this._volume,
            loop: this._loop,
            html5: false,
            ...options
        });

        this._soundId = id;

        return new Promise((resolve, reject) => {
            this._sound.once('load', resolve);
            this._sound.once('loaderror', (_, error) => reject(error));
        });
    }

    play() {
        if (!this._sound) return this;

        if (this._currentId !== null) {
            this.stop();
        }

        this._currentId = this._sound.play();
        audioManager.playSound(this._sound, this._currentId);

        console.log('Position:', this.getPositionWorld());

        return this;
    }

    stop() {
        if (this._currentId !== null) {
            this._sound?.stop(this._currentId);
            this._currentId = null;
        }
        return this;
    }

    pause() {
        if (this._currentId !== null) {
            this._sound?.pause(this._currentId);
        }
        return this;
    }

    setVolume(volume) {
        this._volume = Math.max(0, Math.min(1, volume));
        if (this._currentId !== null && this._sound) {
            this._sound.volume(this._volume, this._currentId);
        }
        return this;
    }

    setLoop(loop) {
        this._loop = loop;
        if (this._currentId !== null && this._sound) {
            this._sound.loop(loop, this._currentId);
        }
        return this;
    }

    isPlaying() {
        return this._currentId !== null && this._sound?.playing(this._currentId);
    }

    onDestroy() {
        this.stop();
        super.onDestroy();
    }
}

export default AudioPlayer;