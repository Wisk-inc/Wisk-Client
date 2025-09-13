// Global variables
let selectedImage = null;
let generatedVideoUrl = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    updateRangeValues();
});

// Initialize all event listeners
function initializeEventListeners() {
    // File input change
    document.getElementById('imageInput').addEventListener('change', handleFileSelect);
    
    // Drag and drop
    const uploadArea = document.getElementById('uploadArea');
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);
    uploadArea.addEventListener('click', () => document.getElementById('imageInput').click());
    
    // Range inputs
    document.querySelectorAll('input[type="range"]').forEach(range => {
        range.addEventListener('input', updateRangeValue);
    });
    
    // Form validation
    document.getElementById('generateBtn').addEventListener('click', validateAndGenerate);
}

// Handle file selection
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
        processImageFile(file);
    } else {
        showNotification('Please select a valid image file.', 'error');
    }
}

// Handle drag over
function handleDragOver(event) {
    event.preventDefault();
    event.currentTarget.classList.add('dragover');
}

// Handle drag leave
function handleDragLeave(event) {
    event.currentTarget.classList.remove('dragover');
}

// Handle drop
function handleDrop(event) {
    event.preventDefault();
    event.currentTarget.classList.remove('dragover');
    
    const files = event.dataTransfer.files;
    if (files.length > 0 && files[0].type.startsWith('image/')) {
        processImageFile(files[0]);
    } else {
        showNotification('Please drop a valid image file.', 'error');
    }
}

// Process image file
function processImageFile(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        selectedImage = {
            file: file,
            dataUrl: e.target.result
        };
        displayImagePreview(e.target.result);
    };
    reader.readAsDataURL(file);
}

// Display image preview
function displayImagePreview(dataUrl) {
    const uploadArea = document.getElementById('uploadArea');
    const imagePreview = document.getElementById('imagePreview');
    const previewImg = document.getElementById('previewImg');
    
    uploadArea.style.display = 'none';
    previewImg.src = dataUrl;
    imagePreview.style.display = 'block';
    
    // Auto-fill prompt with suggestions
    suggestPrompt();
}

// Remove image
function removeImage() {
    selectedImage = null;
    document.getElementById('uploadArea').style.display = 'block';
    document.getElementById('imagePreview').style.display = 'none';
    document.getElementById('imageInput').value = '';
}

// Suggest prompt based on image
function suggestPrompt() {
    const promptTextarea = document.getElementById('prompt');
    if (!promptTextarea.value.trim()) {
        const suggestions = [
            "Character walking through a mystical foggy forest with gentle wind effects",
            "Manga character moving gracefully with atmospheric fog and lighting",
            "Animated character with flowing movement and ethereal fog effects",
            "Character in dynamic pose with swirling fog and dramatic lighting"
        ];
        const randomSuggestion = suggestions[Math.floor(Math.random() * suggestions.length)];
        promptTextarea.value = randomSuggestion;
    }
}

// Update range value display
function updateRangeValue(event) {
    const value = event.target.value;
    const valueSpan = event.target.parentNode.querySelector('.range-value');
    if (valueSpan) {
        valueSpan.textContent = value;
    }
}

// Update all range values on page load
function updateRangeValues() {
    document.querySelectorAll('input[type="range"]').forEach(range => {
        const valueSpan = range.parentNode.querySelector('.range-value');
        if (valueSpan) {
            valueSpan.textContent = range.value;
        }
    });
}

// Toggle advanced options
function toggleAdvanced() {
    const content = document.getElementById('advancedContent');
    const isVisible = content.style.display !== 'none';
    content.style.display = isVisible ? 'none' : 'block';
}

// Validate form and generate video
function validateAndGenerate() {
    if (!selectedImage) {
        showNotification('Please upload an image first.', 'error');
        return;
    }
    
    const prompt = document.getElementById('prompt').value.trim();
    if (!prompt) {
        showNotification('Please enter an animation description.', 'error');
        return;
    }
    
    generateVideo();
}

