class MTLLoader {
    static async parse(mtlText, basePath = '') {
        const materials = new Map();
        let currentMaterial = null;

        // Ensure basePath ends with a slash if it's not empty
        if (basePath && !basePath.endsWith('/') && !basePath.endsWith('\\')) {
            basePath += '/';
        }

        console.log('Starting MTL parse with basePath:', basePath);

        const lines = mtlText.split('\n');

        for (const line of lines) {
            const tokens = line.trim().split(/\s+/);

            switch(tokens[0]) {
                case 'newmtl':
                    currentMaterial = {
                        name: tokens[1],
                        diffuseMap: null,
                        diffuseColor: [1, 1, 1],
                        loaded: false  // Track if textures are loaded
                    };
                    console.log(`Creating new material: ${currentMaterial.name}`);
                    materials.set(currentMaterial.name, currentMaterial);
                    break;

                case 'map_Kd':
                    if (currentMaterial) {
                        // Store the original texture path for debugging
                        const originalPath = tokens[1];

                        // Handle both forward and backward slashes
                        const textureName = tokens[1]
                            .replace(/^.*[\\\/]/, '')  // Remove any directory path
                            .trim();                   // Remove any whitespace

                        const fullPath = basePath + textureName;

                        console.log(`Loading texture for ${currentMaterial.name}:`, {
                            originalPath,
                            textureName,
                            fullPath
                        });

                        try {
                            currentMaterial.diffuseMap = await MTLLoader.loadTexture(fullPath);
                            currentMaterial.loaded = true;
                            console.log(`Successfully loaded texture for ${currentMaterial.name}:`, fullPath);
                        } catch (error) {
                            console.error(`Failed to load texture for ${currentMaterial.name}:`, {
                                material: currentMaterial.name,
                                path: fullPath,
                                error: error.message
                            });

                            // Try alternate path formats
                            const alternatePaths = [
                                basePath + originalPath,                    // Try original path
                                basePath + originalPath.replace(/\\/g, '/') // Try forward slashes
                            ];

                            for (const altPath of alternatePaths) {
                                try {
                                    console.log(`Attempting alternate path: ${altPath}`);
                                    currentMaterial.diffuseMap = await MTLLoader.loadTexture(altPath);
                                    currentMaterial.loaded = true;
                                    console.log(`Successfully loaded texture using alternate path for ${currentMaterial.name}:`, altPath);
                                    break;
                                } catch (altError) {
                                    console.log(`Alternate path failed: ${altPath}`);
                                }
                            }
                        }
                    }
                    break;

                case 'Kd':
                    if (currentMaterial) {
                        currentMaterial.diffuseColor = [
                            parseFloat(tokens[1]),
                            parseFloat(tokens[2]),
                            parseFloat(tokens[3])
                        ];
                        console.log(`Set diffuse color for ${currentMaterial.name}:`, currentMaterial.diffuseColor);
                    }
                    break;
            }
        }

        // Log summary of loaded materials
        console.log('Material loading summary:');
        for (const [name, material] of materials.entries()) {
            console.log(`Material: ${name}`, {
                hasTexture: !!material.diffuseMap,
                loaded: material.loaded,
                diffuseColor: material.diffuseColor
            });
        }

        return materials;
    }

    static async loadTexture(url) {
        return new Promise((resolve, reject) => {
            const image = new Image();

            image.onload = () => {
                console.log(`Texture loaded successfully: ${url}`, {
                    width: image.width,
                    height: image.height
                });
                resolve(image);
            };

            image.onerror = (error) => {
                console.error(`Texture load failed: ${url}`, error);
                reject(new Error(`Failed to load texture: ${url}`));
            };

            // Add timestamp to URL to prevent caching issues
            const cacheBuster = `?t=${Date.now()}`;
            image.src = url + cacheBuster;

            console.log(`Starting texture load: ${url}`);
        });
    }
}

export default MTLLoader;