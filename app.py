#!/usr/bin/env python3
"""
AI Manga Video Generator Backend
Powered by Wan2.1 technology for high-quality image-to-video generation
"""

import os
import sys
import json
import time
import uuid
import asyncio
import logging
from pathlib import Path
from typing import Optional, Dict, Any
import tempfile
import shutil

# Add Wan2.1 to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'Wan2.1-main'))

import torch
import numpy as np
from PIL import Image
from flask import Flask, request, jsonify, send_file, Response
from flask_cors import CORS
from werkzeug.utils import secure_filename
import cv2

# Import Wan2.1 modules
try:
    import wan
    from wan.configs import MAX_AREA_CONFIGS, WAN_CONFIGS
    from wan.utils.prompt_extend import QwenPromptExpander
    from wan.utils.utils import cache_video
except ImportError as e:
    print(f"Warning: Could not import Wan2.1 modules: {e}")
    print("Make sure Wan2.1-main directory is present and dependencies are installed")

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Flask app setup
app = Flask(__name__)
CORS(app)
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Configuration
UPLOAD_FOLDER = 'uploads'
OUTPUT_FOLDER = 'outputs'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'}

# Create directories
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(OUTPUT_FOLDER, exist_ok=True)

# Global model variables
wan_i2v_model = None
prompt_expander = None
device = 'cuda' if torch.cuda.is_available() else 'cpu'

