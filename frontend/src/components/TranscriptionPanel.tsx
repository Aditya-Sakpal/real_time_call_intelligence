
import React, { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Mic, User } from 'lucide-react';

interface TranscriptionEntry {
  id: string;
  text: string;
  timestamp: number;
  speaker: 'user' | 'agent';
  sentiment?: string;
  sentimentConfidence?: number; // Added for confidence
  duration?: number; // Duration in milliseconds
}

interface TranscriptionPanelProps {
  transcription: TranscriptionEntry[];
  isTranscribing: boolean;
  sentiment: {
    type: string;
    confidence: number;
  };
}

const TranscriptionPanel: React.FC<TranscriptionPanelProps> = ({ 
  transcription, 
  isTranscribing, 
  sentiment 
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcription]);

  const getSentimentColor = (sentimentType?: string) => {
    switch (sentimentType) {
      case 'positive': return 'border-l-green-500 bg-green-500/10';
      case 'negative': return 'border-l-red-500 bg-red-500/10';
      case 'neutral': return 'border-l-yellow-500 bg-yellow-500/10';
      default: return 'border-l-border bg-muted/50';
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour12: false, 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  const formatDuration = (duration: number) => {
    const totalSeconds = Math.floor(duration / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex-shrink-0">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Mic className="mr-2 h-5 w-5" />
            Live Transcription
          </div>
          {isTranscribing && (
            <Badge variant="secondary" className="animate-pulse">
              Listening...
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto p-0">
        <ScrollArea className="h-full p-4" ref={scrollRef}>
          {transcription.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <Mic className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
              <p>Start recording to see live transcription...</p>
            </div>
          ) : (
            <div className="space-y-3">
              {[...transcription].reverse().map((entry) => (
                <div
                  key={entry.id}
                  className={`p-3 rounded-lg border-l-4 ${getSentimentColor(entry.sentiment)}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      {entry.speaker === 'user' ? (
                        <User className="h-4 w-4 text-blue-500 mr-2" />
                      ) : (
                        <Mic className="h-4 w-4 text-green-500 mr-2" />
                      )}
                      <span className="text-sm font-medium capitalize">
                        {entry.speaker === 'user' ? 'Customer' : 'Agent'}
                      </span>
                      {entry.id.startsWith('live-') && (
                        <Badge variant="outline" className="ml-2 text-xs animate-pulse">
                          Live
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {entry.id.startsWith('live-') ? 'Recording...' : (entry.duration ? formatDuration(entry.duration) : formatTime(entry.timestamp))}
                    </span>
                  </div>
                  <p className="text-sm text-foreground">{entry.text}</p>
                  {entry.sentiment ? (
                    <div className="mt-2 flex items-center space-x-2">
                      <Badge 
                        variant={entry.sentiment === 'positive' ? 'default' : 
                                entry.sentiment === 'negative' ? 'destructive' : 'secondary'}
                        className="text-xs"
                      >
                        {entry.sentiment}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Confidence: {Math.round((entry.sentimentConfidence || 0) * 100)}%
                      </span>
                    </div>
                  ) : entry.id.startsWith('live-') ? null : (
                    <Badge variant="outline" className="mt-2 text-xs animate-pulse">
                      Analyzing sentiment...
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default TranscriptionPanel;
