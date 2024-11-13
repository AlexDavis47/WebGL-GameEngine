/**
 * Developers: Alexander Davis, Maika West, Austin Medina.
 * Date: 11/12/2024
 */
import Model3D from "../nodes-core/model3d.js";
import AudioPlayer3D from "../nodes-core/audio_player_3d.js";
import PhysicsBody3D from "../nodes-core/physics_body_3d.js";

class Radio extends PhysicsBody3D {
    constructor() {
        super();
        this.name = "Radio";
        this.radioVisual = new Model3D();

        this.lightTimer = 0;
        this.lightInterval = 0.5;

        // Define audio tracks
        this.audioTracks = [
            './assets/ambience/portalradio.mp3',
            './assets/ambience/hell.mp3'
        ];
        this.currentTrackIndex = 0; // Start with the first track
    }

    async init() {

        await this.radioVisual.loadModel('./assets/models/radio/radio_obj.obj');
        await this.radioVisual.addShaderPass('./assets/shaders/texture.glsl');
        await this.radioVisual.addShaderPass('./assets/shaders/phong.glsl');
        this.setScale(2, 2, 2)

        await this.setBoxShape(2, 2, 0.5);

        // Add the audio player with the initial track
        this.radioSong = new AudioPlayer3D();
        await this.radioSong.loadSound(this.audioTracks[this.currentTrackIndex], { loop: true });
        this.radioSong.play();

        // Attach components
        this.addChild(this.radioSong);
        this.addChild(this.radioVisual);
        this.setPosition(0, 5, 0);
        await super.init();

    }

    update(deltaTime) {
        super.update(deltaTime);
    }


    async toggleSong() {
        // Toggle the track index (0 -> 1 or 1 -> 0)
        this.currentTrackIndex = 1 - this.currentTrackIndex;
        const newTrack = this.audioTracks[this.currentTrackIndex];

        console.log("Switching song to:", newTrack);

        // Stop the current track, load the new one, and play
        this.radioSong.stop();
        await this.radioSong.loadSound(newTrack, { loop: true });
        this.radioSong.play();
    }
}

export default Radio;