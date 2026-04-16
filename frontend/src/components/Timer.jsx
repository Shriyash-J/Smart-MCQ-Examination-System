import React, { useState, useEffect } from 'react';

const Timer = ({ duration, onTimeUp }) => {
  const [seconds, setSeconds] = useState(duration * 60);
  const percentage = (seconds / (duration * 60)) * 100;

  useEffect(() => {
    if (seconds <= 0) {
      onTimeUp();
      return;
    }
    const interval = setInterval(() => setSeconds(prev => prev - 1), 1000);
    return () => clearInterval(interval);
  }, [seconds, onTimeUp]);

  const formatTime = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getColor = () => {
    if (percentage > 50) return '#06d6a0';
    if (percentage > 20) return '#ffd166';
    return '#ef476f';
  };

  return (
    <div className="relative w-20 h-20">
      <svg className="w-full h-full" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="45" fill="none" stroke="#e2e8f0" strokeWidth="8" />
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke={getColor()}
          strokeWidth="8"
          strokeDasharray={`${(percentage / 100) * 283} 283`}
          strokeLinecap="round"
          transform="rotate(-90 50 50)"
          className="transition-all duration-1000"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-mono font-bold text-gray-700">
        {formatTime(seconds)}
      </span>
    </div>
  );
};

export default Timer;