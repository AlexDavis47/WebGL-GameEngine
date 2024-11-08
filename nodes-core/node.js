class Node {
    constructor() {
        this.children = new Map();
        this.parent = null;
        this.id = crypto.randomUUID();
        this.name = "Node";
        this._enabled = true;
        this._initialized = false;
        this._markedForDeletion = false;
        this._deferredOperations = [];
        this._initPromise = null;
    }

    // Lifecycle properties
    get enabled() {
        return this._enabled && (!this.parent || this.parent.enabled);
    }

    get initialized() {
        return this._initialized;
    }

    get isDestroyed() {
        return this._markedForDeletion;
    }

    // Lifecycle methods
    async init() {
        if (!this._enabled || this._initialized || this._markedForDeletion) return;

        // Store init promise
        this._initPromise = (async () => {
            try {
                this.onPreInit();

                const childInitPromises = Array.from(this.children.values())
                    .filter(child => !child.isDestroyed)
                    .map(child => child.init());

                await Promise.all(childInitPromises);
                await this.ready();

                this._initialized = true;
                this.onPostInit();
                this.processDeferredOperations();
            } catch (error) {
                console.error(`Failed to initialize node ${this.name}:`, error);
                throw error;
            }
        })();

        return this._initPromise;
    }


    onPreInit() {
        // Override in derived classes
    }

    onPostInit() {
        // Override in derived classes
    }

    ready() {
        // Override in derived classes
    }

    update(deltaTime) {
        // Don't update if initialization hasn't completed
        if (!this._initPromise || !this.enabled || !this._initialized || this._markedForDeletion) return;

        this.processDeferredOperations();

        this.onPreUpdate(deltaTime);

        [...this.children.values()]
            .filter(child => !child.isDestroyed)
            .forEach(child => child.update(deltaTime));

        this.onPostUpdate(deltaTime);
    }


    onPreUpdate(deltaTime) {
        // Override in derived classes
    }

    onPostUpdate(deltaTime) {
        // Override in derived classes
    }

    render() {
        if (!this.enabled || this._markedForDeletion) return;

        // Pre-render hook
        this.onPreRender();

        // Render children
        for (const child of this.children.values()) {
            if (!child.isDestroyed) {
                child.render();
            }
        }

        // Post-render hook
        this.onPostRender();
    }

    onPreRender() {
        // Override in derived classes
    }

    onPostRender() {
        // Override in derived classes
    }

    // Node lifecycle management
    destroy() {
        if (this._markedForDeletion) return;

        this._markedForDeletion = true;

        // Destroy all children
        for (const child of this.children.values()) {
            child.destroy();
        }

        // Clean up resources
        this.onDestroy();

        // Remove from parent
        if (this.parent) {
            this.parent.removeChild(this);
        }

        this.children.clear();
    }

    onDestroy() {
        // Override in derived classes to clean up resources
    }

    // Deferred operations system
    deferOperation(operation) {
        this._deferredOperations.push(operation);
    }

    processDeferredOperations() {
        while (this._deferredOperations.length > 0) {
            const operation = this._deferredOperations.shift();
            operation();
        }
    }

    // Node hierarchy management
    addChild(node) {
        if (this._markedForDeletion || node.isDestroyed) return this;

        // If we're in the middle of an update/render cycle, defer the addition
        if (this.initialized) {
            this.deferOperation(() => this._addChild(node));
        } else {
            this._addChild(node);
        }
        return this;
    }

    _addChild(node) {
        if (node.parent) {
            node.parent.removeChild(node);
        }
        node.parent = this;
        this.children.set(node.id, node);

        // Initialize the child if parent is already initialized
        if (this.initialized && !node.initialized) {
            node.init();
        }
    }

    removeChild(node) {
        if (this._markedForDeletion) return this;

        if (this.initialized) {
            this.deferOperation(() => this._removeChild(node));
        } else {
            this._removeChild(node);
        }
        return this;
    }

    _removeChild(node) {
        if (this.children.has(node.id)) {
            node.parent = null;
            this.children.delete(node.id);
        }
    }

    // Tree traversal methods
    traverse(callback) {
        if (this._markedForDeletion) return;

        callback(this);
        for (const child of this.children.values()) {
            if (!child.isDestroyed) {
                child.traverse(callback);
            }
        }
    }

    traverseAncestors(callback) {
        if (this.parent) {
            callback(this.parent);
            this.parent.traverseAncestors(callback);
        }
    }

    // Node queries
    findByName(name) {
        if (this._markedForDeletion) return null;
        if (this.name === name) return this;

        for (const child of this.children.values()) {
            if (!child.isDestroyed) {
                const found = child.findByName(name);
                if (found) return found;
            }
        }
        return null;
    }

    findByType(type) {
        const results = [];
        this.traverse(node => {
            if (node instanceof type) {
                results.push(node);
            }
        });
        return results;
    }

    findAncestorByType(type) {
        let current = this.parent;
        while (current) {
            if (current instanceof type) return current;
            current = current.parent;
        }
        return null;
    }

    getRootNode() {
        let current = this;
        while (current.parent) {
            current = current.parent;
        }
        return current;
    }

    getRootContext() {
        // Traverse up to find the root's GL context
        const root = this.getRootNode();
        return root?.gl || null;
    }

    // State management
    setEnabled(enabled) {
        this._enabled = enabled;
        return this;
    }

    setName(name) {
        this.name = name;
        return this;
    }

    // Debug utilities
    printTree(indent = '') {
        console.log(`${indent}${this.name} (${this.constructor.name}) [${this.id}]`);
        for (const child of this.children.values()) {
            if (!child.isDestroyed) {
                child.printTree(indent + '  ');
            }
        }
    }
}

export default Node;