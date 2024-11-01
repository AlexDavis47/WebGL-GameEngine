class PointLight extends AbstractLight {
    constructor(position, color) {
        super(position, color);
        this.position[3] = 1.0; // w=1 for point lights
        this.isDirectional = false;
    }

    update() {
        this.move(inputXLight * deltaTime, inputYLight * deltaTime, 0.0); // For the sake of the assignment rubric
    }
}
