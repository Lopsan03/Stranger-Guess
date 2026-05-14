import { useEffect, useState } from 'react';

interface CountdownTimerProps {
  seconds: number;
  onComplete?: () => void;
  size?: 'sm' | 'md' | 'lg';
}

export default function CountdownTimer({ seconds, onComplete, size = 'md' }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState(seconds);
  const totalSeconds = seconds;

  useEffect(() => {
    if (timeLeft <= 0) {
      onComplete?.();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, onComplete]);

  const sizes = {
    sm: { diameter: 40, stroke: 3, fontSize: 'text-xs' },
    md: { diameter: 80, stroke: 6, fontSize: 'text-xl' },
    lg: { diameter: 120, stroke: 8, fontSize: 'text-3xl' },
  };

  const { diameter, stroke, fontSize } = sizes[size];
  const radius = (diameter - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (timeLeft / totalSeconds) * circumference;

  const getColor = () => {
    const percentage = (timeLeft / totalSeconds) * 100;
    if (percentage > 50) return 'stroke-green-500';
    if (percentage > 25) return 'stroke-yellow-500';
    return 'stroke-red-500';
  };

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={diameter} height={diameter} className="-rotate-90">
        <circle
          cx={diameter / 2}
          cy={diameter / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={stroke}
          fill="transparent"
          className="text-white/10"
        />
        <circle
          cx={diameter / 2}
          cy={diameter / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={stroke}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={cn("transition-all duration-1000", getColor())}
        />
      </svg>
      <span className={cn("absolute font-display text-white", fontSize)}>
        {timeLeft}
      </span>
    </div>
  );
}

import { cn } from '@/src/lib/utils';
