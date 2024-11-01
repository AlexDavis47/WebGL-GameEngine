function initControls() {
    // Frame rate control
    const frameRateSlider = document.getElementById('frameRate');
    const frameRateValue = document.getElementById('frameRateValue');
    frameRateSlider.addEventListener('input', function() {
        frameRateValue.textContent = this.value;
        setFrameRate(parseInt(this.value));
    });

    // Shininess control
    const shininessSlider = document.getElementById('shininess');
    const shininessValue = document.getElementById('shininessValue');
    shininessSlider.addEventListener('input', function() {
        shininessValue.textContent = this.value;
        setModelsShininess(parseInt(this.value));
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
    const globalAmbientLightInput = document.getElementById('ambientLightColor');
    globalAmbientLightInput.addEventListener('input', function() {
        const color = hexToRgb(this.value);
        ambientLightColor = color.map(c => c / 255);
    });

    // Light intensity control
    const ambientLightIntensitySlider = document.getElementById('ambientLightIntensity');
    const ambientLightIntensityValue = document.getElementById('ambientLightIntensityValue');
    ambientLightIntensitySlider.addEventListener('input', function() {
        const intensity = parseFloat(this.value);
        ambientLightIntensityValue.textContent = intensity.toFixed(2);
        ambientLightIntensity = intensity;
    });

    // Add random point light
    const addPointLightButton = document.getElementById('addRandomPointLight');
    addPointLightButton.addEventListener('click', function() {
        addRandomPointLight();
        updateNumLights();
    });

    // Add random directional light
    const addDirectionalLightButton = document.getElementById('addRandomDirectionalLight');
    addDirectionalLightButton.addEventListener('click', function() {
        addRandomDirectionalLight();
        updateNumLights();
    });

    // Remove all lights
    const removeAllLightsButton = document.getElementById('removeAllLights');
    removeAllLightsButton.addEventListener('click', function() {
        removeAllLights();
        updateNumLights();
    });
}

// Helper function to update the number of lights display
function updateNumLights() {
    document.getElementById('numLights').textContent = lights.length;
}

// Initialize everything when the window loads
window.onload = main;

function main() {
    initView();
    initController();
    initControls();
    initModel();
    updateModel();
}

// Handle window resizing
window.addEventListener('resize', function() {
    if (canvas) {
        resizeCanvas();
    }
});