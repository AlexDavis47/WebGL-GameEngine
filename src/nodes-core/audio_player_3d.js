import AudioPlayer from "./audio_player.js";
import Node3D from "./node3d.js";


class AudioPlayer3D extends AudioPlayer {
    constructor() {
        super();
        this.name = "AudioPlayer3D";
        this._updateCallback = null;
        this._spatialSettings = {
            panningModel: 'HRTF',
            refDistance: 0.8,
            rolloffFactor: 2.5,
            distanceModel: 'exponential'
        };
    }

    async loadSound(url, options = {}) {
        // Merge base options with spatial settings
        const spatialOptions = {
            ...options,
            spatial: true,
            pannerAttr: {
                ...this._spatialSettings,
                ...options.pannerAttr
            }
        };

        await super.loadSound(url, spatialOptions);
    }

    play() {
        super.play();

        // Start position updates only for 3D audio
        if (this._isPlaying && !this._updateCallback) {
            const updateSound = () => {
                if (this.isDestroyed) {
                    this.stop();
                    return;
                }
                const pos = this.getPositionWorld();
                this._sound.pos(pos[0] * 0.01, pos[1] * 0.01, pos[2] * 0.01, this._soundId);
                this._updateCallback = requestAnimationFrame(updateSound);
            };
            updateSound();
        }

        return this;
    }

    stop() {
        if (this._updateCallback) {
            cancelAnimationFrame(this._updateCallback);
            this._updateCallback = null;
        }
        return super.stop();
    }

    setSpatialSettings(settings = {}) {
        Object.assign(this._spatialSettings, settings);
        if (this._sound && this._soundId !== null) {
            this._sound.pannerAttr(this._spatialSettings, this._soundId);
        }
        return this;
    }

    onDestroy() {
        if (this._updateCallback) {
            cancelAnimationFrame(this._updateCallback);
            this._updateCallback = null;
        }
        super.onDestroy();
    }
}

export default AudioPlayer3D;