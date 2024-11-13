/**
 * Developers: Alexander Davis, Maika West, Austin Medina.
 * Date: 11/12/2024
 */
import Model3D from "./model3d.js";

class Skybox extends Model3D {
    constructor() {
        super();
        this.name = "Skybox";

        // Create cube geometry
        const vertices = [
            // Front face
            -1.0, -1.0,  1.0,
            1.0, -1.0,  1.0,
            1.0,  1.0,  1.0,
            -1.0,  1.0,  1.0,

            // Back face
            -1.0, -1.0, -1.0,
            -1.0,  1.0, -1.0,
            1.0,  1.0, -1.0,
            1.0, -1.0, -1.0,

            // Top face
            -1.0,  1.0, -1.0,
            -1.0,  1.0,  1.0,
            1.0,  1.0,  1.0,
            1.0,  1.0, -1.0,

            // Bottom face
            -1.0, -1.0, -1.0,
            1.0, -1.0, -1.0,
            1.0, -1.0,  1.0,
            -1.0, -1.0,  1.0,

            // Right face
            1.0, -1.0, -1.0,
            1.0,  1.0, -1.0,
            1.0,  1.0,  1.0,
            1.0, -1.0,  1.0,

            // Left face
            -1.0, -1.0, -1.0,
            -1.0, -1.0,  1.0,
            -1.0,  1.0,  1.0,
            -1.0,  1.0, -1.0,
        ];

        const indices = [
            0,  1,  2,    0,  2,  3,  // front
            4,  5,  6,    4,  6,  7,  // back
            8,  9,  10,   8,  10, 11, // top
            12, 13, 14,   12, 14, 15, // bottom
            16, 17, 18,   16, 18, 19, // right
            20, 21, 22,   20, 22, 23  // left
        ];

        // Create dummy normals and UVs
        const normals = new Array(vertices.length).fill(0);
        const uvs = new Array((vertices.length / 3) * 2).fill(0);

        this.setGeometry(vertices, indices, normals, uvs);
    }

    async loadCubemap(paths) {
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);

        const faceTargets = [
            gl.TEXTURE_CUBE_MAP_POSITIVE_X,
            gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
            gl.TEXTURE_CUBE_MAP_POSITIVE_Y,
            gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
            gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
            gl.TEXTURE_CUBE_MAP_NEGATIVE_Z
        ];

        // Load all six faces
        for (let i = 0; i < 6; i++) {
            try {
                const response = await fetch(paths[i]);
                const blob = await response.blob();
                const imageBitmap = await createImageBitmap(blob);

                gl.texImage2D(
                    faceTargets[i],
                    0,
                    gl.RGBA,
                    gl.RGBA,
                    gl.UNSIGNED_BYTE,
                    imageBitmap
                );
            } catch (error) {
                console.error(`Failed to load cubemap face ${i}:`, error);
            }
        }

        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);

        // Set the cubemap texture uniform
        this.material.setUniform('u_skyboxTexture', 0); // Use texture unit 0
        this._cubemapTexture = texture; // Store reference for cleanup
    }

    render() {
        const scene = this.getRootNode();
        if (!scene || !scene.activeCamera) return;

        // Disable depth writing
        gl.depthMask(false);
        gl.disable(gl.DEPTH_TEST);
        gl.disable(gl.CULL_FACE);

        // Bind cubemap texture
        if (this._cubemapTexture) {
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_CUBE_MAP, this._cubemapTexture);
        }

        // Center skybox on camera
        this.setPosition(scene.activeCamera.getPositionWorld());

        // Render using parent class
        super.render();

        // Restore depth writing
        gl.depthMask(true);
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);
    }

    onDestroy() {
        if (this._cubemapTexture) {
            gl.deleteTexture(this._cubemapTexture);
            this._cubemapTexture = null;
        }
        super.onDestroy();
    }
}

export default Skybox;