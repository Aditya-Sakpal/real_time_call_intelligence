import React, { useMemo } from 'react';

interface WordCloudProps {
  transcription: Array<{
    id: string;
    text: string;
    timestamp: number;
    speaker: 'user' | 'agent';
  }>;
}

const WordCloud: React.FC<WordCloudProps> = ({ transcription }) => {
  const wordFrequency = useMemo(() => {
    const words: { [key: string]: number } = {};
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'can', 'may', 'might', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'my', 'your', 'his', 'her', 'its', 'our', 'their']);

    transcription.forEach(entry => {
      const words_array = entry.text.toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(word => word.length > 3 && !stopWords.has(word));

      words_array.forEach(word => {
        words[word] = (words[word] || 0) + 1;
      });
    });

    return Object.entries(words)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 20)
      .map(([word, count]) => ({ word, count }));
  }, [transcription]);

  const maxCount = wordFrequency[0]?.count || 1;

  const getFontSize = (count: number) => {
    const minSize = 12;
    const maxSize = 32;
    return minSize + (count / maxCount) * (maxSize - minSize);
  };

  const getColor = (index: number) => {
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'];
    return colors[index % colors.length];
  };

  if (wordFrequency.length === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center text-muted-foreground">
        <p>Start speaking to see key words...</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full p-2 flex flex-wrap items-center justify-center gap-2 overflow-hidden">
      {wordFrequency.map(({ word, count }, index) => (
        <span
          key={word}
          className="font-semibold cursor-default transition-transform hover:scale-110"
          style={{
            fontSize: `${getFontSize(count)}px`,
            color: getColor(index)
          }}
          title={`${word} (${count} times)`}
        >
          {word}
        </span>
      ))}
    </div>
  );
};

export default WordCloud;