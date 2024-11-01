class ObjectBase {
    constructor() {
        // Scene graph
        this.parent = null;
        this.children = [];

        // Visibility
        this._visible = true;

        // Has this node been initialized?
        this._initialized = false;
    }

    // Scene graph methods
    addChild(child) {
        if (child.parent) {
            child.parent.removeChild(child);
        }
        child.parent = this;
        this.children.push(child);

        // Initialize child if we're already initialized
        if (this._initialized && !child._initialized) {
            child.init();
        }
    }

    removeChild(child) {
        const index = this.children.indexOf(child);
        if (index !== -1) {
            child.parent = null;
            this.children.splice(index, 1);
        }
    }

    // Visibility methods
    get visible() {
        return this._visible;
    }

    set visible(value) {
        this._visible = value;
    }

    isVisibleInTree() {
        let node = this;
        while (node) {
            if (!node.visible) return false;
            node = node.parent;
        }
        return true;
    }

    // Lifecycle methods
    init() {
        if (this._initialized) return;

        // Initialize all children
        for (const child of this.children) {
            child.init();
        }

        this._initialized = true;
    }

    update(deltaTime) {
        // Update all children first
        for (const child of this.children) {
            if (child.visible) {
                child.update(deltaTime);
            }
        }
    }

    // Utility methods
    traverse(callback) {
        callback(this);
        for (const child of this.children) {
            child.traverse(callback);
        }
    }

    find(predicate) {
        if (predicate(this)) return this;

        for (const child of this.children) {
            const result = child.find(predicate);
            if (result) return result;
        }

        return null;
    }
}