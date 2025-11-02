import React, { useEffect, useState } from 'react';

interface ConfettiAnimationProps {
  show: boolean;
  onComplete?: () => void;
}

interface Confetti {
  id: number;
  x: number;
  y: number;
  rotation: number;
  speed: number;
  color: string;
  size: number;
  drift: number;
  delay: number;
}

const ConfettiAnimation: React.FC<ConfettiAnimationProps> = ({ show, onComplete }) => {
  const [confetti, setConfetti] = useState<Confetti[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show) {
      console.log('🎉 Confetti triggered!');
      setIsVisible(true);
      const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];
      const particles: Confetti[] = [];

      for (let i = 0; i < 150; i++) {
        particles.push({
          id: i,
          x: Math.random() * 100,
          y: -20,
          rotation: Math.random() * 360,
          speed: 2.5 + Math.random() * 2.5,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: 10 + Math.random() * 6,
          drift: (Math.random() - 0.5) * 50,
          delay: Math.random() * 0.3
        });
      }

      setConfetti(particles);
      console.log(`Generated ${particles.length} confetti particles`);

      const timeout = setTimeout(() => {
        console.log('Confetti animation complete');
        setConfetti([]);
        setIsVisible(false);
        if (onComplete) onComplete();
      }, 5000);

      return () => clearTimeout(timeout);
    } else {
      setIsVisible(false);
      setConfetti([]);
    }
  }, [show, onComplete]);

  if (!isVisible) return null;

  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: 999999 }}
    >
      {confetti.map((piece) => (
        <div
          key={piece.id}
          className="absolute"
          style={{
            left: `${piece.x}%`,
            top: `${piece.y}%`,
            width: `${piece.size}px`,
            height: `${piece.size}px`,
            backgroundColor: piece.color,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
            transform: `rotate(${piece.rotation}deg)`,
            animation: `confetti-fall-${piece.id} ${piece.speed}s ease-in forwards`,
            animationDelay: `${piece.delay}s`,
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
          }}
        />
      ))}
      <style>{`
        ${confetti.map((piece) => `
          @keyframes confetti-fall-${piece.id} {
            0% {
              transform: translateY(0) translateX(0) rotate(${piece.rotation}deg);
              opacity: 1;
            }
            100% {
              transform: translateY(120vh) translateX(${piece.drift}px) rotate(${piece.rotation + 720}deg);
              opacity: 0;
            }
          }
        `).join('\n')}
      `}</style>
    </div>
  );
};

export default ConfettiAnimation;
