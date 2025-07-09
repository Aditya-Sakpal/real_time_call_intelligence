
import { useState, useCallback, useRef } from 'react';

interface SentimentScores {
  positive: number;
  neutral: number;
  negative: number;
}

interface SentimentData {
  type: 'positive' | 'neutral' | 'negative';
  confidence: number;
  scores: SentimentScores;
}

interface SentimentHistoryEntry {
  timestamp: number;
  positive: number;
  neutral: number;
  negative: number;
}

export const useSentimentAnalysis = () => {
  const [sentiment, setSentiment] = useState<SentimentData>({
    type: 'neutral',
    confidence: 0,
    scores: { positive: 0.33, neutral: 0.33, negative: 0.33 }
  });
  
  const [sentimentHistory, setSentimentHistory] = useState<SentimentHistoryEntry[]>([]);
  const analysisCache = useRef<Map<string, SentimentData>>(new Map());

  // Simple sentiment analysis simulation
  const analyzeSentiment = useCallback((text: string) => {
    // Check cache first
    if (analysisCache.current.has(text)) {
      const cachedResult = analysisCache.current.get(text)!;
      setSentiment(cachedResult);
      return cachedResult;
    }

    // Simple keyword-based sentiment analysis
    const positiveWords = [
      'good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'perfect', 
      'love', 'like', 'happy', 'pleased', 'satisfied', 'thank', 'thanks', 'awesome',
      'brilliant', 'outstanding', 'superb', 'marvelous', 'terrific', 'appreciate'
    ];
    
    const negativeWords = [
      'bad', 'terrible', 'awful', 'horrible', 'hate', 'angry', 'frustrated', 
      'annoying', 'stupid', 'ridiculous', 'useless', 'worst', 'disappointed',
      'furious', 'outraged', 'disgusted', 'appalled', 'irritated', 'mad'
    ];

    const words = text.toLowerCase().split(/\s+/);
    let positiveScore = 0;
    let negativeScore = 0;
    let totalWords = words.length;

    words.forEach(word => {
      if (positiveWords.some(pw => word.includes(pw))) {
        positiveScore += 1;
      }
      if (negativeWords.some(nw => word.includes(nw))) {
        negativeScore += 1;
      }
    });

    // Calculate normalized scores
    const positive = totalWords > 0 ? Math.min(1, positiveScore / totalWords * 3) : 0.33;
    const negative = totalWords > 0 ? Math.min(1, negativeScore / totalWords * 3) : 0.33;
    const neutral = Math.max(0, 1 - positive - negative);

    // Determine dominant sentiment
    let type: 'positive' | 'neutral' | 'negative' = 'neutral';
    let confidence = 0.5;

    if (positive > negative && positive > neutral) {
      type = 'positive';
      confidence = positive;
    } else if (negative > positive && negative > neutral) {
      type = 'negative';
      confidence = negative;
    } else {
      confidence = neutral;
    }

    const result: SentimentData = {
      type,
      confidence,
      scores: { positive, neutral, negative }
    };

    // Cache the result
    analysisCache.current.set(text, result);
    setSentiment(result);

    // Add to history
    setSentimentHistory(prev => [
      ...prev,
      {
        timestamp: Date.now(),
        positive,
        neutral,
        negative
      }
    ].slice(-20)); // Keep last 20 entries

    return result;
  }, []);

  const resetSentiment = useCallback(() => {
    setSentiment({
      type: 'neutral',
      confidence: 0,
      scores: { positive: 0.33, neutral: 0.33, negative: 0.33 }
    });
    setSentimentHistory([]);
    analysisCache.current.clear();
  }, []);

  return {
    sentiment,
    sentimentHistory,
    analyzeSentiment,
    resetSentiment
  };
};
