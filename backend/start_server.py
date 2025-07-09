#!/usr/bin/env python3
"""
Real-Time Call Intelligence WebSocket Server
Startup script to run the FastAPI WebSocket server for voice transcription and sentiment analysis.
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv
import subprocess

def check_requirements():
    """Check if all required dependencies are installed."""
    try:
        import fastapi
        import uvicorn
        import websockets
        import openai
        import textblob
        import numpy as np
        print("✓ All dependencies are installed")
        return True
    except ImportError as e:
        print(f"✗ Missing dependency: {e}")
        print("Please install dependencies with: pip install -r requirements.txt")
        return False

def check_environment():
    """Check if environment variables are set."""
    load_dotenv()
    
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        print("✗ OPENAI_API_KEY not found in environment variables")
        print("Please create a .env file with your OpenAI API key:")
        print("OPENAI_API_KEY=your_api_key_here")
        return False
    
    print("✓ Environment variables are configured")
    return True

def main():
    """Main function to start the server."""
    print("🚀 Starting Real-Time Call Intelligence Server")
    print("=" * 50)
    
    # Check requirements
    if not check_requirements():
        sys.exit(1)
    
    # Check environment
    if not check_environment():
        sys.exit(1)
    
    print("\n📡 Starting WebSocket server...")
    print("Server will be available at: http://localhost:8000")
    print("WebSocket endpoint: ws://localhost:8000/ws/{client_id}")
    print("Health check: http://localhost:8000/health")
    print("\nPress Ctrl+C to stop the server\n")
    
    try:
        # Import uvicorn and run the server
        import uvicorn
        
        # Use import string instead of app object for reload to work
        uvicorn.run(
            "websocket_server:app",
            host="0.0.0.0",
            port=8000,
            reload=True,
            log_level="info"
        )
    except KeyboardInterrupt:
        print("\n🛑 Server stopped by user")
    except Exception as e:
        print(f"\n❌ Server error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main() 