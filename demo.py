#!/usr/bin/env python3
"""
Demo script for AI Manga Video Generator
This script demonstrates how to use the generator programmatically
"""

import os
import sys
import time
from pathlib import Path

# Add the current directory to Python path
sys.path.insert(0, os.path.dirname(__file__))

from app import MangaVideoGenerator

def demo_generation():
    """Demonstrate video generation with sample data"""
    
    print("🎬 AI Manga Video Generator - Demo")
    print("=" * 40)
    
    # Initialize generator
    generator = MangaVideoGenerator()
    
    # Check if model is available
    model_path = "./Wan2.1-I2V-14B-480P"
    if not os.path.exists(model_path):
        print(f"❌ Model not found at {model_path}")
        print("Please download the model first:")
        print("python start_server.py --model Wan2.1-I2V-14B-480P")
        return
    
    # Load model
    print("🤖 Loading model...")
    if not generator.load_model(model_path):
        print("❌ Failed to load model")
        return
    print("✅ Model loaded successfully!")
    
    # Check for sample image
    sample_image = "./examples/sample_manga.jpg"
    if not os.path.exists(sample_image):
        print(f"❌ Sample image not found at {sample_image}")
        print("Please add a sample manga image to test with")
        return
    
    # Generate video
    print("🎨 Generating video...")
    try:
        output_path = generator.generate_video(
            image_path=sample_image,
            prompt="Character walking through a mystical foggy forest with gentle wind effects, manga style, anime style, high quality, detailed, vibrant colors",
            resolution="480p",
            duration=5,
            fog_intensity=7,
            movement_speed=5,
            loop_mode="seamless",
            guidance_scale=5.0,
            steps=50,
            negative_prompt="blurry, low quality, distorted, deformed, extra limbs, bad anatomy",
            seed=42
        )
        
        print(f"✅ Video generated successfully!")
        print(f"📁 Output: {output_path}")
        
        # Check file size
        file_size = os.path.getsize(output_path)
        print(f"📊 File size: {file_size / (1024*1024):.2f} MB")
        
    except Exception as e:
        print(f"❌ Error generating video: {e}")
        return
    
    print("\n🎉 Demo completed successfully!")
    print("You can now start the web server with:")
    print("python start_server.py")

if __name__ == "__main__":
    demo_generation()