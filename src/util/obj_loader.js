class OBJLoader {
    static parse(objText) {
        const positions = [];
        const texcoords = [];
        const normals = [];
        const indices = [];

        const tempVertices = [];
        const tempTexCoords = [];
        const tempNormals = [];

        const vertexMap = new Map();
        let currentIndex = 0;
        let hasTexCoords = false;

        const lines = objText.split('\n');

        // First pass: collect data and determine if we have texture coordinates
        for (const line of lines) {
            const tokens = line.trim().split(/\s+/);
            if (tokens[0] === 'vt') {
                hasTexCoords = true;
                break;
            }
        }

        for (const line of lines) {
            const tokens = line.trim().split(/\s+/);

            switch(tokens[0]) {
                case 'v':
                    tempVertices.push([
                        parseFloat(tokens[1]),
                        parseFloat(tokens[2]),
                        parseFloat(tokens[3])
                    ]);
                    break;

                case 'vt':
                    // Ensure Y coordinate is properly flipped (1 - v)
                    tempTexCoords.push([
                        parseFloat(tokens[1]),
                        1.0 - (tokens.length > 2 ? parseFloat(tokens[2]) : 0.0)
                    ]);
                    break;

                case 'vn':
                    tempNormals.push([
                        parseFloat(tokens[1]),
                        parseFloat(tokens[2]),
                        parseFloat(tokens[3])
                    ]);
                    break;

                case 'f':
                    const faceVertices = [];

                    // Handle different face formats: v, v/t, v//n, v/t/n
                    for (let i = 1; i < tokens.length; i++) {
                        const vertexData = tokens[i].split('/');
                        const position = parseInt(vertexData[0]) - 1;
                        const texcoord = vertexData[1] ? parseInt(vertexData[1]) - 1 : -1;
                        const normal = vertexData[2] ? parseInt(vertexData[2]) - 1 : -1;

                        faceVertices.push({ position, texcoord, normal });
                    }

                    // Triangulate faces (handle both triangles and quads)
                    for (let i = 1; i < faceVertices.length - 1; i++) {
                        const vertices = [faceVertices[0], faceVertices[i], faceVertices[i + 1]];

                        for (const vertex of vertices) {
                            // Create a unique key that includes all vertex attributes
                            const key = `${vertex.position}/${vertex.texcoord}/${vertex.normal}`;

                            if (!vertexMap.has(key)) {
                                // Add position
                                const pos = tempVertices[vertex.position];
                                positions.push(...pos);

                                // Handle texture coordinates
                                if (vertex.texcoord !== -1 && vertex.texcoord < tempTexCoords.length) {
                                    const tex = tempTexCoords[vertex.texcoord];
                                    texcoords.push(...tex);
                                } else if (hasTexCoords) {
                                    // If model has some UV coords but this vertex doesn't,
                                    // generate planar mapping based on position
                                    const pos = tempVertices[vertex.position];
                                    texcoords.push(
                                        (pos[0] + 1) * 0.5,
                                        (pos[2] + 1) * 0.5
                                    );
                                } else {
                                    // Model has no UV coords at all
                                    texcoords.push(0.0, 0.0);
                                }

                                // Handle normals
                                if (vertex.normal !== -1 && vertex.normal < tempNormals.length) {
                                    const norm = tempNormals[vertex.normal];
                                    normals.push(...norm);
                                } else {
                                    // Calculate flat normal if none provided
                                    normals.push(0.0, 1.0, 0.0);
                                }

                                vertexMap.set(key, currentIndex);
                                indices.push(currentIndex);
                                currentIndex++;
                            } else {
                                indices.push(vertexMap.get(key));
                            }
                        }
                    }
                    break;
            }
        }

        return {
            positions,
            texcoords,
            normals,
            indices,
            hasTexCoords
        };
    }
}

export default OBJLoader;