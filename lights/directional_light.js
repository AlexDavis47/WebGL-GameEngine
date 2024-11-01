class DirectionalLight extends AbstractLight {
    constructor(direction, color) {
        super(null, color, direction);
        this.position = [...direction, 0.0]; // w=0 for directional lights
        this.isDirectional = true;
    }
}