import Node from './nodes-core/node.js';

class Scene extends Node {
    constructor() {
        super();
        this.name = "Scene";

        // Scene-specific properties
        this.ambientLight = [0.1, 0.1, 0.1]; // Default ambient light
        this.clearColor = [0.0, 0.0, 0.0, 1.0]; // Default background color
        this.activeCamera = null;
    }

    init(gl) {
        // Set scene-specific GL state
        gl.clearColor(...this.clearColor);
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);
        gl.cullFace(gl.BACK);

        // Initialize all nodes-core in the scene
        super.init(gl);
    }

    update(deltaTime) {
        // Update input state at the start of each frame
        updateInput(); // From your input manager

        // Update all nodes-core in the scene
        super.update(deltaTime);
    }

    render(gl) {
        // Clear the canvas
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // Render all nodes-core in the scene
        super.render(gl);
    }

    setAmbientLight(r, g, b) {
        this.ambientLight = [r, g, b];
        return this;
    }

    setClearColor(r, g, b, a = 1.0) {
        this.clearColor = [r, g, b, a];
        return this;
    }

    getAllNodesOfType(typeName) {
        const nodes = [];
        this.traverse(node => {
            // Check if the node's constructor name matches the type we're looking for
            if (node.constructor.name === typeName) {
                nodes.push(node);
            }
        });
        return nodes;
    }

    // Helper method to find the first node of a specific type
    getFirstNodeOfType(typeName) {
        let foundNode = null;
        this.traverse(node => {
            if (!foundNode && node.constructor.name === typeName) {
                foundNode = node;
            }
        });
        return foundNode;
    }
}

export default Scene;