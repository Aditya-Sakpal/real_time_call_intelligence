
import { useState, useCallback } from 'react';

interface TranscriptionEntry {
  id: string;
  text: string;
  timestamp: number;
  speaker: 'user' | 'agent';
  sentiment?: string;
}

export const useTranscription = () => {
  const [transcription, setTranscription] = useState<TranscriptionEntry[]>([]);
  const [isTranscribing, setIsTranscribing] = useState(false);

  const addTranscription = useCallback((text: string, speaker: 'user' | 'agent' = 'user', sentiment?: string) => {
    const newEntry: TranscriptionEntry = {
      id: `${Date.now()}-${Math.random()}`,
      text,
      timestamp: Date.now(),
      speaker,
      sentiment
    };
    
    setTranscription(prev => [...prev, newEntry]);
    setIsTranscribing(true);
    
    // Simulate processing time
    setTimeout(() => setIsTranscribing(false), 1000);
  }, []);

  const clearTranscription = useCallback(() => {
    setTranscription([]);
  }, []);

  return {
    transcription,
    isTranscribing,
    addTranscription,
    clearTranscription
  };
};
