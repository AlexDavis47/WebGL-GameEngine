import Scene from './scene.js';
import Camera3D from './camera3d.js';
import Model3D from './model3d.js';

class TestScene extends Scene {
    constructor() {
        super();
        this.name = "TestScene";
        this.camera = null;
    }

    init(gl) {
        // Create and set up camera
        this.camera = new Camera3D()
            .setPosition(0, 2, 5)
            .setPerspective(60, 0.1, 1000)
            .setMoveSpeed(5.0)
            .setLookSpeed(0.002);

        this.addChild(this.camera);
        this.activeCamera = this.camera;

        // Create a simple cube
        const cube = new Model3D(gl);

        // Cube vertices
        const vertices = [
            // Front face
            -1, -1,  1,
            1, -1,  1,
            1,  1,  1,
            -1,  1,  1,
            // Back face
            -1, -1, -1,
            -1,  1, -1,
            1,  1, -1,
            1, -1, -1,
            // Top face
            -1,  1, -1,
            -1,  1,  1,
            1,  1,  1,
            1,  1, -1,
            // Bottom face
            -1, -1, -1,
            1, -1, -1,
            1, -1,  1,
            -1, -1,  1,
            // Right face
            1, -1, -1,
            1,  1, -1,
            1,  1,  1,
            1, -1,  1,
            // Left face
            -1, -1, -1,
            -1, -1,  1,
            -1,  1,  1,
            -1,  1, -1,
        ];

        // Cube indices
        const indices = [
            0,  1,  2,    0,  2,  3,  // Front
            4,  5,  6,    4,  6,  7,  // Back
            8,  9,  10,   8,  10, 11, // Top
            12, 13, 14,   12, 14, 15, // Bottom
            16, 17, 18,   16, 18, 19, // Right
            20, 21, 22,   20, 22, 23  // Left
        ];

        // Cube normals
        const normals = [
            // Front
            0, 0, 1,   0, 0, 1,   0, 0, 1,   0, 0, 1,
            // Back
            0, 0, -1,  0, 0, -1,  0, 0, -1,  0, 0, -1,
            // Top
            0, 1, 0,   0, 1, 0,   0, 1, 0,   0, 1, 0,
            // Bottom
            0, -1, 0,  0, -1, 0,  0, -1, 0,  0, -1, 0,
            // Right
            1, 0, 0,   1, 0, 0,   1, 0, 0,   1, 0, 0,
            // Left
            -1, 0, 0,  -1, 0, 0,  -1, 0, 0,  -1, 0, 0
        ];

        // Simple UV coordinates
        const uvs = [
            // Front
            0, 0,   1, 0,   1, 1,   0, 1,
            // Back
            0, 0,   1, 0,   1, 1,   0, 1,
            // Top
            0, 0,   1, 0,   1, 1,   0, 1,
            // Bottom
            0, 0,   1, 0,   1, 1,   0, 1,
            // Right
            0, 0,   1, 0,   1, 1,   0, 1,
            // Left
            0, 0,   1, 0,   1, 1,   0, 1
        ];

        // Set up cube geometry
        cube.setGeometry(vertices, indices, normals, uvs);
        cube.setPosition(0, 0, 0);
        cube.setScale(0.5, 0.5, 0.5);
        cube.setBaseColor(1.0, 0.0, 0.0); // This would make it red
        this.addChild(cube);

        // Set up basic scene lighting
        this.setAmbientLight(0.2, 0.2, 0.2);

        super.init(gl);
    }

    update(deltaTime) {
        // You could add test scene specific updates here
        super.update(deltaTime);
    }
}

export default TestScene;