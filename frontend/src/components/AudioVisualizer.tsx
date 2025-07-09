
import React from 'react';

interface AudioVisualizerProps {
  audioLevel: number;
  isRecording: boolean;
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ audioLevel, isRecording }) => {
  const bars = Array.from({ length: 5 }, (_, i) => {
    const height = Math.max(4, (audioLevel * 40) * (1 - i * 0.15));
    return height;
  });

  return (
    <div className="flex items-end space-x-1 h-6">
      {bars.map((height, index) => (
        <div
          key={index}
          className={`w-1 rounded-full transition-all duration-150 ${
            isRecording ? 'bg-blue-500' : 'bg-gray-300'
          }`}
          style={{ 
            height: `${height}px`,
            animation: isRecording ? `pulse 0.${3 + index}s ease-in-out infinite alternate` : 'none'
          }}
        />
      ))}
      
      <style>{`
        @keyframes pulse {
          from { opacity: 0.7; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default AudioVisualizer;
