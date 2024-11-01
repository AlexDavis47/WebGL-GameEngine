class AbstractLight {
    constructor(position, color, direction) {
        this.position = position || [0.0, 0.0, 0.0, 1.0];
        this.color = color || [1.0, 1.0, 1.0, 1.0];
        this.direction = direction || [0.0, -1.0, 0.0, 0.0];
        this.isDirectional = false;
    }

    update() {
        // Override in subclasses
    }

    setPosition(x, y, z) {
        this.position = [x, y, z, 1.0];
    }

    setColor(r, g, b) {
        this.color = [r, g, b, 1.0];
    }

    setIntensity(intensity) {
        this.color[3] = intensity; // Set the alpha channel to the intensity
    }

    setDirection(x, y, z) {
        this.direction = [x, y, z, 0.0];
    }

    move(x, y, z) {
        this.position[0] += x;
        this.position[1] += y;
        this.position[2] += z;
    }


    getPosition() {
        return this.position;
    }

    getColor() {
        return this.color;
    }

    getDirection() {
        return this.direction;
    }

    isDirectionalLight() {
        return this.isDirectional;
    }
}
