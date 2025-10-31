document.addEventListener('DOMContentLoaded', () => {
    // Canvas setup
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    const canvasContainer = document.querySelector('.canvas-container');
    
    // Control elements
    const mainRibbon = document.getElementById('mainRibbon'); // Reference to the main ribbon
    const menuToggle = document.getElementById('menuToggle'); // Hamburger menu button
    const collapsibleTools = document.getElementById('collapsibleTools'); // Collapsible tools container

    const pencilTool = document.getElementById('pencilTool');
    const eraserTool = document.getElementById('eraserTool');
    const bucketTool = document.getElementById('bucketTool');
    const rectTool = document.getElementById('rectTool');
    const circleTool = document.getElementById('circleTool');
    const lineTool = document.getElementById('lineTool');
    const eyedropperTool = document.getElementById('eyedropperTool');
    const imageTool = document.getElementById('imageTool');
    const imageInput = document.getElementById('imageInput');
    const textTool = document.getElementById('textTool');
    const textInput = document.getElementById('textInput');
    const fillShapeToggle = document.getElementById('fillShapeToggle');
    const brushRound = document.getElementById('brushRound');
    const brushSquare = document.getElementById('brushSquare');
    const customColor = document.getElementById('customColor');
    const brushSize = document.getElementById('brushSize');
    const brushSizeValue = document.getElementById('brushSizeValue');
    const opacitySlider = document.getElementById('opacitySlider');
    const opacityValue = document.getElementById('opacityValue');
    const grayscaleFilterBtn = document.getElementById('grayscaleFilterBtn');
    const invertFilterBtn = document.getElementById('invertFilterBtn');
    const flipHorizontalBtn = document.getElementById('flipHorizontalBtn');
    const flipVerticalBtn = document.getElementById('flipVerticalBtn');
    const undoBtn = document.getElementById('undoBtn');
    const redoBtn = document.getElementById('redoBtn');
    const clearBtn = document.getElementById('clearBtn');
    const saveBtn = document.getElementById('saveBtn');
    const statusText = document.getElementById('statusText');
    const colorPalette = document.getElementById('colorPalette');

    // State variables
    let painting = false;
    let currentTool = 'pencil';
    let currentColor = '#FF69B4'; // Default to Hot Pink
    let currentBrushSize = 4;
    let currentOpacity = 1.0;
    let brushTip = 'round';
    let undoStack = [];
    let redoStack = [];
    let startX, startY;
    let lastX, lastY;
    let isShapeFilled = false;

    // Off-screen canvas for temporary shape drawing preview
    let bufferCanvas = document.createElement('canvas');
    let bufferCtx = bufferCanvas.getContext('2d');

    /**
     * Converts a hexadecimal color string to an RGB array.
     * @param {string} hex - The hexadecimal color string (e.g., "#RRGGBB").
     * @returns {number[]} An array containing [R, G, B] values.
     */
    function hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? [
            parseInt(result[1], 16),
            parseInt(result[2], 16),
            parseInt(result[3], 16)
        ] : [0, 0, 0];
    }
    
    /**
     * Converts RGB values to a hexadecimal color string.
     * @param {number} r - Red component (0-255).
     * @param {number} g - Green component (0-255).
     * @param {number} b - Blue component (0-255).
     * @returns {string} The hexadecimal color string (e.g., "#RRGGBB").
     */
    function rgbToHex(r, g, b) {
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
    }

    /**
     * Performs a flood fill operation on the canvas.
     * @param {number} startX - The starting X coordinate for the fill.
     * @param {number} startY - The starting Y coordinate for the fill.
     * @param {number[]} targetRGBA - The RGBA array of the color to be replaced (from the clicked pixel).
     * @param {string} fillColorHex - The hexadecimal string of the color to fill with.
     */
    function floodFill(startX, startY, targetRGBA, fillColorHex) {
        const fillRGB = hexToRgb(fillColorHex); 
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        const stack = [[startX, startY]];
        const width = canvas.width;
        const height = canvas.height;
        
        if (targetRGBA[0] === fillRGB[0] && 
            targetRGBA[1] === fillRGB[1] && 
            targetRGBA[2] === fillRGB[2] && 
            targetRGBA[3] === 255) {
            return;
        }

        function getPixelColor(x, y) {
            if (x < 0 || x >= width || y < 0 || y >= height) return [-1, -1, -1, -1]; // Indicate out of bounds
            const index = (y * width + x) * 4;
            return [data[index], data[index + 1], data[index + 2], data[index + 3]];
        }
        
        function setPixelColor(x, y, color) {
            const index = (y * width + x) * 4;
            data[index] = color[0];
            data[index + 1] = color[1];
            data[index + 2] = color[2];
            data[index + 3] = color[3];
        }
        
        function colorsMatch(color1, color2) {
            return color1[0] === color2[0] && 
                    color1[1] === color2[1] && 
                    color1[2] === color2[2] && 
                    color1[3] === color2[3];
        }
        
        while (stack.length > 0) {
            const [x, y] = stack.pop();
            
            const currentPixel = getPixelColor(x, y);
            if (!colorsMatch(currentPixel, targetRGBA)) continue;
            
            setPixelColor(x, y, [...fillRGB, 255]);
            
            stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
        }
        
        ctx.putImageData(imageData, 0, 0);
    }

    // Initialize color palette
    const colors = [
        '#000000', '#808080', '#800000', '#FF0000', '#808000', '#FFFF00',
        '#008000', '#00FF00', '#008080', '#00FFFF', '#000080', '#0000FF',
        '#800080', '#FF00FF', '#FFFFFF', '#C0C0C0', '#FF69B4', // Hot Pink
        '#800000', '#FF0000', '#808000', '#FFFF00'
    ];

    colors.forEach((color) => {
        const swatch = document.createElement('div');
        swatch.className = 'color-swatch';
        swatch.style.backgroundColor = color;
        if (color === '#FF69B4') swatch.classList.add('selected'); // Select Hot Pink by default
        swatch.addEventListener('click', () => selectColor(color, swatch));
        colorPalette.appendChild(swatch);
    });

    /**
     * Selects a color from the palette or custom color picker.
     * @param {string} color - The hex color string to select.
     * @param {HTMLElement} [element] - The color swatch element that was clicked, if any.
     */
    function selectColor(color, element) {
        currentColor = color;
        customColor.value = color; // Update custom color picker input
        document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('selected'));
        if (element) {
            element.classList.add('selected');
        } else {
            const matchingSwatch = Array.from(document.querySelectorAll('.color-swatch'))
                                        .find(s => s.style.backgroundColor.toUpperCase() === rgbToHex(...hexToRgb(color)));
            if (matchingSwatch) {
                matchingSwatch.classList.add('selected');
            }
        }
        applyDrawingSettings();
    }

    /**
     * Resizes the canvas to fit its container and redraws current content.
     */
    function resizeCanvas() {
        const currentImage = undoStack.length > 0 ? undoStack[undoStack.length - 1] : null;
        
        const containerPaddingTop = parseFloat(window.getComputedStyle(canvasContainer).paddingTop);
        const containerPaddingBottom = parseFloat(window.getComputedStyle(canvasContainer).paddingBottom);
        const containerPaddingLeft = parseFloat(window.getComputedStyle(canvasContainer).paddingLeft);
        const containerPaddingRight = parseFloat(window.getComputedStyle(canvasContainer).paddingRight);

        const availableWidth = canvasContainer.clientWidth - containerPaddingLeft - containerPaddingRight;
        const availableHeight = canvasContainer.clientHeight - containerPaddingTop - containerPaddingBottom;

        canvas.width = availableWidth;
        canvas.height = availableHeight;

        bufferCanvas.width = availableWidth;
        bufferCanvas.height = availableHeight;

        if (currentImage) {
            restoreState(currentImage, false); 
        } else {
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        applyDrawingSettings();
    }

    /**
     * Initializes the canvas: sets initial size, clears it, and applies drawing settings.
     */
    function initCanvas() {
        resizeCanvas(); 
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        applyDrawingSettings();
        saveState(); 
    }

    /**
     * Applies current drawing settings (line width, caps, color) to the canvas context.
     */
    function applyDrawingSettings() {
        ctx.lineWidth = currentBrushSize;
        ctx.lineCap = brushTip;
        ctx.lineJoin = 'round';
        ctx.strokeStyle = currentTool === 'eraser' ? 'white' : currentColor;
        ctx.fillStyle = currentColor;
        ctx.font = `${currentBrushSize * 2}px 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif`;
        ctx.globalAlpha = currentOpacity;
    }

    /**
     * Saves the current canvas state to the undo stack. Clears the redo stack.
     */
    function saveState() {
        const originalAlpha = ctx.globalAlpha;
        ctx.globalAlpha = 1.0; 
        const imageData = canvas.toDataURL();
        ctx.globalAlpha = originalAlpha;

        undoStack.push(imageData);
        if (undoStack.length > 50) undoStack.shift(); 
        redoStack = []; 
        updateButtonStates();
    }

    /**
     * Undoes the last action by restoring the previous canvas state.
     */
    function undo() {
        if (undoStack.length > 1) {
            redoStack.push(undoStack.pop()); 
            const state = undoStack[undoStack.length - 1]; 
            restoreState(state, false); 
            updateButtonStates();
        }
    }

    /**
     * Redoes the last undone action by restoring the state from the redo stack.
     */
    function redo() {
        if (redoStack.length > 0) {
            const state = redoStack.pop(); 
            undoStack.push(state); 
            restoreState(state, false); 
            updateButtonStates();
        }
    }

    /**
     * Restores a saved canvas state from an image data URL.
     * @param {string} state - The data URL of the canvas image.
     * @param {boolean} [save=true] - Whether to save this restoration to the undo stack.
     */
    function restoreState(state, save = true) {
        const img = new Image();
        img.onload = () => {
            const originalAlpha = ctx.globalAlpha;
            ctx.globalAlpha = 1.0;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height); 
            ctx.globalAlpha = originalAlpha;
            applyDrawingSettings();
            if (save) saveState(); 
        };
        img.src = state;
    }

    /**
     * Updates the disabled state of the Undo and Redo buttons.
     */
    function updateButtonStates() {
        undoBtn.disabled = undoStack.length <= 1; 
        redoBtn.disabled = redoStack.length === 0; 
    }

    /**
     * Clears the entire canvas and saves the new blank state.
     */
    function clearCanvas() {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        saveState();
        statusText.textContent = 'Canvas cleared';
        setTimeout(() => statusText.textContent = 'Ready', 2000);
    }

    /**
     * Saves the current canvas content as a PNG image.
     */
    function saveCanvas() {
        const link = document.createElement('a');
        link.download = 'painting.png';
        const originalAlpha = ctx.globalAlpha;
        ctx.globalAlpha = 1.0;
        link.href = canvas.toDataURL('image/png');
        ctx.globalAlpha = originalAlpha;
        link.click();
        statusText.textContent = 'Image saved';
        setTimeout(() => statusText.textContent = 'Ready', 2000);
    }

    /**
     * Applies a grayscale filter to the entire canvas.
     */
    function applyGrayscaleFilter() {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const avg = (0.299 * r + 0.587 * g + 0.114 * b);
            data[i] = avg;
            data[i + 1] = avg;
            data[i + 2] = avg;
        }
        ctx.putImageData(imageData, 0, 0);
        saveState();
        statusText.textContent = 'Grayscale filter applied.';
        setTimeout(() => statusText.textContent = 'Ready', 2000);
    }

    /**
     * Applies an invert colors filter to the entire canvas.
     */
    function applyInvertFilter() {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
            data[i] = 255 - data[i];
            data[i + 1] = 255 - data[i + 1];
            data[i + 2] = 255 - data[i + 2];
        }
        ctx.putImageData(imageData, 0, 0);
        saveState();
        statusText.textContent = 'Colors inverted.';
        setTimeout(() => statusText.textContent = 'Ready', 2000);
    }

    /**
     * Applies a horizontal flip filter to the entire canvas.
     */
    function applyFlipHorizontalFilter() {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const newImageData = ctx.createImageData(canvas.width, canvas.height);
        const data = imageData.data;
        const newData = newImageData.data;
        const width = canvas.width;
        const height = canvas.height;

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const originalIndex = (y * width + x) * 4;
                const flippedX = width - 1 - x;
                const newIndex = (y * width + flippedX) * 4;

                newData[newIndex] = data[originalIndex];
                newData[newIndex + 1] = data[originalIndex + 1];
                newData[newIndex + 2] = data[originalIndex + 2];
                newData[newIndex + 3] = data[originalIndex + 3];
            }
        }
        ctx.putImageData(newImageData, 0, 0);
        saveState();
        statusText.textContent = 'Flipped horizontally.';
        setTimeout(() => statusText.textContent = 'Ready', 2000);
    }

    /**
     * Applies a vertical flip filter to the entire canvas.
     */
    function applyFlipVerticalFilter() {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const newImageData = ctx.createImageData(canvas.width, canvas.height);
        const data = imageData.data;
        const newData = newImageData.data;
        const width = canvas.width;
        const height = canvas.height;

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const originalIndex = (y * width + x) * 4;
                const flippedY = height - 1 - y;
                const newIndex = (flippedY * width + x) * 4;

                newData[newIndex] = data[originalIndex];
                newData[newIndex + 1] = data[originalIndex + 1];
                newData[newIndex + 2] = data[originalIndex + 2];
                newData[newIndex + 3] = data[originalIndex + 3];
            }
        }
        ctx.putImageData(newImageData, 0, 0);
        saveState();
        statusText.textContent = 'Flipped vertically.';
        setTimeout(() => statusText.textContent = 'Ready', 2000);
    }

    /**
     * Calculates mouse position relative to the canvas.
     * @param {MouseEvent} e - The mouse event.
     * @returns {{x: number, y: number}} The coordinates.
     */
    function getMousePos(e) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
    }

    /**
     * Calculates touch position relative to the canvas.
     * @param {TouchEvent} e - The touch event.
     * @returns {{x: number, y: number}} The coordinates.
     */
    function getTouchPos(e) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        
        return {
            x: (e.touches[0].clientX - rect.left) * scaleX,
            y: (e.touches[0].clientY - rect.top) * scaleY
        };
    }

    /**
     * Starts a drawing stroke or shape.
     * @param {{x: number, y: number}} pos - The starting coordinates.
     */
    function startDrawing(pos) {
        // If text tool is active, place text and return (it's a click action)
        if (currentTool === 'text') {
            const text = textInput.value.trim();
            if (text) {
                applyDrawingSettings();
                // Text drawing on canvas is from the bottom-left of the text baseline.
                // Adjust pos.y to account for text height for better visual placement
                ctx.fillText(text, pos.x, pos.y + currentBrushSize); 
                saveState();
                statusText.textContent = `Text placed: "${text}"`;
                setTimeout(() => statusText.textContent = 'Ready', 2000);
                textInput.value = '';
                textInput.style.display = 'none';
                setActiveTool('pencil'); // Revert to pencil after text placement
            } else {
                statusText.textContent = 'Please enter text in the input field.';
            }
            painting = false; // Ensure painting is false for click-based tools
            return; 
        }
        // For other non-dragging tools (eyedropper, bucket, image), also handle as click actions.
        // These tools are handled in the mousedown/touchstart event listeners directly.
        if (['eyedropper', 'bucket', 'image'].includes(currentTool)) {
            painting = false;
            return;
        }

        painting = true;
        startX = pos.x;
        startY = pos.y;
        lastX = pos.x; 
        lastY = pos.y;

        if (currentTool === 'pencil' || currentTool === 'eraser') {
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            applyDrawingSettings();
        } else if (['rect', 'circle', 'line'].includes(currentTool)) {
            bufferCanvas.width = canvas.width;
            bufferCanvas.height = canvas.height;
            bufferCtx.drawImage(canvas, 0, 0);
        }
        statusText.textContent = `Drawing with ${currentTool}`;
    }

    /**
     * Continues a drawing stroke or shape preview.
     * @param {{x: number, y: number}} pos - The current coordinates.
     */
    function draw(pos) {
        // Only draw if 'painting' is true and the current tool is a continuous drawing tool
        if (!painting || ['text', 'eyedropper', 'bucket', 'image'].includes(currentTool)) return;
        
        lastX = pos.x; 
        lastY = pos.y;

        if (currentTool === 'pencil' || currentTool === 'eraser') {
            applyDrawingSettings(); 
            ctx.lineTo(pos.x, pos.y);
            ctx.stroke();
        } else if (['rect', 'circle', 'line'].includes(currentTool)) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(bufferCanvas, 0, 0);
            
            applyDrawingSettings(); 
            ctx.beginPath(); 
            if (currentTool === 'rect') {
                if (isShapeFilled) {
                    ctx.fillRect(startX, startY, pos.x - startX, pos.y - startY);
                } else {
                    ctx.strokeRect(startX, startY, pos.x - startX, pos.y - startY);
                }
            } else if (currentTool === 'circle') {
                const dx = pos.x - startX;
                const dy = pos.y - startY;
                const radius = Math.sqrt(dx * dx + dy * dy) / 2;
                const centerX = startX + dx / 2;
                const centerY = startY + dy / 2;
                ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
                if (isShapeFilled) {
                    ctx.fill();
                } else {
                    ctx.stroke();
                }
            } else if (currentTool === 'line') {
                ctx.moveTo(startX, startY);
                ctx.lineTo(pos.x, pos.y);
                ctx.stroke(); 
            }
            ctx.closePath();
        }
    }

    /**
     * Stops a drawing stroke or finalizes a shape and saves the canvas state.
     */
    function stopDrawing() { 
        // Only stop drawing if 'painting' is true and the current tool is a continuous drawing tool
        if (!painting || ['text', 'eyedropper', 'bucket', 'image'].includes(currentTool)) return;
        painting = false;

        if (currentTool === 'pencil' || currentTool === 'eraser') {
            ctx.closePath();
        } else if (['rect', 'circle', 'line'].includes(currentTool)) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(bufferCanvas, 0, 0);

            applyDrawingSettings(); 
            ctx.beginPath(); 
            if (currentTool === 'rect') {
                if (isShapeFilled) {
                    ctx.fillRect(startX, startY, lastX - startX, lastY - startY);
                } else {
                    ctx.strokeRect(startX, startY, lastX - startX, lastY - startY);
                }
            } else if (currentTool === 'circle') {
                const dx = lastX - startX;
                const dy = lastY - startY;
                const radius = Math.sqrt(dx * dx + dy * dy) / 2;
                const centerX = startX + dx / 2;
                const centerY = startY + dy / 2;
                ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
                if (isShapeFilled) {
                    ctx.fill();
                } else {
                    ctx.stroke();
                }
            } else if (currentTool === 'line') {
                ctx.moveTo(startX, startY);
                ctx.lineTo(lastX, lastY);
                ctx.stroke();
            }
            ctx.closePath(); 
        }
        
        saveState(); 
        statusText.textContent = 'Ready';
    }

    // Event listeners for mouse interactions
    canvas.addEventListener('mousedown', (e) => {
        const pos = getMousePos(e);
        if (currentTool === 'bucket') {
            const imageData = ctx.getImageData(pos.x, pos.y, 1, 1);
            const pixel = imageData.data;
            const clickedRGBA = [pixel[0], pixel[1], pixel[2], pixel[3]];
            
            floodFill(Math.floor(pos.x), Math.floor(pos.y), clickedRGBA, currentColor);
            saveState();
            statusText.textContent = 'Area filled';
            setTimeout(() => statusText.textContent = 'Ready', 2000);
            setActiveTool('pencil'); // Revert to pencil after action
        } else if (currentTool === 'eyedropper') {
            const imageData = ctx.getImageData(pos.x, pos.y, 1, 1);
            const pixel = imageData.data;
            const pickedColor = rgbToHex(pixel[0], pixel[1], pixel[2]);
            selectColor(pickedColor); 
            setActiveTool('pencil'); // Switch back to pencil after picking
            statusText.textContent = `Picked color: ${pickedColor}. Switched to Pencil.`;
            setTimeout(() => statusText.textContent = 'Ready', 2000);
        } else if (currentTool === 'text') {
                startDrawing(pos); // Text tool uses startDrawing for placement
        }
        else {
            startDrawing(pos); // For drawing tools (pencil, eraser, shapes)
        }
    });

    canvas.addEventListener('mousemove', (e) => {
        const pos = getMousePos(e);
        draw(pos);
    });

    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', () => {
        if (painting) {
            stopDrawing();
        }
    });

    // Event listeners for touch interactions
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault(); 
        const pos = getTouchPos(e);
        if (currentTool === 'bucket') {
            const imageData = ctx.getImageData(pos.x, pos.y, 1, 1);
            const pixel = imageData.data;
            const touchedRGBA = [pixel[0], pixel[1], pixel[2], pixel[3]];
            
            floodFill(Math.floor(pos.x), Math.floor(pos.y), touchedRGBA, currentColor);
            saveState();
            statusText.textContent = 'Area filled';
            setTimeout(() => statusText.textContent = 'Ready', 2000);
            setActiveTool('pencil'); // Revert to pencil after action
        } else if (currentTool === 'eyedropper') {
            const imageData = ctx.getImageData(pos.x, pos.y, 1, 1);
            const pixel = imageData.data;
            const pickedColor = rgbToHex(pixel[0], pixel[1], pixel[2]);
            selectColor(pickedColor); 
            setActiveTool('pencil'); 
            statusText.textContent = `Picked color: ${pickedColor}. Switched to Pencil.`;
            setTimeout(() => statusText.textContent = 'Ready', 2000);
        } else if (currentTool === 'text') {
                startDrawing(pos);
        }
        else {
            startDrawing(pos);
        }
    }, { passive: false });

    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault(); 
        const pos = getTouchPos(e);
        draw(pos);
    }, { passive: false });

    canvas.addEventListener('touchend', stopDrawing, { passive: false });

    /**
     * Helper function to set the active tool button and update cursor.
     * @param {string} toolName - The name of the tool to activate.
     */
    function setActiveTool(toolName) {
        document.querySelectorAll('.tool-btn').forEach(btn => btn.classList.remove('active'));
        
        currentTool = toolName;
        const toolButton = document.getElementById(`${toolName}Tool`);
        if (toolButton) {
            toolButton.classList.add('active');
        }
        
        let cursorStyle = 'crosshair';
        if (toolName === 'bucket') {
            cursorStyle = 'pointer';
        } else if (toolName === 'eyedropper') {
            cursorStyle = 'copy'; 
        } else if (toolName === 'text') {
            cursorStyle = 'text'; 
        } else if (toolName === 'image') {
            cursorStyle = 'default';
        }
        canvas.style.cursor = cursorStyle;
        
        // Toggle text input visibility
        if (toolName !== 'text') {
            textInput.style.display = 'none';
            textInput.value = ''; 
        } else {
            textInput.style.display = 'block';
            textInput.focus();
        }

        applyDrawingSettings();

        // On mobile, if a tool is selected, close the menu
        if (window.innerWidth <= 768 && toolName !== 'image' && toolName !== 'text') { // Image tool needs input, text needs its field
            mainRibbon.classList.remove('menu-open');
        }
    }

    // Mobile menu toggle
    menuToggle.addEventListener('click', () => {
        mainRibbon.classList.toggle('menu-open');
    });


    // Tool selection event listeners
    pencilTool.addEventListener('click', () => setActiveTool('pencil'));
    eraserTool.addEventListener('click', () => setActiveTool('eraser'));
    bucketTool.addEventListener('click', () => setActiveTool('bucket'));
    rectTool.addEventListener('click', () => setActiveTool('rect'));
    circleTool.addEventListener('click', () => setActiveTool('circle'));
    lineTool.addEventListener('click', () => setActiveTool('line'));
    eyedropperTool.addEventListener('click', () => setActiveTool('eyedropper')); 

    // Image import tool
    imageTool.addEventListener('click', () => {
        setActiveTool('image'); 
        imageInput.click(); 
    });

    imageInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    const originalAlpha = ctx.globalAlpha;
                    ctx.globalAlpha = 1.0; 

                    ctx.clearRect(0, 0, canvas.width, canvas.height); 
                    const aspectRatio = img.width / img.height;
                    let drawWidth = canvas.width;
                    let drawHeight = canvas.width / aspectRatio;

                    if (drawHeight > canvas.height) {
                        drawHeight = canvas.height;
                        drawWidth = canvas.height * aspectRatio;
                    }
                    
                    const x = (canvas.width / 2) - (drawWidth / 2);
                    const y = (canvas.height / 2) - (drawHeight / 2);

                    ctx.drawImage(img, x, y, drawWidth, drawHeight);
                    saveState(); 
                    statusText.textContent = 'Image imported successfully!';
                    setTimeout(() => statusText.textContent = 'Ready', 2000);
                    setActiveTool('pencil'); 

                    ctx.globalAlpha = originalAlpha;
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file); 
        }
    });

    // Text tool
    textTool.addEventListener('click', () => {
        setActiveTool('text');
        textInput.style.display = 'block'; 
        textInput.focus();
        statusText.textContent = 'Enter text above and click on canvas to place.';
    });

    // Brush Tip selection
    brushRound.addEventListener('change', () => {
        brushTip = 'round';
        applyDrawingSettings();
        statusText.textContent = 'Brush tip set to Round.';
        setTimeout(() => statusText.textContent = 'Ready', 2000);
    });
    brushSquare.addEventListener('change', () => {
        brushTip = 'butt';
        applyDrawingSettings();
        statusText.textContent = 'Brush tip set to Square.';
        setTimeout(() => statusText.textContent = 'Ready', 2000);
    });

    // Opacity Slider Event Listener
    opacitySlider.addEventListener('input', (e) => {
        currentOpacity = parseFloat(e.target.value) / 100;
        opacityValue.textContent = `${e.target.value}%`;
        applyDrawingSettings();
    });

    // Grayscale Filter Button Event Listener
    grayscaleFilterBtn.addEventListener('click', applyGrayscaleFilter);
    // Invert Filter Button Event Listener
    invertFilterBtn.addEventListener('click', applyInvertFilter);
    // Flip Horizontal Button Event Listener
    flipHorizontalBtn.addEventListener('click', applyFlipHorizontalFilter);
    // Flip Vertical Button Event Listener
    flipVerticalBtn.addEventListener('click', applyFlipVerticalFilter);


    // Fill shape toggle
    fillShapeToggle.addEventListener('change', (e) => {
        isShapeFilled = e.target.checked;
        statusText.textContent = `Shapes will now be ${isShapeFilled ? 'filled' : 'outlined'}`;
        setTimeout(() => statusText.textContent = 'Ready', 2000);
    });


    // Color picker (custom input)
    customColor.addEventListener('input', (e) => {
        selectColor(e.target.value);
    });

    // Brush size slider
    brushSize.addEventListener('input', (e) => {
        currentBrushSize = parseInt(e.target.value);
        brushSizeValue.textContent = currentBrushSize;
        applyDrawingSettings();
    });

    // Action buttons
    undoBtn.addEventListener('click', undo);
    redoBtn.addEventListener('click', redo);
    clearBtn.addEventListener('click', clearCanvas);
    saveBtn.addEventListener('click', saveCanvas);

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey || e.metaKey) {
            switch(e.key) {
                case 'z':
                    e.preventDefault();
                    undo();
                    break;
                case 'y':
                    e.preventDefault();
                    redo();
                    break;
                case 's':
                    e.preventDefault();
                    saveCanvas();
                    break;
            }
        }
    });

    // Initialize the application
    initCanvas();

    // Listen for window resize events to keep canvas adaptive
    window.addEventListener('resize', resizeCanvas);
});