class MangaVideoGenerator:
    """Main class for manga video generation using Wan2.1"""
    
    def __init__(self):
        self.model = None
        self.prompt_expander = None
        self.device = device
        
    def load_model(self, model_path: str = None, resolution: str = '480p'):
        """Load the Wan2.1 I2V model"""
        try:
            if model_path is None:
                # Use default model path based on resolution
                if resolution == '720p':
                    model_path = './Wan2.1-I2V-14B-720P'
                else:
                    model_path = './Wan2.1-I2V-14B-480P'
            
            logger.info(f"Loading Wan2.1 I2V model from {model_path}...")
            
            # Load model configuration
            cfg = WAN_CONFIGS['i2v-14B']
            
            # Initialize model
            self.model = wan.WanI2V(
                config=cfg,
                checkpoint_dir=model_path,
                device_id=0,
                rank=0,
                t5_fsdp=False,
                dit_fsdp=False,
                use_usp=False,
            )
            
            logger.info("Model loaded successfully!")
            return True
            
        except Exception as e:
            logger.error(f"Error loading model: {e}")
            return False
    
    def enhance_prompt(self, prompt: str, image: Image.Image, target_lang: str = 'en') -> str:
        """Enhance the prompt using AI"""
        try:
            if self.prompt_expander is None:
                # Initialize prompt expander
                self.prompt_expander = QwenPromptExpander(
                    model_name=None,  # Use default model
                    is_vl=True,
                    device=0
                )
            
            # Enhance prompt
            result = self.prompt_expander(prompt, image=image, tar_lang=target_lang.lower())
            
            if result.status:
                return result.prompt
            else:
                return prompt
                
        except Exception as e:
            logger.warning(f"Prompt enhancement failed: {e}")
            return prompt
    
    def add_fog_effects(self, prompt: str, fog_intensity: int) -> str:
        """Add fog effects to the prompt based on intensity"""
        fog_descriptions = {
            0: "",
            1: "light mist",
            2: "gentle fog",
            3: "soft atmospheric fog",
            4: "mystical fog",
            5: "dense atmospheric fog",
            6: "thick mystical fog",
            7: "heavy atmospheric fog",
            8: "dense ethereal fog",
            9: "thick mystical fog with glowing particles",
            10: "extremely dense ethereal fog with magical particles"
        }
        
        if fog_intensity > 0:
            fog_desc = fog_descriptions.get(fog_intensity, fog_descriptions[5])
            if fog_desc:
                prompt += f", {fog_desc}, atmospheric lighting, ethereal atmosphere"
        
        return prompt
    
    def add_movement_effects(self, prompt: str, movement_speed: int, loop_mode: str) -> str:
        """Add movement effects to the prompt"""
        movement_descriptions = {
            1: "very slow, gentle movement",
            2: "slow, graceful movement",
            3: "moderate, flowing movement",
            4: "smooth, natural movement",
            5: "dynamic, fluid movement",
            6: "energetic, lively movement",
            7: "fast, dynamic movement",
            8: "rapid, energetic movement",
            9: "very fast, intense movement",
            10: "extremely fast, dramatic movement"
        }
        
        movement_desc = movement_descriptions.get(movement_speed, movement_descriptions[5])
        prompt += f", {movement_desc}"
        
        # Add loop-specific effects
        if loop_mode == 'seamless':
            prompt += ", seamless loop, continuous motion"
        elif loop_mode == 'reverse':
            prompt += ", reverse loop, back and forth movement"
        
        return prompt
    
    def generate_video(self, 
                      image_path: str,
                      prompt: str,
                      resolution: str = '480p',
                      duration: int = 5,
                      fog_intensity: int = 5,
                      movement_speed: int = 5,
                      loop_mode: str = 'seamless',
                      guidance_scale: float = 5.0,
                      steps: int = 50,
                      negative_prompt: str = "",
                      seed: int = -1) -> str:
        """Generate video from image and prompt"""
        
        try:
            # Load and preprocess image
            image = Image.open(image_path).convert('RGB')
            
            # Enhance prompt with fog and movement effects
            enhanced_prompt = self.add_fog_effects(prompt, fog_intensity)
            enhanced_prompt = self.add_movement_effects(enhanced_prompt, movement_speed, loop_mode)
            
            # Add manga-specific enhancements
            enhanced_prompt += ", manga style, anime style, high quality, detailed, vibrant colors"
            
            # Enhance prompt using AI
            enhanced_prompt = self.enhance_prompt(enhanced_prompt, image)
            
            logger.info(f"Enhanced prompt: {enhanced_prompt}")
            
            # Set negative prompt
            if not negative_prompt:
                negative_prompt = "blurry, low quality, distorted, deformed, extra limbs, bad anatomy, worst quality, low resolution, pixelated, artifacts"
            
            # Determine max area based on resolution
            if resolution == '720p':
                max_area = MAX_AREA_CONFIGS['720*1280']
            else:
                max_area = MAX_AREA_CONFIGS['480*832']
            
            # Generate video
            logger.info("Starting video generation...")
            video = self.model.generate(
                enhanced_prompt,
                image,
                max_area=max_area,
                shift=5.0,  # Flow shift parameter
                sampling_steps=steps,
                guide_scale=guidance_scale,
                n_prompt=negative_prompt,
                seed=seed if seed != -1 else None,
                offload_model=True
            )
            
            # Save video
            output_filename = f"manga_video_{uuid.uuid4().hex}.mp4"
            output_path = os.path.join(OUTPUT_FOLDER, output_filename)
            
            cache_video(
                tensor=video[None],
                save_file=output_path,
                fps=16,
                nrow=1,
                normalize=True,
                value_range=(-1, 1)
            )
            
            logger.info(f"Video saved to: {output_path}")
            return output_path
            
        except Exception as e:
            logger.error(f"Error generating video: {e}")
            raise e

# Initialize generator
generator = MangaVideoGenerator()

def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def cleanup_old_files():
    """Clean up old uploaded and generated files"""
    try:
        current_time = time.time()
        max_age = 3600  # 1 hour
        
        for folder in [UPLOAD_FOLDER, OUTPUT_FOLDER]:
            for filename in os.listdir(folder):
                file_path = os.path.join(folder, filename)
                if os.path.isfile(file_path):
                    file_age = current_time - os.path.getctime(file_path)
                    if file_age > max_age:
                        os.remove(file_path)
                        logger.info(f"Cleaned up old file: {file_path}")
    except Exception as e:
        logger.warning(f"Error during cleanup: {e}")

@app.route('/')
def index():
    """Serve the main page"""
    return send_file('index.html')

@app.route('/styles.css')
def styles():
    """Serve CSS file"""
    return send_file('styles.css')

@app.route('/script.js')
def script():
    """Serve JavaScript file"""
    return send_file('script.js')

@app.route('/health')
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'model_loaded': generator.model is not None,
        'device': device,
        'cuda_available': torch.cuda.is_available()
    })

