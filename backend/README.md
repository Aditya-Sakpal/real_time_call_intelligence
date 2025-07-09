# Real-Time Call Intelligence Backend

This backend server provides real-time audio transcription and sentiment analysis using WebSocket connections. It processes audio streams from the frontend and returns transcribed text with sentiment analysis.

## Features

- **Real-time audio processing**: Streams audio data via WebSocket
- **Speech-to-text**: Uses OpenAI Whisper API for accurate transcription
- **Sentiment analysis**: Analyzes emotional tone using TextBlob
- **WebSocket API**: Maintains persistent connections for real-time communication
- **Audio buffering**: Processes audio in chunks for optimal performance

## Setup

### Prerequisites

- Python 3.8 or higher
- OpenAI API key

### Installation

1. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Environment Setup**:
   Create a `.env` file in the backend directory with your OpenAI API key:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   ```

### Quick Start

Run the server using the startup script:
```bash
python start_server.py
```

Or run directly:
```bash
python websocket_server.py
```

The server will start on `http://localhost:8000`

## API Endpoints

### WebSocket Endpoint
- **URL**: `ws://localhost:8000/ws/{client_id}`
- **Purpose**: Real-time audio streaming and transcription

### HTTP Endpoints
- **Health Check**: `GET /health`
- **Root**: `GET /`

## WebSocket Communication

### Client to Server Messages

#### Audio Chunk
```json
{
  "type": "audio_chunk",
  "audio_data": "base64_encoded_audio_data",
  "timestamp": 1234567890000
}
```

#### Ping
```json
{
  "type": "ping"
}
```

### Server to Client Messages

#### Transcription Result
```json
{
  "type": "transcription",
  "text": "Hello, how can I help you today?",
  "sentiment": {
    "type": "positive",
    "confidence": 0.85,
    "polarity": 0.3,
    "subjectivity": 0.7
  },
  "timestamp": 1234567890000
}
```

#### Pong Response
```json
{
  "type": "pong"
}
```

## Audio Processing

### Audio Format Requirements
- **Sample Rate**: 16kHz (optimal for speech recognition)
- **Channels**: Mono (1 channel)
- **Bit Depth**: 16-bit PCM
- **Encoding**: Base64 for WebSocket transmission

### Processing Pipeline
1. **Audio Buffering**: Collects audio chunks until minimum duration (2 seconds)
2. **Format Conversion**: Converts raw audio to WAV format
3. **Transcription**: Sends audio to OpenAI Whisper API
4. **Sentiment Analysis**: Analyzes transcribed text using TextBlob
5. **Response**: Returns transcription and sentiment data to client

## Configuration

### Environment Variables
- `OPENAI_API_KEY`: Your OpenAI API key (required)

### Server Configuration
- **Host**: `0.0.0.0` (all interfaces)
- **Port**: `8000`
- **CORS**: Enabled for frontend origins
- **Reload**: Enabled in development mode

## Error Handling

The server handles various error scenarios:
- **Connection errors**: Automatic reconnection on client side
- **Audio processing errors**: Logged and skipped
- **API errors**: Graceful degradation with error logging
- **Invalid messages**: Ignored with warning logs

## Development

### Running in Development Mode
```bash
python websocket_server.py
```

### Testing the Server
1. Check server health: `curl http://localhost:8000/health`
2. Test WebSocket connection using a WebSocket client
3. Send audio chunks and verify transcription responses

### Logs
The server provides detailed logging for:
- Client connections/disconnections
- Audio processing status
- Transcription results
- Error conditions

## Performance Considerations

- **Audio Buffering**: Minimum 2-second buffer before processing
- **Concurrent Connections**: Supports multiple simultaneous clients
- **Memory Management**: Buffers are cleared after processing
- **API Rate Limits**: Respects OpenAI API rate limits

## Troubleshooting

### Common Issues

1. **"No module named 'xyz'"**
   - Solution: Install missing dependencies with `pip install -r requirements.txt`

2. **"OPENAI_API_KEY not found"**
   - Solution: Create `.env` file with your API key

3. **WebSocket connection failed**
   - Check if server is running on port 8000
   - Verify CORS settings for your frontend origin

4. **No transcription results**
   - Check OpenAI API key validity
   - Verify audio format (16kHz, mono, 16-bit)
   - Check minimum audio duration (2 seconds)

### Debug Mode
Enable debug logging by setting log level to DEBUG in the server configuration.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License. 