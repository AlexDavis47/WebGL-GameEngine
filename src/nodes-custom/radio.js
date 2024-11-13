import Model3D from "../nodes-core/model3d.js";
import StaticBody3D from "../nodes-core/static_body_3d.js";
import AudioPlayer3D from "../nodes-core/audio_player_3d.js";

class Radio extends Model3D {
    constructor() {
        super();
        this.name = "Radio";

        // Define audio tracks
        this.audioTracks = [
            './assets/ambience/portalradio.mp3',
            './assets/ambience/hell.mp3'
        ];
        this.currentTrackIndex = 0; // Start with the first track
    }

    async init() {
        await this.loadModel('./assets/models/radio/radio_obj.obj');
        await this.addShaderPass('./assets/shaders/texture.glsl');
        await this.addShaderPass('./assets/shaders/phong.glsl');
        this.setScale(3, 3, 3);
        this.setPosition(5, 5, 3);

        // Set up the static collision body
        this.radioCollision = new StaticBody3D();
        await this.radioCollision.setCollisionFromOBJ('./assets/models/radio/radio_obj.obj');

        // Add the audio player with the initial track
        this.radioSong = new AudioPlayer3D();
        await this.radioSong.loadSound(this.audioTracks[this.currentTrackIndex], { loop: true });
        this.radioSong.play();

        // Attach components
        this.addChild(this.radioSong);
        this.addChild(this.radioCollision);
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