import Node3D from './node3d.js';
import audioManager from "../audio_manager.js";

class AudioReceiver extends Node3D {
    constructor() {
        super();
        this.name = "AudioReceiver";
    }

    onPreInit() {
        super.onPreInit();
        audioManager.setActiveReceiver(this);
    }

    onDestroy() {
        if (audioManager.getActiveReceiver() === this) {
            audioManager.setActiveReceiver(null);
        }
        super.onDestroy();
    }
}



export default AudioReceiver;