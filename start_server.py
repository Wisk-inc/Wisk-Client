#!/usr/bin/env python3
"""
Startup script for AI Manga Video Generator
This script handles model downloading and server startup
"""

import os
import sys
import subprocess
import argparse
from pathlib import Path

def check_dependencies():
    """Check if required dependencies are installed"""
    try:
        import torch
        import flask
        import PIL
        print("✓ Core dependencies found")
        return True
    except ImportError as e:
        print(f"✗ Missing dependency: {e}")
        return False

def download_model(model_name="Wan2.1-I2V-14B-480P", use_huggingface=True):
    """Download the Wan2.1 model"""
    print(f"Downloading {model_name}...")
    
    if use_huggingface:
        try:
            from huggingface_hub import snapshot_download
            model_path = f"Wan-AI/{model_name}"
            local_dir = f"./{model_name}"
            
            print(f"Downloading from Hugging Face: {model_path}")
            snapshot_download(
                repo_id=model_path,
                local_dir=local_dir,
                local_dir_use_symlinks=False
            )
            print(f"✓ Model downloaded to {local_dir}")
            return local_dir
            
        except ImportError:
            print("huggingface_hub not found, trying alternative method...")
            return download_model_alternative(model_name)
        except Exception as e:
            print(f"Error downloading from Hugging Face: {e}")
            return download_model_alternative(model_name)
    else:
        return download_model_alternative(model_name)

def download_model_alternative(model_name):
    """Alternative model download method"""
    print("Please download the model manually:")
    print(f"1. Go to https://huggingface.co/Wan-AI/{model_name}")
    print(f"2. Download the model files")
    print(f"3. Extract to ./{model_name}/ directory")
    return f"./{model_name}"

def setup_environment():
    """Set up environment variables and directories"""
    # Create necessary directories
    os.makedirs("uploads", exist_ok=True)
    os.makedirs("outputs", exist_ok=True)
    os.makedirs("models", exist_ok=True)
    
    # Set environment variables
    os.environ.setdefault("CUDA_VISIBLE_DEVICES", "0")
    os.environ.setdefault("PYTORCH_CUDA_ALLOC_CONF", "max_split_size_mb:512")
    
    print("✓ Environment setup complete")

def start_server(host="0.0.0.0", port=5000, debug=False):
    """Start the Flask server"""
    print(f"Starting server on {host}:{port}")
    
    # Import and run the app
    try:
        from app import app
        app.run(host=host, port=port, debug=debug, threaded=True)
    except Exception as e:
        print(f"Error starting server: {e}")
        sys.exit(1)

def main():
    parser = argparse.ArgumentParser(description="AI Manga Video Generator Server")
    parser.add_argument("--host", default="0.0.0.0", help="Host to bind to")
    parser.add_argument("--port", type=int, default=5000, help="Port to bind to")
    parser.add_argument("--debug", action="store_true", help="Enable debug mode")
    parser.add_argument("--model", default="Wan2.1-I2V-14B-480P", help="Model to download")
    parser.add_argument("--skip-download", action="store_true", help="Skip model download")
    parser.add_argument("--skip-deps", action="store_true", help="Skip dependency check")
    
    args = parser.parse_args()
    
    print("🎬 AI Manga Video Generator")
    print("=" * 40)
    
    # Check dependencies
    if not args.skip_deps:
        if not check_dependencies():
            print("\nPlease install dependencies:")
            print("pip install -r requirements.txt")
            sys.exit(1)
    
    # Setup environment
    setup_environment()
    
    # Download model if needed
    if not args.skip_download:
        model_path = f"./{args.model}"
        if not os.path.exists(model_path):
            download_model(args.model)
        else:
            print(f"✓ Model already exists at {model_path}")
    
    # Start server
    print("\n🚀 Starting server...")
    start_server(args.host, args.port, args.debug)

if __name__ == "__main__":
    main()