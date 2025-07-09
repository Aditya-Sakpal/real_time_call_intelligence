import { useState, useEffect, useRef, useCallback } from 'react';
import { useWebSocket } from './useWebSocket';

interface AudioCaptureOptions {
  onTranscription?: (transcription: string, sentiment: any) => void;
  websocketUrl?: string;
  onError?: (error: Error) => void;
}

export const useAudioCapture = (options: AudioCaptureOptions = {}) => {
  const [audioLevel, setAudioLevel] = useState(0);
  const [isSupported, setIsSupported] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  
  const websocketUrl = options.websocketUrl || `wss://real-time-call-intelligence.onrender.com/ws/${Math.random().toString(36).substr(2, 9)}`;

  // Buffer to accumulate audio samples for 2 seconds
  const bufferedSamplesRef = useRef<Int16Array[]>([]);
  const bufferedLengthRef = useRef<number>(0);
  const SAMPLES_PER_CHUNK = 16000 * 2; // 2 seconds at 16kHz
  
  const { isConnected, connect, disconnect, sendMessage } = useWebSocket({
    url: websocketUrl,
    onMessage: (message) => {
      console.log('WebSocket message:', message);
      if (message.type === 'transcription' && options.onTranscription) {
        options.onTranscription(message.text, message.sentiment);
      }
    },
    onError: (error) => {
      console.error('WebSocket error:', error);
      options.onError?.(new Error('WebSocket error'));
    },
    // onClose: () => {
    //   console.log('WebSocket connection closed');
    //   if (isRecording) {
    //     options.onError?.(new Error('WebSocket disconnected during recording'));
    //   }
    // }
  });

  useEffect(() => {
    // Check if audio capture is supported
    if (!navigator.mediaDevices?.getUserMedia) {
      setIsSupported(false);
      options.onError?.(new Error('Audio capture not supported'));
    }
    
    return () => {
      stopCapture();
    };
  }, []);

  const startCapture = useCallback(async () => {
    try {
      console.log('Starting capture');
      // Connect to WebSocket first
      if (!isConnected) {
        connect();
      }

      console.log('Connected to WebSocket');

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000,
          channelCount: 1
        } 
      });
      
      mediaStreamRef.current = stream;

      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 16000
      });
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);
      
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      microphone.connect(analyser);
      
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      microphone.connect(processor);
      processor.connect(audioContext.destination);

      console.log('Processor created');
      processor.onaudioprocess = (event) => {
        // console.log('Audio process', isRecording, isConnected);
        const inputData = event.inputBuffer.getChannelData(0);
        const int16Array = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          int16Array[i] = Math.max(-32768, Math.min(32767, inputData[i] * 32767));
        }
        // Buffer the audio data
        bufferedSamplesRef.current.push(int16Array);
        bufferedLengthRef.current += int16Array.length;
        // If we've collected at least 2 seconds worth of samples, send to backend
        if (bufferedLengthRef.current >= SAMPLES_PER_CHUNK) {
          // Concatenate all buffered samples
          const totalSamples = bufferedLengthRef.current;
          const combined = new Int16Array(totalSamples);
          let offset = 0;
          for (const chunk of bufferedSamplesRef.current) {
            combined.set(chunk, offset);
            offset += chunk.length;
          }
          // Send as binary data directly
          sendMessage(combined.buffer);
          // Clear the buffer
          bufferedSamplesRef.current = [];
          bufferedLengthRef.current = 0;
        }
      };
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      processorRef.current = processor;
      setIsRecording(true);

      const updateAudioLevel = () => {
        if (analyserRef.current) {
          const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
          analyserRef.current.getByteFrequencyData(dataArray);
          setAudioLevel(dataArray.reduce((sum, val) => sum + val, 0) / dataArray.length / 255);
          animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
        }
      };
      
      updateAudioLevel();
      
    } catch (error) {
      console.error('Audio capture error:', error);
      setIsRecording(false);
      options.onError?.(error instanceof Error ? error : new Error('Audio capture failed'));
      throw error;
    }
  }, [isConnected, connect, sendMessage, isRecording]);

  const stopCapture = useCallback(() => {
    setIsRecording(false);
    // Clear audio buffer
    bufferedSamplesRef.current = [];
    bufferedLengthRef.current = 0;
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close().catch(console.error);
      audioContextRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }

    // disconnect();
    setAudioLevel(0);
  }, [disconnect]);

  return {
    audioLevel,
    startCapture,
    stopCapture,
    isSupported,
    isRecording,
    isConnected
  };
};