@app.route('/generate', methods=['POST'])
def generate():
    """Generate video from uploaded image"""
    try:
        # Clean up old files
        cleanup_old_files()
        
        # Check if model is loaded
        if generator.model is None:
            return jsonify({'error': 'Model not loaded'}), 500
        
        # Get form data
        if 'image' not in request.files:
            return jsonify({'error': 'No image file provided'}), 400
        
        file = request.files['image']
        if file.filename == '':
            return jsonify({'error': 'No image file selected'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({'error': 'Invalid file type'}), 400
        
        # Get parameters
        prompt = request.form.get('prompt', '')
        resolution = request.form.get('resolution', '480p')
        duration = int(request.form.get('duration', 5))
        fog_intensity = int(request.form.get('fogIntensity', 5))
        movement_speed = int(request.form.get('movementSpeed', 5))
        loop_mode = request.form.get('loopMode', 'seamless')
        guidance_scale = float(request.form.get('guidanceScale', 5.0))
        steps = int(request.form.get('steps', 50))
        negative_prompt = request.form.get('negativePrompt', '')
        seed = int(request.form.get('seed', -1))
        
        if not prompt.strip():
            return jsonify({'error': 'Prompt is required'}), 400
        
        # Save uploaded file
        filename = secure_filename(file.filename)
        unique_filename = f"{uuid.uuid4().hex}_{filename}"
        image_path = os.path.join(UPLOAD_FOLDER, unique_filename)
        file.save(image_path)
        
        def generate_stream():
            """Stream generation progress"""
            try:
                # Send initial progress
                yield f"data: {json.dumps({'progress': 10, 'message': 'Processing image...'})}\n\n"
                
                # Generate video
                output_path = generator.generate_video(
                    image_path=image_path,
                    prompt=prompt,
                    resolution=resolution,
                    duration=duration,
                    fog_intensity=fog_intensity,
                    movement_speed=movement_speed,
                    loop_mode=loop_mode,
                    guidance_scale=guidance_scale,
                    steps=steps,
                    negative_prompt=negative_prompt,
                    seed=seed
                )
                
                # Send completion
                yield f"data: {json.dumps({'progress': 100, 'message': 'Video generated successfully!', 'videoUrl': f'/video/{os.path.basename(output_path)}'})}\n\n"
                
                # Clean up uploaded file
                try:
                    os.remove(image_path)
                except:
                    pass
                    
            except Exception as e:
                logger.error(f"Generation error: {e}")
                yield f"data: {json.dumps({'error': str(e)})}\n\n"
        
        return Response(generate_stream(), mimetype='text/plain')
        
    except Exception as e:
        logger.error(f"Error in generate endpoint: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/video/<filename>')
def serve_video(filename):
    """Serve generated video files"""
    try:
        video_path = os.path.join(OUTPUT_FOLDER, filename)
        if os.path.exists(video_path):
            return send_file(video_path, mimetype='video/mp4')
        else:
            return jsonify({'error': 'Video not found'}), 404
    except Exception as e:
        logger.error(f"Error serving video: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/models/load', methods=['POST'])
def load_model():
    """Load a specific model"""
    try:
        data = request.get_json()
        model_path = data.get('model_path')
        resolution = data.get('resolution', '480p')
        
        success = generator.load_model(model_path, resolution)
        
        if success:
            return jsonify({'message': 'Model loaded successfully'})
        else:
            return jsonify({'error': 'Failed to load model'}), 500
            
    except Exception as e:
        logger.error(f"Error loading model: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    # Try to load default model on startup
    logger.info("Starting AI Manga Video Generator...")
    logger.info(f"Using device: {device}")
    
    # Load model in background
    def load_model_async():
        try:
            generator.load_model()
            logger.info("Model loaded successfully!")
        except Exception as e:
            logger.warning(f"Could not load model on startup: {e}")
            logger.info("Model will be loaded when first request is made")
    
    # Start model loading in background
    import threading
    threading.Thread(target=load_model_async, daemon=True).start()
    
    # Start Flask app
    app.run(host='0.0.0.0', port=5000, debug=False, threaded=True)