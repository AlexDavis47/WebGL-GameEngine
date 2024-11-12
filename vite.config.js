import { defineConfig } from 'vite';

export default defineConfig({
    server: {
        port: 3000
    },
    assetsInclude: ['**/*.glsl', '**/*.obj', "**/*.mtl", '**/*.mp3', "**/*.wav", "**/*.png", "**/*.jpg", "**/*.jpeg"],
});