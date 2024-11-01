//FileName:     shape.js
//Programmers:  Alexander Davis, Maika West, Austin Medina
//Date:         10/30/2024
//Purpose:      Represents a 3D shape in WebGL, contains vertices, colors, indices, and normals

class Shape {
    constructor(vertices, colors, indices, drawMode = WebGL2RenderingContext.TRIANGLES, normals = null, shininess = 50.0) {
        this.vertices = vertices;
        this.colors = colors;
        this.indices = indices;
        this.drawMode = drawMode;
        this.normals = normals;
        this.shininess = shininess;

        // WebGL buffers - initialized when the shape is added to a model
        this.vertexBuffer = null;
        this.colorBuffer = null;
        this.indexBuffer = null;
        this.normalBuffer = null;
        this.shininessBuffer = null;
    }

    // Method to calculate normals if not provided
    calculateNormals() {
        if (!this.normals && this.indices && this.vertices) {
            // Initialize array for counting how many faces contribute to each vertex
            const counts = new Array(this.vertices.length / 3).fill(0);
            this.normals = new Array(this.vertices.length).fill(0);

            // Process each triangle
            for (let i = 0; i < this.indices.length; i += 3) {
                // Get indices for the triangle vertices
                const i0 = this.indices[i];
                const i1 = this.indices[i + 1];
                const i2 = this.indices[i + 2];

                // Get vertices of the triangle
                const v0 = [
                    this.vertices[i0 * 3],
                    this.vertices[i0 * 3 + 1],
                    this.vertices[i0 * 3 + 2]
                ];
                const v1 = [
                    this.vertices[i1 * 3],
                    this.vertices[i1 * 3 + 1],
                    this.vertices[i1 * 3 + 2]
                ];
                const v2 = [
                    this.vertices[i2 * 3],
                    this.vertices[i2 * 3 + 1],
                    this.vertices[i2 * 3 + 2]
                ];

                // Calculate vectors for two edges of the triangle
                const edge1 = [
                    v1[0] - v0[0],
                    v1[1] - v0[1],
                    v1[2] - v0[2]
                ];

                const edge2 = [
                    v2[0] - v0[0],
                    v2[1] - v0[1],
                    v2[2] - v0[2]
                ];

                // Calculate cross product to get face normal
                const normal = [
                    edge1[1] * edge2[2] - edge1[2] * edge2[1],
                    edge1[2] * edge2[0] - edge1[0] * edge2[2],
                    edge1[0] * edge2[1] - edge1[1] * edge2[0]
                ];

                // Normalize the face normal
                const length = Math.sqrt(
                    normal[0] * normal[0] +
                    normal[1] * normal[1] +
                    normal[2] * normal[2]
                );

                if (length > 0) {
                    normal[0] /= length;
                    normal[1] /= length;
                    normal[2] /= length;
                }

                // Add the face normal to each vertex of the triangle
                // and increment the count for each vertex
                [i0, i1, i2].forEach(vertexIndex => {
                    this.normals[vertexIndex * 3] += normal[0];
                    this.normals[vertexIndex * 3 + 1] += normal[1];
                    this.normals[vertexIndex * 3 + 2] += normal[2];
                    counts[vertexIndex]++;
                });
            }

            // Average and normalize the vertex normals
            for (let i = 0; i < this.normals.length; i += 3) {
                const count = counts[i / 3];
                if (count > 0) {
                    this.normals[i] /= count;
                    this.normals[i + 1] /= count;
                    this.normals[i + 2] /= count;

                    // Normalize the final normal
                    const length = Math.sqrt(
                        this.normals[i] * this.normals[i] +
                        this.normals[i + 1] * this.normals[i + 1] +
                        this.normals[i + 2] * this.normals[i + 2]
                    );

                    if (length > 0) {
                        this.normals[i] /= length;
                        this.normals[i + 1] /= length;
                        this.normals[i + 2] /= length;
                    }
                }
            }
        }
    }
}