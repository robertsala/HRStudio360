import React, { useEffect, useState } from 'react';

interface BalloonAnimationProps {
  show: boolean;
  count?: number;
}

interface Balloon {
  id: number;
  x: number;
  delay: number;
  duration: number;
  color: string;
  size: number;
  sway: number;
}

const BalloonAnimation: React.FC<BalloonAnimationProps> = ({ show, count = 20 }) => {
  const [balloons, setBalloons] = useState<Balloon[]>([]);

  useEffect(() => {
    if (show) {
      const colors = ['#FF6B9D', '#4ECDC4', '#FFE66D', '#A8E6CF', '#FF8B94', '#C7CEEA', '#FFDAC1'];
      const newBalloons: Balloon[] = [];

      for (let i = 0; i < count; i++) {
        newBalloons.push({
          id: i,
          x: Math.random() * 90 + 5,
          delay: Math.random() * 2,
          duration: 8 + Math.random() * 4,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: 60 + Math.random() * 40,
          sway: (Math.random() - 0.5) * 40
        });
      }

      setBalloons(newBalloons);
    } else {
      setBalloons([]);
    }
  }, [show, count]);

  if (!show || balloons.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 999998 }}>
      {balloons.map((balloon) => (
        <div
          key={balloon.id}
          className="absolute"
          style={{
            left: `${balloon.x}%`,
            bottom: '-120px',
            animation: `float-up-${balloon.id} ${balloon.duration}s ease-out ${balloon.delay}s`,
            animationFillMode: 'forwards'
          }}
        >
          <div className="relative">
            <div
              className="rounded-full shadow-lg"
              style={{
                width: `${balloon.size}px`,
                height: `${balloon.size * 1.2}px`,
                backgroundColor: balloon.color,
                animation: `sway-${balloon.id} 3s ease-in-out infinite`
              }}
            >
              <div
                className="absolute bottom-0 left-1/2 transform -translate-x-1/2"
                style={{
                  width: '2px',
                  height: `${balloon.size * 0.4}px`,
                  backgroundColor: '#8B7355'
                }}
              />
              <div
                className="absolute top-1/4 left-1/4 rounded-full opacity-30"
                style={{
                  width: `${balloon.size * 0.3}px`,
                  height: `${balloon.size * 0.35}px`,
                  backgroundColor: 'white'
                }}
              />
            </div>
          </div>
        </div>
      ))}
      <style>{`
        ${balloons.map((balloon) => `
          @keyframes float-up-${balloon.id} {
            0% {
              transform: translateY(0) translateX(0);
              opacity: 0;
            }
            10% {
              opacity: 1;
            }
            90% {
              opacity: 1;
            }
            100% {
              transform: translateY(-120vh) translateX(${balloon.sway}px);
              opacity: 0;
            }
          }
          @keyframes sway-${balloon.id} {
            0%, 100% {
              transform: rotate(-5deg);
            }
            50% {
              transform: rotate(5deg);
            }
          }
        `).join('\n')}
      `}</style>
    </div>
  );
};

export default BalloonAnimation;
