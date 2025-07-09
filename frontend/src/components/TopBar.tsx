import React from 'react';
import { Mic, MicOff, Clock, MessageSquare, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import AudioVisualizer from '@/components/AudioVisualizer';

interface TopBarProps {
  isRecording: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  conversationDuration: number;
  wordCount: number;
  audioLevel: number;
  sentiment: {
    type: string;
    confidence: number;
  };
  isConnected?: boolean;
}

const TopBar: React.FC<TopBarProps> = ({
  isRecording,
  onStartRecording,
  onStopRecording,
  conversationDuration,
  wordCount,
  audioLevel,
  sentiment,
  isConnected = true
}) => {
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-green-500';
      case 'negative': return 'text-red-500';
      default: return 'text-yellow-500';
    }
  };

  return (
    <div className="h-full bg-card border-b flex items-center justify-between px-6">
      {/* Left Section - Recording Controls */}
      <div className="flex items-center space-x-4">
        <Button
          onClick={isRecording ? onStopRecording : onStartRecording}
          size="lg"
          variant={isRecording ? "destructive" : "default"}
          className={`${isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'} px-8`}
        >
          {isRecording ? <MicOff className="mr-2 h-5 w-5" /> : <Mic className="mr-2 h-5 w-5" />}
          {isRecording ? 'Stop Recording' : 'Start Recording'}
        </Button>
        
        {isRecording && (
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse mr-2"></div>
              <span className="text-sm font-medium">Recording</span>
            </div>
            <AudioVisualizer audioLevel={audioLevel} isRecording={isRecording} />
          </div>
        )}
        
        {!isConnected && (
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
            <span className="text-sm font-medium text-yellow-500">Connected</span>
          </div>
        )}
      </div>

      {/* Right Section - Metrics */}
      <div className="flex items-center space-x-6">
        <div className="flex items-center">
          <Clock className="h-4 w-4 text-muted-foreground mr-2" />
          <span className="font-mono text-lg text-white">{formatDuration(conversationDuration)}</span>
          <span className="ml-2 text-xs text-muted-foreground">Total Time</span>
        </div>
        <div className="flex items-center">
          <MessageSquare className="h-4 w-4 text-muted-foreground mr-2" />
          <span className="font-mono text-lg text-white">{wordCount} words</span>
          <span className="ml-2 text-xs text-muted-foreground">Total Words</span>
        </div>
        <div className="flex items-center">
          <AlertTriangle className={`h-5 w-5 mr-2 ${getSentimentColor(sentiment.type)}`} />
          <Badge variant={sentiment.type === 'positive' ? 'default' : sentiment.type === 'negative' ? 'destructive' : 'secondary'}>
            Overall: {sentiment.type} ({Math.round(sentiment.confidence * 100)}%)
          </Badge>
        </div>
      </div>
    </div>
  );
};

export default TopBar;