// Generate video
async function generateVideo() {
    const generateBtn = document.getElementById('generateBtn');
    const progressContainer = document.getElementById('progressContainer');
    const loadingOverlay = document.getElementById('loadingOverlay');
    
    // Disable generate button and show progress
    generateBtn.disabled = true;
    progressContainer.style.display = 'block';
    loadingOverlay.style.display = 'flex';
    
    try {
        // Prepare form data
        const formData = new FormData();
        formData.append('image', selectedImage.file);
        formData.append('prompt', document.getElementById('prompt').value);
        formData.append('resolution', document.getElementById('resolution').value);
        formData.append('duration', document.getElementById('duration').value);
        formData.append('fogIntensity', document.getElementById('fogIntensity').value);
        formData.append('movementSpeed', document.getElementById('movementSpeed').value);
        formData.append('loopMode', document.getElementById('loopMode').value);
        formData.append('guidanceScale', document.getElementById('guidanceScale').value);
        formData.append('steps', document.getElementById('steps').value);
        formData.append('negativePrompt', document.getElementById('negativePrompt').value);
        
        // Update progress
        updateProgress(10, 'Uploading image...');
        
        // Send request to backend
        const response = await fetch('/generate', {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }
        
        // Handle streaming response
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');
            
            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    try {
                        const data = JSON.parse(line.slice(6));
                        if (data.progress !== undefined) {
                            updateProgress(data.progress, data.message || 'Processing...');
                        }
                        if (data.videoUrl) {
                            generatedVideoUrl = data.videoUrl;
                            showResult(data.videoUrl);
                            return;
                        }
                    } catch (e) {
                        console.log('Non-JSON line:', line);
                    }
                }
            }
        }
        
    } catch (error) {
        console.error('Error generating video:', error);
        showNotification('Error generating video: ' + error.message, 'error');
    } finally {
        // Re-enable generate button and hide progress
        generateBtn.disabled = false;
        progressContainer.style.display = 'none';
        loadingOverlay.style.display = 'none';
    }
}

// Update progress
function updateProgress(percentage, message) {
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    const loadingText = document.getElementById('loadingText');
    
    progressFill.style.width = percentage + '%';
    progressText.textContent = message;
    loadingText.textContent = message;
}

// Show result
function showResult(videoUrl) {
    const resultSection = document.getElementById('resultSection');
    const resultVideo = document.getElementById('resultVideo');
    
    resultVideo.src = videoUrl;
    resultSection.style.display = 'block';
    resultSection.scrollIntoView({ behavior: 'smooth' });
    
    showNotification('Video generated successfully!', 'success');
}

// Download video
function downloadVideo() {
    if (generatedVideoUrl) {
        const a = document.createElement('a');
        a.href = generatedVideoUrl;
        a.download = 'manga_video_' + Date.now() + '.mp4';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }
}

// Share video
function shareVideo() {
    if (generatedVideoUrl && navigator.share) {
        navigator.share({
            title: 'My AI Generated Manga Video',
            text: 'Check out this amazing manga video generated with AI!',
            url: generatedVideoUrl
        });
    } else {
        // Fallback: copy to clipboard
        navigator.clipboard.writeText(generatedVideoUrl).then(() => {
            showNotification('Video URL copied to clipboard!', 'success');
        });
    }
}

// Regenerate video
function regenerateVideo() {
    document.getElementById('resultSection').style.display = 'none';
    generateVideo();
}

// Show notification
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'error' ? 'exclamation-circle' : type === 'success' ? 'check-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'error' ? '#dc3545' : type === 'success' ? '#28a745' : '#17a2b8'};
        color: white;
        padding: 15px 20px;
        border-radius: 10px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        z-index: 1001;
        display: flex;
        align-items: center;
        gap: 10px;
        max-width: 400px;
        animation: slideIn 0.3s ease;
    `;
    
    // Add animation keyframes
    if (!document.getElementById('notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 5000);
}

// Utility function to format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Utility function to validate image dimensions
function validateImageDimensions(file) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = function() {
            const maxWidth = 2048;
            const maxHeight = 2048;
            if (img.width > maxWidth || img.height > maxHeight) {
                reject(new Error(`Image dimensions (${img.width}x${img.height}) exceed maximum allowed (${maxWidth}x${maxHeight})`));
            } else {
                resolve();
            }
        };
        img.onerror = () => reject(new Error('Invalid image file'));
        img.src = URL.createObjectURL(file);
    });
}