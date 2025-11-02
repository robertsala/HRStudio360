import React, { useState, useEffect } from 'react';

interface DigitalClockProps {
  format?: '12' | '24';
  className?: string;
}

const DigitalClock: React.FC<DigitalClockProps> = ({ format = '12', className = '' }) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = () => {
    let hours = time.getHours();
    const minutes = time.getMinutes();
    const seconds = time.getSeconds();
    let period = '';

    if (format === '12') {
      period = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
    }

    const paddedHours = String(hours).padStart(2, '0');
    const paddedMinutes = String(minutes).padStart(2, '0');
    const paddedSeconds = String(seconds).padStart(2, '0');

    return { paddedHours, paddedMinutes, paddedSeconds, period };
  };

  const { paddedHours, paddedMinutes, paddedSeconds, period } = formatTime();
  const showColon = time.getSeconds() % 2 === 0;

  return (
    <div className={`flex items-center justify-end ${className}`}>
      <div className="flex items-center gap-1 font-mono text-2xl font-semibold tracking-wide">
        <span className="text-gray-900 dark:text-white">
          {paddedHours}
        </span>
        <span className={`text-gray-500 dark:text-gray-400 transition-opacity duration-500 ${showColon ? 'opacity-100' : 'opacity-30'}`}>
          :
        </span>
        <span className="text-gray-900 dark:text-white">
          {paddedMinutes}
        </span>
        <span className={`text-gray-500 dark:text-gray-400 transition-opacity duration-500 ${showColon ? 'opacity-100' : 'opacity-30'}`}>
          :
        </span>
        <span className="text-gray-900 dark:text-white">
          {paddedSeconds}
        </span>
        {format === '12' && (
          <span className="ml-2 text-sm font-semibold text-gray-600 dark:text-gray-400">
            {period}
          </span>
        )}
      </div>
    </div>
  );
};

export default DigitalClock;
