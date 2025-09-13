# AI Manga Video Generator

🎬 Transform your manga images into animated videos with AI-powered character movement and atmospheric effects!

## Features

- **Image-to-Video Generation**: Convert static manga images into dynamic videos
- **Character Animation**: AI-powered character movement and motion
- **Atmospheric Effects**: Add fog, lighting, and environmental effects
- **Loop Generation**: Create seamless or reverse loops
- **High Quality Output**: Support for 480P and 720P resolutions
- **Real-time Progress**: Live progress updates during generation
- **Modern Web Interface**: Beautiful, responsive design

## Technology Stack

- **Backend**: Python Flask with Wan2.1 AI model
- **Frontend**: HTML5, CSS3, JavaScript
- **AI Model**: Wan2.1 Image-to-Video (I2V) 14B model
- **Video Processing**: OpenCV, FFmpeg
- **Deep Learning**: PyTorch, Transformers

## Quick Start

### Prerequisites

- Python 3.8 or higher
- CUDA-compatible GPU (recommended)
- 16GB+ RAM
- 20GB+ free disk space

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ai-manga-video-generator
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Download the Wan2.1 model**
   ```bash
   # Option 1: Using huggingface-cli
   pip install "huggingface_hub[cli]"
   huggingface-cli download Wan-AI/Wan2.1-I2V-14B-480P --local-dir ./Wan2.1-I2V-14B-480P
   
   # Option 2: Using the startup script
   python start_server.py --model Wan2.1-I2V-14B-480P
   ```

4. **Start the server**
   ```bash
   python start_server.py
   ```

5. **Open your browser**
   Navigate to `http://localhost:5000`

## Usage

### Basic Usage

1. **Upload Image**: Drag and drop or click to upload a manga image
2. **Describe Animation**: Enter a description of how you want the character to move
3. **Adjust Settings**: Configure resolution, duration, fog intensity, and movement speed
4. **Generate**: Click "Generate Video" and wait for the AI to create your animation
5. **Download**: Save your generated video

### Advanced Options

- **Resolution**: Choose between 480P (faster) and 720P (higher quality)
- **Duration**: Set video length (3-8 seconds)
- **Fog Intensity**: Control atmospheric effects (0-10)
- **Movement Speed**: Adjust character animation speed (1-10)
- **Loop Mode**: Create seamless or reverse loops
- **Guidance Scale**: Control prompt adherence (1-20)
- **Diffusion Steps**: Quality vs speed trade-off (20-100)

### Example Prompts

- "Character walking through a mystical foggy forest with gentle wind effects"
- "Manga character moving gracefully with atmospheric fog and lighting"
- "Animated character with flowing movement and ethereal fog effects"
- "Character in dynamic pose with swirling fog and dramatic lighting"

## API Endpoints

### POST /generate
Generate video from uploaded image and prompt.

**Parameters:**
- `image`: Image file (PNG, JPG, JPEG, GIF, BMP, WEBP)
- `prompt`: Animation description
- `resolution`: "480p" or "720p"
- `duration`: Video duration in seconds
- `fogIntensity`: Fog effect intensity (0-10)
- `movementSpeed`: Movement speed (1-10)
- `loopMode`: "none", "seamless", or "reverse"
- `guidanceScale`: Guidance scale (1-20)
- `steps`: Diffusion steps (20-100)
- `negativePrompt`: What to avoid in the video

**Response:** Streaming JSON with progress updates and final video URL.

### GET /health
Check server health and model status.

### GET /video/<filename>
Download generated video files.

## Configuration

### Environment Variables

- `CUDA_VISIBLE_DEVICES`: GPU device selection
- `PYTORCH_CUDA_ALLOC_CONF`: Memory allocation settings

### Model Configuration

The system supports multiple Wan2.1 models:

- **Wan2.1-I2V-14B-480P**: Faster generation, 480P output
- **Wan2.1-I2V-14B-720P**: Higher quality, 720P output

## Performance

### Hardware Requirements

**Minimum:**
- 8GB RAM
- 8GB VRAM
- CPU: Intel i5 or AMD Ryzen 5

**Recommended:**
- 16GB+ RAM
- 12GB+ VRAM (RTX 3080/4080 or better)
- CPU: Intel i7 or AMD Ryzen 7

### Generation Times

- **480P**: 2-4 minutes (RTX 4090)
- **720P**: 4-8 minutes (RTX 4090)

*Times may vary based on hardware and settings.*

## Troubleshooting

### Common Issues

1. **Out of Memory Error**
   - Reduce resolution to 480P
   - Lower guidance scale
   - Reduce diffusion steps

2. **Model Not Found**
   - Ensure model is downloaded correctly
   - Check model path in configuration
   - Verify file permissions

3. **Slow Generation**
   - Use 480P resolution
   - Reduce diffusion steps
   - Ensure GPU is being used

4. **Poor Quality Results**
   - Increase guidance scale
   - Add more diffusion steps
   - Improve prompt description
   - Use higher resolution

### Debug Mode

Run with debug mode for detailed logging:
```bash
python start_server.py --debug
```

## Development

### Project Structure

```
ai-manga-video-generator/
├── app.py                 # Main Flask application
├── start_server.py        # Server startup script
├── requirements.txt       # Python dependencies
├── index.html            # Main web interface
├── styles.css            # CSS styles
├── script.js             # Frontend JavaScript
├── uploads/              # Temporary uploaded files
├── outputs/              # Generated videos
├── Wan2.1-main/          # Wan2.1 model code
└── README.md             # This file
```

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the Apache License 2.0. See [LICENSE](LICENSE) for details.

## Acknowledgments

- **Wan2.1 Team**: For the amazing video generation model
- **Hugging Face**: For model hosting and distribution
- **PyTorch Team**: For the deep learning framework
- **Flask Team**: For the web framework

## Support

- **Issues**: Report bugs and request features on GitHub
- **Discussions**: Join community discussions
- **Documentation**: Check the wiki for detailed guides

## Changelog

### v1.0.0
- Initial release
- Image-to-video generation
- Fog and atmospheric effects
- Character movement animation
- Loop generation
- Web interface
- API endpoints

---

**Made with ❤️ using Wan2.1 technology**