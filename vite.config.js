import { defineConfig } from 'vite';

export default defineConfig({
    server: {
        port: 3000
    },
    assetsInclude: ['**/*.glsl'],
    base: "computergraphics-assignment6"
});