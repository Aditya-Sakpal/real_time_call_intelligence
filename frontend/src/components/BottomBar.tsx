import React from 'react';
import TranscriptionPanel from '@/components/TranscriptionPanel';
import CoachingPanel from '@/components/CoachingPanel';

interface BottomBarProps {
  transcription: Array<{
    id: string;
    text: string;
    timestamp: number;
    speaker: 'user' | 'agent';
    sentiment?: string;
  }>;
  isTranscribing: boolean;
  sentiment: {
    type: string;
    confidence: number;
    scores: {
      positive: number;
      neutral: number;
      negative: number;
    };
  };
  conversationDuration: number;
  wordCount: number;
  isRecording: boolean;
  coachingTips: Array<{ tip: string; confidence: number }>;
}

const BottomBar: React.FC<BottomBarProps> = ({
  transcription,
  isTranscribing,
  sentiment,
  conversationDuration,
  wordCount,
  isRecording,
  coachingTips
}) => {
  return (
    <div className="h-full bg-background p-4 overflow-hidden">
      <div className="grid grid-cols-2 gap-4 h-full overflow-hidden">
        {/* Live Transcription */}
        <div className="h-full overflow-hidden">
          <TranscriptionPanel 
            transcription={transcription} 
            isTranscribing={isTranscribing} 
            sentiment={sentiment}
          />
        </div>

        {/* AI Coaching */}
        <div className="h-full overflow-hidden">
          <CoachingPanel 
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

export default BottomBar;