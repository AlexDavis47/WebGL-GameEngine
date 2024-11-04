class Node {
    constructor() {
        this.children = new Map(); // Using Map for O(1) lookups by ID
        this.parent = null;
        this.id = crypto.randomUUID(); // Unique identifier for each node
        this.name = "Node"; // Default name, can be changed
        this.enabled = true;
    }

    // Lifecycle methods
    init(gl) {
        if (!this.enabled) return;

        // Initialize all children
        for (const child of this.children.values()) {
            child.init(gl);
        }
    }

    update(deltaTime) {
        if (!this.enabled) return;

        // Update all children
        for (const child of this.children.values()) {
            child.update(deltaTime);
        }
    }

    render(gl) {
        if (!this.enabled) return;

        // Render all children
        for (const child of this.children.values()) {
            child.render(gl);
        }
    }

    cleanup() {
        // Cleanup all children
        for (const child of this.children.values()) {
            child.cleanup();
        }
        this.children.clear();
    }

    // Node hierarchy management
    addChild(node) {
        if (node.parent) {
            node.parent.removeChild(node);
        }
        node.parent = this;
        this.children.set(node.id, node);
        return node; // Allow for method chaining
    }

    removeChild(node) {
        if (this.children.has(node.id)) {
            node.parent = null;
            this.children.delete(node.id);
        }
        return node; // Allow for method chaining
    }

    getChild(id) {
        return this.children.get(id);
    }

    // Utility methods
    setEnabled(enabled) {
        this.enabled = enabled;
        return this;
    }

    isEnabled() {
        return this.enabled;
    }

    setName(name) {
        this.name = name;
        return this;
    }

    getName() {
        return this.name;
    }

    // Tree traversal methods
    traverse(callback) {
        callback(this);
        for (const child of this.children.values()) {
            child.traverse(callback);
        }
    }

    findByName(name) {
        if (this.name === name) return this;
        for (const child of this.children.values()) {
            const found = child.findByName(name);
            if (found) return found;
        }
        return null;
    }
}

export default Node;