import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';

type SpeechRecognitionEvent = Event & {
    readonly resultIndex: number;
    readonly results: SpeechRecognitionResultList;
  };
  

const LiveCaption = () => {
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Speech recognition not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognitionRef.current = recognition;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcriptPart = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          setTranscript(prev => prev + transcriptPart + ' ');
        } else {
          interimTranscript += transcriptPart;
        }
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
    };

    recognition.onend = () => {
      if (isListening) {
        recognition.start(); // Auto-restart if still listening
      }
    };
  }, [isListening]);

  const toggleListening = () => {
    const recognition = recognitionRef.current;
    if (!recognition) return;

    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      setTranscript(''); // Clear transcript on new start
      recognition.start();
      setIsListening(true);
    }
  };

  return (
    <div className="p-4 max-w-xl mx-auto">
      <h2 className="text-xl font-semibold mb-4">🎤 Live Captions</h2>

      <div className="border p-4 rounded shadow-md min-h-[100px] bg-gray-100 text-gray-800 whitespace-pre-wrap">
        {transcript || 'Start speaking...'}
      </div>

      <Button
        onClick={toggleListening}
        className={`mt-4 px-6 py-2 rounded text-white font-bold ${
          isListening ? 'bg-red-600' : 'bg-green-600'
        } hover:opacity-90 transition`}
      >
        {isListening ? 'Stop Mic' : 'Start Mic'}
      </Button>
    </div>
  );
};

export default LiveCaption;
