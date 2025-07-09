import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, PieChart, Hash } from 'lucide-react';
import SentimentChart from '@/components/SentimentChart';
import SentimentPieChart from '@/components/SentimentPieChart';
import WordCloud from '@/components/WordCloud';

interface SentimentData {
  timestamp: number;
  positive: number;
  neutral: number;
  negative: number;
}

interface MiddleBarProps {
  sentimentHistory: SentimentData[];
  sentiment: {
    type: string;
    confidence: number;
    scores: {
      positive: number;
      neutral: number;
      negative: number;
    };
  };
  transcription: Array<{
    id: string;
    text: string;
    timestamp: number;
    speaker: 'user' | 'agent';
  }>;
}

const MiddleBar: React.FC<MiddleBarProps> = ({
  sentimentHistory,
  sentiment,
  transcription
}) => {
  return (
    <div className="h-full bg-background p-4 overflow-hidden">
      <div className="grid grid-cols-3 gap-4 h-full overflow-hidden">
        {/* Sentiment Fluctuation Chart */}
        <Card className="h-full flex flex-col overflow-hidden">
          <CardHeader className="pb-3 flex-shrink-0">
            <CardTitle className="flex items-center text-base">
              <BarChart3 className="mr-2 h-4 w-4" />
              Sentiment Over Time
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden p-4">
            <SentimentChart sentimentHistory={sentimentHistory} />
          </CardContent>
        </Card>

        {/* Sentiment Pie Chart */}
        <Card className="h-full flex flex-col overflow-hidden">
          <CardHeader className="pb-3 flex-shrink-0">
            <CardTitle className="flex items-center text-base">
              <PieChart className="mr-2 h-4 w-4" />
              Sentiment Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden p-4">
            <SentimentPieChart sentiment={sentiment} />
          </CardContent>
        </Card>

        {/* Word Cloud */}
        <Card className="h-full flex flex-col overflow-hidden">
          <CardHeader className="pb-3 flex-shrink-0">
            <CardTitle className="flex items-center text-base">
              <Hash className="mr-2 h-4 w-4" />
              Key Words
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden p-4">
            <WordCloud transcription={transcription} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MiddleBar;