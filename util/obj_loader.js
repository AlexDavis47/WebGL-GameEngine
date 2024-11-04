class OBJLoader {
    static parse(objText) {
        const positions = [];
        const texcoords = [];
        const normals = [];
        const indices = [];

        // Temp arrays to store the raw data from file
        const tempVertices = [];
        const tempTexCoords = [];
        const tempNormals = [];

        // Map to store unique vertex combinations
        const vertexMap = new Map();
        let currentIndex = 0;

        const lines = objText.split('\n');

        for (const line of lines) {
            const tokens = line.trim().split(/\s+/);

            switch(tokens[0]) {
                case 'v':  // Vertex position
                    tempVertices.push([
                        parseFloat(tokens[1]),
                        parseFloat(tokens[2]),
                        parseFloat(tokens[3])
                    ]);
                    break;

                case 'vt':  // Texture coordinate
                    tempTexCoords.push([
                        parseFloat(tokens[1]),
                        tokens.length > 2 ? parseFloat(tokens[2]) : 0.0  // Some files might only have U coordinate
                    ]);
                    break;

                case 'vn':  // Normal
                    tempNormals.push([
                        parseFloat(tokens[1]),
                        parseFloat(tokens[2]),
                        parseFloat(tokens[3])
                    ]);
                    break;

                case 'f':  // Face
                    // Process face vertices (handling both triangles and quads)
                    const faceVertices = [];

                    // Extract vertex data for each corner of the face
                    for (let i = 1; i < tokens.length; i++) {
                        const vertexData = tokens[i].split('/');
                        faceVertices.push({
                            position: parseInt(vertexData[0]) - 1,
                            texcoord: vertexData[1] ? parseInt(vertexData[1]) - 1 : -1,
                            normal: vertexData[2] ? parseInt(vertexData[2]) - 1 : -1
                        });
                    }

                    // Triangulate if necessary (handle quads)
                    for (let i = 1; i < faceVertices.length - 1; i++) {
                        const vertices = [faceVertices[0], faceVertices[i], faceVertices[i + 1]];

                        // Process each vertex of the triangle
                        for (const vertex of vertices) {
                            // Create a unique key for this vertex combination
                            const key = `${vertex.position}/${vertex.texcoord}/${vertex.normal}`;

                            // Check if we've seen this vertex combination before
                            if (!vertexMap.has(key)) {
                                // Add the vertex data to the final arrays
                                const pos = tempVertices[vertex.position];
                                positions.push(...pos);

                                if (vertex.texcoord !== -1 && vertex.texcoord < tempTexCoords.length) {
                                    const tex = tempTexCoords[vertex.texcoord];
                                    texcoords.push(...tex);
                                } else {
                                    // Add default UV coordinates if none provided
                                    texcoords.push(0.0, 0.0);
                                }

                                if (vertex.normal !== -1 && vertex.normal < tempNormals.length) {
                                    const norm = tempNormals[vertex.normal];
                                    normals.push(...norm);
                                } else {
                                    // Add default normal if none provided
                                    normals.push(0.0, 1.0, 0.0);
                                }

                                // Store the new index
                                vertexMap.set(key, currentIndex);
                                indices.push(currentIndex);
                                currentIndex++;
                            } else {
                                // Reuse the existing vertex
                                indices.push(vertexMap.get(key));
                            }
                        }
                    }
                    break;
            }
        }


        return {
            positions: positions,
            texcoords: texcoords,
            normals: normals,
            indices: indices
        };
    }
}

export default OBJLoader;