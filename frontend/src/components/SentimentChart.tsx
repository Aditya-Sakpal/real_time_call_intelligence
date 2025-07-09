
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface SentimentData {
  timestamp: number;
  positive: number;
  neutral: number;
  negative: number;
}

interface SentimentChartProps {
  sentimentHistory: SentimentData[];
}

const SentimentChart: React.FC<SentimentChartProps> = ({ sentimentHistory }) => {
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour12: false, 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  return (
    <div className="h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={sentimentHistory} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="timestamp" 
            tickFormatter={formatTime}
            stroke="#666"
            fontSize={12}
          />
          <YAxis 
            domain={[0, 1]} 
            stroke="#666"
            fontSize={12}
          />
          <Tooltip 
            labelFormatter={(label) => formatTime(Number(label))}
            formatter={(value: number, name: string) => [
              `${Math.round(value * 100)}%`, 
              name.charAt(0).toUpperCase() + name.slice(1)
            ]}
          />
          <Line 
            type="monotone" 
            dataKey="positive" 
            stroke="#10b981" 
            strokeWidth={2}
            dot={false}
            name="positive"
          />
          <Line 
            type="monotone" 
            dataKey="neutral" 
            stroke="#f59e0b" 
            strokeWidth={2}
            dot={false}
            name="neutral"
          />
          <Line 
            type="monotone" 
            dataKey="negative" 
            stroke="#ef4444" 
            strokeWidth={2}
            dot={false}
            name="negative"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SentimentChart;
