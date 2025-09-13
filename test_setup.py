#!/usr/bin/env python3
"""
Test script to verify AI Manga Video Generator setup
"""

import os
import sys
import subprocess
import importlib.util

def test_python_version():
    """Test Python version"""
    print("🐍 Testing Python version...")
    version = sys.version_info
    if version >= (3, 8):
        print(f"✅ Python {version.major}.{version.minor}.{version.micro} - OK")
        return True
    else:
        print(f"❌ Python {version.major}.{version.minor}.{version.micro} - Need 3.8+")
        return False

def test_dependencies():
    """Test required dependencies"""
    print("\n📦 Testing dependencies...")
    
    required_packages = [
        'torch',
        'flask',
        'PIL',
        'cv2',
        'numpy',
        'transformers'
    ]
    
    missing = []
    for package in required_packages:
        try:
            if package == 'PIL':
                import PIL
            elif package == 'cv2':
                import cv2
            else:
                importlib.import_module(package)
            print(f"✅ {package} - OK")
        except ImportError:
            print(f"❌ {package} - Missing")
            missing.append(package)
    
    return len(missing) == 0

def test_cuda():
    """Test CUDA availability"""
    print("\n🎮 Testing CUDA...")
    try:
        import torch
        if torch.cuda.is_available():
            gpu_count = torch.cuda.device_count()
            gpu_name = torch.cuda.get_device_name(0)
            print(f"✅ CUDA available - {gpu_count} GPU(s)")
            print(f"   GPU 0: {gpu_name}")
            return True
        else:
            print("⚠️  CUDA not available - will use CPU")
            return False
    except Exception as e:
        print(f"❌ CUDA test failed: {e}")
        return False

def test_model_files():
    """Test if model files exist"""
    print("\n🤖 Testing model files...")
    
    model_paths = [
        "./Wan2.1-I2V-14B-480P",
        "./Wan2.1-main"
    ]
    
    all_exist = True
    for path in model_paths:
        if os.path.exists(path):
            print(f"✅ {path} - Found")
        else:
            print(f"❌ {path} - Missing")
            all_exist = False
    
    return all_exist

def test_directories():
    """Test if required directories exist"""
    print("\n📁 Testing directories...")
    
    required_dirs = [
        "uploads",
        "outputs",
        "examples"
    ]
    
    all_exist = True
    for dir_name in required_dirs:
        if os.path.exists(dir_name):
            print(f"✅ {dir_name}/ - Found")
        else:
            print(f"❌ {dir_name}/ - Missing")
            all_exist = False
    
    return all_exist

def test_web_files():
    """Test if web files exist"""
    print("\n🌐 Testing web files...")
    
    web_files = [
        "index.html",
        "styles.css",
        "script.js",
        "app.py"
    ]
    
    all_exist = True
    for file_name in web_files:
        if os.path.exists(file_name):
            print(f"✅ {file_name} - Found")
        else:
            print(f"❌ {file_name} - Missing")
            all_exist = False
    
    return all_exist

def test_server_startup():
    """Test if server can start"""
    print("\n🚀 Testing server startup...")
    
    try:
        # Try to import the app
        from app import app
        print("✅ Flask app imports successfully")
        
        # Test health endpoint (without actually starting server)
        with app.test_client() as client:
            # This would test the health endpoint if we started the server
            print("✅ Flask app can create test client")
        
        return True
    except Exception as e:
        print(f"❌ Server startup test failed: {e}")
        return False

def main():
    """Run all tests"""
    print("🧪 AI Manga Video Generator - Setup Test")
    print("=" * 50)
    
    tests = [
        test_python_version,
        test_dependencies,
        test_cuda,
        test_model_files,
        test_directories,
        test_web_files,
        test_server_startup
    ]
    
    results = []
    for test in tests:
        try:
            result = test()
            results.append(result)
        except Exception as e:
            print(f"❌ Test failed with error: {e}")
            results.append(False)
    
    # Summary
    print("\n" + "=" * 50)
    print("📊 Test Summary")
    print("=" * 50)
    
    passed = sum(results)
    total = len(results)
    
    if passed == total:
        print(f"🎉 All tests passed! ({passed}/{total})")
        print("\n✅ Setup is complete. You can start the server with:")
        print("   python start_server.py")
    else:
        print(f"⚠️  {passed}/{total} tests passed")
        print("\n❌ Some issues found. Please check the errors above.")
        
        if not results[1]:  # dependencies
            print("\n💡 To fix dependency issues:")
            print("   pip install -r requirements.txt")
        
        if not results[3]:  # model files
            print("\n💡 To fix model issues:")
            print("   python start_server.py --model Wan2.1-I2V-14B-480P")

if __name__ == "__main__":
    main()