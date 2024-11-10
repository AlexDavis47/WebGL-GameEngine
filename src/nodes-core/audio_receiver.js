import Node3D from './node3d.js';

class AudioReceiver extends Node3D {
    constructor() {
        super();
        this.name = "AudioReceiver";
    }

    onPreInit() {
        super.onPreInit();

        const updateListener = () => {
            if (this.isDestroyed) return;

            const position = this.getPositionWorld();
            const forward = this.getForwardVector();
            const up = this.getUpVector();

            Howler.pos(position[0] * 0.01, position[1] * 0.01, position[2] * 0.01);
            Howler.orientation(forward[0], forward[1], forward[2], up[0], up[1], up[2]);

            requestAnimationFrame(updateListener);
        };
        updateListener();
    }
}




export default AudioReceiver;