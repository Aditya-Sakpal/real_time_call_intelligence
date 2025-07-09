from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi import Request
import json
import io
import wave
import numpy as np
from openai import OpenAI
from textblob import TextBlob
from dotenv import load_dotenv
import os
import logging
from typing import Dict, List
import uvicorn
import datetime

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize OpenAI client
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

app = FastAPI(title="Real-Time Call Intelligence API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080", "http://localhost:5173","https://real-time-call-intelligence.vercel.app"],  # React dev server ports
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Store active connections
active_connections: Dict[str, WebSocket] = {}

class AudioBuffer:
    def __init__(self, sample_rate: int = 16000):
        self.sample_rate = sample_rate
        self.buffer = []
        self.min_duration = 1.0  # Minimum 2 seconds before transcription
        
    def add_chunk(self, audio_data: bytes):
        """Add audio chunk to buffer"""
        self.buffer.append(audio_data)
        
    def get_duration(self) -> float:
        """Get current buffer duration in seconds"""
        if not self.buffer:
            return 0.0
        total_bytes = sum(len(chunk) for chunk in self.buffer)
        # Assuming 16-bit PCM mono audio
        total_samples = total_bytes // 2
        return total_samples / self.sample_rate
    
    def get_wav_data(self) -> bytes:
        """Convert buffer to WAV format"""
        if not self.buffer:
            return b""
            
        # Combine all chunks
        audio_data = b"".join(self.buffer)
        
        # Convert to numpy array (16-bit PCM)
        audio_array = np.frombuffer(audio_data, dtype=np.int16)
        
        # Create WAV file in memory
        wav_buffer = io.BytesIO()
        with wave.open(wav_buffer, 'wb') as wav_file:
            wav_file.setnchannels(1)  # Mono
            wav_file.setsampwidth(2)  # 16-bit
            wav_file.setframerate(self.sample_rate)
            wav_file.writeframes(audio_array.tobytes())
        
        wav_buffer.seek(0)
        return wav_buffer.read()
    
    def clear(self):
        """Clear the buffer"""
        self.buffer = []

def analyze_sentiment_with_openai(text: str) -> dict:
    """Analyze sentiment using OpenAI API"""
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": SENTIMENT_SYSTEM_PROMPT},
                {"role": "user", "content": text}
            ],
            response_format={"type": "json_object"},
            temperature=0.3,  # Lower temperature for more consistent sentiment analysis
        )
        json_response = json.loads(response.choices[0].message.content)
        return json_response["sentiment"]
    except Exception as e:
        logger.error(f"Error analyzing sentiment with OpenAI: {e}")
        return {"type": "neutral", "confidence": 0.0}

async def transcribe_audio(audio_data: bytes) -> str:
    """Transcribe audio using OpenAI Whisper"""
    try:
        # Create a file-like object from bytes
        audio_file = io.BytesIO(audio_data)
        audio_file.name = "audio.wav"
        
        # Use OpenAI API for transcription
        transcription = client.audio.transcriptions.create(
            language="en",
            model="whisper-1",
            file=audio_file,
            response_format="text"
        )
        
        return transcription.strip()
    except Exception as e:
        logger.error(f"Transcription error: {e}")
        return ""

SYSTEM_PROMPT = """
You are a helpful assistant that provides coaching tips for sales calls.
You are given a transcript of a sales call and you need to provide a list of coaching tips to improve the call.
The tips should be in the following json format:
{{
    "tips": [
        {{
            "tip": "Tip 1",
            "confidence": 0.9
        }},
        {{
            "tip": "Tip 2",
            "confidence": 0.8
        }}
    ]
}}
"""

SENTIMENT_SYSTEM_PROMPT = """
You are a sentiment analysis expert. Analyze the sentiment of the given text and provide the sentiment type and confidence score.
You must respond in the following JSON format:
{{
    "sentiment": {{
        "type": "positive" | "negative" | "neutral",
        "confidence": 0.95
    }}
}}

Guidelines:
- type: Must be exactly one of "positive", "negative", or "neutral"
- confidence: A float between 0.0 and 1.0 representing how confident you are in the sentiment classification
- Consider the overall tone, emotion, and context of the text
- Be precise with confidence scores - higher confidence for clear sentiment, lower for ambiguous cases
"""

def get_ai_coaching_tips(text:str):
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": text}
            ],
            response_format={"type": "json_object"},
            temperature=0.7,
        )
        json_response = json.loads(response.choices[0].message.content)
        return json_response["tips"]
    except Exception as e:
        logger.error(f"Error getting AI coaching tips: {e}")
        return []

@app.get("/")
async def root():
    return {"message": "Real-Time Call Intelligence WebSocket Server"}

@app.post("/coaching-tips")
async def coaching_tips(request: Request):
    data = await request.json()
    transcript = data.get("transcript", "")
    tips = get_ai_coaching_tips(transcript)
    return {"tips": tips}

@app.post("/sentiment-analysis")
async def sentiment_analysis(request: Request):
    data = await request.json()
    transcript = data.get("transcript", "")
    if not transcript.strip():
        return {"sentiment": {"type": "neutral", "confidence": 0.0}}
    
    sentiment = analyze_sentiment_with_openai(transcript)
    return {"sentiment": sentiment}

@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):

    await websocket.accept()
    active_connections[client_id] = websocket
    audio_buffer = AudioBuffer()
    
    logger.info(f"Client {client_id} connected")
    
    try:
        while True:
            # First receive the message (either text or bytes)
            data = await websocket.receive()
            
            # Handle binary audio data
            if "bytes" in data:
                audio_data = data["bytes"]
                audio_buffer.add_chunk(audio_data)
                if audio_buffer.get_duration() >= audio_buffer.min_duration:
                    wav_data = audio_buffer.get_wav_data()
                    transcription = await transcribe_audio(wav_data)
                    print(transcription)
                    if transcription:
                        duration = audio_buffer.get_duration()
                        response = {
                            "type": "transcription",
                            "text": transcription,
                            "timestamp": duration  # Send duration (seconds) instead of actual timestamp
                        }
                        await websocket.send_json(response)
                        logger.info(f"Sent transcription to {client_id}")
                    audio_buffer.clear()
            
            # Handle text control messages
            elif "text" in data:
                try:
                    message = json.loads(data["text"])
                    if message.get("type") == "ping":
                        await websocket.send_json({"type": "pong"})
                except json.JSONDecodeError:
                    logger.warning(f"Invalid JSON received from {client_id}")
                    
    except WebSocketDisconnect:
        logger.info(f"Client {client_id} disconnected")
    except Exception as e:
        logger.error(f"Error with client {client_id}: {str(e)}")
    finally:
        active_connections.pop(client_id, None)
        logger.info(f"Connection closed for {client_id}")

@app.get("/")
async def root():
    return {"message": "Real-Time Call Intelligence WebSocket Server"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "active_connections": len(active_connections)}

if __name__ == "__main__":
    uvicorn.run(
        "websocket_server:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    ) 