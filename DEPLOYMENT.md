# Deployment Guide

This guide covers different deployment options for the AI Manga Video Generator.

## Local Development

### Quick Start

1. **Install dependencies**
   ```bash
   ./install.sh
   ```

2. **Start the server**
   ```bash
   python start_server.py
   ```

3. **Open browser**
   Navigate to `http://localhost:5000`

### Manual Installation

1. **Install Python dependencies**
   ```bash
   pip install -r requirements.txt
   ```

2. **Download model**
   ```bash
   huggingface-cli download Wan-AI/Wan2.1-I2V-14B-480P --local-dir ./Wan2.1-I2V-14B-480P
   ```

3. **Start server**
   ```bash
   python start_server.py
   ```

## Docker Deployment

### Using Docker Compose (Recommended)

1. **Build and start services**
   ```bash
   docker-compose up -d
   ```

2. **Access the application**
   - Web interface: `http://localhost`
   - Direct API: `http://localhost:5000`

### Using Docker directly

1. **Build the image**
   ```bash
   docker build -t ai-manga-generator .
   ```

2. **Run the container**
   ```bash
   docker run -d \
     --name ai-manga-generator \
     --gpus all \
     -p 5000:5000 \
     -v $(pwd)/uploads:/app/uploads \
     -v $(pwd)/outputs:/app/outputs \
     ai-manga-generator
   ```

## Cloud Deployment

### AWS EC2

1. **Launch GPU instance**
   - Instance type: g4dn.xlarge or larger
   - AMI: Deep Learning AMI (Ubuntu 20.04)
   - Storage: 50GB+ EBS volume

2. **Connect and setup**
   ```bash
   ssh -i your-key.pem ubuntu@your-instance-ip
   git clone <your-repo>
   cd ai-manga-video-generator
   ./install.sh
   ```

3. **Configure security groups**
   - Allow inbound traffic on port 5000
   - Allow inbound traffic on port 80 (if using nginx)

4. **Start with systemd**
   ```bash
   sudo cp ai-manga-generator.service /etc/systemd/system/
   sudo systemctl enable ai-manga-generator
   sudo systemctl start ai-manga-generator
   ```

### Google Cloud Platform

1. **Create VM instance**
   ```bash
   gcloud compute instances create ai-manga-generator \
     --zone=us-central1-a \
     --machine-type=n1-standard-4 \
     --accelerator=type=nvidia-tesla-t4,count=1 \
     --image-family=tf-latest-gpu \
     --image-project=deeplearning-platform-release
   ```

2. **Setup application**
   ```bash
   gcloud compute ssh ai-manga-generator
   # Follow local installation steps
   ```

### Azure

1. **Create VM with GPU**
   - VM size: Standard_NC6s_v3 or larger
   - OS: Ubuntu 20.04 LTS
   - Enable GPU drivers

2. **Deploy application**
   ```bash
   # SSH into VM and follow local installation
   ```

## Production Considerations

### Performance Optimization

1. **GPU Memory Management**
   ```bash
   export PYTORCH_CUDA_ALLOC_CONF=max_split_size_mb:512
   ```

2. **Model Optimization**
   - Use 480P model for faster generation
   - Reduce diffusion steps for speed
   - Enable model offloading

3. **Caching**
   - Implement Redis for session management
   - Cache generated videos
   - Use CDN for static assets

### Security

1. **Environment Variables**
   ```bash
   export FLASK_ENV=production
   export FLASK_DEBUG=False
   ```

2. **Rate Limiting**
   - Implement request rate limiting
   - Add authentication if needed
   - Monitor resource usage

3. **File Security**
   - Validate uploaded files
   - Scan for malware
   - Limit file sizes

### Monitoring

1. **Health Checks**
   ```bash
   curl http://localhost:5000/health
   ```

2. **Logging**
   - Configure log rotation
   - Monitor error rates
   - Track generation times

3. **Metrics**
   - GPU utilization
   - Memory usage
   - Request latency

## Scaling

### Horizontal Scaling

1. **Load Balancer**
   - Use nginx or HAProxy
   - Distribute requests across instances
   - Health check endpoints

2. **Multiple Instances**
   - Deploy on multiple servers
   - Use shared storage for models
   - Implement session affinity

### Vertical Scaling

1. **Larger GPUs**
   - Use A100 or H100 for better performance
   - Increase VRAM for larger models
   - Enable multi-GPU support

2. **Memory Optimization**
   - Increase system RAM
   - Use model quantization
   - Implement gradient checkpointing

## Troubleshooting

### Common Issues

1. **Out of Memory**
   ```bash
   # Reduce batch size
   export PYTORCH_CUDA_ALLOC_CONF=max_split_size_mb:256
   
   # Use CPU offloading
   python start_server.py --cpu-offload
   ```

2. **Model Loading Errors**
   ```bash
   # Check model path
   ls -la ./Wan2.1-I2V-14B-480P/
   
   # Re-download model
   huggingface-cli download Wan-AI/Wan2.1-I2V-14B-480P --local-dir ./Wan2.1-I2V-14B-480P
   ```

3. **Permission Issues**
   ```bash
   # Fix file permissions
   chmod -R 755 uploads outputs
   chown -R www-data:www-data uploads outputs
   ```

### Performance Issues

1. **Slow Generation**
   - Check GPU utilization: `nvidia-smi`
   - Reduce resolution to 480P
   - Lower diffusion steps

2. **High Memory Usage**
   - Monitor with `htop`
   - Restart server periodically
   - Clear temporary files

## Backup and Recovery

### Data Backup

1. **Generated Videos**
   ```bash
   # Backup outputs directory
   tar -czf outputs-backup.tar.gz outputs/
   ```

2. **Configuration**
   ```bash
   # Backup configuration files
   cp -r .env nginx.conf docker-compose.yml backup/
   ```

### Recovery

1. **Restore from backup**
   ```bash
   tar -xzf outputs-backup.tar.gz
   ```

2. **Recreate environment**
   ```bash
   ./install.sh
   docker-compose up -d
   ```

## Support

For deployment issues:

1. Check the logs: `docker-compose logs`
2. Verify GPU access: `nvidia-smi`
3. Test health endpoint: `curl http://localhost:5000/health`
4. Review system resources: `htop`, `df -h`

For additional help, please refer to the main README.md or create an issue on GitHub.