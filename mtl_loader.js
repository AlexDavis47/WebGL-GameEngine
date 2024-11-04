class MTLLoader {
    static async parse(mtlText, basePath = '') {
        const materials = new Map();
        let currentMaterial = null;

        const lines = mtlText.split('\n');

        for (const line of lines) {
            const tokens = line.trim().split(/\s+/);

            switch(tokens[0]) {
                case 'newmtl':
                    currentMaterial = {
                        name: tokens[1],
                        diffuseMap: null,
                        diffuseColor: [1, 1, 1],
                    };
                    materials.set(currentMaterial.name, currentMaterial);
                    break;

                case 'map_Kd':
                    if (currentMaterial) {
                        // Get just the filename from the path
                        const textureName = tokens[1].split('\\').pop().split('/').pop();
                        const fullPath = basePath + textureName;
                        console.log('Loading texture from:', fullPath); // Debug log
                        try {
                            currentMaterial.diffuseMap = await MTLLoader.loadTexture(fullPath);
                        } catch (error) {
                            console.error('Error loading texture:', fullPath, error);
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
                    }
                    break;
            }
        }

        return materials;
    }

    static async loadTexture(url) {
        return new Promise((resolve, reject) => {
            const image = new Image();

            image.onload = () => {
                console.log('Texture loaded successfully:', url); // Debug log
                resolve(image);
            };

            image.onerror = (error) => {
                console.error('Failed to load texture:', url, error); // More detailed error
                reject(new Error(`Failed to load texture: ${url}`));
            };

            image.src = url;
        });
    }
}

export default MTLLoader;