#!/bin/bash

# AI Manga Video Generator Installation Script
# This script sets up the environment and installs dependencies

set -e

echo "🎬 AI Manga Video Generator - Installation Script"
echo "=================================================="

# Check if Python 3.8+ is installed
check_python() {
    if command -v python3 &> /dev/null; then
        PYTHON_VERSION=$(python3 -c 'import sys; print(".".join(map(str, sys.version_info[:2])))')
        echo "✓ Python $PYTHON_VERSION found"
        
        # Check if version is 3.8 or higher
        if python3 -c 'import sys; exit(0 if sys.version_info >= (3, 8) else 1)'; then
            return 0
        else
            echo "✗ Python 3.8 or higher is required"
            return 1
        fi
    else
        echo "✗ Python 3 not found"
        return 1
    fi
}

# Check if CUDA is available
check_cuda() {
    if command -v nvidia-smi &> /dev/null; then
        echo "✓ NVIDIA GPU detected"
        nvidia-smi --query-gpu=name,memory.total --format=csv,noheader,nounits
        return 0
    else
        echo "⚠ NVIDIA GPU not detected - will use CPU (slower)"
        return 1
    fi
}

# Install Python dependencies
install_dependencies() {
    echo "📦 Installing Python dependencies..."
    
    # Upgrade pip
    python3 -m pip install --upgrade pip
    
    # Install requirements
    pip3 install -r requirements.txt
    
    echo "✓ Dependencies installed successfully"
}

# Download model
download_model() {
    echo "🤖 Downloading Wan2.1 model..."
    
    # Check if huggingface-cli is available
    if command -v huggingface-cli &> /dev/null; then
        echo "Using huggingface-cli to download model..."
        huggingface-cli download Wan-AI/Wan2.1-I2V-14B-480P --local-dir ./Wan2.1-I2V-14B-480P
    else
        echo "Installing huggingface-cli..."
        pip3 install "huggingface_hub[cli]"
        huggingface-cli download Wan-AI/Wan2.1-I2V-14B-480P --local-dir ./Wan2.1-I2V-14B-480P
    fi
    
    echo "✓ Model downloaded successfully"
}

# Create necessary directories
create_directories() {
    echo "📁 Creating directories..."
    mkdir -p uploads outputs models
    echo "✓ Directories created"
}

# Set up environment
setup_environment() {
    echo "⚙️ Setting up environment..."
    
    # Create .env file if it doesn't exist
    if [ ! -f .env ]; then
        cat > .env << EOF
# AI Manga Video Generator Environment Variables
CUDA_VISIBLE_DEVICES=0
PYTORCH_CUDA_ALLOC_CONF=max_split_size_mb:512
FLASK_ENV=production
FLASK_DEBUG=False
EOF
        echo "✓ Created .env file"
    fi
    
    # Make scripts executable
    chmod +x start_server.py
    chmod +x install.sh
    
    echo "✓ Environment setup complete"
}

# Main installation process
main() {
    echo "Starting installation..."
    echo ""
    
    # Check prerequisites
    echo "🔍 Checking prerequisites..."
    if ! check_python; then
        echo "Please install Python 3.8 or higher and try again."
        exit 1
    fi
    
    check_cuda
    echo ""
    
    # Install dependencies
    install_dependencies
    echo ""
    
    # Create directories
    create_directories
    echo ""
    
    # Setup environment
    setup_environment
    echo ""
    
    # Download model (optional)
    read -p "Download Wan2.1 model now? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        download_model
        echo ""
    else
        echo "⚠ Model download skipped. You can download it later using:"
        echo "   python start_server.py --model Wan2.1-I2V-14B-480P"
        echo ""
    fi
    
    echo "🎉 Installation complete!"
    echo ""
    echo "To start the server, run:"
    echo "   python start_server.py"
    echo ""
    echo "Then open your browser to:"
    echo "   http://localhost:5000"
    echo ""
    echo "For more information, see README.md"
}

# Run main function
main "$@"