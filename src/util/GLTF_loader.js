class GLTFLoader {
    static async load(url) {
        try {
            const isGLB = url.toLowerCase().endsWith('.glb');
            let json, binChunk;

            if (isGLB) {
                const response = await fetch(url);
                const buffer = await response.arrayBuffer();
                ({ json, binChunk } = this.parseGLB(buffer));
            } else {
                const response = await fetch(url);
                json = await response.json();

                // If there's a separate .bin file referenced
                if (json.buffers && json.buffers[0].uri) {
                    const binUrl = new URL(json.buffers[0].uri, url).href;
                    const binResponse = await fetch(binUrl);
                    binChunk = await binResponse.arrayBuffer();
                }
            }

            // Parse the actual mesh data
            return await this.parseGLTF(json, binChunk, url);
        } catch (error) {
            console.error('Error loading GLTF/GLB:', error);
            throw error;
        }
    }

    static parseGLB(buffer) {
        const headerView = new DataView(buffer, 0, 12);

        // Check magic number for GLB
        const magic = headerView.getUint32(0, true);
        if (magic !== 0x46546C67) { // 'glTF' in ASCII
            throw new Error('Invalid GLB file');
        }

        const version = headerView.getUint32(4, true);
        const length = headerView.getUint32(8, true);

        let json = null;
        let binChunk = null;
        let offset = 12;

        // Parse chunks
        while (offset < length) {
            const chunkLength = new DataView(buffer, offset, 4).getUint32(0, true);
            const chunkType = new DataView(buffer, offset + 4, 4).getUint32(0, true);

            const chunkData = buffer.slice(offset + 8, offset + 8 + chunkLength);

            if (chunkType === 0x4E4F534A) { // JSON chunk
                const decoder = new TextDecoder();
                json = JSON.parse(decoder.decode(chunkData));
            } else if (chunkType === 0x004E4942) { // BIN chunk
                binChunk = chunkData;
            }

            offset += 8 + chunkLength;
        }

        return { json, binChunk };
    }

    static async parseGLTF(json, binChunk, baseUrl) {
        const meshes = [];
        const materials = new Map();
        const textures = new Map();

        // Load textures first
        if (json.textures) {
            for (let i = 0; i < json.textures.length; i++) {
                const texture = json.textures[i];
                const image = json.images[texture.source];
                const sampler = json.samplers?.[texture.sampler];

                if (image.uri) {
                    // External image file
                    const imageUrl = new URL(image.uri, baseUrl).href;
                    textures.set(i, await this.loadTexture(imageUrl));
                } else if (image.bufferView !== undefined) {
                    // Embedded image data
                    const view = json.bufferViews[image.bufferView];
                    const imageData = new Uint8Array(binChunk, view.byteOffset, view.byteLength);
                    const blob = new Blob([imageData], { type: image.mimeType });
                    const imageUrl = URL.createObjectURL(blob);
                    textures.set(i, await this.loadTexture(imageUrl));
                    URL.revokeObjectURL(imageUrl);
                }
            }
        }

        // Parse materials
        if (json.materials) {
            for (let i = 0; i < json.materials.length; i++) {
                const material = json.materials[i];
                const parsedMaterial = {
                    name: material.name,
                    baseColorFactor: material.pbrMetallicRoughness?.baseColorFactor || [1, 1, 1, 1],
                    metallicFactor: material.pbrMetallicRoughness?.metallicFactor ?? 1,
                    roughnessFactor: material.pbrMetallicRoughness?.roughnessFactor ?? 1
                };

                // Handle textures
                if (material.pbrMetallicRoughness?.baseColorTexture) {
                    const textureIndex = material.pbrMetallicRoughness.baseColorTexture.index;
                    parsedMaterial.baseColorTexture = textures.get(textureIndex);
                }

                materials.set(i, parsedMaterial);
            }
        }

        // Parse meshes
        if (json.meshes) {
            for (const mesh of json.meshes) {
                for (const primitive of mesh.primitives) {
                    const geometry = {
                        positions: [],
                        normals: [],
                        texcoords: [],
                        indices: [],
                        material: materials.get(primitive.material)
                    };

                    // Get accessor for vertex positions
                    if (primitive.attributes.POSITION !== undefined) {
                        const accessor = json.accessors[primitive.attributes.POSITION];
                        geometry.positions = this.parseAccessor(accessor, json, binChunk);
                    }

                    // Get accessor for normals
                    if (primitive.attributes.NORMAL !== undefined) {
                        const accessor = json.accessors[primitive.attributes.NORMAL];
                        geometry.normals = this.parseAccessor(accessor, json, binChunk);
                    }

                    // Get accessor for texture coordinates
                    if (primitive.attributes.TEXCOORD_0 !== undefined) {
                        const accessor = json.accessors[primitive.attributes.TEXCOORD_0];
                        geometry.texcoords = this.parseAccessor(accessor, json, binChunk);
                    }

                    // Get accessor for indices
                    if (primitive.indices !== undefined) {
                        const accessor = json.accessors[primitive.indices];
                        geometry.indices = this.parseAccessor(accessor, json, binChunk);
                    }

                    meshes.push(geometry);
                }
            }
        }

        return {
            meshes,
            materials
        };
    }

    static parseAccessor(accessor, json, binChunk) {
        const bufferView = json.bufferViews[accessor.bufferView];
        const itemSize = this.getAccessorTypeSize(accessor.type);
        const count = accessor.count;
        const offset = (bufferView.byteOffset || 0) + (accessor.byteOffset || 0);
        const stride = bufferView.byteStride || 0;

        const result = [];

        switch(accessor.componentType) {
            case 5126: // FLOAT
                const floatView = new Float32Array(binChunk, offset, count * itemSize);
                for (let i = 0; i < count * itemSize; i++) {
                    result.push(floatView[i]);
                }
                break;
            case 5123: // UNSIGNED_SHORT
                const ushortView = new Uint16Array(binChunk, offset, count * itemSize);
                for (let i = 0; i < count * itemSize; i++) {
                    result.push(ushortView[i]);
                }
                break;
            // Add other component types as needed
        }

        return result;
    }

    static getAccessorTypeSize(type) {
        switch(type) {
            case 'SCALAR': return 1;
            case 'VEC2': return 2;
            case 'VEC3': return 3;
            case 'VEC4': return 4;
            case 'MAT2': return 4;
            case 'MAT3': return 9;
            case 'MAT4': return 16;
            default: throw new Error(`Unknown accessor type: ${type}`);
        }
    }

    static async loadTexture(url) {
        return new Promise((resolve, reject) => {
            const image = new Image();
            image.onload = () => resolve(image);
            image.onerror = reject;
            image.src = url;
        });
    }
}


export default GLTFLoader;