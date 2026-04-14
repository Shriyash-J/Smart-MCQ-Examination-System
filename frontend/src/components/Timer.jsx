import React, { useState, useEffect } from 'react';

const Timer = ({ duration, onTimeUp }) => {
  const [seconds, setSeconds] = useState(duration * 60);

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

  return <div className="text-2xl font-mono font-bold text-red-600">{formatTime(seconds)}</div>;
};

export default Timer;