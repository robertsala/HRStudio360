import React, { useEffect, useState } from 'react';

interface SparkleAnimationProps {
  show: boolean;
  color?: string;
}

interface Sparkle {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
}

const SparkleAnimation: React.FC<SparkleAnimationProps> = ({ show, color = '#FFD700' }) => {
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);

  useEffect(() => {
    if (show) {
      const newSparkles: Sparkle[] = [];

      for (let i = 0; i < 40; i++) {
        newSparkles.push({
          id: i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          size: 4 + Math.random() * 8,
          delay: Math.random() * 2,
          duration: 1 + Math.random() * 1.5
        });
      }

      setSparkles(newSparkles);
    } else {
      setSparkles([]);
    }
  }, [show]);

  if (!show || sparkles.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 999996 }}>
      {sparkles.map((sparkle) => (
        <div
          key={sparkle.id}
          className="absolute"
          style={{
            left: `${sparkle.x}%`,
            top: `${sparkle.y}%`,
            animation: `twinkle ${sparkle.duration}s ease-in-out ${sparkle.delay}s infinite`
          }}
        >
          <div
            style={{
              width: `${sparkle.size}px`,
              height: `${sparkle.size}px`,
              position: 'relative'
            }}
          >
            <div
              className="absolute inset-0"
              style={{
                background: color,
                clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
                filter: 'blur(0.5px)'
              }}
            />
          </div>
        </div>
      ))}
      <style>{`
        @keyframes twinkle {
          0%, 100% {
            opacity: 0;
            transform: scale(0) rotate(0deg);
          }
          50% {
            opacity: 1;
            transform: scale(1) rotate(180deg);
          }
        }
      `}</style>
    </div>
  );
};

export default SparkleAnimation;
