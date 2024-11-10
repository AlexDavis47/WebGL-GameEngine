import AudioPlayer from "./audio_player.js";
import audioManager from "../audio_manager.js";

class AudioPlayer3D extends AudioPlayer {
    constructor() {
        super();
        this.name = "AudioPlayer3D";

        // Spatial settings based on Howler's example
        this._spatialProps = {
            panningModel: 'HRTF',
            refDistance: 0.8,
            rolloffFactor: 2.5,
            distanceModel: 'exponential',
            maxDistance: 100,
            coneInnerAngle: 360,
            coneOuterAngle: 360,
            coneOuterGain: 0
        };
    }

    async loadSound(id, url, options = {}) {
        const absoluteUrl = url.startsWith('/') ? url : '/' + url;

        this._sound = audioManager.loadSound(id, absoluteUrl, {
            ...options,
            spatial: true,
            pannerAttr: this._spatialProps
        });

        // Set initial position after load
        this._sound.once('load', () => {
            this.updatePosition();
        });

        return new Promise((resolve, reject) => {
            this._sound.once('load', resolve);
            this._sound.once('loaderror', (_, error) => reject(error));
        });
    }

    setSpatialProperties({
                             refDistance = 0.8,
                             rolloffFactor = 2.5,
                             maxDistance = 25,
                             distanceModel = 'exponential'
                         } = {}) {
        Object.assign(this._spatialProps, {
            refDistance,
            rolloffFactor,
            maxDistance,
            distanceModel
        });

        if (this._sound && this._currentId !== null) {
            this._sound.pannerAttr(this._spatialProps, this._currentId);
        }
        return this;
    }



    updatePosition() {
        if (this._currentId !== null && this._sound) {
            const worldPos = this.getPositionWorld();
            const forward = this.getForwardVector();

            this._sound.pos(
                worldPos[0],
                worldPos[1],
                worldPos[2],
                this._currentId
            );

            this._sound.orientation(
                forward[0],
                forward[1],
                forward[2],
                this._currentId
            );
        }
    }

    play() {
        if (!this._sound) return this;

        if (this._currentId !== null) {
            this.stop();
        }

        this._currentId = this._sound.play();
        this.updatePosition();

        return this;
    }


    onPreUpdate() {
        super.onPreUpdate();
        this.updatePosition();
    }
}

export default AudioPlayer3D;