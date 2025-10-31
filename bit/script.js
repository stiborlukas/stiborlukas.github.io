const imageUpload = document.getElementById('imageUpload');
const bitDepthSelect = document.getElementById('bitDepthSelect');
const thresholdRange = document.getElementById('thresholdRange');
const thresholdValueSpan = document.getElementById('thresholdValue');
const thresholdControls = document.getElementById('thresholdControls');

const enablePixelation = document.getElementById('enablePixelation');
const pixelSizeRange = document.getElementById('pixelSizeRange');
const pixelSizeValueSpan = document.getElementById('pixelSizeValue');
const pixelSizeControls = document.getElementById('pixelSizeControls'); 

const originalCanvas = document.getElementById('originalCanvas');
const pixelatedCanvas = document.getElementById('pixelatedCanvas');
const originalCtx = originalCanvas.getContext('2d');
const pixelatedCtx = pixelatedCanvas.getContext('2d');
const outputTitle = document.getElementById('outputTitle');

let originalImage = null;

// --- Event Listeners ---
imageUpload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            originalImage = new Image();
            originalImage.onload = () => {
                drawImages();
            };
            originalImage.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }
});

bitDepthSelect.addEventListener('change', () => {
    updateUIForBitDepth();
    if (originalImage) {
        drawImages();
    }
});

thresholdRange.addEventListener('input', () => {
    thresholdValueSpan.textContent = thresholdRange.value;
    if (originalImage) {
        drawImages();
    }
});

enablePixelation.addEventListener('change', () => {
    pixelSizeRange.disabled = !enablePixelation.checked;
    if (originalImage) {
        drawImages();
    }
});

pixelSizeRange.addEventListener('input', () => {
    pixelSizeValueSpan.textContent = pixelSizeRange.value;
    if (originalImage) {
        drawImages();
    }
});

// --- UI Update Function ---
function updateUIForBitDepth() {
    const selectedBitDepth = bitDepthSelect.value;
    if (selectedBitDepth === '1') {
        thresholdControls.style.display = 'flex';
        outputTitle.textContent = '1-Bit';
    } else { // 8-bit
        thresholdControls.style.display = 'none';
        outputTitle.textContent = '8-Bit';
    }
}

// --- Drawing Function ---
function drawImages() {
    if (!originalImage) return;

    const maxWidth = 500; // Max width for display
    const maxHeight = 500; // Max height for display

    let displayWidth = originalImage.width;
    let displayHeight = originalImage.height;

    // Maintain aspect ratio for display
    if (displayWidth > maxWidth) {
        displayHeight = displayHeight * (maxWidth / displayWidth);
        displayWidth = maxWidth;
    }
    if (displayHeight > maxHeight) {
        displayWidth = displayWidth * (maxHeight / displayHeight);
        displayHeight = maxHeight;
    }

    originalCanvas.width = displayWidth;
    originalCanvas.height = displayHeight;
    pixelatedCanvas.width = displayWidth;
    pixelatedCanvas.height = displayHeight;

    // Draw original image to its canvas
    originalCtx.clearRect(0, 0, originalCanvas.width, originalCanvas.height);
    originalCtx.drawImage(originalImage, 0, 0, displayWidth, displayHeight);

    // --- Offscreen Canvas for all processing (pixelation + color reduction) ---
    let processingCanvas = document.createElement('canvas');
    let processingCtx = processingCanvas.getContext('2d');

    const selectedBitDepth = bitDepthSelect.value;
    const pixelationEnabled = enablePixelation.checked;
    const pixelSize = parseInt(pixelSizeRange.value, 10);

    let intermediateWidth = originalImage.width;
    let intermediateHeight = originalImage.height;

    if (pixelationEnabled) { // Apply pixelation for BOTH 1-bit and 8-bit
        intermediateWidth = Math.max(1, Math.floor(originalImage.width / pixelSize));
        intermediateHeight = Math.max(1, Math.floor(originalImage.height / pixelSize));

        processingCanvas.width = intermediateWidth;
        processingCanvas.height = intermediateHeight;

        // Draw original image to the small offscreen canvas (downscales and pixelates)
        processingCtx.imageSmoothingEnabled = false; // Disable anti-aliasing
        processingCtx.webkitImageSmoothingEnabled = false;
        processingCtx.mozImageSmoothingEnabled = false;
        processingCtx.msImageSmoothingEnabled = false;
        processingCtx.drawImage(originalImage, 0, 0, intermediateWidth, intermediateHeight);

    } else {
        // If no pixelation, process at original image dimensions
        processingCanvas.width = originalImage.width;
        processingCanvas.height = originalImage.height;
        processingCtx.drawImage(originalImage, 0, 0, originalImage.width, originalImage.height);
    }

    // Get image data from the processing canvas (which now holds the pixelated or original resolution image)
    const imageData = processingCtx.getImageData(0, 0, processingCanvas.width, processingCanvas.height);
    const data = imageData.data;

    // Create new image data for the final output (same dimensions as processingCanvas)
    const finalImageData = pixelatedCtx.createImageData(processingCanvas.width, processingCanvas.height);
    const finalData = finalImageData.data;

    // --- Apply Color Reduction based on selected bit depth ---
    if (selectedBitDepth === '1') {
        const threshold = parseInt(thresholdRange.value, 10);
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const alpha = data[i + 3];

            const luminance = (0.299 * r + 0.587 * g + 0.114 * b); // Rec. 709 luma

            if (luminance > threshold) {
                finalData[i] = 255;      // Red
                finalData[i + 1] = 255;  // Green
                finalData[i + 2] = 255;  // Blue
            } else {
                finalData[i] = 0;        // Red
                finalData[i + 1] = 0;    // Green
                finalData[i + 2] = 0;    // Blue
            }
            finalData[i + 3] = alpha; // Keep original alpha
        }
    } else if (selectedBitDepth === '8') {
        const levels = 8;
        const step = 256 / levels;

        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const alpha = data[i + 3];

            finalData[i] = Math.floor(r / step) * step;
            finalData[i + 1] = Math.floor(g / step) * step;
            finalData[i + 2] = Math.floor(b / step) * step;
            finalData[i + 3] = alpha;
        }
    }

    // Put the processed image data back onto the offscreen canvas
    processingCtx.putImageData(finalImageData, 0, 0);

    // Finally, draw the processed image from the offscreen canvas to the display canvas
    // This will upscale the potentially pixelated image to the display size
    pixelatedCtx.imageSmoothingEnabled = false; // Ensure sharp upscaling
    pixelatedCtx.webkitImageSmoothingEnabled = false;
    pixelatedCtx.mozImageSmoothingEnabled = false;
    pixelatedCtx.msImageSmoothingEnabled = false;
    pixelatedCtx.drawImage(processingCanvas, 0, 0, displayWidth, displayHeight);

    // Apply CSS for sharp pixel scaling, especially important for final display
    pixelatedCanvas.style.imageRendering = 'pixelated';
    pixelatedCanvas.style.imageRendering = '-moz-crisp-edges'; /* Firefox */
    pixelatedCanvas.style.imageRendering = 'crisp-edges'; /* Standard */
}

// Initialize UI on load
updateUIForBitDepth();
pixelSizeRange.disabled = !enablePixelation.checked; // Set initial state of pixel size slider