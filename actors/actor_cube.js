class ActorCube extends AbstractActor {
    constructor() {
        super(new ModelCube(gl));
    }
    update() {
        super.update();
        this.setRotation(
            this.rotation[0] + inputXModel * deltaTime,
            this.rotation[1] + inputYModel * deltaTime,
            this.rotation[2]
        );
    }
}