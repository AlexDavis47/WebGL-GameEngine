/**
 * Developers: Alexander Davis, Maika West, Austin Medina.
 * Date: 11/12/2024
 */
import Light, {LightType} from './light.js';

class AmbientLight extends Light {
    constructor() {
        super();
        this.type = LightType.AMBIENT;
    }
}

export default AmbientLight;