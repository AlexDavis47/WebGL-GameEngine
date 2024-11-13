/**
 * Developers: Alexander Davis, Maika West, Austin Medina.
 * Date: 11/12/2024
 */
import RAPIER from '@dimforge/rapier3d-compat';

class PhysicsManager {
    constructor() {
        this._world = null;
        this._gravity = { x: 0, y: -9.81, z: 0 };
        this._initialized = false;
        this._initPromise = null;
    }

    async init() {
        if (this._initialized) return;

        this._initPromise = (async () => {
            try {
                // Initialize RAPIER
                await RAPIER.init();

                // Create a new physics world
                this._world = new RAPIER.World(this._gravity);

                this._initialized = true;
                console.log("Physics world initialized");
            } catch (error) {
                console.error("Failed to initialize physics world:", error);
                throw error;
            }
        })();

        return this._initPromise;
    }

    step() {
        if (!this._initialized || !this._world) return;
        this._world.step();
    }

    setGravity(x, y, z) {
        this._gravity = { x, y, z };
        if (this._world) {
            this._world.gravity = this._gravity;
        }
    }

    // Cleanup
    destroy() {
        if (this._world) {
            this._world = null;
        }
        this._initialized = false;
    }

    // Getters
    get world() {
        return this._world;
    }

    get initialized() {
        return this._initialized;
    }
}

// Create singleton instance
const physicsManager = new PhysicsManager();

export default physicsManager;