class Shader {
    constructor(gl, vertexSource, fragmentSource) {
        this.gl = gl;
        this.program = this._createProgram(vertexSource, fragmentSource);
        this.uniforms = new Map();
    }

    _createProgram(vertexSource, fragmentSource) {
        const gl = this.gl;

        // Create and compile vertex shader
        const vertexShader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vertexShader, vertexSource);
        gl.compileShader(vertexShader);

        if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
            const error = gl.getShaderInfoLog(vertexShader);
            gl.deleteShader(vertexShader);
            throw new Error(`Vertex shader compilation failed: ${error}`);
        }

        // Create and compile fragment shader
        const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fragmentShader, fragmentSource);
        gl.compileShader(fragmentShader);

        if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
            const error = gl.getShaderInfoLog(fragmentShader);
            gl.deleteShader(vertexShader);
            gl.deleteShader(fragmentShader);
            throw new Error(`Fragment shader compilation failed: ${error}`);
        }

        // Create and link program
        const program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            const error = gl.getProgramInfoLog(program);
            gl.deleteProgram(program);
            gl.deleteShader(vertexShader);
            gl.deleteShader(fragmentShader);
            throw new Error(`Shader program link failed: ${error}`);
        }

        // Clean up individual shaders
        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);

        return program;
    }

    use() {
        this.gl.useProgram(this.program);
    }

    // Uniform setters
    setInt(name, value) {
        const location = this._getUniformLocation(name);
        this.gl.uniform1i(location, value);
    }

    setFloat(name, value) {
        const location = this._getUniformLocation(name);
        this.gl.uniform1f(location, value);
    }

    setVec2(name, x, y) {
        const location = this._getUniformLocation(name);
        this.gl.uniform2f(location, x, y);
    }

    setVec3(name, x, y, z) {
        const location = this._getUniformLocation(name);
        this.gl.uniform3f(location, x, y, z);
    }

    setVec4(name, x, y, z, w) {
        const location = this._getUniformLocation(name);
        this.gl.uniform4f(location, x, y, z, w);
    }

    setMat4(name, matrix) {
        const location = this._getUniformLocation(name);
        this.gl.uniformMatrix4fv(location, false, matrix);
    }

    _getUniformLocation(name) {
        if (!this.uniforms.has(name)) {
            const location = this.gl.getUniformLocation(this.program, name);
            if (location === null) {
                console.warn(`Uniform '${name}' not found in shader program`);
            }
            this.uniforms.set(name, location);
        }
        return this.uniforms.get(name);
    }

    // Clean up resources
    destroy() {
        if (this.program) {
            this.gl.deleteProgram(this.program);
            this.program = null;
        }
    }
}