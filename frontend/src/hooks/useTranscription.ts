
import { useState, useCallback } from 'react';

interface TranscriptionEntry {
  id: string;
  text: string;
  timestamp: number;
  speaker: 'user' | 'agent';
  sentiment?: string;
  sentimentConfidence?: number;
  duration?: number; // Duration in milliseconds
}

export const useTranscription = () => {
  const [transcription, setTranscription] = useState<TranscriptionEntry[]>([]);
  const [isTranscribing, setIsTranscribing] = useState(false);

  const addTranscription = useCallback((text: string, speaker: 'user' | 'agent' = 'user', sentiment?: string | null, isLiveUpdate: boolean = false, duration?: number, sentimentConfidence?: number) => {
    if (isLiveUpdate) {
      // Update the current transcription block during recording
      setTranscription(prev => {
        const lastEntry = prev[prev.length - 1];
        if (lastEntry && lastEntry.speaker === speaker && !lastEntry.sentiment) {
          // Update the existing entry
          return [
            ...prev.slice(0, -1),
            { ...lastEntry, text, timestamp: Date.now() }
          ];
        } else {
          // Create new entry for live update
          const newEntry: TranscriptionEntry = {
            id: `live-${Date.now()}-${Math.random()}`,
            text,
            timestamp: Date.now(),
            speaker,
            sentiment: undefined
          };
          return [...prev, newEntry];
        }
      });
      setIsTranscribing(true);
    } else {
      // Final transcription with sentiment
      const newEntry: TranscriptionEntry = {
        id: `${Date.now()}-${Math.random()}`,
        text,
        timestamp: Date.now(),
        speaker,
        sentiment: sentiment || undefined,
        sentimentConfidence: sentimentConfidence,
        duration: duration
      };
      
      setTranscription(prev => {
        // Replace the last live entry if it exists
        const lastEntry = prev[prev.length - 1];
        if (lastEntry && lastEntry.id.startsWith('live-') && lastEntry.speaker === speaker) {
          return [...prev.slice(0, -1), newEntry];
        } else {
          return [...prev, newEntry];
        }
      });
      setIsTranscribing(true);
      
      // Simulate processing time
      setTimeout(() => setIsTranscribing(false), 1000);
    }
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
