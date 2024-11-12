// audio_player.js
import Node3D from './node3d.js';


class AudioPlayer extends Node3D {
    constructor() {
        super();
        this.name = "AudioPlayer";
        this._sound = null;
        this._soundId = null;
        this._isPlaying = false;
        this._autoplay = false;
        this._volume = 1.0;
        this._minPitch = 0.9;  // Minimum pitch
        this._maxPitch = 1.1;  // Maximum pitch
    }

    async loadSound(url, options = {}) {
        this._autoplay = options.autoplay ?? false;
        this._volume = options.volume ?? 1.0;
        this._minPitch = options.minPitch ?? 0.9;
        this._maxPitch = options.maxPitch ?? 1.1;

        this._sound = new Howl({
            src: [url],
            loop: options.loop ?? false,
            volume: this._volume,
            ...options
        });

        // If autoplay was requested, play immediately
        if (this._autoplay) {
            this.play();
        }
    }

    play() {
        if (!this._sound) return this;

        if (this._isPlaying) {
            this.stop();
        }

        // Set a random playback rate within the specified pitch range
        const randomPitch = Math.random() * (this._maxPitch - this._minPitch) + this._minPitch;
        this._sound.rate(randomPitch);

        this._soundId = this._sound.play();
        this._isPlaying = true;
        return this;
    }

    stop() {
        if (!this._sound || !this._isPlaying) return this;

        this._sound.stop(this._soundId);
        this._isPlaying = false;
        this._soundId = null;
        return this;
    }

    pause() {
        if (!this._sound || !this._isPlaying) return this;

        this._sound.pause(this._soundId);
        this._isPlaying = false;
        return this;
    }

    setVolume(volume) {
        this._volume = Math.max(0, Math.min(1, volume));
        if (this._sound && this._soundId !== null) {
            this._sound.volume(this._volume, this._soundId);
        }
        return this;
    }

    setPitchRange(minPitch, maxPitch) {
        this._minPitch = minPitch;
        this._maxPitch = maxPitch;
        return this;
    }


}
export default AudioPlayer;