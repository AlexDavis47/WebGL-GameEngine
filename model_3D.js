class Model3D extends Object3D {
    constructor(gl) {
        super();
        this.gl = gl;

        // Buffer data
        this.vao = null;
        this.vertexBuffer = null;
        this.normalBuffer = null;
        this.uvBuffer = null;
        this.indexBuffer = null;

        // Geometry data
        this.vertices = [];
        this.normals = [];
        this.uvs = [];
        this.indices = [];

        // Render stats
        this.indexCount = 0;
    }

    async loadFromOBJ(objText) {
        const lines = objText.split('\n');

        // Temporary arrays for parsing
        const tempVertices = [];
        const tempNormals = [];
        const tempUVs = [];
        const vertexIndices = [];
        const normalIndices = [];
        const uvIndices = [];

        // Parse OBJ file
        for (let line of lines) {
            line = line.trim();
            if (line === '' || line.startsWith('#')) continue;

            const parts = line.split(/\s+/);

            switch(parts[0]) {
                case 'v':
                    // Vertex position
                    tempVertices.push([
                        parseFloat(parts[1]),
                        parseFloat(parts[2]),
                        parseFloat(parts[3])
                    ]);
                    break;

                case 'vn':
                    // Vertex normal
                    tempNormals.push([
                        parseFloat(parts[1]),
                        parseFloat(parts[2]),
                        parseFloat(parts[3])
                    ]);
                    break;

                case 'vt':
                    // Texture coordinate
                    tempUVs.push([
                        parseFloat(parts[1]),
                        parseFloat(parts[2])
                    ]);
                    break;

                case 'f':
                    // Face
                    for (let i = 1; i <= 3; i++) {
                        const vertexData = parts[i].split('/');
                        vertexIndices.push(parseInt(vertexData[0]) - 1);
                        if (vertexData[1] !== '') {
                            uvIndices.push(parseInt(vertexData[1]) - 1);
                        }
                        if (vertexData[2]) {
                            normalIndices.push(parseInt(vertexData[2]) - 1);
                        }
                    }
                    break;
            }
        }

        // Debug log
        console.log('Loaded OBJ data:');
        console.log('Temp vertices:', tempVertices.length);
        console.log('Temp normals:', tempNormals.length);
        console.log('Temp UVs:', tempUVs.length);
        console.log('Vertex indices:', vertexIndices.length);

        // Process the indexed data into flat arrays
        for (let i = 0; i < vertexIndices.length; i++) {
            const vertexIndex = vertexIndices[i];
            const vertex = tempVertices[vertexIndex];
            this.vertices.push(...vertex);

            if (uvIndices.length > 0 && i < uvIndices.length) {
                const uvIndex = uvIndices[i];
                const uv = tempUVs[uvIndex];
                this.uvs.push(...uv);
            }

            if (normalIndices.length > 0 && i < normalIndices.length) {
                const normalIndex = normalIndices[i];
                const normal = tempNormals[normalIndex];
                this.normals.push(...normal);
            }

            this.indices.push(i);
        }

        // Debug log processed data
        console.log('Processed geometry:');
        console.log('Vertices:', this.vertices.length / 3, 'positions');
        console.log('Normals:', this.normals.length / 3, 'normals');
        console.log('UVs:', this.uvs.length / 2, 'coordinates');
        console.log('Indices:', this.indices.length);

        // Create buffers
        this._createBuffers();
    }

    _createBuffers() {
        const gl = this.gl;

        // Create and bind VAO
        this.vao = gl.createVertexArray();
        gl.bindVertexArray(this.vao);

        // Vertex positions
        this.vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertices), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);

        // Indices
        this.indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indices), gl.STATIC_DRAW);

        // Cleanup
        gl.bindVertexArray(null);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

        // Store index count for rendering
        this.indexCount = this.indices.length;
        console.log('Buffer creation complete. Index count:', this.indexCount);
    }

    draw(shader) {
        if (!this.vao || !this.isVisibleInTree() || !shader) {
            console.log('Draw skipped:', {
                vao: !!this.vao,
                visible: this.isVisibleInTree(),
                shader: !!shader
            });
            return;
        }

        const gl = this.gl;

        // Use the provided shader
        shader.use();
        gl.bindVertexArray(this.vao);

        // Draw the model
        gl.drawElements(gl.TRIANGLES, this.indexCount, gl.UNSIGNED_SHORT, 0);
        console.log('Drawing with index count:', this.indexCount);

        // Cleanup
        gl.bindVertexArray(null);
    }
}

// Update initObjects in model.js
async function initObjects() {
    try {
        const response = await fetch('models/cube.obj');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const objText = await response.text();

        // Create test cube
        const cube = new Model3D(gl);
        await cube.loadFromOBJ(objText);

        // Position the cube in view
        cube.position = glMatrix.vec3.fromValues(0, 0, -2);

        // Add to scene graph
        root.addChild(cube);

        console.log('Cube loaded and added to scene');
    } catch (error) {
        console.error('Error loading model:', error);
    }
}