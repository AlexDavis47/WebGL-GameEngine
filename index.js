let canvas;
let gl;

function initControls() {
    // Frame rate control
    const frameRateSlider = document.getElementById('frameRate');
    const frameRateValue = document.getElementById('frameRateValue');
    frameRateSlider.addEventListener('input', function() {
        const value = this.value;
        frameRateValue.textContent = value;
        if (typeof setFrameRate === 'function') {
            setFrameRate(parseInt(value));
        }
    });

    // Shininess control
    const shininessSlider = document.getElementById('shininess');
    const shininessValue = document.getElementById('shininessValue');
    shininessSlider.addEventListener('input', function() {
        const value = this.value;
        shininessValue.textContent = value;
        if (typeof setModelsShininess === 'function') {
            setModelsShininess(parseInt(value));
        }
    });

    // Camera distance control
    const distanceSlider = document.getElementById('cameraDistance');
    const distanceValue = document.getElementById('cameraDistanceValue');
    distanceSlider.addEventListener('input', function() {
        currentCameraDistance = parseFloat(this.value);
        distanceValue.textContent = currentCameraDistance.toFixed(1);
        updateCamera();
    });

    // FOV control
    const fovSlider = document.getElementById('fov');
    const fovValue = document.getElementById('fovValue');
    fovSlider.addEventListener('input', function() {
        const degrees = parseInt(this.value);
        fovValue.textContent = degrees;
        currentFOV = (degrees * Math.PI) / 180;
        updateProjectionMatrix();
    });

    // Global ambient light color control
    const globalAmbientLightInput = document.getElementById('globalAmbientLight');
    globalAmbientLightInput.addEventListener('input', function() {
        const color = hexToRgb(this.value);
        color[0] /= 255;
        color[1] /= 255;
        color[2] /= 255;
        ambientLightColor = color;
    });

    // Light intensity control
    const ambientLightIntensitySlider = document.getElementById('ambientLightIntensity');
    const ambientLightIntensityValue = document.getElementById('ambientLightIntensityValue');
    ambientLightIntensitySlider.addEventListener('input', function() {
        const value = parseFloat(this.value);
        ambientLightIntensityValue.textContent = value.toFixed(2);
        ambientLightIntensity = value;
    });

    // Add random point light
    const addRandomPointLightButton = document.getElementById('addRandomPointLight');
    addRandomPointLightButton.addEventListener('click', function() {
        addRandomPointLight();
        updateNumLights();
    });


    // Remove all lights
    const removeAllLightsButton = document.getElementById('removeAllLights');
    removeAllLightsButton.addEventListener('click', function() {
        removeAllLights();
        updateNumLights();
    });

    // Add random directional light
    const addRandomDirectionalLightButton = document.getElementById('addRandomDirectionalLight');
    addRandomDirectionalLightButton.addEventListener('click', function() {
        addRandomDirectionalLight();
        updateNumLights();
    });

    // Update the number of lights
    const numLights = document.getElementById('numLights');
    function updateNumLights() {
        numLights.textContent = lights.length;
    }
    updateNumLights();
}

window.onload = main;

function main() {
    initView(); // Initialize canvas and WebGL context
    initModel(); // Initialize WebGL program and shaders
    initController(); // Initialize input handling
    initControls(); // Initialize control panel
    updateModel(); // Start the render loop
}
window.addEventListener('resize', function() {
    if (canvas) {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
        if (gl) {
            gl.viewport(0, 0, canvas.width, canvas.height);
        }
    }
});