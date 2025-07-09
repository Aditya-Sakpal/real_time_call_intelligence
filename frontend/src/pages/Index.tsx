
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import TopBar from '@/components/TopBar';
import MiddleBar from '@/components/MiddleBar';
import BottomBar from '@/components/BottomBar';
import { useAudioCapture } from '@/hooks/useAudioCapture';
import { useSentimentAnalysis } from '@/hooks/useSentimentAnalysis';
import { useTranscription } from '@/hooks/useTranscription';

const Index = () => {
  const [conversationDuration, setConversationDuration] = useState(0);
  const [wordCount, setWordCount] = useState(0);
  const startTimeRef = useRef<number>(0);
  const [coachingTips, setCoachingTips] = useState([]);
  const [totalDuration, setTotalDuration] = useState(0);


  const { transcription, isTranscribing, addTranscription } = useTranscription();
  const { sentiment, sentimentHistory, analyzeSentiment } = useSentimentAnalysis();

  // Handle real-time transcription from WebSocket
  const handleTranscription = useCallback((text: string, sentimentData: any) => {
    addTranscription(text, 'user', sentimentData.type);
    analyzeSentiment(text);
    setWordCount(prev => prev + text.split(' ').length);
  }, [addTranscription, analyzeSentiment]);

  const { audioLevel, startCapture, stopCapture, isSupported, isRecording, isConnected } = useAudioCapture({
    onTranscription: handleTranscription
  });

  // Timer for conversation duration
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      startTimeRef.current = Date.now();
      interval = setInterval(() => {
        setConversationDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  // Real-time transcription is now handled by WebSocket in useAudioCapture

  const handleStartRecording = async () => {
    try {
      await startCapture();
      setConversationDuration(0);
      setWordCount(0);
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  };

  const handleStopRecording = async () => {
    stopCapture();
    setTotalDuration(prev => prev + conversationDuration);
      // Gather the full transcript (assuming it's in `transcription`)
    const fullTranscript = transcription.map(t => t.text).join(' ');
    if (fullTranscript.trim()) {
      const response = await fetch('https://real-time-call-intelligence.onrender.com/coaching-tips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: fullTranscript }),
      });
      const data = await response.json();
      setCoachingTips(data.tips || []);
    }
  };

  function getOverallSentiment(transcription) {
    const sentimentScores = { positive: 0, negative: 0, neutral: 0 };
    let count = 0;
    transcription.forEach(t => {
      if (t.sentiment) {
        sentimentScores[t.sentiment] = (sentimentScores[t.sentiment] || 0) + 1;
        count++;
      }
    });
    if (count === 0) return { type: 'neutral', confidence: 1 };
    const maxType = Object.keys(sentimentScores).reduce((a, b) => sentimentScores[a] > sentimentScores[b] ? a : b);
    return { type: maxType, confidence: sentimentScores[maxType] / count };
  }
  const overallSentiment = getOverallSentiment(transcription);

  function getSentimentDistribution(transcription) {
    const scores = { positive: 0, neutral: 0, negative: 0 };
    let total = 0;
    transcription.forEach(t => {
      if (t.sentiment && scores.hasOwnProperty(t.sentiment)) {
        scores[t.sentiment]++;
        total++;
      }
    });
    // Convert counts to proportions (0-1)
    if (total === 0) return { positive: 0, neutral: 0, negative: 0 };
    return {
      positive: scores.positive / total,
      neutral: scores.neutral / total,
      negative: scores.negative / total,
    };
  }
  const overallSentimentScores = getSentimentDistribution(transcription);

  const totalWordCount = transcription.reduce((sum, t) => sum + t.text.split(' ').length, 0);


  if (!isSupported) {
    return (
      <div className="dark">
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6">
              <div className="text-center">
                <AlertTriangle className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
                <h2 className="text-xl font-semibold mb-2">Audio Not Supported</h2>
                <p className="text-muted-foreground">Your browser doesn't support audio capture. Please use a modern browser like Chrome or Firefox.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="dark">
      <div className="h-screen bg-background flex flex-col overflow-hidden">
        {/* TopBar - 10% */}
        <div className="h-[10vh] flex-shrink-0">
          <TopBar 
            isRecording={isRecording}
            onStartRecording={handleStartRecording}
            onStopRecording={handleStopRecording}
            conversationDuration={totalDuration + (isRecording ? conversationDuration : 0)}
            wordCount={totalWordCount}
            audioLevel={audioLevel}
            sentiment={overallSentiment}
            isConnected={isConnected}
          />
        </div>

        {/* MiddleBar - 45% */}
        <div className="h-[45vh] flex-shrink-0">
          <MiddleBar 
            sentimentHistory={sentimentHistory}
            sentiment={{ ...overallSentiment, scores: overallSentimentScores }}
            transcription={transcription}
          />
        </div>

        {/* BottomBar - 45% */}
        <div className="h-[45vh] flex-shrink-0">
          <BottomBar 
            transcription={transcription}
            isTranscribing={isTranscribing}
            sentiment={sentiment}
            conversationDuration={conversationDuration}
            wordCount={wordCount}
            isRecording={isRecording}
            coachingTips={coachingTips}
          />
        </div>
      </div>
    </div>
  );
};

export default Index;
