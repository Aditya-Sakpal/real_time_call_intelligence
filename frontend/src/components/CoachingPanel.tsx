
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lightbulb, AlertTriangle, CheckCircle, TrendingDown, Heart, MessageCircle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface SentimentData {
  type: string;
  confidence: number;
  scores: {
    positive: number;
    neutral: number;
    negative: number;
  };
}

interface CoachingPanelProps {
  sentiment: SentimentData;
  conversationDuration: number;
  wordCount: number;
  isRecording: boolean;
  coachingTips: Array<{ tip: string; confidence: number }>;
}

const CoachingPanel: React.FC<CoachingPanelProps> = ({ 
  sentiment, 
  conversationDuration, 
  wordCount, 
  isRecording,
  coachingTips
}) => {
  const getCoachingRecommendations = () => {
    const recommendations = [];
    
    if (sentiment.type === 'negative' && sentiment.confidence > 0.7) {
      recommendations.push({
        type: 'warning',
        icon: AlertTriangle,
        title: 'Negative Sentiment Detected',
        message: 'Customer seems frustrated. Consider acknowledging their concerns and offering empathy.',
        priority: 'high'
      });
    }
    
    if (conversationDuration > 300) { // 5 minutes
      recommendations.push({
        type: 'info',
        icon: MessageCircle,
        title: 'Long Conversation',
        message: 'Consider summarizing key points and moving toward resolution.',
        priority: 'medium'
      });
    }
    
    if (sentiment.type === 'positive') {
      recommendations.push({
        type: 'success',
        icon: CheckCircle,
        title: 'Positive Momentum',
        message: 'Great job! Customer sentiment is positive. Keep up the excellent service.',
        priority: 'low'
      });
    }
    
    if (wordCount < 50 && conversationDuration > 60) {
      recommendations.push({
        type: 'info',
        icon: MessageCircle,
        title: 'Low Engagement',
        message: 'Customer might need more encouragement to share their concerns.',
        priority: 'medium'
      });
    }
    
    // Default recommendations
    if (recommendations.length === 0 && isRecording) {
      recommendations.push({
        type: 'tip',
        icon: Lightbulb,
        title: 'Active Listening',
        message: 'Maintain active listening and ask clarifying questions to better understand the customer.',
        priority: 'low'
      });
    }
    
    return recommendations;
  };

  const recommendations = getCoachingRecommendations();

  const getAlertVariant = (type: string) => {
    switch (type) {
      case 'warning': return 'destructive';
      case 'success': return 'default';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500/10 text-red-300 border-red-500/30';
      case 'medium': return 'bg-yellow-500/10 text-yellow-300 border-yellow-500/30';
      case 'low': return 'bg-green-500/10 text-green-300 border-green-500/30';
      default: return 'bg-blue-500/10 text-blue-300 border-blue-500/30';
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex-shrink-0">
        <CardTitle className="flex items-center">
          <Lightbulb className="mr-2 h-5 w-5" />
          AI Coaching
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto space-y-4 p-4">
        <ScrollArea className="h-full">
          {!isRecording ? (
            coachingTips && coachingTips.length > 0 ? (
              <div>
                <h3 className="font-medium mb-2">AI Coaching Tips</h3>
                <ul className="list-disc pl-5">
                  {coachingTips.map((tip, idx) => (
                    <li key={idx} className="mb-1">
                      {tip.tip} 
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <Heart className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                <p>Start a conversation to receive AI-powered coaching tips...</p>
              </div>
            )
          ) : (
            <>
              {/* Current Status */}
              <div className="bg-muted/50 rounded-lg p-4">
                <h3 className="font-medium mb-2">Current Status</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Conversation Health:</span>
                    <Badge className={getPriorityColor(
                      sentiment.type === 'positive' ? 'low' : 
                      sentiment.type === 'negative' ? 'high' : 'medium'
                    )}>
                      {sentiment.type === 'positive' ? 'Excellent' : 
                        sentiment.type === 'negative' ? 'Needs Attention' : 'Good'}
                    </Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Engagement Level:</span>
                    <Badge className={getPriorityColor(
                      wordCount > 100 ? 'low' : wordCount > 50 ? 'medium' : 'high'
                    )}>
                      {wordCount > 100 ? 'High' : wordCount > 50 ? 'Medium' : 'Low'}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Recommendations */}
              <div className="space-y-3">
                {recommendations.map((rec, index) => {
                  const IconComponent = rec.icon;
                  return (
                    <Alert key={index} variant={getAlertVariant(rec.type)}>
                      <IconComponent className="h-4 w-4" />
                      <AlertDescription>
                        <div className="mb-1">
                          <span className="font-medium">{rec.title}</span>
                          <Badge className={`ml-2 text-xs ${getPriorityColor(rec.priority)}`}>
                            {rec.priority}
                          </Badge>
                        </div>
                        <p className="text-sm">{rec.message}</p>
                      </AlertDescription>
                    </Alert>
                  );
                })}
              </div>

              {/* Quick Tips */}
            </>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default CoachingPanel;
